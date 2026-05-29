import React, { useMemo, useState, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Sparkles,
  Copy,
  Maximize2,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_STYLES,
  NODE_TYPE_MAP,
  NODE_OUTPUTS,
  NODE_CATEGORIES,
} from "@/config/nodeConstants";
import { api } from "../utils/api";
import VariableInput from "./VariableInput";
import { useAvailableVariables } from "../hooks/useAvailableVariables";
import { NODE_INPUTS } from "@/config/validationRules";

import ConditionalBranchesEditor from "./editors/ConditionalBranchesEditor";
import SwitchCasesEditor from "./editors/SwitchCasesEditor";
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";

const NodeConfigurationPanel = ({
  isVisible,
  action,
  nodes,
  onClose,
  updateNodeConfiguration,
  onStartPick,
  onCancelPick,
  onExecute,
  edges = [],
  simulatedResults = {},
  // Add missing props
  onEnterSubFlow,
  onDeleteNode,
  _onUngroup,
  currentProject,
  _designTimeContext,
  _isReadOnly,
  _viewStack,
  onSelectNode,
}) => {
  const [liveVariables, setLiveVariables] = useState({});

  const refreshVariables = useCallback(async () => {
    try {
      const response = await api.get("/variables");
      if (response && response.success) {
        setLiveVariables(response.data?.flow || {});
      }
    } catch (err) {
      console.warn("[NodeConfig] Failed to fetch live variables:", err);
    }
  }, []);

  const activeNode = useMemo(() => {
    if (!action) return null;
    if (!nodes) return action;
    return (
      nodes.find((n) => n.id === action.nodeId || n.id === action.id) || action
    );
  }, [action, nodes]);

  React.useEffect(() => {
    if (activeNode) {
      refreshVariables();
    }
  }, [activeNode, refreshVariables]);

  const { safeConfig, definedInputs } = useMemo(() => {
    if (!activeNode) return {};
    const _nodeKey = activeNode.data?.type || activeNode.type || "";
    const _config = NODE_TYPE_MAP[_nodeKey] || NODE_TYPE_MAP.launch_browser;
    const _safeConfig = _config || { category: "default", color: "slate" };

    // Base inputs from schema
    let _inputs = [...(NODE_INPUTS[_nodeKey] || NODE_INPUTS.default || [])];

    // DYNAMIC INPUTS FOR COMPONENTS
    if (_nodeKey === "component" || _nodeKey === "loop") {
      const flowId = activeNode.data?.configuration?.flowId;
      if (flowId && currentProject?.flows) {
        const subFlow = currentProject.flows.find((f) => f.id === flowId);
        if (subFlow && subFlow.nodes) {
          const inputNodes = subFlow.nodes.filter((n) => n.type === "input");
          inputNodes.forEach((inputNode) => {
            const paramName = inputNode.data?.configuration?.name;
            if (paramName) {
              // Check if already in schema to avoid duplicates
              if (!_inputs.some((i) => i.key === paramName)) {
                _inputs.push({
                  key: paramName,
                  label: `Parameter: ${paramName}`,
                  type: "text",
                  placeholder: `Value for ${paramName}...`,
                });
              }
            }
          });
        }
      }
    }

    return { safeConfig: _safeConfig, definedInputs: _inputs };
  }, [activeNode, currentProject]);

  const colorKey = safeConfig?.color || "slate";

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: activeNode?.data?.configuration || {},
  });

  const [localLabel, setLocalLabel] = useState(
    activeNode?.data?.customLabel || activeNode?.data?.label || "",
  );

  const [lightboxUrl, setLightboxUrl] = useState(null);

  React.useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  const watchedValues = watch();
  const localConfig = watchedValues;

  const isResettingRef = React.useRef(false);

  const lastSyncedConfigRef = React.useRef({
    config: activeNode?.data?.configuration || {},
    nodeId: activeNode?.id,
  });

  const cleanConfiguration = useCallback(
    (config, nodeType) => {
      if (!config) return {};
      const allowedKeys = new Set([
        "customLabel",
        "label",
        "description",
        "technicalName",
        "headless",
        "continueOnFailure",
        "continueOnError",
        "takeScreenshot",
        "url",
        "flowId",
      ]);

      // Add inputs defined in NODE_INPUTS schema for this node type
      const inputs = NODE_INPUTS[nodeType] || NODE_INPUTS.default || [];
      inputs.forEach((input) => allowedKeys.add(input.key));

      // Also add definedInputs which contains dynamic keys (like loop / component parameters)
      definedInputs.forEach((input) => allowedKeys.add(input.key));

      const cleaned = {};
      for (const [key, val] of Object.entries(config)) {
        if (allowedKeys.has(key)) {
          cleaned[key] = val;
        }
      }
      return cleaned;
    },
    [definedInputs],
  );

  React.useEffect(() => {
    if (!activeNode) return;
    const globalConfig = activeNode.data?.configuration || {};
    const hasIdChanged = activeNode.id !== lastSyncedConfigRef.current.nodeId;
    const hasConfigChanged =
      JSON.stringify(globalConfig) !==
      JSON.stringify(lastSyncedConfigRef.current.config);

    if (hasIdChanged || hasConfigChanged) {
      isResettingRef.current = true;
      reset(globalConfig);
      if (hasIdChanged) {
        setLocalLabel(
          activeNode.data?.customLabel || activeNode.data?.label || "",
        );
      }
      lastSyncedConfigRef.current = {
        config: globalConfig,
        nodeId: activeNode.id,
      };
    }
  }, [activeNode, reset]);

  const updateTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!activeNode) return;
    const currentConfigStr = JSON.stringify(watchedValues);
    const lastSyncedStr = JSON.stringify(lastSyncedConfigRef.current.config);

    if (isResettingRef.current) {
      // If we are in the middle of a reset, check if the watchedValues have successfully caught up
      if (currentConfigStr === lastSyncedStr) {
        isResettingRef.current = false;
      }
      return;
    }

    if (currentConfigStr !== lastSyncedStr) {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        if (activeNode.id !== lastSyncedConfigRef.current.nodeId) return;

        const cleanedConfig = cleanConfiguration(
          watchedValues,
          activeNode.data?.type || activeNode.type,
        );

        updateNodeConfiguration(activeNode.id, cleanedConfig);
        lastSyncedConfigRef.current.config = watchedValues;
      }, 200);
    }
  }, [watchedValues, activeNode, updateNodeConfiguration, cleanConfiguration]);

  const lastActiveNodeIdRef = React.useRef(activeNode?.id);
  const labelTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!activeNode) return;

    // Avoid syncing when active node switches
    if (activeNode.id !== lastActiveNodeIdRef.current) {
      lastActiveNodeIdRef.current = activeNode.id;
      return;
    }

    const currentLabel =
      activeNode.data?.customLabel || activeNode.data?.label || "";
    if (localLabel !== currentLabel) {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
      labelTimeoutRef.current = setTimeout(() => {
        updateNodeConfiguration(activeNode.id, {
          customLabel: localLabel,
          label: localLabel,
        });
      }, 200);
    }
    return () => {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    };
  }, [localLabel, activeNode, updateNodeConfiguration]);

  const { availableVariables, groupedVariables } = useAvailableVariables({
    activeNodeId: activeNode?.id,
    nodes,
    edges,
    liveVariables,
    simulatedResults,
  });

  const variablesMap = useMemo(() => {
    const map = {};
    availableVariables.forEach((v) => {
      map[v.name] = v.value;
    });
    return map;
  }, [availableVariables]);

  const contextualVariablesMap = variablesMap;

  const availableVariablePaths = useMemo(() => {
    return Object.entries(groupedVariables).map(([nodeLabel, items]) => {
      const suggestionItems = items
        .filter((item) => {
          // Filter out legacy redundant ".result.key" paths when a direct alias is available.
          // Also hide general ".result" references unless it is a root result item.
          if (item.name.includes(".result.")) return false;
          return (
            !item.name.endsWith(".result") ||
            item.name === `${nodeLabel}.result`
          );
        })
        .map((item) => ({
          label: item.name.split(".").pop() || item.name,
          path: item.path,
          type: item.type,
          scope: item.scope,
          description: item.description,
        }));

      return {
        nodeLabel,
        items: suggestionItems,
      };
    });
  }, [groupedVariables]);

  const renderDataValue = (value, depth = 0, keyName = "") => {
    if (value === null)
      return <span className="text-slate-500 italic">null</span>;
    if (value === undefined)
      return <span className="text-slate-500 italic">undefined</span>;

    if (typeof value === "object") {
      const isArray = Array.isArray(value);
      const keys = Object.keys(value);

      if (keys.length === 0)
        return (
          <span className="text-slate-600 italic">{isArray ? "[]" : "{}"}</span>
        );

      return (
        <div
          className={cn(
            "flex flex-col gap-3 w-full",
            depth > 0 && "ml-4 mt-2 border-l border-white/5 pl-4",
          )}
        >
          {keys.map((key) => (
            <div key={key} className="group/item flex flex-col">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.15em] transition-colors",
                    CATEGORY_STYLES[colorKey]?.panel?.categoryText,
                  )}
                >
                  {key.replace(/_/g, " ")}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="text-xs text-slate-300 break-words leading-relaxed pl-1">
                {renderDataValue(value[key], depth + 1, key)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <span
          className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-sm",
            value
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          )}
        >
          {value.toString()}
        </span>
      );
    }

    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1.5 group/link transition-all"
        >
          <Globe
            size={11}
            className="group-hover/link:rotate-12 transition-transform text-indigo-500"
          />
          <span className="truncate">{value}</span>
        </a>
      );
    }

    const stringValue = value.toString();
    const isBase64 = stringValue.length > 100 && !stringValue.includes(" ");
    const isFilePath =
      stringValue.startsWith("storage/") ||
      stringValue.endsWith(".png") ||
      stringValue.endsWith(".jpg") ||
      stringValue.endsWith(".jpeg");

    // Display screenshots (either base64 or file path) if the key suggests it
    if (keyName && keyName.toLowerCase().includes("screenshot")) {
      if (isBase64 || isFilePath) {
        const imageUrl = isBase64
          ? stringValue.startsWith("data:image")
            ? stringValue
            : `data:image/png;base64,${stringValue}`
          : api.getFileUrl(stringValue);

        return (
          <div className="mt-1 bg-slate-900/50 p-2 rounded-lg border border-white/5 inline-block group relative">
            <div
              onClick={() => setLightboxUrl(imageUrl)}
              className="relative cursor-zoom-in overflow-hidden rounded-lg shadow-lg border border-white/10 aspect-video group/img max-w-full max-h-48 flex items-center justify-center bg-black/30"
            >
              <img
                src={imageUrl}
                alt="Screenshot Evidence"
                className="max-w-full max-h-48 object-contain rounded transition-transform duration-300 group-hover/img:scale-[1.02] pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20">
                  Click to Expand
                </span>
              </div>
            </div>
          </div>
        );
      }
    }

    if (stringValue.length > 300) {
      return (
        <div className="relative group/longtext max-h-32 overflow-y-auto custom-scrollbar bg-black/40 rounded p-2.5 border border-white/5">
          <span className="text-slate-400 font-mono text-[10px] break-all leading-relaxed">
            {stringValue}
          </span>
        </div>
      );
    }

    return (
      <span className="text-slate-200 font-medium selection:bg-indigo-500/30">
        {stringValue}
      </span>
    );
  };

  const renderEmittedData = () => {
    const result = activeNode.data?.result;
    if (!result)
      return (
        <div className="text-[10px] text-slate-600 italic">No data yet</div>
      );

    return (
      <div className="relative group/panel">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-md opacity-0 group-hover/panel:opacity-100 transition duration-700" />
        <div className="relative bg-[#0b1222]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl max-h-[450px] overflow-y-auto custom-scrollbar border-t-white/20">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(result, null, 2))
              }
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-indigo-400 transition-all"
              title="Copy JSON"
            >
              <Copy size={12} />
            </button>
          </div>
          {renderDataValue(result.data !== undefined ? result.data : result)}
        </div>
      </div>
    );
  };

  const renderInput = (field) => {
    const dataKey = field.key;
    const reactKey = `input-${field.key}`;

    switch (field.type) {
      case "conditional_branches":
      case "conditional":
        return (
          <Controller
            key={reactKey}
            name={dataKey}
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  {field.label}{" "}
                  {field.required && (
                    <span className="text-rose-500 ml-1">*</span>
                  )}
                </label>
                <ConditionalBranchesEditor
                  value={value}
                  onChange={onChange}
                  variables={contextualVariablesMap}
                  allVariables={variablesMap}
                  suggestions={availableVariablePaths}
                />
              </div>
            )}
          />
        );
      case "switch_cases":
      case "switch":
        return (
          <Controller
            key={reactKey}
            name={dataKey}
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  {field.label}{" "}
                  {field.required && (
                    <span className="text-rose-500 ml-1">*</span>
                  )}
                </label>
                <SwitchCasesEditor
                  value={value}
                  onChange={onChange}
                  data={activeNode?.data}
                  variables={contextualVariablesMap}
                  allVariables={variablesMap}
                  suggestions={availableVariablePaths}
                  comparisonType={watch("comparisonType") || "equals"}
                  edges={edges}
                  nodeId={activeNode?.id}
                />
              </div>
            )}
          />
        );
      case "boolean":
      case "checkbox":
        return (
          <Controller
            key={reactKey}
            name={dataKey}
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  {field.label}{" "}
                  {field.required && (
                    <span className="text-rose-500 ml-1">*</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => onChange(!value)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors border-2 border-transparent cursor-pointer outline-none",
                    value ? "bg-indigo-600" : "bg-slate-800",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                      value ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            )}
          />
        );
      case "select":
        return (
          <div key={reactKey} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              {field.label}{" "}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <Controller
              name={dataKey}
              control={control}
              render={({ field: { value, onChange } }) => (
                <div className="relative">
                  <select
                    value={value || ""}
                    onChange={onChange}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/40 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select {field.label}...
                    </option>
                    {(typeof field.options === "function"
                      ? field.options(localConfig)
                      : field.options
                    )?.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-slate-800 text-slate-200"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              )}
            />
          </div>
        );
      case "number":
        return (
          <div key={reactKey} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              {field.label}{" "}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <Controller
              name={dataKey}
              control={control}
              render={({ field: { value, onChange } }) => (
                <input
                  type="number"
                  value={value ?? ""}
                  onChange={(e) =>
                    onChange(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder={field.placeholder || ""}
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/40 transition-colors"
                />
              )}
            />
          </div>
        );
      case "selector":
        return (
          <div key={reactKey} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                {field.label}{" "}
                {field.required && (
                  <span className="text-rose-500 ml-1">*</span>
                )}
              </label>
              <button
                type="button"
                onClick={() =>
                  activeNode.data?.state === "picking"
                    ? onCancelPick?.()
                    : onStartPick?.(field.key)
                }
                className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded"
              >
                {activeNode.data?.state === "picking" ? "Cancel" : "Pick"}
              </button>
            </div>
            <Controller
              name={dataKey}
              control={control}
              render={({ field: { value, onChange } }) => (
                <VariableInput
                  value={value}
                  variables={variablesMap}
                  suggestions={availableVariablePaths}
                  onChange={onChange}
                  className="w-full px-3 py-2 text-xs font-mono"
                />
              )}
            />
          </div>
        );
      default:
        return (
          <div key={reactKey} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              {field.label}{" "}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <Controller
              name={dataKey}
              control={control}
              render={({ field: { value, onChange } }) => (
                <VariableInput
                  value={value}
                  variables={variablesMap}
                  suggestions={availableVariablePaths}
                  onChange={onChange}
                  className="w-full text-xs font-mono px-3 py-2"
                />
              )}
            />
          </div>
        );
    }
  };

  const renderNodeInputs = () => {
    const inputs = definedInputs || [];
    return (
      <div className="space-y-5">
        {inputs
          .filter((f) => !f.isVisible || f.isVisible(localConfig))
          .map(renderInput)}
      </div>
    );
  };

  const Header = () => (
    <div
      className={cn(
        "h-14 shrink-0 flex items-center justify-between px-5 border-b",
        CATEGORY_STYLES[colorKey]?.panel?.headerBorder,
        CATEGORY_STYLES[colorKey]?.panel?.headerGradient,
      )}
    >
      <div className="flex flex-col justify-center max-w-[60%]">
        <span
          className={cn(
            "text-[9px] uppercase tracking-widest font-bold mb-0.5",
            CATEGORY_STYLES[colorKey]?.panel?.categoryText,
          )}
        >
          {NODE_CATEGORIES[safeConfig.category]?.label ||
            safeConfig.category.replace("_", " ")}
        </span>
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          className="bg-transparent border-none text-sm font-bold text-white w-full focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const isDisabled = !activeNode.data?.disabled;
            activeNode.data.disabled = isDisabled; // optimistically update local object
            updateNodeConfiguration(activeNode.id, {
              ...activeNode.data,
              disabled: isDisabled,
            });
            window.dispatchEvent(
              new CustomEvent("node-data-updated", {
                detail: { nodeId: activeNode.id },
              }),
            );
          }}
          className={cn(
            "p-1.5 rounded-lg transition-colors mr-1",
            activeNode.data?.disabled
              ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
              : "text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10",
          )}
          title={activeNode.data?.disabled ? "Enable Node" : "Disable Node"}
        >
          {activeNode.data?.disabled ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {(activeNode.type === "component" || activeNode.type === "loop") && (
          <button
            onClick={() => onEnterSubFlow?.(activeNode.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
            title="Dive In"
          >
            <Maximize2 size={16} />
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this node?")) {
              onDeleteNode?.(activeNode.id);
              onClose();
            }
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          title="Delete Node"
        >
          <Trash2 size={16} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  const Body = () => (
    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
      <form
        onSubmit={handleSubmit((data) =>
          updateNodeConfiguration(activeNode.id, data),
        )}
        className="space-y-6"
      >
        {renderNodeInputs()}
      </form>
      {activeNode.data?.result && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Execution Evidence
            </span>
          </div>
          {renderEmittedData()}
        </div>
      )}
    </div>
  );

  const Footer = () => {
    // Find neighbors for navigation
    const prevNodeId = edges.find((e) => e.target === activeNode.id)?.source;
    const nextNodeId = edges.find((e) => e.source === activeNode.id)?.target;

    return (
      <div className="p-4 border-t border-white/5 bg-slate-900/50 shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          {prevNodeId && (
            <button
              onClick={() => onSelectNode?.(prevNodeId)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white/5 border hover:text-white hover:bg-white/10",
                CATEGORY_STYLES[colorKey]?.panel?.headerBorder, // Use the same border as header
                CATEGORY_STYLES[colorKey]?.panel?.categoryText,
              )}
            >
              <ChevronLeft size={14} />
              Prev
            </button>
          )}

          <button
            onClick={() =>
              onExecute(
                activeNode.id || activeNode.nodeId,
                activeNode.data?.type || activeNode.type,
                watchedValues,
                { variables: variablesMap },
              )
            }
            className={cn(
              "flex-[2] py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] text-white flex items-center justify-center gap-2.5 transition-all duration-300",
              "hover:scale-[1.03] hover:brightness-110 active:scale-[0.97] active:brightness-90",
              "shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)]",
              CATEGORY_STYLES[colorKey]?.panel?.buttonGradient,
              "relative overflow-hidden group/btn",
            )}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <Play size={16} fill="currentColor" className="relative z-10" />
            <span className="relative z-10">Run Node</span>
          </button>

          {nextNodeId && (
            <button
              onClick={() => onSelectNode?.(nextNodeId)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white/5 border hover:text-white hover:bg-white/10",
                CATEGORY_STYLES[colorKey]?.panel?.headerBorder,
                CATEGORY_STYLES[colorKey]?.panel?.categoryText,
              )}
            >
              Next
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isVisible || !activeNode) return null;

  return (
    <>
      <AnimatePresence>
        <Motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="w-full sm:w-80 md:w-[400px] h-full glass-panel z-[var(--z-popover)] flex flex-col relative shadow-2xl overflow-hidden"
        >
          {Header()}
          {Body()}
          {Footer()}
        </Motion.div>
      </AnimatePresence>

      {/* Lightbox Portal */}
      {lightboxUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setLightboxUrl(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all z-50 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxUrl(null);
              }}
              title="Close"
            >
              <X size={24} />
            </button>

            <div
              className="relative max-w-[95vw] max-h-[95vh] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxUrl}
                alt="Fullscreen Evidence"
                className="max-h-[90vh] w-auto max-w-full object-contain bg-black"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NodeConfigurationPanel;
