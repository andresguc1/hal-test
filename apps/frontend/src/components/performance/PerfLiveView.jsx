import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  Target,
  Server,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
} from "lucide-react";
import { RealTimeTelemetryChart } from "../telemetry/RealTimeTelemetryChart";
import { TelemetryDataNormalizer, getProfileInfo } from "../telemetry/telemetryTypes";

/**
 * PerfLiveView — Real-time execution dashboard with KPIs, bottlenecks, and TradingView telemetry chart
 */
const PerfLiveView = ({
  metrics,
  vuStatus,
  runConfig,
  resourceWarning,
  timeline = [],
  status: _status,
  progressPercent = 0,
}) => {
  const chartRef = useRef(null);
  const normalizerRef = useRef(new TelemetryDataNormalizer());

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
      const timeline = metrics.timeline || [];
      const bars = [];

      if (nodeStats.length > 0) {
        const now = Date.now();
        nodeStats.forEach((node, idx) => {
          const timeMs = now - (nodeStats.length - idx) * 2000;
          const time = normalizerRef.current.ensureAscendingTimestamp(timeMs);
          const val = node.p95 || node.avg || 10;
          bars.push({
            time,
            value: val,
            color: val > 2000 ? "#ef4444" : val > 800 ? "#f59e0b" : "#10b981",
            label: node.label ? `#${idx + 1} ${node.label}` : `Nodo #${idx + 1}`,
            nodeId: node.nodeId || `node_${idx + 1}`,
          });
        });
      } else if (timeline && timeline.length > 0) {
        timeline.forEach((pt, idx) => {
          const timeMs = pt.timestamp || (Date.now() - (timeline.length - idx) * 1000);
          const time = normalizerRef.current.ensureAscendingTimestamp(timeMs);
          const latencyMs = pt.latency || metrics?.latency?.p95 || 10;

          bars.push({
            time,
            value: latencyMs,
            color: latencyMs > 2000 ? "#ef4444" : latencyMs > 800 ? "#f59e0b" : "#10b981",
          });
        });
      }

      if (bars.length > 0) {
        chartRef.current.setHistoricalData(bars);
      }
    };

    renderChartData();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 italic space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <Activity size={32} className="animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-300">
            Esperando Métricas...
          </h2>
          <p className="text-slate-400 text-lg">
            <Gauge size={18} className="inline mr-2 animate-spin" />
            Recolectando telemetría del motor de ejecución
          </p>
        </motion.div>
      </div>
    );
  }

  const profileKey =
    metrics?.runConfig?.profile ||
    runConfig?.profile ||
    metrics?.profile ||
    "constant";
  const { label: profileLabel, color: profileColor } = getProfileInfo(profileKey);

  const totalVUs =
    metrics?.runConfig?.totalVUs ||
    metrics?.runConfig?.virtualUsers ||
    runConfig?.virtualUsers ||
    runConfig?.vus ||
    vuStatus?.activeVUs ||
    1;

  const durationSec =
    metrics?.runConfig?.durationSec ||
    metrics?.runConfig?.duration ||
    runConfig?.durationSec ||
    runConfig?.duration ||
    30;

  const elapsedSec = Math.round((metrics?.elapsed || 0) / 1000);
  const currentProgress = Math.min(
    100,
    Math.max(0, Math.round(progressPercent || (durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0)))
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Top Header Live Status & Load Profile Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            PRUEBA EN VIVO (TELEMETRÍA)
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Perfil de Carga:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${profileColor}`}>
            {profileLabel}
          </span>
          <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            {totalVUs} VUs | {durationSec}s
          </span>
        </div>
      </div>

      {/* Dynamic Progress Bar for Test Execution */}
      <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl space-y-2 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <Clock size={14} className="text-emerald-400 animate-spin" />
            <span>Progreso de Prueba ({profileLabel}):</span>
            <span className="font-mono text-emerald-400 font-bold">{currentProgress}%</span>
          </div>
          <div className="text-slate-400 font-mono">
            {elapsedSec}s / {durationSec}s
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full relative"
            style={{ width: `${currentProgress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Resource Warning */}
      {resourceWarning && resourceWarning.health !== "continue" && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-4 border ${resourceWarning.health === "abort" ? "bg-red-950/50 border-red-900/50 text-red-200" : "bg-amber-950/50 border-amber-900/50 text-amber-200"}`}
        >
          <AlertTriangle
            size={24}
            className={
              resourceWarning.health === "abort"
                ? "text-red-400"
                : "text-amber-400"
            }
          />
          <div>
            <h4 className="font-semibold text-lg">
              {resourceWarning.health === "abort"
                ? "Estrés de Memoria Crítico"
                : "Advertencia de Recursos"}
            </h4>
            <p className="text-sm opacity-80">
              RAM: {resourceWarning.usedPercent}%
              {resourceWarning.health === "abort" && " — Prueba abortada."}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KPICard
          icon={Zap}
          label="Throughput"
          value={metrics?.throughput || 0}
          unit="req/s"
          sub={`Total: ${metrics?.totalRequests || 0}`}
          color="blue"
        />
        <KPICard
          icon={Clock}
          label="Latencia (P95)"
          value={metrics?.latency?.p95 || 0}
          unit="ms"
          sub={`Mediana: ${metrics?.latency?.median || 0}ms`}
          color="indigo"
        />
        <KPICard
          icon={Target}
          label="Tasa de Error"
          value={metrics?.errorRate || "0.00"}
          unit="%"
          sub={`Fallos: ${metrics?.errorCount || 0}`}
          color={(metrics?.errorCount || 0) > 0 ? "red" : "emerald"}
        />
        <KPICard
          icon={Server}
          label="VUs Activos"
          value={vuStatus?.activeVUs || 0}
          unit="Nav."
          sub={`Completados: ${vuStatus?.completedVUs || 0}`}
          color="sky"
        />
      </div>

      {/* Bottlenecks + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bottlenecks */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col max-h-[450px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-slate-200 flex items-center gap-2">
              <Gauge className="text-amber-400" size={18} />
              Cuellos de Botella
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              P95
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {metrics?.nodeStats?.length > 0 ? (
              metrics.nodeStats.slice(0, 10).map((node, i) => {
                const isCritical = node.p95 > 2000;
                const isWarning = node.p95 > 800;
                return (
                  <div
                    key={node.nodeId}
                    className="bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 p-2.5 rounded-xl transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCritical ? "bg-red-500/20 text-red-400" : isWarning ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"}`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {node.label}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}
                      >
                        {node.p95}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                      <span>
                        <Cpu size={10} className="inline mr-1 text-sky-500" />
                        {node.cpuAvg}%
                      </span>
                      <span>
                        <Activity
                          size={10}
                          className="inline mr-1 text-fuchsia-500"
                        />
                        {node.memAvg} MB
                      </span>
                      <span
                        className={
                          (node.errors || 0) > 0 ? "text-red-400 font-bold" : ""
                        }
                      >
                        <AlertTriangle
                          size={10}
                          className={`inline mr-1 ${(node.errors || 0) > 0 ? "text-red-500" : "text-slate-600"}`}
                        />
                        {node.errorRate}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{
                          width: `${Math.min(100, (node.p95 / 3000) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
                <CheckCircle2 size={40} className="text-slate-700" />
                <p className="text-sm text-center">
                  Sin cuellos de botella registrados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="lg:col-span-2">
          <RealTimeTelemetryChart
            ref={chartRef}
            height={360}
            domain="performance"
            defaultChartMode="line"
            barTitle="Latencia (ms)"
            title="Línea de Tiempo de Latencia por Nodo"
          />
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ icon: _icon, label, value, unit, sub, color }) => {
  const IconComponent = _icon;
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
      <div
        className={`absolute -right-6 -top-6 text-slate-800/30 group-hover:text-${color}-900/20 transition-colors`}
      >
        <IconComponent size={100} />
      </div>
      <div className="relative z-10">
        <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
          {label}
        </div>
        <div
          className={`text-4xl font-light mb-1 flex items-baseline gap-2 ${color === "emerald" ? "text-emerald-400" : color === "red" ? "text-red-400" : "text-white"}`}
        >
          <span>{value}</span>
          <span className="text-lg text-slate-500 font-normal">{unit}</span>
        </div>
        <div className="text-xs text-slate-400">{sub}</div>
      </div>
    </div>
  );
};

export default PerfLiveView;
