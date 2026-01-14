import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowLeftToLine } from "lucide-react";
import { cn } from "@/lib/utils";

const OutputNode = ({ selected }) => {
  return (
    <div
      className={cn(
        "group relative min-w-[120px] rounded-lg p-0 transition-all duration-200 select-none border-[2px]",
        "bg-slate-800 border-slate-600 shadow-md",
        selected
          ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
          : "",
      )}
    >
      {/* INPUT HANDLE (Target) - Signals flow INTO this node from the sub-flow */}
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-3 !w-3 !h-3 !bg-amber-400 !border-[2px] !border-slate-900 transition-colors"
      />

      {/* HEADER */}
      <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg justify-end text-right">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-200 truncate tracking-wide">
            OUTPUT
          </span>
          <span className="text-[9px] text-slate-400 font-medium uppercase">
            TO PARENT
          </span>
        </div>
        <div className="p-1.5 bg-amber-500/20 rounded-md border border-amber-500/30">
          <ArrowLeftToLine size={16} className="text-amber-400" />
        </div>
      </div>
    </div>
  );
};

export default memo(OutputNode);
