/**
 * Logger Utility Module
 * Provides conditional logging based on environment.
 * In development: logs to console
 * In production: silent (can be extended to send to remote logging service)
 */

const isDevelopment = import.meta.env?.DEV ?? true;

/**
 * Log levels enum
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Logger class with environment-aware logging
 */
class Logger {
  constructor() {
    this.isDev = isDevelopment;
  }

  /**
   * Formats log message with timestamp and context
   * @private
   */
  _format(level, message, context) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : "";
    return `[${timestamp}]${contextStr} ${level.toUpperCase()}: ${message}`;
  }

  /**
   * Logs debug messages (only in development)
   * @param {string} message - The message to log
   * @param {*} [data] - Optional data to log
   * @param {string} [context] - Optional context identifier
   */
  debug(message, data, context) {
    if (!this.isDev) return;

    const formatted = this._format(LogLevel.DEBUG, message, context);
    if (data !== undefined) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  }

  /**
   * Logs info messages
   * @param {string} message - The message to log
   * @param {*} [data] - Optional data to log
   * @param {string} [context] - Optional context identifier
   */
  info(message, data, context) {
    if (!this.isDev) return;

    const formatted = this._format(LogLevel.INFO, message, context);
    if (data !== undefined) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  /**
   * Logs warning messages
   * @param {string} message - The message to log
   * @param {*} [data] - Optional data to log
   * @param {string} [context] - Optional context identifier
   */
  warn(message, data, context) {
    const formatted = this._format(LogLevel.WARN, message, context);
    if (data !== undefined) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Logs error messages (always logged, even in production)
   * @param {string} message - The message to log
   * @param {Error|*} [error] - Optional error object or data
   * @param {string} [context] - Optional context identifier
   */
  error(message, error, context) {
    const formatted = this._format(LogLevel.ERROR, message, context);
    if (error !== undefined) {
      console.error(formatted, error);

      // In production, you could send errors to a remote logging service
      // if (!this.isDev) {
      //   this._sendToRemoteLogger(formatted, error);
      // }
    } else {
      console.error(formatted);
    }
  }

  /**
   * Logs execution time of a function
   * @param {string} label - Label for the operation
   * @param {Function} fn - Function to execute and time
   * @returns {Promise<*>|*} Result of the function
   */
  async time(label, fn) {
    if (!this.isDev) {
      return await fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Creates a child logger with a specific context
   * @param {string} context - Context identifier
   * @returns {Object} Logger with bound context
   */
  withContext(context) {
    return {
      debug: (message, data) => this.debug(message, data, context),
      info: (message, data) => this.info(message, data, context),
      warn: (message, data) => this.warn(message, data, context),
      error: (message, error) => this.error(message, error, context),
      time: (label, fn) => this.time(`${context}:${label}`, fn),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
