import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { clickContextMenuItem, dismissContextMenu } from '../../../core/menu-utils.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

const RIGHT_BUTTON = 'right';

const click = (req, res) =>
    executePlaywrightAction(req, res, 'click', async (page, opts) => {
        const { selector, button, clickCount, modifiers, force, contextMenuItem, clickOutside } =
            opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const clickOptions = { ...playTimeout(timeout), button, clickCount, modifiers, force };
        const locator = buildPlaywrightLocator(page, targetSelector);

        await locator.click(clickOptions);

        const traceDetails = { selector: targetSelector, details: clickOptions };

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
            message: req.t('actions.click.success', { selector: targetSelector }),
            traceDetails,
        };
    });

export default click;
