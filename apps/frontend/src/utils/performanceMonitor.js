/**
 * Performance Monitor Utility
 * Tracks and reports performance metrics for the application
 */

import { logger } from "./logger";

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renders: [],
      operations: [],
      memory: [],
    };
    this.enabled = import.meta.env?.DEV ?? true;
  }

  /**
   * Marks the start of a render
   * @param {string} componentName - Name of the component
   * @returns {Function} Function to call when render completes
   */
  startRender(componentName) {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    const startMark = `${componentName}_render_start`;

    try {
      performance.mark(startMark);
    } catch {
      // Performance API not available
    }

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.metrics.renders.push({
        component: componentName,
        duration,
        timestamp: Date.now(),
      });

      // Keep only last 100 renders
      if (this.metrics.renders.length > 100) {
        this.metrics.renders.shift();
      }

      if (duration > 16) {
        // More than one frame (60fps)
        logger.warn(
          "Slow render detected",
          {
            component: componentName,
            duration: `${duration.toFixed(2)}ms`,
          },
          "PerformanceMonitor",
        );
      }

      try {
        const endMark = `${componentName}_render_end`;
        performance.mark(endMark);
        performance.measure(`${componentName}_render`, startMark, endMark);
      } catch {
        // Performance API not available
      }
    };
  }

  /**
   * Measures an async operation
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Async function to measure
   * @returns {Promise<*>} Result of the operation
   */
  async measureOperation(operationName, operation) {
    if (!this.enabled) {
      return await operation();
    }

    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      this.metrics.operations.push({
        name: operationName,
        duration,
        success: true,
        timestamp: Date.now(),
      });

      // Keep only last 100 operations
      if (this.metrics.operations.length > 100) {
        this.metrics.operations.shift();
      }

      logger.debug(
        "Operation completed",
        {
          operation: operationName,
          duration: `${duration.toFixed(2)}ms`,
        },
        "PerformanceMonitor",
      );

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.metrics.operations.push({
        name: operationName,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Records memory usage (if available)
   */
  recordMemory() {
    if (!this.enabled) return;

    // Check if memory API is available
    if (performance.memory) {
      this.metrics.memory.push({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      });

      // Keep only last 100 memory snapshots
      if (this.metrics.memory.length > 100) {
        this.metrics.memory.shift();
      }
    }
  }

  /**
   * Gets performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    const stats = {
      renders: this.getRenderStats(),
      operations: this.getOperationStats(),
      memory: this.getMemoryStats(),
    };

    return stats;
  }

  /**
   * Gets render statistics
   * @private
   */
  getRenderStats() {
    if (this.metrics.renders.length === 0) {
      return { count: 0, avgDuration: 0, maxDuration: 0 };
    }

    const durations = this.metrics.renders.map((r) => r.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const max = Math.max(...durations);

    return {
      count: this.metrics.renders.length,
      avgDuration: `${avg.toFixed(2)}ms`,
      maxDuration: `${max.toFixed(2)}ms`,
      slowRenders: this.metrics.renders.filter((r) => r.duration > 16).length,
    };
  }

  /**
   * Gets operation statistics
   * @private
   */
  getOperationStats() {
    if (this.metrics.operations.length === 0) {
      return { count: 0, avgDuration: 0, successRate: 0 };
    }

    const durations = this.metrics.operations.map((o) => o.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const successful = this.metrics.operations.filter((o) => o.success).length;
    const successRate = (successful / this.metrics.operations.length) * 100;

    return {
      count: this.metrics.operations.length,
      avgDuration: `${avg.toFixed(2)}ms`,
      successRate: `${successRate.toFixed(1)}%`,
      failed: this.metrics.operations.length - successful,
    };
  }

  /**
   * Gets memory statistics
   * @private
   */
  getMemoryStats() {
    if (this.metrics.memory.length === 0) {
      return { available: false };
    }

    const latest = this.metrics.memory[this.metrics.memory.length - 1];
    const usedMB = (latest.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (latest.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

    return {
      available: true,
      used: `${usedMB} MB`,
      total: `${totalMB} MB`,
      limit: `${limitMB} MB`,
      usage: `${((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(1)}%`,
    };
  }

  /**
   * Logs performance report to console
   */
  report() {
    if (!this.enabled) return;

    const stats = this.getStats();

    console.group("📊 Performance Report");
    console.log("Renders:", stats.renders);
    console.log("Operations:", stats.operations);
    console.log("Memory:", stats.memory);
    console.groupEnd();
  }

  /**
   * Clears all metrics
   */
  clear() {
    this.metrics = {
      renders: [],
      operations: [],
      memory: [],
    };

    logger.debug("Performance metrics cleared", null, "PerformanceMonitor");
  }

  /**
   * Enables or disables monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.debug("Performance monitoring", { enabled }, "PerformanceMonitor");
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for testing
export { PerformanceMonitor };

// Auto-record memory every 10 seconds in development
if (import.meta.env?.DEV) {
  setInterval(() => {
    performanceMonitor.recordMemory();
  }, 10000);
}
