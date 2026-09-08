import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  AlertTriangle,
  Check,
  Loader2,
  FolderInput,
  X as XIcon,
} from "lucide-react";

/**
 * PROJECT EXPORT MODAL
 * Exports a project as a self-contained ZIP package (all flows + components).
 */
export const ProjectExportModal = ({
  isOpen,
  onClose,
  onExport,
  projectName = "",
  flowCount = 0,
  componentCount = 0,
  isExporting = false,
}) => {
  const { t } = useTranslation();
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [exported, setExported] = useState(false);

  const reset = useCallback(() => {
    setIncludeSecrets(false);
    setExported(false);
  }, []);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      await onExport(includeSecrets);
      setExported(true);
    } catch {
      // error handled by caller
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            {t("export.title", "Export Project")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Project name */}
          <div className="text-xs text-slate-400">
            {t("export.project", "Project")}:{" "}
            <span className="text-white font-medium">
              {projectName || "..."}
            </span>
          </div>

          {/* Stats */}
          <div className="bg-[#252526] p-3 rounded-md border border-[#333] flex justify-around">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{flowCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                {t("export.flows", "Flows")}
              </div>
            </div>
            <div className="w-px bg-[#444]" />
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">
                {componentCount}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                {t("export.components", "Components")}
              </div>
            </div>
          </div>

          {/* Include secrets toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-md bg-[#252526] border border-[#333] cursor-pointer hover:bg-[#2a2a2b]"
            onClick={() => setIncludeSecrets(!includeSecrets)}
          >
            <div className="flex flex-col">
              <span className="text-sm text-gray-200 font-medium">
                {t("export.include_secrets", "Include Secrets")}
              </span>
              <span className="text-xs text-gray-500">
                {t(
                  "export.include_secrets_hint",
                  "Export API keys and passwords (Unsafe)",
                )}
              </span>
            </div>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${
                includeSecrets ? "bg-red-500" : "bg-green-600"
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  includeSecrets ? "left-6" : "left-1"
                }`}
              />
            </div>
          </div>

          {includeSecrets && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
              {t(
                "export.secrets_warning",
                "Warning: This file will contain sensitive credentials.",
              )}
            </div>
          )}

          {exported && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <Check className="w-4 h-4" />
              {t("export.success", "Export complete")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#252526] rounded-b-lg border-t border-[#333] flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-[#333] transition-colors text-sm"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exported}
            className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors text-sm"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exported
              ? t("export.done", "Done")
              : t("export.download", "Download .hal.zip")}
          </button>
        </div>
      </div>
    </div>
  );
};
