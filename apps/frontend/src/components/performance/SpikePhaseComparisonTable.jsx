import React from "react";
import { motion } from "framer-motion";
import { Layers, Clock, Zap, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * SpikePhaseComparisonTable — 3D Executive Comparative Matrix
 * Compares Pre-Spike Baseline, Peak Impact, and Post-Spike Auto-Recovery.
 */
export const SpikePhaseComparisonTable = ({ spikeAnalysis }) => {
  if (!spikeAnalysis) return null;

  const pre = spikeAnalysis.preSpike || {};
  const peak = spikeAnalysis.peak || {};
  const post = spikeAnalysis.postSpike || {};

  const phases = [
    {
      title: "1. Pre-Spike (Baseline)",
      desc: "Carga base estable previa al salto súbito",
      stats: pre,
      badge: "Carga Base",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      title: "2. PICO SÚBITO (Peak)",
      desc: "Sobrecarga instantánea de máxima concurrencia",
      stats: peak,
      badge: "PICO SÚBITO",
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse",
    },
    {
      title: "3. Post-Spike (Auto-Recuperación)",
      desc: "Enfriamiento y retorno a parámetros normales",
      stats: post,
      badge: spikeAnalysis.isFullyRecovered ? "Recuperado" : "En Recuperación",
      badgeColor: spikeAnalysis.isFullyRecovered
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Layers size={18} className="text-sky-400" />
            Matriz Comparativa por Fases del Pico Súbito
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparación tri-fásica para evaluar el grado de impacto y la capacidad de auto-recuperación del sistema.
          </p>
        </div>

        {spikeAnalysis.recoveryTimeSec > 0 && (
          <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            T_recovery: {spikeAnalysis.recoveryTimeSec}s
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.map((ph, idx) => (
          <div
            key={idx}
            className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {ph.title}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${ph.badgeColor}`}>
                  {ph.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{ph.desc}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Latencia P95:</span>
                <span
                  className={`font-bold ${
                    ph.stats.p95Latency > 2000
                      ? "text-red-400"
                      : ph.stats.p95Latency > 800
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {ph.stats.p95Latency || 0} ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Latencia Promedio:</span>
                <span className="text-slate-300">{ph.stats.avgLatency || 0} ms</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Throughput:</span>
                <span className="text-sky-400 font-bold">{ph.stats.avgThroughput || 0} req/s</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tasa de Error:</span>
                <span
                  className={`font-bold ${
                    ph.stats.avgErrorRate > 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {ph.stats.avgErrorRate || 0}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpikePhaseComparisonTable;
