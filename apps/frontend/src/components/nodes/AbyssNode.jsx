import React, { memo } from "react";
import { Handle, Position, useStore } from "@xyflow/react";
import {
  Code,
  Terminal,
  AlertCircle,
  Box,
  AlertTriangle,
  Globe,
  MousePointer,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_MAP, CATEGORY_STYLES } from "@/config/nodeConstants";
import {
  validateNodeConfig,
  getSmartLabel,
  truncate,
} from "@/config/validationRules";

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

  // 4. Validation Logic (SMART NODES)
  const validation = validateNodeConfig(nodeKey, data.configuration);
  const isValid = validation.isValid;

  // 5. Smart Label Logic
  const smartLabel = getSmartLabel(nodeKey, data.configuration);
  const displayLabel = smartLabel || data.label || safeConfig.label;

  // 6. Styles & Status


  const showInputs = data.configuration?.showInputs !== false;
  const showOutputs = data.configuration?.showOutputs !== false;

  const { color: statusColor, shadow: statusShadow } =
    data.state === "success" || data.state === "error"
      ? {
        // Keep existing status styles
        color: data.state === "success" ? "#10b981" : "#ef4444",
        shadow:
          data.state === "success"
            ? "0 0 30px rgba(16,185,129,0.5)"
            : "0 0 30px rgba(239,68,68,0.5)",
      }
      : { color: null, shadow: null };

  // Determine invalid style
  const invalidStyle = !isValid
    ? "shadow-[inset_0_0_10px_rgba(239,68,68,0.4)] border-red-500/50"
    : "";

  return (
    <div
      style={{
        borderColor: statusColor || undefined,
        boxShadow: statusShadow || undefined,
      }}
      className={cn(
        "group relative min-w-[160px] max-w-[300px] rounded-lg p-3 transition-all duration-500 select-none border-[2px]",
        themeParams.base,
        invalidStyle, // Add validation glow

        // Running Animation (Breathing Glow using Category Color)
        data.state === "running" &&
        `ring-4 ring-${colorKey}-500/20 animate-pulse`,

        // Selection
        selected && statusColor ? "scale-[1.05] z-50 border-[3px]" : "",
        selected && !statusColor ? themeParams.selected : "",

        // Default Shadow
        !selected && !statusColor && "shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
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
      <div className="absolute inset-x-0 top-0 h-9 bg-black/10 rounded-t-lg border-b border-white/10" />

      {/* STATUS LED & ICONS */}
      <div className="absolute -top-2 -right-2 z-20 flex gap-1.5 items-center">
        {/* VALIDATION WARNING (Priority 1) */}
        {!isValid && (
          <div className="bg-red-500 text-white rounded-full p-0.5 shadow-lg border border-red-400 animate-pulse">
            <AlertTriangle size={12} fill="currentColor" strokeWidth={3} />
          </div>
        )}

        {/* Running: Scanning Loader Ring */}
        {data.state === "running" && (
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 border-t-transparent animate-spin",
              `border-${colorKey}-400`,
            )}
          />
        )}

        {/* Success: Checkmark */}
        {data.state === "success" && (
          <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-emerald-400">
            <CheckCircle size={14} strokeWidth={3} />
          </div>
        )}

        {/* Error: LED (Only show if valid, otherwise the Triangle is enough) */}
        {data.state === "error" && isValid && (
          <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-lg animate-pulse" />
        )}

        {/* Neutral/Ready LED - Only show if NO active state and valid */}
        {!data.state && isValid && (
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full border border-white/20 bg-slate-600",
            )}
          />
        )}
      </div>

      {/* SCANNING EFFECT (Running) */}
      {data.state === "running" && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10">
          <div
            className={cn(
              "absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_1.5s_infinite]",
              `via-${colorKey}-200`,
            )}
          />
        </div>
      )}

      {/* ERROR TINT */}
      {data.state === "error" && (
        <div className="absolute inset-0 bg-red-500/10 rounded-lg pointer-events-none border border-red-500/30" />
      )}

      <div className="relative flex items-center gap-3 mb-1 pt-1 px-1">
        <Icon size={20} className="shrink-0 text-white drop-shadow-sm" />

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold truncate leading-tight text-white drop-shadow-sm">
            {displayLabel}
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
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
          {/* URL (Browser) */}
          {data.configuration?.url && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
              <Globe size={12} className="opacity-70 shrink-0" />
              <span
                className="font-mono opacity-90"
                title={data.configuration.url}
              >
                {truncate(
                  data.configuration.url.replace(/^https?:\/\//, ""),
                  28,
                )}
              </span>
            </div>
          )}

          {/* Selector (Interaction) */}
          {(data.configuration?.selector || data.selector) && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
              <MousePointer size={12} className="opacity-70 shrink-0" />
              <span
                className="font-mono opacity-90"
                title={data.configuration?.selector || data.selector}
              >
                {truncate(data.configuration?.selector || data.selector, 25)}
              </span>
            </div>
          )}

          {/* Text Value (Typing) */}
          {(data.configuration?.text || data.value) && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
              <Terminal size={12} className="opacity-70 shrink-0" />
              <span className="font-mono opacity-90">
                "{truncate(data.configuration?.text || data.value, 20)}"
              </span>
            </div>
          )}
        </div>
      )}

      {/* ERROR INDICATOR (Runtime) */}
      {data.error && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-red-500 z-10">
          <AlertCircle size={16} className="text-red-600 fill-current" />
        </div>
      )}

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

export default memo(AbyssNode);
