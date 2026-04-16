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
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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
  if (selected) strokeColor = "url(#edge-gradient)";
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
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      <BaseEdge
        path={edgePath}
        style={{
          stroke: "var(--bg-canvas)",
          strokeWidth: strokeWidth + 2,
        }}
      />

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
          filter:
            isRunning || isSuccess || isHealed
              ? `drop-shadow(0 0 4px ${strokeColor})`
              : "none",
        }}
        className={cn(
          "transition-all duration-300",
          isRunning && "edge-running",
          isSuccess && "edge-success",
          isError && "edge-error",
          isHealed && "edge-healed",
          isSkipped && "edge-skipped",
          selected && "filter drop-shadow-[0_0_3px_rgba(99,102,241,0.5)]",
        )}
      />

      {/* ANIMATED SIGNAL PARTICLE (Only for Running/Selected) */}
      {(selected || isRunning) && (
        <circle
          r={isRunning ? 4 : 3}
          fill={isRunning ? "#fcd34d" : "#38bdf8"}
          className={cn(isRunning && "animate-pulse")}
        >
          <animateMotion
            dur={isRunning ? "0.8s" : "1.5s"}
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
