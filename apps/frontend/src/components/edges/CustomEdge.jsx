import React, { memo } from "react";
import { BaseEdge, getBezierPath } from "@xyflow/react";
import { cn } from "@/lib/utils";

import "./CustomEdge.css";

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
  // 1. Calcular la ruta curva suave (Bezier)
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || "right",
    targetX,
    targetY,
    targetPosition: targetPosition || "left",
  });

  // 2. Definir estados y colores según la regla de negocio
  const executionState = data?.executionState || "idle";

  const isRunning =
    executionState === "running" || executionState === "executing";
  const isSuccess = executionState === "success";
  const isError = executionState === "error" || executionState === "failed";
  const isHealed = executionState === "healed";
  const isSkipped = executionState === "skipped";

  // Dynamic Stroke Color (Matching User Request)
  let strokeColor = "var(--connection-line)"; // Default/Idle
  if (selected)
    strokeColor = "#6366f1"; // Indigo-500 for selection
  else if (isRunning)
    strokeColor = "#f59e0b"; // Naranja (Amber-500)
  else if (isSuccess)
    strokeColor = "#22c55e"; // Verde (Green-500)
  else if (isError)
    strokeColor = "#ef4444"; // Rojo (Red-500)
  else if (isHealed)
    strokeColor = "#facc15"; // Amarillo (Yellow-400)
  else if (isSkipped) strokeColor = "#D1D5DB"; // Gris (Gray-300)

  const strokeWidth = selected || isRunning ? 3 : 2;

  return (
    <>
      {/* Background glow path (simulated vector glow instead of expensive GPU CSS filters) */}
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
    </>
  );
};

export default memo(CustomEdge);
