import React, { memo } from "react";
import { Handle, Position, useStore } from "@xyflow/react";
import {
  RefreshCw,
  Repeat,
  List,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES } from "@/config/nodeConstants";
import { NODE_STATES } from "../hooks/flowStyles";

const LoopNode = ({ data, selected }) => {
  // 1. Theme & State
  const state = data?.state || NODE_STATES.DEFAULT;
  const isRunning =
    state === NODE_STATES.EXECUTING || state === NODE_STATES.RUNNING;
  const isSuccess = state === NODE_STATES.SUCCESS;
  const isError = state === NODE_STATES.ERROR;

  const themeParams = CATEGORY_STYLES.purple.node;

  // 2. Loop Config Info
  const mode = data.configuration?.mode || "count";
  const iterations = data.configuration?.iterations || 0;
  const condition = data.configuration?.condition || "";
  const array = data.configuration?.array || "";

  const getSubLabel = () => {
    if (mode === "count") return `${iterations} iterations`;
    if (mode === "array" || mode === "forEach") return `Array: ${array}`;
    if (mode === "while") return `While: ${condition}`;
    return "Sub-flow Loop";
  };

  const Icon =
    mode === "array" || mode === "forEach"
      ? List
      : mode === "while"
        ? PlayCircle
        : Repeat;

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
            <RefreshCw
              size={18}
              className={cn("text-white", selected && "animate-spin-slow")}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black truncate leading-tight text-white uppercase tracking-wider">
            {data.customLabel || data.label || "Loop Container"}
          </span>
          {showDetails && (
            <div className="flex items-center gap-1.5 opacity-70">
              <Icon size={10} className="text-white" />
              <span className="text-[9px] font-bold text-white uppercase truncate tracking-tighter">
                {getSubLabel()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DIVE-IN PROMPT */}
      <div className="mt-3 pt-2 border-t border-white/20">
        <div className="flex items-center justify-between text-white/50 text-[10px]">
          <span className="italic flex items-center gap-1">
            <MoreHorizontal size={12} />
            Double-click to edit
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 border border-white/10 font-bold text-white/90 shadow-sm">
            DIVE IN
          </span>
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

export default memo(LoopNode);
