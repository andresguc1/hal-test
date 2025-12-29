import React, { useState, useCallback } from "react";
import {
  Upload,
  FolderOpen,
  FileCode,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./ImportDialog.css";

/**
 * ImportDialog Component
 *
 * Provides a comprehensive UI for importing test files and directories
 * Supports:
 * - Single file import
 * - Directory import (recursive)
 * - Directory import with POM (Page Object Model) support
 * - Framework auto-detection
 * - Real-time progress tracking
 */
const ImportDialog = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [importMode, setImportMode] = useState("file"); // 'file', 'directory', 'directory-pom'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [detectedFramework, setDetectedFramework] = useState(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setSelectedDirectory(null);
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setDetectedFramework(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setDetectedFramework(null);

    // Auto-detect framework
    try {
      const content = await file.text();
      const response = await fetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename: file.name }),
      });

      if (response.ok) {
        const analysis = await response.json();
        if (analysis.detected) {
          setDetectedFramework(analysis.framework);
        }
      }
    } catch (err) {
      console.error("Error detecting framework:", err);
    }
  }, []);

  // Handle directory selection (using webkitdirectory)
  const handleDirectorySelect = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedDirectory({
      name: files[0].webkitRelativePath.split("/")[0],
      files: files,
      count: files.length,
    });
    setError(null);
  }, []);

  // Handle single file import
  const handleFileImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setProgress({ stage: "analyzing", message: "Analizando archivo..." });

    try {
      const content = await selectedFile.text();

      // Call the parent's import handler
      await onImport({
        mode: "file",
        content,
        filename: selectedFile.name,
        framework: detectedFramework,
      });

      setProgress({
        stage: "complete",
        message: "✓ Importación completada exitosamente",
      });

      // Close dialog after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Error al importar el archivo");
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, detectedFramework, onImport, handleClose]);

  // Handle directory import
  const handleDirectoryImport = useCallback(async () => {
    if (!selectedDirectory) return;

    setIsProcessing(true);
    setError(null);
    setProgress({
      stage: "uploading",
      message: `Subiendo ${selectedDirectory.count} archivos...`,
    });

    try {
      // Create FormData to upload directory
      const formData = new FormData();
      selectedDirectory.files.forEach((file) => {
        formData.append("files", file, file.webkitRelativePath);
      });

      const endpoint =
        importMode === "directory-pom"
          ? "/api/import/directory-pom"
          : "/api/import/directory";

      setProgress({
        stage: "processing",
        message: "Procesando archivos...",
      });

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }

      const result = await response.json();

      setProgress({
        stage: "converting",
        message: `Convirtiendo ${result.stats?.totalFiles || 0} archivos...`,
      });

      // Call the parent's import handler with the result
      await onImport({
        mode: importMode,
        result,
      });

      setProgress({
        stage: "complete",
        message: `✓ ${result.stats?.successfulConversions || 0} flujos importados exitosamente`,
      });

      // Close dialog after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al importar el directorio");
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedDirectory, importMode, onImport, handleClose]);

  const handleImportClick = useCallback(() => {
    if (importMode === "file") {
      handleFileImport();
    } else {
      handleDirectoryImport();
    }
  }, [importMode, handleFileImport, handleDirectoryImport]);

  if (!isOpen) return null;

  return (
    <div className="import-dialog-overlay" onClick={handleClose}>
      <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="import-dialog-header">
          <h2>
            <Upload size={24} />
            Importar Tests
          </h2>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="import-mode-selector">
          <button
            className={`mode-button ${importMode === "file" ? "active" : ""}`}
            onClick={() => {
              setImportMode("file");
              resetState();
            }}
            disabled={isProcessing}
          >
            <FileCode size={20} />
            <span>Archivo Individual</span>
          </button>
          <button
            className={`mode-button ${importMode === "directory" ? "active" : ""}`}
            onClick={() => {
              setImportMode("directory");
              resetState();
            }}
            disabled={isProcessing}
          >
            <FolderOpen size={20} />
            <span>Directorio</span>
          </button>
          <button
            className={`mode-button ${importMode === "directory-pom" ? "active" : ""}`}
            onClick={() => {
              setImportMode("directory-pom");
              resetState();
            }}
            disabled={isProcessing}
          >
            <FolderOpen size={20} />
            <span>Directorio + POM</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="import-dialog-content">
          {/* File Mode */}
          {importMode === "file" && (
            <div className="import-section">
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".json,.js,.ts,.spec.js,.spec.ts,.cy.js,.cy.ts,.py,.java,.cs,.groovy,.txt"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                <div className="file-input-display">
                  {selectedFile ? (
                    <>
                      <FileCode size={24} />
                      <span>{selectedFile.name}</span>
                      {detectedFramework && (
                        <span className="detected-framework">
                          {detectedFramework}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>{t("dialogs.import.select_file_placeholder")}</span>
                    </>
                  )}
                </div>
              </label>
              <p className="help-text">{t("dialogs.import.help_text")}</p>
            </div>
          )}

          {/* Directory Mode */}
          {(importMode === "directory" || importMode === "directory-pom") && (
            <div className="import-section">
              <label className="file-input-label">
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleDirectorySelect}
                  disabled={isProcessing}
                />
                <div className="file-input-display">
                  {selectedDirectory ? (
                    <>
                      <FolderOpen size={24} />
                      <div className="directory-info">
                        <span>{selectedDirectory.name}</span>
                        <span className="file-count">
                          {t("dialogs.import.files_count", { count: selectedDirectory.count })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <FolderOpen size={24} />
                      <span>{t("dialogs.import.select_directory_placeholder")}</span>
                    </>
                  )}
                </div>
              </label>
              {importMode === "directory-pom" && (
                <div className="pom-info">
                  <AlertCircle size={16} />
                  <span>{t("dialogs.import.pom_hint")}</span>
                </div>
              )}
              <p className="help-text">
                {t("dialogs.import.recursive_hint")}
              </p>
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
        <div className="import-dialog-footer">
          <button
            className="button-secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {t("common.cancel")}
          </button>
          <button
            className="button-primary"
            onClick={handleImportClick}
            disabled={
              isProcessing ||
              (importMode === "file" && !selectedFile) ||
              (importMode !== "file" && !selectedDirectory)
            }
          >
            {isProcessing ? (
              <>
                <Loader size={16} className="spinner" />
                {t("common.processing")}
              </>
            ) : (
              <>
                <Upload size={16} />
                {t("common.import")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
