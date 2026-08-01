import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Activity, Cpu, Layers } from "lucide-react";

/**
 * SoakTrendCharts — Hourly Bucket Matrix Table & Endurance Trend Charts
 */
export const SoakTrendCharts = ({ soakAnalysis }) => {
  const { t } = useTranslation();
  if (!soakAnalysis) return null;

  const buckets = soakAnalysis.hourlyBuckets || [];

  return (
    <div className="space-y-5">
      {/* Hourly Bucket Matrix Table */}
      {buckets.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Clock size={18} className="text-purple-400" />
                {t("performance.soak.matrix_title", "Hourly Decomposition Matrix (Evolution H1 ... Hn)")}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("performance.soak.matrix_subtitle", "Hourly blocks tracking to identify specific moment of degradation.")}
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-purple-500/10 text-purple-400 px-3 py-1 rounded-xl border border-purple-500/20">
              {buckets.length} {t("performance.soak.hour_intervals_val", "Hour Intervals")}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40 custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">{t("performance.soak.interval", "Interval")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.soak.samples", "Samples")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.headers.p95_latency", "P95 Latency")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.headers.throughput", "Throughput")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.soak.errors_percent", "Errors %")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.soak.ram_avg", "RAM Avg")}</th>
                  <th className="py-3 px-3 text-right">{t("performance.soak.cpu_avg", "CPU Avg")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {buckets.map((b) => (
                  <tr
                    key={b.key}
                    className="hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-sans font-bold text-slate-200">
                      {b.hourLabel}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {b.samplesCount}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span
                        className={
                          b.p95Latency > 1500
                            ? "text-red-400"
                            : b.p95Latency > 600
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }
                      >
                        {b.p95Latency} ms
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-sky-400">
                      {b.avgThroughput} req/s
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span
                        className={
                          b.avgErrorRate > 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }
                      >
                        {b.avgErrorRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-fuchsia-400">
                      {b.avgMem} MB
                    </td>
                    <td className="py-3 px-3 text-right text-sky-400">
                      {b.avgCpu}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoakTrendCharts;
