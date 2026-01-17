import React, { useState, useRef } from "react";
import {
  Upload,
  FolderInput,
  FileCode,
  AlertCircle,
  FileJson,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const ImportModal = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [importMode, setImportMode] = useState("file"); // 'file' | 'dir' | 'pom'
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [mergeStrategy, setMergeStrategy] = useState("replace"); // 'replace' | 'append'

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile && importMode === "file") return;

    // Read file content if in file mode
    if (importMode === "file") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        onImport({
          mode: importMode,
          content: content,
          strategy: mergeStrategy,
        });
      };
      reader.readAsText(selectedFile);
    } else {
      // Directory/POM import logic placeholder - likely handled by backend or separate flow
      // For now, we simulate sending the request
      onImport({ mode: importMode, strategy: mergeStrategy });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] w-[600px] rounded-lg border border-[#333] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            {t("import.title", "Import Flow")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setImportMode("file")}
              className={`p-3 rounded-md border flex flex-col items-center justify-center gap-2 transition-all ${
                importMode === "file"
                  ? "bg-purple-500/10 border-purple-500 text-purple-100"
                  : "bg-[#252526] border-[#333] text-gray-400 hover:border-gray-500"
              }`}
            >
              <FileJson className="w-6 h-6" />
              <span className="text-sm font-medium">Single File</span>
            </button>

            <button
              onClick={() => setImportMode("dir")}
              className={`p-3 rounded-md border flex flex-col items-center justify-center gap-2 transition-all ${
                importMode === "dir"
                  ? "bg-blue-500/10 border-blue-500 text-blue-100"
                  : "bg-[#252526] border-[#333] text-gray-400 hover:border-gray-500"
              }`}
            >
              <FolderInput className="w-6 h-6" />
              <span className="text-sm font-medium">Directory</span>
            </button>

            <button
              onClick={() => setImportMode("pom")}
              className={`p-3 rounded-md border flex flex-col items-center justify-center gap-2 transition-all ${
                importMode === "pom"
                  ? "bg-orange-500/10 border-orange-500 text-orange-100"
                  : "bg-[#252526] border-[#333] text-gray-400 hover:border-gray-500"
              }`}
            >
              <FileCode className="w-6 h-6" />
              <span className="text-sm font-medium">POM.xml</span>
            </button>
          </div>

          {/* Input Area */}
          <div className="border border-dashed border-[#444] rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-[#252526]/50">
            {importMode === "file" ? (
              <>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded text-sm font-medium transition-colors"
                >
                  Choose JSON File
                </button>
                {selectedFile ? (
                  <div className="text-sm text-green-400 font-medium flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    {selectedFile.name}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Supported: Haltest JSON V1/V2
                  </p>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p>Directory/POM import mode requires Backend connectivity.</p>
                <p className="text-xs mt-1">(Mocked for this preview)</p>
              </div>
            )}
          </div>

          {/* Merge Strategy */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 font-medium">
              Merge Strategy
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-3 rounded border cursor-pointer ${mergeStrategy === "replace" ? "border-red-500/50 bg-red-500/5" : "border-[#333] bg-[#252526] opacity-50"}`}
                onClick={() => setMergeStrategy("replace")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3 h-3 rounded-full border ${mergeStrategy === "replace" ? "bg-red-500 border-red-500" : "border-gray-500"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-200">
                    Replace Current Flow
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-5">
                  Destroys current nodes and loads the new ones.
                </p>
              </div>

              <div
                className={`p-3 rounded border cursor-pointer ${mergeStrategy === "append" ? "border-green-500/50 bg-green-500/5" : "border-[#333] bg-[#252526] opacity-50"}`}
                onClick={() => setMergeStrategy("append")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3 h-3 rounded-full border ${mergeStrategy === "append" ? "bg-green-500 border-green-500" : "border-gray-500"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-200">
                    Add to Current
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-5">
                  Smartly merges new nodes into the existing canvas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#252526] rounded-b-lg border-t border-[#333] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile && importMode === "file"}
            className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Start Import
          </button>
        </div>
      </div>
    </div>
  );
};
