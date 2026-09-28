// ─── Code Preview helpers (pure) ──────────────────────────────────────────────
// Phase 3: breadcrumb path + fold/unfold ranges, both derived from the backend
// `mappingByFile` entries (see apps/backend/services/exporter/core/BaseGenerator.js
// `buildFileMapping` for the contract of each entry).

/**
 * Build the breadcrumb path (root-most → leaf) for a target nodeId.
 *
 * Prefers a top-level occurrence (instanceKey === null) when the same nodeId is
 * reused multiple times. The chain is anchored: if an entry's instanceKey does
 * not resolve to any entry in the mapping, we stop (no infinite loop).
 *
 * @param {Array} mapping Entries of one file from `mappingByFile`.
 * @param {string|null} targetId Selected / executing node id.
 * @returns {Array|null} Ordered chain of entries, or null when no target resolves.
 */
export function buildBreadcrumb(mapping, targetId) {
  if (!Array.isArray(mapping) || !targetId) return null;

  const entry =
    mapping.find((e) => e.nodeId === targetId && e.instanceKey === null) ||
    mapping.find((e) => e.nodeId === targetId);
  if (!entry) return null;

  const chain = [entry];
  let current = entry;
  let guard = 0;
  while (current.instanceKey && guard < 50) {
    guard += 1;
    const parent = mapping.find((p) => p.nodeId === current.instanceKey);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/**
 * Compute the 0-based ranges that should collapse for a set of folded keys.
 *
 * A range only collapses when its `${fileKey}:${nodeId}` key is in `foldedKeys`
 * and spans at least two lines. Nested folded ranges are dropped: a range inside
 * an already-collapsed outer range is collapsed with its parent to avoid rendering
 * indicators inside hidden lines. Two identical reuse ranges (same nodeId, two
 * keys/occurrences) are both kept.
 *
 * @param {Array} mapping Entries of one file.
 * @param {Set} foldedKeys Folded keys (`fileKey:nodeId`).
 * @param {Function} getKey Entry → key string.
 */
export function computeFoldedRanges(mapping, foldedKeys, getKey) {
  if (!Array.isArray(mapping)) return [];

  const ranges = [];
  for (const e of mapping) {
    if (e.kind !== "composite" && e.kind !== "container") continue;
    if (!foldedKeys.has(getKey(e))) continue;
    const span = e.endLine - e.startLine + 1;
    if (span < 3) continue;
    ranges.push({
      key: getKey(e),
      nodeId: e.nodeId,
      label: e.label || null,
      childrenCount: Array.isArray(e.children) ? e.children.length : 0,
      start: e.startLine - 1,
      end: e.endLine - 1,
      hidden: span - 2,
      entry: e,
    });
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  // Outermost only (strictly larger ranges win over nested ones).
  return ranges.filter(
    (r) =>
      !ranges.some(
        (o) =>
          o !== r &&
          o.start <= r.start &&
          o.end >= r.end &&
          o.end - o.start > r.end - r.start,
      ),
  );
}

/**
 * Build the per-line view for folded ranges: a set of hidden 0-based indexes
 * (interior + closing line) and a map of header-line index → range that must
 * render the fold indicator / toggle chevron.
 *
 * @returns {{ hidden: Set<number>, headers: Map<number, object> }}
 */
export function buildFoldedLineInfo(mapping, foldedKeys, getKey) {
  const hidden = new Set();
  const headers = new Map();
  for (const range of computeFoldedRanges(mapping, foldedKeys, getKey)) {
    headers.set(range.start, range);
    for (let i = range.start + 1; i <= range.end; i += 1) hidden.add(i);
  }
  return { hidden, headers };
}
