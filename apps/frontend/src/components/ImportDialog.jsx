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
import { cn } from "@/lib/utils";
import { motion as Motion, AnimatePresence } from "motion/react";
import { api } from "../utils/api";

/**
 * ImportDialog Component
 *
 * Provides a comprehensive UI for importing test files and directories
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
      const analysis = await api.post("/import/analyze", {
        content,
        filename: file.name,
      });
      if (analysis.detected) {
        setDetectedFramework(analysis.framework);
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
      const formData = new FormData();
      selectedDirectory.files.forEach((file) => {
        formData.append("files", file, file.webkitRelativePath);
      });

      const endpoint =
        importMode === "directory-pom"
          ? "/import/directory-pom"
          : "/import/directory";

      setProgress({
        stage: "processing",
        message: "Procesando archivos...",
      });

      // api.post handles FormData and sets correct headers
      const result = await api.post(endpoint, formData);

      setProgress({
        stage: "converting",
        message: `Convirtiendo ${result.stats?.totalFiles || 0} archivos...`,
      });

      await onImport({
        mode: importMode,
        result,
      });

      setProgress({
        stage: "complete",
        message: `✓ ${result.stats?.successfulConversions || 0} flujos importados exitosamente`,
      });

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Upload size={20} className="text-indigo-400" />
                Importar Tests
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: "file", label: "Archivo Individual", icon: FileCode },
                  { id: "directory", label: "Directorio", icon: FolderOpen },
                  {
                    id: "directory-pom",
                    label: "Directorio + POM",
                    icon: FolderOpen,
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setImportMode(mode.id);
                      resetState();
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                      importMode === mode.id
                        ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10",
                    )}
                  >
                    <mode.icon
                      size={24}
                      className={
                        importMode === mode.id ? "text-indigo-400" : ""
                      }
                    />
                    <span className="text-xs font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Main Selection Area */}
              <div className="flex-1 overflow-y-auto">
                {importMode === "file" && (
                  <div className="space-y-4">
                    <label
                      className={cn(
                        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors group",
                        selectedFile
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5",
                      )}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".json,.js,.ts,.spec.js,.spec.ts,.cy.js,.cy.ts,.py,.java,.cs,.groovy,.txt"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                      />
                      {selectedFile ? (
                        <>
                          <FileCode
                            size={32}
                            className="text-emerald-400 mb-2"
                          />
                          <span className="text-sm font-medium text-emerald-200">
                            {selectedFile.name}
                          </span>
                          {detectedFramework && (
                            <span className="mt-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 rounded">
                              {detectedFramework}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Upload
                            size={32}
                            className="text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors"
                          />
                          <span className="text-sm text-slate-400 group-hover:text-indigo-200 transition-colors">
                            {t("dialogs.import.select_file_placeholder")}
                          </span>
                        </>
                      )}
                    </label>
                    <p className="text-xs text-slate-500 text-center">
                      {t("dialogs.import.help_text")}
                    </p>
                  </div>
                )}

                {(importMode === "directory" ||
                  importMode === "directory-pom") && (
                  <div className="space-y-4">
                    <label
                      className={cn(
                        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors group",
                        selectedDirectory
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5",
                      )}
                    >
                      <input
                        type="file"
                        className="hidden"
                        webkitdirectory="true"
                        directory="true"
                        multiple
                        onChange={handleDirectorySelect}
                        disabled={isProcessing}
                      />
                      {selectedDirectory ? (
                        <>
                          <FolderOpen
                            size={32}
                            className="text-emerald-400 mb-2"
                          />
                          <div className="text-center">
                            <div className="text-sm font-medium text-emerald-200">
                              {selectedDirectory.name}
                            </div>
                            <div className="text-xs text-emerald-400/70 mt-1">
                              {t("dialogs.import.files_count", {
                                count: selectedDirectory.count,
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <FolderOpen
                            size={32}
                            className="text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors"
                          />
                          <span className="text-sm text-slate-400 group-hover:text-indigo-200 transition-colors">
                            {t("dialogs.import.select_directory_placeholder")}
                          </span>
                        </>
                      )}
                    </label>

                    {importMode === "directory-pom" && (
                      <div className="flex items-start gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <AlertCircle
                          size={16}
                          className="text-indigo-400 shrink-0 mt-0.5"
                        />
                        <span className="text-xs text-indigo-300/80 leading-relaxed">
                          {t("dialogs.import.pom_hint")}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 text-center">
                      {t("dialogs.import.recursive_hint")}
                    </p>
                  </div>
                )}

                {/* Progress State */}
                {progress && (
                  <div
                    className={cn(
                      "mt-6 p-4 rounded-lg flex items-center gap-3 border",
                      progress.stage === "complete"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                    )}
                  >
                    {progress.stage === "complete" ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Loader size={20} className="animate-spin" />
                    )}
                    <span className="text-sm font-medium">
                      {progress.message}
                    </span>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="mt-6 p-4 rounded-lg flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleImportClick}
                disabled={
                  isProcessing ||
                  (importMode === "file" && !selectedFile) ||
                  (importMode !== "file" && !selectedDirectory)
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
                    <Upload size={16} />
                    {t("common.import")}
                  </>
                )}
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImportDialog;
