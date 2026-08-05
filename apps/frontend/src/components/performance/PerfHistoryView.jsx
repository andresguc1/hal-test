import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trash2,
  RotateCcw,
  BarChart2,
  Eye,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Activity,
  Calendar,
  Zap,
  AlertTriangle,
  Users,
} from "lucide-react";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast";
import { getProfileInfo } from "../telemetry/telemetryTypes";
import PerfResultsView from "./PerfResultsView";
import { useTranslation } from "react-i18next";

const extractMetricsFromRun = (run) => {
  if (!run || !run.flow_snapshot) return null;
  try {
    let parsed =
      typeof run.flow_snapshot === "string"
        ? JSON.parse(run.flow_snapshot)
        : run.flow_snapshot;
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed.performanceMetrics || parsed.metrics || parsed;
  } catch (e) {
    console.error("Failed to parse run snapshot:", e);
    return null;
  }
};

const PerfHistoryView = ({ flowId, onReRun }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState(null);
  const [compareLeft, setCompareLeft] = useState(null);
  const [compareRight, setCompareRight] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/runs?flowId=${flowId}&limit=50`);
      if (res.success && res.data) {
        // Filter performance runs only
        const perfRuns = res.data.filter((r) => r.trigger === "performance");
        setHistory(perfRuns);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      toast.error(t("performance.toasts.load_error", "Error loading history."));
    } finally {
      setLoading(false);
    }
  }, [flowId, toast, t]);

  useEffect(() => {
    if (flowId) {
      fetchHistory();
    }
    const handleRunFinished = () => {
      if (flowId) fetchHistory();
    };
    window.addEventListener("hal:run-completed", handleRunFinished);
    return () => {
      window.removeEventListener("hal:run-completed", handleRunFinished);
    };
  }, [flowId, fetchHistory]);

  const handleSelectRun = (run) => {
    setSelectedRun(run);
    const metricsData = extractMetricsFromRun(run);
    setSelectedRunDetails(metricsData);
  };

  const handleDeleteRun = async (runId, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        t(
          "performance.confirmations.delete",
          "Are you sure you want to delete this history record?",
        ),
      )
    )
      return;

    try {
      const res = await api.delete(`/runs/${runId}`);
      if (res.success) {
        toast.success(
          t(
            "performance.toasts.delete_success",
            "Execution deleted successfully.",
          ),
        );
        setHistory((prev) => prev.filter((r) => r.id !== runId));
        if (selectedRun?.id === runId) {
          setSelectedRun(null);
          setSelectedRunDetails(null);
        }
      } else {
        toast.error(
          res.message ||
            t("performance.toasts.delete_error", "Error deleting execution."),
        );
      }
    } catch (error) {
      console.error("Failed to delete run:", error);
      toast.error(
        t(
          "performance.toasts.delete_server_error",
          "Server error deleting execution.",
        ),
      );
    }
  };

  const handleReRunAction = (run, e) => {
    e.stopPropagation();
    const metricsData = extractMetricsFromRun(run);
    const perfConfig =
      metricsData?.runConfig || metricsData?.performanceConfig || null;
    if (perfConfig) {
      onReRun({
        vus: perfConfig.totalVUs || perfConfig.virtualUsers || 5,
        duration: perfConfig.durationSec || perfConfig.duration || 30,
        profile: perfConfig.profile || "constant",
        rampUp: perfConfig.rampUp || 10,
        stages: perfConfig.stages || null,
      });
    } else {
      toast.error(
        t(
          "performance.toasts.config_error",
          "Could not extract configuration for this run.",
        ),
      );
    }
  };

  const toggleCompareSelect = (run) => {
    try {
      const metricsData = extractMetricsFromRun(run);
      if (!metricsData) return;

      if (compareLeft?.id === run.id) {
        setCompareLeft(null);
      } else if (compareRight?.id === run.id) {
        setCompareRight(null);
      } else if (!compareLeft) {
        setCompareLeft({
          id: run.id,
          date: run.started_at,
          metrics: metricsData,
        });
      } else if (!compareRight) {
        setCompareRight({
          id: run.id,
          date: run.started_at,
          metrics: metricsData,
        });
      } else {
        // Replace right
        setCompareRight({
          id: run.id,
          date: run.started_at,
          metrics: metricsData,
        });
      }
    } catch (e) {
      console.error("Comparison error:", e);
      toast.error(
        t(
          "performance.toasts.compare_error",
          "Incompatible data for comparison.",
        ),
      );
    }
  };

  const clearComparison = () => {
    setCompareLeft(null);
    setCompareRight(null);
    setCompareMode(false);
  };

  if (selectedRun && selectedRunDetails) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                setSelectedRun(null);
                setSelectedRunDetails(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {t("performance.navigation.history", "History")}
            </button>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-slate-400 font-mono">
              {t("performance.navigation.report", "Report {{id}}", {
                id: selectedRun.id.split("-")[0],
              })}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={(e) => handleReRunAction(selectedRun, e)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />{" "}
              {t("performance.buttons.rerun", "Run Again")}
            </button>
            <button
              onClick={() => {
                setSelectedRun(null);
                setSelectedRunDetails(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
            >
              {t("performance.buttons.close_report", "Close Report")}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-950/20">
          <PerfResultsView
            metrics={selectedRunDetails}
            runConfig={selectedRunDetails.runConfig}
          />
        </div>
      </div>
    );
  }

  if (compareMode && compareLeft && compareRight) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            {t("performance.compare.title", "Performance Comparison")}
          </span>
          <button
            onClick={clearComparison}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
          >
            {t("performance.compare.back", "Back to History")}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Run */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-xs text-blue-400 uppercase font-semibold">
                  {t("performance.compare.run_a", "Execution A")}
                </h4>
                <p className="text-slate-200 font-mono text-sm">
                  {compareLeft.id.split("-")[0]}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(compareLeft.date).toLocaleString()}
                </p>
              </div>
              <ComparisonMetrics
                metrics={compareLeft.metrics}
                other={compareRight.metrics}
              />
            </div>
            {/* Right Run */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-xs text-purple-400 uppercase font-semibold">
                  {t("performance.compare.run_b", "Execution B (Target)")}
                </h4>
                <p className="text-slate-200 font-mono text-sm">
                  {compareRight.id.split("-")[0]}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(compareRight.date).toLocaleString()}
                </p>
              </div>
              <ComparisonMetrics
                metrics={compareRight.metrics}
                other={compareLeft.metrics}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">
              {t("performance.history.title", "Performance History")}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                "performance.history.subtitle",
                "Explore, analyze, and compare previous load runs",
              )}
            </p>
          </div>
          {compareLeft || compareRight ? (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-xs text-slate-400">
                {t("performance.history.comparing", "Comparing:")}{" "}
                <span className="font-mono text-blue-400">
                  {compareLeft ? compareLeft.id.split("-")[0] : "—"}
                </span>{" "}
                vs{" "}
                <span className="font-mono text-purple-400">
                  {compareRight ? compareRight.id.split("-")[0] : "—"}
                </span>
              </span>
              {compareLeft && compareRight && (
                <button
                  onClick={() => setCompareMode(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t("performance.history.compare_now", "Compare Now")}
                </button>
              )}
              <button
                onClick={clearComparison}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <Activity size={24} className="animate-spin mr-2" />{" "}
            {t("performance.history.loading", "Loading history...")}
          </div>
        ) : history.length > 0 ? (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">
                      {t("performance.headers.compare", "Compare")}
                    </th>
                    <th className="p-4">
                      {t("performance.headers.run_id", "Run ID")}
                    </th>
                    <th className="p-4">
                      {t("performance.headers.date", "Date")}
                    </th>
                    <th className="p-4">
                      {t("performance.headers.load_profile", "Load Profile")}
                    </th>
                    <th className="p-4">
                      {t("performance.headers.config", "Config")}
                    </th>
                    <th className="p-4 text-center">
                      {t("performance.headers.throughput", "Throughput")}
                    </th>
                    <th className="p-4 text-center">
                      {t("performance.headers.p95_latency", "P95 Latency")}
                    </th>
                    <th className="p-4 text-center">
                      {t("performance.headers.errors", "Errors")}
                    </th>
                    <th className="p-4 text-right">
                      {t("performance.headers.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {history.map((run) => {
                    const metricsData = extractMetricsFromRun(run);
                    const profileKey =
                      metricsData?.runConfig?.profile ||
                      metricsData?.performanceConfig?.profile ||
                      metricsData?.profile ||
                      "constant";
                    const { label: profileLabel, color: profileColor } =
                      getProfileInfo(profileKey);

                    const success =
                      metricsData?.errorCount === 0 && run.status !== "failed";
                    const selectedForCompare =
                      compareLeft?.id === run.id || compareRight?.id === run.id;

                    return (
                      <tr
                        key={run.id}
                        onClick={() => handleSelectRun(run)}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                      >
                        <td
                          className="p-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedForCompare}
                            onChange={() => toggleCompareSelect(run)}
                            className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-mono text-slate-300 font-medium">
                          {run.id.split("-")[0]}
                        </td>
                        <td className="p-4 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-600" />
                            {new Date(run.started_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${profileColor}`}
                          >
                            {profileLabel}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          <div className="flex items-center gap-2">
                            <Users size={12} className="text-slate-600" />
                            <span>
                              {metricsData?.runConfig?.totalVUs || "—"} VUs
                            </span>
                            <span className="text-slate-600">|</span>
                            <span>
                              {metricsData?.runConfig?.durationSec || "—"}s
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-300">
                          {metricsData?.throughput
                            ? `${metricsData.throughput} req/s`
                            : "—"}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-300">
                          {metricsData?.latency?.p95
                            ? `${metricsData.latency.p95}ms`
                            : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                          >
                            {metricsData?.errorRate
                              ? `${metricsData.errorRate}%`
                              : "—"}
                          </span>
                        </td>
                        <td
                          className="p-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleReRunAction(run, e)}
                              title={t(
                                "performance.actions.rerun",
                                "Run again",
                              )}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteRun(run.id, e)}
                              title={t(
                                "performance.actions.delete",
                                "Delete run",
                              )}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
            <BarChart2 size={48} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm">
              {t(
                "performance.history.no_runs",
                "No previous performance runs registered for this flow.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ComparisonMetrics = ({ metrics, other }) => {
  const { t } = useTranslation();
  const diff = (val, otherVal) => {
    if (!val || !otherVal) return null;
    const diffVal = val - otherVal;
    const percent = ((diffVal / otherVal) * 100).toFixed(1);
    if (diffVal > 0) return { text: `+${percent}%`, color: "text-red-400" };
    if (diffVal < 0) return { text: `${percent}%`, color: "text-emerald-400" };
    return {
      text: t("performance.compare.no_change", "No change"),
      color: "text-slate-500",
    };
  };

  const throughputDiff = diff(metrics.throughput, other.throughput);
  // Note: for latency, lower is better, so flip colors
  const latencyDiff = diff(metrics.latency?.p95, other.latency?.p95);
  const latencyColor =
    latencyDiff?.color === "text-red-400"
      ? "text-red-400"
      : latencyDiff?.color === "text-emerald-400"
        ? "text-emerald-400"
        : "text-slate-500";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
            Throughput
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {metrics.throughput} req/s
          </span>
          {throughputDiff && (
            <span
              className={`block text-xs font-semibold mt-1 ${throughputDiff.color === "text-red-400" ? "text-emerald-400" : "text-red-400"}`}
            >
              {throughputDiff.text === "Sin cambio"
                ? t("performance.compare.equal", "Equal")
                : throughputDiff.text}{" "}
              {t("performance.compare.vs_run_a", "vs Execution A")}
            </span>
          )}
        </div>
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
            Latencia P95
          </span>
          <span className="text-2xl font-mono font-bold text-slate-200">
            {metrics.latency?.p95}ms
          </span>
          {latencyDiff && (
            <span
              className={`block text-xs font-semibold mt-1 ${latencyColor}`}
            >
              {latencyDiff.text} vs Ejecución A
            </span>
          )}
        </div>
      </div>
      {/* Top 3 Slowest nodes side by side comparison could go here if wanted */}
    </div>
  );
};

export default PerfHistoryView;
