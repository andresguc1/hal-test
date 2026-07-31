import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { api } from "../../utils/api";

export default function SecurityHistoryView({ flowId, onSelectRun }) {
  const { t } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/runs?limit=50");
      const runsList = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(runsList)) {
        // Filter runs for security mode or current flow
        const securityRuns = runsList.filter(
          (r) =>
            r.trigger === "seguridad" ||
            r.trigger === "security" ||
            (flowId && r.flow_id === flowId),
        );
        setRuns(securityRuns);
      }
    } catch (err) {
      console.error("[SecurityHistoryView] Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [flowId]);

  useEffect(() => {
    fetchHistory();
  }, [flowId, fetchHistory]);

  const filteredRuns = runs.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id?.toLowerCase().includes(q) ||
      r.flow_name?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Clock className="text-red-400" size={20} />
            <span>
              {t(
                "security_history.title",
                "Historial de Auditorías de Seguridad",
              )}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t(
              "security_history.subtitle",
              "Registro cronológico de evaluaciones de vulnerabilidades y escaneos DAST.",
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder={t(
                "security_history.search_placeholder",
                "Buscar por ID o Flujo...",
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500/50 w-64"
            />
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            title={t("security_history.reload_title", "Recargar historial")}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
            <RefreshCw size={24} className="animate-spin text-red-400" />
            <span>
              {t(
                "security_history.loading",
                "Cargando ejecuciones anteriores...",
              )}
            </span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <ShieldAlert size={32} className="mx-auto text-slate-600" />
            <p>
              {t(
                "security_history.empty",
                "No se encontraron auditorías registradas en este período.",
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">
                    {t("security_history.col_run_id", "ID de Ejecución")}
                  </th>
                  <th className="py-3 px-4">
                    {t("security_history.col_flow", "Flujo")}
                  </th>
                  <th className="py-3 px-4">
                    {t("security_history.col_mode", "Tipo de Prueba")}
                  </th>
                  <th className="py-3 px-4">
                    {t("security_history.col_score", "Score & Riesgo")}
                  </th>
                  <th className="py-3 px-4">
                    {t("security_history.col_date", "Fecha")}
                  </th>
                  <th className="py-3 px-4">
                    {t("security_history.col_status", "Estado")}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {t("security_history.col_action", "Acción")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectRun && onSelectRun(run.id)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300 flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      <span>{run.id?.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {run.flow_name || run.flow_id || "Flujo de Pruebas"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${
                        run.trigger === "seguridad" || run.trigger === "security"
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : run.trigger === "performance"
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                          : run.trigger === "batch"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                          : "bg-slate-500/10 border-slate-500/20 text-slate-300"
                      }`}>
                        {run.trigger === "seguridad" || run.trigger === "security"
                          ? "Security DAST"
                          : run.trigger === "performance"
                          ? "Performance"
                          : run.trigger === "batch"
                          ? "Batch Run"
                          : "Manual Flow"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {run.security_compliance ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            run.security_compliance.compliance_score >= 90
                              ? "bg-emerald-500/25 border border-emerald-500/30 text-emerald-400"
                              : run.security_compliance.compliance_score >= 70
                              ? "bg-amber-500/25 border border-amber-500/30 text-amber-400"
                              : "bg-red-500/25 border border-red-500/30 text-red-400"
                          }`}>
                            {Math.round(run.security_compliance.compliance_score)}%
                          </span>
                          <span className={`px-1.5 py-0.25 text-[9px] font-bold font-mono rounded ${
                            run.security_compliance.risk_level === "HIGH" || run.security_compliance.risk_level === "CRITICAL"
                              ? "bg-red-950/60 text-red-400 border border-red-800/40"
                              : run.security_compliance.risk_level === "MEDIUM"
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                              : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          }`}>
                            {run.security_compliance.risk_level}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(
                        run.created_at || run.start_time || Date.now(),
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          run.status === "completed" || run.status === "success"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRun) onSelectRun(run.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title={t("security_history.view_report", "Ver informe")}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
