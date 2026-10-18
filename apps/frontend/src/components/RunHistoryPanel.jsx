import React, { useCallback, useMemo, useState } from "react";
import { api } from "../utils/api";
import { cn } from "../lib/utils";
import {
  History,
  X,
  RefreshCw,
  Trash2,
  Play,
  Activity,
  ChevronLeft,
  Database,
  Download,
  Loader2,
  FileCode,
  GitCompare,
  Search,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRuns, dashboardKeys } from "./dashboard/hooks/useDashboardData";
import { TraceDiffViewer } from "./trace-diff";

const WIDTH_EXPANDED = 320;
const WIDTH_COLLAPSED = 48;

export default function RunHistoryPanel({
  isOpen,
  onSelectRun,
  onViewTrace,
  currentFlowId,
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [datasetsByRun, setDatasetsByRun] = useState({});
  const [loadingDatasets, setLoadingDatasets] = useState({});

  const {
    data: runs = [],
    isLoading,
    refetch,
    isFetching,
  } = useRuns({
    flowId: currentFlowId,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const visibleRuns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return runs;
    return runs.filter((run) => run.id.toLowerCase().includes(query));
  }, [runs, search]);

  const handleRunClick = (run) => {
    setSelectedRunId(run.id);
    onSelectRun(run);
    loadDatasets(run.id);
  };

  const loadDatasets = useCallback(
    async (runId) => {
      if (!runId || datasetsByRun[runId] || loadingDatasets[runId]) return;
      setLoadingDatasets((prev) => ({ ...prev, [runId]: true }));
      try {
        const res = await api.get(`/runs/${runId}/datasets`);
        setDatasetsByRun((prev) => ({
          ...prev,
          [runId]: res.data || [],
        }));
      } catch (error) {
        console.error("Failed to load datasets for run:", error);
      } finally {
        setLoadingDatasets((prev) => ({ ...prev, [runId]: false }));
      }
    },
    [datasetsByRun, loadingDatasets],
  );

  const handleClearHistory = async () => {
    if (!window.confirm(t("history.clear_confirm"))) return;
    try {
      setIsDeleting(true);
      const res = await api.delete("/runs");
      if (res.success) {
        setSelectedRunId(null);
        onSelectRun(null);
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Motion.div
      initial={false}
      animate={{ width: isMinimized ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-full flex flex-col shrink-0 glass-panel z-[var(--z-hud)] border-l border-white/5 bg-[#0f172a]/95 backdrop-blur-xl"
    >
      {isMinimized ? (
        <div className="flex flex-col items-center pt-3 gap-3">
          <button
            onClick={() => setIsMinimized(false)}
            title={t("history.title")}
            aria-label={t("history.title")}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
          >
            <History size={18} />
          </button>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="h-12 flex items-center justify-between px-3 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <History size={14} className="text-indigo-400" />
              </div>
              <span className="font-bold text-xs tracking-widest text-slate-100">
                {t("history.title")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDiff(true)}
                className="p-1.5 hover:bg-purple-500/20 rounded-md text-slate-400 hover:text-purple-400 transition-colors"
                title={t("history.compare")}
                aria-label={t("history.compare")}
              >
                <GitCompare size={14} />
              </button>
              {runs.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  disabled={isDeleting}
                  className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title={t("history.clear")}
                  aria-label={t("history.clear")}
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                title={t("history.refresh")}
                aria-label={t("history.refresh")}
              >
                <RefreshCw
                  size={14}
                  className={isFetching ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="p-2.5 border-b border-white/5 bg-slate-900/30 space-y-2">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("history.search_placeholder")}
                aria-label={t("history.search_placeholder")}
                className="w-full bg-[#1e293b] border border-slate-700 text-slate-300 text-xs rounded pl-7 pr-2 py-1.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t("history.filter_all")}</option>
              <option value="failed">{t("history.filter_failed")}</option>
              <option value="completed">{t("history.filter_completed")}</option>
            </select>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1.5">
            {(isLoading || isDeleting) && runs.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                <RefreshCw size={16} className="animate-spin mr-2" />
                {t("history.loading")}
              </div>
            ) : visibleRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs gap-2">
                <History size={24} className="opacity-30" />
                <span>{t("history.empty")}</span>
              </div>
            ) : (
              visibleRuns.map((run) => (
                <div
                  key={run.id}
                  className={cn(
                    "group relative w-full text-left p-2 rounded-lg ui-transition border cursor-pointer",
                    "bg-slate-900/40 hover:bg-slate-800/60",
                    selectedRunId === run.id
                      ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "border-white/5 hover:border-white/10",
                  )}
                  onClick={() => handleRunClick(run)}
                >
                  {/* ROW 1: status · time · duration */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0",
                        run.status === "completed" &&
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                        run.status === "failed" &&
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                        run.status === "running" &&
                          "bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          run.status === "completed"
                            ? "bg-emerald-400"
                            : run.status === "failed"
                              ? "bg-rose-400"
                              : "bg-sky-400",
                        )}
                      />
                      {run.status}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {new Date(run.started_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-500 font-mono shrink-0">
                      {run.duration_ms
                        ? `${(run.duration_ms / 1000).toFixed(2)}s`
                        : "--"}
                    </span>
                  </div>

                  {/* ROW 2: id/date · actions */}
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="text-[9px] text-slate-600 font-mono truncate">
                      {new Date(run.started_at).toLocaleDateString()} ·{" "}
                      {t("history.id")}: {run.id.slice(0, 6)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRun(run, true);
                        }}
                        className="p-1 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-md text-indigo-400 ui-transition border border-indigo-500/30"
                        title={t("history.report")}
                        aria-label={t("history.report")}
                      >
                        <Activity size={11} />
                      </button>

                      {run.video_status === "finalizing" && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          {t("history.video_processing")}
                        </span>
                      )}
                      {run.video_status === "failed" && !run.video_path && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          {t("history.video_unavailable")}
                        </span>
                      )}
                      {run.video_status === "recording" && !run.video_path && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          {t("history.recording")}
                        </span>
                      )}

                      {run.video_path ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingVideo(api.getFileUrl(run.video_path));
                          }}
                          className="flex items-center gap-1 px-1.5 py-1 bg-sky-500/20 hover:bg-sky-500/40 rounded-md text-sky-400 ui-transition border border-sky-500/30 text-[9px] font-semibold"
                          title={t("history.watch")}
                          aria-label={t("history.watch")}
                        >
                          <Play size={11} fill="currentColor" />
                          {t("history.watch")}
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono">
                          {t("history.no_video")}
                        </span>
                      )}

                      {run.trace_path && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTrace?.(run);
                          }}
                          className="flex items-center gap-1 px-1.5 py-1 bg-purple-500/20 hover:bg-purple-500/40 rounded-md text-purple-400 ui-transition border border-purple-500/30 text-[9px] font-semibold"
                          title={t("history.trace")}
                          aria-label={t("history.trace")}
                        >
                          <FileCode size={11} fill="currentColor" />
                          {t("history.trace")}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedRunId === run.id &&
                    (loadingDatasets[run.id] ? (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Loader2 size={12} className="animate-spin" />
                        {t("history.loading_datasets")}
                      </div>
                    ) : (datasetsByRun[run.id]?.length ?? 0) > 0 ? (
                      <div className="mt-2 border-t border-white/5 pt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-yellow-400/80 font-bold">
                          <Database size={10} />
                          {t("history.datasets")}
                        </div>
                        {datasetsByRun[run.id].map((file) => (
                          <a
                            key={file.fileName}
                            href={api.getFileUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-[10px] text-yellow-300/90 ui-transition"
                            title={`Download ${file.fileName}`}
                          >
                            <span className="font-mono truncate">
                              {file.fileName}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="text-slate-500">
                                {file.bytes > 1024
                                  ? `${(file.bytes / 1024).toFixed(1)} KB`
                                  : `${file.bytes} B`}
                              </span>
                              <Download size={10} />
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-[9px] text-slate-600 font-mono flex items-center gap-1">
                        <Database size={9} /> {t("history.no_datasets")}
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="p-2 border-t border-white/5 shrink-0 bg-[#0f172a]/80">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-canvas)] transition-all group"
            >
              <ChevronLeft size={14} />
              <span className="text-[11px] font-medium">
                {t("history.hide")}
              </span>
            </button>
          </div>
        </>
      )}

      {/* VIDEO MODAL */}
      <AnimatePresence>
        {playingVideo && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlayingVideo(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4"
          >
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md ui-transition"
                >
                  <X size={20} />
                </button>
              </div>
              <video
                src={playingVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* TRACE DIFF MODAL */}
      <AnimatePresence>
        {showDiff && <TraceDiffViewer onClose={() => setShowDiff(false)} />}
      </AnimatePresence>
    </Motion.div>
  );
}
