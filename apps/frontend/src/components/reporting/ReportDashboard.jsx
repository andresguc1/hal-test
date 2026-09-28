import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import {
  X,
  Clock,
  Activity,
  Zap,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  BrainCircuit,
  Maximize2,
  ListTree,
  Bug,
  Crosshair,
  Film,
  Repeat,
  Loader2,
  Sparkles,
  RefreshCw,
  Code2,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { api } from "../../utils/api";
import { nodeTypes } from "../nodes"; // Reuse existing node types
import CustomEdge from "../edges/CustomEdge";
import { NODE_STATES } from "../hooks/flowStyles";
import { useFigmaInteraction } from "../../hooks/useFigmaInteraction";
import { useToast } from "../../hooks/useToast";
import {
  buildStepRows,
  resolveStepLabel,
  replayOrder,
  playbackStartIndex,
  nextPlaybackIndex,
} from "./stepRows";

const edgeTypes = {
  custom: CustomEdge,
};

const STATUS_STYLES = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  softfailed: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  healed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  skipped: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  blocked: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
  running: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/30",
};

/** Solid tick colour for the scrubber, keyed by step status. */
function tickColor(status) {
  switch (status) {
    case "success":
      return "bg-emerald-400/70";
    case "failed":
      return "bg-rose-400/80";
    case "softfailed":
    case "healed":
      return "bg-amber-400/80";
    case "running":
      return "bg-sky-400/80";
    case "blocked":
      return "bg-fuchsia-400/80";
    default:
      return "bg-slate-600/70";
  }
}

/**
 * Maps a StepResult status string to the NODE_STATES constant used by AbyssNode.
 */
function stepStatusToNodeState(status) {
  switch (status) {
    case "success":
      return NODE_STATES.SUCCESS;
    case "failed":
      return NODE_STATES.ERROR;
    case "softfailed":
      return NODE_STATES.WARNING;
    case "blocked":
      return NODE_STATES.DEFAULT;
    case "cancelled":
      return NODE_STATES.SKIPPED;
    case "healed":
      return NODE_STATES.HEALED;
    case "skipped":
      return NODE_STATES.SKIPPED;
    default:
      return NODE_STATES.DEFAULT;
  }
}

/**
 * Derives an edge-id → executionState map from the ordered steps array by
 * walking consecutive pairs of steps to reconstruct the traversed edges.
 */
function computeEdgeStates(steps, upToIndex, allEdges) {
  const map = new Map();
  if (!steps || steps.length === 0 || upToIndex < 0) return map;

  for (let i = 1; i <= upToIndex; i++) {
    const fromId = steps[i - 1].node_id || steps[i - 1].nodeId;
    const toId = steps[i].node_id || steps[i].nodeId;
    const edge = allEdges.find((e) => e.source === fromId && e.target === toId);
    if (edge) {
      // The edge into the current (active) node is "running"; all prior are "success"
      const state = i === upToIndex ? "running" : "success";
      map.set(edge.id, state);
    }
  }
  return map;
}

const SECRET_KEYS =
  /password|passwd|secret|token|api[_-]?key|authorization|credential/i;

function redactSensitive(value, key) {
  if (key && SECRET_KEYS.test(String(key))) return "••••••";
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = redactSensitive(v, k);
    return out;
  }
  return value;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function statusLabel(status) {
  const label = String(status || "unknown").toUpperCase();
  return label === "SOFTFAILED" ? "SOFT FAILED" : label;
}

