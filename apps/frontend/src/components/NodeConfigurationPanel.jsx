import React from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { X, Play, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "@/config/nodeConstants";

export default function NodeConfigurationPanel({
  isVisible,
  action, // The selected node data
  onClose,
  onExecute,
  updateNodeConfiguration,
  onDeleteNode,
}) {
  const { t } = useTranslation();

  if (!isVisible || !action) return null;

  // 1. RESOLVE CONFIGURATION (Single Source of Truth)
  // Logic matches AbyssNode to ensure 1:1 visual parity
  const nodeKey = action.data?.subType || action.type;
  const config = NODE_TYPE_MAP[nodeKey] || NODE_TYPE_MAP.launch_browser;
  const safeConfig = config || { category: "default", color: "slate" };

  // 2. GET THEME
  const colorKey = safeConfig.color;
  const themeConfig =
    CATEGORY_STYLES[colorKey]?.panel || CATEGORY_STYLES.slate.panel;

  // 3. Dynamic Button Gradient (Derived from theme header classes roughly or hardcoded map)
  // Simplifying to basic tailwind colors for button to match theme
  const getButtonClass = (color) => {
    const map = {
      cyan: "from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/20",
      blue: "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20",
      indigo:
        "from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20",
      violet:
        "from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/20",
      purple:
        "from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/20",
      fuchsia:
        "from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 shadow-fuchsia-500/20",
      amber:
        "from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20",
      emerald:
        "from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20",
      rose: "from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-500/20",
      red: "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20",
      orange:
        "from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/20",
      lime: "from-lime-600 to-lime-500 hover:from-lime-500 hover:to-lime-400 shadow-lime-500/20",
      yellow:
        "from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 shadow-yellow-500/20",
    };
    return (
      map[color] ||
      "from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 shadow-slate-500/20"
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "w-80 h-full bg-[#0f172a]/70 backdrop-blur-xl border-l z-40 flex flex-col shadow-2xl",
            themeConfig.border,
            themeConfig.shadow,
          )}
        >
          {/* 1. DYNAMIC HEADER */}
          <div
            className={cn(
              "h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/5",
              themeConfig.header, // Applies specific bg-color text-white
            )}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">
                {safeConfig.category.replace("_", " ")}
              </span>
              <h2 className="text-sm font-bold truncate pr-2">
                {action.data?.label || safeConfig.label}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. SCROLLABLE CONTENT (Form) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* Node ID (Subtle) */}
            <div className="group relative p-2 rounded bg-black/20 border border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                ID: {(action.id || "").substring(0, 12)}...
              </span>
              <Info size={12} className="text-slate-600" />
            </div>

            {/* RENDER FORM FIELDS HERE */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1">
                  Label / Name
                </label>
                <input
                  type="text"
                  value={action.data?.label || ""}
                  onChange={(e) =>
                    updateNodeConfiguration(action.id, {
                      label: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition-all placeholder:text-slate-600"
                  placeholder="Name your step..."
                />
              </div>

              {/* GENERIC INPUT FOR SELECTOR (Demo) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1 flex items-center gap-2">
                  Target Selector{" "}
                  <span className="opacity-50 text-[10px]">(CSS/XPath)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={action.data?.selector || ""}
                    onChange={(e) =>
                      updateNodeConfiguration(action.id, {
                        selector: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 pl-3 pr-8 text-xs text-indigo-300 font-mono focus:outline-none focus:border-white/20 transition-all"
                    placeholder=".btn-primary"
                  />
                  <div
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse",
                      `bg-${colorKey}-500/50`,
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Context Box */}
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-[11px] leading-relaxed">
              <div className="flex items-center gap-2 mb-1 opacity-80 font-semibold">
                <Info size={12} />
                <span>Context</span>
              </div>
              Editing {safeConfig.label} settings.
            </div>
          </div>

          {/* 3. FOOTER ACTIONS */}
          <div className="p-4 border-t border-white/5 bg-[#0f172a]/80 shrink-0 space-y-3">
            {/* Primary Action */}
            <button
              onClick={() => onExecute(action)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                "bg-gradient-to-r text-white shadow-lg active:scale-[0.98]",
                getButtonClass(colorKey),
              )}
            >
              <Play size={14} fill="currentColor" />
              {t("common.run_node", "Test Action")}
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onDeleteNode(action.id)}
                className="flex-1 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
