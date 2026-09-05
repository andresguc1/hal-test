import React, { memo } from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";
import { cn } from "@/lib/utils";

import "./CustomEdge.css";

/**
 * Builds an orthogonal SVG path (right angles only) from source to target.
 *
 * For BYPASS edges (targetY != sourceY significantly), the strategy is:
 *   1. Exit right from source handle
 *   2. Travel right a small offset (into the ranksep gap)
 *   3. Drop FULLY down to targetY (in the gap, never through a node)
 *   4. Travel right the remaining distance to the target handle
 *
 * This is correct because the ranksep gap between columns is always empty —
 * the layout engine guarantees no node is placed there.
 *
 * @param {object} params
 * @returns {string} SVG path string
 */
function buildOrthogonalBypassPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  parallelIndex = 0,
  borderRadius = 10,
}) {
  // Small, bounded deterministic offset so parallel bypass lines fan out
  // without overlapping, while staying inside the (≈90px) empty ranksep gap.
  const laneOffset = 16 + (parallelIndex % 3) * 10; // 16, 26, 36 px
  const r = borderRadius;

  // The vertical drop happens at sourceX + laneOffset (inside the empty gap).
  const pivotX = sourceX + laneOffset;

  // Never let the pivot overshoot the midpoint of the edge (short edges).
  const clampedPivotX = Math.max(sourceX, Math.min(pivotX, (sourceX + targetX) / 2 - 10));

  // Determine if we go down or up
  const goingDown = targetY > sourceY;
  const yDir = goingDown ? 1 : -1;

  // Build path: M → short right → corner down → long vertical → corner right → target
  const d = [
    `M ${sourceX} ${sourceY}`,
    // Horizontal segment to pivot
    `L ${clampedPivotX - r} ${sourceY}`,
    // Rounded corner: turn down/up
    `Q ${clampedPivotX} ${sourceY} ${clampedPivotX} ${sourceY + yDir * r}`,
    // Vertical segment to near targetY
    `L ${clampedPivotX} ${targetY - yDir * r}`,
    // Rounded corner: turn right toward target
    `Q ${clampedPivotX} ${targetY} ${clampedPivotX + r} ${targetY}`,
    // Final horizontal segment to target
    `L ${targetX} ${targetY}`,
  ].join(" ");

  return d;
}

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) => {
  // --- ROUTING STRATEGY ---
  // Use our custom orthogonal path for bypass edges (where targetY != sourceY).
  // This guarantees the vertical segment always falls in the empty ranksep gap
  // between columns, never overlapping any intermediate node.
  //
  // For direct edges on the same horizontal axis (targetY ≈ sourceY),
  // getSmoothStepPath is fine (no intermediate nodes to dodge).

  const distanceY = Math.abs(targetY - sourceY);
  const isBypass = distanceY > 30;

  // Deterministic, bounded index used to fan out parallel bypass edges that
  // share an approximate row. Kept small (0..2) so the drop stays inside the
  // empty ranksep gap reserved by the layout engine.
  const hash = String(id || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const parallelIndex = hash % 3;

  let edgePath;

  if (isBypass) {
    edgePath = buildOrthogonalBypassPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      parallelIndex,
      borderRadius: 10,
    });
  } else {
    // Short, same-row edge — simple SmoothStep is fine (no artificial jitter,
    // which previously made parallel edges look messy).
    [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition || "right",
      targetX,
      targetY,
      targetPosition: targetPosition || "left",
      borderRadius: 10,
    });
  }

  // --- ESTADO DE EJECUCIÓN ---
  const executionState = data?.executionState || "idle";

  const isRunning =
    executionState === "running" || executionState === "executing";
  const isSuccess = executionState === "success";
  const isError = executionState === "error" || executionState === "failed";
  const isHealed = executionState === "healed";
  const isSkipped = executionState === "skipped";

  // Dynamic Stroke Color
  let strokeColor = "var(--connection-line)";
  if (selected) strokeColor = "#6366f1";
  else if (isRunning) strokeColor = "#f59e0b";
  else if (isSuccess) strokeColor = "#22c55e";
  else if (isError) strokeColor = "#ef4444";
  else if (isHealed) strokeColor = "#facc15";
  else if (isSkipped) strokeColor = "#D1D5DB";

  const strokeWidth = selected || isRunning ? 3 : 2;

  return (
    <>
      {/* Background glow path */}
      {(selected || isRunning || isSuccess || isHealed) && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: selected ? "#6366f1" : strokeColor,
            strokeWidth: strokeWidth + 4,
            opacity: 0.2,
          }}
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          opacity: isSkipped
            ? 0.3
            : isSuccess || isHealed || isRunning
              ? 1
              : 0.7,
        }}
        className={cn(
          "transition-all duration-300",
          isRunning && "edge-running",
          isSuccess && "edge-success",
          isError && "edge-error",
          isHealed && "edge-healed",
          isSkipped && "edge-skipped",
        )}
      />

      {/* ANIMATED SIGNAL PARTICLE (Only for Running/Success/Selected) */}
      {/* PERFORMANCE OPTIMIZATION: Disabled to reduce CPU usage
      {(selected || isRunning || isSuccess) && (
        <circle
          r={isRunning || isSuccess ? 4 : 3}
          fill={isRunning ? "#fcd34d" : isSuccess ? "#22c55e" : "#38bdf8"}
          className={cn((isRunning || isSuccess) && "animate-pulse")}
        >
          <animateMotion
            dur={isRunning ? "0.8s" : isSuccess ? "1.2s" : "1.5s"}
            repeatCount="indefinite"
            path={edgePath}
            calcMode="linear"
          />
        </circle>
      )}
      */}
    </>
  );
};

export default memo(CustomEdge);
