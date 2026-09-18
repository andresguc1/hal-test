export const CONTAINER_TYPES = new Set(["component", "loop", "for_each"]);

/**
 * Builds the ordered list of rows for the Step Navigator, grouping container
 * steps with their composite children. Children carry their own `node_id` and
 * point at their container through `compositeNodeId`, so grouping is keyed on
 * `compositeNodeId` — not on a repeated `node_id` (which would only ever be a
 * retry). Containers whose step row is missing get a synthetic row derived from
 * the flow snapshot.
 */
export function buildStepRows(steps, snapshotNodeById = {}) {
  if (!steps || steps.length === 0) return [];

  const compositeChildren = new Map();
  steps.forEach((s, idx) => {
    if (s.compositeNodeId) {
      if (!compositeChildren.has(s.compositeNodeId)) {
        compositeChildren.set(s.compositeNodeId, []);
      }
      compositeChildren.get(s.compositeNodeId).push({ step: s, flatIdx: idx });
    }
  });

  const containerIds = new Set(compositeChildren.keys());
  steps.forEach((s) => {
    if (CONTAINER_TYPES.has(s.node_type)) {
      containerIds.add(s.node_id || s.nodeId);
    }
  });

  const rows = [];
  const rendered = new Set();
  const renderedContainers = new Set();

  const isContainerNode = (nodeId, step) =>
    containerIds.has(nodeId) ||
    compositeChildren.has(nodeId) ||
    (step && CONTAINER_TYPES.has(step.node_type));

  const renderChildren = (parentId, depth) => {
    const children = compositeChildren.get(parentId) || [];
    children.forEach((c, childIdx) => {
      if (rendered.has(c.flatIdx)) return;
      const childNodeId = c.step.node_id || c.step.nodeId;
      const childIsContainer = isContainerNode(childNodeId, c.step);
      rendered.add(c.flatIdx);
      rows.push({
        type: childIsContainer ? "container" : "child",
        step: c.step,
        flatIdx: c.flatIdx,
        depth,
        childIndex: childIdx + 1,
        childTotal: children.length,
      });
      if (childIsContainer && childNodeId) {
        renderedContainers.add(childNodeId);
        renderChildren(childNodeId, depth + 1);
      }
    });
  };

  const renderContainer = (parentId, step, flatIdx, depth = 0) => {
    rows.push({ type: "container", step, flatIdx, depth });
    renderedContainers.add(parentId);
    renderChildren(parentId, depth + 1);
  };

  for (let i = 0; i < steps.length; i++) {
    if (rendered.has(i)) continue;
    const step = steps[i];
    const nodeId = step.node_id || step.nodeId;

    if (step.compositeNodeId) {
      // Child whose container step never produced a row: synthesize it. Do not
      // mark this index as rendered — it belongs to the child, and renderChildren
      // is what renders (and marks) it.
      if (renderedContainers.has(step.compositeNodeId)) {
        rendered.add(i);
        continue;
      }
      const snapshotNode = snapshotNodeById[step.compositeNodeId];
      renderContainer(
        step.compositeNodeId,
        {
          node_id: step.compositeNodeId,
          node_type: snapshotNode?.type || "component",
          label:
            snapshotNode?.data?.customLabel ||
            snapshotNode?.data?.label ||
            "Component",
          compositeNodeId: null,
          status: step.status,
          duration_ms: null,
        },
        i,
      );
      continue;
    }

    if (containerIds.has(nodeId)) {
      if (renderedContainers.has(nodeId)) continue;
      rendered.add(i);
      renderContainer(nodeId, step, i);
      continue;
    }

    rendered.add(i);
    rows.push({ type: "step", step, flatIdx: i, depth: 0 });
  }

  return rows;
}

/**
 * Resolve a human-readable step label. Steps persist a coarse label (often the
 * node id); the flow snapshot carries the author-provided node label, which is
 * preferred so the timeline reads like the canvas the user built.
 */
export function resolveStepLabel(step, snapshotNodeById = {}) {
  if (!step) return "";
  const nodeId = step.node_id || step.nodeId;
  const snapshotNode = nodeId ? snapshotNodeById[nodeId] : null;
  const human = snapshotNode?.data?.customLabel || snapshotNode?.data?.label;
  if (human) return human;
  if (step.label && step.label !== nodeId) return step.label;
  return step.node_type || nodeId || "";
}

/**
 * Playback sequence for the replay: the `flatIdx` of each visible row in the
 * order the user sees it (containers before their children). Playing over this
 * order keeps the animation in lockstep with the timeline instead of walking
 * the raw steps array.
 */
export function replayOrder(rows) {
  return (rows || []).map((r) => r.flatIdx);
}

/**
 * Index the replay should start from when Play is pressed, within a playback
 * order. A selected mid-run step resumes there; no selection (or the final
 * step) rewinds to the start so the control works from any point in the
 * timeline instead of getting stuck at the end. Returns -1 when nothing plays.
 */
export function playbackStartIndex(order, currentIndex) {
  if (!order || order.length === 0) return -1;
  const position = order.indexOf(currentIndex);
  if (position === -1 || position >= order.length - 1) return order[0];
  return currentIndex;
}

/**
 * Next index in the playback order, or -1 when the end has been reached.
 */
export function nextPlaybackIndex(order, currentIndex) {
  if (!order || order.length === 0) return -1;
  const position = order.indexOf(currentIndex);
  if (position === -1) return order[0];
  if (position >= order.length - 1) return -1;
  return order[position + 1];
}
