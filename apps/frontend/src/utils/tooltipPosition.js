/**
 * Screen-space placement for the contextual node tooltip.
 *
 * Kept out of NodeTooltip.jsx so the geometry stays unit-testable and the
 * component file keeps exporting components only (react-refresh rule).
 */

/**
 * Normalises the anchor shapes callers hand over: `{rect}` from a component
 * ref, a bare `DOMRect`/bounding box (`{left,right,top}`) or a point `{x,y}`
 * used by the low-zoom cursor-following mode.
 */
export function resolveAnchorBox(anchor) {
  const source = anchor?.rect ?? anchor;
  if (!source) return { left: 0, right: 0, top: 0 };
  const left = Number.isFinite(source.left)
    ? source.left
    : Number.isFinite(source.x)
      ? source.x
      : 0;
  const right = Number.isFinite(source.right) ? source.right : left;
  const top = Number.isFinite(source.top)
    ? source.top
    : Number.isFinite(source.y)
      ? source.y
      : 0;
  return { left, right, top };
}

const EDGE_PADDING = 8;

/**
 * Places the tooltip BESIDE its anchor instead of on top of it: to the right
 * of the anchor, flipped to its left when the right edge would overflow, and
 * clamped into the viewport in both cases.
 *
 * Overlaying the anchor made the tooltip swallow clicks meant for the node
 * underneath, so the click never reached React Flow and the configuration
 * panel kept editing the previously selected node.
 */
export function resolveTooltipPosition({
  anchor,
  tipWidth,
  sideGap = 12,
  viewportWidth,
  viewportHeight,
  minTop = 6,
}) {
  const box = resolveAnchorBox(anchor);
  const fitsRight =
    box.right + sideGap + tipWidth <= viewportWidth - EDGE_PADDING;
  const fitsLeft = box.left - sideGap - tipWidth >= EDGE_PADDING;

  let left;
  if (fitsRight) {
    left = box.right + sideGap;
  } else if (fitsLeft) {
    left = box.left - sideGap - tipWidth;
  } else {
    // Neither side fits: keep the tooltip on screen next to the anchor.
    left = Math.min(
      box.right + sideGap,
      viewportWidth - tipWidth - EDGE_PADDING,
    );
  }
  left = Math.max(EDGE_PADDING, left);

  const top = Math.max(
    minTop,
    Math.min(box.top, Math.max(minTop, viewportHeight - 40)),
  );

  return { left, top };
}
