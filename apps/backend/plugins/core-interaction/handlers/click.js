import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { clickContextMenuItem, dismissContextMenu } from '../../../core/menu-utils.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const RIGHT_BUTTON = 'right';

const click = (req, res) =>
    executePlaywrightAction(req, res, 'click', async (page, opts) => {
        const { selector, button, clickCount, modifiers, force, contextMenuItem, clickOutside } =
            opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const clickOptions = { button, clickCount, modifiers, timeout, force };
        const locator = buildPlaywrightLocator(page, targetSelector);

        await locator.click(clickOptions);

        const traceDetails = { selector: targetSelector, details: clickOptions };

        if (button === RIGHT_BUTTON && (contextMenuItem || clickOutside)) {
            if (contextMenuItem) {
                const menu = await clickContextMenuItem(page, contextMenuItem, { timeout });
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
