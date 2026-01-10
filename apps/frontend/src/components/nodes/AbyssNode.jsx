import React, { memo } from "react";
import { Handle, Position, useStore } from "@xyflow/react";
import { Code, Terminal, AlertCircle, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";

const AbyssNode = ({ data, selected, type }) => {
  // 1. Determine Node Type & Config
  const nodeKey = data.subType || data.type || type;
  const config = NODE_TYPE_MAP[nodeKey] || NODE_TYPE_MAP.launch_browser;
  const safeConfig = config || {
    category: "default",
    color: "slate",
    icon: Box,
    label: nodeKey,
  };

  // 2. Extract Color Info from CENTRAL CONFIG
  const colorKey = safeConfig.color;
  const themeParams = CATEGORY_STYLES[colorKey]
    ? CATEGORY_STYLES[colorKey].node
    : CATEGORY_STYLES.slate.node;
  const Icon = safeConfig.icon;

  // 3. Zoom Level Optimization
  const zoom = useStore((s) => s.transform[2]);
  const showDetails = zoom > 0.5;

  // 4. Styles
  return (
    <div
      className={cn(
        "group relative min-w-[160px] rounded-lg p-3 transition-all duration-200 select-none border", // base layout
        themeParams.base, // Applies BG and Base Border
        selected ? themeParams.selected : "", // Applies Select Border and Glow
        selected && "scale-[1.05] z-50", // Helper transform
        !selected && "shadow-[0_4px_10px_rgba(0,0,0,0.3)]", // Default Shadow
      )}
    >
      {/* INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
      />

      {/* HEADER */}
      {/* Header Overlay for Button Feel */}
      <div className="absolute inset-x-0 top-0 h-9 bg-black/10 rounded-t-lg border-b border-white/10" />

      <div className="relative flex items-center gap-3 mb-1 pt-1 px-1">
        {/* Icon - Always White for Contrast */}
        <Icon size={20} className="shrink-0 text-white drop-shadow-sm" />

        {/* Title */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold truncate leading-tight text-white drop-shadow-sm">
            {data.label || safeConfig.label}
          </span>
          {showDetails && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/80">
              {safeConfig.category === "network_control"
                ? "NETWORK"
                : safeConfig.category.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* BODY (Details) */}
      {showDetails && (data.selector || data.value) && (
        <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
          {data.selector && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] truncate">
              <Code size={12} className="opacity-70" />
              <span className="font-mono truncate opacity-90">
                {data.selector}
              </span>
            </div>
          )}
          {data.value && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] truncate">
              <Terminal size={12} className="opacity-70" />
              <span className="font-mono truncate opacity-90">
                "{data.value}"
              </span>
            </div>
          )}
        </div>
      )}

      {/* ERROR INDICATOR */}
      {data.error && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-red-500 z-10">
          <AlertCircle size={16} className="text-red-600 fill-current" />
        </div>
      )}

      {/* OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-3 !w-3 !h-3 !bg-white !border-[2px] !border-black/20 transition-colors"
      />
    </div>
  );
};

export default memo(AbyssNode);
