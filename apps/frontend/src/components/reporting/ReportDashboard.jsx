import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
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
  Download,
  Share2,
  BrainCircuit,
  Maximize2,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { api } from "../../utils/api";
import { nodeTypes } from "../nodes"; // Reuse existing node types
import CustomEdge from "../edges/CustomEdge";
import { NODE_STATES } from "../hooks/flowStyles";
import { useFigmaInteraction } from "../../hooks/useFigmaInteraction";

const edgeTypes = {
  custom: CustomEdge,
};

/**
 * Maps a StepResult status string to the NODE_STATES constant used by AbyssNode.
 */
function stepStatusToNodeState(status) {
  switch (status) {
    case "success":
      return NODE_STATES.SUCCESS;
    case "failed":
      return NODE_STATES.ERROR;
    case "healed":
      return NODE_STATES.HEALED;
    case "skipped":
      return NODE_STATES.SKIPPED;
    default:
      return NODE_STATES.DEFAULT;
  }
}

/**
 * Derives an edge-id → executionState map from the ordered steps array.
 * Walks pairs of consecutive steps to reconstruct which edges were traversed.
 *
 * @param {object[]} steps     - Ordered StepResult array from the run.
 * @param {number}   upToIndex - Include steps up to and including this index.
 * @param {object[]} allEdges  - The canvas edges (need .id, .source, .target).
 * @returns {Map<string, string>}
 */
function computeEdgeStates(steps, upToIndex, allEdges) {
  const map = new Map();
  if (!steps || steps.length === 0 || upToIndex < 0) return map;

  for (let i = 1; i <= upToIndex; i++) {
    const fromId = steps[i - 1].node_id;
    const toId = steps[i].node_id;
    const edge = allEdges.find((e) => e.source === fromId && e.target === toId);
    if (edge) {
      // The edge into the current (active) node is "running"; all prior are "success"
      const state = i === upToIndex ? "running" : "success";
      map.set(edge.id, state);
    }
  }
  return map;
}

