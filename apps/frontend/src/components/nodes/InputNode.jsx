import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowRightFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";

const InputNode = ({ selected }) => {
  const colorKey = NODE_TYPE_MAP.input?.color || "gray";
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
      <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
        <div className={cn("p-1.5 rounded-md border border-white/20 bg-white/10")}>
          <ArrowRightFromLine size={16} className="text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white truncate tracking-wide">INPUT</span>
          <span className="text-[9px] text-white/60 font-medium uppercase">FROM PARENT</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
      />
    </div>
  );
};

export default memo(InputNode);
