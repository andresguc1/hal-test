import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Bot,
  Send,
  GripVertical,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_CATEGORIES, CATEGORY_STYLES } from "@/config/nodeConstants";

const ToolboxItem = ({ label, nodeId, color, onAdd }) => {
  // Select styles based on color theme, fallback to slate
  const theme = CATEGORY_STYLES[color] || CATEGORY_STYLES.slate;

  return (
    <Motion.div
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(nodeId)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/reactflow", nodeId);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group flex items-center gap-3 p-2 mb-2 rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 border shadow-sm backdrop-blur-[2px]",
        theme.card, // Applies the "Tinted Glass" background and border
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "p-1.5 rounded transition-colors duration-200",
          theme.icon,
        )}
      >
        <Box size={14} />
      </div>

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-xs font-medium truncate select-none transition-colors",
          theme.text,
        )}
      >
        {label}
      </span>

      {/* Drag Handle */}
      <GripVertical
        size={12}
        className="text-white/20 group-hover:text-white/50"
      />
    </Motion.div>
  );
};

const ToolboxCategory = ({
  categoryKey,
  icon: _Icon,
  color,
  nodes,
  isOpen,
  onToggle,
  t,
  onAdd,
}) => {
  // Helper to get text color for the header
  const getHeaderColor = () => {
    // Extract the text-color part from the icon style for consistency, or standard mapping
    // Simply returning a hardcoded map for safety and brightness in headers
    switch (color) {
      case "cyan":
        return "text-cyan-400";
      case "blue":
        return "text-blue-400";
      case "indigo":
        return "text-indigo-400";
      case "violet":
        return "text-violet-400";
      case "purple":
        return "text-purple-400";
      case "fuchsia":
        return "text-fuchsia-400";
      case "pink":
        return "text-pink-400";
      case "rose":
        return "text-rose-400";
      case "red":
        return "text-red-400";
      case "orange":
        return "text-orange-400";
      case "amber":
        return "text-amber-400";
      case "yellow":
        return "text-yellow-400";
      case "lime":
        return "text-lime-400";
      case "green":
        return "text-green-400";
      case "emerald":
        return "text-emerald-400";
      case "teal":
        return "text-teal-400";
      default:
        return "text-slate-300";
    }
  };

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider transition-all rounded select-none",
          isOpen ? getHeaderColor() : "text-slate-500 hover:text-slate-300",
        )}
      >
        <div className="flex items-center gap-2">
          <_Icon
            size={14}
            className={isOpen ? getHeaderColor() : "text-slate-600"}
          />
          <span>{t(`nodes.categories.${categoryKey}`)}</span>
        </div>
        <ChevronRight
          size={12}
          className={cn(
            "transition-transform duration-200 opacity-50",
            isOpen && "rotate-90 opacity-100",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-visible px-1 pt-1" // visible overflow for hover effects
          >
            {nodes.map((nodeId) => (
              <ToolboxItem
                key={nodeId}
                nodeId={nodeId}
                label={t(`nodes.labels.${nodeId}`)}
                color={color}
                onAdd={onAdd}
              />
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ToolboxPanel({ addNode }) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState({
    browser_management: true,
  });

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <Motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative h-full z-40 flex flex-col bg-[#0f172a] shrink-0 font-sans",
        "border-r border-white/5 shadow-xl",
      )}
    >
      {/* HEADER */}
      <div className="h-14 flex items-center justify-center px-4 border-b border-white/5 shrink-0 bg-[#0f172a]">
        {!isCollapsed ? (
          <div className="w-full flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Box size={16} className="text-indigo-400" />
            </div>
            <span className="font-bold text-sm tracking-wide text-slate-100">
              TOOLBOX
            </span>
          </div>
        ) : (
          <Box size={20} className="text-indigo-400" />
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar flex flex-col">
        {!isCollapsed ? (
          <>
            {/* Search */}
            <div className="relative mb-4 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder={t("common.select_default", "Search tools...")}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
            </div>

            {/* List */}
            <div className="flex-1">
              {Object.entries(NODE_CATEGORIES).map(([key, section]) => (
                <ToolboxCategory
                  key={key}
                  categoryKey={key}
                  icon={section.icon}
                  color={section.color}
                  nodes={section.nodes}
                  isOpen={!!openCategories[key]}
                  onToggle={() => toggleCategory(key)}
                  t={t}
                  onAdd={addNode}
                />
              ))}
            </div>

            {/* AI COPILOT */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles size={14} className="text-amber-300" />
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">
                  AI COPILOT
                </span>
              </div>
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-white/10 rounded-xl p-0 relative group overflow-hidden flex flex-col h-36 shadow-lg">
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                  <div className="flex gap-3 mb-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Bot size={12} className="text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      I can help you build this flow. Try asking:{" "}
                      <span className="text-indigo-300 italic">
                        "Go to google.com and search for kittens"
                      </span>
                    </p>
                  </div>
                </div>
                <div className="h-9 border-t border-white/5 bg-white/[0.02] flex items-center px-3 gap-2">
                  <input
                    className="bg-transparent border-none text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none w-full h-full"
                    placeholder="Describe a test case..."
                    disabled
                  />
                  <Send size={12} className="text-slate-600" />
                </div>
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="text-[10px] font-bold text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    COMING SOON
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 items-center mt-2">
            {Object.entries(NODE_CATEGORIES).map(([key, section]) => {
              const colorClass =
                CATEGORY_STYLES[section.color]?.icon.split(" ")[0] ||
                "text-slate-400";
              return (
                <button
                  key={key}
                  title={t(`nodes.categories.${key}`)}
                  onClick={() => {
                    setIsCollapsed(false);
                    setOpenCategories({ [key]: true });
                  }}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-white/10",
                    colorClass,
                  )}
                >
                  <section.icon size={18} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/5 shrink-0 bg-[#0f172a]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all group",
            isCollapsed && "justify-center",
          )}
        >
          {isCollapsed ? (
            <ChevronRight size={16} className="group-hover:text-indigo-400" />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs font-medium">
                {t("common.hide_panel", "Collapse Panel")}
              </span>
            </>
          )}
        </button>
      </div>
    </Motion.div>
  );
}
