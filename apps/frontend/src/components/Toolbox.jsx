import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
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
  Loader2,
  ChevronDown,
  Settings,
  X,
  Trash2,
  Star,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_CATEGORIES, CATEGORY_STYLES } from "@/config/nodeConstants";
import { useSettings } from "@/context/SettingsContext";

import { useToast } from "@/hooks/useToast";

const ToolboxItem = ({ label, nodeId, color, onAdd }) => {
  // Select styles based on color theme, fallback to slate
  const theme = CATEGORY_STYLES[color] || CATEGORY_STYLES.slate;

  // Helper for hover text color (similar to Category)
  const getHoverText = () => {
    if (color === "cyan") return "group-hover:text-cyan-400";
    if (color === "blue") return "group-hover:text-blue-400";
    if (color === "indigo") return "group-hover:text-indigo-400";
    if (color === "violet") return "group-hover:text-violet-400";
    if (color === "purple") return "group-hover:text-purple-400";
    if (color === "fuchsia") return "group-hover:text-fuchsia-400";
    if (color === "pink") return "group-hover:text-pink-400";
    if (color === "rose") return "group-hover:text-rose-400";
    if (color === "red") return "group-hover:text-red-400";
    if (color === "orange") return "group-hover:text-orange-400";
    if (color === "amber") return "group-hover:text-amber-400";
    if (color === "yellow") return "group-hover:text-yellow-400";
    if (color === "lime") return "group-hover:text-lime-400";
    if (color === "green") return "group-hover:text-green-400";
    if (color === "emerald") return "group-hover:text-emerald-400";
    if (color === "teal") return "group-hover:text-teal-400";
    return "group-hover:text-slate-200";
  };

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
        "group flex items-center gap-3 p-2 mb-2 rounded-md cursor-grab active:cursor-grabbing transition-all duration-300 border shadow-sm backdrop-blur-[2px]",
        theme.card, // Applies the "Tinted Glass" background and border
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "p-1.5 rounded transition-colors duration-300",
          theme.icon,
        )}
      >
        <Box size={14} />
      </div>

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-xs font-medium truncate select-none transition-colors duration-300",
          "text-[var(--text-main)]", // Theme-aware text
          getHoverText(), // Apply color on hover
        )}
      >
        {label}
      </span>

      {/* Drag Handle */}
      <GripVertical
        size={12}
        className="text-[var(--text-muted)] opacity-50 group-hover:opacity-100"
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

  // Helper to get hover text color
  const getHoverColor = () => {
    switch (color) {
      case "cyan":
        return "hover:text-cyan-400";
      case "blue":
        return "hover:text-blue-400";
      case "indigo":
        return "hover:text-indigo-400";
      case "violet":
        return "hover:text-violet-400";
      case "purple":
        return "hover:text-purple-400";
      case "fuchsia":
        return "hover:text-fuchsia-400";
      case "pink":
        return "hover:text-pink-400";
      case "rose":
        return "hover:text-rose-400";
      case "red":
        return "hover:text-red-400";
      case "orange":
        return "hover:text-orange-400";
      case "amber":
        return "hover:text-amber-400";
      case "yellow":
        return "hover:text-yellow-400";
      case "lime":
        return "hover:text-lime-400";
      case "green":
        return "hover:text-green-400";
      case "emerald":
        return "hover:text-emerald-400";
      case "teal":
        return "hover:text-teal-400";
      default:
        return "hover:text-slate-300";
    }
  };

  // Explicit group-hover classes for JIT
  const getIconHoverClass = () => {
    switch (color) {
      case "cyan":
        return "group-hover:text-cyan-400";
      case "blue":
        return "group-hover:text-blue-400";
      case "indigo":
        return "group-hover:text-indigo-400";
      case "violet":
        return "group-hover:text-violet-400";
      case "purple":
        return "group-hover:text-purple-400";
      case "fuchsia":
        return "group-hover:text-fuchsia-400";
      case "pink":
        return "group-hover:text-pink-400";
      case "rose":
        return "group-hover:text-rose-400";
      case "red":
        return "group-hover:text-red-400";
      case "orange":
        return "group-hover:text-orange-400";
      case "amber":
        return "group-hover:text-amber-400";
      case "yellow":
        return "group-hover:text-yellow-400";
      case "lime":
        return "group-hover:text-lime-400";
      case "green":
        return "group-hover:text-green-400";
      case "emerald":
        return "group-hover:text-emerald-400";
      case "teal":
        return "group-hover:text-teal-400";
      default:
        return "group-hover:text-slate-300";
    }
  };

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded select-none group",
          isOpen ? getHeaderColor() : `text-slate-500 ${getHoverColor()}`,
        )}
      >
        <div className="flex items-center gap-2">
          <_Icon
            size={14}
            className={cn(
              "transition-colors duration-300",
              isOpen
                ? getHeaderColor()
                : `text-slate-600 ${getIconHoverClass()}`,
            )}
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
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            style={{ transformOrigin: "top" }}
            className="overflow-hidden px-1 pt-1"
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

