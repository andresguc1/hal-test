import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../utils/api";

export default function ExecutionDashboard({
  isOpen,
  onClose,
  currentProject,
  onViewReport,
}) {
  const [flows, setFlows] = useState([]);
  const [selectedFlows, setSelectedFlows] = useState([]);
  const [concurrency, setConcurrency] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    running: 0,
  });

  useEffect(() => {
    if (isOpen && currentProject) {
      setFlows(currentProject.flows || []);
      // Auto-select all flows by default
      setSelectedFlows((currentProject.flows || []).map((f) => f.id));
      setBatchId(null);
      setIsRunning(false);
      setStats({ total: 0, passed: 0, failed: 0, running: 0 });
    }
  }, [isOpen, currentProject]);

  useEffect(() => {
    let interval;
    if (isRunning && batchId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/runs/batch/${batchId}/summary`);
          if (res.success && res.data) {
            setStats({
              total: res.data.total,
              passed: res.data.passed,
              failed: res.data.failed,
              running: res.data.running,
            });
            // Auto complete if no more running
            if (
              res.data.running === 0 &&
              res.data.passed + res.data.failed === res.data.total
            ) {
              setIsRunning(false);
            }
          }
        } catch (e) {
          console.error("Failed to fetch batch summary", e);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isRunning, batchId]);

  const toggleFlow = (id) => {
    if (selectedFlows.includes(id)) {
      setSelectedFlows(selectedFlows.filter((f) => f !== id));
    } else {
      setSelectedFlows([...selectedFlows, id]);
    }
  };

  const handleStartBatch = async () => {
    if (selectedFlows.length === 0) return;
    try {
      const res = await api.post("/runs/batch", {
        flowIds: selectedFlows,
        projectId: currentProject?.id,
        concurrency,
        overrides: { headless: true }, // Always run headless for mass batch tests
      });

      if (res.success) {
        setBatchId(res.batchId);
        setIsRunning(true);
        setStats({
          total: selectedFlows.length,
          passed: 0,
          failed: 0,
          running: selectedFlows.length,
        });
      }
    } catch (e) {
      console.error("Failed to start batch", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Parallel Execution Runner
              </h2>
              <p className="text-xs text-slate-400">
                Run multiple flows simultaneously in isolated workers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            disabled={isRunning}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {!batchId ? (
          <div className="flex-1 overflow-auto flex">
            {/* Left: Flow Selection */}
            <div className="w-2/3 border-r border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Select Flows to Execute
                </h3>
                <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded">
                  {selectedFlows.length} Selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {flows.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFlow(f.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${selectedFlows.includes(f.id) ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 hover:border-white/20 bg-white/5"}`}
                  >
                    <span
                      className={`text-sm ${selectedFlows.includes(f.id) ? "text-indigo-300" : "text-slate-300"} truncate`}
                    >
                      {f.name}
                    </span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${selectedFlows.includes(f.id) ? "border-indigo-400 bg-indigo-500" : "border-slate-500"}`}
                    >
                      {selectedFlows.includes(f.id) && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Configuration */}
            <div className="w-1/3 p-6 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">
                Execution Rules
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">
                    Parallel Workers
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={concurrency}
                      onChange={(e) => setConcurrency(parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-lg font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded border border-indigo-500/30">
                      {concurrency}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 mt-4">
                    <AlertTriangle
                      size={10}
                      className="inline mr-1 text-yellow-500"
                    />
                    High concurrency uses more host RAM and CPU.
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={handleStartBatch}
                  disabled={selectedFlows.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
                >
                  <Play size={16} />
                  Starts {selectedFlows.length} Workflows
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
            <h2 className="text-2xl font-bold text-white mb-8">
              Batch Execution in Progress
            </h2>

            {/* Big Circular/Bar Statuses */}
            <div className="grid grid-cols-4 gap-6 w-full max-w-3xl">
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-4xl font-mono text-white mb-2">
                  {stats.total}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Total Flows
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono text-green-400 mb-2">
                  {stats.passed}
                </div>
                <div className="text-xs text-green-500 uppercase tracking-wider font-semibold">
                  Passed
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono text-red-400 mb-2">
                  {stats.failed}
                </div>
                <div className="text-xs text-red-500 uppercase tracking-wider font-semibold">
                  Failed
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono text-indigo-400 mb-2 flex items-center gap-2">
                  {isRunning && (
                    <RefreshCw
                      size={24}
                      className="animate-spin text-indigo-500"
                    />
                  )}
                  {stats.running}
                </div>
                <div className="text-xs text-indigo-500 uppercase tracking-wider font-semibold">
                  Running
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-3xl mt-12 mb-8">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Progress</span>
                <span>
                  {Math.round(
                    ((stats.passed + stats.failed) / (stats.total || 1)) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{
                    width: `${(stats.passed / (stats.total || 1)) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{
                    width: `${(stats.failed / (stats.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {!isRunning && stats.runs && stats.runs.length > 0 && (
              <div className="w-full max-w-3xl bg-slate-800/50 rounded-xl max-h-64 overflow-y-auto mb-8 border border-white/5 p-2">
                {stats.runs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {r.status === "completed" ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-sm font-medium text-slate-300">
                        {r.flow_name || "Sequence"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-slate-500">
                        {((r.duration_ms || 0) / 1000).toFixed(1)}s
                      </span>
                      <button
                        onClick={() => onViewReport && onViewReport(r.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isRunning && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onClose}
                className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
              >
                Close Dashboard
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
