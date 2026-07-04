import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Cpu,
  Activity,
  AlertTriangle,
  Gauge,
  Zap,
  Target,
  Server,
  Trash2,
  RotateCcw,
  BarChart2,
  Folder,
  FileText,
} from "lucide-react";

/**
 * PerfResultsView — Detailed post-execution report with node-level and SubFlow analysis.
 * Supports hierarchical inspection: Flow -> SubFlows -> Nodes.
 */
const PerfResultsView = ({ metrics, runConfig }) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set(["main-flow"]));
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [sortBy, setSortBy] = useState("p95"); // p95 | cpuAvg | memAvg | errors

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 italic">
        No hay resultados disponibles.
      </div>
    );
  }

  const nodeStats = [...(metrics.nodeStats || [])];

  // Group nodes by SubFlow (subflowId)
  const groups = {};
  nodeStats.forEach((node) => {
    const groupKey = node.subflowId || "main-flow";
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(node);
  });

  const totalDuration = nodeStats.reduce((acc, n) => acc + n.avg * n.count, 0);

  // Compute stats for each group (SubFlow)
  const groupSummaries = Object.entries(groups).map(
    ([groupKey, groupNodes]) => {
      const count = groupNodes.reduce((acc, n) => acc + n.count, 0);
      const totalNodeTime = groupNodes.reduce(
        (acc, n) => acc + n.avg * n.count,
        0,
      );
      const avg = count > 0 ? Math.round(totalNodeTime / count) : 0;
      const p95 = groupNodes.reduce((max, n) => Math.max(max, n.p95), 0);
      const errors = groupNodes.reduce(
        (acc, n) => acc + Number(n.errors || 0),
        0,
      );
      const cpuAvg =
        groupNodes.reduce((acc, n) => acc + n.cpuAvg, 0) /
        (groupNodes.length || 1);
      const memAvg =
        groupNodes.reduce((acc, n) => acc + n.memAvg, 0) /
        (groupNodes.length || 1);

      return {
        id: groupKey,
        label:
          groupKey === "main-flow"
            ? "Flujo Principal"
            : `SubFlow (${groupKey.split("-")[0]})`,
        nodes: groupNodes,
        count,
        avg,
        p95,
        errors,
        cpuAvg: Number(cpuAvg.toFixed(2)),
        memAvg: Number(memAvg.toFixed(2)),
        pctOfTotal:
          totalDuration > 0
            ? ((totalNodeTime / totalDuration) * 100).toFixed(1)
            : 0,
      };
    },
  );

  // Find the most expensive SubFlow (excluding the main flow if there are other subflows)
  const subflowSummaries = groupSummaries.filter((g) => g.id !== "main-flow");
  const mostExpensiveSubflow =
    subflowSummaries.length > 0
      ? [...subflowSummaries].sort((a, b) => b.p95 - a.p95)[0]
      : null;

  // Find worst performers overall
  const slowest =
    nodeStats.length > 0
      ? [...nodeStats].sort((a, b) => b.p95 - a.p95)[0]
      : null;
  const highestCpu =
    nodeStats.length > 0
      ? [...nodeStats].sort((a, b) => b.cpuAvg - a.cpuAvg)[0]
      : null;
  const highestMem =
    nodeStats.length > 0
      ? [...nodeStats].sort((a, b) => b.memAvg - a.memAvg)[0]
      : null;

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Global Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Requests"
          value={metrics.totalRequests || 0}
          icon={Zap}
        />
        <SummaryCard
          label="Throughput"
          value={`${metrics.throughput || 0} req/s`}
          icon={BarChart2}
        />
        <SummaryCard
          label="Latencia P95"
          value={`${metrics.latency?.p95 || 0}ms`}
          icon={Clock}
        />
        <SummaryCard
          label="Tasa de Error"
          value={`${metrics.errorRate || "0.00"}%`}
          icon={Target}
          color={
            (metrics.errorCount || 0) > 0 ? "text-red-400" : "text-emerald-400"
          }
        />
      </div>

      {/* Latency Distribution */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
        <h3 className="text-base font-medium text-slate-200 mb-4">
          Distribución de Latencia
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Min", val: metrics.latency?.min },
            { label: "Avg", val: metrics.latency?.avg },
            { label: "P50", val: metrics.latency?.median },
            { label: "P95", val: metrics.latency?.p95 },
            { label: "P99", val: metrics.latency?.p99 },
            { label: "Max", val: metrics.latency?.max },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-3 text-center"
            >
              <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                {item.label}
              </div>
              <div className="text-lg font-mono text-slate-200">
                {item.val || 0}
                <span className="text-xs text-slate-500 ml-0.5">ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottleneck Highlights */}
      {nodeStats.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <h3 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Análisis de Cuellos de Botella
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {slowest && (
              <BottleneckBadge
                label="Nodo más lento"
                node={slowest}
                metric={`${slowest.p95}ms P95`}
                color="red"
              />
            )}
            {mostExpensiveSubflow && (
              <BottleneckBadge
                label="SubFlow más costoso"
                node={{ label: mostExpensiveSubflow.label }}
                metric={`${mostExpensiveSubflow.p95}ms P95`}
                color="orange"
              />
            )}
            {highestCpu && (
              <BottleneckBadge
                label="Mayor consumo CPU"
                node={highestCpu}
                metric={`${highestCpu.cpuAvg}%`}
                color="amber"
              />
            )}
            {highestMem && (
              <BottleneckBadge
                label="Mayor consumo RAM"
                node={highestMem}
                metric={`${highestMem.memAvg} MB`}
                color="fuchsia"
              />
            )}
          </div>
        </div>
      )}

      {/* Hierarchical Flow & Subflow Inspector */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-medium text-slate-200 flex items-center gap-2">
            <Folder className="text-sky-400" size={18} /> Inspector Jerárquico
            de Flujos
          </h3>
          <div className="flex gap-1">
            {["p95", "cpuAvg", "memAvg", "errors"].map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-2 py-1 rounded text-[10px] uppercase font-semibold tracking-wider border transition-colors ${sortBy === key ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300"}`}
              >
                {key === "p95"
                  ? "Latencia"
                  : key === "cpuAvg"
                    ? "CPU"
                    : key === "memAvg"
                      ? "RAM"
                      : "Errores"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {groupSummaries.map((group) => {
            const groupExpanded = expandedGroups.has(group.id);

            // Sort nodes inside group
            const sortedNodes = [...group.nodes].sort((a, b) => {
              if (sortBy === "cpuAvg") return b.cpuAvg - a.cpuAvg;
              if (sortBy === "memAvg") return b.memAvg - a.memAvg;
              if (sortBy === "errors") return b.errors - a.errors;
              return b.p95 - a.p95;
            });

            return (
              <div
                key={group.id}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20"
              >
                {/* Group/SubFlow Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full bg-slate-900/50 hover:bg-slate-800/30 p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border-b border-slate-800/50"
                >
                  <div className="flex items-center gap-2.5">
                    {groupExpanded ? (
                      <ChevronDown size={16} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-500" />
                    )}
                    <Folder
                      className={
                        group.id === "main-flow"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }
                      size={18}
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-200">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        ({group.nodes.length} nodos)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 self-end sm:self-auto">
                    <span>CPU: {group.cpuAvg}%</span>
                    <span>RAM: {group.memAvg}MB</span>
                    <span>
                      P95:{" "}
                      <strong className="text-blue-400">{group.p95}ms</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${group.errors > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                    >
                      Errores: {group.errors}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {groupExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-2">
                        {sortedNodes.map((node, idx) => {
                          const nodeExpanded = expandedNodes.has(node.nodeId);
                          const nodePct =
                            totalDuration > 0
                              ? (
                                  ((node.avg * node.count) / totalDuration) *
                                  100
                                ).toFixed(1)
                              : 0;
                          const isCritical = node.p95 > 2000;
                          const isWarning = node.p95 > 800;

                          return (
                            <div key={node.nodeId} className="ml-4">
                              <button
                                onClick={() => toggleNode(node.nodeId)}
                                className="w-full bg-slate-950/40 hover:bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 p-3 rounded-lg transition-all flex items-center gap-3 text-left"
                              >
                                <FileText
                                  className="text-slate-500 shrink-0"
                                  size={14}
                                />
                                <span className="text-xs font-medium text-slate-300 truncate flex-1">
                                  {node.label}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                  {nodePct}% del total
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold shrink-0 ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}
                                >
                                  {node.p95}ms
                                </span>
                              </button>

                              <AnimatePresence>
                                {nodeExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="ml-6 mt-1 bg-slate-950/80 border border-slate-800/30 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Tipo
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.nodeId?.split("-")[0] || "—"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Ejecuciones
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.count}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Latencia Avg
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.avg}ms
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Latencia P95
                                        </span>
                                        <span className="text-slate-300 font-mono">
                                          {node.p95}ms
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          CPU Promedio
                                        </span>
                                        <span className="text-sky-400 font-mono">
                                          {node.cpuAvg}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          RAM Promedio
                                        </span>
                                        <span className="text-fuchsia-400 font-mono">
                                          {node.memAvg} MB
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          RAM Máxima
                                        </span>
                                        <span className="text-fuchsia-400 font-mono">
                                          {node.memMax} MB
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">
                                          Errores
                                        </span>
                                        <span
                                          className={`font-mono ${node.errors > 0 ? "text-red-400" : "text-emerald-400"}`}
                                        >
                                          {node.errors} ({node.errorRate}%)
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
    <Icon size={20} className="text-slate-500 shrink-0" />
    <div>
      <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
        {label}
      </div>
      <div className={`text-lg font-mono ${color || "text-slate-200"}`}>
        {value}
      </div>
    </div>
  </div>
);

const BottleneckBadge = ({ label, node, metric, color }) => {
  const colorClasses = {
    red: "bg-red-500/5 border-red-500/20 text-red-400",
    orange: "bg-orange-500/5 border-orange-500/20 text-orange-400",
    amber: "bg-amber-500/5 border-amber-500/20 text-amber-400",
    fuchsia: "bg-fuchsia-500/5 border-fuchsia-500/20 text-fuchsia-400",
  };

  return (
    <div
      className={`border rounded-xl p-3 ${colorClasses[color] || "bg-slate-800/50 border-slate-700"}`}
    >
      <div className="text-[10px] uppercase font-semibold tracking-wider mb-1 opacity-80">
        {label}
      </div>
      <div className="text-sm text-slate-200 font-medium truncate">
        {node.label}
      </div>
      <div className="text-lg font-mono font-bold">{metric}</div>
    </div>
  );
};

export default PerfResultsView;
