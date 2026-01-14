import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowRightFromLine } from "lucide-react";
import { cn } from "@/lib/utils";

const InputNode = ({ selected }) => {
  return (
    <div
      className={cn(
        "group relative min-w-[120px] rounded-lg p-0 transition-all duration-200 select-none border-[2px]",
        "bg-slate-800 border-slate-600 shadow-md",
        selected
          ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          : "",
      )}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
        <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/30">
          <ArrowRightFromLine size={16} className="text-indigo-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-200 truncate tracking-wide">
            INPUT
          </span>
          <span className="text-[9px] text-slate-400 font-medium uppercaser">
            FROM PARENT
          </span>
        </div>
      </div>

      {/* OUTPUT HANDLE (Source) - Signals flow OUT of this node into the sub-flow */}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-3 !w-3 !h-3 !bg-indigo-400 !border-[2px] !border-slate-900 transition-colors"
      />
    </div>
  );
};

export default memo(InputNode);
