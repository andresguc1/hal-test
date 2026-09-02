/**
 * OptionWriter
 *
 * Applies a set of "actions" to a group of options on the page, using a
 * diff-based strategy. For each detected option it reads the CURRENT state from
 * the DOM, compares it with the DESIRED action (NO_CHANGE / CHECK / UNCHECK) and
 * only interacts when a real change is needed. After interacting it re-reads the
 * DOM to verify the outcome and reports per-option evidence.
 *
 * This avoids indiscriminate clicks (never toggles a control that already has the
 * desired state) and produces detailed PASS/FAIL evidence.
 */

import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../core/selector-utils.js';

const ACTION_NO_CHANGE = 'NO_CHANGE';
const ACTION_CHECK = 'CHECK';
const ACTION_UNCHECK = 'UNCHECK';
const VALID_ACTIONS = new Set([ACTION_NO_CHANGE, ACTION_CHECK, ACTION_UNCHECK]);

function normalizeAction(action) {
    const a = String(action || '')
        .toUpperCase()
        .trim();
    return VALID_ACTIONS.has(a) ? a : ACTION_CHECK; // legacy items default to CHECK
}

function findOption(options, selection) {
    if (!selection || typeof selection !== 'object') return null;
    const query = selection.label ?? selection.value;
    if (query === undefined || query === null || query === '') return null;
    const lower = String(query).toLowerCase();
    return (
        options.find((o) => o.label && String(o.label).toLowerCase() === lower) ||
        options.find((o) => o.value !== undefined && String(o.value).toLowerCase() === lower) ||
        options.find((o) => o.label && String(o.label).toLowerCase().includes(lower))
    );
}

function isCheckedState(opt) {
    if (opt.actualState) return Boolean(opt.actualState.checked);
    return Boolean(opt.checked || opt.selected);
}

async function buildTargetLocator(page, option, containerSelector, options) {
    if (option.locator) {
        try {
            if (containerSelector) {
                const container = await normalizeSelectorForDotId(page, containerSelector);
                const containerLocator = buildPlaywrightLocator(page, container).first();
                await containerLocator.waitFor({
                    state: 'attached',
                    timeout: options.timeout || 30000,
                });
                return containerLocator.locator(option.locator).first();
            }
            return buildPlaywrightLocator(page, option.locator).first();
        } catch (err) {
            // locator failed to resolve; fall through to container-based scan
        }
    }
    // Fallback: build a locator from the container + option index/type
    if (containerSelector) {
        const container = await normalizeSelectorForDotId(page, containerSelector);
        const containerLocator = buildPlaywrightLocator(page, container).first();
        await containerLocator.waitFor({ state: 'attached', timeout: options.timeout || 30000 });
        const count = option.index ?? 0;
        if (option.type === 'select') {
            return containerLocator.locator('select option').nth(count);
        }
        if (option.type === 'checkbox' || option.type === 'radio') {
            return containerLocator.locator(`input[type="${option.type}"]`).nth(count);
        }
        return containerLocator.locator('*').nth(count);
    }
    return null;
}

/**
 * Performs a single interaction on an already-resolved locator for the given
 * option + desired action. Returns true if any DOM mutation was requested.
 */
async function interact(page, target, option, action, runOptions) {
    const selectParent = (loc) => loc.locator('xpath=ancestor::select').first();
    const isSelect = option.type === 'select' || option.type === 'select-multi';

    if (isSelect) {
        // Resolve to the parent <select> (we detect <option> elements).
        let selectLocator = target;
        try {
            const candidate = selectParent(target);
            if ((await candidate.count()) > 0) selectLocator = candidate;
        } catch {
            /* keep target */
        }
        if (action === ACTION_UNCHECK) {
            throw new Error(
                `UNCHECK is not supported for the <select> option "${option.label}". Use CHECK to choose a different option.`,
            );
        }
        const values = {
            label: String(option.label),
        };
        await selectLocator.selectOption(values, runOptions).catch(async () => {
            await selectLocator.selectOption({ value: String(option.value) }, runOptions);
        });
        return true;
    }

    if (action === ACTION_UNCHECK) {
        if (option.type === 'radio') {
            throw new Error(
                `UNCHECK is not supported for the radio option "${option.label}". Radio options are mutually exclusive and are cleared by checking another option.`,
            );
        }
        try {
            await target.uncheck(runOptions);
            return true;
        } catch (err) {
            // Fall back to a click for custom/ARIA controls that don't support uncheck().
            await target.click(runOptions);
            return true;
        }
    }

    // CHECK
    switch (option.type) {
        case 'checkbox':
        case 'radio':
            await target.check(runOptions);
            break;
        case 'list':
        case 'checkbox-role':
        case 'radio-role':
        case 'option-role':
        case 'list-option':
        default:
            await target.click(runOptions);
            break;
    }
    return true;
}

/**
 * Reads the post-interaction checked/selected state of an option from the DOM.
 * Returns a boolean or null when it cannot be determined.
 */
