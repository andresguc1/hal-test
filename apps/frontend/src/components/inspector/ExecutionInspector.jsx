import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  Film,
  Image as ImageIcon,
  Info,
  ListTree,
  Loader2,
  Play,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../utils/api";
import { useTranslation } from "react-i18next";
import { buildStepRows, resolveStepLabel } from "../reporting/stepRows";

const STATUS_STYLES = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  running: "bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse",
};

const STEP_STATUS_DOT = {
  success: "bg-emerald-400",
  healed: "bg-yellow-400",
  failed: "bg-rose-400",
  softfailed: "bg-amber-400",
  blocked: "bg-fuchsia-400",
  skipped: "bg-slate-500",
  cancelled: "bg-slate-500",
  running: "bg-sky-400",
  pending: "bg-slate-600",
};

function stepDot(status) {
  return STEP_STATUS_DOT[status] || "bg-slate-600";
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes))
    return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 || value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/**
 * Resolves an artifact's byte size with a lightweight HEAD request. Returns
 * null while unknown or when the storage host rejects the request.
 */
function useFileSize(path) {
  const [size, setSize] = useState(null);
  useEffect(() => {
    setSize(null);
    if (!path) return undefined;
    const url = api.getFileUrl(path);
    if (!url) return undefined;
    const controller = new AbortController();
    fetch(url, { method: "HEAD", signal: controller.signal })
      .then((res) => {
        const len = res.headers.get("content-length");
        if (len) setSize(Number(len));
      })
      .catch(() => {
        /* size stays unknown */
      });
    return () => controller.abort();
  }, [path]);
  return size;
}

/**
 * ExecutionInspector — content for the bottom terminal toolbar's execution
 * views (Steps / Trace / Artifacts). It owns fetching the selected run and
 * derives everything from it; the surrounding toolbar owns mode switching and
 * the panel chrome, so this component renders no tab bar of its own.
 */
