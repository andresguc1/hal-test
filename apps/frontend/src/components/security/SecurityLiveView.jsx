import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Square,
  Sparkles,
  ArrowRight,
  Shield,
  Search,
} from "lucide-react";
import { RealTimeTelemetryChart } from "../telemetry/RealTimeTelemetryChart";
import { TelemetryDataNormalizer } from "../telemetry/telemetryTypes";

export default function SecurityLiveView({
  status, // 'idle' | 'preparing' | 'running' | 'completed' | 'failed'
  progressPercent = 0,
  currentNode,
  liveAlerts = [],
  onStopExecution,
  onViewResults,
}) {
  const chartRef = useRef(null);
  const normalizerRef = useRef(new TelemetryDataNormalizer());

  useEffect(() => {
    if (!chartRef.current || liveAlerts.length === 0) return;

    const riskPoints = [];
    const candlesticks = [];

    liveAlerts.forEach((a, idx) => {
      const timeMs = a.timestamp || (Date.now() - (liveAlerts.length - idx) * 1000);
      const time = normalizerRef.current.ensureAscendingTimestamp(timeMs);
      const riskScore = a.severity === 'critical' ? 95 : a.severity === 'high' ? 80 : a.severity === 'medium' ? 50 : 20;

      riskPoints.push({ time, value: riskScore });
      candlesticks.push({
        time,
        open: Math.max(10, riskScore - 15),
        high: Math.min(100, riskScore + 10),
        low: Math.max(5, riskScore - 20),
        close: riskScore
      });
    });

    chartRef.current.setHistoricalData(candlesticks, { riskIndex: riskPoints });
  }, [liveAlerts]);
  const isRunning = status === "running" || status === "preparing";

  // Calculate live counters
  const criticalCount = liveAlerts.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const mediumCount = liveAlerts.filter((a) => a.severity === "medium").length;
  const lowCount = liveAlerts.filter((a) => a.severity === "low" || a.severity === "info").length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Progress Bar and Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${
              isRunning
                ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : status === "completed"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}>
              <Activity size={24} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">
                  {status === "preparing" && "Inicializando Escaneo DAST..."}
                  {status === "running" && "Auditoría de Seguridad en Curso"}
                  {status === "completed" && "Auditoría Completada Exitosamente"}
                  {status === "failed" && "Auditoría Interrumpida"}
                  {status === "idle" && "Esperando Ejecución de Auditoría"}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isRunning
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : status === "completed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentNode
                  ? `Analizando Nodo Activo: "${currentNode.name || currentNode.id}" (${currentNode.type || "Action"})`
                  : "Monitoreando peticiones HTTP, cabeceras del servidor y sanitización DOM..."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isRunning && onStopExecution && (
              <button
                type="button"
                onClick={onStopExecution}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Square size={14} />
                <span>Detener Auditoría</span>
              </button>
            )}

            {status === "completed" && onViewResults && (
              <button
                type="button"
                onClick={onViewResults}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <span>Ver Informe Completo</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Progreso del Grafo de Pruebas</span>
            <span className="text-slate-200 font-bold">{Math.round(progressPercent)}%</span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/80 p-0.5 relative">
            <motion.div
              className={`h-full rounded-full ${
                status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_12px_rgba(225,29,72,0.5)]"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Live Findings Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-red-400">{criticalCount}</div>
            <div className="text-xs text-slate-400 font-medium">Críticas / Altas</div>
          </div>
          <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/30 text-red-400">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-amber-400">{mediumCount}</div>
            <div className="text-xs text-slate-400 font-medium">Severidad Media</div>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-blue-400">{lowCount}</div>
            <div className="text-xs text-slate-400 font-medium">Bajas / Informativas</div>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/30 text-blue-400">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Real-time DAST Telemetry Chart */}
      <RealTimeTelemetryChart
        ref={chartRef}
        height={280}
        title="Telemetría de Riesgo de Seguridad (Live DAST)"
      />

      {/* Live Alerts Telemetry Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-red-400 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-200">
              Feed de Alertas Detectadas en Tiempo Real ({liveAlerts.length})
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">WebSocket Live Stream</span>
        </div>

        {liveAlerts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
              <Search size={20} />
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isRunning
                ? "El motor de escaneo está analizando los nodos. Las vulnerabilidades detectadas aparecerán aquí al instante."
                : "Inicia la auditoría para comenzar la inspección pasiva en tiempo real."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {liveAlerts.map((alert, idx) => (
                <motion.div
                  key={alert.id || idx}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        alert.severity === "high" || alert.severity === "critical"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : alert.severity === "medium"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">{alert.ruleId}</span>
                    </div>
                    <p className="text-slate-300">{alert.message}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(alert.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
