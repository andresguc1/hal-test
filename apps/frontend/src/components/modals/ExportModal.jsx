import React, { useState } from "react";
import { Download, Check, AlertTriangle, Code, FileJson } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  nodeCount = 0,
  edgeCount = 0,
}) => {
  const { t } = useTranslation();
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [format, setFormat] = useState("json"); // 'json' | 'code'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] w-[600px] rounded-lg border border-[#333] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            {t("export.title", "Export Flow")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Banner */}
          <div className="bg-[#252526] p-4 rounded-md border border-[#333] flex justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {nodeCount}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Nodes
              </div>
            </div>
            <div className="w-px bg-[#444]"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {edgeCount}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Connections
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 font-medium">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat("json")}
                className={`p-4 rounded-md border text-left transition-all ${
                  format === "json"
                    ? "bg-blue-500/10 border-blue-500 text-blue-100"
                    : "bg-[#252526] border-[#333] text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="w-5 h-5" />
                  <span className="font-semibold">Haltest JSON</span>
                </div>
                <p className="text-xs opacity-70">
                  Full schema for re-importing into Haltest. Includes metadata.
                </p>
              </button>

              <button
                onClick={() => setFormat("code")}
                className={`p-4 rounded-md border text-left transition-all ${
                  format === "code"
                    ? "bg-purple-500/10 border-purple-500 text-purple-100"
                    : "bg-[#252526] border-[#333] text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-5 h-5" />
                  <span className="font-semibold">Playwright Code</span>
                </div>
                <p className="text-xs opacity-70">
                  Generate a standalone .spec.js script. (Coming Soon)
                </p>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 font-medium">
              Security Options
            </label>
            <div
              className="flex items-center justify-between p-3 rounded-md bg-[#252526] border border-[#333] cursor-pointer hover:bg-[#2a2a2b]"
              onClick={() => setIncludeSecrets(!includeSecrets)}
            >
              <div className="flex flex-col">
                <span className="text-sm text-gray-200 font-medium">
                  Include Secrets
                </span>
                <span className="text-xs text-gray-500">
                  Export API keys and passwords (Unsafe)
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${includeSecrets ? "bg-red-500" : "bg-green-600"}`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeSecrets ? "left-6" : "left-1"}`}
                ></div>
              </div>
            </div>

            {includeSecrets && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
                <AlertTriangle className="w-4 h-4" />
                Warning: This file will contain sensitive credentials.
              </div>
            )}
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
            onClick={() => onExport(format, includeSecrets)}
            className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