function ReportDashboardContent({ runId, onClose }) {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [evidenceTab, setEvidenceTab] = useState("screenshot"); // "screenshot" | "video"
  const videoRef = useRef(null);

  const { fitView } = useReactFlow();
  const { figmaConfig } = useFigmaInteraction();

  // Current Step Data (Declared early to prevent TDZ ReferenceError)
  const currentStep = useMemo(() => {
    if (!run || !run.steps || currentStepIndex < 0) return null;
    return run.steps[currentStepIndex];
  }, [run, currentStepIndex]);

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

          // Initialize Canvas
          if (runData.flow_snapshot) {
            const snapshot = JSON.parse(runData.flow_snapshot);

            // Normalize nodes/edges to use React Flow IDs (nodeId/edgeId) if they came from database representation
            const normalizedNodes = (snapshot.nodes || []).map((n) => ({
              ...n,
              id: n.nodeId || n.id,
            }));
            const normalizedEdges = (snapshot.edges || []).map((e) => ({
              ...e,
              id: e.edgeId || e.id,
            }));

            // Map status to nodes based on StepResults
            const steps = runData.steps || [];
            const processedNodes = normalizedNodes.map((n) => {
              const step = steps.find((s) => s.node_id === n.id);
              return {
                ...n,
                draggable: false, // Read only
                selectable: true,
                data: {
                  ...n.data,
                  // Use `state` (not `status`) — AbyssNode reads data.state for all visuals
                  state: step
                    ? stepStatusToNodeState(step.status)
                    : NODE_STATES.DEFAULT,
                  error: step?.error,
                  screenshot: step?.screenshot_path,
                },
              };
            });

            // Initialize edges with idle executionState so CustomEdge renders in default mode
            const processedEdges = normalizedEdges.map((e) => ({
              ...e,
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

  // Sync Video time with current step's timestamp (Scrubbing / Manual timeline navigation)
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

  // Sync HTML5 Video playback with isPlaying state
  useEffect(() => {
    if (evidenceTab !== "video" || !videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.warn("Failed to play video:", err.message);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, evidenceTab]);

  // Adjust video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, evidenceTab]);

  // Sync Canvas with Timeline — updates BOTH nodes and edges in a single tick
  useEffect(() => {
    if (!run || !run.steps) return;

    const activeNodeId = currentStep?.node_id ?? null;

    // 1. Update node visual states
    setNodes((prev) =>
      prev.map((node) => {
        const stepForThisNode = run.steps
          .slice(0, currentStepIndex + 1)
          .findLast((s) => s.node_id === node.id);

        // The currently active node pulses amber (EXECUTING); completed nodes keep their status
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
            state: nodeState, // AbyssNode reads data.state for all visual logic
            active: isActive,
          },
        };
      }),
    );

    // 2. Reconstruct edge traversal path and update edge visual states
    setEdges((prev) => {
      const edgeStateMap = computeEdgeStates(run.steps, currentStepIndex, prev);
      return prev.map((edge) => ({
        ...edge,
        data: {
          ...(edge.data || {}),
          executionState: edgeStateMap.get(edge.id) ?? "idle",
        },
      }));
    });
  }, [currentStepIndex, run, setNodes, setEdges, currentStep?.node_id]);

  // Playback Logic (Slideshow mode for screenshot tab)
  useEffect(() => {
    let interval;
    if (
      isPlaying &&
      evidenceTab !== "video" &&
      run &&
      run.steps &&
      currentStepIndex < run.steps.length - 1
    ) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 1000 / playbackSpeed);
    } else if (currentStepIndex >= (run?.steps?.length || 0) - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, run, playbackSpeed, evidenceTab]);

  // Handle Video Time Update to synchronize currentStepIndex during playback/scrubbing
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !run || !run.steps) return;
    const currentTime = videoRef.current.currentTime;

    let matchedIndex = -1;
    for (let i = 0; i < run.steps.length; i++) {
      const step = run.steps[i];
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              RUN INTELLIGENCE REPORT
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span className="text-indigo-400">ID: {runId.slice(0, 12)}</span>
              <span>•</span>
              <span>{run?.flow_name || "Unknown Flow"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
              run?.status === "completed"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                run?.status === "completed" ? "bg-emerald-400" : "bg-rose-400",
              )}
            />
            {run?.status}
          </div>

          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <Download size={18} />
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
              setSelectedNodeId(node.id);
              const idx = run?.steps?.findIndex((s) => s.node_id === node.id);
              if (idx !== undefined && idx !== -1) {
                setCurrentStepIndex(idx);
              }
            }}
            className="reporting-canvas"
          >
            <Background color="#334155" gap={20} />
            <Controls />
          </ReactFlow>

          {/* OVERLAY STATS */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
            <MetricCard
              icon={<Clock size={14} />}
              label="Total Duration"
              value={`${((run?.duration_ms || 0) / 1000).toFixed(2)}s`}
              color="indigo"
            />
            <MetricCard
              icon={<Zap size={14} />}
              label="Memory Hits"
              value={run?.memory_palace_hits || 0}
              color="amber"
            />
            <MetricCard
              icon={<BrainCircuit size={14} />}
              label="Auto-Healed"
              value={run?.total_healed || 0}
              color="emerald"
            />
          </div>
        </div>

        {/* SIDEBAR: AI Diagnosis & Evidence */}
        <aside className="w-[400px] border-l border-white/5 bg-slate-900/80 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                AI Diagnosis
              </span>
            </div>
            {currentStep?.status === "healed" && (
              <div className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold">
                PATCHED 🩹
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {currentStep ? (
              <div className="p-6 space-y-6">
                {/* SCREENSHOT PREVIEW / VIDEO PLAYER */}
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
                    {evidenceTab === "video" && run?.video_path ? (
                      <video
                        ref={videoRef}
                        src={api.getFileUrl(run.video_path)}
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={handleVideoTimeUpdate}
                        className="w-full h-full object-contain"
                      />
                    ) : currentStep.screenshot_path ? (
                      <img
                        src={api.getFileUrl(currentStep.screenshot_path)}
                        className="w-full h-full object-contain"
                        alt="Step Evidence"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                        <AlertCircle size={24} />
                        <span className="text-[10px]">
                          No visual capture available
                        </span>
                      </div>
                    )}
                    {evidenceTab === "screenshot" &&
                      currentStep.screenshot_path && (
                        <button className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={12} />
                        </button>
                      )}
                  </div>
                </div>

                {/* AI REASONING */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <h4 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-2">
                      <BrainCircuit size={14} />
                      Intelligence Insight
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      {currentStep.ai_diagnosis ||
                        (currentStep.status === "success"
                          ? "Step completed successfully according to the plan."
                          : "Analyzing failure patterns...")}
                    </p>
                  </div>
                </div>

                {/* DATA INSPECTOR */}
                <div className="space-y-4">
                  <DataInspector label="Input" data={currentStep.input_data} />
                  <DataInspector
                    label="Output"
                    data={currentStep.output_data}
                  />
                  {currentStep.error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400 block mb-1 uppercase tracking-wider">
                        Exception
                      </span>
                      <p className="text-[10px] font-mono text-rose-300/80 break-words">
                        {currentStep.error}
                      </p>
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
                  Slide the timeline or select a node to inspect visual
                  intelligence.
                </p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* FOOTER: TIME-TRAVEL SLIDER */}
      <footer className="h-24 bg-slate-900 border-t border-white/10 px-8 flex flex-col justify-center gap-2 relative z-50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-6">
            {/* PLAYBACK CONTROLS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.max(-1, prev - 1))
                }
                disabled={currentStepIndex <= -1}
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30"
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min((run?.steps?.length || 0) - 1, prev + 1),
                  )
                }
                disabled={currentStepIndex >= (run?.steps?.length || 0) - 1}
                className="p-1.5 hover:bg-white/5 disabled:opacity-30 rounded-md transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Playback Progress
              </span>
              <span className="text-xs font-mono text-indigo-400">
                {currentStepIndex + 1} / {run?.steps?.length || 0} STAGES
              </span>
            </div>
          </div>

          {/* SPEED SELECTOR */}
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/5">
            {[0.5, 1, 2, 4].map((s) => (
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

        {/* THE SLIDER */}
        <div className="relative group">
          <input
            type="range"
            min="-1"
            max={(run?.steps?.length || 0) - 1}
            value={currentStepIndex}
            onChange={(e) => setCurrentStepIndex(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          {/* STEP MARKERS */}
          <div className="absolute top-0 left-0 w-full h-1.5 pointer-events-none flex justify-between px-[2px]">
            {run?.steps?.map((s, idx) => (
              <div
                key={s.id}
                className={cn(
                  "w-1 h-3 -top-[3px] absolute rounded-full transition-all",
                  s.status === "failed"
                    ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                    : s.status === "healed"
                      ? "bg-amber-500"
                      : "bg-emerald-500/20",
                )}
                style={{ left: `${((idx + 1) / run?.steps?.length) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </footer>
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
