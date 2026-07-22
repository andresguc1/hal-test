import { create } from "zustand";

/**
 * useExecutionStore — Unified Single Source of Truth for Haltest Execution State
 * Valid States: 'idle' | 'configuring' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
 * Modes: 'calidad' | 'performance' | 'seguridad'
 */
export const useExecutionStore = create((set, get) => ({
  status: "idle",
  mode: "calidad",
  activeRunId: null,
  flowId: null,
  progressPercent: 0,
  executedNodesCount: 0,
  totalNodesCount: 0,
  currentNode: null,
  error: null,

  // Persistence of completed execution reports
  lastRunSummary: null,
  lastPerfReport: null,
  lastSecurityReport: null,

  setStatus: (status) => set({ status }),

  setMode: (mode) => set({ mode }),

  setLastRunSummary: (summary) => set({ lastRunSummary: summary }),

  setLastPerfReport: (report) => set({ lastPerfReport: report }),

  setLastSecurityReport: (report) => set({ lastSecurityReport: report }),

  startExecution: ({ mode, runId, flowId, totalNodes = 0 }) =>
    set({
      status: "running",
      mode: mode || get().mode || "calidad",
      activeRunId: runId || null,
      flowId: flowId || null,
      progressPercent: 5,
      executedNodesCount: 0,
      totalNodesCount: totalNodes,
      currentNode: null,
      error: null,
    }),

  updateProgress: ({ percent, executedCount, totalCount, currentNode }) =>
    set((state) => ({
      progressPercent:
        typeof percent === "number" ? percent : state.progressPercent,
      executedNodesCount:
        typeof executedCount === "number"
          ? executedCount
          : state.executedNodesCount,
      totalNodesCount:
        typeof totalCount === "number" ? totalCount : state.totalNodesCount,
      currentNode: currentNode || state.currentNode,
    })),

  finishExecution: ({ status = "completed", error = null, summary = null, perfReport = null, securityReport = null } = {}) =>
    set((state) => ({
      status,
      progressPercent: 100,
      currentNode: null,
      error: error || null,
      lastRunSummary: summary !== null ? summary : state.lastRunSummary,
      lastPerfReport: perfReport !== null ? perfReport : state.lastPerfReport,
      lastSecurityReport: securityReport !== null ? securityReport : state.lastSecurityReport,
    })),

  resetExecution: () =>
    set({
      status: "idle",
      progressPercent: 0,
      executedNodesCount: 0,
      totalNodesCount: 0,
      currentNode: null,
      error: null,
    }),
}));
