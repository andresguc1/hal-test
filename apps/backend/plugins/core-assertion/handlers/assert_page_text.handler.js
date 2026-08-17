import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
/* eslint-disable no-undef */

const assertPageText = (req, res) =>
    executePlaywrightAction(req, res, 'assert_page_text', async (page, opts) => {
        const { textToFind, matchType = 'contains', caseSensitive = false, timeout = 5000 } = opts;

        if (!textToFind) {
            throw new Error(
                req.t('actions.assert_page_text.text_required', 'Text to find is required.'),
            );
        }

        try {
            await page.waitForFunction(
                ({ text, type, caseSens }) => {
                    const bodyText = document.body ? document.body.innerText : '';
                    if (type === 'regex') {
                        try {
                            const flags = caseSens ? '' : 'i';
                            const regex = new RegExp(text, flags);
                            return regex.test(bodyText);
                        } catch (err) {
                            return false;
                        }
                    } else if (type === 'exact') {
                        if (caseSens) {
                            return bodyText === text;
                        } else {
                            return bodyText.toLowerCase() === text.toLowerCase();
                        }
                    } else {
                        if (caseSens) {
                            return bodyText.includes(text);
                        } else {
                            return bodyText.toLowerCase().includes(text.toLowerCase());
                        }
                    }
                },
                { text: textToFind, type: matchType, caseSens: caseSensitive },
                { timeout },
            );

            return {
                message: req.t('actions.assert_page_text.success', { text: textToFind }),
                data: {
                    textToFind,
                    matchType,
                    caseSensitive,
                    timeout,
                    matched: true,
                },
                traceDetails: {
                    textToFind,
                    matchType,
                    caseSensitive,
                    timeout,
                },
            };
        } catch (error) {
            if (
                error.name === 'TimeoutError' ||
                error.message.includes('timeout') ||
                error.message.includes('Timeout')
            ) {
                throw new Error(
                    req.t('actions.assert_page_text.timeout_error', {
                        text: textToFind,
                        timeout,
                    }),
                );
            }
            throw error;
        }
    });

export default assertPageText;
