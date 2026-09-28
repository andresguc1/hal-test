// Build the canonical input snapshot for generationKey computation.
// Must match backend exactly (apps/backend/services/exporter/index.js:38-46).
// Uses Web Crypto API (browser compatible).
export async function buildGenerationKey({
  flow,
  framework,
  language,
  locale,
  usePOM,
  includeCICD,
  designPattern,
}) {
  const snapshot = JSON.stringify({
    flow,
    framework,
    language,
    locale,
    usePOM,
    includeCICD,
    designPattern,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(snapshot);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hashHex}`;
}

// Build the flow steps array from current canvas state (nodes + edges).
// This mirrors TerminalPanel's generation effect (lines 636-770).
// Returns the same structure sent to POST /export/code.
export function buildFlowStepsFromCanvas(nodes, edges) {
  const isContainer = (type) =>
    ["component", "loop", "for_each"].includes(type);

  // Map canvas nodes to export format
  const nodeMap = new Map();
  const needsResolution = []; // containers with flowId but no subNodes

  for (const node of nodes) {
    const nodeType = node.data?.type || node.type;
    const subNodes = node.data?.subNodes || [];
    const flowId = node.data?.configuration?.flowId || node.data?.flowId;

    const mapped = {
      id: node.id,
      type: nodeType,
      data: {
        configuration: node.data?.configuration || {},
        label: node.data?.label || node.data?.customLabel || node.type,
        customLabel: node.data?.customLabel,
        subNodes: subNodes,
        flowId,
        flowName: node.data?.flowName || node.data?.label,
      },
      parentNode: node.parentNode || node.parentId,
      isContainer: isContainer(nodeType),
    };

    nodeMap.set(node.id, mapped);

    if (isContainer(nodeType) && subNodes.length === 0 && flowId) {
      needsResolution.push({ node, flowId, nodeType });
    }
  }

  // Note: Sub-flow resolution (needsResolution) is async and requires
  // API calls to /export/subflow. For local generationKey computation,
  // we use the already-resolved subNodes present on the node data.
  // This is accurate because TerminalPanel's generation effect resolves
  // them before calling /export/code.

  // Build edge-based topological ordering
  const adjacency = new Map();
  const inDegree = new Map();
  nodeMap.forEach((_, id) => {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  });

  if (edges && Array.isArray(edges)) {
    edges.forEach((edge) => {
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        adjacency.get(edge.source).push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
  }

  // Kahn's algorithm for topological sort
  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });
  const sorted = [];
  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(id);
    for (const neighbor of adjacency.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }
  nodeMap.forEach((_, id) => {
    if (!sorted.includes(id)) sorted.push(id);
  });

  // Group into tree (respecting parentNode)
  const flatOrdered = sorted.map((id) => nodeMap.get(id)).filter(Boolean);
  const childMap = new Map();
  const roots = [];

  flatOrdered.forEach((node) => {
    const parentId = node.parentNode || node.parentId;
    if (parentId && nodeMap.has(parentId)) {
      if (!childMap.has(parentId)) childMap.set(parentId, []);
      childMap.get(parentId).push(node);
    } else {
      roots.push(node);
    }
  });

  function attachSubNodes(nodesList) {
    return nodesList.map((node) => {
      const children = childMap.get(node.id) || [];
      const result = { ...node };
      if (children.length > 0) {
        result.data = {
          ...result.data,
          subNodes: attachSubNodes(children),
        };
      }
      return result;
    });
  }

  return roots.map(attachSubNodes);
}
