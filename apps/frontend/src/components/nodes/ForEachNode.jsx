import React, { memo } from "react";
import { Handle, Position, useStore } from "@xyflow/react";
import {
  Repeat2,
  Shuffle,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "@/config/nodeConstants";
import { NODE_STATES } from "../hooks/flowStyles";

const MODE_ICONS = {
  sequential: Repeat2,
  parallel: Zap,
  random: Shuffle,
  single: Target,
};

const MODE_LABELS = {
  sequential: "Sequential",
  parallel: "Parallel",
  random: "Random",
  single: "Single Item",
};

const ForEachNode = ({ id, data, selected }) => {
  const { t } = useTranslation();
  // 1. Theme & State
  const state = data?.state || NODE_STATES.DEFAULT;
  const isRunning =
    state === NODE_STATES.EXECUTING || state === NODE_STATES.RUNNING;
  const isSuccess = state === NODE_STATES.SUCCESS;
  const isError = state === NODE_STATES.ERROR;

  const themeParams = CATEGORY_STYLES.purple.node;

  // 2. ForEach Config Info
  const config = data?.configuration || {};
  const executionMode = config.executionMode || "sequential";
  const source = config.source || "";
  const itemAlias = config.itemAlias || "item";

  const ModeIcon = MODE_ICONS[executionMode] || Repeat2;
  const modeLabel = MODE_LABELS[executionMode] || "Sequential";

  const getSourceLabel = () => {
    if (!source) return "No source";
    const str = typeof source === "string" ? source : JSON.stringify(source);
    return str.length > 25 ? str.substring(0, 22) + "..." : str;
  };

  // 3. Zoom level optimization
  const zoom = useStore((s) => s.transform[2]);
  const showDetails = zoom > 0.5;

  return (
    <div
      className={cn(
        "group relative min-w-[180px] max-w-[320px] rounded-lg p-3 transition-[background,border,box-shadow,transform] duration-400 select-none border-[2px]",
        themeParams.base,
        selected ? themeParams.selected : "shadow-lg",
        isError && "border-red-500 bg-red-500/10",
        isSuccess && "border-emerald-500/50",
        isRunning && "border-purple-400 animate-pulse",
      )}
    >
      {/* INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20"
      />

      {/* HEADER TINT */}
      <div className="absolute inset-x-0 top-0 h-9 bg-black/10 rounded-t-lg border-b border-black/5 dark:border-white/10" />

      {/* STATUS OVERLAY */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {isSuccess && (
          <CheckCircle size={14} className="text-emerald-400 drop-shadow-sm" />
        )}
        {isError && (
          <XCircle size={14} className="text-red-400 drop-shadow-sm" />
        )}
      </div>

      {/* HEADER CONTENT */}
      <div className="relative flex items-center gap-3 mb-1 pt-1 px-1">
        <div className="shrink-0 p-1 bg-white/10 rounded-md">
          {isRunning ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Repeat2
              size={18}
              className={cn("text-white", selected && "animate-spin-slow")}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black truncate leading-tight text-white uppercase tracking-wider">
            {data.customLabel || data.label || "ForEach"}
          </span>
          {showDetails && (
            <div className="flex flex-col gap-0.5 mt-1 border-t border-white/10 pt-1">
              {/* Execution mode badge */}
              <div className="flex items-center gap-1.5 opacity-80">
                <ModeIcon size={10} className="text-white" />
                <span className="text-[9px] font-bold text-white uppercase truncate tracking-tighter">
                  {modeLabel}
                </span>
                {executionMode === "parallel" && config.maxConcurrency && (
                  <span className="text-[8px] text-white/50 font-mono">
                    ×{config.maxConcurrency}
                  </span>
                )}
              </div>
              {/* Source info */}
              <div className="flex items-center gap-1.5 opacity-60">
                <span className="text-[9px] text-white truncate font-mono">
                  {getSourceLabel()}
                </span>
              </div>
              {/* Item alias */}
              <span className="text-[9px] font-black uppercase tracking-wider text-white/60 drop-shadow-sm">
                {`{{${itemAlias}}}`} · {data.nodeCount || 0} NODES INSIDE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DIVE-IN PROMPT */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-white/50 text-[10px] gap-3">
          <span className="italic flex items-center gap-1 truncate min-w-0">
            <MoreHorizontal size={12} className="shrink-0" />
            <span className="truncate">Double-click to edit</span>
          </span>
          <button
            onClick={() => data?.onEnterSubFlow?.(id)}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white/90 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 uppercase text-[9px]"
          >
            {t("nodes.buttons.dive_in", "Dive In")}
          </button>
        </div>
      </div>

      {/* OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20"
      />
    </div>
  );
};

function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.data?.state === nextProps.data?.state &&
    prevProps.data?.label === nextProps.data?.label &&
    prevProps.data?.customLabel === nextProps.data?.customLabel &&
    prevProps.data?.nodeCount === nextProps.data?.nodeCount &&
    prevProps.data?.flowId === nextProps.data?.flowId &&
    prevProps.data?.configuration === nextProps.data?.configuration
  );
}

export default memo(ForEachNode, arePropsEqual);
