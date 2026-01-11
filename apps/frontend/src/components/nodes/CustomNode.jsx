/**
 * Marea Smart Glass Node
 * Premium "OS-Level" card design with glassmorphism and light interactions.
 */

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NODE_STATES, CATEGORY_COLORS } from "../hooks/flowStyles";
import { NODE_TYPE_TO_CATEGORY } from "../hooks/constants";
import { getNodeIcon } from "./nodeIcons";
import "./CustomNode.css"; // Ensure shake animation is available

/**
 * Smart Glass Node Component
 */
function CustomNode({ data, selected }) {
  const { t } = useTranslation();
  const state = data?.state || NODE_STATES.DEFAULT;

  // 1. Determine Category & Color
  const categoryKey = NODE_TYPE_TO_CATEGORY[data?.type] || "default";
  const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  // 2. Icon
  const NodeIconComponent = getNodeIcon(data?.type, categoryKey);

  // 3. Dynamic Styles based on State
  const isError = state === NODE_STATES.ERROR;
  const isRunning = state === NODE_STATES.EXECUTING;
  const isSuccess = state === NODE_STATES.SUCCESS;

  const containerClasses = cn(
    "relative min-w-[240px] rounded-xl overflow-hidden",
    "bg-[var(--bg-node)]/80 backdrop-blur-xl", // Themed Glass Box
    "border border-[var(--border-ui)]", // Themed Glass Edge
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]", // Inner Bevel (Lighting)
    "transition-[background,border,box-shadow,opacity] duration-400 ease", // Targeted transitions (no transform!)

    // Hover State
    "hover:bg-[var(--bg-panel)] hover:border-[var(--border-ui)]/40 hover:shadow-lg",

    // Selected State
    selected &&
      "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--bg-canvas)] shadow-xl z-50",

    // Error State (Overrides everything)
    isError &&
      "border-red-500/50 bg-red-950/20 animate-shake-error ring-1 ring-red-500/30",

    // Running State
    isRunning &&
      "border-blue-500/50 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]",
  );

  return (
    <div
      className={containerClasses}
      style={{
        transition:
          "background-color 0.4s, border-color 0.4s, box-shadow 0.4s, opacity 0.4s",
      }}
    >
      {/* 4. Top Color Strip */}
      <div
        className="h-1 w-full opacity-80"
        style={{ backgroundColor: isError ? "#ef4444" : categoryColor }}
      />

      {/* 5. Main Content Area */}
      <div className="p-3 flex items-start gap-3">
        {/* Left Icon Box */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-[var(--text-muted)] backdrop-blur-sm shadow-inner"
          style={{
            color: isError ? "#ef4444" : isRunning ? "#60a5fa" : categoryColor,
          }}
        >
          {isRunning ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isError ? (
            <AlertCircle size={24} />
          ) : (
            <NodeIconComponent size={24} strokeWidth={1.5} />
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Category Label (Small Caps) */}
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5 opacity-70">
            {categoryKey.replace(/_/g, " ")}
          </span>

          {/* Node Title */}
          <h3
            className={cn(
              "text-sm font-bold text-[var(--text-main)] leading-tight truncate pr-2",
              isError && "text-red-400",
            )}
          >
            {t(`nodes.labels.${data?.type}`) || data?.label || "Node"}
          </h3>

          {/* Dynamic Summary / Subtitle (The "Smart" part) */}
          {data?.subLabel ||
            (data?.url && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 truncate">
                {data.url}
              </span>
            )) ||
            (data?.selector && (
              <span className="text-[10px] font-mono text-cyan-500/80 mt-1 truncate max-w-[150px] bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
                {data.selector}
              </span>
            ))}
        </div>

        {isSuccess && (
          <CheckCircle
            size={14}
            className="text-green-500 absolute top-3 right-3 opacity-80"
          />
        )}
      </div>

      {/* 6. Handles (Connectors) */}
      {/* Input Handle - Left */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !rounded-full !bg-cyan-500 !border-2 !border-white dark:!border-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
          "transition-transform hover:scale-125",
          selected && "!ring-2 !ring-cyan-200",
        )}
      />

      {/* Output Handle - Right */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-3 !h-3 !rounded-full !bg-cyan-500 !border-2 !border-white dark:!border-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
          "transition-transform hover:scale-125",
          selected && "!ring-2 !ring-cyan-200",
        )}
      />
    </div>
  );
}

/**
 * Performance Optimization
 */
function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data?.state === nextProps.data?.state &&
    // Deep check data only if necessary, or rely on immutability
    prevProps.data === nextProps.data
  );
}

export default memo(CustomNode, arePropsEqual);
