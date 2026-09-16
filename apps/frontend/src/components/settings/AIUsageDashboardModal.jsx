import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gauge,
  Activity,
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Database,
  TrendingUp,
  Cpu,
  BarChart3,
  SearchX,
} from "lucide-react";
import { api } from "../../utils/api";

const taskColors = {
  extraction: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  healing: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  generation: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  validation: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  reasoning: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  agentic: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  general: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const taskDefault = "bg-slate-500/20 text-slate-300 border-slate-500/30";

const taskColor = (type) => taskColors[type] || taskDefault;

function StatCard({ icon, label, value, sub, accent }) {
  const Icon = icon;
  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          {label}
        </span>
        <Icon size={15} className={accent} />
      </div>
      <div className="text-2xl font-bold text-white mt-1.5 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function AIUsageDashboardModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskFilter, setTaskFilter] = useState("all");
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.get("/ai/usage/summary"),
        api.get("/ai/usage?limit=100"),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (logsRes.success) setLogs(logsRes.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleClear = async () => {
    if (!window.confirm(t("settings.ai.usage_dashboard.clear_confirm"))) return;
    setClearing(true);
    try {
      const res = await api.delete("/ai/usage");
      if (res.success) {
        setLogs([]);
        setSummary(null);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to clear AI usage:", err);
    } finally {
      setClearing(false);
    }
  };

  const totalCalls = summary?.totalCalls || 0;
  const totalTokens = summary?.totalTokens || 0;
  const outputTokens = summary?.outputTokens || 0;
  const inputTokens = summary?.inputTokens || 0;
  const avgLatencyMs = summary?.avgLatencyMs || 0;
  const successRate =
    totalCalls > 0 ? Math.round((summary.successCount / totalCalls) * 100) : 0;

  const taskTypes = summary?.byTaskType || [];
  const models = summary?.byModel || [];
  const dailyTrend = summary?.dailyTrend || [];
  const maxDayTokens = Math.max(1, ...dailyTrend.map((d) => d.totalTokens));
  const maxTaskCount = Math.max(1, ...taskTypes.map((x) => x.count));

  const filteredLogs =
    taskFilter === "all" ? logs : logs.filter((l) => l.taskType === taskFilter);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-6xl h-[88vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-slate-800 text-white rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <Gauge size={20} />
              {t("settings.ai.usage_dashboard.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t("settings.ai.usage_dashboard.description")}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800/60"
            >
              <RefreshCw
                size={13}
                className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {t("settings.ai.usage_dashboard.refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={clearing || totalCalls === 0}
              className="text-xs border-red-500/20 text-red-400 hover:bg-red-950/20 hover:border-red-500/40"
            >
              <Trash2 size={13} className="mr-1.5" />
              {t("settings.ai.usage_dashboard.clear")}
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && !summary ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              {t("settings.ai.usage_dashboard.loading")}
            </div>
          ) : totalCalls === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-16">
              <BarChart3 size={28} className="text-slate-700" />
              <span className="text-sm font-semibold text-slate-400">
                {t("settings.ai.usage_dashboard.no_data")}
              </span>
              <p className="text-[10px] text-slate-600 max-w-[260px]">
                {t("settings.ai.usage_dashboard.no_data_desc")}
              </p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard
                  icon={Activity}
                  accent="text-indigo-400"
                  label={t("settings.ai.usage_dashboard.total_calls")}
                  value={totalCalls.toLocaleString()}
                  sub={`${inputTokens.toLocaleString()} in / ${outputTokens.toLocaleString()} out tok`}
                />
                <StatCard
                  icon={Zap}
                  accent="text-amber-400"
                  label={t("settings.ai.usage_dashboard.total_tokens")}
                  value={totalTokens.toLocaleString()}
                />
                <StatCard
                  icon={Timer}
                  accent="text-emerald-400"
                  label={t("settings.ai.usage_dashboard.avg_latency")}
                  value={`${avgLatencyMs.toLocaleString()} ms`}
                />
                <StatCard
                  icon={CheckCircle2}
                  accent="text-cyan-400"
                  label={t("settings.ai.usage_dashboard.success_rate")}
                  value={`${successRate}%`}
                />
              </div>

              {/* By Task Type */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={14} className="text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {t("settings.ai.usage_dashboard.by_task_type")}
                  </h4>
                </div>
                <div className="space-y-3">
                  {taskTypes.map((t) => (
                    <div key={t.taskType}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <Badge
                          className={`border font-mono px-1.5 py-0.5 text-[9px] ${taskColor(t.taskType)}`}
                        >
                          {t.taskType}
                        </Badge>
                        <span className="text-slate-400 tabular-nums">
                          {t.count} llamadas · {t.totalTokens.toLocaleString()}{" "}
                          tok · {t.avgLatencyMs ? `${t.avgLatencyMs} ms` : "—"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500"
                          style={{
                            width: `${Math.round((t.count / maxTaskCount) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Models */}
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={14} className="text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {t("settings.ai.usage_dashboard.by_model")}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {models.map((m) => (
                      <div
                        key={m.model}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="font-mono text-slate-300 truncate mr-2">
                          {m.model}
                        </span>
                        <span className="text-slate-500 tabular-nums whitespace-nowrap">
                          {m.count} · {m.totalTokens.toLocaleString()} tok
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Trend */}
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {t("settings.ai.usage_dashboard.daily_trend")}
                    </h4>
                  </div>
                  <div className="flex items-end gap-1 h-28">
                    {dailyTrend.length === 0 ? (
                      <div className="flex-1 h-full flex items-center justify-center text-[10px] text-slate-600">
                        {t("settings.ai.usage_dashboard.no_trend")}
                      </div>
                    ) : (
                      dailyTrend.map((d) => (
                        <div
                          key={d.day}
                          className="flex-1 flex flex-col items-center justify-end gap-1 group relative"
                          title={`${d.day}: ${d.count} calls · ${d.totalTokens.toLocaleString()} tok`}
                        >
                          <span className="text-[8px] text-slate-600 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.totalTokens.toLocaleString()}
                          </span>
                          <div
                            className="w-full max-w-[24px] bg-gradient-to-t from-indigo-600 to-amber-500 rounded-sm transition-all duration-500"
                            style={{
                              height: `${Math.max(
                                4,
                                Math.round(
                                  (d.totalTokens / maxDayTokens) * 100,
                                ),
                              )}%`,
                            }}
                          ></div>
                          <span className="text-[8px] text-slate-600 tabular-nums">
                            {d.day.slice(8)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Calls */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {t("settings.ai.usage_dashboard.recent_calls")}
                    </h4>
                  </div>
                  <Select value={taskFilter} onValueChange={setTaskFilter}>
                    <SelectTrigger className="w-44 h-8 bg-slate-950 border-slate-800 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800">
                      <SelectItem value="all">
                        {t("settings.ai.usage_dashboard.filter_all")}
                      </SelectItem>
                      {taskTypes.map((t) => (
                        <SelectItem key={t.taskType} value={t.taskType}>
                          {t.taskType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-600 space-y-2">
                    <SearchX size={20} />
                    <span className="text-[11px]">
                      {t("settings.ai.usage_dashboard.empty")}
                    </span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                          <th className="py-2 pr-3 font-semibold">
                            {t("settings.ai.usage_dashboard.col_time")}
                          </th>
                          <th className="py-2 pr-3 font-semibold">
                            {t("settings.ai.usage_dashboard.col_task")}
                          </th>
                          <th className="py-2 pr-3 font-semibold">
                            {t("settings.ai.usage_dashboard.col_model")}
                          </th>
                          <th className="py-2 pr-3 font-semibold text-right">
                            {t("settings.ai.usage_dashboard.col_tokens")}
                          </th>
                          <th className="py-2 pr-3 font-semibold text-right">
                            {t("settings.ai.usage_dashboard.col_latency")}
                          </th>
                          <th className="py-2 font-semibold text-right">
                            {t("settings.ai.usage_dashboard.col_status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="py-2 pr-3 text-slate-500 tabular-nums whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3">
                              <Badge
                                className={`border font-mono px-1.5 py-0.5 text-[9px] ${taskColor(log.taskType)}`}
                              >
                                {log.taskType || "?"}
                              </Badge>
                            </td>
                            <td className="py-2 pr-3 font-mono text-slate-300 truncate max-w-[180px]">
                              {log.model || "—"}
                            </td>
                            <td className="py-2 pr-3 text-right text-slate-400 tabular-nums whitespace-nowrap">
                              {(log.promptTokens || 0) +
                                (log.completionTokens || 0) >
                              0
                                ? `${log.promptTokens || 0}/${log.completionTokens || 0}`
                                : "—"}
                            </td>
                            <td className="py-2 pr-3 text-right text-slate-400 tabular-nums">
                              {log.latencyMs != null
                                ? `${log.latencyMs} ms`
                                : "—"}
                            </td>
                            <td className="py-2 text-right">
                              {log.success ? (
                                <CheckCircle2
                                  size={14}
                                  className="inline text-emerald-400"
                                />
                              ) : (
                                <XCircle
                                  size={14}
                                  className="inline text-red-400"
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AIUsageDashboardModal;