function ReportDashboardContent({ runId, onClose, onViewCode }) {
  const { t } = useTranslation();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [evidenceTab, setEvidenceTab] = useState("screenshot");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const videoRef = useRef(null);
  const stepListRef = useRef(null);

  const { fitView } = useReactFlow();
  const { figmaConfig } = useFigmaInteraction();
  const toast = useToast();

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
        /* ignore */
      }
    }
    return map;
  }, [run]);

  const stepRows = useMemo(
    () => buildStepRows(steps, snapshotNodeById),
    [steps, snapshotNodeById],
  );

  // Visible order of the replay (containers before their children).
  const playbackOrder = useMemo(() => replayOrder(stepRows), [stepRows]);
  const playbackPosition = playbackOrder.indexOf(currentStepIndex);

  const runOutcome = useMemo(() => {
    if (!run) return { label: "—", tone: "neutral" };
    if (run.status === "running")
      return { label: "IN PROGRESS", tone: "running" };
    const hasFailure = steps.some((s) =>
      ["failed", "softfailed", "cancelled"].includes(s.status),
    );
    if (run.status === "completed" && !hasFailure)
      return { label: "PASSED", tone: "success" };
    return { label: hasFailure ? "FAILED" : "COMPLETED", tone: "failed" };
  }, [run, steps]);

  const topLevelCount = useMemo(
    () =>
      steps.filter(
        (s) => (s.compositeNodeId || null) === null || !s.compositeNodeId,
      ).length,
    [steps],
  );

  const failedStepIndex = useMemo(
    () =>
      steps.findIndex((s) =>
        ["failed", "softfailed", "cancelled"].includes(s.status),
      ),
    [steps],
  );

  // Current Step Data
  const currentStep = useMemo(() => {
    if (!run || !steps || currentStepIndex < 0) return null;
    return steps[currentStepIndex];
  }, [run, steps, currentStepIndex]);

  // Auto-Fit Canvas when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  // Load Run Data
  useEffect(() => {
    async function fetchRun() {
      try {
        const res = await api.get(`/runs/${runId}`);
        if (res.success) {
          const runData = res.data;
          setRun(runData);

          if (runData.flow_snapshot) {
            const snapshot = JSON.parse(runData.flow_snapshot);
            const normalizedNodes = (snapshot.nodes || []).map((n) => ({
              ...n,
              id: n.nodeId || n.id,
            }));
            const normalizedEdges = (snapshot.edges || []).map((e) => ({
              ...e,
              id: e.edgeId || e.id,
              source: e.source,
              target: e.target,
            }));

            const mappedSteps = runData.steps || [];
            const processedNodes = (normalizedNodes || []).map((n) => {
              const step = mappedSteps.find(
                (s) => (s.node_id || s.nodeId) === n.id,
              );
              return {
                ...n,
                draggable: false,
                selectable: true,
                type: n.type || "default",
                data: {
                  ...n.data,
                  state: step
                    ? stepStatusToNodeState(step.status)
                    : NODE_STATES.DEFAULT,
                  error: step?.error,
                  screenshot: step?.screenshot_path || step?.screenshot,
                },
              };
            });

            const processedEdges = (normalizedEdges || []).map((e) => ({
              ...e,
              type: e.type || "custom",
              data: { ...(e.data || {}), executionState: "idle" },
            }));

            setNodes(processedNodes);
            setEdges(processedEdges);
          }
        }
      } catch (err) {
        console.error("Failed to load run for reporting:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRun();
  }, [runId, setNodes, setEdges]);

  // Scroll the active step into view
  useEffect(() => {
    if (currentStepIndex < 0) {
      // Restore canvas to the first executed node when leaving the timeline.
      return;
    }
    const activeEl = stepListRef.current?.querySelector(
      '[data-flat-index="' + currentStepIndex + '"]',
    );
    activeEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentStepIndex]);

  // Sync Video time with current step's timestamp (scrubbing/manual navigation)
  useEffect(() => {
    if (
      evidenceTab === "video" &&
      videoRef.current &&
      currentStep &&
      currentStep.video_timestamp !== null &&
      currentStep.video_timestamp !== undefined
    ) {
      const diff = Math.abs(
        videoRef.current.currentTime - currentStep.video_timestamp,
      );
      if (diff > 0.8) {
        videoRef.current.currentTime = currentStep.video_timestamp;
      }
    }
  }, [currentStepIndex, evidenceTab, currentStep]);

  // Sync HTML5 Video playback with isPlaying state. The element stays mounted
  // even off the video tab (so currentTime survives tab switches), therefore it
  // must be paused whenever video is not the active surface.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying && evidenceTab === "video") {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, evidenceTab]);

  // Adjust video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, evidenceTab]);

  // Sync Canvas with current step
  useEffect(() => {
    if (!run || !steps) return;

    const normalizedSteps = steps.map((s) => ({
      ...s,
      node_id: s.node_id || s.nodeId,
    }));
    const activeNodeId = normalizedSteps[currentStepIndex]?.node_id ?? null;

    setNodes((prev) =>
      prev.map((node) => {
        const stepForThisNode = normalizedSteps
          .slice(0, currentStepIndex + 1)
          .findLast((s) => s.node_id === node.id);
        const isActive = node.id === activeNodeId;
        const nodeState = isActive
          ? NODE_STATES.EXECUTING
          : stepForThisNode
            ? stepStatusToNodeState(stepForThisNode.status)
            : NODE_STATES.DEFAULT;
        return {
          ...node,
          data: {
            ...node.data,
            state: nodeState,
            active: isActive,
          },
        };
      }),
    );

    setEdges((prev) => {
      const edgeStateMap = computeEdgeStates(
        normalizedSteps,
        currentStepIndex,
        prev,
      );
      return prev.map((edge) => ({
        ...edge,
        data: {
          ...(edge.data || {}),
          executionState: edgeStateMap.get(edge.id) ?? "idle",
        },
      }));
    });
  }, [currentStepIndex, run, steps, setNodes, setEdges]);

  // Autoplay follows the visible playback order (containers before their
  // children) and uses the step's real duration when recorded. In video mode
  // the video element drives the timeline instead, so this stays idle.
  useEffect(() => {
    if (!isPlaying || evidenceTab === "video" || !steps || steps.length === 0) {
      return;
    }

    const step = steps[currentStepIndex];
    let delay = 900 / playbackSpeed;
    if (
      step?.started_at &&
      step?.finished_at &&
      step.finished_at > step.started_at
    ) {
      const wall = new Date(step.finished_at) - new Date(step.started_at);
      if (wall > 0) delay = Math.max(180, wall / playbackSpeed);
    } else if (
      (typeof step?.duration_ms === "number" && step.duration_ms > 0) ||
      (step?.duration_ms && step.duration_ms > 0)
    ) {
      delay = Math.max(180, step.duration_ms / playbackSpeed);
    }

    const timer = setTimeout(() => {
      const next = nextPlaybackIndex(playbackOrder, currentStepIndex);
      if (next === -1) {
        if (loopPlayback && playbackOrder.length > 0) {
          setCurrentStepIndex(playbackOrder[0]);
        } else {
          setIsPlaying(false);
        }
      } else {
        setCurrentStepIndex(next);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [
    isPlaying,
    currentStepIndex,
    steps,
    playbackSpeed,
    evidenceTab,
    playbackOrder,
    loopPlayback,
  ]);

  // Handle Video Time Update to synchronize currentStepIndex during playback
  const handleVideoTimeUpdate = () => {
    if (evidenceTab !== "video" || !videoRef.current || !run || !steps) return;
    const currentTime = videoRef.current.currentTime;
    let matchedIndex = -1;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.video_timestamp !== null && step.video_timestamp !== undefined) {
        if (step.video_timestamp <= currentTime) {
          matchedIndex = i;
        } else {
          break;
        }
      }
    }
    if (matchedIndex !== -1 && matchedIndex !== currentStepIndex) {
      setCurrentStepIndex(matchedIndex);
    }
  };

  const jumpToFailure = () => {
    if (failedStepIndex === -1) return;
    setCurrentStepIndex(failedStepIndex);
    setEvidenceTab("screenshot");
  };

  // Download the self-contained HTML report generated from the real step
  // records (screenshots embedded as base64 by the backend exporter).
  const handleDownloadReport = async () => {
    if (!runId || downloading) return;
    setDownloading(true);
    try {
      const blob = await api.download(`/runs/${runId}/report`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `haltest_run_${runId.slice(0, 8)}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (error) {
      toast.error(error.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  // Ask the AI to interpret the OBSERVED facts of the selected step and
  // persist the result. Opt-in only: nothing is generated automatically.
  const handleGenerateDiagnosis = async () => {
    const stepId = currentStep?.id;
    if (!runId || !stepId || diagnosing) return;
    setDiagnosing(true);
    try {
      const result = await api.post("/ai/diagnose-step", { runId, stepId });
      if (result?.ai_diagnosis) {
        setRun((prev) =>
          prev
            ? {
                ...prev,
                steps: (prev.steps || []).map((step) =>
                  step.id === stepId
                    ? { ...step, ai_diagnosis: result.ai_diagnosis }
                    : step,
                ),
              }
            : prev,
        );
        toast.success("Diagnosis generated");
      } else {
        toast.error("The AI returned no diagnosis");
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate diagnosis");
    } finally {
      setDiagnosing(false);
    }
  };

  const hasSteps = steps.length > 0;

  // Play from wherever the user is: a selected mid-run step resumes there;
  // no selection or the final step restarts the replay from the top so the
  // control is usable from any point in the timeline.
  const startPlayback = () => {
    if (!hasSteps) return;
    const startIndex = playbackStartIndex(playbackOrder, currentStepIndex);
    if (startIndex === -1) return;
    if (startIndex !== currentStepIndex) setCurrentStepIndex(startIndex);
    if (evidenceTab === "video" && videoRef.current) {
      const ts = steps[startIndex]?.video_timestamp;
      if (typeof ts === "number") videoRef.current.currentTime = ts;
    }
    setIsPlaying(true);
  };

  const togglePlayback = () => {
    if (isPlaying) setIsPlaying(false);
    else startPlayback();
  };

  const goToAdjacentStep = (direction) => {
    if (!hasSteps) return;
    const position = playbackOrder.indexOf(currentStepIndex);
    const nextPosition =
      position === -1
        ? direction > 0
          ? 0
          : playbackOrder.length - 1
        : Math.min(playbackOrder.length - 1, Math.max(0, position + direction));
    const target = playbackOrder[nextPosition];
    if (typeof target === "number") setCurrentStepIndex(target);
  };

  // Keyboard control for the replay. Ignored while typing in a field so the
  // shortcuts never hijack normal input.
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isTyping && event.key !== "Escape") return;

      switch (event.key) {
        case " ":
        case "Spacebar":
          if (!hasSteps) return;
          event.preventDefault();
          togglePlayback();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToAdjacentStep(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          goToAdjacentStep(-1);
          break;
        case "Home":
          if (!hasSteps) return;
          event.preventDefault();
          setCurrentStepIndex(playbackOrder[0]);
          break;
        case "End":
          if (!hasSteps) return;
          event.preventDefault();
          setCurrentStepIndex(playbackOrder[playbackOrder.length - 1]);
          break;
        case "Escape":
          onClose?.();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (loading)
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium animate-pulse">
            GENERATING VISUAL INTELLIGENCE...
          </span>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              {t("report.header_title", "Run Intelligence Report")}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span className="text-indigo-400">ID: {runId.slice(0, 12)}</span>
              <span>•</span>
              <span>{t("report.unknown_flow", "Unknown Flow")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Steps summary */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 font-mono">
            <ListTree size={12} className="text-indigo-400" />
            <span className="font-bold text-slate-200">
              {hasSteps
                ? `${t("report.steps", "STEPS", { count: steps.length })}`
                : t("report.empty", "0 STEPS")}
            </span>
            {hasSteps && topLevelCount < steps.length && (
              <span className="text-slate-500">
                {t("report.top_level", "{{count}} top-level", {
                  count: topLevelCount,
                })}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
              runOutcome.tone === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : runOutcome.tone === "running"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                runOutcome.tone === "success"
                  ? "bg-emerald-400"
                  : runOutcome.tone === "running"
                    ? "bg-sky-400 animate-pulse"
                    : "bg-rose-400",
              )}
            />
            {runOutcome.label}
          </div>

          {failedStepIndex !== -1 && (
            <button
              onClick={jumpToFailure}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
              title={t("report.jump_to_failure", "Jump to failure")}
              aria-label={t("report.jump_to_failure", "Jump to failure")}
            >
              <Crosshair size={12} />
              Jump to failure
            </button>
          )}

          <button
            onClick={handleDownloadReport}
            disabled={!runId || downloading}
            className="p-2 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-400 transition-colors"
            title="Download report"
            aria-label="Download report"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        {/* STEP NAVIGATOR */}
        <aside className="w-[300px] border-r border-white/5 bg-slate-900/40 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2">
              <ListTree size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                {t("report.execution_timeline", "Execution Timeline")}
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-500">
              {hasSteps
                ? (() => {
                    const n = Math.max(playbackPosition + 1, 0);
                    return `${t("report.progress_label", "{{n}} / {{total}}", { n, total: playbackOrder.length })} STEPS`;
                  })()
                : t("report.no_steps", "empty")}
            </span>
          </div>
          <div
            ref={stepListRef}
            className="flex-1 overflow-y-auto custom-scrollbar py-1"
          >
            {hasSteps ? (
              <div className="flex flex-col">
                {stepRows.map((row, rIdx) => {
                  const s = row.step;
                  const flatIdx = row.flatIdx;
                  const isActive = flatIdx === currentStepIndex;
                  const badgeCls =
                    STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                  return (
                    <button
                      key={`${flatIdx}-${rIdx}`}
                      data-flat-index={flatIdx}
                      onClick={() => setCurrentStepIndex(flatIdx)}
                      style={{ paddingLeft: `${16 + (row.depth || 0) * 12}px` }}
                      className={cn(
                        "flex items-start gap-2 py-2 pr-3 text-left transition-colors border-l-2",
                        isActive
                          ? "bg-indigo-500/10 border-indigo-400"
                          : "border-transparent hover:bg-white/[0.03]",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {row.type === "container" && (
                            <ShieldCheck
                              size={11}
                              className="text-fuchsia-400 shrink-0"
                            />
                          )}
                          <span
                            className={cn(
                              "text-[11px] font-semibold truncate",
                              isActive ? "text-indigo-200" : "text-slate-300",
                            )}
                          >
                            {resolveStepLabel(s, snapshotNodeById)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-0.5">
                          <span className="font-mono uppercase">
                            {s.node_type}
                          </span>
                          <span>·</span>
                          <span>{formatDuration(s.duration_ms)}</span>
                          {row.type === "child" &&
                            typeof row.childIndex === "number" &&
                            typeof row.childTotal === "number" && (
                              <>
                                <span>·</span>
                                <span className="text-fuchsia-400/80">
                                  {t(
                                    "report.child_step",
                                    "Child {{index}}/{{total}}",
                                    {
                                      index: row.childIndex,
                                      total: row.childTotal,
                                    },
                                  )}
                                </span>
                              </>
                            )}
                          {typeof s.video_timestamp === "number" && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <Film size={9} />
                                {s.video_timestamp.toFixed(2)}s
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded border text-[8px] font-bold whitespace-nowrap",
                          badgeCls,
                        )}
                      >
                        {statusLabel(s.status)}
                      </span>
                      {onViewCode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCode(runId, s);
                          }}
                          className="ml-1.5 p-1 rounded hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 transition-colors"
                          title={t(
                            "report.view_code",
                            "View code for this step",
                          )}
                          aria-label={t(
                            "report.view_code",
                            "View code for this step",
                          )}
                        >
                          <Code2 size={11} />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-3 text-slate-600">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/40 flex items-center justify-center">
                  <Bug size={22} />
                </div>
                <p className="text-[11px] leading-relaxed">
                  This run produced no step records. The history was only
                  persisted after the step-logging fix — runs made before it
                  show real steps from now on.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* CANVAS AREA */}
        <div className="flex-1 relative bg-slate-900/40">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            {...figmaConfig}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            onNodeClick={(_, node) => {
              const idx = steps.findIndex(
                (s) => (s.node_id || s.nodeId) === node.id,
              );
              if (idx !== undefined && idx !== -1) setCurrentStepIndex(idx);
            }}
            className="reporting-canvas"
          >
            <Background color="#334155" gap={20} />
            <Controls />
          </ReactFlow>

          {!hasSteps && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-5 py-3 bg-slate-900/80 backdrop-blur rounded-xl border border-white/10 text-slate-500 text-xs">
                Flow snapshot shown — no execution steps recorded for this run.
              </div>
            </div>
          )}

          {/* OVERLAY STATS */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
            <MetricCard
              icon={<Clock size={14} />}
              label={t("report.total_duration", "Total Duration")}
              value={`${((run?.duration_ms || 0) / 1000).toFixed(2)}s`}
              color="indigo"
            />
            <MetricCard
              icon={<Zap size={14} />}
              label={t("report.memory_hits", "Memory Hits")}
              value={run?.memory_palace_hits || 0}
              color="amber"
            />
            <MetricCard
              icon={<BrainCircuit size={14} />}
              label={t("report.auto_healed", "Auto-Healed")}
              value={run?.total_healed || 0}
              color="emerald"
            />
          </div>
        </div>

        {/* STEP INSPECTOR */}
        <aside className="w-[380px] border-l border-white/5 bg-slate-900/80 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-slate-900/40">
            {currentStep ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={16} className="text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-200 truncate">
                      {resolveStepLabel(currentStep, snapshotNodeById)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded border text-[8px] font-bold whitespace-nowrap",
                      STATUS_STYLES[currentStep.status] ||
                        STATUS_STYLES.pending,
                    )}
                  >
                    {statusLabel(currentStep.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                  <span className="uppercase">{currentStep.node_type}</span>
                  <span>·</span>
                  <span>
                    Step #{currentStep.sequence ?? currentStepIndex + 1}
                  </span>
                  <span>·</span>
                  <span>{formatDuration(currentStep.duration_ms)}</span>
                  {typeof currentStep.video_timestamp === "number" && (
                    <>
                      <span>·</span>
                      <span>
                        Video @ {currentStep.video_timestamp.toFixed(2)}s
                      </span>
                    </>
                  )}
                </div>
                {currentStep.status === "healed" && (
                  <div className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold w-fit">
                    AUTO-HEALED
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Step Inspector
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {currentStep ? (
              <div className="p-6 space-y-6">
                {/* VISUAL EVIDENCE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Visual Evidence
                    </label>
                    {run?.video_path && (
                      <div className="flex bg-slate-950/40 p-0.5 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() => setEvidenceTab("screenshot")}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                            evidenceTab === "screenshot"
                              ? "bg-indigo-500 text-white"
                              : "text-slate-400 hover:text-slate-200",
                          )}
                        >
                          Screenshot
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceTab("video")}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                            evidenceTab === "video"
                              ? "bg-indigo-500 text-white"
                              : "text-slate-400 hover:text-slate-200",
                          )}
                        >
                          Video
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                    {/* Video stays mounted so currentTime survives tab switches. */}
                    {run?.video_path && (
                      <video
                        ref={videoRef}
                        src={api.getFileUrl(run.video_path)}
                        controls
                        loop={loopPlayback}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onTimeUpdate={handleVideoTimeUpdate}
                        className={cn(
                          "w-full h-full object-contain",
                          evidenceTab !== "video" && "hidden",
                        )}
                      />
                    )}
                    {!(evidenceTab === "video" && run?.video_path) &&
                      (currentStep.screenshot_path ? (
                        <img
                          src={api.getFileUrl(currentStep.screenshot_path)}
                          className="w-full h-full object-contain"
                          alt={t("report.step_evidence", "Step Evidence")}
                          loading="lazy"
                          onClick={() =>
                            setLightboxImage(
                              api.getFileUrl(currentStep.screenshot_path),
                            )
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                          <AlertCircle size={24} />
                          <span className="text-[10px]">
                            {t(
                              "report.no_visual_capture",
                              "No visual capture available",
                            )}
                          </span>
                          {steps.length === 0 ? null : (
                            <span className="text-[9px] text-slate-700 italic">
                              No evidence was captured for this step.
                            </span>
                          )}
                        </div>
                      ))}
                    {evidenceTab === "screenshot" &&
                      currentStep.screenshot_path && (
                        <button
                          onClick={() =>
                            setLightboxImage(
                              api.getFileUrl(currentStep.screenshot_path),
                            )
                          }
                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-indigo-500/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={12} />
                        </button>
                      )}
                  </div>
                </div>

                {/* OBSERVED — what the run actually recorded (no AI required) */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <Activity size={13} className="text-emerald-400" />
                    Observed
                  </h4>
                  <DataInspector
                    label={t("report.input", "Input / Action")}
                    data={redactSensitive(currentStep.input_data)}
                  />
                  <DataInspector
                    label={t("report.output", "Output")}
                    data={redactSensitive(currentStep.output_data)}
                  />
                  {currentStep.error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 mt-2">
                      <span className="text-[10px] font-bold text-rose-400 block mb-1 uppercase tracking-wider">
                        {t("report.exception", "Exception")}
                      </span>
                      <p className="text-[10px] font-mono text-rose-300/80 break-words">
                        {currentStep.error}
                      </p>
                    </div>
                  )}
                  {!currentStep.error &&
                    !currentStep.input_data &&
                    !currentStep.output_data && (
                      <p className="text-[10px] text-slate-600 italic">
                        No input/output payload was captured for this step.
                      </p>
                    )}
                </div>

                {/* AI INTERPRETATION — strictly separated from observed facts */}
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                      <BrainCircuit size={14} />
                      {t("report.ai_interpretation", "AI Interpretation")}
                    </h4>
                    {currentStep.ai_diagnosis ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {t("report.ai_generated", "AI-generated")}
                      </span>
                    ) : null}
                  </div>
                  {currentStep.ai_diagnosis ? (
                    <>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic whitespace-pre-wrap">
                        {currentStep.ai_diagnosis}
                      </p>
                      <button
                        onClick={handleGenerateDiagnosis}
                        disabled={diagnosing}
                        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {diagnosing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          t("report.generate_diagnosis", "Generate diagnosis")
                        )}
                        {diagnosing ? "Generating…" : t("report.generating")}
                        {diagnosing ? "Generating…" : "Regenerate"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 leading-relaxed italic font-medium">
                        {t("report.no_diagnosis", "No diagnosis available.")}
                      </p>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        {t(
                          "report.no_diagnosis_desc",
                          "Diagnostics are generated independently of the execution replay. The observed facts above let you evaluate this step without an AI explanation.",
                        )}
                      </p>
                      <button
                        onClick={handleGenerateDiagnosis}
                        disabled={diagnosing}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {diagnosing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        {diagnosing ? "Generating…" : "Generate diagnosis"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-4 text-slate-600">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/20 flex items-center justify-center">
                  <Zap size={32} />
                </div>
                <p className="text-xs">
                  Select a step from the timeline or a node on the canvas to
                  inspect its evidence.
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* FOOTER: PLAYBACK CONTROLS + SCRUBBER */}
      <footer className="bg-slate-900 border-t border-white/10 px-8 py-3 flex flex-col gap-2 relative z-50">
        {/* SCRUBBER — one tick per visible step, click or drag to seek */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 w-16 shrink-0 tabular-nums">
            {hasSteps
              ? `${Math.max(playbackPosition + 1, 0)} / ${playbackOrder.length}`
              : "0 / 0"}
          </span>
          <div className="relative flex-1">
            <div className="flex items-center gap-[2px] h-3 mb-0.5">
              {playbackOrder.map((flatIdx, pos) => {
                const stepForTick = steps[flatIdx];
                const isCurrent = flatIdx === currentStepIndex;
                return (
                  <button
                    key={flatIdx}
                    type="button"
                    onClick={() => setCurrentStepIndex(flatIdx)}
                    title={`${pos + 1}. ${resolveStepLabel(stepForTick, snapshotNodeById)}`}
                    className={cn(
                      "flex-1 min-w-[3px] rounded-full transition-all",
                      tickColor(stepForTick?.status),
                      isCurrent ? "h-3 ring-1 ring-indigo-300" : "h-1.5",
                    )}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, playbackOrder.length - 1)}
              step={1}
              value={playbackPosition >= 0 ? playbackPosition : 0}
              disabled={!hasSteps}
              onChange={(e) => {
                const target = playbackOrder[Number(e.target.value)];
                if (typeof target === "number") setCurrentStepIndex(target);
              }}
              aria-label="Replay scrubber"
              className="w-full accent-indigo-500 cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* PLAYBACK CONTROLS */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  hasSteps && setCurrentStepIndex(playbackOrder[0])
                }
                disabled={!hasSteps || playbackPosition <= 0}
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
                title="First"
                aria-label="First step"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => goToAdjacentStep(-1)}
                disabled={!hasSteps || playbackPosition <= 0}
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
                title="Previous step"
                aria-label="Previous step"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={togglePlayback}
                disabled={!hasSteps}
                aria-label={isPlaying ? "Pause replay" : "Play replay"}
                className="w-10 h-10 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30"
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button
                onClick={() => goToAdjacentStep(1)}
                disabled={
                  !hasSteps ||
                  playbackPosition === -1 ||
                  playbackPosition >= playbackOrder.length - 1
                }
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
                title="Next step"
                aria-label="Next step"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() =>
                  hasSteps &&
                  setCurrentStepIndex(playbackOrder[playbackOrder.length - 1])
                }
                disabled={
                  !hasSteps || playbackPosition >= playbackOrder.length - 1
                }
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
                title="Last"
                aria-label="Last step"
              >
                <ChevronsRight size={16} />
              </button>
              <button
                onClick={() => setLoopPlayback((prev) => !prev)}
                aria-pressed={loopPlayback}
                className={cn(
                  "p-1.5 rounded-md transition-colors ml-1",
                  loopPlayback
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "hover:bg-white/5 text-slate-500",
                )}
                title="Loop replay"
                aria-label="Loop replay"
              >
                <Repeat size={15} />
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Playback
              </span>
              <span className="text-xs font-mono text-indigo-400">
                {hasSteps ? (
                  <>
                    {Math.max(playbackPosition + 1, 0)} / {playbackOrder.length}{" "}
                    STEPS
                  </>
                ) : (
                  "No step records"
                )}
              </span>
            </div>
          </div>

          {/* SPEED SELECTOR */}
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/5 shrink-0">
            {[0.25, 0.5, 1, 2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold transition-all",
                  playbackSpeed === s
                    ? "bg-indigo-500 text-white"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* SCREENSHOT LIGHTBOX */}
      <AnimatePresence>
        {lightboxImage && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-10"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-lg text-slate-400"
              onClick={() => setLightboxImage(null)}
            >
              <X size={22} />
            </button>
            <img
              src={lightboxImage}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              alt="Step evidence"
              onClick={(e) => e.stopPropagation()}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReportDashboard(props) {
  return (
    <ReactFlowProvider>
      <ReportDashboardContent {...props} />
    </ReactFlowProvider>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-xl flex items-center gap-3 shadow-xl">
      <div
        className={cn(
          "p-1.5 rounded-lg",
          color === "indigo"
            ? "bg-indigo-500/20 text-indigo-400"
            : color === "amber"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-emerald-500/20 text-emerald-400",
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
          {label}
        </div>
        <div className="text-xs font-mono font-bold text-slate-200">
          {value}
        </div>
      </div>
    </div>
  );
}

function DataInspector({ label, data }) {
  const [collapsed, setCollapsed] = useState(true);
  if (!data) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          {label}
        </label>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[9px] text-indigo-400 hover:underline"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <div
        className={cn(
          "rounded-lg bg-slate-950/50 border border-white/5 p-3 font-mono text-[10px] text-slate-400 overflow-hidden transition-all",
          collapsed ? "max-h-24" : "max-h-[300px] overflow-y-auto",
        )}
      >
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
