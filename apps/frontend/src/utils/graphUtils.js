const SKIP_TYPES = new Set([
  "sticky_note",
  "discussion",
  "guide",
  "note",
  "comment",
  "annotation",
  "label",
  "input",
  "output",
]);

const MAX_REPLAY_DEPTH = 50;

export function getTopologicalPathToNode(targetNodeId, nodes, edges) {
  if (!targetNodeId || !nodes?.length) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  if (!nodeMap.has(targetNodeId)) return [];

  const ancestors = collectAncestors(targetNodeId, edges);

  const relevantIds = [...ancestors, targetNodeId];

  const relevantNodes = relevantIds
    .map((id) => nodeMap.get(id))
    .filter(
      (n) => n && !n.data?.disabled && !SKIP_TYPES.has(n.data?.type || n.type),
    );

  return topologicalSort(relevantNodes, edges);
}

function collectAncestors(targetNodeId, edges) {
  const ancestors = new Set();
  const queue = [targetNodeId];
  let depth = 0;

  while (queue.length > 0 && depth < MAX_REPLAY_DEPTH) {
    const currentId = queue.shift();
    depth++;

    const incomingEdges = edges.filter((e) => e.target === currentId);

    for (const edge of incomingEdges) {
      if (!ancestors.has(edge.source) && edge.source !== targetNodeId) {
        ancestors.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return Array.from(ancestors);
}

function topologicalSort(relevantNodes, edges) {
  if (relevantNodes.length === 0) return [];

  const nodeIds = new Set(relevantNodes.map((n) => n.id));
  const nodeMap = new Map(relevantNodes.map((n) => [n.id, n]));

  const inDegree = {};
  const adj = {};

  for (const id of nodeIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  }

  const queue = [];
  for (const id of nodeIds) {
    if (inDegree[id] === 0) {
      queue.push(id);
    }
  }

  const sorted = [];

  while (queue.length > 0) {
    const u = queue.shift();
    sorted.push(nodeMap.get(u));

    for (const v of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  if (sorted.length !== relevantNodes.length) {
    const sortedIds = new Set(sorted.map((n) => n.id));
    for (const node of relevantNodes) {
      if (!sortedIds.has(node.id)) {
        sorted.push(node);
      }
    }
  }

  return sorted;
}
