import React from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  CheckCircle2,
  Zap,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

/**
 * BreakingPointBadgeCard — High-impact Breaking Point & Resilience Indicator Component
 */
export const BreakingPointBadgeCard = ({ breakingPoint, _profile }) => {
  if (!breakingPoint) return null;

  const isBroken = breakingPoint.broken;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 shadow-xl transition-all ${
        isBroken
          ? "bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-red-500/40 shadow-red-950/20"
          : "bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side Badge Title */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              isBroken
                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isBroken ? <AlertOctagon size={26} /> : <ShieldCheck size={26} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                {isBroken
                  ? "PUNTO DE RUPTURA (BREAKING POINT) DETECTADO"
                  : "RESILIENCIA DEL SISTEMA OK"}
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  isBroken
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {isBroken ? "COLAPSO" : "ESTABLE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isBroken
                ? breakingPoint.reason ||
                  "El sistema alcanzó su límite de capacidad operativa."
                : breakingPoint.message ||
                  "La infraestructura soportó la sobrecarga sin quiebre de servicio."}
            </p>
          </div>
        </div>

        {/* Right Side KPIs */}
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
          <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isBroken ? "VUs en Ruptura" : "VUs Máximos"}
            </span>
            <span
              className={`text-lg font-mono font-black ${
                isBroken ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {isBroken ? breakingPoint.vus : breakingPoint.maxVUsReached || 1}{" "}
              VUs
            </span>
          </div>

          {isBroken && (
            <>
              <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1 justify-center">
                  <Clock size={10} className="text-indigo-400" /> Latencia P95
                </span>
                <span className="text-lg font-mono font-black text-amber-400">
                  {breakingPoint.latencyP95} ms
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1 justify-center">
                  <Zap size={10} className="text-sky-400" /> Throughput
                </span>
                <span className="text-lg font-mono font-black text-sky-400">
                  {breakingPoint.throughput} req/s
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BreakingPointBadgeCard;
