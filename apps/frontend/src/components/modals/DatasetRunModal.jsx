import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Play,
  Database,
  AlertTriangle,
  Upload,
  Code2,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from "lucide-react";

const PLACEHOLDER_JSON = `[
  {
    "username": "standard_user",
    "password": "secret_sauce"
  },
  {
    "username": "problem_user",
    "password": "secret_sauce"
  }
]`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return headers.reduce((obj, key, i) => {
      obj[key] = values[i] ?? "";
      return obj;
    }, {});
  });
  return rows;
}

export default function DatasetRunModal({ isOpen, onClose, onRun }) {
  const [inputMode, setInputMode] = useState("json"); // "json" | "csv"
  const [datasetText, setDatasetText] = useState(PLACEHOLDER_JSON);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState(null);
  const [concurrency, setConcurrency] = useState(2);
  const [headless, setHeadless] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCsvFile(null);
      setParsedRows(null);
      setInputMode("json");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── CSV upload ──────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSV(text);
      if (!rows || rows.length === 0) {
        setError(
          "Could not parse CSV. Make sure it has a header row and at least one data row.",
        );
        setCsvFile(null);
        setParsedRows(null);
        return;
      }
      setError(null);
      setCsvFile(file);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setCsvFile(null);
    setParsedRows(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Run ─────────────────────────────────────────────────────
  const handleRun = () => {
    let dataset;
    if (inputMode === "csv") {
      if (!parsedRows || parsedRows.length === 0) {
        setError("Upload a valid CSV file first.");
        return;
      }
      dataset = parsedRows;
    } else {
      try {
        dataset = JSON.parse(datasetText);
        if (!Array.isArray(dataset)) {
          setError("Dataset must be a JSON array.");
          return;
        }
        if (dataset.length === 0) {
          setError("Dataset array cannot be empty.");
          return;
        }
      } catch (err) {
        setError("Invalid JSON. Make sure the dataset is a valid JSON array.");
        console.error("Dataset parse error:", err);
        return;
      }
    }
    setError(null);
    onRun(dataset, concurrency, { headless });
  };

  const iterationCount =
    inputMode === "csv"
      ? (parsedRows?.length ?? 0)
      : (() => {
          try {
            const p = JSON.parse(datasetText);
            return Array.isArray(p) ? p.length : 0;
          } catch {
            return 0;
          }
        })();

  // ── Column preview ──────────────────────────────────────────
  const previewColumns = parsedRows ? Object.keys(parsedRows[0]) : [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Data-Driven Execution
              </h2>
              <p className="text-xs text-slate-400">
                Run the flow once per row — each iteration uses its own variable
                set
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body (split layout) ─────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* LEFT — dataset input */}
          <div className="flex flex-col w-2/3 border-r border-white/10 p-6 overflow-y-auto">
            {/* mode tabs */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setInputMode("json")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  inputMode === "json"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Code2 size={13} />
                Paste JSON
              </button>
              <button
                onClick={() => setInputMode("csv")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  inputMode === "csv"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <FileSpreadsheet size={13} />
                Upload CSV
              </button>
            </div>

            {/* JSON editor */}
            {inputMode === "json" && (
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Dataset (JSON Array)
                  </span>
                  {iterationCount > 0 && (
                    <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {iterationCount} iteration
                      {iterationCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <textarea
                  className="flex-1 min-h-[260px] w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500/40 resize-none transition-colors placeholder:text-slate-600"
                  value={datasetText}
                  onChange={(e) => {
                    setDatasetText(e.target.value);
                    setError(null);
                  }}
                  placeholder={PLACEHOLDER_JSON}
                  spellCheck={false}
                />
              </div>
            )}

            {/* CSV upload */}
            {inputMode === "csv" && (
              <div className="flex flex-col gap-4">
                {!csvFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 w-full min-h-[200px] border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                  >
                    <Upload size={32} className="opacity-60" />
                    <span className="text-sm font-medium">
                      Click to upload a CSV file
                    </span>
                    <span className="text-xs opacity-60">
                      First row must be the header with variable names
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          size={18}
                          className="text-emerald-400 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-emerald-300">
                            {csvFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {parsedRows?.length} rows · {previewColumns.length}{" "}
                            columns
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Column preview */}
                    <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-4 py-2 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Detected Columns → Flow Variables
                      </div>
                      <div className="divide-y divide-white/5 max-h-[160px] overflow-y-auto">
                        {previewColumns.map((col) => (
                          <div
                            key={col}
                            className="flex items-center px-4 py-2 text-xs gap-3"
                          >
                            <span className="font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                              {col}
                            </span>
                            <span className="text-slate-600">→</span>
                            <span className="font-mono text-emerald-400">{`{{${col}}}`}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-white/5">
                        <p className="text-[10px] text-slate-600">
                          Sample:{" "}
                          {parsedRows &&
                            JSON.stringify(parsedRows[0]).slice(0, 80)}
                          ...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertTriangle size={13} className="shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* RIGHT — configuration */}
          <div className="flex flex-col w-1/3 p-6 gap-6">
            <h3 className="text-sm font-semibold text-slate-200">
              Execution Rules
            </h3>

            {/* Parallel workers */}
            <div>
              <label className="text-xs text-slate-400 mb-3 block">
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
                <span className="text-lg font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30 min-w-[48px] text-center">
                  {concurrency}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 flex items-start gap-1">
                <AlertTriangle
                  size={10}
                  className="text-yellow-500 shrink-0 mt-0.5"
                />
                High concurrency uses more host RAM and CPU.
              </p>
            </div>

            {/* Headless toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Headless Mode
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Run without visible browser windows
                </p>
              </div>
              <button
                onClick={() => setHeadless((h) => !h)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  headless ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    headless ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Summary card */}
            {iterationCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-auto p-4 bg-white/[0.03] border border-white/10 rounded-xl"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Run Summary
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Iterations</span>
                    <span className="font-mono text-white">
                      {iterationCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Workers</span>
                    <span className="font-mono text-white">{concurrency}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Mode</span>
                    <span className="font-mono text-white">
                      {headless ? "Headless" : "Visible"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Run button pinned to bottom */}
            <div className="mt-auto">
              <button
                onClick={handleRun}
                disabled={iterationCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
              >
                <Play size={16} />
                {iterationCount > 0
                  ? `Run ${iterationCount} Iteration${iterationCount !== 1 ? "s" : ""}`
                  : "Run Dataset"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
