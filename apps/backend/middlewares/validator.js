// middlewares/validate.js

import Joi from 'joi';

/**
 * Generic middleware to validate the request body, parameters (params),
 * and/or queries against a Joi schema.
 *
 * @param {object} schemas - An object containing Joi schemas for 'body', 'params', and/or 'query'.
 * @returns {function} An Express middleware.
 */
const validate = (schemas) => (req, res, next) => {
    // 1. Build the master schema and data object dynamically.
    const masterSchemaObject = {};
    const validationData = {};

    for (const key of ['body', 'params', 'query']) {
        if (schemas[key]) {
            // Only include the key if a schema was provided
            masterSchemaObject[key] = schemas[key];

            // Collect request data (using empty object if not exists)
            validationData[key] = req[key] || {};
        }
    }

    // If no schema was passed, there's nothing to validate
    if (Object.keys(masterSchemaObject).length === 0) {
        return next();
    }

    // 2. Define the master schema
    const masterSchema = Joi.object(masterSchemaObject);

    // 3. Validation options
    const options = {
        abortEarly: false,
        stripUnknown: true, // Cleans the output of undefined fields
    };

    // 4. Execute validation
    const { error, value } = masterSchema.validate(validationData, options);

    if (error) {
        // 5. Create error details object, adding 'location' (body/params/query)
        const errorDetails = error.details.map((detail) => {
            // Path always starts with the location (e.g., ['body', 'url'])
            const location = detail.path[0];

            // .path[1] is the actual field (e.g., 'url'). We use .slice(1) to handle sub-objects.
            const field = detail.path.slice(1).join('.') || detail.context.key;

            return {
                field: field,
                location: location, // 💡 IMPROVEMENT: Indicates if error is in body, params, or query.
                message: detail.message.replace(/['"]/g, ''), // Clean quotes from message
            };
        });

        // 🚨 Creation of error for centralized handler
        const validationError = new Error(req.t('common.error_validation'));
        validationError.statusCode = 400;
        validationError.details = errorDetails;

        return next(validationError);
    }

    // 6. If validation is successful, replace request data with cleaned data.
    // Only properties existing in 'value' (and thus in 'schemas') will be replaced.
    // 🛡️ PRESERVE nodeId and runId: Socket.io uses nodeId for real-time tracking,
    // and Flight Recorder uses runId for step result logging.
    const originalNodeId = req.body && req.body.nodeId;
    const originalRunId = req.body && req.body.runId;
    const originalBrowserId = req.body && req.body.browserId;
    const originalTakeScreenshot = req.body && req.body.takeScreenshot;
    const originalDebugMode = req.body && req.body.debugMode;

    if (value.body) {
        req.body = value.body;
        if (originalNodeId) req.body.nodeId = originalNodeId;
        if (originalRunId) req.body.runId = originalRunId;
        if (originalBrowserId) req.body.browserId = originalBrowserId;
        if (originalTakeScreenshot !== undefined) req.body.takeScreenshot = originalTakeScreenshot;
        if (originalDebugMode !== undefined) req.body.debugMode = originalDebugMode;
    }
    if (value.params) {
        req.params = value.params;
    }
    if (value.query) {
        req.query = value.query;
    }

    next();
};

export default validate;
