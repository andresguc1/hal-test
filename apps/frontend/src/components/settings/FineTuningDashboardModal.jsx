import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Cpu,
  Database,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Search,
  Activity,
  Terminal,
} from "lucide-react";
import { api } from "../../utils/api";

export function FineTuningDashboardModal({
  isOpen,
  onClose,
  activeModel,
  startWithTraining,
}) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  // Training State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStep, setTrainingStep] = useState("");
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingDone, setTrainingDone] = useState(false);

  const terminalEndRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit/logs");
      if (res.success) {
        setLogs(res.logs || []);
        if (res.logs?.length > 0 && !selectedLog) {
          setSelectedLog(res.logs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedLog]);

  useEffect(() => {
    const socket = window.__HAL_SOCKET__;
    if (!socket) return;

    const handleProgress = (data) => {
      setTrainingProgress(data.progress);
      setTrainingStep(data.step);
      setTrainingLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${data.log}`,
      ]);
      if (data.done) {
        setTrainingDone(true);
        setTrainingProgress(100);
      }
    };

    socket.on("fine_tuning_progress", handleProgress);
    return () => {
      socket.off("fine_tuning_progress", handleProgress);
    };
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [trainingLogs]);

  const handleClearLogs = async () => {
    if (!confirm(t("settings.ai.dashboard.confirm_clear"))) {
      return;
    }
    try {
      const res = await api.delete("/audit/logs");
      if (res.success) {
        setLogs([]);
        setSelectedLog(null);
      }
    } catch (err) {
      console.error("Failed to clear audit logs:", err);
    }
  };

  const handleStartTraining = useCallback(async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStep("start");
    setTrainingLogs([
      `[${new Date().toLocaleTimeString()}] ${t("settings.ai.dashboard.training_initial", { model: activeModel })}`,
    ]);
    setTrainingDone(false);

    try {
      await api.post("/audit/train");
    } catch (err) {
      setTrainingLogs((prev) => [
        ...prev,
        `[ERROR] Error al iniciar el entrenamiento: ${err.message}`,
      ]);
      setIsTraining(false);
    }
  }, [t, activeModel]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      if (startWithTraining) {
        handleStartTraining();
      }
    }
  }, [isOpen, startWithTraining, fetchLogs, handleStartTraining]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      (log.selector && log.selector.toLowerCase().includes(query)) ||
      (log.nodeId && log.nodeId.toLowerCase().includes(query))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-slate-800 text-white rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <Sparkles className="animate-pulse" size={20} />
              {t("settings.ai.dashboard.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t("settings.ai.dashboard.description", { model: activeModel })}
            </DialogDescription>
          </div>
        </DialogHeader>

        {isTraining ? (
          /* Training Progress Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 space-y-6">
            <div className="w-full max-w-2xl text-center space-y-2">
              <Cpu
                className={`mx-auto text-indigo-500 h-12 w-12 ${trainingDone ? "" : "animate-spin"}`}
              />
              <h3 className="text-lg font-bold text-white">
                {trainingDone
                  ? t("settings.ai.dashboard.training_completed")
                  : t("settings.ai.dashboard.training_title")}
              </h3>
              <p className="text-xs text-slate-400">
                {trainingDone
                  ? t("settings.ai.dashboard.training_completed_desc")
                  : t("settings.ai.dashboard.active_step", {
                      step: trainingStep.toUpperCase(),
                    })}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>{t("settings.ai.dashboard.general_progress")}</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${trainingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="w-full max-w-2xl bg-black border border-slate-800 rounded-xl p-4 flex flex-col h-60 font-mono text-xs text-emerald-400 space-y-1 overflow-hidden">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-900 text-slate-500 mb-2">
                <Terminal size={14} />
                <span>{t("settings.ai.dashboard.console_output")}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                {trainingLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={log.includes("ERROR") ? "text-red-400" : ""}
                  >
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {trainingDone && (
              <Button
                onClick={() => {
                  setIsTraining(false);
                  fetchLogs();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 px-6 font-semibold"
              >
                {t("settings.ai.dashboard.back_to_dashboard")}
              </Button>
            )}
          </div>
        ) : (
          /* Normal Dashboard Layout */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Metrics & Step list */}
            <div className="w-3/5 border-r border-slate-800/80 flex flex-col h-full bg-slate-950">
              {/* Metrics Grid */}
              <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-800/40 bg-slate-900/10">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    {t("settings.ai.dashboard.steps_registered")}
                  </div>
                  <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                    <Database size={16} className="text-indigo-400" />
                    {logs.length}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    {t("settings.ai.dashboard.key_actions")}
                  </div>
                  <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                    <Activity size={16} className="text-emerald-400" />
                    {new Set(logs.map((l) => l.action)).size}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    {t("settings.ai.dashboard.flow_sessions")}
                  </div>
                  <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-amber-400" />
                    {new Set(logs.map((l) => l.runId).filter(Boolean)).size ||
                      (logs.length > 0 ? 1 : 0)}
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="p-4 border-b border-slate-800/50 flex gap-2 items-center justify-between">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("settings.ai.dashboard.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    disabled={logs.length === 0}
                    className="text-xs border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 size={13} className="mr-1" />
                    {t("settings.ai.dashboard.clear_data")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStartTraining}
                    disabled={logs.length === 0}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500"
                  >
                    <Play size={13} className="mr-1 fill-white" />
                    {t("settings.ai.dashboard.start_training")}
                  </Button>
                </div>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    {t("settings.ai.dashboard.loading_dataset")}
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
                    <Database size={24} className="text-slate-600" />
                    <span className="text-xs font-semibold">
                      {t("settings.ai.dashboard.no_data")}
                    </span>
                    <p className="text-[10px] text-slate-600 max-w-[220px]">
                      {t("settings.ai.dashboard.no_data_desc")}
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isSelected =
                      selectedLog &&
                      selectedLog.timestamp === log.timestamp &&
                      selectedLog.nodeId === log.nodeId;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedLog(log)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-600/10 border-l-2 border-indigo-500"
                            : "hover:bg-slate-900/30"
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-800 text-indigo-300 border-none font-mono text-[9px] px-1.5 py-0.5">
                              {log.action}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-mono truncate">
                              {log.nodeId || "unknown-node"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-mono truncate">
                            {log.selector || "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-600">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Detail Inspector */}
            <div className="w-2/5 flex flex-col h-full bg-slate-950/80">
              {selectedLog ? (
                <div className="p-6 flex flex-col h-full overflow-hidden space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {t("settings.ai.dashboard.input_inspector")}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {t("settings.ai.dashboard.input_inspector_desc")}
                    </p>
                  </div>

                  {/* Inspector Fields */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Final Selector */}
                    {selectedLog.selector && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {t("settings.ai.dashboard.selector_used")}
                        </Label>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 font-mono text-xs text-indigo-300 select-all leading-relaxed break-all">
                          {selectedLog.selector}
                        </div>
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("settings.ai.dashboard.input_parameters")}
                      </Label>
                      <pre className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                        {JSON.stringify(selectedLog.input, null, 2)}
                      </pre>
                    </div>

                    {/* Assertion Outcome */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {t("settings.ai.dashboard.assertion_outcome")}
                      </Label>
                      <pre
                        className={`p-2.5 bg-slate-900/80 rounded-lg border font-mono text-[10px] overflow-x-auto ${
                          selectedLog.assertion_result?.success
                            ? "border-green-500/10 text-green-400"
                            : "border-red-500/10 text-red-400"
                        }`}
                      >
                        {JSON.stringify(selectedLog.assertion_result, null, 2)}
                      </pre>
                    </div>

                    {/* DOM Snapshot before action */}
                    {selectedLog.dom_state && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {t("settings.ai.dashboard.dom_snapshot")}
                        </Label>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 max-h-60 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                          {selectedLog.dom_state}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-slate-500 text-xs">
                  {t("settings.ai.dashboard.select_action_prompt")}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
