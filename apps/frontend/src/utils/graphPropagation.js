import { getSimulator } from "../config/nodeSimulators";
import { resolveVariables } from "./flowUtils";

/**
 * Calculates a design-time data context by propagating simulated values through the graph.
 *
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @returns {Object} { context, nodeResults }
 */
export function calculateDesignTimeContext(nodes, edges) {
  if (!nodes || nodes.length === 0) return { context: {}, nodeResults: {} };

  // 1. Build Adjacency List and In-Degree Map
  const adj = {};
  const inDegree = {};
  const nodeMap = {};

  nodes.forEach((n) => {
    const id = n.id;
    adj[id] = [];
    inDegree[id] = 0;
    nodeMap[id] = n;
  });

  edges.forEach((e) => {
    if (adj[e.source] && inDegree[e.target] !== undefined) {
      adj[e.source].push(e.target);
      inDegree[e.target]++;
    }
  });

  // 2. Topological Sort (Kahn's Algorithm)
  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const sortedIds = [];

  while (queue.length > 0) {
    const u = queue.shift();
    sortedIds.push(u);
    (adj[u] || []).forEach((v) => {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    });
  }

  // 3. Cascade Simulation
  const context = {}; // Variable context for resolveVariables (e.g. {{NodeLabel.result.url}})
  const nodeResults = {}; // id -> simulatedResult

  sortedIds.forEach((id) => {
    const node = nodeMap[id];
    if (!node) return;

    const nodeType = node.data?.type || node.type;
    const config = node.data?.configuration || {};

    // 🌟 Resolve variables in the current node's config using the context built so far
    const resolvedConfig = resolveVariables(config, context);

    // 🌟 Simulate the node's output
    const simulator = getSimulator(nodeType);
    const result = simulator(resolvedConfig, context);

    nodeResults[id] = result;

    // 🌟 Inject results into context for downstream resolution
    const nodeLabel = node.data?.customLabel || node.data?.label || id;
    const slugLabel = nodeLabel.toLowerCase().replace(/\s+/g, "_");

    const contextWrapper = {
      result,
      ...result, // Flatten for {{Node.url}} direct access if needed
    };

    context[id] = contextWrapper;
    context[nodeLabel] = contextWrapper;
    if (slugLabel !== nodeLabel) {
      context[slugLabel] = contextWrapper;
    }

    // Special case for 'variable' node to support direct {{varName}}
    if (nodeType === "variable" && config.name) {
      context[config.name] = contextWrapper;
    }
  });

  return { context, nodeResults };
}
