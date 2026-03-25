import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { api } from "../utils/api";
import { cn } from "../lib/utils";
import { Database, X, RefreshCw, Layers, Globe, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api$/, "");
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:2001"
    : window.location.origin;
};

// Max characters to display before truncating
const MAX_DISPLAY_LENGTH = 200;

// Format a value for display, with optional truncation
const formatValue = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

// Single variable card component
const VariableCard = ({ varKey, value, accentColor = "emerald" }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatted = formatValue(value);
  const isLong = formatted.length > MAX_DISPLAY_LENGTH;
  const displayText = expanded ? formatted : formatted.slice(0, MAX_DISPLAY_LENGTH);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{${varKey}}}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <span
          className={cn(
            "text-[10px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded border max-w-[180px] truncate",
            colors.badge,
          )}
          title={varKey}
        >
          {varKey}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-600 uppercase font-bold">
            {typeof value === "object" ? (Array.isArray(value) ? "array" : "object") : typeof value}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
            title="Copy variable reference"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "text-xs text-slate-300 font-mono bg-black/20 p-2.5 rounded border border-white/5 group-hover:border-white/10 transition-colors overflow-hidden",
          "max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap break-all",
        )}
      >
        {displayText}
        {isLong && !expanded && (
          <span className="text-slate-600">…</span>
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          {expanded ? "Collapse" : `Show all (${formatted.length} chars)`}
        </button>
      )}
    </div>
  );
};

export default function VariablePanel({ isOpen, onClose }) {
  const [variables, setVariables] = useState({ flow: {}, global: {} });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("flow"); // 'flow' | 'global'

  const loadVariables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/variables");
      if (res.success) {
        // Deduplicate: remove from flow any key that already exists in global
        const globalKeys = new Set(Object.keys(res.data.global || {}));
        const dedupedFlow = {};
        Object.entries(res.data.flow || {}).forEach(([key, val]) => {
          if (!globalKeys.has(key)) {
            dedupedFlow[key] = val;
          }
        });
        setVariables({
          flow: dedupedFlow,
          global: res.data.global || {},
        });
      }
    } catch (error) {
      console.error("Failed to load variables:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (isOpen) {
      loadVariables();
    }
  }, [isOpen, loadVariables]);

  // Auto-refresh: listen for execution-status events via socket
  useEffect(() => {
    if (!isOpen) return;

    const socket = io(getSocketURL(), { autoConnect: true });

    socket.on("execution-status", (data) => {
      if (data?.status === "success" || data?.status === "failed") {
        setTimeout(() => loadVariables(), 300);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, loadVariables]);

  if (!isOpen) return null;

  const currentVars = activeTab === "flow" ? variables.flow : variables.global;
  const varEntries = Object.entries(currentVars);
  const flowCount = Object.keys(variables.flow).length;
  const globalCount = Object.keys(variables.global).length;

  return (
    <div className="relative h-full flex flex-col shrink-0 w-full sm:w-72 md:w-80 lg:w-96 glass-panel z-[var(--z-hud)] border-l border-white/5 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl">
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
          <button
            onClick={loadVariables}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/5 bg-slate-900/40 p-1">
        <button
          onClick={() => setActiveTab("flow")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
            activeTab === "flow"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-500 hover:text-slate-300",
          )}
        >
          <Layers size={12} />
          Flow Scope
          {flowCount > 0 && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "flow" ? "bg-emerald-500/30 text-emerald-300" : "bg-white/5 text-slate-500",
            )}>
              {flowCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
            activeTab === "global"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-slate-500 hover:text-slate-300",
          )}
        >
          <Globe size={12} />
          Global Scope
          {globalCount > 0 && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "global" ? "bg-sky-500/30 text-sky-300" : "bg-white/5 text-slate-500",
            )}>
              {globalCount}
            </span>
          )}
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading && varEntries.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-slate-500 text-xs text-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin opacity-30 px-1" />
              <span>Fetching active environment...</span>
            </div>
          </div>
        ) : varEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs gap-3 text-center">
            <Database size={32} className="opacity-20" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-400">Empty Scope</span>
              <span className="text-[10px] text-slate-600 leading-relaxed">
                No variables captured in {activeTab} scope yet.
                {activeTab === "flow" && " Run a node to populate this scope."}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {varEntries.map(([key, value]) => (
              <VariableCard
                key={key}
                varKey={key}
                value={value}
                accentColor={activeTab === "flow" ? "emerald" : "sky"}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER HINT */}
      <div className="p-3 border-t border-white/5 bg-[#0f172a]/80">
        <p className="text-[9px] text-slate-600 leading-relaxed uppercase tracking-tighter">
          Use{" "}
          <span className="text-emerald-500/70 font-bold">
            {"${variableName}"}
          </span>{" "}
          or{" "}
          <span className="text-indigo-400/70 font-bold">
            {"{{variableName}}"}
          </span>{" "}
          in any node input to reference these values.
        </p>
      </div>
    </div>
  );
}
