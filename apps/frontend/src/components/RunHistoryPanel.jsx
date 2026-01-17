import React, { useEffect, useState, useCallback } from "react";
import { api } from "../utils/api";
import { cn } from "../lib/utils";
import { History, X, RefreshCw, Trash2 } from "lucide-react";

export default function RunHistoryPanel({
  isOpen,
  onClose,
  onSelectRun,
  currentFlowId,
}) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'failed' | 'completed'

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFlowId) params.append("flowId", currentFlowId);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/runs?${params.toString()}`);
      if (res.success) {
        setRuns(res.data);
      }
    } catch (error) {
      console.error("Failed to load runs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentFlowId, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      loadRuns();
    }
  }, [isOpen, loadRuns]);

  const handleRunClick = (run) => {
    setSelectedRunId(run.id);
    onSelectRun(run);
  };

  const handleDeleteRun = async (e, runId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this run record?")) return;

    try {
      setLoading(true);
      const res = await api.delete(`/runs/${runId}`);
      if (res.success) {
        setRuns((prev) => prev.filter((r) => r.id !== runId));
        if (selectedRunId === runId) {
          setSelectedRunId(null);
          onSelectRun(null); // Clear selection in parent
        }
      }
    } catch (error) {
      console.error("Failed to delete run:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear ALL history history for all flows?")) return;

    try {
      setLoading(true);
      const res = await api.delete("/runs");
      if (res.success) {
        setRuns([]);
        setSelectedRunId(null);
        onSelectRun(null);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="relative h-full flex flex-col shrink-0 w-80 glass-panel z-[var(--z-hud)] border-l border-white/5 bg-[#0f172a]/95 backdrop-blur-xl">
      {/* HEADER */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <History size={16} className="text-indigo-400" />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-100">
            HISTORY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {runs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-400 hover:text-red-400 transition-colors"
              title="Clear Global History"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={loadRuns}
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

      {/* FILTERS */}
      <div className="p-3 border-b border-white/5 bg-slate-900/30">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-[#1e293b] border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="failed">❌ Failed Only</option>
          <option value="completed">✅ Completed Only</option>
        </select>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading...
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs gap-2">
            <History size={24} className="opacity-30" />
            <span>No runs found.</span>
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className={cn(
                "group relative w-full text-left p-3 rounded-lg transition-all border cursor-pointer",
                "bg-slate-900/40 hover:bg-slate-800/60",
                selectedRunId === run.id
                  ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "border-white/5 hover:border-white/10",
              )}
              onClick={() => handleRunClick(run)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1.5",
                    run.status === "completed" &&
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                    run.status === "failed" &&
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    run.status === "running" &&
                      "bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse",
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      run.status === "completed"
                        ? "bg-emerald-400"
                        : run.status === "failed"
                          ? "bg-rose-400"
                          : "bg-sky-400",
                    )}
                  ></div>
                  {run.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {run.duration_ms
                    ? `${(run.duration_ms / 1000).toFixed(2)}s`
                    : "--"}
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-300 font-medium">
                    {new Date(run.started_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(run.started_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteRun(e, run.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded-md text-slate-500 hover:text-rose-400 transition-all"
                  title="Delete Run"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="mt-2 text-[9px] text-slate-600 font-mono border-t border-white/5 pt-1.5 flex justify-between">
                <span>{run.trigger.toUpperCase()}</span>
                <span>ID: {run.id.slice(0, 6)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
