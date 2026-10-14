import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../utils/api";
import { cn } from "../../lib/utils";
import { X, GitCompare, FileCode, Plus, Minus, PenLine, Check, Loader2, Filter } from "lucide-react";
import { motion as Motion } from "framer-motion";

const DIFF_COLORS = {
  added: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  removed: "text-red-400 bg-red-500/10 border-red-500/30",
  modified: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  unchanged: "text-slate-400 bg-slate-500/5 border-slate-500/20",
};

const DIFF_BADGE = {
  added: { label: "+ Added", icon: Plus },
  removed: { label: "- Removed", icon: Minus },
  modified: { label: "~ Modified", icon: PenLine },
  unchanged: { label: "= Same", icon: Check },
};

function DiffBadge({ type }) {
  const badge = DIFF_BADGE[type] || DIFF_BADGE.unchanged;
  const Icon = badge.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0",
      DIFF_COLORS[type],
    )}>
      <Icon size={9} />
      {badge.label}
    </span>
  );
}

function EventRow({ event, showChanges }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "border rounded-md px-2.5 py-1.5 cursor-pointer ui-transition hover:brightness-125",
        DIFF_COLORS[event.diffType],
      )}
    >
      <div className="flex items-center gap-2">
        <DiffBadge type={event.diffType} />
        <span className="text-[11px] font-mono truncate flex-1">{event.name}</span>
        <span className="text-[9px] text-slate-500 font-mono shrink-0">
          {event.type}
          {event.duration ? ` ${event.duration.toFixed(0)}ms` : ""}
        </span>
      </div>
      {expanded && showChanges && event.changes && Object.keys(event.changes).length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 space-y-1">
          {Object.entries(event.changes).map(([key, change]) => (
            <div key={key} className="text-[10px] font-mono">
              <span className="text-slate-400">{key}:</span>{" "}
              {change.before !== undefined && (
                <span className="text-red-400/80 line-through break-all">
                  {JSON.stringify(change.before)}
                </span>
              )}
              {change.before !== undefined && change.after !== undefined && " → "}
              {change.after !== undefined && (
                <span className="text-emerald-400/80 break-all">
                  {JSON.stringify(change.after)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {expanded && !showChanges && event.diffType !== "unchanged" && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] font-mono text-slate-500">
          ts={event.timestamp.toFixed(0)}ms
          {event.args?.selector && <> · selector={event.args.selector}</>}
          {event.args?.url && <> · url={event.args.url}</>}
        </div>
      )}
    </li>
  );
}

function DiffSection({ title, items, type }) {
  const filtered = type ? items.filter((i) => i.diffType === type) : items;
  if (filtered.length === 0) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
        {type && <DiffBadge type={type} />}
        {!type && title}
        <span className="text-slate-600">({filtered.length})</span>
      </h4>
      <ul className="space-y-1">
        {filtered.map((e, i) => (
          <EventRow key={`${e.name}-${i}`} event={e} showChanges={!!type} />
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({ diff }) {
  const s = diff.summary;
  const items = [
    { label: "Events added", value: s.eventsAdded, color: "text-emerald-400" },
    { label: "Events removed", value: s.eventsRemoved, color: "text-red-400" },
    { label: "Events modified", value: s.eventsModified, color: "text-amber-400" },
    { label: "Events unchanged", value: s.eventsUnchanged, color: "text-slate-400" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((it) => (
        <div key={it.label} className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
          <div className={cn("text-xl font-bold font-mono", it.color)}>{it.value}</div>
          <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function TraceDiffViewer({ runs: runsProp, onClose }) {
  const [runs, setRuns] = useState(runsProp || []);
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [tracesA, setTracesA] = useState([]);
  const [tracesB, setTracesB] = useState([]);
  const [traceA, setTraceA] = useState(null);
  const [traceB, setTraceB] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("summary");
  const [filter, setFilter] = useState("changes"); // changes | all
  const abortRef = useRef(null);

  useEffect(() => {
    if (runsProp && runsProp.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/runs?limit=200");
        const list = res.data || res || [];
        if (!cancelled) setRuns(Array.isArray(list) ? list : list.data || []);
      } catch {
        if (!cancelled) setRuns([]);
      }
    })();
    return () => { cancelled = true; };
  }, [runsProp]);

  const loadTraces = useCallback(async (runId, setTraces, setTrace) => {
    try {
      const res = await api.get(`/trace-diff/runs/${runId}/traces`);
      const list = res.data?.data || res.data || [];
      setTraces(list);
      if (list.length > 0) setTrace(list[0]);
    } catch {
      setTraces([]);
      setTrace(null);
    }
  }, []);

  useEffect(() => {
    if (selectedA) loadTraces(selectedA, setTracesA, setTraceA);
    else { setTracesA([]); setTraceA(null); }
  }, [selectedA, loadTraces]);

  useEffect(() => {
    if (selectedB) loadTraces(selectedB, setTracesB, setTraceB);
    else { setTracesB([]); setTraceB(null); }
  }, [selectedB, loadTraces]);

  const runDiff = useCallback(async () => {
    if (!traceA?.path || !traceB?.path) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDiff(null);
    try {
      const res = await api.post(
        "/trace-diff",
        { tracePathA: traceA.path, tracePathB: traceB.path },
        { signal: controller.signal },
      );
      const data = res.data?.data || res.data;
      setDiff(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.response?.data?.error || err.message || "Diff failed");
      }
    } finally {
      setLoading(false);
    }
  }, [traceA, traceB]);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const runList = runs || [];
  const canCompare = traceA && traceB && selectedA && selectedB && selectedA !== selectedB;
  const eventsForTab = diff
    ? filter === "changes"
      ? [...diff.events.added, ...diff.events.removed, ...diff.events.modified]
      : [...diff.events.added, ...diff.events.removed, ...diff.events.modified, ...diff.events.unchanged]
    : [];

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4"
    >
      <Motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <GitCompare size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Trace Diff</h2>
            <span className="text-[10px] text-slate-500 font-mono">compare two executions</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-md ui-transition text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selectors */}
        <div className="px-5 py-3 border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/20">
          {[0, 1].map((side) => {
            const selected = side === 0 ? selectedA : selectedB;
            const setSelected = side === 0 ? setSelectedA : setSelectedB;
            const traces = side === 0 ? tracesA : tracesB;
            const trace = side === 0 ? traceA : traceB;
            const setTrace = side === 0 ? setTraceA : setTraceB;
            return (
              <div key={side} className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {side === 0 ? "Base (A)" : "Compare (B)"}
                </label>
                <select
                  value={selected || ""}
                  onChange={(e) => setSelected(e.target.value || null)}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none"
                >
                  <option value="">Select run…</option>
                  {runList.map((r) => (
                    <option key={r.id || r.run_id} value={r.id || r.run_id}>
                      {(r.name || r.id || r.run_id).slice(0, 40)} · {r.status || "?"}
                    </option>
                  ))}
                </select>
                {traces.length > 1 && (
                  <select
                    value={trace?.name || ""}
                    onChange={(e) => setTrace(traces.find((t) => t.name === e.target.value) || null)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-2.5 py-1.5 text-[11px] text-slate-300 font-mono focus:border-purple-500/50 focus:outline-none"
                  >
                    {traces.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>

        {/* Compare button */}
        <div className="px-5 py-2 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <button
              onClick={runDiff}
              disabled={!canCompare || loading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ui-transition",
                canCompare && !loading
                  ? "bg-purple-500 hover:bg-purple-400 text-white"
                  : "bg-white/5 text-slate-600 cursor-not-allowed",
              )}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <GitCompare size={12} />}
              {loading ? "Comparing…" : "Compare traces"}
            </button>
            {selectedA && selectedB && selectedA === selectedB && (
              <span className="text-[10px] text-amber-400">Select two different runs</span>
            )}
          </div>
          {diff && (
            <div className="flex items-center gap-1">
              {["summary", "events", "metadata"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-semibold ui-transition",
                    tab === t
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "text-slate-500 hover:text-slate-300 border border-transparent",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          {!diff && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <FileCode size={40} className="opacity-40" />
              <p className="text-xs">Select two runs and click "Compare traces"</p>
            </div>
          )}

          {diff && tab === "summary" && (
            <>
              <SummaryCard diff={diff} />
              <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Base (A)</div>
                  <div className="text-slate-300 break-all">{diff.traceA.path}</div>
                  <div className="text-slate-500">{diff.traceA.events} events · {diff.traceA.format} format</div>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Compare (B)</div>
                  <div className="text-slate-300 break-all">{diff.traceB.path}</div>
                  <div className="text-slate-500">{diff.traceB.events} events · {diff.traceB.format} format</div>
                </div>
              </div>
            </>
          )}

          {diff && tab === "events" && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={11} className="text-slate-500" />
                  <div className="flex rounded-md overflow-hidden border border-white/10">
                    {["changes", "all"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] uppercase font-semibold ui-transition",
                          filter === f ? "bg-purple-500/30 text-purple-200" : "bg-black/40 text-slate-500 hover:text-slate-300",
                        )}
                      >
                        {f === "changes" ? "Changes only" : "All events"}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{eventsForTab.length} events</span>
              </div>

              {filter === "changes" ? (
                <div className="space-y-4">
                  <DiffSection title="Added" items={diff.events.added} type="added" />
                  <DiffSection title="Removed" items={diff.events.removed} type="removed" />
                  <DiffSection title="Modified" items={diff.events.modified} type="modified" />
                  {diff.events.added.length + diff.events.removed.length + diff.events.modified.length === 0 && (
                    <div className="text-center text-xs text-slate-600 py-8">
                      No differences found between traces ✓
                    </div>
                  )}
                </div>
              ) : (
                <DiffSection title="All events" items={eventsForTab} type={null} />
              )}
            </>
          )}

          {diff && tab === "metadata" && (
            <div className="space-y-2">
              {Object.keys(diff.metadata).length === 0 && (
                <div className="text-center text-xs text-slate-600 py-8">No metadata differences ✓</div>
              )}
              {Object.entries(diff.metadata).map(([key, change]) => (
                <div key={key} className="bg-black/30 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-300 font-semibold capitalize">{key}</span>
                  <div className="text-[11px] font-mono text-right">
                    <span className="text-red-400/80">{JSON.stringify(change.before)}</span>
                    <span className="text-slate-600 mx-2">→</span>
                    <span className="text-emerald-400/80">{JSON.stringify(change.after)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Motion.div>
    </Motion.div>
  );
}
