import { NODE_STATES, getNodeStyle } from "../../components/hooks/flowStyles";

/**
 * Recursive Helper for Modifying Nodes Data even if they are deep inside Components
 */
export const updateNodeRecursively = (nodes, nodeId, updaterFn) => {
  let hasChanges = false;
  const recursiveMap = (list) => {
    return list.map((node) => {
      if (node.id === nodeId) {
        hasChanges = true;
        return updaterFn(node);
      }
      if (
        (node.type === "component" || node.data?.type === "component") &&
        node.data?.subFlow?.nodes
      ) {
        const oldSubNodes = node.data.subFlow.nodes;
        const newSubNodes = recursiveMap(oldSubNodes);
        if (oldSubNodes !== newSubNodes) {
          hasChanges = true;
          return {
            ...node,
            data: {
              ...node.data,
              subFlow: {
                ...node.data.subFlow,
                nodes: newSubNodes,
              },
            },
          };
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
  return list.map((node) => {
    let newNode = {
      ...node,
      data: {
        ...node.data,
        state: NODE_STATES.DEFAULT,
        executed: false,
        errorDetails: null,
        error: null,
        executionTime: null,
      },
      style: getNodeStyle(NODE_STATES.DEFAULT, node.style),
    };

    if (newNode.data?.subFlow?.edges) {
      newNode.data.subFlow.edges = newNode.data.subFlow.edges.map((e) => ({
        ...e,
        animated: false,
        data: { ...e.data, executionState: "default" },
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
