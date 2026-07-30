import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

// =============================================
// QUERY KEYS
// =============================================
export const dashboardKeys = {
  all: ["dashboard"],
  projects: () => [...dashboardKeys.all, "projects"],
  recentRuns: (limit = 20) => [...dashboardKeys.all, "recentRuns", limit],
  runStats: (projectId) => [...dashboardKeys.all, "runStats", projectId],
  flows: (projectId) => [...dashboardKeys.all, "flows", projectId],
  runs: (filters) => [...dashboardKeys.all, "runs", filters],
};

// =============================================
// PROJECTS
// =============================================
export function useProjects() {
  return useQuery({
    queryKey: dashboardKeys.projects(),
    queryFn: async () => {
      const res = await api.get("/projects");
      return res.data || res.projects || res || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

// =============================================
// RECENT RUNS
// =============================================
export function useRecentRuns(limit = 20) {
  return useQuery({
    queryKey: dashboardKeys.recentRuns(limit),
    queryFn: async () => {
      const res = await api.get(`/runs?limit=${limit}`);
      return res.data || res.runs || res || [];
    },
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 30, // Poll every 30s (stops if window blurred)
    refetchIntervalInBackground: false,
  });
}

// =============================================
// RUN STATS (Aggregate Metrics)
// =============================================
export function useRunStats(projectId) {
  return useQuery({
    queryKey: dashboardKeys.runStats(projectId),
    queryFn: async () => {
      const endpoint = projectId
        ? `/runs/stats?projectId=${projectId}`
        : "/runs/stats";
      const res = await api.get(endpoint);
      return res.data || res || null;
    },
    staleTime: 1000 * 60, // 1 minute
    // Graceful fallback — if backend doesn't have this endpoint, return null
    retry: 1,
  });
}

// =============================================
// FLOWS FOR A PROJECT
// =============================================
export function useProjectFlows(projectId) {
  return useQuery({
    queryKey: dashboardKeys.flows(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get(`/projects/${projectId}`);
      return res.data?.flows || res.flows || res.project?.flows || [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60,
  });
}

// =============================================
// RUNS WITH FILTERS
// =============================================
export function useRuns(filters = {}) {
  const { projectId, flowId, status, limit = 50 } = filters;

  return useQuery({
    queryKey: dashboardKeys.runs(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (flowId) params.set("flowId", flowId);
      if (status) params.set("status", status);
      params.set("limit", limit);

      const res = await api.get(`/runs?${params.toString()}`);
      return res.data || res.runs || res || [];
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 20,
    refetchIntervalInBackground: false,
  });
}

// =============================================
// COMPUTED: DASHBOARD OVERVIEW METRICS
// Derives metrics from projects + runs data
// =============================================
export function useOverviewMetrics() {
  const projectsQuery = useProjects();
  const runsQuery = useRecentRuns(100);

  const projects = projectsQuery.data || [];
  const rawRuns = runsQuery.data || [];
  const runs = rawRuns.filter((r) => r.trigger !== "security");

  const totalFlows = projects.reduce(
    (sum, p) => sum + (p.flows?.length || 0),
    0,
  );

  const completedRuns = runs.filter(
    (r) => r.status === "completed" || r.status === "passed",
  );
  const failedRuns = runs.filter(
    (r) => r.status === "failed" || r.status === "error",
  );
  const activeRuns = runs.filter((r) => r.status === "running");

  const successRate =
    runs.length > 0
      ? Math.round((completedRuns.length / runs.length) * 100)
      : null;

  const avgDuration =
    completedRuns.length > 0
      ? Math.round(
          completedRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
            completedRuns.length /
            1000,
        )
      : null;

  // Build 7-day sparkline data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];

    const dayRuns = runs.filter((r) => {
      const runDate = new Date(r.started_at || r.created_at || "")
        .toISOString()
        .split("T")[0];
      return runDate === dateStr;
    });

    return {
      date: dateStr,
      label: date.toLocaleDateString("en", { weekday: "short" }),
      passed: dayRuns.filter(
        (r) => r.status === "completed" || r.status === "passed",
      ).length,
      failed: dayRuns.filter(
        (r) => r.status === "failed" || r.status === "error",
      ).length,
      total: dayRuns.length,
    };
  });

  return {
    isLoading: projectsQuery.isLoading || runsQuery.isLoading,
    isError: projectsQuery.isError || runsQuery.isError,
    metrics: {
      totalProjects: projects.length,
      totalFlows,
      totalRuns: runs.length,
      successRate,
      avgDurationSec: avgDuration,
      activeRuns: activeRuns.length,
      passedRuns: completedRuns.length,
      failedRuns: failedRuns.length,
    },
    last7Days,
    recentRuns: runs.slice(0, 10),
  };
}
