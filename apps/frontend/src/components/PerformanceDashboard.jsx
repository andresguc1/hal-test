import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useExecutionStore } from "../stores/useExecutionStore";

/**
 * PerformanceDashboard — Evolved Load Testing Control Center
 */
const PerformanceDashboard = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const lastPerfReport = useExecutionStore((s) => s.lastPerfReport);
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

  const flowId = selectedFlowId || currentProject?.flows?.[0]?.id;
  const flowName =
    currentProject?.flows?.find((f) => f.id === flowId)?.name ||
    t("performance_dashboard.no_flow_selected", "No Flow Selected");
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
    cancelTest,
  } = usePerformanceSocket(flowId);

  // Tab control: 'config' | 'live' | 'results' | 'history'
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || (status === "running" ? "live" : "config"),
  );

  // Sync tab with execution state changes
  useEffect(() => {
    if (status === "running" || status === "preparing") {
      setActiveTab("live");
    } else if (status === "completed") {
      setActiveTab("results");
    }
  }, [status]);

  // Sync tab with navigation state (e.g., from profiling flow redirect)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab, location.state]);

  const handleStartTest = async (config) => {
    if (!flowId) {
      toast.info(
        t(
          "performance_dashboard.toast_select_flow",
          "Select a flow before launching the load test.",
        ),
      );
      return;
    }

    const toastId = toast.loading(
      t(
        "performance_dashboard.toast_initializing",
        "Initializing performance engine...",
      ),
    );

    const activeFlowObj = currentProject?.flows?.find((f) => f.id === flowId);

    try {
      const result = await api.post("/runs/performance", {
        flowId: flowId,
        projectId: currentProject?.id,
        nodes: activeFlowObj?.nodes || [],
        edges: activeFlowObj?.edges || [],
        performanceConfig: {
          virtualUsers: config.vus,
          duration: config.duration,
          profile: config.profile,
          rampUp: config.rampUp,
          stages: config.stages,
          stopAtErrorRate: config.stopAtErrorRate,
          spikeBaseVUs: config.spikeBaseVUs,
          headless: true,
        },
      });

      if (result.success) {
        toast.dismiss(toastId);
        toast.success(
          t(
            "performance_dashboard.toast_launched_success",
            "Load test launched successfully!",
          ),
        );
        setStatus("preparing");
        setActiveTab("live");
      } else {
        toast.dismiss(toastId);
        toast.error(
          result.message ||
            t(
              "performance_dashboard.toast_launch_error",
              "Failed to launch test",
            ),
        );
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error("[PerformanceDashboard] Performance run failed:", error);
      toast.error(
        t("performance_dashboard.toast_engine_error_msg", "Engine error: {{message}}", {
          message: error.message,
        }),
      );
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
              {t("performance_dashboard.sub_title", "Performance Testing")}
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
            label={t("performance_dashboard.tab_config", "Configuration")}
            icon={Settings}
          />
          <TabButton
            id="live"
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            label={t("performance_dashboard.tab_live", "Live View")}
            icon={Play}
            disabled={status === "waiting" || status === "connecting"}
          />
          <TabButton
            id="results"
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            label={t("performance_dashboard.tab_results", "Results")}
            icon={BarChart2}
            disabled={!metrics && !lastPerfReport && status !== "completed"}
          />
          <TabButton
            id="history"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            label={t("performance_dashboard.tab_history", "History")}
            icon={Clock}
          />
        </div>

        {/* Quick Status Info */}
        <div className="flex items-center space-x-3">
          {(status === "running" || status === "preparing") && (
            <>
              <div className="text-xs text-blue-400 font-mono bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 animate-pulse">
                {status === "preparing"
                  ? t(
                      "performance_dashboard.initializing_engines",
                      "Initializing engines...",
                    )
                  : t(
                      "performance_dashboard.running_vus",
                      "Running: {{count}} VUs",
                      {
                        count:
                          runConfig?.totalVUs || runConfig?.virtualUsers || 1,
                      },
                    )}
              </div>
              <button
                onClick={async () => {
                  try {
                    await cancelTest();
                    toast.success(
                      t(
                        "performance_dashboard.toast_cancel_success",
                        "Cancellation requested successfully.",
                      ),
                    );
                  } catch (err) {
                    toast.error(
                      t(
                        "performance_dashboard.toast_cancel_error",
                        "Error canceling test: ",
                      ) + err.message,
                    );
                  }
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {t("performance_dashboard.stop", "Stop")}
              </button>
            </>
          )}
          {status === "completed" && (
            <button
              onClick={resetRun}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              {t("performance_dashboard.new_test", "New Test")}
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
                      {t(
                        "performance_dashboard.scenario_parameters",
                        "Scenario Parameters",
                      )}
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
                    initialConfig={runConfig || location.state?.perfConfig}
                  />
                </div>

                {/* Flow Outline / Information */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    {t("performance_dashboard.flow_info", "Flow Information")}
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <p>
                      {t(
                        "performance_dashboard.flow_info_desc",
                        "Select a flow from the list to configure the load test. The constant profile is ideal for basic tests, while stress and spike profiles are recommended for advanced limit and capacity testing.",
                      )}
                    </p>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 space-y-2">
                      <div className="flex justify-between">
                        <span>
                          {t(
                            "performance_dashboard.total_nodes",
                            "Total Nodes:",
                          )}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {currentProject?.flows?.find(
                            (f) => f.id === (selectedFlowId || flowId),
                          )?.nodes?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {t(
                            "performance_dashboard.last_execution",
                            "Last Execution:",
                          )}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {t(
                            "performance_dashboard.moments_ago",
                            "A few moments ago",
                          )}
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
                onCancelTest={cancelTest}
                flowNodes={
                  currentProject?.flows?.find((f) => f.id === flowId)?.nodes ||
                  []
                }
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
              <PerfResultsView
                metrics={metrics || useExecutionStore.getState().lastPerfReport}
                runConfig={runConfig}
                flowNodes={
                  currentProject?.flows?.find((f) => f.id === flowId)?.nodes ||
                  []
                }
              />
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

const TabButton = ({ active, onClick, label, icon: _icon, disabled }) => {
  const IconComponent = _icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${disabled ? "opacity-30 cursor-not-allowed text-slate-600" : active ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
    >
      <IconComponent size={14} />
      <span>{label}</span>
    </button>
  );
};

export default PerformanceDashboard;
