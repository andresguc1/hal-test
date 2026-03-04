// middlewares/errorHandler.js

/**
 * Middleware for Centralized Error Handling (Custom Error Handler).
 * Captures errors thrown by routes or middlewares and sends a standardized JSON response.
 *
 * @param {Error} err - The thrown error object.
 * @param {import('express').Request} req - Request object.
 * @param {import('express').Response} res - Response object.
 * @param {import('next').NextFunction} _next - Function to pass control.
 * (MUST BE PRESENT FOR EXPRESS TO RECOGNIZE IT AS AN ERROR HANDLER)
 */
const errorHandler = (err, req, res, _next) => {
    // 1. Determine the status code.
    const statusCode = err.statusCode || 500;

    // 2. Determine the error message.
    const t = typeof req.t === 'function' ? req.t : (key) => key;
    const message =
        statusCode === 500 && process.env.NODE_ENV === 'production'
            ? t('common.error_internal')
            : err.message || t('common.error_unknown');

    // 3. Log the full error on the server (not to the client).
    console.error(`[ERROR ${statusCode}]: ${err.message || message}`);
    console.error(err.stack);

    // 4. Send the standardized JSON response.
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        error: message,

        // Include validation details if they exist (e.g., from validator.js)
        details: err.details || undefined,

        // Optional: include the stack trace only in development
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });

    // NOTE: next() is not called here as this is the end of the error handling chain.
};

export default errorHandler;
