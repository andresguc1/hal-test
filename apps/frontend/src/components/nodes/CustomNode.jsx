/**
 * Marea Smart Glass Node
 * Premium "OS-Level" card design with glassmorphism and light interactions.
 */

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NODE_STATES, CATEGORY_COLORS } from "../hooks/flowStyles";
import { NODE_TYPE_TO_CATEGORY } from "../hooks/constants";
import { getNodeIcon } from "./nodeIcons";
import { NODE_CATEGORIES } from "@/config/nodeConstants";
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
  const isError =
    state === NODE_STATES.ERROR || state === "failed" || state === "error";
  const isRunning =
    state === NODE_STATES.EXECUTING ||
    state === "running" ||
    state === "executing";
  const isSuccess = state === NODE_STATES.SUCCESS || state === "success";
  const isPicking = state === NODE_STATES.PICKING || state === "picking";
  const isHealed = state === NODE_STATES.HEALED || state === "healed";
  const isSoftFailed =
    state === NODE_STATES.SOFTFAILED || state === "softfailed";

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

    // Softfailed State
    isSoftFailed &&
      "border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/30",

    // Healed State
    isHealed &&
      "border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_-3px_rgba(139,92,246,0.4)] ring-1 ring-violet-500/30",

    // Running State
    isRunning &&
      "border-blue-500/50 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]",

    // Picking/Binding State
    isPicking &&
      "ring-2 ring-sky-400 bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_-3px_rgba(14,165,233,0.4)] cursor-crosshair",
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
        style={{
          backgroundColor: isError
            ? "#ef4444"
            : isSoftFailed
              ? "#f97316"
              : isPicking
                ? "#0ea5e9"
                : isHealed
                  ? "#8b5cf6"
                  : categoryColor,
        }}
      />

      {/* 5. Main Content Area */}
      <div className="p-3 flex items-start gap-3">
        {/* Left Icon Box */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-[var(--text-muted)] backdrop-blur-sm shadow-inner"
          style={{
            color: isError
              ? "#ef4444"
              : isSoftFailed
                ? "#f97316"
                : isRunning
                  ? "#60a5fa"
                  : isPicking
                    ? "#0ea5e9"
                    : isHealed
                      ? "#8b5cf6"
                      : categoryColor,
          }}
        >
          {isRunning ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isPicking ? (
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-20"></div>
          ) : isHealed ? (
            <Sparkles size={24} className="animate-pulse" />
          ) : null}

          {isRunning || isHealed ? null : isError || isSoftFailed ? ( // Loader already rendered above
            <AlertCircle size={24} />
          ) : (
            <NodeIconComponent
              size={24}
              strokeWidth={1.5}
              className={isPicking ? "animate-pulse" : ""}
            />
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Category Label (Small Caps) */}
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5 opacity-70">
            {isPicking
              ? "BINDING MODE"
              : isHealed
                ? "SELF-HEALED"
                : NODE_CATEGORIES[categoryKey]?.label ||
                  categoryKey.replace(/_/g, " ")}
          </span>

          <h3
            className={cn(
              "text-sm font-bold text-[var(--text-main)] leading-tight truncate pr-2",
              isError && "text-red-400",
              isSoftFailed && "text-orange-400",
              isPicking && "text-sky-400",
              isHealed && "text-violet-400",
            )}
          >
            {data?.customLabel ||
              t(`nodes.labels.${data?.type}`) ||
              data?.label ||
              "Node"}
          </h3>

          {/* Dynamic Summary / Subtitle (The "Smart" part) */}
          {data?.subLabel ||
            (data?.url && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 truncate">
                {data.url}
              </span>
            )) ||
            (data?.selector && (
              <span
                className={cn(
                  "text-[10px] font-mono mt-1 truncate max-w-[150px] px-1 py-0.5 rounded border",
                  isHealed
                    ? "text-violet-500/80 bg-violet-500/10 border-violet-500/20"
                    : "text-cyan-500/80 bg-cyan-500/10 border-cyan-500/20",
                )}
              >
                {data.selector}
              </span>
            ))}
        </div>

        {isSuccess && !isHealed && (
          <CheckCircle
            size={14}
            className="text-green-500 absolute top-3 right-3 opacity-80"
          />
        )}

        {/* AI Badge */}
        {isHealed && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-lg border border-violet-400 animate-bounce-subtle z-10"
            title={`Auto-Healed: ${data.configuration?.originalValue} -> ${data.configuration?.healedValue}`}
          >
            <Sparkles size={10} fill="currentColor" />
            <span>IA</span>
          </div>
        )}

        {/* Security Shield Badge */}
        {data?.securityAlerts && data.securityAlerts.length > 0 && (
          <div
            className={cn(
              "absolute flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white shadow-lg border border-red-400 cursor-pointer hover:bg-red-500 transition-colors z-20 animate-pulse",
              isHealed ? "top-2 right-9" : "top-2 right-2",
            )}
            title={`${data.securityAlerts.length} Security Checkpoint Warnings`}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("hal:focus-node", {
                  detail: {
                    nodeId: data.id || data.nodeId || data.key,
                    autoSwitchToSecurity: true,
                  },
                }),
              );
            }}
          >
            <Shield size={10} fill="currentColor" />
          </div>
        )}

        {/* Error Detail Tooltip (Visible on Error/Softfail) */}
        {(isError || isSoftFailed) && data?.error && (
          <div className="absolute -bottom-1 left-3 right-3 translate-y-full bg-slate-900/95 backdrop-blur-md border border-red-500/30 rounded-lg p-2 text-[10px] text-red-200 shadow-2xl z-50 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5 mb-1 text-red-400 font-bold uppercase tracking-wider">
              <AlertCircle size={10} />
              <span>{isSoftFailed ? "Soft failure" : "Execution Error"}</span>
            </div>
            <div className="line-clamp-2 italic">
              {typeof data.error === "string" ? data.error : data.error.message}
            </div>
          </div>
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
