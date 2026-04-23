import dagre from "dagre";

const nodeWidth = 172;
const nodeHeight = 60;

/**
 * Automatically calculates the layout for the given nodes and edges.
 *
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @param {string} direction - 'TB' (Top-Bottom) or 'LR' (Left-Right)
 * @returns {Array} - Array containing [layoutedNodes, layoutedEdges]
 */
export const getLayoutedElements = (nodes, edges, direction = "LR") => {
  if (!nodes || nodes.length === 0) return [[], []];

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Distance between nodes in the same rank
    ranksep: 150, // Distance between ranks
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    // 1. Determine dynamic dimensions for the layout engine
    // If the browser has already measured the node, use those values
    let width = node.measured?.width || nodeWidth;
    let height = node.measured?.height || nodeHeight;

    // 2. Type-based height estimation (Critical for multi-output nodes like Conditional)
    const nodeType = node.data?.type || node.type;
    if (nodeType === "conditional" || nodeType === "switch") {
      const branches =
        node.data?.configuration?.branches ||
        node.data?.configuration?.cases ||
        [];
      const branchCount = Math.max(2, branches.length);
      // Stay consistent with AbyssNode.jsx height logic
      height = Math.max(80, branchCount * 40);
    } else if (nodeType === "loop") {
      width = 200;
      height = 100;
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  if (edges) {
    // 3. Sort edges by target handle order to minimize crossovers
    // This helps Dagre understand that the 'True' path (top) should ideally
    // be higher than the 'False' path (bottom).
    const sortedEdges = [...edges].sort((a, b) => {
      if (a.source === b.source && a.sourceHandle && b.sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === a.source);
        if (sourceNode) {
          const branches =
            sourceNode.data?.configuration?.branches ||
            sourceNode.data?.configuration?.cases ||
            [];
          const idxA = branches.findIndex((br) => br.id === a.sourceHandle);
          const idxB = branches.findIndex((br) => br.id === b.sourceHandle);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        }
      }
      return 0;
    });

    sortedEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  }

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Re-calculate top-left position from center position provided by Dagre
    // We use the same dimensions we gave to Dagre for consistency
    let width = node.measured?.width || nodeWidth;
    let height = node.measured?.height || nodeHeight;
    const nodeType = node.data?.type || node.type;

    if (nodeType === "conditional" || nodeType === "switch") {
      const branches =
        node.data?.configuration?.branches ||
        node.data?.configuration?.cases ||
        [];
      height = Math.max(80, Math.max(2, branches.length) * 40);
    } else if (nodeType === "loop") {
      width = 200;
      height = 100;
    }

    const position = {
      x: nodeWithPosition.x - width / 2,
      y: nodeWithPosition.y - height / 2,
    };

    return {
      ...node,
      position,
    };
  });

  return [newNodes, edges];
};
