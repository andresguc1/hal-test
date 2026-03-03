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
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  if (edges) {
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  }

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return {
      ...node,
      position,
    };
  });

  return [newNodes, edges];
};
