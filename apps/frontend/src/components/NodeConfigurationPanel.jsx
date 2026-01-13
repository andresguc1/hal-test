import React, { useMemo } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { X, Play, Info, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/useToast";
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
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
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
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
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
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
  ],
  hover: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".menu-item",
    },
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
  ],

  // Sync
  check: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".checkbox",
    },
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
  ],
  uncheck: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".checkbox",
    },
    { key: "takeScreenshot", label: "📸 Take Screenshot", type: "checkbox" },
  ],

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
  const toast = useToast();

  const handleStartInspector = async () => {
    try {
      const response = await fetch("/api/inspector/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browserId: null }), // Use latest/active browser
      });
      const data = await response.json();

      if (data.success) {
        toast.success(t("common.inspector_started", "Pick an element..."));
      } else {
        toast.error(data.message || "Failed to start inspector");
      }
    } catch {
      toast.error("Network error starting inspector");
    }
  };

  // Use the live node from the nodes array if available, otherwise fallback to action snapshot
  // Use the live node from the nodes array if available, otherwise fallback to action snapshot
  const activeNode = useMemo(() => {
    if (!action) return null;
    if (!nodes) return action;
    return (
      nodes.find((n) => n.id === action.nodeId || n.id === action.id) || action
    );
  }, [action, nodes]);

  // Memoize logic to prevent unnecessary re-renders
  const { safeConfig, definedInputs } = useMemo(() => {
    if (!activeNode) return {};

    const _nodeKey = activeNode.data?.type || activeNode.type;
    const _config = NODE_TYPE_MAP[_nodeKey] || NODE_TYPE_MAP.launch_browser;
    const _safeConfig = _config || { category: "default", color: "slate" };

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
      definedInputs: _definedInputs,
    };
  }, [activeNode]);

  // Local state for immediate performance (fix typing lag)
  const [localConfig, setLocalConfig] = React.useState(
    activeNode?.data?.configuration || {},
  );
  const lastSyncedConfigRef = React.useRef(
    activeNode?.data?.configuration || {},
  );
  const updateTimeoutRef = React.useRef(null);

  // Sync LOCAL <-> GLOBAL
  // 1. When switching nodes (different ID), hard reset local state.
  // 2. When external update happens (e.g. Picker updates selector), sync only if different.
  React.useEffect(() => {
    if (!activeNode) return;

    const globalConfig = activeNode?.data?.configuration || {};

    // Simple deep comparison (sufficient for config objects)
    const isDifferent =
      JSON.stringify(globalConfig) !== JSON.stringify(localConfig);
    const isJustSynced =
      JSON.stringify(globalConfig) ===
      JSON.stringify(lastSyncedConfigRef.current);

    // If global changed and it wasn't just caused by our own debounce update...
    // Or if we switched nodes entirely...
    if (
      activeNode.id !== lastSyncedConfigRef.current.nodeId ||
      (isDifferent && !isJustSynced)
    ) {
      setLocalConfig(globalConfig);
    }

    // Always update ref to track what node we are on
    if (activeNode.id !== lastSyncedConfigRef.current.nodeId) {
      lastSyncedConfigRef.current = { ...globalConfig, nodeId: activeNode.id };
    }
  }, [activeNode?.id, activeNode?.data?.configuration]);

  // Helper to handle partial configuration updates safely
  const handleConfigUpdate = (key, value) => {
    // 1. Update LOCAL state immediately (Instant Feedback)
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);

    // 2. Debounce update to GLOBAL state (Performance)
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    updateTimeoutRef.current = setTimeout(() => {
      // Track what we are sending to prevent "loop" in useEffect
      lastSyncedConfigRef.current = newConfig;

      if (activeNode) {
        updateNodeConfiguration(activeNode.id, {
          ...(activeNode.data?.configuration || {}),
          ...newConfig,
        });
      }
    }, 300);
  };

  // Cleanup
  React.useEffect(() => () => clearTimeout(updateTimeoutRef.current), []);

  if (!isVisible) return null;

  if (!activeNode) {
    return (
      <AnimatePresence>
        <Motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          className="w-80 h-full glass-panel z-[var(--z-popover)] flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
            <Info size={32} className="text-slate-500 opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            No Node Selected
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a node on the canvas to configure its settings and
            parameters.
          </p>
        </Motion.div>
      </AnimatePresence>
    );
  }

  // CRITICAL FIX: Stop event propagation to prevent ReactFlow from stealing focus
  const stopPropagation = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
  };

  const colorKey = safeConfig.color;

  const renderInput = (field) => {
    // Read from LOCAL state for performance
    const value = localConfig[field.key] ?? "";

    switch (field.type) {
      case "checkbox":
        return (
          <label
            key={field.key}
            className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 cursor-pointer hover:bg-[var(--bg-canvas)] transition-colors"
          >
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleConfigUpdate(field.key, e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-ui)] text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50 bg-[var(--bg-node)] !pointer-events-auto !cursor-pointer"
            />
            <span className="text-xs font-medium text-[var(--text-main)] select-none">
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
              className="w-full bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-[var(--text-muted)] opacity-70 !pointer-events-auto !cursor-text !select-text"
            />
          </div>
        );
      case "selector":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1 flex items-center justify-between">
              {field.label}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-indigo-400 opacity-70">
                  CSS / XPath
                </span>
                <button
                  onClick={handleStartInspector}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] transition-colors border border-indigo-500/20"
                  title="Pick Element from Browser"
                >
                  <Crosshair size={10} />
                  <span>Pick</span>
                </button>
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
                className={cn(
                  "w-full bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg px-3 py-2 pl-3 pr-8 text-xs font-mono focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-[var(--text-muted)] !pointer-events-auto !cursor-text !select-text",
                  value ? "text-indigo-400" : "text-[var(--text-main)]",
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
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
            mass: 0.8,
          }}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          className={cn(
            "w-80 h-full glass-panel z-[var(--z-popover)] flex flex-col !pointer-events-auto !cursor-auto !select-text relative",
          )}
        >
          {/* HEADER */}
          <div
            className={cn(
              "h-14 shrink-0 flex items-center justify-between px-5 border-b",
              `border-${colorKey}-500/50 bg-gradient-to-r from-${colorKey}-600/60 via-${colorKey}-600/20 to-transparent`,
            )}
          >
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold mb-0.5",
                  `text-${colorKey}-500 dark:text-${colorKey}-400`,
                )}
              >
                {safeConfig.category.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-main)] dark:text-white truncate max-w-[180px]">
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

            {/* Contextual Result Preview */}
            {(activeNode.data?.result?.screenshot ||
              activeNode.data?.screenshots?.after?.path) && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2 block flex justify-between">
                    Latest Result
                    <span className="text-[9px] opacity-70">
                      {activeNode.data.result?.timestamp || "Just now"}
                    </span>
                  </label>
                  <div className="relative group rounded-lg overflow-hidden border border-[var(--border-ui)] bg-black/20 aspect-video">
                    <img
                      src={`/api/${activeNode.data.result?.screenshot || activeNode.data.screenshots.after.path}?t=${Date.now()}`}
                      alt="Result Preview"
                      className="w-full h-full object-contain"
                      onClick={() =>
                        window.open(
                          `/api/${activeNode.data.result?.screenshot || activeNode.data.screenshots.after.path}`,
                          "_blank",
                        )
                      }
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
                        Click to Expand
                      </span>
                    </div>
                  </div>
                  {activeNode.data.result?.duration && (
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">
                        Success ({activeNode.data.result.duration}ms)
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* FOOTER ACTIONS (Themed) */}
          <div className="p-4 border-t border-[var(--border-ui)] bg-[var(--bg-panel)] shrink-0 space-y-3">
            {/* Primary Action */}
            <button
              onClick={() =>
                onExecute({
                  ...activeNode,
                  data: {
                    ...activeNode.data,
                    configuration: {
                      ...(activeNode.data?.configuration || {}),
                      ...localConfig,
                    },
                  },
                })
              }
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

// Remove React.memo wrapper to rely on internal state and parent keying
export default NodeConfigurationPanel;
