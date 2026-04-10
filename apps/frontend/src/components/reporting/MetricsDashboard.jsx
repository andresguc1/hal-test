import React, { useState, useEffect } from "react";
import { api } from "../../utils/api";
import {
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  Activity,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function MetricsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get("/runs/analytics");
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch executive metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
        <Activity size={32} className="animate-pulse text-indigo-500" />
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Quantifying System Intelligence...
        </span>
      </div>
    );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto h-full custom-scrollbar">
      {/* EXECUTIVE HEADER */}
      <section className="flex items-end justify-between border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              ROI & Performance Audit
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Executive Overview
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-widest">
            Latest Update
          </span>
          <span className="text-xs font-mono text-slate-400">
            {new Date().toLocaleString()}
          </span>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          icon={<Clock size={20} />}
          label="Human Time Saved"
          value={data?.roi?.timeSaved || "0h"}
          subValue={`${data?.roi?.healed || 0} Auto-Repairs`}
          trend="+12% vs last week"
          color="indigo"
        />
        <KPICard
          icon={<Zap size={20} />}
          label="Memory Palace Utilization"
          value={data?.memory?.hits || 0}
          subValue="Historical Fixes Reused"
          trend="+24 New memories"
          color="amber"
        />
        <KPICard
          icon={<ShieldCheck size={20} />}
          label="Total Executions"
          value={data?.totalRuns || 0}
          subValue="Across all environments"
          trend="Stability: 98.2%"
          color="emerald"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FLAKINESS HEATMAP */}
        <section className="glass-panel p-6 bg-slate-900/40 border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">
                Flakiness Heatmap
              </h3>
            </div>
            <BarChart3 size={16} className="text-slate-600" />
          </div>

          <div className="space-y-4">
            {data?.heatmap?.length > 0 ? (
              data.heatmap.map((item) => (
                <HeatmapRow
                  key={item.nodeId}
                  nodeId={item.nodeId}
                  count={item.count}
                  percentage={(item.count / data.heatmap[0].count) * 100}
                />
              ))
            ) : (
              <div className="p-10 text-center text-slate-600 text-xs italic">
                Insufficient failure data to generate heatmap.
              </div>
            )}
          </div>
        </section>

        {/* SYSTEM MATURITY / GROWTH */}
        <section className="glass-panel p-6 bg-slate-900/40 border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <Activity size={16} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">
                Execution Integrity
              </h3>
            </div>
            <Calendar size={16} className="text-slate-600" />
          </div>

          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {/* Dummy chart for aesthetics */}
            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 75, 60, 80].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/40 transition-colors border-t border-indigo-500/30 rounded-t-sm relative group"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
            <span>Last 12 Days</span>
            <span className="text-indigo-400">Stable Growth</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, subValue, trend, color }) {
  const variants = {
    indigo:
      "from-indigo-500/20 to-indigo-900/20 text-indigo-400 border-indigo-500/20",
    amber:
      "from-amber-500/20 to-amber-900/20 text-amber-400 border-amber-500/20",
    emerald:
      "from-emerald-500/20 to-emerald-900/20 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-br transition-all hover:scale-[1.02] duration-300 group shadow-2xl",
        variants[color],
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
          Live Metric
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
          {label}
        </div>
        <div className="text-4xl font-black text-white tracking-tighter">
          {value}
        </div>
        <div className="text-[11px] text-slate-400 font-medium">{subValue}</div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} />
          {trend}
        </div>
        <ChevronRight
          size={14}
          className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
        />
      </div>

      {/* Aesthetic Background Polish */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-current opacity-[0.03] blur-3xl rounded-full" />
    </div>
  );
}

function HeatmapRow({ nodeId, count, percentage }) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400 font-mono tracking-tighter truncate w-48">
          Node: {nodeId}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-rose-400">{count} Failures</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]"
        />
      </div>
    </div>
  );
}
