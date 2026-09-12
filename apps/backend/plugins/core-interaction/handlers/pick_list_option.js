import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

const OPTION_CSS = 'role=option, [role="option"], li, div[data-option]';

/**
 * Clicks an item inside a custom dropdown / combobox / listbox / context menu.
 *
 * `selector` is the trigger (or the visible container). If `expandMenu` is
 * enabled (default), the trigger is clicked first and the handler waits for the
 * first option to become visible instead of relying on a fixed sleep (animated
 * / virtualized menus). The option is located by exact text (`optionText`) or
 * by numeric position (`optionIndex`) and clicked.
 *
 * When the menu renders its options outside the trigger (portal / overlay,
 * virtualized lists), a `menuSelector` pointing at the visible panel can be
 * provided; otherwise the options are searched inside the trigger container.
 *
 * After the click the handler performs a soft verification (menu closed or
 * trigger collapsed) and records `verified`/`menuClosed` in the result.
 */
const clickOption = async (opt, runOptions) => {
    // Options in scrolling/virtualized lists may be off-viewport.
    await opt.scrollIntoViewIfNeeded().catch(() => {});
    try {
        await opt.click(runOptions);
    } catch {
        // Single mechanical retry: the node may have been re-painted by a
        // virtualizer between waitFor and click. Re-clicking the *same* option
        // is NOT idempotent, so we never retry a successful click.
        await opt.scrollIntoViewIfNeeded().catch(() => {});
        await opt.click({ ...runOptions, force: true });
    }
};

const pickListOption = (req, res) =>
    executePlaywrightAction(req, res, 'pick_list_option', async (page, opts) => {
        const { selector, optionText, optionIndex, expandMenu } = opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const hasText =
            optionText !== undefined && optionText !== null && String(optionText).trim() !== '';
        const parsedIndex = Number(optionIndex);
        const hasIndex =
            optionIndex !== undefined &&
            optionIndex !== null &&
            Number.isInteger(parsedIndex) &&
            parsedIndex >= 0;

        if (!hasText && !hasIndex) {
            throw new Error(req.t('errors.pick_option_required'));
        }

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const runOptions = playTimeout(timeout);
        const containerLocator = buildPlaywrightLocator(page, targetSelector).first();

        await containerLocator.waitFor({ state: 'attached', ...playTimeout(timeout) });

        // Options scope: the visible panel when a menuSelector is provided,
        // otherwise the trigger/container itself.
        const menuTarget = opts.menuSelector && String(opts.menuSelector).trim();
        const scope = menuTarget
            ? buildPlaywrightLocator(
                  page,
                  await normalizeSelectorForDotId(page, menuTarget),
              ).first()
            : containerLocator;

        const shouldExpand = expandMenu !== false;
        let menuOpened = false;

        // Expand the trigger first: for links/buttons this navigates to or
        // reveals the page/panel holding the options, for comboboxes it opens
        // the listbox, and for native <select> it is a harmless focus click.
        if (shouldExpand) {
            const isExpanded =
                (await containerLocator.getAttribute('aria-expanded').catch(() => 'false')) ===
                'true';
            if (!isExpanded) {
                await containerLocator.click(runOptions).catch(() => {});
                menuOpened = true;
            }
        }

        // Now that the target page/panel is observable, detect a native
        // <select>: its OS-level popup cannot be driven through DOM clicks and
        // its <option> nodes are not interactable. Playwright's selectOption()
        // is the only reliable path.
        const scopeIsNativeSelect = await scope
            .evaluate((el) => el.tagName?.toUpperCase() === 'SELECT')
            .catch(() => false);

        if (scopeIsNativeSelect) {
            await scope.waitFor({ state: 'attached', ...playTimeout(timeout) });
            const text = String(optionText).trim();
            try {
                if (hasIndex) {
                    await scope.selectOption({ index: parsedIndex });
                } else {
                    await scope.selectOption({ label: text });
                }
            } catch {
                const err = new Error(
                    `Option not found in native <select> "${targetSelector}": ${
                        hasIndex ? `index ${parsedIndex}` : `label "${text}"`
                    }`,
                );
                err.status = 400;
                throw err;
            }
            const selected = hasIndex ? `#${parsedIndex}` : text;
            return {
                message: req.t('actions.pick_list_option.success', { option: selected }),
                data: {
                    selected,
                    menuOpened,
                    menuClosed: true,
                    verified: true,
                    native: true,
                },
                traceDetails: {
                    selector: targetSelector,
                    menuSelector: menuTarget || undefined,
                    optionText: hasText ? text : undefined,
                    optionIndex: hasIndex ? parsedIndex : undefined,
                    native: true,
                    menuOpened,
                },
            };
        }

        const optionList = scope.locator(OPTION_CSS);
        let opt;
        if (hasIndex) {
            opt = optionList.nth(parsedIndex);
        } else {
            const text = String(optionText).trim();
            opt = optionList.getByText(text, { exact: true }).first();
        }

        // Wait for the option (not a fixed sleep) — covers animations, portals
        // and lazy-rendered / virtualized lists.
        if (menuOpened) {
            await optionList
                .first()
                .waitFor({ state: 'visible', ...playTimeout(timeout) })
                .catch(() => {
                    const err = new Error(
                        `Menu did not open after clicking "${targetSelector}". Check the trigger or provide a "menuSelector" pointing at the visible options panel.`,
                    );
                    err.status = 400;
                    throw err;
                });
        }
        await opt.waitFor({ state: 'visible', ...playTimeout(timeout) });

        await clickOption(opt, runOptions);

        // Soft verification: single-select menus close / collapse after picking.
        await page.waitForTimeout(120).catch(() => {});
        const optionStillVisible = await opt.isVisible().catch(() => false);
        const triggerExpanded = await containerLocator
            .getAttribute('aria-expanded')
            .catch(() => null);
        const menuClosed = !optionStillVisible || triggerExpanded === 'false';
        const selected = hasIndex ? `#${parsedIndex}` : String(optionText).trim();

        return {
            message: req.t('actions.pick_list_option.success', { option: selected }),
            data: { selected, menuOpened, menuClosed, verified: menuClosed },
            traceDetails: {
                selector: targetSelector,
                menuSelector: menuTarget || undefined,
                optionText: hasText ? String(optionText).trim() : undefined,
                optionIndex: hasIndex ? parsedIndex : undefined,
                menuOpened,
                menuClosed,
            },
        };
    });

export default pickListOption;
