/**
 * Single-slot registry for the configuration panel's pending (debounced) write.
 *
 * The debounce lives inside NodeConfigurationPanel, but the graph is read from
 * outside it — saving, running and before-unload all need the newest typed
 * values. Registering the flusher here keeps that hand-off explicit without
 * threading a ref through every call site.
 */

let flushFn = null;

/**
 * @param {() => boolean} fn - Flushes the panel's queued write, returning
 *   `true` only when something was actually flushed.
 * @returns {() => void} Unregister callback (no-op if already replaced).
 */
export function registerPendingConfigFlush(fn) {
  flushFn = typeof fn === "function" ? fn : null;
  return () => {
    if (flushFn === fn) flushFn = null;
  };
}

/**
 * Flushes the queued node configuration write, if one exists.
 * @returns {boolean} Whether a pending write was flushed. Callers retry (only
 *   once) when this is true, because the graph state has just been updated.
 */
export function flushPendingConfigSync() {
  if (!flushFn) return false;
  try {
    return flushFn() === true;
  } catch (error) {
    console.warn("[NodeConfig] Failed to flush pending configuration:", error);
    return false;
  }
}

/** Test helper: drops any registered flusher. */
export function resetPendingConfigFlush() {
  flushFn = null;
}

export function hasPendingConfigFlush() {
  return flushFn !== null;
}
