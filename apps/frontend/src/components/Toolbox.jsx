import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NODE_CATEGORIES,
  CATEGORY_STYLES,
  getColorTextClass,
  getColorHoverClass,
  getColorGroupHoverClass,
} from "@/config/nodeConstants";
import HALQuote from "./HALQuote";

const ToolboxItem = ({ label, nodeId, color, onAdd }) => {
  // Select styles based on color theme, fallback to slate
  const theme = CATEGORY_STYLES[color] || CATEGORY_STYLES.slate;
  const hoverTextClass = getColorGroupHoverClass(color);

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
          hoverTextClass, // Apply color on hover
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
  // Use centralized color utilities — no hardcoded switch statements
  const headerColorClass = getColorTextClass(color);
  const hoverColorClass = getColorHoverClass(color);
  const iconHoverClass = getColorGroupHoverClass(color);

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded select-none group",
          isOpen ? headerColorClass : `text-slate-500 ${hoverColorClass}`,
        )}
      >
        <div className="flex items-center gap-2">
          <_Icon
            size={14}
            className={cn(
              "transition-colors duration-300",
              isOpen ? headerColorClass : `text-slate-600 ${iconHoverClass}`,
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

export default function ToolboxPanel({ addNode, favoriteNodes = [] }) {
  const { t } = useTranslation();

  const [isMinimized, setIsMinimized] = useState(false);

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

  const getHoverColor = (c) => getColorHoverClass(c);

  const WIDTH_EXPANDED = 280;
  const WIDTH_COLLAPSED = 48;

  return (
    <aside aria-label="Toolbox">
      <Motion.div
        initial={false}
        animate={{ width: isMinimized ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative h-full flex flex-col shrink-0 font-sans glass-panel",
          "z-[var(--z-hud)]",
        )}
      >
        {isMinimized ? (
          <div className="flex flex-col items-center pt-3 gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              title="Toolbox"
              aria-label="Toolbox"
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 mb-1"
            >
              <Box size={18} />
            </button>
            {Object.entries(NODE_CATEGORIES).map(([key, section]) => (
              <button
                key={key}
                title={t(`nodes.categories.${key}`)}
                aria-label={t(`nodes.categories.${key}`)}
                onClick={() => {
                  setIsMinimized(false);
                  setTimeout(() => toggleCategory(key), 50);
                }}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-white/10",
                  "text-slate-400",
                  getHoverColor(section.color),
                )}
              >
                <section.icon size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
              <div className="w-full flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                  <Box size={16} className="text-indigo-400" />
                </div>
                <span className="font-bold text-sm tracking-wide text-slate-100">
                  TOOLBOX
                </span>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar flex flex-col">
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
                  {!searchTerm.trim() && favoriteNodes.length > 0 && (
                    <ToolboxCategory
                      key="favorites"
                      categoryKey="favorites"
                      icon={Star}
                      color="amber"
                      nodes={favoriteNodes}
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
                {!searchTerm.trim() && <HALQuote />}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-3 border-t border-[var(--border-ui)] shrink-0 bg-[var(--bg-panel)]">
              <button
                onClick={() => setIsMinimized(true)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-canvas)] transition-all group"
              >
                <ChevronLeft size={16} />
                <span className="text-xs font-medium">
                  {t("common.hide_panel", "Hide Panel")}
                </span>
              </button>
            </div>
          </>
        )}
      </Motion.div>
    </aside>
  );
}
