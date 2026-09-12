// ../middlewares/logger.js - Structured JSON Logging

import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORAGE_DIR } from '../config/paths.js';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDirectory = path.join(STORAGE_DIR, 'logs');

try {
    fs.mkdirSync(logDirectory, { recursive: true });
} catch (error) {
    if (error.code !== 'EEXIST') {
        console.error('Error al crear el directorio de logs:', error.message);
    }
}

const logStream = fs.createWriteStream(path.join(logDirectory, 'application.log'), { flags: 'a' });

const errorStream = fs.createWriteStream(path.join(logDirectory, 'error.log'), { flags: 'a' });

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLogLevel =
    process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function formatLogEntry(level, message, meta = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: 'haltest-backend',
        version: process.env.APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        message,
        ...meta,
    };
    return JSON.stringify(entry);
}

function writeLog(level, message, meta = {}) {
    if (!shouldLog(level)) return;

    const logEntry = formatLogEntry(level, message, meta);

    // Write to appropriate stream
    logStream.write(logEntry + '\n');

    if (level === 'error') {
        errorStream.write(logEntry + '\n');
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
        const colorMap = {
            debug: '\x1b[36m',
            info: '\x1b[32m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
        };
        const reset = '\x1b[0m';
        console.log(`${colorMap[level] || ''}[${level.toUpperCase()}]${reset} ${message}`, meta);
    }
}

export const logger = {
    debug: (message, meta) => writeLog('debug', message, meta),
    info: (message, meta) => writeLog('info', message, meta),
    warn: (message, meta) => writeLog('warn', message, meta),
    error: (message, meta) => writeLog('error', message, meta),
};

export const developmentLogger = () => morgan('dev');

const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

const combinedLogger = morgan('combined', { stream: accessLogStream });

export const productionLogger = () => combinedLogger;

export const structuredLogger = logger;

export function createRequestLogger(req, res, next) {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const startTime = Date.now();

    logger.info('HTTP Request', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        writeLog(logLevel, 'HTTP Response', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            durationMs: duration,
            contentLength: res.get('Content-Length'),
        });
    });

    next();
}

export function logError(err, req = null) {
    const meta = {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
        },
    };

    if (req) {
        meta.request = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            ip: req.ip,
        };
    }

    logger.error('Application Error', meta);
}

export default {
    logger,
    developmentLogger,
    productionLogger,
    structuredLogger: logger,
    createRequestLogger,
    logError,
};
