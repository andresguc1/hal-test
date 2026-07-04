import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Settings,
  BarChart2,
  Clock,
  AlertTriangle,
  Zap,
  Server,
  ChevronRight,
  Play,
} from "lucide-react";
import ScenarioBuilder from "./ScenarioBuilder";
import { useProjectManager } from "./hooks/useProjectManager";
import { useToast } from "../hooks/useToast";
import { api } from "../utils/api";

// Subcomponents
import { usePerformanceSocket } from "./performance/usePerformanceSocket";
import PerfLiveView from "./performance/PerfLiveView";
import PerfResultsView from "./performance/PerfResultsView";
import PerfHistoryView from "./performance/PerfHistoryView";

/**
 * PerformanceDashboard — Evolved Load Testing Control Center
 */
const PerformanceDashboard = () => {
  const { projects, currentProject, currentFlowId, loadProject } =
    useProjectManager();
  const toast = useToast();

  // Auto-load first project if none is active
  useEffect(() => {
    if (!currentProject && projects?.length > 0) {
      loadProject(projects[0].id);
    }
  }, [currentProject, projects, loadProject]);

  const [selectedFlowId, setSelectedFlowId] = useState(currentFlowId);

  useEffect(() => {
    if (currentFlowId && !selectedFlowId) {
      setSelectedFlowId(currentFlowId);
    }
  }, [currentFlowId, selectedFlowId]);

  const flowId = selectedFlowId;
  const flowName =
    currentProject?.flows?.find((f) => f.id === flowId)?.name ||
    "Ningún Flujo Seleccionado";
  const flows = currentProject?.flows || [];

  // Telemetry and state hooks
  const {
    status,
    setStatus,
    runConfig,
    metrics,
    vuStatus,
    resourceWarning,
    timeline,
    progressPercent,
    resetRun,
  } = usePerformanceSocket(flowId);

  // Tab control: 'config' | 'live' | 'results' | 'history'
  const [activeTab, setActiveTab] = useState("config");

  // Sync tab with execution state changes
  useEffect(() => {
    if (status === "running") {
      setActiveTab("live");
    } else if (status === "completed") {
      setActiveTab("results");
    }
  }, [status]);

  const handleStartTest = async (config) => {
    if (!flowId) {
      toast.info("Selecciona un flujo antes de iniciar la prueba de carga.");
      return;
    }

    const toastId = toast.loading("Inicializando motor de performance...");

    try {
      const result = await api.post("/runs/performance", {
        flowId: flowId,
        projectId: currentProject?.id,
        performanceConfig: {
          virtualUsers: config.vus,
          duration: config.duration,
          profile: config.profile,
          rampUp: config.rampUp,
          stages: config.stages,
          headless: true,
        },
      });

      if (result.success) {
        toast.dismiss(toastId);
        toast.success("Prueba de carga lanzada con éxito!");
        setStatus("preparing");
        setActiveTab("live");
      } else {
        toast.dismiss(toastId);
        toast.error(result.message || "Error al lanzar la prueba");
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error("[PerformanceDashboard] Performance run failed:", error);
      toast.error("Error del motor: " + error.message);
    }
  };

  const handleReRun = (config) => {
    // Auto-switch to config and execute test config
    setActiveTab("config");
    handleStartTest(config);
  };

  return (
    <div className="flex-1 flex flex-col font-sans text-slate-300 bg-slate-950/20 overflow-hidden">
      {/* Header / Navigation Tabs */}
      <div className="flex-none border-b border-slate-800 bg-slate-900/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
            <Activity className="text-blue-400" size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Pruebas de Performance
            </div>
            <div className="text-slate-200 font-medium text-base truncate max-w-xs">
              {flowName}
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <TabButton
            id="config"
            active={activeTab === "config"}
            onClick={() => setActiveTab("config")}
            label="Configuración"
            icon={Settings}
          />
          <TabButton
            id="live"
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            label="En Vivo"
            icon={Play}
            disabled={status === "waiting" || status === "connecting"}
          />
          <TabButton
            id="results"
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            label="Resultados"
            icon={BarChart2}
            disabled={!metrics && status !== "completed"}
          />
          <TabButton
            id="history"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            label="Historial"
            icon={Clock}
          />
        </div>

        {/* Quick Status Info */}
        <div className="flex items-center space-x-3">
          {status === "running" && runConfig && (
            <div className="text-xs text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 animate-pulse">
              Ejecutando: {runConfig.totalVUs} VUs
            </div>
          )}
          {status === "completed" && (
            <button
              onClick={resetRun}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              Nueva Prueba
            </button>
          )}
        </div>
      </div>

      {/* Run Progress Bar */}
      {status === "running" && progressPercent > 0 && (
        <div className="h-1 w-full bg-slate-900 overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeTab === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-auto p-6 flex justify-center"
            >
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Flow Selector and Scenario builder */}
                <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-slate-200">
                      Parámetros del Escenario
                    </h2>
                    {flows.length > 0 && (
                      <select
                        value={selectedFlowId || ""}
                        onChange={(e) => setSelectedFlowId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-1.5 focus:outline-none focus:border-blue-500/50"
                      >
                        {flows.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <ScenarioBuilder
                    onRun={handleStartTest}
                    flowName={flowName}
                  />
                </div>

                {/* Flow Outline / Information */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    Información del Flujo
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <p>
                      Selecciona un flujo de la lista para configurar la prueba
                      de carga. El perfil constante es ideal para pruebas
                      básicas, mientras que los perfiles stress y spike son
                      recomendados para pruebas avanzadas de límites y
                      capacidad.
                    </p>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 space-y-2">
                      <div className="flex justify-between">
                        <span>Total Nodos:</span>
                        <span className="font-semibold text-slate-200">
                          {currentProject?.flows?.find((f) => f.id === flowId)
                            ?.nodes?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última Ejecución:</span>
                        <span className="font-semibold text-slate-200">
                          Hace unos momentos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PerfLiveView
                metrics={metrics}
                vuStatus={vuStatus}
                runConfig={runConfig}
                resourceWarning={resourceWarning}
                timeline={timeline}
                status={status}
                progressPercent={progressPercent}
              />
            </motion.div>
          )}

          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PerfResultsView metrics={metrics} runConfig={runConfig} />
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PerfHistoryView flowId={flowId} onReRun={handleReRun} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${disabled ? "opacity-30 cursor-not-allowed text-slate-600" : active ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
);

export default PerformanceDashboard;
