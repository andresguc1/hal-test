import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, AlertCircle, Check, Loader2, X as XIcon } from "lucide-react";

/**
 * PROJECT IMPORT MODAL
 * Imports a project from a .hal.zip package (all flows + components).
 */
export const ProjectImportModal = ({
  isOpen,
  onClose,
  onImport,
  isImporting = false,
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setName("");
    setError(null);
    setSuccess(false);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError(null);
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-populate name from file (strip extension)
      if (!name) {
        const base = file.name
          .replace(/\.hal\.zip$/i, "")
          .replace(/\.zip$/i, "");
        setName(base);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError(t("import.no_file", "Please select a .hal.zip file"));
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await onImport(selectedFile, { name: name || undefined });
      setSuccess(true);
    } catch (e) {
      setError(e?.message || t("import.failed", "Import failed"));
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
            <Upload className="w-5 h-5 text-purple-400" />
            {t("import.title", "Import Project")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* File picker */}
          <div
            className="border border-dashed border-[#444] rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-[#252526]/50 cursor-pointer hover:border-purple-500/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".zip,.hal.zip"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
              <FolderInput className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-300 font-medium">
              {selectedFile
                ? selectedFile.name
                : t("import.choose_file", "Choose a .hal.zip file")}
            </span>
            <span className="text-xs text-gray-500">
              {t(
                "import.supported",
                "Supported: Haltest Project ZIP (.hal.zip)",
              )}
            </span>
          </div>

          {/* Optional name override */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">
              {t("import.project_name", "Project name (optional)")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(
                "import.name_hint",
                "Leave empty to use the original name",
              )}
              className="w-full px-3 py-2 rounded-md bg-[#252526] border border-[#333] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <Check className="w-4 h-4" />
              {t("import.success", "Project imported successfully")}
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
            onClick={handleImport}
            disabled={!selectedFile || isImporting || success}
            className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors text-sm"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {t("import.start", "Start Import")}
          </button>
        </div>
      </div>
    </div>
  );
};
