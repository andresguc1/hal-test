import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, Key, Eye, EyeOff, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

const ApiKeyRow = ({ label, provider, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="bg-[#1e1e1e] border border-white/5 rounded-lg p-4 group focus-within:border-indigo-500/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/5 text-slate-400">
            <Key size={14} />
          </div>
          <span className="text-sm font-medium text-slate-200">{label}</span>
        </div>
        {value && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Check size={10} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
              Set
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(provider, e.target.value)}
          placeholder={placeholder || "sk-..."}
          className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all pr-9 h-9"
          spellCheck={false}
        />
        <button
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ShieldCheck
          size={12}
          className={cn(
            "transition-colors",
            value ? "text-indigo-400" : "text-slate-600",
          )}
        />
        <span className="text-[10px] text-slate-500">
          Keys are stored locally in your browser/vault.
        </span>
      </div>
    </div>
  );
};

export default function ApiKeysModal() {
  const { isApiKeysOpen, closeApiKeys } = useSettings();

  // Local state for form inputs
  const [keys, setKeys] = useState({
    openai: "",
    anthropic: "",
    browserstack: "",
  });

  const handleChange = (provider, val) => {
    setKeys((prev) => ({ ...prev, [provider]: val }));
  };

  const handleSave = () => {
    // Here you would normally save to localStorage or backend vault
    closeApiKeys();
  };

  return (
    <AnimatePresence>
      {isApiKeysOpen && (
        <>
          {/* BACKDROP */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeApiKeys}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* MODAL */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-[#121212] border border-[#333] shadow-2xl rounded-xl flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#333] bg-[#1e1e1e]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Key size={18} />
                </div>
                <span className="font-semibold text-slate-200">API Keys</span>
              </div>
              <button
                onClick={closeApiKeys}
                className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Enter your API keys to enable AI Copilot features and cloud
                browser integration. These keys are encrypted and stored
                locally.
              </p>

              <ApiKeyRow
                label="OpenAI API Key"
                provider="openai"
                value={keys.openai}
                onChange={handleChange}
                placeholder="sk-proj-..."
              />

              <ApiKeyRow
                label="Anthropic API Key"
                provider="anthropic"
                value={keys.anthropic}
                onChange={handleChange}
                placeholder="sk-ant-..."
              />

              <ApiKeyRow
                label="BrowserStack / SauceLabs"
                provider="browserstack"
                value={keys.browserstack}
                onChange={handleChange}
                placeholder="user:key"
              />
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-[#333] bg-[#1e1e1e] flex justify-end gap-3">
              <button
                onClick={closeApiKeys}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
