/**
 * History Compression Utility
 * Stores diffs instead of full states to reduce memory usage
 */

import { logger } from "./logger";

/**
 * Diff types for history compression
 */
export const DiffType = {
  NODE_ADDED: "node_added",
  NODE_REMOVED: "node_removed",
  NODE_UPDATED: "node_updated",
  EDGE_ADDED: "edge_added",
  EDGE_REMOVED: "edge_removed",
  BULK_CHANGE: "bulk_change",
};

/**
 * Creates a diff between two states
 *
 * @param {Object} prevState - Previous state
 * @param {Object} newState - New state
 * @returns {Object} Diff object
 */
export function createDiff(prevState, newState) {
  const diff = {
    timestamp: Date.now(),
    changes: [],
  };

  // Compare nodes
  const prevNodeIds = new Set(prevState.nodes.map((n) => n.id));
  const newNodeIds = new Set(newState.nodes.map((n) => n.id));

  // Find added nodes
  newState.nodes.forEach((node) => {
    if (!prevNodeIds.has(node.id)) {
      diff.changes.push({
        type: DiffType.NODE_ADDED,
        nodeId: node.id,
        data: node,
      });
    } else {
      // Check if node was updated
      const prevNode = prevState.nodes.find((n) => n.id === node.id);
      if (JSON.stringify(prevNode) !== JSON.stringify(node)) {
        diff.changes.push({
          type: DiffType.NODE_UPDATED,
          nodeId: node.id,
          prev: prevNode,
          next: node,
        });
      }
    }
  });

  // Find removed nodes
  prevState.nodes.forEach((node) => {
    if (!newNodeIds.has(node.id)) {
      diff.changes.push({
        type: DiffType.NODE_REMOVED,
        nodeId: node.id,
        data: node,
      });
    }
  });

  // Compare edges
  const prevEdgeIds = new Set(prevState.edges.map((e) => e.id));
  const newEdgeIds = new Set(newState.edges.map((e) => e.id));

  // Find added edges
  newState.edges.forEach((edge) => {
    if (!prevEdgeIds.has(edge.id)) {
      diff.changes.push({
        type: DiffType.EDGE_ADDED,
        edgeId: edge.id,
        data: edge,
      });
    }
  });

  // Find removed edges
  prevState.edges.forEach((edge) => {
    if (!newEdgeIds.has(edge.id)) {
      diff.changes.push({
        type: DiffType.EDGE_REMOVED,
        edgeId: edge.id,
        data: edge,
      });
    }
  });

  return diff;
}

/**
 * Applies a diff to a state
 *
 * @param {Object} state - Current state
 * @param {Object} diff - Diff to apply
 * @param {boolean} reverse - If true, reverse the diff (for undo)
 * @returns {Object} New state
 */
export function applyDiff(state, diff, reverse = false) {
  const newState = {
    nodes: [...state.nodes],
    edges: [...state.edges],
  };

  diff.changes.forEach((change) => {
    switch (change.type) {
      case DiffType.NODE_ADDED:
        if (reverse) {
          // Remove the node
          newState.nodes = newState.nodes.filter((n) => n.id !== change.nodeId);
        } else {
          // Add the node
          newState.nodes.push(change.data);
        }
        break;

      case DiffType.NODE_REMOVED:
        if (reverse) {
          // Add the node back
          newState.nodes.push(change.data);
        } else {
          // Remove the node
          newState.nodes = newState.nodes.filter((n) => n.id !== change.nodeId);
        }
        break;

      case DiffType.NODE_UPDATED:
        if (reverse) {
          // Revert to previous version
          const idx = newState.nodes.findIndex((n) => n.id === change.nodeId);
          if (idx !== -1) {
            newState.nodes[idx] = change.prev;
          }
        } else {
          // Apply update
          const idx = newState.nodes.findIndex((n) => n.id === change.nodeId);
          if (idx !== -1) {
            newState.nodes[idx] = change.next;
          }
        }
        break;

      case DiffType.EDGE_ADDED:
        if (reverse) {
          newState.edges = newState.edges.filter((e) => e.id !== change.edgeId);
        } else {
          newState.edges.push(change.data);
        }
        break;

      case DiffType.EDGE_REMOVED:
        if (reverse) {
          newState.edges.push(change.data);
        } else {
          newState.edges = newState.edges.filter((e) => e.id !== change.edgeId);
        }
        break;

      default:
        logger.warn(
          "Unknown diff type",
          { type: change.type },
          "historyCompression",
        );
    }
  });

  return newState;
}

/**
 * Compresses history by storing only diffs
 *
 * @param {Array} history - Array of full states
 * @returns {Object} Compressed history with base state and diffs
 */
export function compressHistory(history) {
  if (history.length === 0) {
    return { base: null, diffs: [] };
  }

  const base = history[0];
  const diffs = [];

  for (let i = 1; i < history.length; i++) {
    const diff = createDiff(history[i - 1], history[i]);
    diffs.push(diff);
  }

  const originalSize = JSON.stringify(history).length;
  const compressedSize = JSON.stringify({ base, diffs }).length;
  const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  logger.debug(
    "History compressed",
    {
      originalSize,
      compressedSize,
      savings: `${savings}%`,
    },
    "historyCompression",
  );

  return { base, diffs };
}

/**
 * Decompresses history from base + diffs
 *
 * @param {Object} compressed - Compressed history
 * @returns {Array} Array of full states
 */
export function decompressHistory(compressed) {
  if (!compressed.base) {
    return [];
  }

  const history = [compressed.base];
  let currentState = compressed.base;

  compressed.diffs.forEach((diff) => {
    currentState = applyDiff(currentState, diff, false);
    history.push(currentState);
  });

  return history;
}

/**
 * Calculates memory savings from compression
 *
 * @param {Array} original - Original history
 * @param {Object} compressed - Compressed history
 * @returns {Object} Memory statistics
 */
export function calculateSavings(original, compressed) {
  const originalSize = JSON.stringify(original).length;
  const compressedSize = JSON.stringify(compressed).length;
  const savings = originalSize - compressedSize;
  const percentage = ((savings / originalSize) * 100).toFixed(1);

  return {
    originalSize,
    compressedSize,
    savings,
    percentage: `${percentage}%`,
  };
}
