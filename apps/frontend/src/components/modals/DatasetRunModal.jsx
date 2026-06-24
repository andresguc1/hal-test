import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Database, AlertTriangle } from "lucide-react";

export default function DatasetRunModal({ isOpen, onClose, onRun }) {
  const [datasetText, setDatasetText] = useState("[\n  {\n    \"username\": \"testuser1\",\n    \"password\": \"pass1\"\n  },\n  {\n    \"username\": \"testuser2\",\n    \"password\": \"pass2\"\n  }\n]");
  const [concurrency, setConcurrency] = useState(2);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRun = () => {
    try {
      const parsed = JSON.parse(datasetText);
      if (!Array.isArray(parsed)) {
        setError("Dataset must be a JSON array.");
        return;
      }
      if (parsed.length === 0) {
        setError("Dataset array cannot be empty.");
        return;
      }
      setError(null);
      onRun(parsed, concurrency);
    } catch (error) {
      setError("Invalid JSON format. Please ensure the dataset is a valid JSON array.");
      console.error("Dataset parse error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Data-Driven Execution</h2>
              <p className="text-xs text-slate-400">Run the flow against multiple dataset iterations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">
              Dataset (JSON Array)
            </label>
            <textarea
              className="w-full h-48 bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50"
              value={datasetText}
              onChange={(e) => setDatasetText(e.target.value)}
              placeholder="Enter JSON array..."
            />
            {error && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <AlertTriangle size={12} /> {error}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">
              Parallel Workers
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-lg font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
                {concurrency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Play size={16} />
            Run Dataset
          </button>
        </div>
      </motion.div>
    </div>
  );
}
