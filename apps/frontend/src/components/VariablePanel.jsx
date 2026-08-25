import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../utils/api";
import { cn } from "@/lib/utils";
import {
  Database,
  X,
  RefreshCw,
  Layers,
  Globe,
  Play,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Plus,
  Save,
  Trash2,
  Pencil,
  ArrowRightLeft,
} from "lucide-react";
import { motion as Motion } from "framer-motion";

// Max characters to display before truncating
const MAX_DISPLAY_LENGTH = 200;

// Format a value for display
const formatValue = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

// ─── Variable Card (Single Variable Display) ────────────────────────────────

const VariableCard = ({
  varKey,
  value,
  accentColor = "emerald",
  source,
  onDelete,
  onEdit,
  onMigrateScope,
  scopeLabel,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const formatted = formatValue(value);
  const isLong = formatted.length > MAX_DISPLAY_LENGTH;
  const displayText = expanded
    ? formatted
    : formatted.slice(0, MAX_DISPLAY_LENGTH);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{${varKey}}}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditValue(formatValue(value));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit) onEdit(varKey, editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const accentColors = {
    emerald: {
      badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      border: "hover:border-emerald-500/30",
    },
    sky: {
      badge: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      border: "hover:border-sky-500/30",
    },
    violet: {
      badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
      border: "hover:border-violet-500/30",
    },
  };

  const colors = accentColors[accentColor] || accentColors.emerald;

  return (
    <div
      className={cn(
        "group bg-slate-900/40 border border-white/5 rounded-lg p-3 transition-all hover:bg-slate-900/60 shadow-sm",
        colors.border,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "text-[10px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded border max-w-[140px] truncate",
              colors.badge,
            )}
            title={varKey}
          >
            {varKey}
          </span>
          {source === "node" && (
            <span className="text-[8px] text-slate-600 bg-slate-800 px-1 py-0.5 rounded font-bold uppercase shrink-0">
              📄 node
            </span>
          )}
          {source === "runtime" && (
            <span className="text-[8px] text-violet-400 bg-violet-500/10 border border-violet-500/25 px-1 py-0.5 rounded font-bold uppercase shrink-0">
              ⚡ live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-600 uppercase font-bold">
            {typeof value === "object"
              ? Array.isArray(value)
                ? "array"
                : "object"
              : typeof value}
          </span>
          {/* Action buttons — visible on hover */}
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
            title="Copy variable reference"
          >
            {copied ? (
              <Check size={10} className="text-emerald-400" />
            ) : (
              <Copy size={10} />
            )}
          </button>
          {onEdit && (
            <button
              onClick={handleStartEdit}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
              title="Edit value"
            >
              <Pencil size={10} />
            </button>
          )}
          {onMigrateScope && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMigrateScope(varKey, value);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
              title={`Move to ${scopeLabel === "flow" ? "Global" : "Flow"} scope`}
            >
              <ArrowRightLeft size={10} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(varKey);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300 transition-all"
              title="Delete variable"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none transition-colors min-h-[60px] font-mono"
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleSaveEdit}
              className="flex-1 text-[9px] font-bold py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-wider"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 text-[9px] font-bold py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "text-xs text-slate-300 font-mono bg-black/20 p-2.5 rounded border border-white/5 group-hover:border-white/10 transition-colors overflow-hidden",
              "max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap break-all",
            )}
          >
            {displayText}
            {isLong && !expanded && <span className="text-slate-600">…</span>}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {expanded ? (
                <ChevronDown size={10} />
              ) : (
                <ChevronRight size={10} />
              )}
              {expanded ? "Collapse" : `Show all (${formatted.length} chars)`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Variable Panel ─────────────────────────────────────────────────────

export default function VariablePanel({
  isOpen,
  nodes = [],
  onDeleteNode,
  onUpdateNode,
  onAddNode,
}) {
  const [globalVariables, setGlobalVariables] = useState({});
  const [runtimeVariables, setRuntimeVariables] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("flow");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState({ key: "", value: "" });
  const [isMinimized, setIsMinimized] = useState(false);

  // ─── Flow Variables: Derived from Canvas Nodes (Reactive) ────────────────

  const flowVariableEntries = useMemo(() => {
    const entries = [];
    if (!nodes || !Array.isArray(nodes)) return entries;

    nodes.forEach((node) => {
      if (
        (node.type === "variable" || node.data?.type === "variable") &&
        node.data?.configuration
      ) {
        const config = node.data.configuration;
        const scope = config.scope || "flow";
        if (scope === "flow" && config.name) {
          entries.push({
            key: config.name,
            value: config.value ?? "",
            nodeId: node.id,
            source: "node",
          });
        }
      }
    });

    return entries;
  }, [nodes]);

  const flowVariablesMap = useMemo(() => {
    const map = {};
    flowVariableEntries.forEach((entry) => {
      map[entry.key] = entry;
    });
    return map;
  }, [flowVariableEntries]);

  // ─── Global & Runtime Variables Loader ───────────────────────────────────

  const loadVariables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/variables");
      if (res && res.success && res.data) {
        setGlobalVariables(res.data.global || {});
        setRuntimeVariables(res.data.flow || {});
      }
    } catch (error) {
      console.error("Failed to load variables from backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load variables on open
  useEffect(() => {
    if (isOpen) {
      loadVariables();
    }
  }, [isOpen, loadVariables]);

  // ─── Socket: Real-time execution variable change updates ─────────────────

  useEffect(() => {
    if (!isOpen) return;

    const socket = window.__HAL_SOCKET__;
    if (!socket) return;

    const handler = () => {
      loadVariables();
    };

    socket.on("variable-change", handler);
    socket.on("node-execution-finished", handler);

    return () => {
      socket.off("variable-change", handler);
      socket.off("node-execution-finished", handler);
    };
  }, [isOpen, loadVariables]);

  // ─── CRUD Handlers ──────────────────────────────────────────────────────

  const handleAddVariable = async () => {
    if (!newVar.key.trim()) return;

    if (activeTab === "flow") {
      // Create a variable node on canvas
      if (onAddNode) {
        onAddNode("variable", {
          configuration: {
            operation: "set",
            name: newVar.key,
            value: newVar.value,
            scope: "flow",
          },
        });
      }
    } else {
      // Save to backend as global
      try {
        await api.post("/variables", {
          variables: { [newVar.key]: newVar.value },
          scope: "global",
        });
        loadVariables();
      } catch (error) {
        console.error("Failed to add global variable:", error);
      }
    }

    setNewVar({ key: "", value: "" });
    setIsAdding(false);
  };

  const handleDeleteFlowVariable = (varKey) => {
    const entry = flowVariablesMap[varKey];
    if (entry?.nodeId && onDeleteNode) {
      onDeleteNode(entry.nodeId);
    }
  };

  const handleDeleteGlobalVariable = async (varKey) => {
    try {
      await api.delete("/variables", { name: varKey, scope: "global" });
      loadVariables();
    } catch (error) {
      console.error("Failed to delete global variable:", error);
    }
  };

  const handleEditFlowVariable = (varKey, newValue) => {
    const entry = flowVariablesMap[varKey];
    if (entry?.nodeId && onUpdateNode) {
      onUpdateNode(entry.nodeId, {
        value: newValue,
      });
    }
  };

  const handleEditGlobalVariable = async (varKey, newValue) => {
    try {
      await api.post("/variables", {
        variables: { [varKey]: newValue },
        scope: "global",
      });
      loadVariables();
    } catch (error) {
      console.error("Failed to edit global variable:", error);
    }
  };

  const handleMigrateToGlobal = async (varKey, value) => {
    try {
      await api.post("/variables", {
        variables: { [varKey]: value },
        scope: "global",
      });
      await loadVariables();
      setActiveTab("global"); // Switch tab to show the result
    } catch (error) {
      console.error("Failed to migrate to global:", error);
      return;
    }

    // Update flow variable node scope on canvas instead of deleting it
    const entry = flowVariablesMap[varKey];
    if (entry?.nodeId && onUpdateNode) {
      onUpdateNode(entry.nodeId, {
        scope: "global",
        label: `Global: ${varKey}`,
      });
    }
  };

  const handleMigrateToFlow = async (varKey, value) => {
    if (onAddNode) {
      onAddNode("variable", {
        configuration: {
          operation: "set",
          name: varKey,
          value:
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value),
          scope: "flow",
        },
      });
      setActiveTab("flow"); // Switch tab to show the node in the list
    }

    await handleDeleteGlobalVariable(varKey);
  };

  // ─── Rendering ──────────────────────────────────────────────────────────

  const currentEntries = useMemo(() => {
    if (activeTab === "flow") {
      return flowVariableEntries.map((e) => ({
        key: e.key,
        value: e.value,
        source: e.source,
      }));
    }
    if (activeTab === "global") {
      return Object.entries(globalVariables).map(([key, value]) => ({
        key,
        value,
        source: "backend",
      }));
    }
    // activeTab === "execution" (Real-time live execution outputs)
    return Object.entries(runtimeVariables).map(([key, value]) => ({
      key,
      value,
      source: "runtime",
    }));
  }, [activeTab, flowVariableEntries, globalVariables, runtimeVariables]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentEntries;

    return currentEntries.filter((entry) => {
      const matchKey = entry.key.toLowerCase().includes(query);
      const matchVal = formatValue(entry.value).toLowerCase().includes(query);
      return matchKey || matchVal;
    });
  }, [currentEntries, searchQuery]);

  if (!isOpen) return null;

  const flowCount = flowVariableEntries.length;
  const globalCount = Object.keys(globalVariables).length;
  const executionCount = Object.keys(runtimeVariables).length;

  const WIDTH_EXPANDED = 384;
  const WIDTH_COLLAPSED = 48;

  return (
    <Motion.div
      initial={false}
      animate={{ width: isMinimized ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-full flex flex-col shrink-0 glass-panel z-[var(--z-hud)] border-l border-white/5 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl"
    >
      {isMinimized ? (
        <div className="flex flex-col items-center pt-3 gap-3">
          <button
            onClick={() => setIsMinimized(false)}
            title="Variables"
            aria-label="Variables"
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400"
          >
            <Database size={18} />
          </button>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Database size={16} className="text-emerald-400" />
              </div>
              <span className="font-bold text-sm tracking-wide text-slate-100 uppercase">
                Variables
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab !== "execution" && (
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isAdding
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
                  )}
                  title="Add Variable"
                >
                  <Plus size={14} />
                </button>
              )}
              <button
                onClick={loadVariables}
                className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh Variables"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex border-b border-white/5 bg-slate-900/40 p-1 gap-0.5">
            <button
              onClick={() => {
                setActiveTab("flow");
                setIsAdding(false);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                activeTab === "flow"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Layers size={11} />
              Flow
              {flowCount > 0 && (
                <span
                  className={cn(
                    "text-[8px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    activeTab === "flow"
                      ? "bg-emerald-500/30 text-emerald-300"
                      : "bg-white/5 text-slate-500",
                  )}
                >
                  {flowCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("global");
                setIsAdding(false);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                activeTab === "global"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Globe size={11} />
              Global
              {globalCount > 0 && (
                <span
                  className={cn(
                    "text-[8px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    activeTab === "global"
                      ? "bg-sky-500/30 text-sky-300"
                      : "bg-white/5 text-slate-500",
                  )}
                >
                  {globalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("execution");
                setIsAdding(false);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                activeTab === "execution"
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Play size={11} />
              Live
              {executionCount > 0 && (
                <span
                  className={cn(
                    "text-[8px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    activeTab === "execution"
                      ? "bg-violet-500/30 text-violet-300"
                      : "bg-white/5 text-slate-500",
                  )}
                >
                  {executionCount}
                </span>
              )}
            </button>
          </div>

          {/* SEARCH QUERY */}
          <div className="relative px-3 py-2 border-b border-white/5 bg-[#0f172a]/40 flex items-center gap-2">
            <Search size={12} className="absolute left-6 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} variables...`}
              className="w-full bg-black/30 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 outline-none transition-colors font-mono"
            />
          </div>

          {/* ADD VARIABLE FORM */}
          {isAdding && activeTab !== "execution" && (
            <div className="p-3 border-b border-white/5 bg-slate-900/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={newVar.key}
                  onChange={(e) =>
                    setNewVar({ ...newVar, key: e.target.value })
                  }
                  placeholder="e.g. test_user"
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 outline-none transition-colors font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Value
                </label>
                <textarea
                  value={newVar.value}
                  onChange={(e) =>
                    setNewVar({ ...newVar, value: e.target.value })
                  }
                  placeholder="Value..."
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 outline-none transition-colors min-h-[60px] font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddVariable}
                  disabled={!newVar.key.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded transition-colors uppercase tracking-wider"
                >
                  <Save size={12} />
                  Save to {activeTab}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold rounded transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {loading && filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs text-center h-48">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw
                    size={24}
                    className="animate-spin opacity-30 px-1"
                  />
                  <span>Fetching environment...</span>
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs gap-3 text-center h-48">
                <Database size={32} className="opacity-20" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400">
                    No Variables Found
                  </span>
                  <span className="text-[10px] text-slate-600 leading-relaxed max-w-[200px] mx-auto">
                    {searchQuery
                      ? "No variables in this scope match your filter."
                      : activeTab === "flow"
                        ? "No variable nodes in this flow. Add a Variable node to the canvas."
                        : activeTab === "global"
                          ? "No global variables set. Click + to create one."
                          : "No variables captured from execution yet. Run the flow to see outputs."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-300">
                {filteredEntries.map((entry) => (
                  <VariableCard
                    key={entry.key}
                    varKey={entry.key}
                    value={entry.value}
                    source={entry.source}
                    accentColor={
                      activeTab === "flow"
                        ? "emerald"
                        : activeTab === "global"
                          ? "sky"
                          : "violet"
                    }
                    scopeLabel={activeTab}
                    onDelete={
                      activeTab === "flow"
                        ? handleDeleteFlowVariable
                        : activeTab === "global"
                          ? handleDeleteGlobalVariable
                          : null
                    }
                    onEdit={
                      activeTab === "flow"
                        ? handleEditFlowVariable
                        : activeTab === "global"
                          ? handleEditGlobalVariable
                          : null
                    }
                    onMigrateScope={
                      activeTab === "flow"
                        ? handleMigrateToGlobal
                        : activeTab === "global"
                          ? handleMigrateToFlow
                          : null
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* FOOTER HINT */}
          <div className="p-3 border-t border-white/5 bg-[#0f172a]/80">
            <p className="text-[9px] text-slate-600 leading-relaxed uppercase tracking-tighter">
              Use{" "}
              <span className="text-indigo-400/70 font-bold font-mono">
                {"{{variableName}}"}
              </span>{" "}
              in any node input to reference these values.
              {activeTab === "flow" && (
                <span className="block mt-1 text-emerald-500/50">
                  Flow scope has priority over Global scope (shadowing).
                </span>
              )}
              {activeTab === "execution" && (
                <span className="block mt-1 text-violet-400/50">
                  Live run outputs are read-only and update dynamically.
                </span>
              )}
            </p>
          </div>

          {/* FOOTER */}
          <div className="p-3 border-t border-white/5 shrink-0 bg-[#0f172a]/80">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-canvas)] transition-all group"
            >
              <ChevronLeft size={16} />
              <span className="text-xs font-medium">Hide Panel</span>
            </button>
          </div>
        </>
      )}
    </Motion.div>
  );
}
