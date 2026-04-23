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
    className={cn(
      "group relative flex w-full cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-all",
      disabled
        ? "pointer-events-none opacity-40"
        : cn(
            "hover:bg-[var(--border-color)] hover:text-[var(--text-main)] cursor-pointer text-[var(--text-main)]",
            isActive && "bg-[var(--border-color)] text-[var(--text-main)]",
          ),
      danger &&
        !disabled &&
        "text-rose-500 hover:text-rose-400 hover:bg-rose-500/10",
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
        "mr-2 flex h-4 w-4 items-center justify-center",
        danger ? "text-rose-500" : "text-zinc-400 group-hover:text-zinc-300",
        isActive && "text-zinc-300",
        iconClassName, // Apply custom color if provided
      )}
    >
      {Icon && <Icon size={15} />}
    </div>

    <span className="flex-1 text-left text-zinc-300 group-hover:text-zinc-100 font-medium">
      {label}
    </span>

    {shortcut && (
      <span className="ml-4 text-[10px] tracking-wider text-zinc-500 font-mono">
        {shortcut}
      </span>
    )}

    {hasSubmenu && (
      <ChevronRight
        size={14}
        className="ml-auto text-zinc-500 group-hover:text-zinc-300"
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
  category,
  actions,
  parentMouseEnter,
  parentMouseLeave,
  onClose,
}) => {
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
        label={category.label}
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
                label={nodeType
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                icon={category.icon} // REUSE CATEGORY ICON FOR NODES
                onClick={() => {
                  actions.createNode(nodeType);
                  onClose?.(); // CLOSE MENU ON SELECTION
                }}
              />
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-zinc-500 italic">
              No nodes available
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
        Node Categories
      </div>

      {RELEVANT_CATEGORIES.map((catKey) => {
        const category = NODE_CATEGORIES[catKey];
        if (!category) return null;
        return (
          <CategoryItem
            key={catKey}
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
        label="Add Node"
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

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[10001] min-w-[220px] rounded-lg border border-[var(--border-ui)] bg-[var(--bg-panel)] backdrop-blur-xl p-1.5 shadow-2xl transition-all duration-400",
        "animate-in fade-in zoom-in-95 origin-top-left",
      )}
      style={{ left: x, top: y }}
    >
      {/* --- CANVAS CONTEXT: SEARCH BAR --- */}
      {type === "canvas" && (
        <div className="mb-2 px-1">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search node..."
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
                label={item.label}
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
              No nodes found
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
                Quick Access
              </div>
              {recentNodes.map((nodeType) => {
                const config = getNodeConfig(nodeType);
                return (
                  <ContextMenuItem
                    key={nodeType}
                    label={config.label}
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
                {data?.data?.label || "Selected Node"}
              </div>
              <Divider />
              {/* UNGROUP OPTION FOR COMPONENTS */}
              {(data?.type === "component" ||
                data?.data?.type === "component" ||
                data?.type === "loop" ||
                data?.data?.type === "loop") && (
                <>
                  <ContextMenuItem
                    icon={Ungroup}
                    label="Ungroup"
                    shortcut="^⇧G"
                    onClick={() => actions.ungroup?.()}
                  />
                  <Divider />
                </>
              )}
              <ContextMenuItem
                icon={Play}
                label="Execute from here"
                onClick={() => {}}
                disabled
              />
              <ContextMenuItem
                icon={EyeOff}
                label={data?.data?.disabled ? "Enable Node" : "Disable Node"}
                onClick={() => actions.toggleDisabled(data.id)}
              />
              <ContextMenuItem
                icon={EyeOff}
                label="Enable Downstream Segment"
                onClick={() => actions.setSegmentDisabled(data.id, false)}
              />
              <ContextMenuItem
                icon={EyeOff}
                label="Disable Downstream Segment"
                onClick={() => actions.setSegmentDisabled(data.id, true)}
              />
              <Divider />
              <ContextMenuItem
                icon={Copy}
                label="Copy"
                shortcut="⌘C"
                onClick={actions.copy}
              />
              <ContextMenuItem
                icon={CopyPlus}
                label="Duplicate"
                shortcut="⌘D"
                onClick={actions.duplicate}
              />
              <Divider />
              <ContextMenuItem
                icon={Trash2}
                label="Delete"
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
                label="Clean Layout"
                onClick={actions.cleanLayout}
              />
              <Divider />
              <ContextMenuItem
                icon={MousePointer2}
                label="Select All"
                shortcut="⌘A"
                onClick={actions.selectAll}
              />
              <ContextMenuItem
                icon={Copy}
                label="Paste"
                shortcut="⌘V"
                onClick={actions.paste}
                disabled={!actions.canPaste}
              />
              <Divider />
              <ContextMenuItem
                icon={Undo2}
                label="Undo"
                shortcut="⌘Z"
                onClick={actions.undo}
                disabled={!actions.canUndo}
              />
              <ContextMenuItem
                icon={Redo2}
                label="Redo"
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
                {data?.nodes?.length} items selected
              </div>
              <Divider />
              {/* Ungroup if selection has components (simplified: just show if action available) */}
              <ContextMenuItem
                icon={Box}
                label="Group Selection"
                shortcut="^G"
                onClick={actions.group}
              />
              <ContextMenuItem
                icon={Repeat}
                label="Iterate Selection"
                onClick={actions.loopSelection}
              />
              <ContextMenuItem
                icon={EyeOff}
                label="Disable / Enable Selection"
                onClick={() => actions.toggleDisabled()}
              />
              <ContextMenuItem
                icon={Ungroup}
                label="Ungroup"
                shortcut="^⇧G"
                onClick={() => actions.ungroup?.()}
              />
              <ContextMenuItem
                icon={Copy}
                label="Copy"
                shortcut="⌘C"
                onClick={actions.copy}
              />
              <ContextMenuItem
                icon={Trash2}
                label="Delete"
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
              label="Delete Connection"
              shortcut="Del"
              danger
              onClick={actions.delete}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ContextMenu;
