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
} from "lucide-react";
import "./ExportDialog.css";

/**
 * ExportDialog Component
 *
 * Provides a comprehensive UI for exporting flows
 */
const ExportDialog = ({ isOpen, onClose, nodes, edges }) => {
  const { t } = useTranslation();
  const [exportMode, setExportMode] = useState("json"); // 'json', 'code'
  const [framework, setFramework] = useState("playwright"); // Future: support more frameworks
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setGeneratedCode(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Convert nodes to flow actions for backend
  const convertNodesToFlow = useCallback(() => {
    // Sort nodes topologically based on edges
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set();
    const result = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return;

      // Add node action
      result.push({
        action: node.data.type,
        ...node.data.configuration,
      });

      // Visit children
      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      outgoingEdges.forEach((edge) => visit(edge.target));
    };

    // Find root nodes (nodes with no incoming edges)
    const targetIds = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter((n) => !targetIds.has(n.id));

    // Visit from each root
    rootNodes.forEach((node) => visit(node.id));

    return result;
  }, [nodes, edges]);

  // Handle JSON export
  const handleJsonExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({ stage: "preparing", message: t("dialogs.export.preparing") });

    try {
      const flow = convertNodesToFlow();

      setProgress({ stage: "sending", message: t("dialogs.export.generating_json") });

      const response = await fetch("/api/export/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error: ${response.statusText}`,
        );
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hal_test_flow_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress({
        stage: "complete",
        message: t("common.flow_save_success"),
      });

      // Close dialog after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || t("dialogs.export.error_export"));
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, [convertNodesToFlow, handleClose, t]);

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

      const response = await fetch("/api/export/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework,
          flow,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Error: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.code) {
        throw new Error(t("dialogs.export.error_no_code"));
      }

      // Show generated code
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
      setTimeout(() => {
        setProgress({
          stage: "complete",
          message: t("dialogs.export.code_ready_msg"),
        });
      }, 2000);
    });
  }, [generatedCode, t]);

  const handleExportClick = useCallback(() => {
    if (exportMode === "json") {
      handleJsonExport();
    } else {
      handleCodeExport();
    }
  }, [exportMode, handleJsonExport, handleCodeExport]);

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay" onClick={handleClose}>
      <div
        className={`export-dialog ${generatedCode ? "with-code" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="export-dialog-header">
          <h2>
            <Download size={24} />
            {t("dialogs.export.title")}
          </h2>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="export-mode-selector">
          <button
            className={`mode-button ${exportMode === "json" ? "active" : ""}`}
            onClick={() => {
              setExportMode("json");
              resetState();
            }}
            disabled={isProcessing}
          >
            <FileJson size={20} />
            <span>{t("dialogs.export.mode_json_label")}</span>
            <span className="mode-description">{t("dialogs.export.mode_json_desc")}</span>
          </button>
          <button
            className={`mode-button ${exportMode === "code" ? "active" : ""}`}
            onClick={() => {
              setExportMode("code");
              resetState();
            }}
            disabled={isProcessing}
          >
            <Code2 size={20} />
            <span>{t("dialogs.export.mode_code_label")}</span>
            <span className="mode-description">{t("dialogs.export.mode_code_desc")}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="export-dialog-content">
          {/* JSON Mode */}
          {exportMode === "json" && !generatedCode && (
            <div className="export-section">
              <div className="export-info">
                <FileJson size={48} />
                <h3>{t("dialogs.export.json_title")}</h3>
                <p>{t("dialogs.export.json_desc")}</p>
                <div className="export-stats">
                  <div className="stat">
                    <span className="stat-label">{t("dialogs.export.nodes_label")}</span>
                    <span className="stat-value">{nodes.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t("dialogs.export.edges_label")}</span>
                    <span className="stat-value">{edges.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Mode */}
          {exportMode === "code" && !generatedCode && (
            <div className="export-section">
              <div className="export-info">
                <Code2 size={48} />
                <h3>{t("dialogs.export.code_title")}</h3>
                <p>{t("dialogs.export.code_desc")}</p>
                <div className="framework-selector">
                  <label>{t("dialogs.export.framework_label")}</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="playwright">Playwright</option>
                  </select>
                </div>
                <div className="export-stats">
                  <div className="stat">
                    <span className="stat-label">{t("dialogs.export.actions_label")}</span>
                    <span className="stat-value">{nodes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="code-display-section">
              <div className="code-header">
                <h3>
                  <FileCode size={20} />
                  {t("dialogs.export.generated_code_title")}
                </h3>
                <div className="code-actions">
                  <button
                    className="button-icon"
                    onClick={handleCopyCode}
                    title={t("dialogs.export.copy_tooltip")}
                  >
                    <FileCode size={16} />
                    {t("common.copy")}
                  </button>
                </div>
              </div>
              <pre className="code-display">
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className={`progress-section ${progress.stage}`}>
              {progress.stage === "complete" ? (
                <CheckCircle size={20} />
              ) : (
                <Loader size={20} className="spinner" />
              )}
              <span>{progress.message}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-section">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="export-dialog-footer">
          <button
            className="button-secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {generatedCode ? t("common.close") : t("common.cancel")}
          </button>
          {generatedCode ? (
            <button className="button-primary" onClick={handleDownloadCode}>
              <Download size={16} />
              {t("common.download")}
            </button>
          ) : (
            <button
              className="button-primary"
              onClick={handleExportClick}
              disabled={isProcessing || nodes.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader size={16} className="spinner" />
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
      </div>
    </div>
  );
};

export default ExportDialog;
