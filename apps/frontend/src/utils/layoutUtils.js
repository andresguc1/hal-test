import dagre from "dagre";

const nodeWidth = 172;
const nodeHeight = 60;

// Default spacing values (in the "vertical axis" of the layout, i.e. Y for LR).
const DEFAULT_SPACING = {
  // Minimum vertical gap between two distinct branch lanes so that
  // TRUE/1st-case remains visually separated from FALSE/2nd-case.
  branchSpacing: 60,
  // Extra vertical gap reserved around a merge target so the converging edges
  // have room to land on distinct Y positions without tangling.
  mergeSpacing: 40,
  // Base gap between sibling nodes on the same rank.
  nodesep: 60,
  // Horizontal gap between ranks (columns).
  ranksep: 90,
};

/**
 * Parses the third argument of getLayoutedElements which may be either a
 * legacy direction string ("LR" / "TB" / "RL" / "BT") or an options object.
 * Returns { direction, spacing }.
 */
function normalizeOptions(third) {
  if (third && typeof third === "object") {
    const direction = third.direction || "LR";
    return {
      direction,
      spacing: {
        branchSpacing:
          third.branchSpacing ?? DEFAULT_SPACING.branchSpacing,
        mergeSpacing: third.mergeSpacing ?? DEFAULT_SPACING.mergeSpacing,
        nodesep: third.nodesep ?? DEFAULT_SPACING.nodesep,
        ranksep: third.ranksep ?? DEFAULT_SPACING.ranksep,
      },
    };
  }
  return { direction: third || "LR", spacing: DEFAULT_SPACING };
}

/**
 * Returns the ordered list of semantic handles for a node that has branching
 * outputs (conditional / switch). Conditional tries TRUE first, then FALSE.
 * Switch keeps the case order and places "default" last. Nodes without known
 * branches return [].
 */
function getSemanticBranches(node) {
  const nodeType = node.data?.type || node.type;
  if (nodeType === "conditional") {
    const cfgBranches = node.data?.configuration?.branches || [];
    let branches = [...cfgBranches];
    if (!branches.some((b) => b.id === "false" || b.id === "FALSE")) {
      branches.push({ id: "false", label: "Else", isFallback: true });
    }
    return branches;
  }
  if (nodeType === "switch") {
    const cases = node.data?.configuration?.cases || [];
    let branches = [...cases];
    if (!branches.some((b) => b.id === "default" || b.id === "DEFAULT")) {
      branches.push({ id: "default", label: "Default", isFallback: true });
    }
    return branches;
  }
  return [];
}

/**
 * Assigns a 0-based lane index to an edge based on the source node's semantic
 * handle order. Returns -1 when the edge is not a semantic branch (or the
 * source handle is unknown), so those edges can keep dagre's natural order.
 */
function getLaneIndex(edge, nodeById) {
  const sourceNode = nodeById.get(edge.source);
  if (!sourceNode) return -1;
  const branches = getSemanticBranches(sourceNode);
  if (branches.length === 0) return -1;
  for (let i = 0; i < branches.length; i += 1) {
    const bid = String(branches[i].id ?? branches[i].label ?? "");
    const hid = String(edge.sourceHandle ?? "");
    if (bid === hid || hid === String(branches[i].label ?? "")) return i;
  }
  return -1;
}

/**
 * Nudges a node and all its reachable descendants vertically by `dy`.
 * Used by the branch-separation post-pass so a lower lane's subtree can be
 * pushed down far enough to keep lanes readable.
 */
function shiftSubtree(nodeId, dy, nodeIds, outgoingMap, positions) {
  const stack = [nodeId];
  const visited = new Set();
  while (stack.length > 0) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    const pos = positions.get(id);
    if (pos) pos.y += dy;
    const children = outgoingMap.get(id);
    if (children) {
      for (const cid of children) {
        if (nodeIds.has(cid)) stack.push(cid);
      }
    }
  }
}

/**
 * Collects the set of all nodes reachable from `root` (including root itself),
 * bounded to `nodeIds` and following `outgoingMap`.
 */
