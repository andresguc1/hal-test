import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertOctagon, Activity, Clock, Cpu, TrendingUp } from "lucide-react";

/**
 * EnduranceStatusCard — Live Soak/Endurance Diagnostic & Memory Leak Widget
 */
export const EnduranceStatusCard = ({ soakAnalysis, rawProfileKey }) => {
  if (!soakAnalysis && !["soak", "endurance"].includes(String(rawProfileKey || "").toLowerCase())) {
    return null;
  }

  const leakReport = soakAnalysis?.leakReport || {};
  const score = leakReport.stabilityScore ?? 100;
  const isLeak = leakReport.isMemoryLeakDetected;
  const isDrift = leakReport.isLatencyDriftDetected;
  const memSlope = leakReport.memSlopeMbPerHour ?? 0;
  const latSlope = leakReport.latSlopeMsPerHour ?? 0;
  const hours = leakReport.durationHours ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 shadow-xl transition-all ${
        score >= 85
          ? "bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20"
          : score >= 60
          ? "bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/40 shadow-amber-950/20"
          : "bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-red-500/40 shadow-red-950/20"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Header Badge */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              score >= 85
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : score >= 60
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                : "bg-red-500/20 text-red-400 border-red-500/30 animate-ping"
            }`}
          >
            {score >= 85 ? <ShieldCheck size={26} /> : <AlertOctagon size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                PRUEBA DE RESISTENCIA Y LARGA DURACIÓN (SOAK TEST)
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  score >= 85
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : score >= 60
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-red-500/20 text-red-300 border-red-500/40"
                }`}
              >
                {leakReport.verdict || "ESTABILIDAD EN EVALUACIÓN"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isLeak
                ? `ALERTA: Se detectó un incremento de RAM a razón de +${memSlope} MB/hora. Posible Memory Leak.`
                : isDrift
                ? `ADVERTENCIA: La latencia P95 aumenta a razón de +${latSlope} ms/hora.`
                : `Monitoreo continuo de estabilidad durante ${hours}h de carga constante.`}
            </p>
          </div>
        </div>

        {/* Right Indicators */}
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Tendencia RAM
            </span>
            <span
              className={`text-lg font-black ${
                memSlope > 15 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {memSlope > 0 ? `+${memSlope}` : memSlope} MB/h
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Desviación Latencia
            </span>
            <span
              className={`text-lg font-black ${
                latSlope > 100 ? "text-amber-400" : "text-sky-400"
              }`}
            >
              {latSlope > 0 ? `+${latSlope}` : latSlope} ms/h
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Índice Estabilidad
            </span>
            <span
              className={`text-lg font-black ${
                score >= 85 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"
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

export default EnduranceStatusCard;
