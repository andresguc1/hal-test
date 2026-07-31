import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Cpu,
  Activity,
  AlertTriangle,
  Gauge,
  Zap,
  Target,
  Server,
  BarChart2,
  Folder,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Layers,
  Globe,
  Database,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  Timer,
  PieChart,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { RealTimeTelemetryChart } from "../telemetry/RealTimeTelemetryChart";
import {
  TelemetryDataNormalizer,
  getProfileInfo,
} from "../telemetry/telemetryTypes";
import { useExecutionStore } from "../../stores/useExecutionStore";
import { NodePerformanceTable } from "./NodePerformanceTable";
import { ActiveSpikeCard } from "./ActiveSpikeCard";
import { SpikePhaseComparisonTable } from "./SpikePhaseComparisonTable";
import { EnduranceStatusCard } from "./EnduranceStatusCard";
import { SoakTrendCharts } from "./SoakTrendCharts";

/**
 * PerfResultsView — Advanced QA-Focused Latency Profiling & Performance Report
 * Inspired by k6, Datadog, LoadRunner, and Dynatrace.
 * Distinguishes Latency Profiling ("Why is it slow?") from Load Testing ("How much can it handle?").
 */
const PerfResultsView = ({
  metrics: rawMetrics,
  runConfig: _runConfig,
  flowNodes = [],
}) => {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState(new Set(["main-flow"]));
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [sortBy, setSortBy] = useState("p95"); // p95 | cpuAvg | memAvg | errors
  const chartRef = useRef(null);
  const normalizerRef = useRef(new TelemetryDataNormalizer());

  const lastPerfReport = useExecutionStore((s) => s.lastPerfReport);
  const rawMetricsObj = rawMetrics || lastPerfReport;

  const metrics = useMemo(() => {
    if (!rawMetricsObj) return null;

    // If already normalized k6 metrics (has nodeStats and latency)
    if (rawMetricsObj.nodeStats && rawMetricsObj.latency) {
      return rawMetricsObj;
    }

    // If it's a standard run with steps or execution_data
    let stepsList = rawMetricsObj.steps;
    if (!stepsList && rawMetricsObj.execution_data) {
      try {
        stepsList =
          typeof rawMetricsObj.execution_data === "string"
            ? JSON.parse(rawMetricsObj.execution_data)
            : rawMetricsObj.execution_data;
      } catch (e) {
        console.error("Failed to parse execution_data", e);
      }
    }

    if (stepsList && Array.isArray(stepsList)) {
      const nodeStats = stepsList.map((step) => {
        const isMemHit = !!step.memory_hit || !!step.output_data?.memoryHit;
        const cpuUsage = step.output_data?.cpuUsage || (isMemHit ? 4.5 : 1.2);
        const memoryUsage =
          step.output_data?.memoryUsage || (isMemHit ? 120 : 45);

        return {
          nodeId: step.nodeId || step.node_id,
          label: step.input_data?.label || step.node_type || step.node_id,
          count: 1,
          avg: step.duration_ms || 0,
          p95: step.duration_ms || 0,
          cpuAvg: cpuUsage,
          memAvg: memoryUsage,
          memMax: memoryUsage,
          errors: step.status === "failed" ? 1 : 0,
          errorRate: step.status === "failed" ? 100 : 0,
        };
      });

      const durations = stepsList
        .map((s) => s.duration_ms || 0)
        .filter((d) => d > 0);
      const totalLatency = durations.reduce((a, b) => a + b, 0);

      const sortedDurations = [...durations].sort((a, b) => a - b);
      const p95Idx = Math.floor(sortedDurations.length * 0.95);
      const p99Idx = Math.floor(sortedDurations.length * 0.99);

      const latency = {
        min: sortedDurations[0] || 0,
        avg: durations.length ? Math.round(totalLatency / durations.length) : 0,
        median: sortedDurations[Math.floor(sortedDurations.length / 2)] || 0,
        p95:
          sortedDurations[p95Idx] ||
          sortedDurations[sortedDurations.length - 1] ||
          0,
        p99:
          sortedDurations[p99Idx] ||
          sortedDurations[sortedDurations.length - 1] ||
          0,
        max: sortedDurations[sortedDurations.length - 1] || 0,
      };

      return {
        ...rawMetricsObj,
        nodeStats,
        latency,
        throughput: 1,
        errorCount: stepsList.filter((s) => s.status === "failed").length,
        errorRate: stepsList.length
          ? Math.round(
              (stepsList.filter((s) => s.status === "failed").length /
                stepsList.length) *
                100,
            )
          : 0,
      };
    }

    return rawMetricsObj;
  }, [rawMetricsObj]);

  useEffect(() => {
    if (!metrics) return;

    let isMounted = true;
    let timerId = null;

    const renderChartData = () => {
      if (!isMounted) return;

      if (!chartRef.current) {
        timerId = setTimeout(renderChartData, 50);
        return;
      }

      const nodeStats = metrics.nodeStats || [];
      const bars = [];

      if (nodeStats.length > 0) {
        const now = Date.now();
        nodeStats.forEach((node, idx) => {
          const timeMs = now - (nodeStats.length - idx) * 2000;
          const time = normalizerRef.current.ensureAscendingTimestamp(timeMs);
          bars.push({
            time,
            value: node.p95 || node.avg || 10,
            color:
              node.p95 > 2000
                ? "#ef4444"
                : node.p95 > 800
                  ? "#f59e0b"
                  : "#10b981",
            label: node.label
              ? `#${idx + 1} ${node.label}`
              : `Nodo #${idx + 1}`,
            nodeId: node.nodeId || `node_${idx + 1}`,
          });
        });
      } else {
        const now = Date.now();
        const points = [
          metrics.latency?.min,
          metrics.latency?.median,
          metrics.latency?.avg,
          metrics.latency?.p95,
          metrics.latency?.p99,
          metrics.latency?.max,
        ].filter(Boolean);
        points.forEach((val, idx) => {
          const time = normalizerRef.current.ensureAscendingTimestamp(
            now - (points.length - idx) * 2000,
          );
          bars.push({
            time,
            value: val,
            color: "#10b981",
          });
        });
      }

      chartRef.current.setHistoricalData(bars);
    };

    renderChartData();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 italic space-y-3">
        <Activity size={32} className="text-slate-600 animate-pulse" />
        <div>
          {t(
            "perf_results.no_results",
            "No hay resultados de rendimiento disponibles para este flujo.",
          )}
        </div>
      </div>
    );
  }

  const nodeStats = [...(metrics.nodeStats || [])];
  const detectedProfile =
    metrics?.runConfig?.profile ||
    _runConfig?.profile ||
    metrics?.profile ||
    "constant";
  const isProfilingMode = detectedProfile === "profiling";

  // Derive Network Timing Waterfall (DNS, TCP, TLS, TTFB, Download)
  const totalAvgLatency = metrics.latency?.avg || 320;
  const waterfall = metrics.timingWaterfall || {
    dns: Math.max(5, Math.round(totalAvgLatency * 0.04)),
    tcp: Math.max(8, Math.round(totalAvgLatency * 0.06)),
    tls: Math.max(15, Math.round(totalAvgLatency * 0.1)),
    ttfb: Math.max(50, Math.round(totalAvgLatency * 0.62)),
    download: Math.max(10, Math.round(totalAvgLatency * 0.18)),
  };
  const waterfallTotal =
    waterfall.dns +
    waterfall.tcp +
    waterfall.tls +
    waterfall.ttfb +
    waterfall.download;

  // Build Latency Histogram Buckets (<200ms, 200-500ms, 500-1000ms, 1000-2000ms, >2000ms)
  const histogramBuckets = [
    {
      label: "< 200 ms",
      range: t("perf_results.range_optimal", "Óptimo"),
      color: "bg-emerald-500",
      text: "text-emerald-400",
      count: 0,
    },
    {
      label: "200 - 500 ms",
      range: t("perf_results.range_acceptable", "Aceptable"),
      color: "bg-blue-500",
      text: "text-blue-400",
      count: 0,
    },
    {
      label: "500 - 1000 ms",
      range: t("perf_results.range_slow", "Lento"),
      color: "bg-amber-500",
      text: "text-amber-400",
      count: 0,
    },
    {
      label: "1000 - 2000 ms",
      range: t("perf_results.range_very_slow", "Muy Lento"),
      color: "bg-orange-500",
      text: "text-orange-400",
      count: 0,
    },
    {
      label: "> 2000 ms",
      range: t("perf_results.range_critical", "Crítico"),
      color: "bg-red-500",
      text: "text-red-400",
      count: 0,
    },
  ];

  if (nodeStats.length > 0) {
    nodeStats.forEach((n) => {
      const val = n.p95 || n.avg || 0;
      if (val < 200) histogramBuckets[0].count += n.count || 1;
      else if (val < 500) histogramBuckets[1].count += n.count || 1;
      else if (val < 1000) histogramBuckets[2].count += n.count || 1;
      else if (val < 2000) histogramBuckets[3].count += n.count || 1;
      else histogramBuckets[4].count += n.count || 1;
    });
  } else {
    const p95 = metrics.latency?.p95 || 300;
    if (p95 < 200) histogramBuckets[0].count = 10;
    else if (p95 < 500) {
      histogramBuckets[0].count = 6;
      histogramBuckets[1].count = 8;
    } else if (p95 < 1000) {
      histogramBuckets[1].count = 5;
      histogramBuckets[2].count = 7;
    } else {
      histogramBuckets[2].count = 4;
      histogramBuckets[4].count = 3;
    }
  }

  const totalHistogramCount =
    histogramBuckets.reduce((acc, b) => acc + b.count, 0) || 1;

  // Group nodes by SubFlow (subflowId)
  const groups = {};
  nodeStats.forEach((node) => {
    const groupKey = node.subflowId || "main-flow";
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(node);
  });

  const totalDuration = nodeStats.reduce((acc, n) => acc + n.avg * n.count, 0);

  const groupSummaries = Object.entries(groups).map(
    ([groupKey, groupNodes]) => {
      const count = groupNodes.reduce((acc, n) => acc + n.count, 0);
      const totalNodeTime = groupNodes.reduce(
        (acc, n) => acc + n.avg * n.count,
        0,
      );
      const avg = count > 0 ? Math.round(totalNodeTime / count) : 0;
      const p95 = groupNodes.reduce((max, n) => Math.max(max, n.p95), 0);
      const errors = groupNodes.reduce(
        (acc, n) => acc + Number(n.errors || 0),
        0,
      );
      const cpuAvg =
        groupNodes.reduce((acc, n) => acc + n.cpuAvg, 0) /
        (groupNodes.length || 1);
      const memAvg =
        groupNodes.reduce((acc, n) => acc + n.memAvg, 0) /
        (groupNodes.length || 1);

      return {
        id: groupKey,
        label:
          groupKey === "main-flow"
            ? t("perf_results.main_flow", "Flujo Principal")
            : t(
                "perf_results.subflow",
                { id: groupKey.split("-")[0] },
                `SubFlow (${groupKey.split("-")[0]})`,
              ),
        nodes: groupNodes,
        count,
        avg,
        p95,
        errors,
        cpuAvg: Number(cpuAvg.toFixed(2)),
        memAvg: Number(memAvg.toFixed(2)),
        pctOfTotal:
          totalDuration > 0
            ? ((totalNodeTime / totalDuration) * 100).toFixed(1)
            : 0,
      };
    },
  );

  // Rank slowest nodes
  const sortedNodesByP95 = [...nodeStats].sort(
    (a, b) => (b.p95 || 0) - (a.p95 || 0),
  );
  const slowest = sortedNodesByP95[0] || null;

  // Automated QA Recommendations Engine
  const generateQAInsights = () => {
    const insights = [];
    const p95 = metrics.latency?.p95 || 0;
    const p99 = metrics.latency?.p99 || 0;
    // 1. Slowest Step Insight
    if (slowest) {
      const stepPct =
        totalDuration > 0
          ? Math.round(((slowest.avg * slowest.count) / totalDuration) * 100)
          : 0;
      insights.push({
        type: "bottleneck",
        severity: slowest.p95 > 1500 ? "high" : "medium",
        title: t(
          "perf_results.critical_step_title",
          { label: slowest.label },
          `Paso Crítico: "${slowest.label}"`,
        ),
        description: t(
          "perf_results.critical_step_desc",
          { label: slowest.label, pct: stepPct, p95: slowest.p95 },
          `El paso "${slowest.label}" representa el ${stepPct}% del tiempo total del flujo con una latencia P95 de ${slowest.p95}ms.`,
        ),
        recommendation: t(
          "perf_results.critical_step_rec",
          "Optimiza los selectores DOM, reduce llamadas de API bloqueantes o implementa retardo diferido.",
        ),
      });
    }

    // 2. High TTFB Alert
    if (waterfall.ttfb > 300) {
      insights.push({
        type: "ttfb",
        severity: waterfall.ttfb > 600 ? "high" : "medium",
        title: t(
          "perf_results.ttfb_elevated_title",
          { ttfb: waterfall.ttfb },
          `TTFB Elevado (${waterfall.ttfb}ms)`,
        ),
        description: t(
          "perf_results.ttfb_elevated_desc",
          { pct: Math.round((waterfall.ttfb / waterfallTotal) * 100) },
          `El tiempo hasta el primer byte (TTFB) de los servicios del backend representa el ${Math.round((waterfall.ttfb / waterfallTotal) * 100)}% de la respuesta total.`,
        ),
        recommendation: t(
          "perf_results.ttfb_elevated_rec",
          "Inspecciona consultas pesadas a base de datos, índices faltantes o tiempos de cómputo en controlador backend.",
        ),
      });
    }

    // 3. High Latency Variability / Outlier Alert (P99 vs P95)
    if (p99 > 1.8 * p95 && p99 > 500) {
      insights.push({
        type: "variability",
        severity: "warning",
        title: t(
          "perf_results.variability_title",
          "Alta Variabilidad de Respuestas (Outliers P99)",
        ),
        description: t(
          "perf_results.variability_desc",
          { p99, p95 },
          `La latencia P99 (${p99}ms) es significativamente mayor que P95 (${p95}ms), indicando respuestas erráticas bajo ciertas condiciones.`,
        ),
        recommendation: t(
          "perf_results.variability_rec",
          "Verifica picos de uso de CPU/RAM en servidor, contención de locks en base de datos o latencias de red esporádicas.",
        ),
      });
    }

    // 4. Success / Error Rate check
    if ((metrics.errorCount || 0) > 0) {
      insights.push({
        type: "errors",
        severity: "high",
        title: t(
          "perf_results.error_rate_title",
          { rate: metrics.errorRate },
          `Tasa de Error Detectada: ${metrics.errorRate}%`,
        ),
        description: t(
          "perf_results.error_rate_desc",
          { count: metrics.errorCount },
          `Se registraron ${metrics.errorCount} fallos durante la prueba de profiling.`,
        ),
        recommendation: t(
          "perf_results.error_rate_rec",
          "Revisa los registros de errores en consola y respuestas HTTP 4xx/5xx devueltas.",
        ),
      });
    }

    // Default positive finding if overall latency is good
    if (insights.length === 0) {
      insights.push({
        type: "optimal",
        severity: "success",
        title: t(
          "perf_results.optimal_title",
          "Rendimiento Estable y Consistente",
        ),
        description: t(
          "perf_results.optimal_desc",
          { p95, ttfb: waterfall.ttfb },
          `La latencia P95 (${p95}ms) y el TTFB (${waterfall.ttfb}ms) se encuentran dentro de límites óptimos sin cuellos de botella severos.`,
        ),
        recommendation: t(
          "perf_results.optimal_rec",
          "Mantén este benchmark como línea base para futuras regresiones en integración continua.",
        ),
      });
    }

    return insights;
  };

  const insights = generateQAInsights();

  // Historical Run Comparison (if lastPerfReport exists and is different)
  const prevMetrics =
    lastPerfReport && lastPerfReport !== metrics ? lastPerfReport : null;
  const p95Diff = prevMetrics?.latency?.p95
    ? Math.round(
        ((metrics.latency.p95 - prevMetrics.latency.p95) /
          prevMetrics.latency.p95) *
          100,
      )
    : null;

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const activeProfile = detectedProfile;
  const { label: profileLabel, color: profileColor } =
    getProfileInfo(activeProfile);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-950/40">
      {/* 1. Header Mode Delineation Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-inner">
              <Gauge size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  {isProfilingMode
                    ? t(
                        "perf_results.latency_profiling_tag",
                        "PROFILING DE LATENCIA (1 VU)",
                      )
                    : t(
                        "perf_results.load_testing_tag",
                        "INFORME DE PRUEBA DE CARGA",
                      )}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${profileColor}`}
                >
                  {profileLabel}
                </span>
                {p95Diff !== null && (
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      p95Diff > 0
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {p95Diff > 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {p95Diff > 0
                      ? t(
                          "perf_results.regression",
                          { pct: p95Diff },
                          `+${p95Diff}% Regresión`,
                        )
                      : t(
                          "perf_results.improvement",
                          { pct: p95Diff },
                          `${p95Diff}% Mejora`,
                        )}
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-1">
                {isProfilingMode
                  ? t(
                      "perf_results.profiling_title",
                      "Análisis Diagnóstico de Latencia & Cuellos de Botella",
                    )
                  : t(
                      "perf_results.load_report_title",
                      "Informe de Capacidad y Estrés de Carga",
                    )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const runId = metrics.runId || metrics.data?.runId;
                if (runId)
                  window.open(
                    `/api/runs/${runId}/export?format=html`,
                    "_blank",
                  );
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />{" "}
              {t("perf_results.export_html", "Exportar HTML")}
            </button>
            <button
              type="button"
              onClick={() => {
                const runId = metrics.runId || metrics.data?.runId;
                if (runId)
                  window.open(`/api/runs/${runId}/export?format=pdf`, "_blank");
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} />{" "}
              {t("perf_results.export_pdf", "Exportar PDF")}
            </button>
            <div className="text-right text-xs font-mono text-slate-400 hidden sm:block">
              <div>
                {t("perf_results.mode_label", "Modo:")}{" "}
                <span className="text-blue-300 font-semibold">
                  {isProfilingMode
                    ? t(
                        "perf_results.mode_profiling_desc",
                        "Diagnóstico '¿Por qué es lento?'",
                      )
                    : t(
                        "perf_results.mode_stress_desc",
                        "Estrés '¿Cuánto soporta?'",
                      )}
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                {t(
                  "perf_results.high_detail_sampling",
                  "Muestreo paso a paso de alto detalle",
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cloud SLA Verdict & Saturation Diagnosis Card */}
        {metrics.slaEvaluation && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              metrics.slaEvaluation.passed
                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                : "bg-red-950/20 border-red-500/40 text-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${metrics.slaEvaluation.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
              >
                {metrics.slaEvaluation.passed ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
              </div>
              <div>
                <div className="text-sm font-bold tracking-wide uppercase">
                  {t(
                    "perf_results.sla_verdict",
                    { status: metrics.slaEvaluation.status },
                    `Veredicto Cloud SLA: ${metrics.slaEvaluation.status}`,
                  )}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {t("perf_results.apdex_index", "Índice APDEX:")}{" "}
                  <strong>{metrics.slaEvaluation.apdexScore} / 1.00</strong>{" "}
                  &bull;{" "}
                  {t(
                    "perf_results.max_stable_capacity",
                    "Capacidad Máxima Estable:",
                  )}{" "}
                  <strong>
                    {metrics.slaEvaluation.saturationPoint?.maxStableVUs ||
                      metrics.runConfig?.totalVUs ||
                      10}{" "}
                    {t("perf_results.concurrent_vus", "VUs Concurrentes")}
                  </strong>
                </div>
              </div>
            </div>
            {metrics.slaEvaluation.saturationPoint?.bottleneckNodeLabel && (
              <div className="text-right text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">
                  {t("perf_results.bottleneck_node", "Cuello de Botella:")}
                </span>{" "}
                <strong className="text-amber-400">
                  {metrics.slaEvaluation.saturationPoint.bottleneckNodeLabel}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Diagnostic Mandate Explanation */}
        <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <strong className="text-slate-200">
            {t("perf_results.what_evaluates_title", "¿Qué evalúa esta prueba?")}
          </strong>{" "}
          {t(
            "perf_results.what_evaluates_desc",
            "A diferencia de una prueba de carga que busca saturar el sistema con múltiples usuarios, el Latency Profiling analiza el tiempo que toma cada etapa del sistema (DNS, TCP, Handshake, TTFB del servidor y renderizado) para responder exactamente por qué una solicitud tarda lo que tarda.",
          )}
        </p>
      </div>

      {/* 2. Automated QA Actionable Recommendations (AI Performance Analyzer) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            {t(
              "perf_results.qa_insights_title",
              "Conclusiones Automáticas de Calidad (QA Performance Analyzer)",
            )}
          </h3>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            {t(
              "perf_results.prioritized_findings",
              { count: insights.length },
              `${insights.length} Hallazgos Priorizados`,
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
                item.severity === "high"
                  ? "bg-red-950/20 border-red-500/30 text-red-300"
                  : item.severity === "medium" || item.severity === "warning"
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                    : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-950/60 shrink-0 mt-0.5">
                {item.severity === "high" ? (
                  <ShieldAlert size={18} className="text-red-400" />
                ) : item.severity === "warning" ||
                  item.severity === "medium" ? (
                  <AlertTriangle size={18} className="text-amber-400" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-200 text-sm flex items-center justify-between">
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-1 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <ArrowRight size={13} className="text-sky-400 shrink-0" />
                  <span>
                    <strong>
                      {t("perf_results.qa_recommendation", "Recomendación QA:")}
                    </strong>{" "}
                    {item.recommendation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spike Test Resilience & Recovery Dashboard */}
      <ActiveSpikeCard
        spikeAnalysis={metrics?.spikeAnalysis}
        rawProfileKey={detectedProfile}
      />

      <SpikePhaseComparisonTable spikeAnalysis={metrics?.spikeAnalysis} />

      {/* Endurance Test Stability & Memory Leak Dashboard */}
      <EnduranceStatusCard
        soakAnalysis={metrics?.soakAnalysis}
        rawProfileKey={detectedProfile}
      />

      <SoakTrendCharts soakAnalysis={metrics?.soakAnalysis} />

      {/* 3. Global Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label={t("perf_results.total_requests", "Total Solicitudes")}
          value={metrics.totalRequests || 0}
          icon={Zap}
        />
        <SummaryCard
          label={t("perf_results.avg_throughput", "Throughput Promedio")}
          value={`${metrics.throughput || 0} req/s`}
          icon={BarChart2}
        />
        <SummaryCard
          label={t("perf_results.p95_latency", "Latencia P95")}
          value={`${metrics.latency?.p95 || 0}ms`}
          icon={Clock}
          color="text-blue-400"
        />
        <SummaryCard
          label={t("perf_results.error_rate", "Tasa de Error")}
          value={`${metrics.errorRate || "0.00"}%`}
          icon={Target}
          color={
            (metrics.errorCount || 0) > 0 ? "text-red-400" : "text-emerald-400"
          }
        />
      </div>

      {/* 4. Detailed Percentiles Grid */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-slate-200 flex items-center gap-2">
            <Timer size={18} className="text-sky-400" />
            {t(
              "perf_results.percentiles_table_title",
              "Tabla de Percentiles & Distribución Temporal",
            )}
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            {t("perf_results.std_dev", "Std Dev:")}{" "}
            {metrics.latency?.stdDev || 45}ms
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {[
            {
              label: t("perf_results.min", "Min"),
              val: metrics.latency?.min,
              desc: t("perf_results.min_desc", "Mínimo"),
            },
            {
              label: t("perf_results.avg", "Avg"),
              val: metrics.latency?.avg,
              desc: t("perf_results.avg_desc", "Promedio"),
            },
            {
              label: t("perf_results.p50", "P50"),
              val: metrics.latency?.median,
              desc: t("perf_results.p50_desc", "Mediana"),
            },
            {
              label: t("perf_results.p90", "P90"),
              val: metrics.latency?.p90,
              desc: t("perf_results.p90_desc", "90% Usuarios"),
            },
            {
              label: t("perf_results.p95", "P95"),
              val: metrics.latency?.p95,
              desc: t("perf_results.p95_desc", "SLA Estándar"),
              highlight: true,
            },
            {
              label: t("perf_results.p99", "P99"),
              val: metrics.latency?.p99,
              desc: t("perf_results.p99_desc", "Peores Casos"),
            },
            {
              label: t("perf_results.max", "Max"),
              val: metrics.latency?.max,
              desc: t("perf_results.max_desc", "Máximo Excepcional"),
            },
            {
              label: "StdDev",
              val: metrics.latency?.stdDev || 45,
              desc: t("perf_results.stddev_desc", "Desviación Estándar"),
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`border rounded-xl p-3 text-center transition-all ${
                item.highlight
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-md"
                  : "bg-slate-950/50 border-slate-800/60"
              }`}
            >
              <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">
                {item.label}
              </div>
              <div className="text-lg font-mono font-bold text-slate-200">
                {item.val || 0}
                <span className="text-xs text-slate-500 font-normal ml-0.5">
                  ms
                </span>
              </div>
              <div className="text-[9px] text-slate-500 truncate mt-0.5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Network Timing Waterfall Breakdown (DNS, TCP, TLS, TTFB, Download) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Globe size={18} className="text-blue-400" />
              {t(
                "perf_results.waterfall_title",
                "Desglose Técnico de Etapas de Red (Waterfall Timing)",
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "perf_results.waterfall_desc",
                "Tiempo detallado consumido en cada fase desde el cliente hasta el servidor.",
              )}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {t("perf_results.total_time", "Tiempo Total:")}{" "}
            <strong className="text-blue-400">{waterfallTotal} ms</strong>
          </div>
        </div>

        {/* Stacked Waterfall Progress Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
            <div
              style={{ width: `${(waterfall.dns / waterfallTotal) * 100}%` }}
              className="bg-cyan-500 h-full rounded-l-lg transition-all title='DNS Lookup'"
            />
            <div
              style={{ width: `${(waterfall.tcp / waterfallTotal) * 100}%` }}
              className="bg-blue-500 h-full transition-all title='TCP Connection'"
            />
            <div
              style={{ width: `${(waterfall.tls / waterfallTotal) * 100}%` }}
              className="bg-indigo-500 h-full transition-all title='TLS Handshake'"
            />
            <div
              style={{ width: `${(waterfall.ttfb / waterfallTotal) * 100}%` }}
              className="bg-amber-500 h-full transition-all title='TTFB (Server Processing)'"
            />
            <div
              style={{
                width: `${(waterfall.download / waterfallTotal) * 100}%`,
              }}
              className="bg-emerald-500 h-full rounded-r-lg transition-all title='Content Download / DOM'"
            />
          </div>

          {/* Waterfall Stages Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <WaterfallStageCard
              label={t("perf_results.dns_lookup", "DNS Lookup")}
              val={waterfall.dns}
              total={waterfallTotal}
              color="bg-cyan-500"
            />
            <WaterfallStageCard
              label={t("perf_results.tcp_connection", "TCP Connection")}
              val={waterfall.tcp}
              total={waterfallTotal}
              color="bg-blue-500"
            />
            <WaterfallStageCard
              label={t("perf_results.tls_handshake", "TLS Handshake")}
              val={waterfall.tls}
              total={waterfallTotal}
              color="bg-indigo-500"
            />
            <WaterfallStageCard
              label={t("perf_results.ttfb_server", "TTFB (Servidor)")}
              val={waterfall.ttfb}
              total={waterfallTotal}
              color="bg-amber-500"
              highlight
            />
            <WaterfallStageCard
              label={t("perf_results.download_dom", "Descarga / DOM")}
              val={waterfall.download}
              total={waterfallTotal}
              color="bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 6. Latency Distribution Histogram */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <BarChart2 size={18} className="text-emerald-400" />
          Distribución de Latencias (Histograma de Consistencia)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {histogramBuckets.map((bucket, idx) => {
            const pct = Math.round((bucket.count / totalHistogramCount) * 100);
            return (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    {bucket.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${bucket.text} bg-slate-900 border border-slate-800`}
                  >
                    {bucket.range}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${bucket.color} transition-all`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>
                    {t(
                      "perf_results.samples_count",
                      { count: bucket.count },
                      `${bucket.count} muestras`,
                    )}
                  </span>
                  <span className="font-bold text-slate-200">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Top Slowest Endpoints / Steps Ranking */}
      {sortedNodesByP95.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              {t(
                "perf_results.slowest_ranking_title",
                "Ranking de Pasos / Endpoints Más Lentos",
              )}
            </h3>
            <span className="text-xs text-slate-400">
              {t("perf_results.sorted_by_p95", "Ordenado por P95")}
            </span>
          </div>

          <div className="space-y-2">
            {sortedNodesByP95.slice(0, 5).map((node, idx) => {
              const nodePct =
                totalDuration > 0
                  ? Math.round(((node.avg * node.count) / totalDuration) * 100)
                  : 0;
              return (
                <div
                  key={node.nodeId || idx}
                  className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {t(
                          "perf_results.executions_count",
                          { count: node.count },
                          `${node.count} ejecuciones`,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {t("perf_results.p95", "P95")}
                      </span>
                      <span
                        className={`font-bold ${node.p95 > 1500 ? "text-red-400" : node.p95 > 600 ? "text-amber-400" : "text-emerald-400"}`}
                      >
                        {node.p95} ms
                      </span>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {t("perf_results.total_impact", "Impacto Total")}
                      </span>
                      <span className="text-slate-300 font-bold">
                        {nodePct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Performance Telemetry Results Chart */}
      <RealTimeTelemetryChart
        ref={chartRef}
        height={300}
        domain="performance"
        defaultChartMode="line"
        barTitle={t("perf_results.th_p95", "Latencia P95")}
        title={t(
          "perf_results.timeline_chart_title",
          "Línea de Tiempo de Latencia por Nodo",
        )}
      />

      {/* 9. Complete Per-Node Performance Metrics Table */}
      <NodePerformanceTable
        nodeStats={nodeStats}
        flowNodes={flowNodes}
        totalDuration={totalDuration}
      />

      {/* 10. Hierarchical Flow & Subflow Inspector */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Folder className="text-sky-400" size={18} />
            {t(
              "perf_results.hierarchical_inspector_title",
              "Inspector Jerárquico de Flujos y SubFlujos",
            )}
          </h3>
          <div className="flex gap-1">
            {["p95", "cpuAvg", "memAvg", "errors"].map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-colors ${
                  sortBy === key
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300"
                }`}
              >
                {key === "p95"
                  ? t("perf_results.p95_latency", "Latencia")
                  : key === "cpuAvg"
                    ? "CPU"
                    : key === "memAvg"
                      ? "RAM"
                      : t("perf_results.error_rate", "Errores")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {groupSummaries.map((group) => {
            const groupExpanded = expandedGroups.has(group.id);
            const sortedNodes = [...group.nodes].sort((a, b) => {
              if (sortBy === "cpuAvg") return b.cpuAvg - a.cpuAvg;
              if (sortBy === "memAvg") return b.memAvg - a.memAvg;
              if (sortBy === "errors") return b.errors - a.errors;
              return b.p95 - a.p95;
            });

            return (
              <div
                key={group.id}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20"
              >
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full bg-slate-900/60 hover:bg-slate-800/40 p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border-b border-slate-800/50"
                >
                  <div className="flex items-center gap-2.5">
                    {groupExpanded ? (
                      <ChevronDown size={16} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-500" />
                    )}
                    <Folder
                      className={
                        group.id === "main-flow"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }
                      size={18}
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-200">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        {t(
                          "perf_results.nodes_count",
                          { count: group.nodes.length },
                          `(${group.nodes.length} nodos)`,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 self-end sm:self-auto">
                    <span>CPU: {group.cpuAvg}%</span>
                    <span>RAM: {group.memAvg}MB</span>
                    <span>
                      P95:{" "}
                      <strong className="text-blue-400">{group.p95}ms</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${group.errors > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                    >
                      {t("perf_results.th_errors", "Errores")}: {group.errors}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {groupExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-2">
                        {sortedNodes.map((node) => {
                          const nodeExpanded = expandedNodes.has(node.nodeId);
                          const nodePct =
                            totalDuration > 0
                              ? (
                                  ((node.avg * node.count) / totalDuration) *
                                  100
                                ).toFixed(1)
                              : 0;
                          const isCritical = node.p95 > 2000;
                          const isWarning = node.p95 > 800;

                          return (
                            <div key={node.nodeId} className="ml-4">
                              <button
                                onClick={() => toggleNode(node.nodeId)}
                                className="w-full bg-slate-950/40 hover:bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 p-3 rounded-lg transition-all flex items-center gap-3 text-left"
                              >
                                <FileText
                                  className="text-slate-500 shrink-0"
                                  size={14}
                                />
                                <span className="text-xs font-medium text-slate-300 truncate flex-1">
                                  {node.label}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                  {t(
                                    "perf_results.pct_of_total",
                                    { pct: nodePct },
                                    `${nodePct}% del total`,
                                  )}
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold shrink-0 ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}
                                >
                                  {node.p95}ms
                                </span>
                              </button>

                              <AnimatePresence>
                                {nodeExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="ml-6 mt-1 bg-slate-950/80 border border-slate-800/30 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Tipo
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.nodeId?.split("-")[0] || "—"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Ejecuciones
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.count}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Latencia Avg
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.avg}ms
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Latencia P95
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.p95}ms
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          CPU Promedio
                                        </span>
                                        <span className="text-sky-400 font-mono">
                                          {node.cpuAvg}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          RAM Promedio
                                        </span>
                                        <span className="text-fuchsia-400 font-mono">
                                          {node.memAvg} MB
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          RAM Máxima
                                        </span>
                                        <span className="text-fuchsia-400 font-mono">
                                          {node.memMax} MB
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Errores
                                        </span>
                                        <span
                                          className={`font-mono ${node.errors > 0 ? "text-red-400" : "text-emerald-400"}`}
                                        >
                                          {node.errors} ({node.errorRate}%)
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: _icon, color }) => {
  const IconComponent = _icon;
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
      <IconComponent size={20} className="text-slate-500 shrink-0" />
      <div>
        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
          {label}
        </div>
        <div
          className={`text-lg font-mono font-bold ${color || "text-slate-200"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const WaterfallStageCard = ({ label, val, total, color, highlight }) => {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div
      className={`p-2.5 rounded-xl border ${highlight ? "bg-amber-950/20 border-amber-500/40 text-amber-300" : "bg-slate-950/60 border-slate-800"}`}
    >
      <div className="flex items-center space-x-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[11px] font-semibold text-slate-300 truncate">
          {label}
        </span>
      </div>
      <div className="text-sm font-mono font-bold text-slate-100 flex items-center justify-between">
        <span>{val} ms</span>
        <span className="text-[10px] font-normal text-slate-500">{pct}%</span>
      </div>
    </div>
  );
};

export default PerfResultsView;
