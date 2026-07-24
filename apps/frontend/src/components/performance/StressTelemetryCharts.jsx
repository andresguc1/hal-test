import React from "react";
import { motion } from "framer-motion";
import { Activity, Zap, TrendingUp, Cpu } from "lucide-react";

/**
 * StressTelemetryCharts — X-Y Visualizer mapping Latency P95 & Throughput vs Active VUs
 */
export const StressTelemetryCharts = ({ timeline = [], metrics }) => {
  if (!timeline || timeline.length === 0) return null;

  // Process data points for X-Y plotting (X = VUs, Y = Latency / Throughput)
  const dataPoints = timeline.map((pt, i) => ({
    vus: pt.vus || pt.activeVUs || i + 1,
    latency: pt.latency || pt.latencyP95 || 0,
    throughput: pt.throughput || 0,
  }));

  const maxVUs = Math.max(...dataPoints.map((d) => d.vus), 1);
  const maxLatency = Math.max(...dataPoints.map((d) => d.latency), 100);
  const maxThroughput = Math.max(...dataPoints.map((d) => d.throughput), 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Latency P95 vs VUs */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-400" /> Latencia P95 vs Usuarios Concurrentes
          </h4>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
            Eje X = VUs
          </span>
        </div>

        <div className="h-44 w-full bg-slate-950/60 rounded-xl border border-slate-800/60 p-3 flex flex-col justify-between relative overflow-hidden">
          {/* Scatter / Line Visualization */}
          <div className="flex-1 flex items-end justify-between gap-1 pt-2">
            {dataPoints.map((pt, idx) => {
              const heightPct = Math.min(100, Math.max(5, (pt.latency / maxLatency) * 100));
              const isHigh = pt.latency > 2000;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isHigh ? "bg-red-500/80" : pt.latency > 800 ? "bg-amber-500/80" : "bg-emerald-500/80"
                    }`}
                  />
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-slate-200 text-[10px] p-1.5 rounded border border-slate-700 shadow-xl z-20 whitespace-nowrap">
                    <span className="font-bold">{pt.vus} VUs</span>
                    <span>{Math.round(pt.latency)}ms</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 font-mono">
            <span>1 VU</span>
            <span>Evolución de Latencia por Carga</span>
            <span>{maxVUs} VUs</span>
          </div>
        </div>
      </div>

      {/* Throughput (RPS) vs VUs */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-sky-400" /> Throughput (req/s) vs Usuarios Concurrentes
          </h4>
          <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 font-mono">
            Plateau de Saturación
          </span>
        </div>

        <div className="h-44 w-full bg-slate-950/60 rounded-xl border border-slate-800/60 p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex-1 flex items-end justify-between gap-1 pt-2">
            {dataPoints.map((pt, idx) => {
              const heightPct = Math.min(100, Math.max(5, (pt.throughput / maxThroughput) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    className="w-full bg-sky-500/80 rounded-t transition-all hover:bg-sky-400"
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-slate-200 text-[10px] p-1.5 rounded border border-slate-700 shadow-xl z-20 whitespace-nowrap">
                    <span className="font-bold">{pt.vus} VUs</span>
                    <span>{pt.throughput} req/s</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 font-mono">
            <span>1 VU</span>
            <span>Techo de Capacidad de Procesamiento</span>
            <span>{maxVUs} VUs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressTelemetryCharts;
