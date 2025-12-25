// ScreenshotManager.js
// Utility class for managing node screenshots with IndexedDB persistence

import { logger } from "./logger";

const DB_NAME = "HalTestScreenshots";
const DB_VERSION = 1;
const STORE_NAME = "screenshots";

class ScreenshotManager {
  constructor() {
    this.db = null;
    this.cache = new Map(); // In-memory cache for Blob URLs
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error(
          "Failed to open IndexedDB",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.debug("IndexedDB initialized", null, "ScreenshotManager");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          objectStore.createIndex("nodeId", "nodeId", { unique: false });
          objectStore.createIndex("timing", "timing", { unique: false });
          logger.debug(
            "Created screenshots object store",
            null,
            "ScreenshotManager",
          );
        }
      };
    });
  }

  /**
   * Convert base64 string to Blob
   */
  base64ToBlob(base64, contentType = "image/png") {
    // Handle null/undefined
    if (!base64) {
      throw new Error("base64 input is empty");
    }

    // Handle Buffer-like objects (e.g. { type: 'Buffer', data: [...] })
    if (
      typeof base64 === "object" &&
      base64.type === "Buffer" &&
      Array.isArray(base64.data)
    ) {
      return new Blob([new Uint8Array(base64.data)], { type: contentType });
    }

    // Ensure base64 is a string
    let base64String = base64;
    if (typeof base64 !== "string") {
      logger.error(
        "Invalid base64 input type",
        { type: typeof base64, value: base64 },
        "ScreenshotManager",
      );
      throw new Error(
        `Invalid base64 input: received ${typeof base64} instead of string`,
      );
    }

    // Clean base64 string - remove data URL prefix if present
    let cleanBase64 = base64String;

    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    if (base64String.includes(",")) {
      cleanBase64 = base64String.split(",")[1];
    }

    // Remove any whitespace
    cleanBase64 = cleanBase64.replace(/\s/g, "");

    try {
      const byteCharacters = atob(cleanBase64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: contentType });
    } catch (error) {
      logger.error(
        "Failed to decode base64",
        {
          error: error.message,
          base64Length: base64String.length,
          cleanedLength: cleanBase64.length,
          startsWidth: base64String.substring(0, 50),
        },
        "ScreenshotManager",
      );
      throw error;
    }
  }

  /**
   * Save screenshot to IndexedDB
   */
  async saveToIndexedDB(nodeId, timing, blob) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const data = {
        id: `${nodeId}-${timing}`,
        nodeId,
        timing,
        blob,
        timestamp: new Date().toISOString(),
        size: blob.size,
      };

      const request = store.put(data);

      request.onsuccess = () => {
        logger.debug(
          "Screenshot saved to IndexedDB",
          { nodeId, timing },
          "ScreenshotManager",
        );
        resolve();
      };

      request.onerror = () => {
        logger.error(
          "Failed to save screenshot",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };
    });
  }

  /**
   * Load screenshot from IndexedDB
   */
  async loadFromIndexedDB(nodeId, timing) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`${nodeId}-${timing}`);

      request.onsuccess = () => {
        if (request.result) {
          logger.debug(
            "Screenshot loaded from IndexedDB",
            { nodeId, timing },
            "ScreenshotManager",
          );
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error(
          "Failed to load screenshot",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };
    });
  }

  /**
   * Save screenshot (main method)
   * @param {string} nodeId - Node ID
   * @param {string} timing - 'before' or 'after'
   * @param {string} imageData - Base64 encoded image
   * @returns {Promise<Object>} Screenshot metadata with Blob URL
   */
  async saveScreenshot(nodeId, timing, imageData) {
    try {
      // 1. Convert base64 to Blob
      const blob = this.base64ToBlob(imageData);

      // 2. Create Blob URL for immediate rendering
      const blobUrl = URL.createObjectURL(blob);

      // 3. Save to IndexedDB for persistence
      await this.saveToIndexedDB(nodeId, timing, blob);

      // 4. Cache in memory
      const cacheKey = `${nodeId}-${timing}`;
      this.cache.set(cacheKey, blobUrl);

      return {
        url: blobUrl,
        timestamp: new Date().toISOString(),
        size: blob.size,
      };
    } catch (error) {
      logger.error("Failed to save screenshot", error, "ScreenshotManager");
      throw error;
    }
  }

  /**
   * Load screenshot (main method)
   * @param {string} nodeId - Node ID
   * @param {string} timing - 'before' or 'after'
   * @returns {Promise<string|null>} Blob URL or null
   */
  async loadScreenshot(nodeId, timing) {
    try {
      const cacheKey = `${nodeId}-${timing}`;

      // 1. Check in-memory cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug(
          "Screenshot loaded from cache",
          { nodeId, timing },
          "ScreenshotManager",
        );
        return cached;
      }

      // 2. Load from IndexedDB
      const blob = await this.loadFromIndexedDB(nodeId, timing);
      if (!blob) {
        return null;
      }

      // 3. Create Blob URL and cache
      const blobUrl = URL.createObjectURL(blob);
      this.cache.set(cacheKey, blobUrl);

      return blobUrl;
    } catch (error) {
      logger.error("Failed to load screenshot", error, "ScreenshotManager");
      return null;
    }
  }

  /**
   * Delete a specific screenshot
   * @param {string} nodeId - Node ID
   * @param {string} timing - 'before' or 'after'
   */
  async deleteScreenshot(nodeId, timing) {
    try {
      const cacheKey = `${nodeId}-${timing}`;

      // 1. Revoke Blob URL from cache
      const cachedUrl = this.cache.get(cacheKey);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        this.cache.delete(cacheKey);
        logger.debug(
          "Blob URL revoked",
          { nodeId, timing },
          "ScreenshotManager",
        );
      }

      // 2. Delete from IndexedDB
      await this.deleteFromIndexedDB(nodeId, timing);

      logger.debug(
        "Screenshot deleted",
        { nodeId, timing },
        "ScreenshotManager",
      );
    } catch (error) {
      logger.error("Failed to delete screenshot", error, "ScreenshotManager");
    }
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(nodeId, timing) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const key = `${nodeId}-${timing}`;
      const request = store.delete(key);

      request.onsuccess = () => {
        logger.debug(
          "Screenshot deleted from IndexedDB",
          { nodeId, timing },
          "ScreenshotManager",
        );
        resolve();
      };

      request.onerror = () => {
        logger.error(
          "Failed to delete from IndexedDB",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };
    });
  }

  /**
   * Delete screenshots for a node
   * @param {string} nodeId - Node ID
   */
  async deleteScreenshots(nodeId) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("nodeId");
      const request = index.openCursor(IDBKeyRange.only(nodeId));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          logger.debug(
            "Screenshots deleted from IndexedDB",
            { nodeId },
            "ScreenshotManager",
          );
          resolve();
        }
      };

      request.onerror = () => {
        logger.error(
          "Failed to delete screenshots",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };
    });
  }

  /**
   * Cleanup memory for a node (revoke Blob URLs)
   * @param {string} nodeId - Node ID
   */
  cleanup(nodeId) {
    const beforeKey = `${nodeId}-before`;
    const afterKey = `${nodeId}-after`;

    const beforeUrl = this.cache.get(beforeKey);
    const afterUrl = this.cache.get(afterKey);

    if (beforeUrl) {
      URL.revokeObjectURL(beforeUrl);
      this.cache.delete(beforeKey);
    }

    if (afterUrl) {
      URL.revokeObjectURL(afterUrl);
      this.cache.delete(afterKey);
    }

    logger.debug("Blob URLs revoked", { nodeId }, "ScreenshotManager");
  }

  /**
   * Clear all screenshots (for testing/debugging)
   */
  async clearAll() {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        // Clear cache
        this.cache.forEach((url) => URL.revokeObjectURL(url));
        this.cache.clear();

        logger.debug("All screenshots cleared", null, "ScreenshotManager");
        resolve();
      };

      request.onerror = () => {
        logger.error(
          "Failed to clear screenshots",
          request.error,
          "ScreenshotManager",
        );
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const screenshotManager = new ScreenshotManager();
export default screenshotManager;
