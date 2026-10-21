'use strict';

/**
 * Claves que nunca deben persistirse en node.data al backend.
 * Se strippean antes de serializar y se resetean al cargar un flujo.
 * Mantener esta lista única fuente de verdad para evitar que metadata transitoria
 * contamine el grafo (bloat JSON, FK drift, 500s en PUT).
 */
export const TRANSIENT_NODE_DATA_KEYS = [
  'state',
  'executed',
  'result',
  'screenshots',
  'executionTime',
  'error',
  'errorDetails',
  'statusMessage',
  'lastUpdate',
  'originalValue',
  'healedValue',
  'warnings',
];

/**
 * Strips transitory execution metadata from a node's data object.
 * Intended to be called before JSON serialization / sending to backend,
 * and also on flow load to reset contaminated data.
 *
 * @param {object} node - Node data object (may have a `.data` property)
 * @returns {object} Node with transient keys removed from `.data`
 */
export function stripTransientNodeData(node) {
  if (!node || !node.data) return node;
  const data = { ...node.data };
  for (const key of TRANSIENT_NODE_DATA_KEYS) {
    delete data[key];
  }
  return { ...node, data };
}

/**
 * Deep strip: also removes nested transient keys if they appear
 * in sub-objects (e.g., configuration.result).
 *
 * @param {object} node - Node data object
 * @returns {object} Node deeply stripped
 */
export function stripTransientNodeDataDeep(node) {
  if (!node || !node.data) return node;
  const data = { ...node.data };

  function stripObj(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (TRANSIENT_NODE_DATA_KEYS.includes(k)) continue;
      out[k] = typeof v === 'object' ? stripObj(v) : v;
    }
    return out;
  }

  return { ...node, data: stripObj(data) };
}

/**
 * Returns a new object where `configuration` has been stripped of
 * any transitory keys that might have leaked in.
 *
 * @param {object} config - Configuration object (may have .configuration nested)
 * @returns {object} Cleaned configuration
 */
export function stripTransientFromConfig(config) {
  if (!config || typeof config !== 'object') return config;
  const out = { ...config };
  const transientKeys = TRANSIENT_NODE_DATA_KEYS;
  for (const key of transientKeys) {
    delete out[key];
  }
  // Also strip from inner configuration if present
  if (out.configuration && typeof out.configuration === 'object') {
    for (const key of transientKeys) {
      delete out.configuration[key];
    }
  }
  return out;
}