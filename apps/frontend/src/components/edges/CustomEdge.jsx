import React, { memo } from "react";
import { BaseEdge, getBezierPath } from "@xyflow/react";
import { cn } from "@/lib/utils";

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

  // 2. Definir estilos dinámicos
  const executionState = data?.executionState || "default"; // running, success, error
  const isRunning = executionState === "running";
  const isSuccess = executionState === "success";
  const isError = executionState === "error" || executionState === "failed";

  // Dynamic Stroke Color
  let strokeColor = "var(--connection-line)";
  if (selected) strokeColor = "url(#edge-gradient)";
  else if (isRunning)
    strokeColor = "#3b82f6"; // Blue-500
  else if (isSuccess)
    strokeColor = "#22c55e"; // Green-500
  else if (isError) strokeColor = "#ef4444"; // Red-500

  const strokeWidth = selected || isRunning ? 3 : 2;

  return (
    <>
      {/* Defines the gradient for the flow animation */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
          </linearGradient>
        </defs>
      </svg>

      {/* SHADOW PATH (Para darle profundidad/borde oscuro alrededor de la línea) */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: "var(--bg-canvas)", // Theme-aware background to cut through
          strokeWidth: strokeWidth + 2,
        }}
      />

      {/* MAIN PATH (La línea visible) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray: isRunning ? "5, 5" : "none",
          animation: isRunning ? "dashdraw 0.5s linear infinite" : "none",
          opacity: isSuccess ? 1 : 0.8,
          filter:
            isRunning || isSuccess
              ? `drop-shadow(0 0 3px ${strokeColor})`
              : "none",
        }}
        className={cn(
          "transition-all duration-300",
          selected && "filter drop-shadow-[0_0_3px_rgba(99,102,241,0.5)]",
        )}
      />

      {/* ANIMATED PARTICLE */}
      {(selected || isRunning) && (
        <circle r={isRunning ? 4 : 3} fill={isRunning ? "#60a5fa" : "#38bdf8"}>
          <animateMotion
            dur={isRunning ? "1s" : "2s"}
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
