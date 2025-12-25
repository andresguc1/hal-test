/**
 * LocalStorage Manager with LRU Cache
 * Prevents localStorage from filling up by managing storage with LRU eviction
 */

import { logger } from "./logger";
import { formatBytes } from "./flowUtils";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB default limit
const STORAGE_KEY_PREFIX = "hal_test_";

/**
 * LocalStorage Manager Class
 */
class StorageManager {
  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
    this.accessLog = this.loadAccessLog();
  }

  /**
   * Loads access log from localStorage
   * @private
   */
  loadAccessLog() {
    try {
      const log = localStorage.getItem(`${STORAGE_KEY_PREFIX}access_log`);
      return log ? JSON.parse(log) : {};
    } catch (error) {
      logger.error("Failed to load access log", error, "StorageManager");
      return {};
    }
  }

  /**
   * Saves access log to localStorage
   * @private
   */
  saveAccessLog() {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}access_log`,
        JSON.stringify(this.accessLog),
      );
    } catch (error) {
      logger.error("Failed to save access log", error, "StorageManager");
    }
  }

  /**
   * Updates access time for a key
   * @private
   */
  updateAccess(key) {
    this.accessLog[key] = Date.now();
    this.saveAccessLog();
  }

  /**
   * Gets current storage usage
   * @returns {number} Size in bytes
   */
  getCurrentSize() {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  }

  /**
   * Gets least recently used key
   * @private
   */
  getLRUKey() {
    let lruKey = null;
    let lruTime = Infinity;

    for (let key in this.accessLog) {
      if (this.accessLog[key] < lruTime) {
        lruTime = this.accessLog[key];
        lruKey = key;
      }
    }

    return lruKey;
  }

  /**
   * Evicts least recently used items until size is under limit
   * @private
   */
  evictIfNeeded(newItemSize) {
    const currentSize = this.getCurrentSize();
    const targetSize = this.maxSize * 0.8; // Keep 20% buffer

    if (currentSize + newItemSize > this.maxSize) {
      logger.warn(
        "Storage limit reached, evicting LRU items",
        {
          currentSize: formatBytes(currentSize),
          maxSize: formatBytes(this.maxSize),
          newItemSize: formatBytes(newItemSize),
        },
        "StorageManager",
      );

      while (this.getCurrentSize() + newItemSize > targetSize) {
        const lruKey = this.getLRUKey();
        if (!lruKey) break;

        logger.debug("Evicting item", { key: lruKey }, "StorageManager");
        this.remove(lruKey);
      }
    }
  }

  /**
   * Sets an item in localStorage with LRU management
   *
   * @param {string} key - Storage key (without prefix)
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const fullKey = `${STORAGE_KEY_PREFIX}${key}`;

    try {
      const serialized = JSON.stringify(value);
      const itemSize = fullKey.length + serialized.length;

      // Evict if needed
      this.evictIfNeeded(itemSize);

      // Store item
      localStorage.setItem(fullKey, serialized);
      this.updateAccess(fullKey);

      logger.debug(
        "Item stored",
        {
          key,
          size: formatBytes(itemSize),
          totalSize: formatBytes(this.getCurrentSize()),
        },
        "StorageManager",
      );

      return true;
    } catch (error) {
      logger.error("Failed to store item", error, "StorageManager");

      // Try to free up space and retry once
      this.evictIfNeeded(0);

      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(fullKey, serialized);
        this.updateAccess(fullKey);
        return true;
      } catch (retryError) {
        logger.error(
          "Failed to store item after eviction",
          retryError,
          "StorageManager",
        );
        return false;
      }
    }
  }

  /**
   * Gets an item from localStorage
   *
   * @param {string} key - Storage key (without prefix)
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const fullKey = `${STORAGE_KEY_PREFIX}${key}`;

    try {
      const value = localStorage.getItem(fullKey);
      if (value === null) {
        return defaultValue;
      }

      this.updateAccess(fullKey);
      return JSON.parse(value);
    } catch (error) {
      logger.error("Failed to get item", error, "StorageManager");
      return defaultValue;
    }
  }

  /**
   * Removes an item from localStorage
   *
   * @param {string} key - Storage key (without prefix)
   */
  remove(key) {
    const fullKey = `${STORAGE_KEY_PREFIX}${key}`;

    try {
      localStorage.removeItem(fullKey);
      delete this.accessLog[fullKey];
      this.saveAccessLog();

      logger.debug("Item removed", { key }, "StorageManager");
    } catch (error) {
      logger.error("Failed to remove item", error, "StorageManager");
    }
  }

  /**
   * Clears all managed items
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      this.accessLog = {};
      this.saveAccessLog();

      logger.info("Storage cleared", null, "StorageManager");
    } catch (error) {
      logger.error("Failed to clear storage", error, "StorageManager");
    }
  }

  /**
   * Gets storage statistics
   *
   * @returns {Object} Storage stats
   */
  getStats() {
    const currentSize = this.getCurrentSize();
    const itemCount = Object.keys(this.accessLog).length;
    const usagePercentage = ((currentSize / this.maxSize) * 100).toFixed(1);

    return {
      currentSize: formatBytes(currentSize),
      maxSize: formatBytes(this.maxSize),
      itemCount,
      usagePercentage: `${usagePercentage}%`,
      availableSpace: formatBytes(this.maxSize - currentSize),
    };
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export class for testing
export { StorageManager };
