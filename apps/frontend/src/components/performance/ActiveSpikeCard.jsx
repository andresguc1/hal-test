import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Clock,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Activity,
} from "lucide-react";

/**
 * ActiveSpikeCard — Live Spike Status Badge & Recovery Indicator
 * Renders real-time status during Spike testing (Baseline, Active Peak, Auto-Recovery).
 */
export const ActiveSpikeCard = ({ spikeAnalysis, rawProfileKey }) => {
  const { t } = useTranslation();
  if (
    !spikeAnalysis &&
    !["spike", "spikes"].includes(String(rawProfileKey || "").toLowerCase())
  ) {
    return null;
  }

  const analysis = spikeAnalysis || {};
  const isRecovered = analysis.isFullyRecovered;
  const recTime = analysis.recoveryTimeSec || 0;
  const score = analysis.resilienceScore ?? 100;
  const peakStats = analysis.peak || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 shadow-xl transition-all ${
        score >= 80
          ? "bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20"
          : score >= 50
            ? "bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/40 shadow-amber-950/20"
            : "bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-red-500/40 shadow-red-950/20"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Badge Header */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              score >= 80
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : score >= 50
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                  : "bg-red-500/20 text-red-400 border-red-500/30 animate-ping"
            }`}
          >
            {score >= 80 ? (
              <ShieldCheck size={26} />
            ) : (
              <AlertOctagon size={26} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                {t(
                  "perf_results.spike_test_title",
                  "PRUEBA DE PICO SÚBITO (SPIKE TEST)",
                )}
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  score >= 80
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : score >= 50
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-red-500/20 text-red-300 border-red-500/40"
                }`}
              >
                {analysis.verdict ||
                  t("performance_dashboard.pending", "EN PROCESO")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isRecovered
                ? `El sistema se auto-recuperó satisfactoriamente en ${recTime}s tras el impacto.`
                : recTime > 0
                  ? `Monitoreando tiempo de estabilización post-pico... (${recTime}s transcurridos)`
                  : "Evaluando tolerancia y tiempo de auto-recuperación ante sobrecarga súbita."}
            </p>
          </div>
        </div>

        {/* Right Side Key KPIs */}
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <RefreshCw size={10} className="text-emerald-400" />{" "}
              {t("perf_results.recovery_time", "Tiempo Recuperación")}
            </span>
            <span className="text-lg font-black text-emerald-400">
              {recTime > 0 ? `${recTime}s` : "—"}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Zap size={10} className="text-sky-400" />{" "}
              {t("perf_results.peak_latency", "Latencia en Pico")}
            </span>
            <span className="text-lg font-black text-amber-400">
              {peakStats.p95Latency ? `${peakStats.p95Latency}ms` : "—"}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Activity size={10} className="text-indigo-400" />{" "}
              {t("perf_results.resilience_index", "Índice Resiliencia")}
            </span>
            <span
              className={`text-lg font-black ${
                score >= 80
                  ? "text-emerald-400"
                  : score >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {score}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSpikeCard;
