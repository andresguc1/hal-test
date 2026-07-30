import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Handle,
  Position,
  useStore,
  useUpdateNodeInternals,
  useInternalNode,
} from "@xyflow/react";
import {
  Code,
  Terminal,
  AlertCircle,
  Box,
  AlertTriangle,
  Globe,
  MousePointer,
  CheckCircle,
  Sparkles,
  XCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NODE_TYPE_MAP,
  CATEGORY_STYLES,
  NODE_CATEGORIES,
} from "@/config/nodeConstants";
import {
  validateNodeConfig,
  getSmartLabel,
  truncate,
} from "@/config/validationRules";
import { useCollaboration } from "../../collaboration/CollaborationProvider";

const AbyssNode = ({ id, data, selected, type }) => {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const internalNode = useInternalNode(id);

  useEffect(() => {
    // Force measurement of handles on mount and whenever branches change
    const timer = setTimeout(() => {
      updateNodeInternals(id);
    }, 50);
    return () => clearTimeout(timer);
  }, [id, updateNodeInternals, data?.configuration?.branches]);

  // Collaboration: check if a peer is editing this node
  const { peers, isCollaborative } = useCollaboration();
  const peerEditing = React.useMemo(() => {
    if (!isCollaborative) return null;
    return peers.find((p) => p.editingNodeId === id) || null;
  }, [peers, id, isCollaborative]);

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
  const isNodeValid = validation.isValid;

  // 5. Smart Label Logic
  const smartLabel = getSmartLabel(nodeKey, data.configuration);
  // PRIORITY: Custom User Name > Smart Auto-Label > Legacy/Default
  const displayLabel =
    data.customLabel ||
    smartLabel ||
    data.label ||
    t(`nodes.labels.${nodeKey}`, { defaultValue: safeConfig.label });

  // 6. Styles & Status

  const showInputs = data.configuration?.showInputs !== false;
  const showOutputs =
    data.configuration?.showOutputs !== false && !safeConfig.terminal;

  // React Flow v12 needs this to recalculate handle positions if they render conditionally
  // or if zoom changes mount/unmount behavior unexpectedly
  React.useEffect(() => {
    // If the node is in the store but handleBounds are missing, force a re-measure!
    if (internalNode && !internalNode.internals?.handleBounds) {
      const timeout = setTimeout(() => {
        updateNodeInternals(id);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [id, data, updateNodeInternals, internalNode]);

  const isConditional = nodeKey === "conditional";
  const isSwitch = nodeKey === "switch";

  const branches = isConditional
    ? (() => {
        const configBranches = data.configuration?.branches || [];
        // Only add fallback "Else" handle if no branch with id "false" already exists
        const hasFalseBranch = configBranches.some((b) => b.id === "false");
        return hasFalseBranch
          ? configBranches
          : [
              ...configBranches,
              {
                id: "false",
                label: t("common.fallback", "Else"),
                isFallback: true,
              },
            ];
      })()
    : isSwitch
      ? [
          ...(data.configuration?.cases || []),
          {
            id: "default",
            label: t("common.default", "Default"),
            isFallback: true,
          },
        ]
      : [];

  const isSecurityMode = data.canvasViewMode === "seguridad";
  const nodeAlerts = data.securityAlerts || [];

  const { color: statusColor, shadow: statusShadow } = isSecurityMode
    ? (() => {
        const hasCriticalHigh = nodeAlerts.some(
          (a) => a.severity === "critical" || a.severity === "high",
        );
        const hasMedium = nodeAlerts.some((a) => a.severity === "medium");

        if (hasCriticalHigh) {
          return {
            color: "#ef4444",
            shadow: "0 0 25px rgba(239, 68, 68, 0.6)",
          };
        } else if (hasMedium) {
          return {
            color: "#f97316",
            shadow: "0 0 25px rgba(249, 115, 22, 0.6)",
          };
        } else {
          return {
            color: "#10b981",
            shadow: "0 0 20px rgba(16, 185, 129, 0.4)",
          };
        }
      })()
    : data.state === "success" || data.state === "error"
      ? {
          // Keep existing status styles
          color: data.state === "success" ? "#10b981" : "#ef4444",
          shadow:
            data.state === "success"
              ? "0 0 30px rgba(16,185,129,0.5)"
              : "0 0 30px rgba(239,68,68,0.5)",
        }
      : data.warnings && data.warnings.length > 0
        ? {
            color: "#eab308", // warning yellow-500
            shadow: "0 0 20px rgba(234,179,8,0.35)",
          }
        : { color: null, shadow: null };

  // Determine invalid style
  const invalidStyle = !isNodeValid
    ? "shadow-[inset_0_0_10px_rgba(239,68,68,0.4)] border-red-500/50"
    : "";

  return (
    <div
      className={cn(
        "group relative max-w-[400px] rounded-lg p-3 transition-[background,border,box-shadow,opacity] duration-400 select-none border-[2px]",
        themeParams.base,
        invalidStyle, // Add validation glow
        data.warnings &&
          data.warnings.length > 0 &&
          "warning-node-glow border-yellow-500/50",

        // Running/Executing Animation (Breathing Glow using Category Color)
        (data.state === "running" || data.state === "executing") &&
          `ring-4 ring-amber-500/30 animate-pulse`,

        // Picking Animation (Targeting)
        data.state === "picking" &&
          `ring-4 ring-sky-500/50 animate-pulse border-sky-400 z-50`,

        // Onboarding Glow (Tutorial Mode)
        data.starterHint && "onboarding-glow border-sky-400/50",

        // Selection
        selected && statusColor ? "scale-[1.05] z-50 border-[3px]" : "",
        selected && !statusColor ? themeParams.selected : "",

        // Default Shadow
        !selected &&
          !statusColor &&
          "shadow-md dark:shadow-[0_4px_10px_rgba(0,0,0,0.3)]",

        // GHOST STYLE (Phase 2)
        data.isGhost &&
          "border-dashed opacity-80 border-white/40 grayscale-[0.5]",

        // DISABLED STATE
        data.disabled && "opacity-40 grayscale brightness-75",

        // COLLABORATIVE EDITING INDICATOR
        peerEditing && "ring-2 ring-offset-1 ring-offset-transparent",
      )}
      style={{
        borderColor: statusColor || undefined,
        boxShadow: statusShadow || undefined,
        minWidth: isConditional || isSwitch ? 300 : 160,
        minHeight:
          (isConditional || isSwitch) && showOutputs
            ? Math.max(100, branches.length * 45)
            : undefined,
        transition:
          "background-color 0.4s, border-color 0.4s, box-shadow 0.4s, transform 0s", // CRITICAL: transform 0s
        ...(peerEditing
          ? { "--tw-ring-color": peerEditing.user?.color || "#fbbf24" }
          : {}),
      }}
    >
      {/* INPUT HANDLE */}
      {showInputs && (
        <Handle
          type="target"
          position={Position.Left}
          id="default"
          className="!-left-3 !bg-white !border-[2px] !border-black/20 transition-colors"
          style={{ width: 12, height: 12 }}
        />
      )}

      {/* HEADER TINT (Subtle overlay for depth) */}
      <div className="absolute inset-x-0 top-0 h-9 bg-black/10 rounded-t-lg border-b border-black/5 dark:border-white/10" />

      {/* Onboarding Hint Bubble (Premium Glassmorphic) */}
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

      {/* Picking Indicator Badge */}
      {data.state === "picking" && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white animate-bounce z-50 whitespace-nowrap flex items-center gap-1">
          <MousePointer size={10} />
          PICKING TARGET
        </div>
      )}

      {/* GHOST INDICATOR (Phase 2) */}
      {data.isGhost && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[9px] tracking-widest font-black px-3 py-1 rounded-full shadow-xl border border-white/20 z-50 whitespace-nowrap flex items-center gap-2">
          <Sparkles size={10} className="text-yellow-400" />
          GHOST ACTION
        </div>
      )}

      {/* COLLABORATIVE EDITING BADGE */}
      {peerEditing && (
        <div
          className="absolute -top-3 -left-3 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white shadow-lg border border-white/20"
          style={{ backgroundColor: peerEditing.user?.color || "#fbbf24" }}
          title={`${peerEditing.user?.name || "User"} is editing`}
        >
          <Lock size={8} />
          {(peerEditing.user?.name || "User").split(" ")[0]}
        </div>
      )}

      {/* STATUS LED & ICONS */}
      <div className="absolute -top-2.5 -right-2.5 z-20 flex gap-1.5 items-center w-max max-w-none">
        {/* VALIDATION WARNING (Priority 1) */}
        {!isNodeValid && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 cursor-help"
            title={
              validation.errors?.[0] ||
              (validation.missingField
                ? `Missing: ${validation.missingField}`
                : "Configuration Error")
            }
          >
            <AlertCircle size={10} className="shrink-0" />
            <span className="text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap">
              {t("nodes.status.invalid", "Invalid")}
            </span>
          </div>
        )}

        {(data.state === "running" || data.state === "executing") && (
          <div
            role="status"
            aria-label="Node executing"
            className={cn(
              "w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-amber-400",
            )}
          />
        )}

        {/* Success: Checkmark */}
        {data.state === "success" && (
          <div
            className="bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-emerald-400 animate-in zoom-in-50 duration-200"
            role="img"
            aria-label="Node succeeded"
          >
            <CheckCircle size={14} strokeWidth={3} />
          </div>
        )}

        {/* Error: Badge */}
        {data.state === "error" && isNodeValid && (
          <div
            className="bg-red-500 text-white rounded-full p-0.5 shadow-lg border border-red-400 animate-in zoom-in-50 duration-200"
            role="img"
            aria-label="Node failed"
          >
            <XCircle size={14} strokeWidth={3} />
          </div>
        )}

        {/* Neutral/Ready LED - Only show if NO active state and valid */}
        {(!data.state ||
          (data.state !== "executing" &&
            data.state !== "running" &&
            data.state !== "success" &&
            data.state !== "error")) &&
          isNodeValid && (
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full border border-white/20 bg-slate-600",
              )}
              role="img"
              aria-label="Node ready"
            />
          )}
      </div>

      {/* SCANNING EFFECT (Running/Executing) */}
      {(data.state === "running" || data.state === "executing") && (
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

      <div
        className={cn(
          (isConditional || isSwitch) && showOutputs && "pr-[135px]",
        )}
      >
        <div className="relative flex items-center gap-3 mb-1 pt-1 px-1">
          <Icon size={20} className="shrink-0 text-white drop-shadow-sm" />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold truncate leading-tight text-white drop-shadow-sm">
                {displayLabel}
              </span>
              {data.warnings && data.warnings.length > 0 && isNodeValid && (
                <div
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider cursor-help shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.6)] hover:bg-amber-400 transition-colors animate-[pulse_1.5s_infinite]"
                  title={
                    `${data.warnings.length} Warning${data.warnings.length > 1 ? "s" : ""}:` +
                    data.warnings
                      .map(
                        (w, idx) =>
                          `\n• ${typeof w === "object" ? w.message || w.rule || idx : w}`,
                      )
                      .join("")
                  }
                >
                  <AlertTriangle
                    size={10}
                    strokeWidth={3}
                    className="shrink-0"
                  />
                  <span>{data.warnings.length}</span>
                </div>
              )}
            </div>
            {showDetails && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-white drop-shadow-sm">
                {safeConfig.category === "network_control"
                  ? "NETWORK"
                  : NODE_CATEGORIES[safeConfig.category]?.label ||
                    safeConfig.category.replace("_", " ")}
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

            {/* Switch Resolved Value Badge */}
            {isSwitch &&
              data.state === "success" &&
              (data.result?.resolvedValue ??
                data.result?.data?.resolvedValue) !== undefined && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[9px] font-mono text-emerald-300/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate max-w-[180px]">
                    {truncate(
                      String(
                        data.result?.resolvedValue ??
                          data.result?.data?.resolvedValue ??
                          "",
                      ),
                      24,
                    )}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* INTEGRATED BRANCH LABELS (Inside node for clarity) */}
      {showOutputs &&
        (isConditional || isSwitch) &&
        (() => {
          const matchedPath = data.result?.path || data.result?.data?.path;
          const hasMatch = data.state === "success" && matchedPath;
          return (
            <div className="absolute inset-y-0 right-0 w-[124px] pointer-events-none flex flex-col justify-around py-4 border-l border-white/10 bg-slate-950/20 rounded-r-lg">
              {branches.map((branch, idx) => {
                const topPct = `${((idx + 1) * 100) / (branches.length + 1)}%`;
                const labelText = branch.label || branch.value || branch.id;
                const isBranchMatched = hasMatch && matchedPath === branch.id;
                const isDimmed = hasMatch && !isBranchMatched;
                return (
                  <div
                    key={`label-${branch.id || idx}`}
                    className="absolute right-2 flex items-center justify-end max-w-full"
                    style={{ top: topPct, transform: "translateY(-50%)" }}
                  >
                    <span
                      title={labelText}
                      className={cn(
                        "px-2 py-0.5 rounded-[4px] text-[9px] font-extrabold uppercase tracking-tight border shadow-md transition-all duration-300 truncate max-w-[105px] block text-center",
                        branch.isFallback
                          ? "bg-slate-800/90 text-slate-400 border-slate-700/60"
                          : "bg-slate-900/60 text-white/90 border-white/10 group-hover:bg-slate-800/80",
                        isBranchMatched &&
                          "bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/40 font-black",
                        isDimmed && "opacity-30",
                      )}
                    >
                      {labelText}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* ERROR INDICATOR (Runtime) */}
      {data.error && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-red-500 z-10">
          <AlertCircle size={16} className="text-red-600 fill-current" />
        </div>
      )}

      {/* GHOST CONFIRM BUTTON */}
      {data.isGhost && (
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onConfirmGhost) data.onConfirmGhost(data.id || id);
            }}
            className="w-full py-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-[10px] font-black tracking-wider text-white flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle size={12} className="text-emerald-400" />
            ADD TO FLOW
          </button>
        </div>
      )}

      {/* OUTPUT HANDLES */}
      {showOutputs && (isConditional || isSwitch)
        ? branches.map((branch, idx) => {
            const topPct = `${((idx + 1) * 100) / (branches.length + 1)}%`;
            const matchedPath = data.result?.path || data.result?.data?.path;
            const isBranchMatched =
              data.state === "success" && matchedPath === branch.id;
            return (
              <React.Fragment key={branch.id || idx}>
                {/* Visual port dot (Behind the handle) */}
                <div
                  className="absolute -right-1.5 w-3 h-3 z-20 pointer-events-none"
                  style={{ top: topPct, transform: "translateY(-50%)" }}
                >
                  <div
                    className={cn(
                      "w-3 h-3 border-[2px] border-[#0f172a] rounded-full transition-all duration-300",
                      isBranchMatched
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-110"
                        : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
                    )}
                  />
                </div>

                {/* Functional Handle (Extra large hit area for ergonomics) */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={branch.id || branch.label || branch.value}
                  style={{
                    top: topPct,
                    right: -10, // Offset to cover the visual dot and part of the label
                    width: 24,
                    height: 24,
                    background: "transparent",
                    border: "none",
                    zIndex: 50,
                    cursor: "crosshair",
                  }}
                  className="react-flow__handle-custom-conditional"
                />
              </React.Fragment>
            );
          })
        : showOutputs && (
            <Handle
              type="source"
              position={Position.Right}
              id="default"
              className="!-right-3 !bg-white !border-[2px] !border-black/20 transition-colors"
              style={{ width: 12, height: 12 }}
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
    prevProps.data?.state === nextProps.data?.state &&
    prevProps.data?.active === nextProps.data?.active && // allow re-render when active step changes
    JSON.stringify(prevProps.data?.configuration) ===
      JSON.stringify(nextProps.data?.configuration) &&
    prevProps.data?.error === nextProps.data?.error &&
    prevProps.data?.disabled === nextProps.data?.disabled &&
    prevProps.data?.result === nextProps.data?.result &&
    prevProps.data?.canvasViewMode === nextProps.data?.canvasViewMode &&
    JSON.stringify(prevProps.data?.securityAlerts) ===
      JSON.stringify(nextProps.data?.securityAlerts) &&
    JSON.stringify(prevProps.data?.warnings) ===
      JSON.stringify(nextProps.data?.warnings)
  );
}

export default memo(AbyssNode, arePropsEqual);
