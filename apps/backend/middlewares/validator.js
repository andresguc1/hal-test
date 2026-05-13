// middlewares/validator.js

import Joi from 'joi';

/**
 * Generic middleware to validate the request body, parameters (params),
 * and/or queries against a Joi or Zod schema.
 *
 * @param {object} schemas - An object containing schemas for 'body', 'params', and/or 'query'.
 * @returns {function} An Express middleware.
 */
const validate = (schemas) => (req, res, next) => {
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
                hasError = true;
                result.error.issues.forEach((issue) => {
                    errorDetails.push({
                        field: issue.path.join('.'),
                        location: key,
                        message: issue.message,
                    });
                });
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
                hasError = true;
                error.details.forEach((detail) => {
                    errorDetails.push({
                        field: detail.path.join('.'),
                        location: key,
                        message: detail.message.replace(/['"]/g, ''),
                    });
                });
            } else {
                cleanedValues[key] = value;
            }
        }
    }

    if (hasError) {
        const validationError = new Error(
            req.t ? req.t('common.error_validation') : 'Validation Error',
        );
        validationError.statusCode = 400;
        validationError.details = errorDetails;
        return next(validationError);
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
    }
    if (schemas.params) req.params = cleanedValues.params;
    if (schemas.query) req.query = cleanedValues.query;

    next();
};

export default validate;
