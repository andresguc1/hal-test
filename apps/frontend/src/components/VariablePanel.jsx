import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { api } from "../utils/api";
import { cn } from "../lib/utils";
import { Database, X, RefreshCw, Layers, Globe } from "lucide-react";

const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api$/, "");
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:2001"
    : window.location.origin;
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
        setVariables(res.data);
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
        // Debounce: wait 300ms for variables to be written on backend
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

  return (
    <div className="relative h-full flex flex-col shrink-0 w-80 glass-panel z-[var(--z-hud)] border-l border-white/5 bg-[#0f172a]/95 backdrop-blur-xl">
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
              <span className="text-[10px] text-slate-600 leading-relaxed uppercase">
                No variables captured in {activeTab} scope yet.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {varEntries.map(([key, value]) => (
              <div
                key={key}
                className="group bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 rounded-lg p-3 transition-all hover:bg-slate-900/60 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-tight bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {key}
                  </span>
                  <span className="text-[9px] text-slate-600 uppercase font-bold">
                    {typeof value}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono break-all bg-black/20 p-2 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </div>
              </div>
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
          in any node input to reference these values.
        </p>
      </div>
    </div>
  );
}
