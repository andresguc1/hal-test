import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Box, Layers, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";

const ComponentNode = ({ data, selected }) => {
  // 1. Config
  const nodeKey = "component";
  const config = NODE_TYPE_MAP[nodeKey];
  const safeConfig = config || {
    category: "composition",
    color: "gray",
    icon: Box,
    label: "Component",
  };

  // 2. Style
  const colorKey = safeConfig.color;
  const themeParams = CATEGORY_STYLES[colorKey]
    ? CATEGORY_STYLES[colorKey].node
    : CATEGORY_STYLES.gray.node;

  const showInputs = true;
  const showOutputs = true;

  // 3. Sub-flow Stats
  const subNodeCount = data.subFlow?.nodes?.length || 0;

  return (
    <div
      className={cn(
        "group relative min-w-[200px] rounded-lg p-0 transition-[background,border,box-shadow,transform] duration-200 select-none border-[2px]",
        themeParams.base,
        selected ? themeParams.selected : "shadow-lg",
      )}
    >
      {/* INPUT HANDLE */}
      {showInputs && (
        <Handle
          type="target"
          position={Position.Left}
          className="!-left-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
        />
      )}

      {/* HEADER */}
      <div className="flex items-center gap-3 p-3 bg-white/5 border-b border-white/10 rounded-t-lg">
        <div className="p-1.5 bg-white/10 rounded-md">
          <Layers size={18} className="text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white truncate">
            {data.label || "Grouped Component"}
          </span>
          <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
            {subNodeCount} NODES INSIDE
          </span>
        </div>
      </div>

      {/* BODY PROMPT */}
      <div className="p-3 bg-black/20 rounded-b-lg">
        <div className="flex items-center justify-between text-white/50 text-xs">
          <span className="italic flex items-center gap-1">
            <MoreHorizontal size={12} />
            Contains Logic
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 text-[9px] font-mono">
            DOUBLE CLICK TO EDIT
          </span>
        </div>
      </div>

      {/* OUTPUT HANDLE */}
      {showOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className="!-right-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
        />
      )}
    </div>
  );
};

export default memo(ComponentNode);
