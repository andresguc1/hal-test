import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Handle, Position, useStore } from "@xyflow/react";
import { Layers, MoreHorizontal, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";

const ComponentNode = ({ id: _id, data, selected }) => {
  const { t } = useTranslation();

  // 1. Config
  const nodeKey = "component";
  const config = NODE_TYPE_MAP[nodeKey];
  const safeConfig = config || {
    category: "composition",
    color: "gray",
    icon: Layers,
    label: t("nodes.labels.component", { defaultValue: "Component" }),
  };

  // 2. Style
  const colorKey = safeConfig.color;
  const themeParams = CATEGORY_STYLES[colorKey]
    ? CATEGORY_STYLES[colorKey].node
    : CATEGORY_STYLES.gray.node;

  const showInputs = true;
  const showOutputs = true;

  // 3. Zoom Level Optimization (Matches AbyssNode)
  const zoom = useStore((s) => s.transform[2]);
  const showDetails = zoom > 0.5;

  // 4. Sub-flow Stats
  const subNodeCount = data.nodeCount ?? (data.subFlow?.nodes?.length || 0);

  return (
    <div
      className={cn(
        "group relative min-w-[160px] max-w-[300px] rounded-lg p-3 transition-[background,border,box-shadow,transform] duration-400 select-none border-[2px]",
        themeParams.base,
        selected ? themeParams.selected : "shadow-lg",
        // Onboarding Glow (Matches AbyssNode)
        data.starterHint && "onboarding-glow border-sky-400/50",
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

      {/* HEADER TINT (Matches AbyssNode) */}
      <div className="absolute inset-x-0 top-0 h-9 bg-black/10 rounded-t-lg border-b border-black/5 dark:border-white/10" />

      {/* Onboarding Hint Bubble (Matches AbyssNode) */}
      {data.starterHint && showDetails && (
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none scale-90">
          <div className="relative group/hint">
            <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-sky-500/40 text-sky-100 px-4 py-3 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(56,189,248,0.15)] flex items-center gap-4 min-w-[200px] max-w-[340px] transition-all duration-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-400/20">
                <Terminal size={14} className="text-sky-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-sky-400/80 leading-none">
                  GUIDE
                </span>
                <p className="text-[11px] font-medium leading-tight text-white/90">
                  {data.starterHint}
                </p>
              </div>
            </div>
            {/* Pointer Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a]/80 border-r border-b border-sky-500/30 rotate-45 backdrop-blur-xl" />
          </div>
        </div>
      )}

      {/* HEADER CONTENT */}
      <div className="relative flex items-center gap-3 mb-1 pt-1 px-1">
        <div className="shrink-0 p-1 bg-white/10 rounded-md">
          <Layers size={18} className="text-white drop-shadow-sm" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold truncate leading-tight text-white drop-shadow-sm">
            {data.customLabel ||
              data.label ||
              t("nodes.labels.component", {
                defaultValue: "Grouped Component",
              })}
          </span>
          {showDetails && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 drop-shadow-sm">
              {subNodeCount} NODES INSIDE
            </span>
          )}
        </div>
      </div>

      {/* BODY PROMPT (Simplified) */}
      <div className="mt-3 pt-2 border-t border-white/20">
        <div className="flex items-center justify-between text-white/50 text-[10px]">
          <span className="italic flex items-center gap-1">
            <MoreHorizontal size={12} />
            Contains Logic
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 font-mono">
            DOUBLE CLICK
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

/**
 * Performance Optimization
 */
function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data?.label === nextProps.data?.label &&
    prevProps.data?.customLabel === nextProps.data?.customLabel &&
    prevProps.data?.nodeCount === nextProps.data?.nodeCount &&
    prevProps.data?.subFlow === nextProps.data?.subFlow
  );
}

export default memo(ComponentNode, arePropsEqual);
