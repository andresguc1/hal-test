import * as path from 'path';
import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const takeScreenshotAction = (req, res) =>
    executePlaywrightAction(req, res, 'take_screenshot', async (page, opts) => {
        const {
            selector,
            fullPage = false,
            path: savePath,
            format = 'png',
            quality = 100,
            timeout = 30000,
            enabled = true,
        } = opts;

        if (!enabled) {
            console.log(`[Screenshot] Node skipped because it is disabled.`);
            return {
                message: req.t('actions.take_screenshot.skipped', {
                    defaultValue: 'Captura de pantalla omitida (nodo deshabilitado)',
                }),
                data: {
                    skipped: true,
                },
                traceDetails: {
                    skipped: true,
                },
            };
        }

        // Playwright options configuration
        const screenshotOptions = {
            type: format,
            timeout: fullPage ? Math.max(timeout, 60000) : timeout, // 60s for fullPage
            animations: 'disabled', // Prevent crashes on high-motion sites
        };

        if (format === 'jpeg') {
            screenshotOptions.quality = quality;
        }

        // If NO selector, use fullPage (if requested)
        if (!selector) {
            screenshotOptions.fullPage = fullPage;
        }

        // Security validation for path (Path Traversal)
        if (savePath) {
            // Normalize and resolve absolute path
            const resolvedPath = path.resolve(savePath);
            // Define allowed directories (e.g., current folder or specific subfolders)
            // In this case, we assume any path within the project or /tmp is valid,
            // but we block attempts to escape the system root or access sensitive files.
            // A simple validation is ensuring it does not contain '..'
            if (savePath.includes('..')) {
                throw new Error(req.t('errors.unsafe_file_path'));
            }
            screenshotOptions.path = resolvedPath;
        }

        let screenshotBuffer;

        if (selector) {
            // Case 1: Element Capture
            console.log(`[Screenshot] Element mode: ${selector} (Timeout: ${timeout}ms)`);
            await page.waitForSelector(selector, { state: 'visible', timeout });
            const element = await page.$(selector);
            if (!element) {
                throw new Error(req.t('errors.element_not_found', { selector }));
            }
            screenshotBuffer = await element.screenshot(screenshotOptions);
        } else {
            // Case 2: Full Page / Viewport Capture
            if (fullPage) {
                console.log('[Screenshot] Full Page mode (Starting warmup scroll...)');
                // Optimization: Scroll to bottom and back to wake up lazy-loaded elements
                try {
                    // Manual warmup with race to avoid hang
                    await Promise.race([
                        page.evaluate(() => {
                            /* global window, document */
                            window.scrollTo(0, document.body.scrollHeight / 2);
                            return new Promise((r) => setTimeout(r, 500)).then(() =>
                                window.scrollTo(0, 0),
                            );
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Warmup timeout')), 5000),
                        ),
                    ]);
                    console.log('[Screenshot] Warmup complete.');
                } catch (e) {
                    console.warn('[Screenshot] Warmup skipped (timed out or failed):', e.message);
                }
                console.log(
                    `[Screenshot] Executing fullPage capture (Max wait: ${screenshotOptions.timeout}ms)...`,
                );
            } else {
                console.log('[Screenshot] Viewport mode');
            }

            screenshotBuffer = await page.screenshot(screenshotOptions);
            console.log('[Screenshot] Capture successful.');
        }
        if (!screenshotBuffer) {
            throw new Error('Screenshot operation failed to return a valid image.');
        }

        // Return data
        // ALWAYS return base64 so the frontend can display it
        // and so the "Automatic Capture" system can reuse it.
        const base64Image = screenshotBuffer.toString('base64');

        return {
            message: req.t('actions.take_screenshot.success'),
            data: {
                screenshot: base64Image,
                savedTo: savePath ? screenshotOptions.path : null,
                format,
            },
            traceDetails: {
                selector,
                fullPage: !selector && fullPage,
                format,
                quality: format === 'jpeg' ? quality : undefined,
                savedTo: savePath,
            },
        };
    });

export default takeScreenshotAction;
