import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
/* eslint-disable no-undef */

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
        const locator = targetSelector ? buildPlaywrightLocator(page, targetSelector) : null;

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

            return {
                message: req.t('actions.scroll.success', { status: finalStatus }),
                data: {
                    status: finalStatus,
                    attempts,
                    finalHeight: currentHeight,
                },
                traceDetails: { selector: targetSelector, scrollToEnd: true, attempts },
            };
        }

        if (locator) {
            await locator.scrollIntoViewIfNeeded();
            if (direction === 'up') {
                await page.evaluate(
                    (sel, amt) => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollBy({ top: -amt, behavior: 'smooth' });
                    },
                    targetSelector,
                    amount,
                );
            } else {
                await page.evaluate(
                    (sel, amt) => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollBy({ top: amt, behavior: 'smooth' });
                    },
                    targetSelector,
                    amount,
                );
            }
        } else if (x !== undefined && y !== undefined) {
            await page.mouse.wheel(x, y);
        } else if (direction === 'up') {
            await page.evaluate(() => window.scrollBy({ top: -amount, behavior }));
        } else {
            await page.evaluate(() => window.scrollBy({ top: amount, behavior }));
        }

        return {
            message: req.t('actions.scroll.success', { status: 'Scrolled' }),
            traceDetails: { selector: targetSelector, direction, amount },
        };
    });

export default scroll;