export default function ToolboxPanel({
  addNode,
  activeBrowserId,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) {
  const { t } = useTranslation();

  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const isCollapsed =
    controlledIsCollapsed !== undefined
      ? controlledIsCollapsed
      : localIsCollapsed;

  const handleToggleCollapse = (eOrValue) => {
    // If called via onClick, eOrValue is an event object. Use toggle logic.
    // If called with an explicit boolean, use that value.
    const nextState = typeof eOrValue === "boolean" ? eOrValue : !isCollapsed;

    if (onToggleCollapse) {
      onToggleCollapse(nextState);
    } else {
      setLocalIsCollapsed(nextState);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const [openCategories, setOpenCategories] = useState({});

  // Filter Logic
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return NODE_CATEGORIES;

    const lowerSearch = searchTerm.toLowerCase();
    const result = {};

    Object.entries(NODE_CATEGORIES).forEach(([key, section]) => {
      const matchingNodes = section.nodes.filter((nodeId) => {
        const label = t(`nodes.labels.${nodeId}`).toLowerCase();
        return (
          label.includes(lowerSearch) ||
          nodeId.toLowerCase().includes(lowerSearch)
        );
      });

      if (matchingNodes.length > 0) {
        result[key] = {
          ...section,
          nodes: matchingNodes,
        };
      }
    });

    return result;
  }, [searchTerm, t]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const matches = Object.keys(filteredCategories);
      setOpenCategories((prev) => {
        const next = { ...prev };
        matches.forEach((m) => (next[m] = true));
        return next;
      });
    }
  }, [filteredCategories, searchTerm]);

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Helper for JIT-safe hover colors in collapsed sidebar
  const getSidebarHoverColor = (color) => {
    switch (color) {
      case "cyan":
        return "hover:text-cyan-400";
      case "blue":
        return "hover:text-blue-400";
      case "indigo":
        return "hover:text-indigo-400";
      case "violet":
        return "hover:text-violet-400";
      case "purple":
        return "hover:text-purple-400";
      case "fuchsia":
        return "hover:text-fuchsia-400";
      case "pink":
        return "hover:text-pink-400";
      case "rose":
        return "hover:text-rose-400";
      case "red":
        return "hover:text-red-400";
      case "orange":
        return "hover:text-orange-400";
      case "amber":
        return "hover:text-amber-400";
      case "yellow":
        return "hover:text-yellow-400";
      case "lime":
        return "hover:text-lime-400";
      case "green":
        return "hover:text-green-400";
      case "emerald":
        return "hover:text-emerald-400";
      case "teal":
        return "hover:text-teal-400";
      default:
        return "hover:text-slate-300";
    }
  };

  return (
    <aside aria-label="Toolbox">
      <Motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 280 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
        className={cn(
          "relative h-full flex flex-col shrink-0 font-sans glass-panel",
          "z-[var(--z-hud)]",
        )}
      >
        {/* HEADER */}
        <div className="h-14 flex items-center justify-center px-4 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar flex flex-col">
            {!isCollapsed ? (
              <>
                {/* Search */}
                <div className="relative mb-4 group">
                  <label htmlFor="toolbox-search" className="visually-hidden">
                    Search tools
                  </label>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                    size={14}
                    aria-hidden="true"
                  />
                  <input
                    id="toolbox-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("common.select_default", "Search tools...")}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="flex-1">
                  {!searchTerm.trim() && (
                    <ToolboxCategory
                      key="favorites"
                      categoryKey="favorites"
                      icon={Star}
                      color="amber"
                      nodes={[
                        "click",
                        "type_text",
                        "wait_visible",
                        "assert_page_text",
                      ]}
                      isOpen={!!openCategories["favorites"]}
                      onToggle={() => toggleCategory("favorites")}
                      t={t}
                      onAdd={addNode}
                    />
                  )}

                  {Object.entries(filteredCategories).map(([key, section]) => (
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
              </>
            ) : (
              <div className="flex flex-col gap-4 items-center mt-2">
                {Object.entries(NODE_CATEGORIES).map(([key, section]) => {
                  return (
                    <button
                      key={key}
                      title={t(`nodes.categories.${key}`)}
                      aria-label={t(`nodes.categories.${key}`)}
                      onClick={() => {
                        handleToggleCollapse(false);
                        toggleCategory(key);
                      }}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-white/10",
                        "text-slate-400", // Default color
                        getSidebarHoverColor(section.color),
                      )}
                    >
                      <section.icon size={18} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            )}
            {/* MINIMAP / SNIPPETS PLACEHOLDER */}
            {!isCollapsed && (
              <div className="shrink-0 mt-2 mx-3 mb-3 p-4 rounded-xl border border-dashed border-white/20 bg-slate-900/30 flex flex-col items-center justify-center text-center gap-2 text-slate-500 min-h-[160px]">
                <Map size={24} className="opacity-50" />
                <span className="text-xs font-medium">Mini-map / Snippets</span>
                <span className="text-[10px] opacity-70">Coming soon</span>
              </div>
            )}
          </div>


        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-[var(--border-ui)] shrink-0 bg-[var(--bg-panel)]">
          <button
            onClick={handleToggleCollapse}
            className={cn(
              "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-canvas)] transition-all group",
              isCollapsed && "justify-center",
            )}
            aria-label={isCollapsed ? "Expand toolbox" : "Collapse toolbox"}
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
    </aside>
  );
}
