import { NODE_STATES, getNodeStyle } from "../../components/hooks/flowStyles";
import { deepClone } from "../../utils/flowUtils";

/**
 * Recursive Helper for Modifying Nodes Data even if they are deep inside Components
 */
export const updateNodeRecursively = (nodes, nodeId, updaterFn) => {
  if (!Array.isArray(nodes)) return nodes;
  let hasChanges = false;
  const recursiveMap = (list) => {
    return list.map((node) => {
      if (node.id === nodeId) {
        hasChanges = true;
        return updaterFn(deepClone(node));
      }
      if (
        (node.type === "component" || node.data?.type === "component") &&
        node.data?.subFlow?.nodes
      ) {
        const oldSubNodes = node.data.subFlow.nodes;
        const newSubNodes = recursiveMap(oldSubNodes);
        if (oldSubNodes !== newSubNodes) {
          hasChanges = true;
          const clonedNode = deepClone(node);
          clonedNode.data = clonedNode.data || {};
          clonedNode.data.subFlow = clonedNode.data.subFlow || {};
          clonedNode.data.subFlow.nodes = newSubNodes;
          return clonedNode;
        }
      }
      return node;
    });
  };
  const result = recursiveMap(nodes);
  return hasChanges ? result : nodes;
};

/**
 * Helper to reset all nodes recursively
 */
export const resetExecutionStatesRecursively = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map((node) => {
    // Perform deep clone to avoid mutating live reference objects in nodesRef.current or subFlow
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

    if (newNode.data?.subFlow?.edges) {
      newNode.data.subFlow.edges = newNode.data.subFlow.edges.map((e) => ({
        ...e,
        animated: false,
        data: { ...(e.data || {}), executionState: "default" },
      }));
    }

    const isContainer = ["component", "loop", "for_each"].includes(
      newNode.type || newNode.data?.type,
    );
    if (isContainer && newNode.data?.subFlow?.nodes) {
      newNode.data.subFlow.nodes = resetExecutionStatesRecursively(
        newNode.data.subFlow.nodes,
      );
    }
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
