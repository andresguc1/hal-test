import React, { useState, useCallback, useEffect } from "react";
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
import { motion as Motion, AnimatePresence } from "framer-motion";
import { api } from "../utils/api";
import JSZip from "jszip";

/**
 * ExportDialog Component
 *
 * Provides a comprehensive UI for exporting flows
 */
const ExportDialog = ({ isOpen, onClose, nodes, edges, projectId, flowId }) => {
  const { t } = useTranslation();
  const [exportMode, setExportMode] = useState("json"); // 'json', 'code'
  const [framework, setFramework] = useState("playwright");
  const [language, setLanguage] = useState("javascript");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [designPattern, setDesignPattern] = useState("flat");
  const [includeCICD, setIncludeCICD] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setGeneratedCode(null);
    setLanguage("javascript");
    setDesignPattern("flat");
    setIncludeCICD(false);
    setGeneratedFiles(null);
    setActiveFile(null);
  }, []);

  // Auto-reset language based on framework selection
  useEffect(() => {
    if (
      framework === "cypress" &&
      language !== "javascript" &&
      language !== "typescript"
    ) {
      setLanguage("javascript");
    } else if (
      framework === "selenium" &&
      language !== "python" &&
      language !== "java"
    ) {
      setLanguage("python");
    }
  }, [framework, language]);

  const handleClose = useCallback(() => {
    resetState();
    setExportMode("json");
    onClose();
  }, [resetState, onClose]);

  // Convert nodes to flow actions for backend
  const convertNodesToFlow = useCallback(() => {
    if (!nodes || !Array.isArray(nodes)) return [];

    const nodeMap = new Map();

    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        id: node.id,
        type: node.data?.type || node.type,
        action: node.data?.type || node.type,
        data: {
          configuration: node.data?.configuration || {},
          label: node.data?.label || node.data?.customLabel || node.type,
          customLabel: node.data?.customLabel,
          subNodes: [],
        },
        parentNode: node.parentNode || node.parentId,
        ...node.data?.configuration,
      });
    });

    const roots = [];
    const childIds = new Set();

    // 1. Build parent-child tree (components, groups)
    nodeMap.forEach((mappedNode) => {
      const parentId = mappedNode.parentNode;
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId).data.subNodes.push(mappedNode);
        childIds.add(mappedNode.id);
      }
    });

    // 2. Collect root nodes (not children of any other node)
    nodeMap.forEach((mappedNode) => {
      if (!childIds.has(mappedNode.id)) {
        roots.push(mappedNode);
      }
    });

    // 3. Topologically sort roots using edges for correct execution order
    if (edges && edges.length > 0) {
      const rootIds = new Set(roots.map((r) => r.id));
      const adj = new Map();
      const inDegree = new Map();

      roots.forEach((r) => {
        adj.set(r.id, []);
        inDegree.set(r.id, 0);
      });

      edges.forEach((edge) => {
        if (rootIds.has(edge.source) && rootIds.has(edge.target)) {
          adj.get(edge.source)?.push(edge.target);
          inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        }
      });

      const queue = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      const sorted = [];
      while (queue.length > 0) {
        const id = queue.shift();
        sorted.push(id);
        for (const neighbor of adj.get(id) || []) {
          const newDeg = (inDegree.get(neighbor) || 1) - 1;
          inDegree.set(neighbor, newDeg);
          if (newDeg === 0) queue.push(neighbor);
        }
      }

      // Append any roots not reached by edges (disconnected)
      const sortedSet = new Set(sorted);
      roots.forEach((r) => {
        if (!sortedSet.has(r.id)) sorted.push(r.id);
      });

      const rootMap = new Map(roots.map((r) => [r.id, r]));
      return sorted.map((id) => rootMap.get(id)).filter(Boolean);
    }

    return roots;
  }, [nodes, edges]);

  // Handle JSON export (Client-Side with server-side dependency resolution when available)
  const handleJsonExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({ stage: "preparing", message: t("dialogs.export.preparing") });

    try {
      let exportData;

      // Preferred: use the server-side V3 package export which resolves
      // component dependencies recursively (self-contained package).
      if (projectId && flowId) {
        try {
          const pkg = await api.get(
            `/projects/${projectId}/flows/${flowId}/export?sanitize=true`,
          );
          if (pkg && pkg.flow && pkg.dependencies) {
            exportData = {
              meta: {
                version: "3.0.0",
                timestamp: new Date().toISOString(),
                source: "hal-9001",
                flowName: pkg.flow.name || "Untitled Flow",
              },
              flow: pkg.flow,
              dependencies: pkg.dependencies,
            };
          }
        } catch (err) {
          console.warn(
            "[ExportDialog] Server export unavailable, falling back to client export",
            err,
          );
        }
      }

      // Fallback: client-side V2 export with one-level-deep subFlow embedding
      if (!exportData) {
        const processedNodes = await Promise.all(
          nodes.map(async (n) => {
            const node = JSON.parse(JSON.stringify(n));

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

            if (node.data?.configuration?.apiKey) {
              delete node.data.configuration.apiKey;
            }
            if (node.data?.state) delete node.data.state;
            if (node.data?.replayData) delete node.data.replayData;

            return node;
          }),
        );

        exportData = {
          meta: {
            version: "2.2.0",
            timestamp: new Date().toISOString(),
            source: "hal-9001",
            flowName:
              nodes.find((n) => n.type === "launch_browser")?.data?.label ||
              "Untitled Flow",
          },
          nodes: processedNodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 1 },
        };
      }

      setProgress({
        stage: "complete",
        message: t("common.flow_save_success"),
      });

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
  }, [nodes, edges, projectId, flowId, handleClose, t]);

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

      const cicdEnabled =
        includeCICD &&
        framework === "playwright" &&
        (language === "javascript" || language === "typescript");

      const result = await api.post("/export/code", {
        framework,
        language,
        flow,
        projectId,
        designPattern,
        includeCICD: cicdEnabled,
      });

      if (result.isZip && result.files) {
        setGeneratedFiles(result.files);
        const firstFile =
          Object.keys(result.files).find(
            (k) => k.endsWith(".spec.js") || k.endsWith(".spec.ts"),
          ) || Object.keys(result.files)[0];
        setActiveFile(firstFile);
        setGeneratedCode(result.files[firstFile]);
      } else {
        if (!result.code) {
          throw new Error(t("dialogs.export.error_no_code"));
        }
        setGeneratedCode(result.code);
        setGeneratedFiles(null);
      }

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
  }, [
    convertNodesToFlow,
    framework,
    language,
    projectId,
    designPattern,
    includeCICD,
    t,
  ]);

  // Download generated code
  const handleDownloadCode = useCallback(async () => {
    if (generatedFiles) {
      try {
        const zip = new JSZip();
        Object.entries(generatedFiles).forEach(([filename, content]) => {
          zip.file(filename, content);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hal_test_${framework}_pom_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        handleClose();
      } catch (err) {
        setError(err.message || "Failed to generate ZIP");
      }
      return;
    }

    if (!generatedCode) return;

    const extMap = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
    };
    const ext = extMap[language] || "js";

    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hal_test_${framework}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    handleClose();
  }, [generatedCode, generatedFiles, framework, language, handleClose]);

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
              generatedFiles
                ? "max-w-5xl"
                : generatedCode
                  ? "max-w-4xl"
                  : "max-w-lg",
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
                      resetState();
                      setExportMode(mode.id);
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
                  <Code2 size={48} className="text-indigo-400 mb-4" />
                  <h3 className="text-white font-medium mb-2">
                    {t("dialogs.export.code_title")}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mb-6">
                    {t("dialogs.export.code_desc")}
                  </p>

                  <div className="w-full max-w-xs text-left flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 ml-1">
                        {t("dialogs.export.framework_label")}
                      </label>
                      <select
                        value={framework}
                        onChange={(e) => setFramework(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="playwright">Playwright</option>
                        <option value="cypress">Cypress</option>
                        <option value="selenium">Selenium</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 ml-1">
                        {t("dialogs.export.language_label", "Language")}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        {framework === "playwright" && (
                          <>
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                          </>
                        )}
                        {framework === "cypress" && (
                          <>
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                          </>
                        )}
                        {framework === "selenium" && (
                          <>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                          </>
                        )}
                      </select>
                    </div>

                    {framework === "playwright" &&
                      (language === "javascript" ||
                        language === "typescript") && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-200 font-medium">
                              {t(
                                "dialogs.export.pattern_label",
                                "Design Pattern",
                              )}
                            </label>
                            <select
                              value={designPattern}
                              onChange={(e) => setDesignPattern(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="flat">
                                {t("patterns.flat", "Flat / Linear")}
                              </option>
                              <option value="pom">
                                {t("patterns.pom", "Page Object Model")}
                              </option>
                              <option value="screenplay">
                                {t("patterns.screenplay", "Screenplay")}
                              </option>
                              <option value="data-driven">
                                {t("patterns.data_driven", "Data-Driven")}
                              </option>
                              <option value="keyword-driven">
                                {t("patterns.keyword_driven", "Keyword-Driven")}
                              </option>
                            </select>
                            <span className="text-xs text-slate-400">
                              {designPattern === "flat" &&
                                "Sequential code in a single file."}
                              {designPattern === "pom" &&
                                "Page classes organized by sub-flows."}
                              {designPattern === "screenplay" &&
                                "Actor-based with abilities and tasks."}
                              {designPattern === "data-driven" &&
                                "Test data separated from logic."}
                              {designPattern === "keyword-driven" &&
                                "Table-driven keywords mapping to actions."}
                            </span>
                          </div>

                          <div
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => setIncludeCICD(!includeCICD)}
                          >
                            <div className="flex flex-col text-left pr-2">
                              <span className="text-sm text-gray-200 font-medium">
                                {t(
                                  "dialogs.export.cicd_label",
                                  "Include CI/CD Templates",
                                )}
                              </span>
                              <span className="text-xs text-slate-400">
                                {t(
                                  "dialogs.export.cicd_desc",
                                  "Add pipeline files (.github/workflows, .gitlab-ci) to run tests automatically",
                                )}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={includeCICD}
                              onChange={(e) => setIncludeCICD(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 bg-slate-900"
                            />
                          </div>
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* Generated Code Preview */}
              {generatedFiles ? (
                <div className="flex-1 flex min-h-0 bg-slate-950 border border-white/10 rounded-xl overflow-hidden">
                  {/* Files Tree Sidebar */}
                  <div className="w-60 border-r border-white/10 bg-slate-900/30 flex flex-col overflow-y-auto">
                    <div className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-white/10 bg-slate-950/40">
                      {t("dialogs.export.project_files", "Project Files")}
                    </div>
                    <div className="p-2 space-y-1">
                      {Object.keys(generatedFiles).map((filename) => {
                        const isActive = activeFile === filename;
                        return (
                          <button
                            key={filename}
                            onClick={() => {
                              setActiveFile(filename);
                              setGeneratedCode(generatedFiles[filename]);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors",
                              isActive
                                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent",
                            )}
                          >
                            <FileCode
                              size={14}
                              className={
                                isActive ? "text-indigo-400" : "text-slate-500"
                              }
                            />
                            <span className="truncate">{filename}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* File Code Preview */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/50">
                      <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
                        <FileCode size={14} />
                        <span>{activeFile}</span>
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
                </div>
              ) : generatedCode ? (
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
              ) : null}

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
                  disabled={isProcessing || nodes.length === 0}
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