async function readState(page, option, containerSelector, timeout) {
    try {
        const target = await buildTargetLocator(page, option, containerSelector, { timeout });
        if (!target) return null;
        if (option.type === 'select' || option.type === 'select-multi') {
            try {
                return await target.evaluate((el) => el.selected);
            } catch {
                return null;
            }
        }
        if (option.type === 'checkbox' || option.type === 'radio') {
            try {
                return await target.isChecked();
            } catch {
                return null;
            }
        }
        // ARIA / custom
        try {
            return await target.evaluate((el) => {
                if (el.matches('input[type="checkbox"], input[type="radio"]')) return el.checked;
                const ariaChecked = el.getAttribute('aria-checked');
                if (ariaChecked !== null) return ariaChecked === 'true';
                const ariaSelected = el.getAttribute('aria-selected');
                if (ariaSelected !== null) return ariaSelected === 'true';
                return (
                    el.classList.contains('selected') ||
                    el.classList.contains('active') ||
                    el.classList.contains('is-selected')
                );
            });
        } catch {
            return null;
        }
    } catch {
        return null;
    }
}

const stateLabel = (state) =>
    state === true ? 'Checked' : state === false ? 'Unchecked' : 'Unknown';

export async function writeOptions(
    page,
    { containerSelector, selectedOptions, options, timeout = 30000, verify = true },
) {
    const runOptions = { timeout };
    const selections = Array.isArray(selectedOptions) ? selectedOptions : [];
    const allOptions = Array.isArray(options) ? options : [];

    if (selections.length === 0) {
        return { applied: [], evidence: [], optionCount: allOptions.length, actionCount: 0 };
    }

    // Normalize desired actions, keyed by the option identity (label/value).
    const actions = new Map();
    for (const sel of selections) {
        if (!sel) continue;
        const key = String(sel.label ?? sel.value).toLowerCase();
        if (!key || actions.has(key)) continue;
        actions.set(key, normalizeAction(sel.action));
    }

    // Validate that every requested selection maps to a detected option.
    for (const sel of selections) {
        if (!sel) continue;
        if (!findOption(allOptions, sel)) {
            const available = allOptions.map((o) => o.label || o.value).filter(Boolean);
            throw new Error(
                `Option "${sel.label || sel.value}" does not exist. Available options: ${
                    available.length ? available.join(', ') : 'none detected'
                }.`,
            );
        }
    }

    const evidence = [];
    const applied = [];
    let appliedCount = 0;

    // Phase 1: execute required interactions (diff strategy).
    for (const option of allOptions) {
        const key = String(option.label ?? option.value).toLowerCase();
        const action = actions.get(key) || ACTION_NO_CHANGE;
        if (action === ACTION_NO_CHANGE) continue;

        const isSelect = option.type === 'select' || option.type === 'select-multi';
        // Reject unsupported UNCHECK semantics up front with a specific error.
        if (action === ACTION_UNCHECK) {
            if (isSelect) {
                throw new Error(
                    `UNCHECK is not supported for the <select> option "${option.label}". Use CHECK to choose a different option.`,
                );
            }
            if (option.type === 'radio' || option.type === 'radio-role') {
                throw new Error(
                    `UNCHECK is not supported for the radio option "${option.label}". Radio options are mutually exclusive and are cleared by checking another option.`,
                );
            }
        }

        const before = isCheckedState(option);

        // Skip when the current state already matches the desired outcome.
        if (action === ACTION_CHECK && before === true) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: stateLabel(before),
                action,
                after: stateLabel(before),
                result: 'PASS',
                message: 'Already in desired state. No interaction performed.',
            });
            continue;
        }
        if (action === ACTION_UNCHECK && before === false) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: stateLabel(before),
                action,
                after: stateLabel(before),
                result: 'PASS',
                message: 'Already in desired state. No interaction performed.',
            });
            continue;
        }

        if (option.enabled === false) {
            throw new Error(`Option "${option.label}" is disabled and cannot be selected.`);
        }
        if (option.visible === false) {
            throw new Error(`Option "${option.label}" is hidden and cannot be interacted with.`);
        }

        const target = await buildTargetLocator(page, option, containerSelector, { timeout });
        if (!target) {
            throw new Error(`Could not resolve a locator for option "${option.label}".`);
        }

        try {
            await interact(page, target, option, action, runOptions);
        } catch (err) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: stateLabel(before),
                action,
                after: null,
                result: 'FAIL',
                message: err.message || 'Interaction failed.',
            });
            throw new Error(
                `Failed to apply ${action} to option "${option.label}": ${err.message}`,
            );
        }
        applied.push({
            label: option.label,
            value: option.value,
            type: option.type,
            action,
            selected: action === ACTION_CHECK,
        });
        appliedCount += 1;

        // Verification: re-read the DOM state after interacting.
        let after = null;
        if (verify) {
            if (typeof page.waitForTimeout === 'function') {
                await page.waitForTimeout(50).catch(() => {});
            }
            after = await readState(page, option, containerSelector, timeout);
        }
        const targetState = action === ACTION_CHECK;
        const pass = after === null || after === targetState;
        evidence.push({
            label: option.label,
            value: option.value,
            type: option.type,
            before: stateLabel(before),
            action,
            after: after === null ? stateLabel(after) : stateLabel(after),
            result: pass ? 'PASS' : 'FAIL',
            message: pass
                ? null
                : `Expected ${stateLabel(targetState)} but found ${stateLabel(after)}.`,
        });
    }

    return {
        applied,
        actionCount: appliedCount,
        evidence,
        optionCount: allOptions.length,
    };
}

export default { writeOptions };
