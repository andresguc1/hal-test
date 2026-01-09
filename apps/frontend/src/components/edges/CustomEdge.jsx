import React from "react";
import { BaseEdge, getBezierPath, useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_STATES } from "../hooks/flowStyles";

const CustomEdge = ({
  // id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  // data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get source node state to trigger animations
  const { getNode } = useReactFlow();
  const sourceNode = getNode(source);
  const isRunning = sourceNode?.data?.state === NODE_STATES.EXECUTING; // Or use data.isRunning if passed
  const isError = sourceNode?.data?.state === NODE_STATES.ERROR;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: isError ? "#ef4444" : isRunning ? "#06b6d4" : "#64748b", // Red, Cyan, or Slate-500
          strokeDasharray: isRunning ? "5,5" : "none",
          animation: isRunning ? "dashdraw 0.5s linear infinite" : "none",
        }}
        className={cn("react-flow__edge-path", isRunning && "animate-pulse")}
      />

      {/* Particle Animation (Data Packet) */}
      {isRunning && (
        <circle r="4" fill="#06b6d4">
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Inject Keyframes style for dashdraw if not present globally */}
      <style>
        {`
           @keyframes dashdraw {
             from { stroke-dashoffset: 10; }
             to { stroke-dashoffset: 0; }
           }
         `}
      </style>
    </>
  );
};

export default CustomEdge;
