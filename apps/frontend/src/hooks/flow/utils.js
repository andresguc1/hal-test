import { NODE_STATES, getNodeStyle } from "../../components/hooks/flowStyles";
import { deepClone } from "../../utils/flowUtils";

/**
 * Recursive Helper for Modifying Nodes Data even if they are deep inside Components
 */
export const updateNodeRecursively = (nodes, nodeId, updaterFn) => {
  if (!Array.isArray(nodes)) return nodes;
  let hasChanges = false;
  const result = nodes.map((node) => {
    if (node.id === nodeId) {
      hasChanges = true;
      return updaterFn(deepClone(node));
    }
    return node;
  });
  return hasChanges ? result : nodes;
};

/**
 * Helper to reset all nodes recursively
 */
export const resetExecutionStatesRecursively = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map((node) => {
    const newNode = deepClone(node);

    newNode.data = {
      ...(newNode.data || {}),
      state: NODE_STATES.DEFAULT,
      executed: false,
      errorDetails: null,
      error: null,
      executionTime: null,
    };
    newNode.style = getNodeStyle(NODE_STATES.DEFAULT, newNode.style);

    return newNode;
  });
};

/**
 * Orphan Detection Helper
 */
export const detectOrphans = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  // Find all Entry Points (Roots)
  const roots = nodes.filter((n) =>
    ["launch_browser", "input", "trigger"].includes(n.type),
  );
  if (roots.length === 0) return [];

  const visited = new Set();
  const queue = [...roots.map((n) => n.id)];
  roots.forEach((n) => visited.add(n.id));

  const adj = {};
  edges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adj[current] || [];
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  return nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
};
