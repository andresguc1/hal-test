import React, { useMemo } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { X, Play, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "@/config/nodeConstants";

// --- CONFIGURATION SCHEMA ---
// Defines available input fields for each node type
const NODE_INPUTS = {
  // Browser
  open_url: [
    {
      key: "url",
      label: "URL",
      type: "text",
      placeholder: "https://example.com",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  launch_browser: [
    { key: "headless", label: "Headless Mode", type: "checkbox" },
    { key: "slowMo", label: "Slow Mo (ms)", type: "number", placeholder: "50" },
  ],
  resize_viewport: [
    { key: "width", label: "Width", type: "number", placeholder: "1280" },
    { key: "height", label: "Height", type: "number", placeholder: "720" },
  ],

  // User Actions
  click: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".btn-primary",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  type_text: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "input[name='q']",
    },
    {
      key: "text",
      label: "Text to Type",
      type: "text",
      placeholder: "Hello World",
    },
    { key: "delay", label: "Delay (ms)", type: "number", placeholder: "0" },
  ],
  hover: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".menu-item",
    },
  ],

  // Sync
  wait_for_timeout: [
    {
      key: "duration",
      label: "Duration (ms)",
      type: "number",
      placeholder: "1000",
    },
  ],
  wait_visible: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],

  // Diagnostics
  take_screenshot: [
    { key: "fullPage", label: "Full Page", type: "checkbox" },
    {
      key: "path",
      label: "Filename (Optional)",
      type: "text",
      placeholder: "screenshot.png",
    },
  ],

  // Default fallback
  default: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "Enter selector...",
    },
  ],
};

