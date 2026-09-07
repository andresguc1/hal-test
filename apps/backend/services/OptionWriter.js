/**
 * OptionWriter
 *
 * High-level orchestrator that delegates to InteractionStrategy implementations.
 * Handles diff logic (NO_CHANGE/CHECK/UNCHECK/SELECT) and evidence collection,
 * while strategies handle the actual Playwright interactions per component type.
 */

import { getStrategy } from './InteractionStrategy.js';
import './strategies/index.js';

const ACTION_NO_CHANGE = 'NO_CHANGE';
const ACTION_CHECK = 'CHECK';
const ACTION_UNCHECK = 'UNCHECK';
const ACTION_SELECT = 'SELECT';
const VALID_ACTIONS = new Set([ACTION_NO_CHANGE, ACTION_CHECK, ACTION_UNCHECK, ACTION_SELECT]);

function normalizeAction(action) {
    const a = String(action || '')
        .toUpperCase()
        .trim();
    return VALID_ACTIONS.has(a) ? a : ACTION_CHECK;
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

const stateLabel = (state) =>
    state === true ? 'Checked' : state === false ? 'Unchecked' : 'Unknown';

/**
 * Executes selection actions using the appropriate strategy for the detected group type.
 *
 * @param {import('playwright').Page} page
 * @param {Object} params
 * @param {string} params.containerSelector
 * @param {Object[]} params.selectedOptions - User configured actions [{label, value, action}]
 * @param {Object[]} params.options - All detected options from discovery
 * @param {number} [params.timeout=30000]
 * @param {boolean} [params.verify=true]
 * @param {boolean} [params.menuOpen=false] - Whether menu is already open
 * @returns {Promise<{applied: Object[], evidence: Object[], actionCount: number, optionCount: number}>}
 */
export async function writeOptions(
    page,
    {
        containerSelector,
        selectedOptions,
        options,
        timeout = 30000,
        verify = true,
        menuOpen = false,
    },
) {
    const selections = Array.isArray(selectedOptions) ? selectedOptions : [];
    const allOptions = Array.isArray(options) ? options : [];

    if (selections.length === 0) {
        return { applied: [], evidence: [], optionCount: allOptions.length, actionCount: 0 };
    }

    if (!allOptions.length) {
        throw new Error('No detected options available for selection');
    }

    const groupType = allOptions[0]?.groupType || determineGroupType(allOptions);
    const strategy = getStrategy(groupType);

    const actions = new Map();
    for (const sel of selections) {
        if (!sel) continue;
        const key = String(sel.label ?? sel.value).toLowerCase();
        if (!key || actions.has(key)) continue;
        actions.set(key, normalizeAction(sel.action));
    }

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

    const ctx = {
        page,
        containerSelector,
        selectedOptions: selections,
        detectedOptions: allOptions,
        timeout,
        menuOpen,
    };

    let result;
    try {
        result = await strategy.execute(ctx);
    } catch (err) {
        throw new Error(`Strategy "${groupType}" execution failed: ${err.message}`);
    }

    if (verify && result.evidence) {
        const verifiedOptions = await strategy.verify(ctx);
        result.evidence = result.evidence.map((ev) => {
            // Skip verification for actions that were already in desired state (no interaction performed)
            if (ev.message && ev.message.includes('Already in desired state')) {
                return ev;
            }
            const verified = verifiedOptions.find(
                (o) => o.label === ev.label && o.value === ev.value,
            );
            if (verified && verified._verified && verified._verifiedState !== null) {
                const targetState = ev.action === ACTION_CHECK || ev.action === ACTION_SELECT;
                const pass = verified._verifiedState === targetState;
                return {
                    ...ev,
                    after: stateLabel(verified._verifiedState),
                    result: pass ? 'PASS' : 'FAIL',
                    message: pass
                        ? null
                        : `Expected ${stateLabel(targetState)} but found ${stateLabel(verified._verifiedState)}.`,
                };
            }
            return ev;
        });
    }

    return {
        applied: result.applied || [],
        evidence: result.evidence || [],
        actionCount: result.actionCount || 0,
        optionCount: result.optionCount || allOptions.length,
    };
}

function determineGroupType(options) {
    const types = new Set(options.map((o) => o.type));
    // Handle canonical types from ComponentClassifier
    if (types.has('native_select') || types.has('native_select_multi')) {
        return types.has('native_select_multi') ? 'select-multi' : 'select';
    }
    if (types.has('radio') || types.has('aria_radio')) return 'radio-group';
    if (types.has('checkbox') || types.has('aria_checkbox')) return 'checkbox-group';
    if (types.has('aria_option')) return 'listbox';
    if (types.has('list_item')) return 'list';
    if (types.has('custom_component')) return 'custom';
    // Handle legacy type names from older tests
    if (types.has('select') || types.has('select-multi')) {
        return types.has('select-multi') ? 'select-multi' : 'select';
    }
    if (types.has('list')) return 'list';
    if (types.has('checkbox')) return 'checkbox-group';
    if (types.has('radio')) return 'radio-group';
    return 'unknown';
}

export default { writeOptions };
