import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Scissors,
  Trash2,
  PlusCircle,
  CopyPlus,
  Undo2,
  Redo2,
  MousePointer2,
  ChevronRight,
  Play,
  Globe,
  LayoutGrid,
  Box,
  Ungroup,
  Repeat,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { NODE_CATEGORIES } from "../config/nodeConstants";

// ==========================================
// 1. COMPONENT: CONTEXT MENU ITEM
// ==========================================
const ContextMenuItem = ({
  icon: Icon,
  label,
  shortcut,
  onClick,
  danger = false,
  disabled = false,
  hasSubmenu = false,
  onMouseEnter,
  isActive = false, // Highlight state for submenu parent
  iconClassName, // NEW: Custom color support
  className, // Support custom class override
}) => (
  <button
    onMouseEnter={onMouseEnter}
    role="menuitem"
    className={cn(
      "group relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-all mb-0.5",
      disabled
        ? "pointer-events-none opacity-30"
        : cn(
            "hover:bg-white/10 hover:text-white cursor-pointer text-slate-300",
            isActive && "bg-white/10 text-white",
          ),
      danger &&
        !disabled &&
        "text-rose-400 hover:text-rose-300 hover:bg-rose-500/20",
      className,
    )}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled && !hasSubmenu) {
        onClick?.(e);
      }
    }}
    disabled={disabled}
  >
    <div
      className={cn(
        "mr-3 flex h-4 w-4 items-center justify-center transition-transform group-hover:scale-110",
        danger ? "text-rose-400" : "text-slate-500 group-hover:text-slate-300",
        isActive && "text-slate-300",
        iconClassName,
      )}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
    </div>

    <span className="flex-1 text-left font-medium tracking-tight">{label}</span>

    {shortcut && (
      <span className="ml-4 text-[9px] tracking-widest text-slate-600 font-mono uppercase group-hover:text-slate-400 transition-colors">
        {shortcut}
      </span>
    )}

    {hasSubmenu && (
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="ml-auto text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5"
      />
    )}
  </button>
);

const Divider = () => <div className="my-1 h-px bg-zinc-800" />;

// ==========================================
// 2. COMPONENT: SUB-MENU
// ==========================================

const SmartMenuPanel = ({
  children,
  triggerRect,
  triggerRef,
  level = 1,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Use State instead of Ref to ensure we capture the element mount
  const [panelEl, setPanelEl] = useState(null);
  const [style, setStyle] = useState({ opacity: 0 });

  // Use LayoutEffect to prevent visual flash of wrong position
  React.useLayoutEffect(() => {
    // Resolve Rect: Either passed directly or derived from Ref
    let rectBase = triggerRect;
    if (!rectBase && triggerRef?.current) {
      rectBase = triggerRef.current.getBoundingClientRect();
    }

    if (panelEl && rectBase) {
      const rect = panelEl.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      // FIXED POSITION LOGIC
      // 1. HORIZONTAL
      // Default: Right side
      let left = rectBase.right - 10;

      const rightOverflow = left + rect.width > winWidth;
      const leftOverflow = left < 0;

      // Should we flip?
      if (rightOverflow && !leftOverflow) {
        // Try flipping left
        const leftPos = rectBase.left - rect.width + 10;
        // Verify if flipping left is actually better (doesn't overflow left too badly)
        if (leftPos > 0 || winWidth - left < leftPos + rect.width) {
          left = leftPos;
        }
      }

      // 2. VERTICAL
      let top = rectBase.top;
      if (top + rect.height > winHeight) {
        // Shift up to fit
        const overflowY = top + rect.height - winHeight + 10;
        top = top - overflowY;
      }

      // Final Safety Clamp
      left = Math.max(10, left);
      top = Math.max(10, top);

      setStyle({
        position: "fixed",
        zIndex: 99999 + level,
        left: `${left}px`,
        top: `${top}px`,
        opacity: 1,
      });
    }
  }, [triggerRect, triggerRef, level, panelEl]); // Depend on panelEl

  return createPortal(
    <div
      ref={setPanelEl} // Callback Ref trigger
      className="w-56 py-1 animate-in fade-in pointer-events-auto" // Removed hacks, ensured pointer-events
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => onMouseEnter?.()}
      onMouseLeave={onMouseLeave}
    >
      {/* THE INVISIBLE BRIDGE: Connects this panel to its trigger area */}
      <div className="absolute -left-6 top-0 w-6 h-full bg-transparent z-[-1]" />

      <div className="max-h-[60vh] overflow-y-auto no-scrollbar rounded-lg border border-[var(--border-ui)] bg-[var(--bg-panel)] backdrop-blur-xl p-1 shadow-2xl relative transition-all duration-300">
        {children}
      </div>
    </div>,
    document.body,
  );
};

