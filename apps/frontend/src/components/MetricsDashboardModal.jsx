import React, { useState, useEffect } from "react";
import { X, BarChart3, ShieldCheck, Zap, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { api } from "../utils/api";

export default function MetricsDashboardModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/metrics/dashboard");
      if (response && response.success) {
        setMetrics(response.data);
      } else {
        setError("Error cargando el dashboard de métricas");
      }
    } catch (err) {
      setError(err.message || "Error al conectar con la API de métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dashboard de Cobertura y Métricas</h2>
              <p className="text-xs text-slate-400">Control evolutivo de automatizaciones y auto-recuperación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Recargar métricas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {metrics && (
            <>
              {/* Top Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col">
                  <span className="text-xs font-medium text-slate-400">Tasa de Éxito</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1">
                    {metrics.summary?.passRatePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2">
                    {metrics.summary?.successfulRuns} exitosas de {metrics.summary?.totalExecutions}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col">
                  <span className="text-xs font-medium text-slate-400">Cobertura de Accesibilidad</span>
                  <span className="text-2xl font-black text-indigo-400 mt-1">
                    {metrics.coverage?.accessibilityCoveragePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2">
                    {metrics.coverage?.interactiveElementsTested} elementos ARIA probados
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col">
                  <span className="text-xs font-medium text-slate-400">Auto-Recuperación (Healing)</span>
                  <span className="text-2xl font-black text-amber-400 mt-1">
                    {metrics.healingTelemetry?.healingSuccessRatePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2">
                    {metrics.healingTelemetry?.successfulHeals} arreglos exitosos
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col">
                  <span className="text-xs font-medium text-slate-400">Latencia Promedio</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1">
                    {metrics.summary?.avgLatencySeconds}s
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2">Tiempo de respuesta por paso</span>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flaky Nodes */}
                <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" /> Nodos Inestables (Flaky Detection)
                  </h3>
                  {metrics.flakyNodes && metrics.flakyNodes.length > 0 ? (
                    <div className="space-y-2">
                      {metrics.flakyNodes.map((fn, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="font-mono text-slate-300">{fn.nodeId}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold">
                            {fn.failureCount} fallos
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sin nodos inestables detectados
                    </p>
                  )}
                </div>

                {/* Healing Telemetry */}
                <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Telemetría del Motor Healer
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span>Eventos Totales de Recuperación:</span>
                      <span className="font-bold text-white">{metrics.healingTelemetry?.totalHealingEvents}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span>Correcciones Exitosas en Vivo:</span>
                      <span className="font-bold text-emerald-400">{metrics.healingTelemetry?.successfulHeals}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Efectividad de Remediación:</span>
                      <span className="font-bold text-amber-400">{metrics.healingTelemetry?.healingSuccessRatePercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
