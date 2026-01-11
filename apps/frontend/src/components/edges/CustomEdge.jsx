import React, { memo } from "react";
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
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
  const strokeWidth = selected ? 3 : 2;

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
          stroke: selected ? "url(#edge-gradient)" : "var(--connection-line)",
          strokeDasharray: selected ? "none" : "5, 5",
          opacity: 0.8,
        }}
        className={cn(
          "transition-all duration-300",
          selected && "filter drop-shadow-[0_0_3px_rgba(99,102,241,0.5)]",
        )}
      />

      {/* ANIMATED PARTICLE */}
      <circle r="3" fill="#38bdf8">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
};

export default memo(CustomEdge);