function getDescendantSet(root, nodeIds, outgoingMap) {
  const set = new Set();
  const stack = [root];
  while (stack.length > 0) {
    const id = stack.pop();
    if (set.has(id)) continue;
    set.add(id);
    const children = outgoingMap.get(id);
    if (children) {
      for (const cid of children) {
        if (nodeIds.has(cid)) stack.push(cid);
      }
    }
  }
  return set;
}

/**
 * Computes the vertical span of the nodes reachable from `root` that are NOT
 * shared with any sibling branch (i.e. not present in `sharedSet`). Shared
 * merge/convergence targets are excluded so each branch's own vertical
 * footprint can be separated without fighting over the shared node.
 */
function exclusiveSpan(root, nodeIds, outgoingMap, positions, sharedSet) {
  const stack = [root];
  const visited = new Set();
  let yMin = Infinity;
  let yMax = -Infinity;
  while (stack.length > 0) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    if (sharedSet.has(id)) continue;
    const h = positions.get(id)?.h || 0;
    const y = positions.get(id)?.y || 0;
    if (y < yMin) yMin = y;
    if (y + h > yMax) yMax = y + h;
    const children = outgoingMap.get(id);
    if (children) {
      for (const cid of children) {
        if (nodeIds.has(cid)) stack.push(cid);
      }
    }
  }
  if (yMin === Infinity) return null;
  return { yMin, yMax };
}
function getLayoutSize(node) {
  const nodeType = node.data?.type || node.type;
  let width = node.measured?.width || nodeWidth;
  let height = node.measured?.height || nodeHeight;

  if (nodeType === "conditional" || nodeType === "switch") {
    const branches = getSemanticBranches(node);
    const branchCount = Math.max(2, branches.length);
    // Matches AbyssNode.jsx minHeight: Math.max(100, branches.length * 45)
    height = Math.max(100, branchCount * 45);
  } else if (nodeType === "loop" || nodeType === "for_each") {
    width = 200;
    height = 100;
  }

  // Small padding to avoid overlap with floating UI / labels.
  width += 40;
  height += 60;

  return { width, height };
}

/**
 * Automatically calculates the layout for the given nodes and edges.
 *
 * The algorithm is a dagre (Sugiyama/hierarchical) layered layout enhanced
 * with Haltest's branch semantics:
 *   1. Deterministic: nodes and edges are ordered by id / lane index.
 *   2. Semantic lanes: conditional (TRUE/FALSE) and switch (case order /
 *      default) source handles are ordered so branch 0 sits above branch 1.
 *   3. Real sizes: node dimensions mirror the rendered node components.
 *   4. Branch separation: lanes from the same branch source are kept apart.
 *   5. Merge awareness: converging branches get extra vertical room.
 *
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @param {string|Object} third - Either a legacy direction string
 *   ('TB'/'BT'/'LR'/'RL') or an options object:
 *   { direction, branchSpacing, mergeSpacing, nodesep, ranksep }
 * @returns {Array} - Array containing [layoutedNodes, layoutedEdges]
 */
