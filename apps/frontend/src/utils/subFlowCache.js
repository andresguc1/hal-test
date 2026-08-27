/**
 * SubFlowCache - Lightweight TTL cache for sub-flow definitions.
 * Eliminates the need for data.subFlow static copies on component nodes.
 * All component-related reads now go through this cache → BD.
 */

const DEFAULT_TTL_MS = 30_000; // 30 seconds

class SubFlowCache {
  constructor() {
    this._cache = new Map(); // key: `${projectId}:${flowId}` → { data, expiresAt }
    this._pending = new Map(); // key → Promise (dedup concurrent requests)
  }

  _key(projectId, flowId) {
    return `${projectId}:${flowId}`;
  }

  /**
   * Get a sub-flow definition, using cache when valid.
   * @param {string} projectId
   * @param {string} flowId
   * @param {Function} fetchFn - async () => flowData (typically projectManager.getFlow)
   * @param {number} [ttlMs] - cache TTL override
   * @returns {Promise<{nodes: Array, edges: Array}|null>}
   */
  async get(projectId, flowId, fetchFn, ttlMs = DEFAULT_TTL_MS) {
    if (!projectId || !flowId) return null;

    const key = this._key(projectId, flowId);
    const now = Date.now();

    // 1. Check fresh cache
    const cached = this._cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // 2. Dedup concurrent requests for the same flow
    if (this._pending.has(key)) {
      return this._pending.get(key);
    }

    // 3. Fetch from BD
    const promise = fetchFn(projectId, flowId)
      .then((data) => {
        this._cache.set(key, { data, expiresAt: Date.now() + ttlMs });
        return data;
      })
      .catch((err) => {
        console.warn(`[SubFlowCache] Failed to fetch ${flowId}:`, err.message);
        return null;
      })
      .finally(() => {
        this._pending.delete(key);
      });

    this._pending.set(key, promise);
    return promise;
  }

  /**
   * Invalidate a specific sub-flow (call after editing the sub-flow).
   */
  invalidate(projectId, flowId) {
    if (!projectId || !flowId) return;
    this._cache.delete(this._key(projectId, flowId));
  }

  /**
   * Invalidate all cached entries for a project.
   */
  invalidateAll(projectId) {
    if (!projectId) return;
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${projectId}:`)) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this._cache.clear();
    this._pending.clear();
  }
}

// Singleton
export const subFlowCache = new SubFlowCache();
