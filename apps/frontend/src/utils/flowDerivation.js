/**
 * deriveFlowData — pure derivation of the flow list shown in the explorer.
 *
 * Given the DB flows for the current project plus the live canvas nodes, it
 * produces:
 *   - `flows`: the flow list, with live component names overlaid and any live
 *     canvas component that is not yet persisted appended.
 *   - `flowName`: the display name for the currently selected flow.
 *
 * Flows whose id is present in `deletedFlowIds` are never emitted — this
 * prevents a just-deleted flow from being resurrected by a still-alive canvas
 * node that still references it.
 */
export function deriveFlowData({
  dbFlows = [],
  nodes = [],
  currentFlowId = null,
  deletedFlowIds,
} = {}) {
  const deleted = deletedFlowIds || new Set();
  const overrideNames = new Map();

  const parseNodes = (f) => {
    if (Array.isArray(f?.nodes)) return f.nodes;
    if (typeof f?.nodes === "string") {
      try {
        const parsed = JSON.parse(f.nodes);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const isComponentNode = (n) =>
    !!(n && (n.type === "component" || n.data?.type === "component") && n.data?.flowId);

  const componentLabel = (n) =>
    n.data?.customLabel || n.data?.label || "Untitled Component";

  // 1. Scan ALL DB flows to find component nodes and extract their custom names
  dbFlows.forEach((f) => {
    parseNodes(f).forEach((n) => {
      if (isComponentNode(n)) overrideNames.set(n.data.flowId, componentLabel(n));
    });
  });

  // 2. Override with live canvas nodes (in case of unsaved edits in current flow)
  nodes.forEach((n) => {
    if (isComponentNode(n)) overrideNames.set(n.data.flowId, componentLabel(n));
  });

  // 3. Rebuild flows list with updated names
  const flowMap = new Map();
  dbFlows.forEach((f) => {
    if (deleted.has(f.id)) return;
    if (f.type === "component" && overrideNames.has(f.id)) {
      flowMap.set(f.id, { ...f, name: overrideNames.get(f.id), isLive: true });
    } else {
      flowMap.set(f.id, f);
    }
  });

  // 4. Also add any live components on canvas that might not be in DB yet
  nodes.forEach((n) => {
    if (!isComponentNode(n)) return;
    if (deleted.has(n.data.flowId)) return;
    if (!flowMap.has(n.data.flowId)) {
      flowMap.set(n.data.flowId, {
        id: n.data.flowId,
        name: componentLabel(n),
        type: "component",
        isLive: true,
      });
    }
  });

  // Determine current flow name
  let name = "No Flow Selected";
  const currentOverride = overrideNames.get(currentFlowId);
  if (currentOverride) {
    name = currentOverride;
  } else {
    const f = dbFlows.find((f) => f.id === currentFlowId);
    if (f) name = f.name;
  }

  return { flows: [...flowMap.values()], flowName: name };
}
