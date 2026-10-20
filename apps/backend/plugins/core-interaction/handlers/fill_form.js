import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import { isPageTeardownError } from '../../../core/browser-utils.js';
import { variableManager } from '../../../services/VariableManager.js';

const VALID_WAIT_UNTIL = ['load', 'domcontentloaded', 'networkidle', 'commit'];

const createRegex = (str) => {
    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(escaped, 'i');
};

const fillForm = (req, res) =>
    executePlaywrightAction(req, res, 'fill_form', async (page, opts) => {
        const {
            formSelector,
            fields,
            clearBeforeType = true,
            submitAfterFill = false,
            submitSelector,
            waitForNavigation = true,
            waitUntil = 'load',
            waitForResponseUrl,
            waitForResponseStatus,
        } = opts;
        const timeoutMs = normalizeTimeout(
            req.body._timeoutResolution?.effectiveMs ?? opts.timeout,
        );

        if (!formSelector) {
            console.error('[fillFormAction] Error: formSelector is missing');
            throw new Error(req.t('errors.selector_required'));
        }
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            console.error('[fillFormAction] Error: fields array is missing or empty', fields);
            throw new Error(
                req.t('errors.fields_required') || 'At least one field definition is required.',
            );
        }

        if (waitForNavigation && !VALID_WAIT_UNTIL.includes(waitUntil)) {
            throw new Error(
                req.t('actions.fill_form.error_invalid_wait_until', {
                    waitUntil,
                    valid: VALID_WAIT_UNTIL.join(', '),
                }) ||
                    `Invalid waitUntil: ${waitUntil}. Must be one of: ${VALID_WAIT_UNTIL.join(', ')}`,
            );
        }

        console.log(
            `[fillFormAction] Starting fill_form on ${formSelector} with ${fields.length} fields:`,
            JSON.stringify(fields),
        );

        const runOptions = playTimeout(timeoutMs);
        const formLocator = buildPlaywrightLocator(page, formSelector);
        await formLocator.waitFor({ state: 'attached', ...runOptions });

        const fillResults = [];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (!field || typeof field !== 'object') {
                console.error(
                    `[fillFormAction] Error: Field at index ${i} is not an object`,
                    field,
                );
                throw new Error('Each field must be an object with selector and value.');
            }
            const selector = field.selector;
            if (!selector) {
                console.error(
                    `[fillFormAction] Error: Field at index ${i} has an empty selector`,
                    field,
                );
                throw new Error('Field selector is required for every field.');
            }

            const runId = page._currentRunId || req.body?.runId;
            let resolvedValue = field.value ?? '';
            if (runId && typeof resolvedValue === 'string' && resolvedValue.includes('{{')) {
                resolvedValue = variableManager.resolveRecursive(resolvedValue, runId);
            }

            const fieldType = field.type || 'text';
            const fieldDelay = typeof field.delay === 'number' ? field.delay : 0;
            const fieldClear = field.clearBeforeType ?? clearBeforeType;

            const targetLocator = buildPlaywrightLocator(page, selector);
            await targetLocator.waitFor({ state: 'attached', ...runOptions });

            if (fieldDelay > 0) {
                await page.waitForTimeout(fieldDelay);
            }

            switch (fieldType) {
                case 'text':
                    if (fieldClear) {
                        await targetLocator.fill('', { ...runOptions });
                        if (String(resolvedValue)) {
                            await targetLocator.type(String(resolvedValue), {
                                delay: fieldDelay,
                                ...runOptions,
                            });
                        }
                    } else {
                        await targetLocator.type(String(resolvedValue), {
                            delay: fieldDelay,
                            ...runOptions,
                        });
                    }
                    break;
                case 'select':
                    await targetLocator
                        .selectOption({ label: String(resolvedValue) }, { ...runOptions })
                        .catch(async () => {
                            await targetLocator.selectOption(
                                { value: String(resolvedValue) },
                                { ...runOptions },
                            );
                        });
                    break;
                case 'checkbox':
                case 'radio': {
                    const isChecked = resolvedValue === 'true' || resolvedValue === true;
                    if (isChecked) {
                        await targetLocator.check({ ...runOptions });
                    } else {
                        await targetLocator.uncheck({ ...runOptions });
                    }
                    break;
                }
                case 'file':
                    await targetLocator.setInputFiles(String(resolvedValue), {
                        ...runOptions,
                    });
                    break;
                default:
                    throw new Error(`Unsupported field type: ${fieldType}`);
            }

            fillResults.push({
                selector,
                value: String(resolvedValue),
                cleared: fieldClear,
                delay: fieldDelay,
            });
        }

        let submitData = null;
        const shouldSubmit =
            submitAfterFill === true ||
            submitAfterFill === 'true' ||
            (typeof submitSelector === 'string' && submitSelector.trim().length > 0);
        console.log(
            `[fillFormAction] DEBUG: shouldSubmit=${shouldSubmit}, submitAfterFill=${submitAfterFill} (${typeof submitAfterFill}), submitSelector='${submitSelector}', waitForNavigation=${waitForNavigation}, waitUntil=${waitUntil}, waitForResponseUrl=${waitForResponseUrl}`,
        );
        if (shouldSubmit) {
            const submitAction = async () => {
                if (submitSelector && submitSelector.trim().length > 0) {
                    const submitLocator = buildPlaywrightLocator(page, submitSelector);
                    try {
                        await submitLocator.waitFor({
                            state: 'attached',
                            ...runOptions,
                        });
                        await submitLocator.click();
                    } catch (clickErr) {
                        console.warn('[fillFormAction] Submit click failed:', clickErr.message);
                        throw clickErr;
                    }
                } else {
                    await formLocator.evaluate((form) => {
                        if (typeof form.requestSubmit === 'function') {
                            form.requestSubmit();
                        } else {
                            form.submit();
                        }
                    });
                }
            };

            let navigationAborted = false;
            let responseWaited = false;
            let waitedResponse = null;

            if (waitForNavigation && !page.isClosed()) {
                const navigationPromise = (async () => {
                    // If waitForResponseUrl is provided, wait for that specific response
                    if (waitForResponseUrl && waitForResponseUrl.trim().length > 0) {
                        try {
                            const regex = createRegex(waitForResponseUrl);
                            waitedResponse = await page.waitForResponse(
                                (resp) => {
                                    const matchUrl = regex.test(resp.url());
                                    const matchStatus = waitForResponseStatus
                                        ? resp.status() === waitForResponseStatus
                                        : true;
                                    return matchUrl && matchStatus;
                                },
                                { ...runOptions },
                            );
                            responseWaited = true;
                            console.log(
                                `[fillFormAction] Waited for response: ${waitedResponse.url()} (status: ${waitedResponse.status()})`,
                            );
                            return;
                        } catch (respErr) {
                            if (isPageTeardownError(respErr) || page.isClosed()) {
                                navigationAborted = true;
                                console.warn(
                                    `[fillFormAction] Response wait aborted (page closed): ${respErr.message}`,
                                );
                                return;
                            }
                            console.warn(
                                `[fillFormAction] waitForResponse timed out: ${respErr.message}`,
                            );
                            throw respErr;
                        }
                    }

                    // Otherwise wait for navigation with configurable waitUntil
                    try {
                        await page.waitForNavigation({ ...runOptions, waitUntil });
                    } catch (navErr) {
                        if (isPageTeardownError(navErr) || page.isClosed()) {
                            navigationAborted = true;
                            console.warn(
                                `[fillFormAction] Navigation wait aborted (page closed): ${navErr.message}`,
                            );
                            return;
                        }
                        console.warn(
                            `[fillFormAction] waitForNavigation timed out (waitUntil=${waitUntil}): ${navErr.message}`,
                        );
                        // Helpful hint for AJAX forms using default 'load'
                        if (waitUntil === 'load') {
                            console.warn(
                                `[fillFormAction] HINT: Form submission may be AJAX (no full page reload). ` +
                                    `Try setting waitUntil="networkidle" or configure waitForResponseUrl in node config.`,
                            );
                        }
                        throw navErr;
                    }
                })();

                await Promise.all([navigationPromise, submitAction()]);
            } else {
                await submitAction();
            }

            submitData = {
                submitted: true,
                submitSelector: submitSelector || null,
                waitForNavigation,
                waitUntil,
                waitForResponseUrl: waitForResponseUrl || null,
                ...(navigationAborted ? { navigationAborted: true } : {}),
                ...(responseWaited && waitedResponse
                    ? {
                          waitedResponse: {
                              url: waitedResponse.url(),
                              status: waitedResponse.status(),
                          },
                      }
                    : {}),
            };
        }

        return {
            message: req.t('actions.fill_form.success'),
            data: {
                filledFields: fillResults,
                ...(submitData ? { submit: submitData } : {}),
            },
            traceDetails: {
                formSelector,
                fieldCount: fillResults.length,
                submitAfterFill,
                submitSelector,
                waitForNavigation,
                waitUntil,
                waitForResponseUrl,
                waitForResponseStatus,
                ...runOptions,
            },
        };
    });

export default fillForm;