// Simplified Category Item handling overflow internally
const CategoryItem = ({
  catKey,
  category,
  actions,
  parentMouseEnter,
  parentMouseLeave,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // CLICK-TO-LOCK State
  const [triggerRect, setTriggerRect] = useState(null);
  const itemRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Rect Stability Check helper
  const areRectsDifferent = (r1, r2) => {
    if (!r1 || !r2) return true;
    return (
      Math.abs(r1.top - r2.top) > 1 ||
      Math.abs(r1.left - r2.left) > 1 ||
      Math.abs(r1.width - r2.width) > 1
    );
  };

  const handleMouseEnter = (e) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (e && e.currentTarget) {
      const newRect = e.currentTarget.getBoundingClientRect();
      if (areRectsDifferent(triggerRect, newRect)) {
        setTriggerRect(newRect);
      }
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isLocked) return; // Don't close if locked

    // Delay closing to allow moving mouse into the Portal
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // 300ms grace period
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    // Toggle Lock
    setIsLocked(!isLocked);
    // Ensure hover is true so it opens immediately
    if (!isLocked) {
      setIsHovered(true);
      if (e.currentTarget)
        setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
  };

  // COMBINED HANDLER: Keeps THIS item open AND keeps PARENT (Level 2) open
  const handlePortalEnter = () => {
    handleMouseEnter({}); // Keep self open
    parentMouseEnter?.(); // Keep parent open
  };

  const handlePortalLeave = () => {
    handleMouseLeave(); // Close self (delayed)
    parentMouseLeave?.(); // Close parent (delayed)
  };

  const isOpen = isHovered || isLocked;
  const hasNodes = category.nodes && category.nodes.length > 0;

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick} // Helper for Click-to-Lock
    >
      <ContextMenuItem
        icon={category.icon}
        label={t("nodes.categories." + catKey, category.label)}
        hasSubmenu
        isActive={isOpen}
      />
      {isOpen && triggerRect && (
        <SmartMenuPanel
          triggerRect={triggerRect}
          level={3} // Level 3: Nodes
          onMouseEnter={handlePortalEnter} // RECURSIVE KEEP ALIVE
          onMouseLeave={handlePortalLeave}
        >
          {hasNodes ? (
            category.nodes.map((nodeType) => (
              <ContextMenuItem
                key={nodeType}
                label={t(
                  "nodes.labels." + nodeType,
                  nodeType
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                )}
                icon={category.icon} // REUSE CATEGORY ICON FOR NODES
                onClick={() => {
                  actions.createNode(nodeType);
                  onClose?.(); // CLOSE MENU ON SELECTION
                }}
              />
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-zinc-500 italic">
              {t("context_menu.no_nodes_found", "No nodes found")}
            </div>
          )}
        </SmartMenuPanel>
      )}
    </div>
  );
};

const SubMenu = ({
  actions,
  triggerRef,
  triggerRect,
  onMouseEnter,
  onMouseLeave,
  onClose,
}) => {
  const { t } = useTranslation();
  const RELEVANT_CATEGORIES = [
    "browser_management",
    "user_simulation",
    "dom_manipulation",
    "synchronization",
    "network_control",
    "diagnostics",
    "flow_control",
  ];

  // Level 2: Categories (Now a Portal too!)
  return (
    <SmartMenuPanel
      triggerRef={triggerRef}
      triggerRect={triggerRect}
      level={2}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
        {t("context_menu.node_categories", "Node Categories")}
      </div>

      {RELEVANT_CATEGORIES.map((catKey) => {
        const category = NODE_CATEGORIES[catKey];
        if (!category) return null;
        return (
          <CategoryItem
            key={catKey}
            catKey={catKey}
            category={category}
            actions={actions}
            parentMouseEnter={onMouseEnter} // Pass down keep-alive
            parentMouseLeave={onMouseLeave}
            onClose={onClose} // PASS ONCLOSE DOWN
          />
        );
      })}
    </SmartMenuPanel>
  );
};

// Helper Component for the Add Node Trigger to manage its own hover state and refs
const AddNodeTrigger = ({ actions, onClose }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null); // Store rect in state for stability
  const triggerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (e && e.currentTarget) {
      setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isLocked) return;
    // Delay closing to allow moving mouse into the Level 2 Portal
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLocked(!isLocked);
    if (!isLocked) {
      // If becoming locked, ensure open
      setIsHovered(true);
      if (e.currentTarget)
        setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
  };

  const isOpen = isHovered || isLocked;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <ContextMenuItem
        icon={PlusCircle}
        label={t("context_menu.add_node", "Add Node")}
        hasSubmenu
        isActive={isOpen}
        iconClassName="text-blue-400"
      />
      {isOpen && triggerRect && (
        <SubMenu
          actions={actions}
          triggerRect={triggerRect} // Pass concrete value
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClose={onClose} // PASS ONCLOSE DOWN
        />
      )}
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================
import { getNodeConfig } from "../config/nodeConstants";

const ContextMenu = ({
  x,
  y,
  type,
  data,
  onClose,
  actions,
  recentNodes = [],
}) => {
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  // Focus search on mount if canvas type
  useEffect(() => {
    if (type === "canvas" && searchRef.current) {
      searchRef.current.focus();
    }
  }, [type]);

  // Auto-position logic
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();

      let finalX = x;
      let finalY = y;

      if (x + rect.width > window.innerWidth) finalX = x - rect.width;
      if (y + rect.height > window.innerHeight) finalY = y - rect.height;

      menu.style.left = `${finalX}px`;
      menu.style.top = `${finalY}px`;
    }
  }, [x, y, searchTerm]); // Reposition when size changes due to search

  // Close handlers
  useEffect(() => {
    const handleClick = (e) =>
      !menuRef.current?.contains(e.target) && onClose();
    const handleKeyDown = (e) => e.key === "Escape" && onClose();

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // --- SEARCH FILTER LOGIC ---
  const filteredNodes = React.useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const results = [];

    Object.values(NODE_CATEGORIES).forEach((cat) => {
      cat.nodes.forEach((nodeType) => {
        if (nodeType.toLowerCase().includes(term)) {
          results.push({
            type: nodeType,
            label: nodeType
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            category: cat,
          });
        }
      });
    });
    return results;
  }, [searchTerm]);

  const getColorClass = (colorName) => {
    const map = {
      blue: "text-blue-400",
      cyan: "text-cyan-400",
      emerald: "text-emerald-400",
      rose: "text-rose-400",
      orange: "text-orange-400",
      purple: "text-purple-400",
      yellow: "text-yellow-400",
      lime: "text-lime-400",
      pink: "text-pink-400",
      indigo: "text-indigo-400",
      slate: "text-slate-400",
    };
    return map[colorName] || "text-zinc-400";
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      className={cn(
        "fixed z-[10001] min-w-[240px] rounded-xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-400",
        "animate-in fade-in zoom-in-95 origin-top-left border-t-white/20",
      )}
      style={{ left: x, top: y }}
    >
      {/* --- CANVAS CONTEXT: SEARCH BAR --- */}
      {type === "canvas" && (
        <div className="mb-2 px-1">
          <input
            ref={searchRef}
            type="text"
            placeholder={t(
              "context_menu.search_node_placeholder",
              "Search node...",
            )}
            aria-label="Search node type"
            className="w-full bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 placeholder:text-[var(--text-muted)] transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* --- SEARCH RESULTS --- */}
      {searchTerm ? (
        <div className="max-h-[300px] overflow-y-auto no-scrollbar">
          {filteredNodes.length > 0 ? (
            filteredNodes.map((item) => (
              <ContextMenuItem
                key={item.type}
                label={t("nodes.labels." + item.type, item.label)}
                icon={item.category.icon}
                // Apply Category Color Logic
                className={cn("!py-2")} // slightly taller
                isActive={false}
                onClick={() => actions.createNode(item.type)}
                iconClassName={getColorClass(item.category.color)}
              />
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--text-muted)] text-center italic">
              {t("context_menu.no_nodes_found", "No nodes found")}
            </div>
          )}
        </div>
      ) : (
        // --- STANDARD MENUS ---
        <>
          {/* --- QUICK ACCESS (RECENT) --- */}
          {type === "canvas" && recentNodes.length > 0 && (
            <>
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-70">
                {t("context_menu.quick_access", "Quick Access")}
              </div>
              {recentNodes.map((nodeType) => {
                const config = getNodeConfig(nodeType);
                return (
                  <ContextMenuItem
                    key={nodeType}
                    label={t("nodes.labels." + nodeType, config.label)}
                    icon={config.icon}
                    onClick={() => actions.createNode(nodeType)}
                    iconClassName={getColorClass(config.color)}
                  />
                );
              })}
              <Divider />
            </>
          )}

          {/* --- NODE CONTEXT --- */}
          {type === "node" && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] truncate flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {data?.data?.label ||
                  t("context_menu.selected_node", "Selected Node")}
              </div>
              <Divider />
              {/* UNGROUP OPTION FOR COMPONENTS */}
              {(data?.type === "component" ||
                data?.data?.type === "component" ||
                data?.type === "loop" ||
                data?.data?.type === "loop") && (
                <>
                  <ContextMenuItem
                    icon={MousePointer2}
                    label={t("context_menu.dive_in", "Dive In")}
                    onClick={() => actions.diveIn(data.id)}
                    iconClassName="text-indigo-400"
                  />
                  <ContextMenuItem
                    icon={Ungroup}
                    label={t("context_menu.ungroup", "Ungroup")}
                    shortcut="^⇧G"
                    onClick={() => actions.ungroup?.()}
                  />
                  <Divider />
                </>
              )}
              <ContextMenuItem
                icon={Play}
                label={t("context_menu.run_node", "Run Node")}
                onClick={() => actions.runNode(data.id)}
              />
              <ContextMenuItem
                icon={ChevronRight}
                label={t("context_menu.next_node", "Next Node")}
                onClick={() => actions.selectNext(data.id)}
              />
              <ContextMenuItem
                icon={ChevronRight}
                label={t("context_menu.prev_node", "Previous Node")}
                className="rotate-180"
                onClick={() => actions.selectPrev(data.id)}
              />
              <Divider />
              <ContextMenuItem
                icon={Play}
                label={t("context_menu.execute_from_here", "Execute from here")}
                onClick={() => {}}
                disabled
              />
              <ContextMenuItem
                icon={EyeOff}
                label={
                  data?.data?.disabled
                    ? t("context_menu.enable_node", "Enable Node")
                    : t("context_menu.disable_node", "Disable Node")
                }
                onClick={() => actions.toggleDisabled(data.id)}
              />
              <ContextMenuItem
                icon={EyeOff}
                label={t(
                  "context_menu.enable_downstream",
                  "Enable Downstream Segment",
                )}
                onClick={() => actions.setSegmentDisabled(data.id, false)}
              />
              <ContextMenuItem
                icon={EyeOff}
                label={t(
                  "context_menu.disable_downstream",
                  "Disable Downstream Segment",
                )}
                onClick={() => actions.setSegmentDisabled(data.id, true)}
              />
              <Divider />
              <ContextMenuItem
                icon={Copy}
                label={t("context_menu.copy", "Copy")}
                shortcut="⌘C"
                onClick={actions.copy}
              />
              <ContextMenuItem
                icon={CopyPlus}
                label={t("context_menu.duplicate", "Duplicate")}
                shortcut="⌘D"
                onClick={actions.duplicate}
              />
              <Divider />
              <ContextMenuItem
                icon={Trash2}
                label={t("context_menu.delete", "Delete")}
                shortcut="Del"
                danger
                onClick={actions.delete}
              />
            </>
          )}

          {/* --- CANVAS CONTEXT --- */}
          {type === "canvas" && (
            <>
              {/* Wrapper for Add Node trigger logic */}
              <AddNodeTrigger actions={actions} onClose={onClose} />

              <ContextMenuItem
                icon={LayoutGrid}
                label={t("context_menu.clean_layout", "Clean Layout")}
                onClick={actions.cleanLayout}
              />
              <Divider />
              <ContextMenuItem
                icon={MousePointer2}
                label={t("context_menu.select_all", "Select All")}
                shortcut="⌘A"
                onClick={actions.selectAll}
              />
              <ContextMenuItem
                icon={Copy}
                label={t("context_menu.paste", "Paste")}
                shortcut="⌘V"
                onClick={actions.paste}
                disabled={!actions.canPaste}
              />
              <Divider />
              <ContextMenuItem
                icon={Undo2}
                label={t("context_menu.undo", "Undo")}
                shortcut="⌘Z"
                onClick={actions.undo}
                disabled={!actions.canUndo}
              />
              <ContextMenuItem
                icon={Redo2}
                label={t("context_menu.redo", "Redo")}
                shortcut="⌘Y"
                onClick={actions.redo}
                disabled={!actions.canRedo}
              />
            </>
          )}

          {/* --- SELECTION CONTEXT --- */}
          {type === "selection" && (
            <>
              <div className="px-2 py-1 text-xs text-zinc-500">
                {t("context_menu.items_selected", {
                  count: data?.nodes?.length,
                  defaultValue: "{{count}} items selected",
                })}
              </div>
              <Divider />
              {/* Ungroup if selection has components (simplified: just show if action available) */}
              <ContextMenuItem
                icon={Box}
                label={t("context_menu.group_selection", "Group Selection")}
                shortcut="^G"
                onClick={actions.group}
              />
              <ContextMenuItem
                icon={Repeat}
                label={t("context_menu.iterate_selection", "Iterate Selection")}
                onClick={actions.loopSelection}
              />
              <ContextMenuItem
                icon={EyeOff}
                label={t(
                  "context_menu.toggle_selection",
                  "Disable / Enable Selection",
                )}
                onClick={() => actions.toggleDisabled()}
              />
              <ContextMenuItem
                icon={Ungroup}
                label={t("context_menu.ungroup", "Ungroup")}
                shortcut="^⇧G"
                onClick={() => actions.ungroup?.()}
              />
              <ContextMenuItem
                icon={Copy}
                label={t("context_menu.copy", "Copy")}
                shortcut="⌘C"
                onClick={actions.copy}
              />
              <ContextMenuItem
                icon={Trash2}
                label={t("context_menu.delete", "Delete")}
                shortcut="Del"
                danger
                onClick={actions.delete}
              />
            </>
          )}

          {/* --- EDGE CONTEXT --- */}
          {type === "edge" && (
            <ContextMenuItem
              icon={Trash2}
              label={t("context_menu.delete_connection", "Delete Connection")}
              shortcut="Del"
              danger
              onClick={actions.delete}
            />
          )}
        </>
      )}
    </div>,
    document.body,
  );
};

export default ContextMenu;
