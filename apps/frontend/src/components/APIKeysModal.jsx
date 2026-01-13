import React, { useState, useEffect } from "react";
import { X, Key, Eye, EyeOff, Save } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";

export default function APIKeysModal({ isOpen, onClose }) {
  const [keys, setKeys] = useState({
    openai: "",
    anthropic: "",
    browserstack: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    browserstack: false,
  });

  useEffect(() => {
    if (isOpen) {
      const storedKeys = localStorage.getItem("haltest_api_keys");
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKeys((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (field) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    localStorage.setItem("haltest_api_keys", JSON.stringify(keys));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-[500px] bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                  <Key size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">API Keys</h3>
                  <p className="text-[10px] text-slate-400">
                    Manage your personal API keys
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                Enter your API keys to enable AI Copilot features and cloud
                browser integration. These keys are stored{" "}
                <strong>locally</strong> in your browser.
              </div>

              {/* OpenAI Field */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <Key size={12} className="text-slate-500" />
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openai ? "text" : "password"}
                    name="openai"
                    value={keys.openai}
                    onChange={handleChange}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 placeholder:text-slate-600 transition-all font-mono"
                  />
                  <button
                    onClick={() => toggleVisibility("openai")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKeys.openai ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Anthropic Field */}
              <div className="space-y-2 opacity-50 pointer-events-none filter grayscale">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <Key size={12} className="text-slate-500" />
                    Anthropic API Key
                  </label>
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                    Pro
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showKeys.anthropic ? "text" : "password"}
                    name="anthropic"
                    value={keys.anthropic}
                    onChange={handleChange}
                    placeholder="sk-ant-..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 placeholder:text-slate-600 font-mono"
                  />
                  <button
                    onClick={() => toggleVisibility("anthropic")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKeys.anthropic ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-slate-900/30">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-violet-900/20"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