export const getLayoutedElements = (nodes, edges, third) => {
  if (!nodes || nodes.length === 0) return [[], []];

  const { direction, spacing } = normalizeOptions(third);

  const allEdges = edges || [];
  const nodeById = new Map();
  nodes.forEach((n) => nodeById.set(n.id, n));

  // Determinism: sort nodes and edges by a stable key before feeding dagre.
  const sortedNodes = [...nodes].sort((a, b) =>
    (a.id || "").localeCompare(b.id || ""),
  );
  const sortedEdges = [...allEdges].sort((a, b) => {
    const laneA = getLaneIndex(a, nodeById);
    const laneB = getLaneIndex(b, nodeById);
    if (laneA !== laneB) return laneA - laneB;
    const srcCmp = (a.source || "").localeCompare(b.source || "");
    if (srcCmp !== 0) return srcCmp;
    return (a.target || "").localeCompare(b.target || "");
  });

  const sizeById = new Map();
  sortedNodes.forEach((node) => {
    sizeById.set(node.id, getLayoutSize(node));
  });

  const isVertical = direction === "TB" || direction === "BT";

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    compound: true,
    rankdir: direction,
    align: "UL",
    ranker: "tight-tree",
    nodesep: spacing.nodesep,
    ranksep: spacing.ranksep,
    marginx: 50,
    marginy: 50,
  });

  sortedNodes.forEach((node) => {
    const { width, height } = sizeById.get(node.id);
    dagreGraph.setNode(node.id, { width, height });
    if (node.parentNode) {
      dagreGraph.setParent(node.id, node.parentNode);
    }
  });

  if (allEdges.length > 0) {
    // Weight encodes the lane: higher-priority (TRUE / first case) edges get a
    // higher weight so dagre tends to place them higher in the rank.
    const laneWeight = (lane) => (lane < 0 ? 1 : 100 - lane * 10);

    sortedEdges.forEach((edge) => {
      const lane = getLaneIndex(edge, nodeById);
      dagreGraph.setEdge(edge.source, edge.target, {
        weight: laneWeight(lane),
      });

      // Eliminate cycles early: Dagre requires DAGs for optimal layout math.
      // React Flow will still draw the edge visually.
      if (!dagre.graphlib.alg.isAcyclic(dagreGraph)) {
        dagreGraph.removeEdge(edge.source, edge.target);
        console.warn(
          `[Magic Organizer] Cycle detected and ignored for layout: ${edge.source} -> ${edge.target}`,
        );
      }
    });
  }

  dagre.layout(dagreGraph);

  // --- Post-pass: branch separation & merge awareness (LR: vertical is Y) ---
  const positions = new Map();
  const nodeIds = new Set();
  sortedNodes.forEach((node) => {
    const gNode = dagreGraph.node(node.id);
    const { width, height } = sizeById.get(node.id);
    nodeIds.add(node.id);
    positions.set(node.id, {
      // Center position from dagre, converted to top-left below.
      x: gNode.x - width / 2,
      y: gNode.y - height / 2,
      w: width,
      h: height,
    });
  });

  const outgoingMap = new Map();
  const incomingSources = new Map();
  sortedEdges.forEach((edge) => {
    if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
    outgoingMap.get(edge.source).push(edge.target);
    if (!incomingSources.has(edge.target)) {
      incomingSources.set(edge.target, new Set());
    }
    incomingSources.get(edge.target).add(edge.source);
  });

  if (!isVertical) {
    // 1. Branch separation: for every branching source, reorder and separate
    //    the per-lane subtrees so lane 0 sits above lane 1. Shared merge targets
    //    (nodes reachable from more than one lane) are excluded from each lane's
    //    span so the branches' own footprints separate cleanly before converging.
    sortedNodes.forEach((node) => {
      const branches = getSemanticBranches(node);
      if (branches.length < 2) return;
      const lanes = [];
      sortedEdges.forEach((edge) => {
        if (edge.source !== node.id) return;
        const lane = getLaneIndex(edge, nodeById);
        if (lane < 0) return;
        lanes.push({ lane, target: edge.target });
      });
      // Within this source, sort by lane (deduplicating repeated targets).
      lanes.sort((a, b) => a.lane - b.lane);
      const uniqueTargets = [];
      const seenTargets = new Set();
      for (const { lane, target } of lanes) {
        if (seenTargets.has(target)) continue;
        seenTargets.add(target);
        uniqueTargets.push({ lane, target });
      }
      if (uniqueTargets.length < 2) return;

      // Compute each lane's descendant set, then find nodes shared by 2+ lanes
      // (these are merge/convergence targets and everything downstream of them).
      const descSets = new Map();
      uniqueTargets.forEach(({ target }) => {
        descSets.set(target, getDescendantSet(target, nodeIds, outgoingMap));
      });
      const sharedSet = new Set();
      const occurrence = new Map();
      descSets.forEach((set) => {
        set.forEach((id) => occurrence.set(id, (occurrence.get(id) || 0) + 1));
      });
      occurrence.forEach((count, id) => {
        if (count > 1) sharedSet.add(id);
      });

      // Track the current max Y occupied by prior (higher) lanes so lower lanes
      // are pushed below with at least BRANCH_SPACING of separation.
      let laneCursor = -Infinity;
      for (const { target } of uniqueTargets) {
        const span = exclusiveSpan(
          target,
          nodeIds,
          outgoingMap,
          positions,
          sharedSet,
        );
        if (!span) continue;
        if (laneCursor === -Infinity) {
          laneCursor = span.yMax;
          continue;
        }
        const needed = laneCursor + spacing.branchSpacing - span.yMin;
        if (needed > 0) {
          shiftSubtree(target, needed, nodeIds, outgoingMap, positions);
        }
        const newSpan = exclusiveSpan(
          target,
          nodeIds,
          outgoingMap,
          positions,
          sharedSet,
        );
        laneCursor = Math.max(laneCursor, newSpan ? newSpan.yMax : 0);
      }
    });

    // 2. Merge positioning: convergence targets (nodes with multiple incoming
    //    edges from distinct branch sources) are placed below the bottom of
    //    their incoming branches so converging edges flow down into them
    //    instead of routing backwards across other branches. The move is
    //    collision-aware: a merge node is pushed below any other node it would
    //    otherwise overlap, and the pass iterates to a fixed point.
    //
    // Nodes in different columns can never overlap (ranksep > max node width),
    // so collision checks only need to consider same-column nodes.
    const overlapBoxes = (a, b) =>
      !(
        a.x + a.w <= b.x ||
        b.x + b.w <= a.x ||
        a.y + a.h <= b.y ||
        b.y + b.h <= a.y
      );

    // Group node ids by column center (x = position.x + width/2).
    const columnIds = new Map();
    sortedNodes.forEach((node) => {
      const p = positions.get(node.id);
      if (!p) return;
      const cx = Math.round(p.x + p.w / 2);
      if (!columnIds.has(cx)) columnIds.set(cx, []);
      columnIds.get(cx).push(node.id);
    });

    const mergeNodeIds = sortedNodes
      .filter((node) => {
        const sources = incomingSources.get(node.id);
        return sources && sources.size >= 2;
      })
      .map((node) => node.id);

    // Iterate to a fixed point: moving one merge below a neighbour may push it
    // into a further neighbour in the same column, so keep resolving.
    const MAX_ITER = Math.max(16, mergeNodeIds.length * 2);
    let moved = true;
    let iter = 0;
    while (moved && iter < MAX_ITER) {
      moved = false;
      iter += 1;
      for (const id of mergeNodeIds) {
        const p = positions.get(id);
        if (!p) continue;
        const sources = incomingSources.get(id);

        // Baseline is the current position; only ever move down.
        let desiredY = p.y;
        sources.forEach((srcId) => {
          const sp = positions.get(srcId);
          if (sp) desiredY = Math.max(desiredY, sp.y + sp.h + spacing.mergeSpacing);
        });

        if (desiredY <= p.y) continue;

        const cx = Math.round(p.x + p.w / 2);
        const siblings = columnIds.get(cx) || [];
        const candidate = { x: p.x, w: p.w, h: p.h };
        let candidateY = desiredY;
        // Push below the bottom of any same-column node we'd overlap.
        let progressed = true;
        while (progressed) {
          progressed = false;
          for (const otherId of siblings) {
            if (otherId === id) continue;
            const o = positions.get(otherId);
            if (!o) continue;
            if (overlapBoxes({ ...candidate, y: candidateY }, o)) {
              const newY = o.y + o.h + 4;
              if (newY > candidateY) {
                candidateY = newY;
                progressed = true;
              }
            }
          }
        }

        if (candidateY > p.y) {
          p.y = candidateY;
          moved = true;
        }
      }
    }
  }

  // --- Build output nodes ---
  const newNodes = sortedNodes.map((node) => {
    const p = positions.get(node.id);
    return {
      ...node,
      position: { x: p.x, y: p.y },
      ...(isVertical
        ? { targetPosition: "top", sourcePosition: "bottom" }
        : { targetPosition: "left", sourcePosition: "right" }),
    };
  });

  const newEdges = sortedEdges.map((edge) => ({ ...edge }));

  return [newNodes, newEdges];
};
