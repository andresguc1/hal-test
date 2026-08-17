import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator } from '../../../core/selector-utils.js';
import { variableManager } from '../../../services/VariableManager.js';

const fillForm = (req, res) =>
    executePlaywrightAction(req, res, 'fill_form', async (page, opts) => {
        const {
            formSelector,
            fields,
            clearBeforeType = true,
            submitAfterFill = false,
            submitSelector,
            waitForNavigation = true,
            timeout = 30000,
        } = opts;

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

        console.log(
            `[fillFormAction] Starting fill_form on ${formSelector} with ${fields.length} fields:`,
            JSON.stringify(fields),
        );

        const timeoutMs = typeof timeout === 'number' ? timeout : 30000;
        const formLocator = buildPlaywrightLocator(page, formSelector);
        await formLocator.waitFor({ state: 'attached', timeout: timeoutMs });

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
            await targetLocator.waitFor({ state: 'attached', timeout: timeoutMs });

            if (fieldDelay > 0) {
                await page.waitForTimeout(fieldDelay);
            }

            switch (fieldType) {
                case 'text':
                    if (fieldClear) {
                        await targetLocator.fill('', { timeout: timeoutMs });
                        if (String(resolvedValue)) {
                            await targetLocator.type(String(resolvedValue), {
                                delay: fieldDelay,
                                timeout: timeoutMs,
                            });
                        }
                    } else {
                        await targetLocator.type(String(resolvedValue), {
                            delay: fieldDelay,
                            timeout: timeoutMs,
                        });
                    }
                    break;
                case 'select':
                    await targetLocator
                        .selectOption({ label: String(resolvedValue) }, { timeout: timeoutMs })
                        .catch(async () => {
                            await targetLocator.selectOption(
                                { value: String(resolvedValue) },
                                { timeout: timeoutMs },
                            );
                        });
                    break;
                case 'checkbox':
                case 'radio': {
                    const isChecked = resolvedValue === 'true' || resolvedValue === true;
                    if (isChecked) {
                        await targetLocator.check({ timeout: timeoutMs });
                    } else {
                        await targetLocator.uncheck({ timeout: timeoutMs });
                    }
                    break;
                }
                case 'file':
                    await targetLocator.setInputFiles(String(resolvedValue), {
                        timeout: timeoutMs,
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
            `[fillFormAction] DEBUG: shouldSubmit=${shouldSubmit}, submitAfterFill=${submitAfterFill} (${typeof submitAfterFill}), submitSelector='${submitSelector}', waitForNavigation=${waitForNavigation}`,
        );
        if (shouldSubmit) {
            const submitAction = async () => {
                if (submitSelector && submitSelector.trim().length > 0) {
                    const submitLocator = buildPlaywrightLocator(page, submitSelector);
                    try {
                        await submitLocator.waitFor({
                            state: 'attached',
                            timeout: Math.min(timeoutMs, 500),
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

            if (waitForNavigation) {
                await Promise.all([
                    page
                        .waitForNavigation({ timeout: timeoutMs, waitUntil: 'load' })
                        .catch((err) => {
                            console.warn(
                                `[fillFormAction] waitForNavigation timed out: ${err.message}`,
                            );
                            throw err;
                        }),
                    submitAction(),
                ]);
            } else {
                await submitAction();
            }

            submitData = {
                submitted: true,
                submitSelector: submitSelector || null,
                waitForNavigation,
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
                timeout: timeoutMs,
            },
        };
    });

export default fillForm;
