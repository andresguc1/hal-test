import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowLeftToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";

const OutputNode = ({ selected }) => {
  const colorKey = NODE_TYPE_MAP.output?.color || "gray";
  const styles = CATEGORY_STYLES[colorKey] || CATEGORY_STYLES.gray;
  const nodeStyles = styles.node;

  return (
    <div
      className={cn(
        "group relative min-w-[120px] rounded-lg p-0 transition-all duration-200 select-none border-[2px]",
        nodeStyles.base,
        selected ? nodeStyles.selected : "",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
      />
      <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg justify-end text-right">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white truncate tracking-wide">
            OUTPUT
          </span>
          <span className="text-[9px] text-white/60 font-medium uppercase">
            TO PARENT
          </span>
        </div>
        <div
          className={cn("p-1.5 rounded-md border border-white/20 bg-white/10")}
        >
          <ArrowLeftToLine size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default memo(OutputNode);
