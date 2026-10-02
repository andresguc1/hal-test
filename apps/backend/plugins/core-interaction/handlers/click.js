import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { clickContextMenuItem, dismissContextMenu } from '../../../core/menu-utils.js';
import { resolveTarget } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

const RIGHT_BUTTON = 'right';

const click = (req, res) =>
    executePlaywrightAction(req, res, 'click', async (page, opts) => {
        const { selector, button, clickCount, modifiers, force, contextMenuItem, clickOutside } =
            opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!selector) throw new Error(req.t('errors.selector_required'));

        // Use resolveTarget to properly prioritize Playwright locators from candidates
        const { locator, resolution } = await resolveTarget({
            page,
            target: { selector, candidates: opts.candidates },
            scope: 'element',
            timeout,
            signal: req.signal,
        });

        const clickOptions = { ...playTimeout(timeout), button, clickCount, modifiers, force };

        await locator.click(clickOptions);

        const traceDetails = {
            selector,
            resolution,
            candidates: opts.candidates,
            details: clickOptions,
        };

        if (button === RIGHT_BUTTON && (contextMenuItem || clickOutside)) {
            if (contextMenuItem) {
                const menu = await clickContextMenuItem(
                    page,
                    contextMenuItem,
                    playTimeout(timeout),
                );
                traceDetails.contextMenuItem = contextMenuItem;
                traceDetails.contextMenuStrategy = menu.strategy;
            }
            if (clickOutside) {
                const dismiss = await dismissContextMenu(page);
                traceDetails.clickOutside = {
                    dismissed: dismiss.dismissed,
                    hadMenu: dismiss.hadMenu,
                    visibleAfter: dismiss.visibleAfter,
                };
            }
        }

        return {
            message: req.t('actions.click.success', { selector }),
            traceDetails,
        };
    });

export default click;
