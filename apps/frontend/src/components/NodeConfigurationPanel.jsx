import React, { useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import {
  X,
  Play,
  Info,
  Crosshair,
  Layout,
  ArrowRight,
  FileText,
  ArrowLeftRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "@/config/nodeConstants";
import { api } from "../utils/api";
import EvidenceCard from "./EvidenceCard"; // New component import

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
      required: true, // Marked as required
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
  updateNodeConfiguration,
  onDeleteNode,
  onStartPick, // New Prop from App.jsx
  onUngroup, // New Prop for Ungrouping
  _projectPath, // Unused
  _isReadOnly, // Unused
  onExecute, // Restore
}) {
  const { t } = useTranslation();
  const toast = useToast();

  // REMOVED handleStartInspector (delegated to App.jsx)

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
  // HEADER RENAMING STATE
  const [localLabel, setLocalLabel] = React.useState(
    activeNode?.data?.customLabel || activeNode?.data?.label || "",
  );

  const [lightboxUrl, setLightboxUrl] = useState(null); // Lightbox modal state
  const lastSyncedConfigRef = React.useRef(
    activeNode?.data?.configuration || {},
  );
  const updateTimeoutRef = React.useRef(null);

  // Sync LOCAL <-> GLOBAL
  // 1. When switching nodes (different ID), hard reset local state.
  // 2. When external update happens (e.g. Picker updates selector), sync only if different.
  // Sync LOCAL <-> GLOBAL
  // 1. When switching nodes (different ID), hard reset local state.
  // 2. When external update happens (e.g. Picker updates selector), sync only if it's a NEW value from outside.
  React.useEffect(() => {
    if (!activeNode) return;

    // A. Detect Node Switch
    if (activeNode.id !== lastSyncedConfigRef.current.nodeId) {
      const freshConfig = activeNode?.data?.configuration || {};
      setLocalConfig(freshConfig);
      setLocalLabel(
        activeNode.data?.customLabel || activeNode.data?.label || "",
      );

      lastSyncedConfigRef.current = { ...freshConfig, nodeId: activeNode.id };
      return;
    }

    // B. Detect External Updates (e.g. from Picker, Undo/Redo, or AI)
    const globalConfig = activeNode?.data?.configuration || {};

    // We compare what we have LOCALLY vs what is coming in.
    // We ONLY update local state if the global state is DIFFERENT from what we expected (our last sync).
    // This prevents "echoes" of our own updates from overwriting pending typing.
    const isEcho =
      JSON.stringify(globalConfig) ===
      JSON.stringify(lastSyncedConfigRef.current);

    if (!isEcho) {
      // It's a true external change (or we messed up tracking).
      // We accept it, BUT we risk losing typing if this happens exactly during typing.
      // However, typical external updates (Picking) happen when user is NOT typing.
      setLocalConfig(globalConfig);
      lastSyncedConfigRef.current = { ...globalConfig, nodeId: activeNode.id };
    }
  }, [
    activeNode?.id,
    activeNode?.data?.configuration,
    activeNode?.data?.customLabel,
    activeNode,
  ]); // DEPENDENCIES: Only specific fields, not full object!

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

  // AI AUTO-HEAL HANDLER
  const handleAutoHeal = async (failedSelector) => {
    const toastId = toast.loading("AI Fixing selector... 🧠");
    try {
      const data = await api.post("/ai/heal-selector", {
        failedSelector,
        nodeType: activeNode.type,
        // In real implementation, we would send screenshot/DOM
        error: activeNode.data?.error,
      });

      if (data.suggestion) {
        handleConfigUpdate("selector", data.suggestion);
        toast.dismiss(toastId);
        toast.success(
          `Selector repaired! (Confidence: ${data.confidence * 100}%)`,
        );
      } else {
        toast.dismiss(toastId);
        toast.error("AI could not find a solution.");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "AI Service Error");
    }
  };

  // --- VALIDATION LOGIC (Moved Up) ---
  const validationErrors = useMemo(() => {
    const errors = {};
    const inputs = definedInputs || []; // Safety check
    inputs.forEach((field) => {
      const value = localConfig[field.key];

      // 1. Required Check
      if (
        field.required &&
        (value === undefined || value === "" || value === null)
      ) {
        errors[field.key] = t("validation.required", "Required");
        return;
      }

      // Skip if empty and not required
      if (!value && value !== 0 && !field.required) return;

      // 2. Numeric Check
      if (field.type === "number") {
        // Allow variables {{...}}
        if (typeof value === "string" && value.trim().startsWith("{{")) return;

        const num = Number(value);
        if (isNaN(num)) {
          errors[field.key] = t("validation.number", "Invalid Number");
        } else if (num < 0) {
          errors[field.key] = t("validation.positive", "Positive Only");
        }
      }
    });
    return errors;
  }, [definedInputs, localConfig, t]);

  const hasErrors = Object.keys(validationErrors).length > 0;

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
    const error = validationErrors[field.key];

    switch (field.type) {
      case "checkbox": {
        // ... (existing checkbox logic kept largely same, simplified for clarity here) ...
        // Special handling for takeScreenshot: show inline preview if available
        // Special handling for takeScreenshot: show inline preview if available
        // PRIORITIZATION: 1. Historical Replay Data 2. Live Result 3. Legacy
        const screenshotUrl =
          activeNode.data?.replayData?.screenshot_path ||
          activeNode.data?.result?.screenshot ||
          activeNode.data?.screenshots?.after?.url ||
          activeNode.data?.screenshots?.after?.path;

        const hasScreenshot = field.key === "takeScreenshot" && screenshotUrl;

        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 cursor-pointer hover:bg-[var(--bg-canvas)] transition-colors">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) =>
                  handleConfigUpdate(field.key, e.target.checked)
                }
                className="w-4 h-4 rounded border-[var(--border-ui)] text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50 bg-[var(--bg-node)] !pointer-events-auto !cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--text-main)] select-none">
                {field.label}
              </span>
            </label>

            {/* EVIDENCE CARD (Abstracted) */}
            {hasScreenshot && (
              <EvidenceCard
                screenshotUrl={screenshotUrl}
                durationMs={
                  activeNode.data?.replayData?.duration_ms ||
                  activeNode.data?.result?.durationMs ||
                  activeNode.data?.result?.duration
                }
                timestamp={Date.now()} // Auto-cache bust handled by EvidenceCard
              />
            )}
          </div>
        );
      }
      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {field.label}
              </label>
              {error && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {error}
                </span>
              )}
            </div>
            <input
              type="text" // Changet to text to allow {{vars}}
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty, numbers, or variable syntax {{...}}
                handleConfigUpdate(field.key, val);
              }}
              className={cn(
                "w-full bg-[var(--bg-canvas)]/50 border rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none transition-all placeholder:text-[var(--text-muted)] opacity-70 !pointer-events-auto !cursor-text !select-text",
                error
                  ? "border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-500/5"
                  : "border-[var(--border-ui)] focus:border-indigo-500/50",
              )}
            />
          </div>
        );
      case "selector":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1 flex items-center justify-between">
              {field.label}
              <div className="flex items-center gap-2">
                {/* AI FIX BUTTON */}
                {activeNode?.data?.state === "error" && (
                  <button
                    onClick={() => handleAutoHeal(value)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors border text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 animate-pulse"
                    title="Attempt to fix selector with AI"
                  >
                    <Sparkles size={10} />
                    <span>Fix</span>
                  </button>
                )}
                <span className="text-[9px] text-indigo-400 opacity-70">
                  CSS / XPath
                </span>
                <button
                  onClick={onStartPick}
                  disabled={activeNode?.data?.state === "picking"}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors border text-[10px]",
                    activeNode?.data?.state === "picking"
                      ? "bg-sky-500/20 border-sky-500/50 text-sky-400 animate-pulse cursor-wait"
                      : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20",
                  )}
                  title="Pick Element from Browser"
                >
                  <Crosshair
                    size={10}
                    className={
                      activeNode?.data?.state === "picking"
                        ? "animate-spin"
                        : ""
                    }
                  />
                  <span>
                    {activeNode?.data?.state === "picking"
                      ? "Picking..."
                      : "Pick"}
                  </span>
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
                  error &&
                    "border-red-500/50 focus:border-red-500 bg-red-500/5",
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
            {error && (
              <span className="text-[10px] text-red-400 font-bold ml-1">
                {error}
              </span>
            )}
          </div>
        );
      default: // text
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {field.label}
              </label>
              {error && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {error}
                </span>
              )}
            </div>
            <input
              type="text"
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
              className={cn(
                "w-full bg-slate-950/50 border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none transition-all placeholder:text-slate-700 !pointer-events-auto !cursor-text !select-text",
                error
                  ? "border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-500/5"
                  : "border-white/10 focus:border-indigo-500/50",
              )}
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
              <div className="flex items-center gap-2 w-full mr-4">
                <input
                  type="text"
                  value={localLabel}
                  placeholder={activeNode.data?.label || safeConfig.label}
                  className={cn(
                    "bg-transparent border-transparent hover:border-white/10 focus:border-white/20 border-b-2 text-sm font-bold text-[var(--text-main)] dark:text-white w-full focus:outline-none transition-colors placeholder:text-white/30 placeholder:font-normal",
                  )}
                  onChange={(e) => {
                    setLocalLabel(e.target.value);

                    // MANIFIESTO: Live Update (Debounced)
                    if (updateTimeoutRef.current)
                      clearTimeout(updateTimeoutRef.current);

                    updateTimeoutRef.current = setTimeout(() => {
                      const finalLabel =
                        e.target.value.trim() === "" ? null : e.target.value;
                      if (finalLabel !== activeNode.data?.customLabel) {
                        updateNodeConfiguration(activeNode.id, {
                          ...(activeNode.data?.configuration || {}),
                          customLabel: finalLabel,
                        });
                      }
                    }, 300); // 300ms debounce for typing comfort
                  }}
                  // onBlur removed - handled by debounce
                />
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (
                    confirm(t("common.confirm_delete", "Delete this node?"))
                  ) {
                    onDeleteNode(activeNode.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title={t("common.delete_node", "Delete Node")}
              >
                <Trash2 size={16} />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1" />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {/* Dynamic Content Switch */}
            {safeConfig.nodeKey === "component" ||
            activeNode.type === "component" ? (
              // --- COMPONENT DASHBOARD ---
              <div className="space-y-6">
                {/* Description Card */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <FileText size={12} />
                    Description
                  </label>
                  <textarea
                    value={localConfig.description || ""}
                    onChange={(e) =>
                      handleConfigUpdate("description", e.target.value)
                    }
                    placeholder="Describe what this component does..."
                    className="w-full h-24 bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg p-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-[var(--text-muted)] resize-none"
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Node Count */}
                  <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Nodes
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {activeNode.data?.subFlow?.nodes?.length || 0}
                    </span>
                  </div>
                  {/* Connections */}
                  <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      I/O
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-xs font-mono px-1.5 py-0.5 rounded",
                          activeNode.data?.subFlow?.nodes?.some(
                            (n) => n.type === "input",
                          )
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/5 text-slate-500",
                        )}
                      >
                        IN
                      </span>
                      <ArrowLeftRight size={12} className="text-slate-600" />
                      <span
                        className={cn(
                          "text-xs font-mono px-1.5 py-0.5 rounded",
                          activeNode.data?.subFlow?.nodes?.some(
                            (n) => n.type === "output",
                          )
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-white/5 text-slate-500",
                        )}
                      >
                        OUT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Action */}
                <button
                  onClick={() => {
                    toast.info(
                      "Double-click the node on canvas to enter logic view.",
                    );
                  }}
                  className="w-full py-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-3 group"
                >
                  <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Layout size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-indigo-300">
                      Open Logic Flow
                    </span>
                    <span className="text-[10px] text-indigo-400/60">
                      Dive into component internals
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    className="ml-auto text-indigo-500/50 group-hover:translate-x-1 transition-transform"
                  />
                </button>

                {/* Ungroup Action */}
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to ungroup this component? This will dissolve the group boundaries.",
                      )
                    ) {
                      onUngroup(activeNode.id);
                      onClose();
                    }
                  }}
                  className="w-full py-2 rounded-lg border border-red-500/10 text-red-400/70 hover:bg-red-500/5 hover:text-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Ungroup Component
                </button>
              </div>
            ) : (
              // --- GENERIC INPUTS ---
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
              disabled={hasErrors} // Block execution if validation/mandatory fields fail
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                hasErrors
                  ? "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-50" // Disabled State
                  : `text-white shadow-lg active:scale-[0.98] hover:brightness-110 bg-gradient-to-r from-${colorKey}-600 to-${colorKey}-500 shadow-${colorKey}-500/20`,
              )}
              title={
                hasErrors ? "Please fix configuration errors" : "Run this node"
              }
            >
              <Play size={14} fill="currentColor" />
              {t("common.run_node", "Run Node")}
            </button>
          </div>
        </Motion.div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={32} />
          </button>
          <img
            src={lightboxUrl}
            alt="Fullscreen Evidence"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

// Remove React.memo wrapper to rely on internal state and parent keying
export default NodeConfigurationPanel;
