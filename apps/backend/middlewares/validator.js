import Joi from 'joi';
import { variableManager } from '../services/VariableManager.js';

/**
 * Generic middleware to validate the request body, parameters (params),
 * and/or queries against a Joi or Zod schema.
 *
 * @param {object} schemas - An object containing schemas for 'body', 'params', and/or 'query'.
 * @returns {function} An Express middleware.
 */
const validate = (schemas) => (req, res, next) => {
    if (req.body && req.body.variables && typeof req.body.variables === 'object') {
        try {
            const effectiveRunId = req.body.runId || 'atomic_run';
            variableManager.initRun(effectiveRunId, req.body.variables);
            if (effectiveRunId !== 'atomic_run') {
                variableManager.initRun('atomic_run', req.body.variables);
            }
            req.body.runId = effectiveRunId;
            req.body = variableManager.resolveRecursive(req.body, effectiveRunId);
        } catch (err) {
            console.warn('[Validator Middleware] Failed to pre-resolve variables:', err.message);
        }
    }

    const errorDetails = [];
    const cleanedValues = { body: req.body, params: req.params, query: req.query };
    let hasError = false;

    // Validate each part independently to support mixing Joi and Zod schemas
    for (const key of ['body', 'params', 'query']) {
        if (!schemas[key]) continue;

        const schema = schemas[key];
        const data = req[key] || {};

        // Zod Validation
        if (typeof schema.safeParse === 'function') {
            const result = schema.safeParse(data);
            if (!result.success) {
                const variablePattern = /^(?:\$\{[^}]+\}|\{\{[^}]+\}\})$/;
                const genuineIssues = result.error.issues.filter((issue) => {
                    const path = issue.path;
                    let val = data;
                    for (const p of path) {
                        if (val && typeof val === 'object') {
                            val = val[p];
                        } else {
                            val = undefined;
                            break;
                        }
                    }
                    if (typeof val === 'string' && variablePattern.test(val.trim())) {
                        return false;
                    }
                    return true;
                });

                if (genuineIssues.length > 0) {
                    hasError = true;
                    genuineIssues.forEach((issue) => {
                        errorDetails.push({
                            field: issue.path.join('.'),
                            location: key,
                            message: issue.message,
                        });
                    });
                } else {
                    cleanedValues[key] = { ...data, ...result.data };
                }
            } else {
                cleanedValues[key] = result.data;
            }
        }
        // Joi Validation
        else if (typeof schema.validate === 'function') {
            const { error, value } = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                const variablePattern = /^(?:\$\{[^}]+\}|\{\{[^}]+\}\})$/;
                const genuineDetails = error.details.filter((detail) => {
                    const path = detail.path;
                    let val = data;
                    for (const p of path) {
                        if (val && typeof val === 'object') {
                            val = val[p];
                        } else {
                            val = undefined;
                            break;
                        }
                    }
                    if (typeof val === 'string' && variablePattern.test(val.trim())) {
                        return false;
                    }
                    return true;
                });

                if (genuineDetails.length > 0) {
                    hasError = true;
                    genuineDetails.forEach((detail) => {
                        errorDetails.push({
                            field: detail.path.join('.'),
                            location: key,
                            message: detail.message.replace(/['"]/g, ''),
                        });
                    });
                } else {
                    cleanedValues[key] = { ...data, ...value };
                }
            } else {
                cleanedValues[key] = value;
            }
        }
    }
    const isDraftMode = req.headers && req.headers['x-hal-draft-mode'] === 'true';

    if (hasError) {
        if (isDraftMode) {
            console.warn(
                `[Validator Middleware] ⚠️ Validation failed, but bypassing due to Draft Mode. Errors:`,
                JSON.stringify(errorDetails),
            );
        } else {
            const validationError = new Error(
                req.t ? req.t('common.error_validation') : 'Validation Error',
            );
            validationError.statusCode = 400;
            validationError.details = errorDetails;
            return next(validationError);
        }
    }
    // 6. If validation is successful, replace request data with cleaned data.
    // 🛡️ PRESERVE metadata fields commonly used outside schema scope
    const originalNodeId = req.body?.nodeId;
    const originalRunId = req.body?.runId;
    const originalBrowserId = req.body?.browserId;
    const originalTakeScreenshot = req.body?.takeScreenshot;
    const originalDebugMode = req.body?.debugMode;
    const originalContinueOnError = req.body?.continueOnError;
    const originalLabel = req.body?.label;
    const originalCustomLabel = req.body?.customLabel;
    const originalVariables = req.body?.variables;

    if (schemas.body) {
        req.body = cleanedValues.body;
        if (originalNodeId !== undefined) req.body.nodeId = originalNodeId;
        if (originalRunId !== undefined) req.body.runId = originalRunId;
        if (originalBrowserId !== undefined) req.body.browserId = originalBrowserId;
        if (originalTakeScreenshot !== undefined) req.body.takeScreenshot = originalTakeScreenshot;
        if (originalDebugMode !== undefined) req.body.debugMode = originalDebugMode;
        if (originalContinueOnError !== undefined)
            req.body.continueOnError = originalContinueOnError;
        if (originalLabel !== undefined) req.body.label = originalLabel;
        if (originalCustomLabel !== undefined) req.body.customLabel = originalCustomLabel;
        if (originalVariables !== undefined) req.body.variables = originalVariables;
    }
    if (schemas.params) req.params = cleanedValues.params;
    if (schemas.query) req.query = cleanedValues.query;

    next();
};

export default validate;
