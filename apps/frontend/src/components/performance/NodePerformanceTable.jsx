import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Search,
  ArrowUpDown,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Zap,
} from "lucide-react";

/**
 * NodePerformanceTable — Comprehensive Per-Node Performance Metrics Table
 * Renders complete node-by-node telemetry metrics for every node in the configured test flow.
 */
export const NodePerformanceTable = ({
  nodeStats = [],
  flowNodes = [],
  totalDuration = 0,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("p95"); // p95 | avg | cpuAvg | memAvg | errors | count
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Merge nodeStats with flowNodes to evidence ALL configured nodes in the flow
  const mergedNodes = useMemo(() => {
    const statsMap = new Map();
    (nodeStats || []).forEach((n) => {
      if (n.nodeId) statsMap.set(String(n.nodeId), n);
    });

    if (flowNodes && flowNodes.length > 0) {
      return flowNodes.map((fn, idx) => {
        const id = String(fn.id || fn.nodeId || `node_${idx + 1}`);
        const label =
          fn.data?.label ||
          fn.data?.customLabel ||
          fn.type ||
          `Nodo #${idx + 1}`;
        const stats =
          statsMap.get(id) || statsMap.get(String(fn.nodeId)) || null;

        return {
          nodeId: id,
          label,
          type: fn.type || "action",
          subflowId: fn.parentId || null,
          avg: stats?.avg ?? 0,
          p95: stats?.p95 ?? 0,
          p99: stats?.p99 ?? stats?.p95 ?? 0,
          count: stats?.count ?? 0,
          cpuAvg: stats?.cpuAvg ?? 0,
          memAvg: stats?.memAvg ?? 0,
          memMax: stats?.memMax ?? 0,
          errors: stats?.errors ?? 0,
          errorRate: stats?.errorRate ?? "0.0",
          throughput: stats?.count
            ? parseFloat(
                (
                  stats.count / Math.max(1, (totalDuration || 30000) / 1000)
                ).toFixed(2),
              )
            : 0,
          status: stats
            ? stats.errors > 0
              ? "error"
              : stats.p95 > 2000
                ? "critical"
                : stats.p95 > 800
                  ? "warning"
                  : "success"
            : "pending",
        };
      });
    }

    // Fallback if flowNodes is empty
    return (nodeStats || []).map((n, idx) => ({
      nodeId: String(n.nodeId || `node_${idx + 1}`),
      label: n.label || n.nodeId || `Nodo #${idx + 1}`,
      type: n.type || "action",
      subflowId: n.subflowId || null,
      avg: n.avg ?? 0,
      p95: n.p95 ?? 0,
      p99: n.p99 ?? n.p95 ?? 0,
      count: n.count ?? 0,
      cpuAvg: n.cpuAvg ?? 0,
      memAvg: n.memAvg ?? 0,
      memMax: n.memMax ?? 0,
      errors: n.errors ?? 0,
      errorRate: n.errorRate ?? "0.0",
      throughput: n.count
        ? parseFloat(
            (n.count / Math.max(1, (totalDuration || 30000) / 1000)).toFixed(2),
          )
        : 0,
      status:
        n.errors > 0
          ? "error"
          : n.p95 > 2000
            ? "critical"
            : n.p95 > 800
              ? "warning"
              : "success",
    }));
  }, [nodeStats, flowNodes, totalDuration]);

  // Filter & Sort logic
  const filteredNodes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return mergedNodes
      .filter((n) => {
        if (!term) return true;
        return (
          n.label.toLowerCase().includes(term) ||
          n.nodeId.toLowerCase().includes(term) ||
          n.type.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [mergedNodes, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileText size={18} className="text-sky-400" />
            {t(
              "perf_results.node_performance_title",
              { count: filteredNodes.length },
              `Desglose de Rendimiento por Nodo del Flujo (${filteredNodes.length} Nodos)`,
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t(
              "perf_results.node_performance_desc",
              "Métricas de latencia, throughput, CPU, RAM y tasa de errores para cada nodo configurado.",
            )}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(
              "perf_results.search_nodes_placeholder",
              "Buscar por nodo o tipo...",
            )}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40 custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <th className="py-3 px-4">
                {t("perf_results.th_node_action", "Nodo / Acción")}
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("status")}
              >
                {t("perf_results.th_status", "Estado")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("count")}
              >
                {t("perf_results.th_samples", "Muestras")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("p95")}
              >
                {t("perf_results.th_p95", "Latencia P95")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("avg")}
              >
                {t("perf_results.th_avg", "Avg")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("cpuAvg")}
              >
                {t("perf_results.th_cpu_avg", "CPU Avg")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("memAvg")}
              >
                {t("perf_results.th_ram_avg", "RAM Avg")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort("errors")}
              >
                {t("perf_results.th_errors", "Errores %")}{" "}
                <ArrowUpDown size={10} className="inline ml-1" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredNodes.length > 0 ? (
              filteredNodes.map((n, idx) => {
                const isSelected = selectedNodeId === n.nodeId;
                return (
                  <React.Fragment key={n.nodeId}>
                    <tr
                      onClick={() =>
                        setSelectedNodeId(isSelected ? null : n.nodeId)
                      }
                      className={`hover:bg-slate-900/60 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-slate-900/80 border-l-2 border-l-sky-500"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-sans font-medium text-slate-200">
                        <div className="flex items-center gap-2.5 truncate max-w-xs">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">
                              {n.label}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase">
                              {n.type}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {n.status === "pending" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            Pendiente
                          </span>
                        ) : n.status === "error" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                            Error
                          </span>
                        ) : n.status === "critical" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                            Crítico
                          </span>
                        ) : n.status === "warning" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Lento
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Óptimo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-300">
                        {n.count > 0 ? n.count : "—"}
                      </td>

                      <td className="py-3 px-3 text-right font-bold">
                        {n.status === "pending" ? (
                          <span className="text-slate-600 italic">—</span>
                        ) : (
                          <span
                            className={
                              n.p95 > 2000
                                ? "text-red-400"
                                : n.p95 > 800
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }
                          >
                            {n.p95} ms
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400">
                        {n.status === "pending" ? "—" : `${n.avg} ms`}
                      </td>

                      <td className="py-3 px-3 text-right text-sky-400">
                        {n.status === "pending" ? "—" : `${n.cpuAvg}%`}
                      </td>

                      <td className="py-3 px-3 text-right text-fuchsia-400">
                        {n.status === "pending" ? "—" : `${n.memAvg} MB`}
                      </td>

                      <td className="py-3 px-3 text-right font-bold">
                        {n.status === "pending" ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span
                            className={
                              n.errors > 0 ? "text-red-400" : "text-emerald-400"
                            }
                          >
                            {n.errors} ({n.errorRate}%)
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Node Drawer Details */}
                    {isSelected && (
                      <tr className="bg-slate-900/40">
                        <td colSpan={8} className="p-4">
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">
                                ID de Nodo
                              </span>
                              <span className="text-slate-300">{n.nodeId}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">
                                P99 Latencia
                              </span>
                              <span className="text-amber-400 font-bold">
                                {n.p99} ms
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">
                                RAM Máxima
                              </span>
                              <span className="text-fuchsia-400 font-bold">
                                {n.memMax} MB
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase">
                                Throughput por Nodo
                              </span>
                              <span className="text-sky-400 font-bold">
                                {n.throughput} req/s
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-slate-500 italic"
                >
                  No se encontraron nodos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodePerformanceTable;