function NodeConfigurationPanel({
  isVisible,
  action, // The selected node data (initial snapshot)
  nodes, // Live nodes list for real-time updates
  onClose,
  onExecute,
  updateNodeConfiguration,
  onDeleteNode,
}) {
  const { t } = useTranslation();

  // Use the live node from the nodes array if available, otherwise fallback to action snapshot
  const activeNode = useMemo(() => {
    if (!action) return null;
    if (!nodes) return action;
    return nodes.find((n) => n.id === action.id) || action;
  }, [action, nodes]);

  // Memoize logic to prevent unnecessary re-renders
  const { safeConfig, themeConfig, definedInputs } = useMemo(() => {
    if (!activeNode) return {};

    const _nodeKey = activeNode.data?.type || activeNode.type;
    const _config = NODE_TYPE_MAP[_nodeKey] || NODE_TYPE_MAP.launch_browser;
    const _safeConfig = _config || { category: "default", color: "slate" };
    const _themeConfig =
      CATEGORY_STYLES[_safeConfig.color]?.panel || CATEGORY_STYLES.slate.panel;

    // Fallback to default inputs if explicit mapping doesn't exist, but try to be smart
    let _definedInputs = NODE_INPUTS[_nodeKey];
    if (!_definedInputs) {
      // Heuristic: If it sounds like an interaction, show selector
      if (
        _nodeKey.includes("click") ||
        _nodeKey.includes("wait") ||
        _nodeKey.includes("element")
      ) {
        _definedInputs = NODE_INPUTS.default;
      } else {
        _definedInputs = [];
      }
    }

    return {
      nodeKey: _nodeKey,
      safeConfig: _safeConfig,
      themeConfig: _themeConfig,
      definedInputs: _definedInputs,
    };
  }, [activeNode]);

  if (!isVisible || !activeNode) return null;

  // Helper to handle partial configuration updates safely
  const handleConfigUpdate = (key, value) => {
    const currentConfig = activeNode.data?.configuration || {};
    updateNodeConfiguration(activeNode.id, {
      ...currentConfig,
      [key]: value,
    });
  };

  // CRITICAL FIX: Stop event propagation to prevent ReactFlow from stealing focus
  const stopPropagation = (e) => {
    e.stopPropagation();
    // Also stop immediate propagation just to be safe if multiple handlers exist
    e.nativeEvent.stopImmediatePropagation?.();
  };

  const colorKey = safeConfig.color;

  const renderInput = (field) => {
    // Robust access: configuration might be undefined on new nodes
    const value = activeNode.data?.configuration?.[field.key] ?? "";

    switch (field.type) {
      case "checkbox":
        return (
          <label
            key={field.key}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-slate-950/30 cursor-pointer hover:bg-slate-950/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleConfigUpdate(field.key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50 bg-slate-900 !pointer-events-auto !cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300 select-none">
              {field.label}
            </span>
          </label>
        );
      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
              {field.label}
            </label>
            <input
              type="number"
              value={value}
              placeholder={field.placeholder}
              onChange={(e) =>
                handleConfigUpdate(field.key, parseFloat(e.target.value))
              }
              className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 !pointer-events-auto !cursor-text !select-text"
            />
          </div>
        );
      case "selector":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1 flex items-center justify-between">
              {field.label}
              <span className="text-[9px] text-indigo-400 opacity-70">
                CSS / XPath
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
                className={cn(
                  "w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 pl-3 pr-8 text-xs font-mono focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 !pointer-events-auto !cursor-text !select-text",
                  value ? "text-indigo-300" : "text-slate-200",
                )}
              />
              <div
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                  value
                    ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    : "bg-slate-700",
                )}
              />
            </div>
          </div>
        );
      default: // text
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
              {field.label}
            </label>
            <input
              type="text"
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
              className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 !pointer-events-auto !cursor-text !select-text"
            />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          className={cn(
            "w-80 h-full bg-[#0f172a]/95 backdrop-blur-xl border-l z-[100] flex flex-col shadow-2xl !pointer-events-auto !cursor-auto !select-text relative",
            themeConfig.border,
            themeConfig.shadow,
          )}
        >
          {/* HEADER */}
          <div
            className={cn(
              "h-14 shrink-0 flex items-center justify-between px-5 border-b",
              `border-${colorKey}-500/20 bg-gradient-to-r from-${colorKey}-500/20 to-transparent`,
            )}
          >
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold mb-0.5",
                  `text-${colorKey}-400`,
                )}
              >
                {safeConfig.category.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 truncate max-w-[180px]">
                  {activeNode.data?.label || safeConfig.label}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {/* Dynamic Inputs */}
            <div className="space-y-5">
              {definedInputs.length > 0 ? (
                definedInputs.map(renderInput)
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
                  <Info size={20} className="text-slate-500 mb-2" />
                  <span className="text-xs text-slate-400">
                    No configuration options available for this node type.
                  </span>
                </div>
              )}
            </div>

            {/* Debug/Info Context - Optional */}
            {/* <div className="mt-8 pt-4 border-t border-white/5">
                <div className="text-[10px] font-mono text-slate-600 break-all">
                    ID: {(activeNode.id || "").substring(0, 12)}...              </div>
            </div> */}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 border-t border-white/5 bg-[#0f172a]/90 shrink-0 space-y-3">
            {/* Primary Action */}
            <button
              onClick={() => onExecute(activeNode)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                "text-white shadow-lg active:scale-[0.98] hover:brightness-110",
                `bg-gradient-to-r from-${colorKey}-600 to-${colorKey}-500 shadow-${colorKey}-500/20`,
              )}
            >
              <Play size={14} fill="currentColor" />
              {t("common.run_node", "Run Node")}
            </button>

            <button
              onClick={() => onDeleteNode(activeNode.id)}
              className="w-full py-2 rounded-lg border border-red-500/10 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
            >
              Delete Node
            </button>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

const arePropsEqual = (prev, next) => {
  // 1. Visibility Check: If both are hidden, NO update needed (even if nodes change)
  if (!prev.isVisible && !next.isVisible) return true;

  // 2. Visibility Change: If visibility toggles, MUST update
  if (prev.isVisible !== next.isVisible) return false;

  // 3. Action/Selection Change: If the selected node ID changes, MUST update
  if (prev.action?.id !== next.action?.id) return false;

  // 4. NODES DEEP CHECK (The Performance fix)
  // We only care if the *active* node's DATA changed.
  // We explicitly IGNORE position changes (drags) to prevent jitter.

  if (prev.nodes === next.nodes) return true; // Exact ref match

  const nodeId = next.action?.id;
  if (!nodeId) return true;

  const prevNode = prev.nodes?.find((n) => n.id === nodeId);
  const nextNode = next.nodes?.find((n) => n.id === nodeId);

  // If node disappeared or appeared
  if (!prevNode || !nextNode) return false;

  // Compare DATA only (Ignore .position, .selected, etc.)
  // JSON stringify is fast enough for just the data object of one node
  return JSON.stringify(prevNode.data) === JSON.stringify(nextNode.data);
};

const NodeConfigurationPanelMemo = React.memo(
  NodeConfigurationPanel,
  arePropsEqual,
);
export default NodeConfigurationPanelMemo;
