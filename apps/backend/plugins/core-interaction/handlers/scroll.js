import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
/* eslint-disable no-undef */

const SCROLLED = 'Scrolled';
const NOTHING_TO_SCROLL = 'Nothing to scroll (content fits the viewport)';

// Smooth scrolling animates asynchronously: give it time to settle before
// measuring the final position (otherwise screenshots/traces capture nothing).
const settleDelay = (behavior) => (behavior === 'smooth' ? 350 : 50);

const scroll = (req, res) =>
    executePlaywrightAction(req, res, 'scroll', async (page, opts) => {
        const {
            selector,
            direction = 'down',
            amount = 300,
            behavior = 'smooth',
            scrollToEnd = false,
            maxScrolls = 50,
            waitTime = 2000,
            x,
            y,
        } = opts;

        const targetSelector = selector ? await normalizeSelectorForDotId(page, selector) : null;
        let locator = targetSelector ? buildPlaywrightLocator(page, targetSelector) : null;
        const vertical = direction !== 'left' && direction !== 'right';

        // When the selected element has no scrollable overflow (e.g. a plain
        // <input> picked by mistake), scrolling it is a silent no-op. In that
        // case we fall back to scrolling the page so the user still sees
        // movement, and we report where we actually scrolled.
        let fallbackFrom = null;
        if (locator) {
            // Wait for the element to attach before probing: a late-rendering
            // target would otherwise make the probe throw, be read as "cannot
            // scroll", and silently fall back to scrolling the page instead of
            // the element the user selected.
            await locator.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
            const canScroll = await locator
                .evaluate((el) => ({
                    y: el.scrollHeight - el.clientHeight > 1,
                    x: el.scrollWidth - el.clientWidth > 1,
                }))
                .catch(() => null);
            if (vertical ? !canScroll?.y : !canScroll?.x) {
                console.log(
                    `[Scroll] Selector "${targetSelector}" has no scrollable overflow; falling back to the page`,
                );
                fallbackFrom = targetSelector;
                locator = null;
            }
        }

        if (scrollToEnd) {
            console.log('[Scroll] Infinite scroll mode enabled');
            let lastHeight = 0;
            let currentHeight = 0;
            let attempts = 0;

            if (locator) {
                await locator.waitFor({ state: 'attached', timeout: 5000 });
                currentHeight = await locator.evaluate((el) => el.scrollHeight);
            } else {
                currentHeight = await page.evaluate(() => document.body.scrollHeight);
            }

            while (attempts < maxScrolls && lastHeight !== currentHeight) {
                lastHeight = currentHeight;

                if (locator) {
                    await locator.evaluate((el, beh) => {
                        el.scrollTo({ top: el.scrollHeight, behavior: beh });
                    }, behavior);
                } else {
                    await page.evaluate((beh) => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: beh });
                    }, behavior);
                }

                await page.waitForTimeout(waitTime);

                if (locator) {
                    currentHeight = await locator.evaluate((el) => el.scrollHeight);
                } else {
                    currentHeight = await page.evaluate(() => document.body.scrollHeight);
                }

                attempts++;
                console.log(
                    `[Scroll] Attempt ${attempts}/${maxScrolls} - Height: ${currentHeight}`,
                );
            }

            const finalStatus =
                lastHeight === currentHeight ? 'Reached end' : 'Max attempts reached';
            const target = fallbackFrom ? 'the page' : targetSelector || 'the page';

            return {
                message: req.t('actions.scroll.success', {
                    target,
                    status: finalStatus,
                }),
                data: {
                    status: finalStatus,
                    attempts,
                    finalHeight: currentHeight,
                    target,
                    ...(fallbackFrom && { fallbackFrom }),
                },
                traceDetails: {
                    selector: targetSelector,
                    scrollToEnd: true,
                    attempts,
                    ...(fallbackFrom && { fallbackFrom }),
                },
            };
        }

        const finish = (scrolledPixels) => {
            const status = scrolledPixels !== 0 ? SCROLLED : NOTHING_TO_SCROLL;
            const target = fallbackFrom ? 'the page' : targetSelector || 'the page';
            return {
                message: req.t('actions.scroll.success', {
                    target,
                    status,
                }),
                data: {
                    status,
                    scrolledPixels,
                    target,
                    ...(fallbackFrom && { fallbackFrom }),
                },
                traceDetails: {
                    selector: targetSelector,
                    direction,
                    amount,
                    scrolledPixels,
                    ...(fallbackFrom && { fallbackFrom }),
                },
            };
        };

        if (locator) {
            await locator.scrollIntoViewIfNeeded();
            const before = await locator.evaluate((el) => ({
                y: el.scrollTop,
                x: el.scrollLeft,
            }));
            // Scroll via locator.evaluate (not page.evaluate + querySelector):
            // the selector may be a Playwright locator (getByRole/getByText/
            // chained) that document.querySelector cannot parse — it would
            // throw a SyntaxError and fail the whole node. The locator uses
            // the exact same resolution the overflow probe already validated.
            await locator.evaluate(
                (el, { amt, beh, dir }) => {
                    if (dir === 'left' || dir === 'right') {
                        el.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: beh });
                    } else {
                        el.scrollBy({ top: dir === 'up' ? -amt : amt, behavior: beh });
                    }
                },
                {
                    amt: amount,
                    beh: behavior,
                    dir: direction,
                },
            );
            await page.waitForTimeout(settleDelay(behavior));
            const after = await locator.evaluate((el) => ({
                y: el.scrollTop,
                x: el.scrollLeft,
            }));
            const scrolledPixels = vertical
                ? (after?.y ?? 0) - (before?.y ?? 0)
                : (after?.x ?? 0) - (before?.x ?? 0);
            return finish(scrolledPixels);
        }

        if (x !== undefined && y !== undefined) {
            await page.mouse.wheel(x, y);
            return finish(vertical ? y : x);
        }

        const before = await page.evaluate(() => ({
            y: window.scrollY,
            x: window.scrollX,
        }));
        await page.evaluate(
            ({ amt, beh, dir }) => {
                if (dir === 'left' || dir === 'right') {
                    window.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: beh });
                } else {
                    window.scrollBy({ top: dir === 'up' ? -amt : amt, behavior: beh });
                }
            },
            { amt: amount, beh: behavior, dir: direction },
        );
        await page.waitForTimeout(settleDelay(behavior));
        const after = await page.evaluate(() => ({
            y: window.scrollY,
            x: window.scrollX,
        }));
        const scrolledPixels = vertical
            ? (after?.y ?? 0) - (before?.y ?? 0)
            : (after?.x ?? 0) - (before?.x ?? 0);
        return finish(scrolledPixels);
    });

export default scroll;