export default function ExecutionInspector({
  tab = "steps",
  runId,
  runSummary,
  onFocusStep,
  onInspectStep,
  onViewCode,
}) {
  const { t } = useTranslation();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Fetch the full run (steps, snapshot, artifacts) whenever the selection
  // changes. Polls while the run is still executing so the live execution is
  // reflected, and an AbortController guarantees a stale request never
  // overwrites the current run.
  useEffect(() => {
    if (!runId) {
      setRun(null);
      setLoadError(null);
      return undefined;
    }
    const controller = new AbortController();
    let intervalId = null;

    const fetchRun = async (showLoading) => {
      if (showLoading) setLoading(true);
      try {
        const res = await api.get(`/runs/${runId}`, {
          signal: controller.signal,
        });
        if (res?.data) {
          setRun(res.data);
          setLoadError(null);
          const stillRunning = res.data.status === "running";
          if (stillRunning && !intervalId) {
            intervalId = setInterval(() => fetchRun(false), 2000);
          } else if (!stillRunning && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          setLoadError("not-found");
        }
      } catch (err) {
        if (err?.name !== "AbortError") setLoadError(err?.message || "error");
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchRun(true);
    return () => {
      controller.abort();
      if (intervalId) clearInterval(intervalId);
    };
  }, [runId]);

  const steps = useMemo(() => run?.steps || [], [run]);

  const snapshotNodeById = useMemo(() => {
    const map = {};
    if (run?.flow_snapshot) {
      try {
        const snapshot = JSON.parse(run.flow_snapshot);
        (snapshot.nodes || []).forEach((n) => {
          map[n.nodeId || n.id] = n;
        });
      } catch {
        /* malformed snapshot — labels fall back to step data */
      }
    }
    return map;
  }, [run]);

  const counts = useMemo(() => {
    let passed = 0;
    let failed = 0;
    steps.forEach((s) => {
      if (s.status === "success" || s.status === "healed") passed += 1;
      else if (s.status === "failed" || s.status === "softfailed") failed += 1;
    });
    return { total: steps.length, passed, failed };
  }, [steps]);

  if (!runId) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-mono">
        <ListTree size={22} className="opacity-40" />
        {t(
          "inspector.no_run",
          "Select an execution from the History to inspect it here.",
        )}
      </div>
    );
  }

  const summary = run || runSummary || {};
  const statusStyle = STATUS_STYLES[summary.status] || STATUS_STYLES.running;
  const startTime = summary.started_at ? new Date(summary.started_at) : null;

  return (
    <div className="h-full flex flex-col font-mono">
      {/* Run info strip */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-white/5 bg-slate-900/40 shrink-0 text-[10px]">
        <span
          className={cn(
            "font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0",
            statusStyle,
          )}
        >
          {summary.status || "run"}
        </span>
        <span className="text-slate-400 truncate">
          {t("inspector.run_id", "ID")}: {String(runId).slice(0, 12)}
        </span>
        {startTime && (
          <span className="text-slate-500 truncate hidden md:inline">
            {startTime.toLocaleString()}
          </span>
        )}
        {run && (
          <span className="hidden lg:flex items-center gap-3 text-slate-500 ml-auto">
            <span>
              {t("inspector.duration", "Duration")}:{" "}
              {formatDuration(run.duration_ms)}
            </span>
            <span className="text-emerald-400/80">{counts.passed} ✓</span>
            {counts.failed > 0 && (
              <span className="text-rose-400/80">{counts.failed} ✕</span>
            )}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 relative bg-slate-950/40">
        {loading && !run ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 size={20} className="animate-spin text-indigo-400" />
            {t("inspector.loading", "Loading execution details...")}
          </div>
        ) : loadError ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <AlertCircle size={20} className="opacity-50" />
            {t("inspector.load_error", "Could not load this execution.")}
          </div>
        ) : tab === "steps" ? (
          <StepsTab
            rows={buildStepRows(steps, snapshotNodeById)}
            counts={counts}
            snapshotNodeById={snapshotNodeById}
            onFocusStep={onFocusStep}
            onInspectStep={onInspectStep}
            onViewCode={onViewCode}
            t={t}
          />
        ) : tab === "trace" ? (
          <TraceTab run={run} runId={runId} t={t} />
        ) : (
          <ArtifactsTab
            run={run}
            steps={steps}
            snapshotNodeById={snapshotNodeById}
            onFocusStep={onFocusStep}
            onInspectStep={onInspectStep}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

function StepsTab({
  rows,
  counts,
  snapshotNodeById,
  onFocusStep,
  onInspectStep,
  onViewCode,
  t,
}) {
  if (rows.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
        <ListTree size={20} className="opacity-40" />
        {t("inspector.no_steps", "No steps recorded for this execution.")}
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-3 py-1.5 text-[10px] text-slate-400 border-b border-white/5 shrink-0">
        <span>
          {t("inspector.steps_total", "Total")}: {counts.total}
        </span>
        <span className="text-emerald-400">
          {t("inspector.steps_passed", "Passed")}: {counts.passed}
        </span>
        <span
          className={counts.failed > 0 ? "text-rose-400" : "text-slate-500"}
        >
          {t("inspector.steps_failed", "Failed")}: {counts.failed}
        </span>
        <span className="ml-auto text-slate-500">
          {t("inspector.steps_hint", "Click a step to focus it on the canvas")}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rows.map((row) => {
          const step = row.step;
          const label = resolveStepLabel(step, snapshotNodeById);
          const isContainer = row.type === "container";
          return (
            <div
              key={`${row.flatIdx}-${row.type}`}
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.03] hover:bg-white/5 ui-transition cursor-pointer",
                isContainer && "bg-white/[0.02]",
              )}
              onClick={() => onFocusStep?.(step)}
              onDoubleClick={() => onInspectStep?.(step)}
            >
              <span
                className="shrink-0"
                style={{ width: row.depth * 14 }}
                aria-hidden="true"
              />
              {isContainer && (
                <Boxes size={11} className="text-indigo-300/80 shrink-0" />
              )}
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  stepDot(step.status),
                )}
              />
              <span className="text-[9px] text-slate-600 w-6 shrink-0">
                {row.flatIdx + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] truncate flex-1",
                  isContainer && "font-semibold text-slate-100",
                  step.status === "failed"
                    ? "text-rose-300"
                    : !isContainer && "text-slate-200",
                )}
                title={label}
              >
                {label}
              </span>
              {isContainer && row.descendantCount > 0 && (
                <span
                  className="shrink-0 text-[9px] px-1.5 py-px rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  title={t("inspector.container_children", "Nested steps")}
                >
                  {row.descendantCount}
                </span>
              )}
              {step.node_type && (
                <span className="text-[9px] text-slate-600 shrink-0 hidden sm:inline">
                  {step.node_type}
                </span>
              )}
              {step.error && (
                <span className="text-amber-400/80 shrink-0" title={step.error}>
                  <AlertTriangle size={11} />
                </span>
              )}
              <span className="text-[10px] text-slate-400 w-14 text-right shrink-0">
                {formatDuration(step.duration_ms)}
              </span>
              {onViewCode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCode(step);
                  }}
                  title={t("inspector.view_code", "View generated code")}
                  aria-label={t("inspector.view_code", "View generated code")}
                  className="shrink-0 p-1 rounded text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ui-transition"
                >
                  <FileCode size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TraceTab({ run, runId, t }) {
  const [traces, setTraces] = useState([]);
  const [selectedTracePath, setSelectedTracePath] = useState(null);
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  useEffect(() => {
    setSelectedTracePath(null);
    setTraces([]);
    setIsFrameLoading(true);
    if (!runId) return undefined;
    let cancelled = false;
    api
      .get(`/trace-diff/runs/${runId}/traces`)
      .then((res) => {
        if (!cancelled) setTraces(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setTraces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const traceOptions = useMemo(() => {
    const list = [...traces];
    if (run?.trace_path && !list.some((item) => item.path === run.trace_path)) {
      list.unshift({
        path: run.trace_path,
        name: run.trace_path.split("/").pop(),
      });
    }
    return list;
  }, [traces, run]);

  const effectiveTracePath =
    selectedTracePath ?? run?.trace_path ?? traces[0]?.path ?? null;

  const viewerSrc = useMemo(() => {
    if (!effectiveTracePath) return null;
    const traceUrl = api.getFileUrl(effectiveTracePath);
    if (!traceUrl) return null;
    try {
      const origin = new URL(traceUrl).origin;
      return `${origin}/trace-viewer/index.html?trace=${encodeURIComponent(traceUrl)}`;
    } catch {
      return null;
    }
  }, [effectiveTracePath]);

  if (!effectiveTracePath) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
        <AlertCircle size={20} className="opacity-50" />
        {t("inspector.no_trace", "No trace available for this execution.")}
      </div>
    );
  }
  if (!viewerSrc) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
        <AlertCircle size={20} className="opacity-50" />
        {t("inspector.invalid_trace", "Trace reference is invalid.")}
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 shrink-0">
        {traceOptions.length > 1 && (
          <select
            value={effectiveTracePath}
            onChange={(e) => {
              setIsFrameLoading(true);
              setSelectedTracePath(e.target.value);
            }}
            className="max-w-[220px] bg-[#1e293b] border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            aria-label={t("inspector.select_trace", "Select trace")}
          >
            {traceOptions.map((option) => (
              <option key={option.path} value={option.path}>
                {option.name}
              </option>
            ))}
          </select>
        )}
        <span className="text-[10px] text-slate-500 truncate flex-1">
          {t(
            "inspector.trace_hint",
            "Timeline, screenshots, DOM snapshots, network and console.",
          )}
        </span>
        <a
          href={viewerSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 ui-transition shrink-0"
        >
          <ExternalLink size={11} />
          {t("inspector.open_new_tab", "Open in new tab")}
        </a>
      </div>
      <div className="flex-1 min-h-0 relative bg-black">
        {isFrameLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-slate-400 text-xs">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
            {t("inspector.loading_trace", "Loading trace viewer...")}
          </div>
        )}
        <iframe
          key={viewerSrc}
          src={viewerSrc}
          onLoad={() => setIsFrameLoading(false)}
          onError={() => setIsFrameLoading(false)}
          className="w-full h-full border-0"
          title={t("inspector.viewer_title", "Playwright Trace Viewer")}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

function ArtifactsTab({
  run,
  steps,
  snapshotNodeById,
  onFocusStep,
  onInspectStep,
  t,
}) {
  const videoUrl = run?.video_path ? api.getFileUrl(run.video_path) : null;
  const traceUrl = run?.trace_path ? api.getFileUrl(run.trace_path) : null;
  const videoSize = useFileSize(run?.video_path);
  const traceSize = useFileSize(run?.trace_path);

  const screenshots = useMemo(
    () =>
      steps
        .filter((s) => s.screenshot_path)
        .map((s) => ({
          path: s.screenshot_path,
          label: resolveStepLabel(s, snapshotNodeById),
        })),
    [steps, snapshotNodeById],
  );

  const errors = useMemo(
    () =>
      steps.filter((s) => s.status === "failed" || s.status === "softfailed"),
    [steps],
  );

  const downloads = useMemo(() => {
    const list = [];
    if (run?.video_path && videoUrl) {
      list.push({
        key: "video",
        label: t("inspector.video", "Recording"),
        filename: run.video_path.split("/").pop(),
        url: videoUrl,
        size: videoSize,
        Icon: Film,
      });
    }
    if (run?.trace_path && traceUrl) {
      list.push({
        key: "trace",
        label: t("inspector.trace", "Trace"),
        filename: run.trace_path.split("/").pop(),
        url: traceUrl,
        size: traceSize,
        Icon: FileArchive,
      });
    }
    return list;
  }, [run, videoUrl, traceUrl, videoSize, traceSize, t]);

  if (
    downloads.length === 0 &&
    screenshots.length === 0 &&
    errors.length === 0
  ) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
        <Film size={20} className="opacity-40" />
        {t(
          "inspector.no_artifacts",
          "No video or screenshots for this execution.",
        )}
      </div>
    );
  }

  const metadata = run
    ? [
        [t("inspector.meta_flow", "Flow"), run.flow_name || run.flow_id],
        [t("inspector.meta_trigger", "Trigger"), run.trigger],
        [
          t("inspector.meta_started", "Started"),
          run.started_at ? new Date(run.started_at).toLocaleString() : null,
        ],
        [
          t("inspector.meta_finished", "Finished"),
          run.finished_at ? new Date(run.finished_at).toLocaleString() : null,
        ],
        [t("inspector.duration", "Duration"), formatDuration(run.duration_ms)],
        [t("inspector.meta_browser", "Browser"), run.browser_version],
        [t("inspector.meta_healed", "Selectors healed"), run.total_healed],
        [
          t("inspector.meta_memory", "Replay-cache hits"),
          run.memory_palace_hits,
        ],
      ].filter(
        ([, value]) => value !== null && value !== undefined && value !== "",
      )
    : [];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-4 p-3">
        {downloads.length > 0 && (
          <section>
            <SectionTitle Icon={Download}>
              {t("inspector.downloads", "Downloads")}
            </SectionTitle>
            <div className="flex flex-wrap gap-2">
              {downloads.map((d) => (
                <a
                  key={d.key}
                  href={d.url}
                  download={d.filename}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-500/40 text-[11px] text-slate-200 ui-transition"
                >
                  <d.Icon size={13} className="text-indigo-300" />
                  <span>{d.label}</span>
                  {d.size ? (
                    <span className="text-slate-500">
                      · {formatBytes(d.size)}
                    </span>
                  ) : null}
                  <Download size={12} className="text-slate-500" />
                </a>
              ))}
            </div>
          </section>
        )}

        {(videoUrl || screenshots.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-4">
            {videoUrl && (
              <div className="lg:w-1/2 shrink-0">
                <SectionTitle Icon={Play}>
                  {t("inspector.video", "Recording")}
                </SectionTitle>
                <video
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="w-full rounded-lg border border-white/10 bg-black"
                />
              </div>
            )}
            {screenshots.length > 0 && (
              <div className="flex-1 min-w-0">
                <SectionTitle Icon={ImageIcon}>
                  {t("inspector.screenshots", "Screenshots")} (
                  {screenshots.length})
                </SectionTitle>
                <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
                  {screenshots.map((shot, index) => {
                    const url = api.getFileUrl(shot.path);
                    return (
                      <a
                        key={`${shot.path}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={shot.label}
                        className="group relative aspect-video overflow-hidden rounded-md border border-white/10 bg-slate-900 hover:border-indigo-500/50 ui-transition"
                      >
                        <img
                          src={url}
                          alt={shot.label}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <section>
            <SectionTitle Icon={AlertTriangle} tone="rose">
              {t("inspector.errors", "Failed steps")} ({errors.length})
            </SectionTitle>
            <div className="flex flex-col gap-1.5">
              {errors.map((step, index) => {
                const shot = step.screenshot_path
                  ? api.getFileUrl(step.screenshot_path)
                  : null;
                const label = resolveStepLabel(step, snapshotNodeById);
                return (
                  <div
                    key={`${step.nodeId || step.node_id}-${index}`}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-md border border-rose-500/15 bg-rose-500/5 hover:border-rose-500/40 ui-transition cursor-pointer"
                    onClick={() => onFocusStep?.(step)}
                    onDoubleClick={() => onInspectStep?.(step)}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        stepDot(step.status),
                      )}
                    />
                    <span className="text-[11px] text-rose-200 truncate shrink-0 max-w-[200px]">
                      {label}
                    </span>
                    <span
                      className="text-[10px] text-rose-300/70 truncate flex-1"
                      title={step.error || ""}
                    >
                      {step.error}
                    </span>
                    {shot && (
                      <a
                        href={shot}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={t(
                          "inspector.view_screenshot",
                          "View screenshot",
                        )}
                        className="shrink-0 w-10 h-7 rounded overflow-hidden border border-white/10 bg-black"
                      >
                        <img
                          src={shot}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {metadata.length > 0 && (
          <section>
            <SectionTitle Icon={Info}>
              {t("inspector.metadata", "Metadata")}
            </SectionTitle>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[10px]">
              {metadata.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-slate-500 uppercase tracking-wider text-[9px]">
                    {key}
                  </dt>
                  <dd className="text-slate-300 truncate" title={String(value)}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ Icon, tone, children }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider font-bold",
        tone === "rose" ? "text-rose-300" : "text-slate-400",
      )}
    >
      {React.createElement(Icon, { size: 12 })} {children}
    </div>
  );
}
