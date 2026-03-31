import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  FileCode,
  FileJson,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Code2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion as Motion, AnimatePresence } from "motion/react";
import { api } from "../utils/api";

/**
 * ExportDialog Component
 *
 * Provides a comprehensive UI for exporting flows
 */
const ExportDialog = ({ isOpen, onClose, nodes, edges }) => {
  const { t } = useTranslation();
  const [exportMode, setExportMode] = useState("json"); // 'json', 'code'
  const [framework, setFramework] = useState("playwright");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setGeneratedCode(null);
    setExportMode("json");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Convert nodes to flow actions for backend
  const convertNodesToFlow = useCallback(() => {
    // Basic serialization for now - same as logic in execution
    // Basic serialization for now - same as logic in execution
    const result = [];

    // Naive topological sort for demo - assuming linear or simple tree for now
    // In a real app, use true topological sort from react-flow structure
    nodes.forEach((node) => {
      result.push({
        action: node.data.type,
        ...node.data.configuration,
      });
    });

    return result;
  }, [nodes]);

  // Handle JSON export (Client-Side)
  const handleJsonExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({ stage: "preparing", message: t("dialogs.export.preparing") });

    try {
      // Deep Process Nodes: Fetch sub-flows
      const processedNodes = await Promise.all(
        nodes.map(async (n) => {
          // Deep copy
          const node = JSON.parse(JSON.stringify(n));

          // If component, fetch its latest flow data from API to embed
          if (
            (node.type === "component" || node.data?.type === "component") &&
            node.data?.flowId
          ) {
            try {
              const subFlow = await api.get(
                `/projects/${node.data.projectId || "active"}/flows/${node.data.flowId}`,
              );
              if (subFlow) {
                node.data.subFlow = {
                  name: subFlow.name,
                  nodes: subFlow.nodes || [],
                  edges: subFlow.edges || [],
                };
              }
            } catch (err) {
              console.warn(
                `Failed to fetch sub-flow ${node.data.flowId} for export`,
                err,
              );
            }
          }

          // Sanitization: Remove API Keys if they exist in configuration
          if (node.data?.configuration?.apiKey) {
            delete node.data.configuration.apiKey;
          }
          // Remove execution state
          if (node.data?.state) delete node.data.state;
          if (node.data?.replayData) delete node.data.replayData;

          return node;
        }),
      );

      // Create the full export payload
      const exportData = {
        meta: {
          version: "2.2.0", // Bumped version for Deep Export
          timestamp: new Date().toISOString(),
          source: "hal-9001",
          flowName:
            nodes.find((n) => n.type === "launch_browser")?.data?.label ||
            "Untitled Flow",
        },
        nodes: processedNodes,
        edges: edges,
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      setProgress({
        stage: "complete",
        message: t("common.flow_save_success"),
      });

      // Create blob and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hal_flow_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError(err.message || t("dialogs.export.error_export"));
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, [nodes, edges, handleClose, t]);

  // Handle code export
  const handleCodeExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({ stage: "preparing", message: t("dialogs.export.preparing") });

    try {
      const flow = convertNodesToFlow();

      setProgress({
        stage: "generating",
        message: t("dialogs.export.generating_code"),
      });

      const result = await api.post("/export/code", {
        framework,
        flow,
      });

      if (!result.code) {
        throw new Error(t("dialogs.export.error_no_code"));
      }

      setGeneratedCode(result.code);

      setProgress({
        stage: "complete",
        message: t("dialogs.export.code_ready_msg"),
      });
    } catch (err) {
      setError(err.message || t("dialogs.export.error_generate"));
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, [convertNodesToFlow, framework, t]);

  // Download generated code
  const handleDownloadCode = useCallback(() => {
    if (!generatedCode) return;

    const blob = new Blob([generatedCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hal_test_${framework}_${Date.now()}.js`;
    a.click();
    URL.revokeObjectURL(url);

    handleClose();
  }, [generatedCode, framework, handleClose]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(() => {
    if (!generatedCode) return;

    navigator.clipboard.writeText(generatedCode).then(() => {
      setProgress({
        stage: "complete",
        message: t("dialogs.export.copy_success"),
      });
    });
  }, [generatedCode, t]);

  const handleExportClick = useCallback(() => {
    if (exportMode === "json") {
      handleJsonExport();
    } else {
      handleCodeExport();
    }
  }, [exportMode, handleJsonExport, handleCodeExport]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "w-full bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300",
              generatedCode ? "max-w-4xl" : "max-w-lg",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Download size={20} className="text-indigo-400" />
                {t("dialogs.export.title")}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {
                    id: "json",
                    label: t("dialogs.export.mode_json_label"),
                    icon: FileJson,
                  },
                  {
                    id: "code",
                    label: t("dialogs.export.mode_code_label"),
                    icon: Code2,
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setExportMode(mode.id);
                      resetState();
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                      exportMode === mode.id
                        ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10",
                    )}
                  >
                    <mode.icon
                      size={24}
                      className={
                        exportMode === mode.id ? "text-indigo-400" : ""
                      }
                    />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* JSON Info */}
              {exportMode === "json" && !generatedCode && (
                <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-xl border border-white/5">
                  <FileJson
                    size={48}
                    className="text-indigo-400 mb-4 opacity-50"
                  />
                  <h3 className="text-white font-medium mb-2">
                    {t("dialogs.export.json_title")}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs">
                    {t("dialogs.export.json_desc")}
                  </p>

                  <div className="flex gap-8 mt-6">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider text-slate-500">
                        {t("dialogs.export.nodes_label")}
                      </span>
                      <span className="text-2xl font-bold text-indigo-400">
                        {nodes.length}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider text-slate-500">
                        {t("dialogs.export.nodes_label")}
                      </span>
                      <span className="text-2xl font-bold text-indigo-400">
                        {edges.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Code Config */}
              {exportMode === "code" && !generatedCode && (
                <div className="relative flex flex-col items-center text-center p-8 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 z-10 backdrop-blur-sm bg-slate-950/40 flex flex-col items-center justify-center p-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 max-w-xs text-center shadow-2xl">
                      <AlertTriangle
                        size={28}
                        className="text-amber-400 mx-auto mb-3"
                      />
                      <h4 className="text-amber-400 font-bold text-xs mb-2 uppercase tracking-widest">
                        {t("dialogs.export.wip_title", "Work in Progress")}
                      </h4>
                      <p className="text-slate-300 text-[10px] leading-relaxed">
                        {t(
                          "dialogs.export.wip_desc",
                          "The code generator is being updated to support complex flows and advanced localization. It will be ready in the next update.",
                        )}
                      </p>
                    </div>
                  </div>
                  <Code2
                    size={48}
                    className="text-indigo-400 mb-4 opacity-50"
                  />
                  <h3 className="text-white font-medium mb-2">
                    {t("dialogs.export.code_title")}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mb-6">
                    {t("dialogs.export.code_desc")}
                  </p>

                  <div className="w-full max-w-xs text-left">
                    <label className="text-xs font-medium text-slate-400 ml-1">
                      {t("dialogs.export.framework_label")}
                    </label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      disabled={true}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 opacity-50"
                    >
                      <option value="playwright">Playwright</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Generated Code Preview */}
              {generatedCode && (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-950 border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs text-indigo-300">
                      <FileCode size={14} />
                      <span>Generated Script</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      <FileCode size={14} />
                      {t("common.copy")}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-300 leading-relaxed custom-scrollbar">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              )}

              {/* Status Messages */}
              {(progress || error) && (
                <div
                  className={cn(
                    "mt-6 p-4 rounded-lg flex items-center gap-3 border",
                    error
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : progress?.stage === "complete"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                  )}
                >
                  {error ? (
                    <AlertCircle size={20} />
                  ) : progress?.stage === "complete" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Loader size={20} className="animate-spin" />
                  )}
                  <span className="text-sm font-medium">
                    {error || progress?.message}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {generatedCode ? t("common.close") : t("common.cancel")}
              </button>

              {generatedCode ? (
                <button
                  onClick={handleDownloadCode}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  {t("common.download")}
                </button>
              ) : (
                <button
                  onClick={handleExportClick}
                  disabled={
                    isProcessing || nodes.length === 0 || exportMode === "code"
                  }
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      {t("common.export")}
                    </>
                  )}
                </button>
              )}
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
