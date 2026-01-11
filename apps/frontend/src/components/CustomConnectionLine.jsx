import React from "react";
import { getSmoothStepPath } from "@xyflow/react";

const CustomConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      {/* Glow effect layer */}
      <path
        d={edgePath}
        stroke="url(#connectionGradient)"
        strokeWidth={4}
        fill="none"
        opacity={0.6}
        filter="url(#glow)"
      />
      {/* Main connection line */}
      <path
        d={edgePath}
        stroke="var(--connection-line)"
        strokeWidth={2.5}
        fill="none"
        strokeDasharray="8 4"
        style={connectionLineStyle}
      />
      {/* SVG definitions for gradient and glow */}
      <defs>
        <linearGradient
          id="connectionGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#1a73e8" stopOpacity={0.8} />{" "}
          {/* star-blue */}
          <stop offset="100%" stopColor="#ff8c32" stopOpacity={0.9} />{" "}
          {/* hal-orange */}
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </g>
  );
};

export default CustomConnectionLine;
