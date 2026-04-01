import React, { memo, useState, useRef, useEffect } from "react";
import {
  Play,
  Save,
  Folder,
  GitBranch,
  ChevronDown,
  Plus,
  Check,
  Share2,
  Pencil,
  Trash2,
  X,
  Box,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion as Motion, AnimatePresence } from "motion/react";

const FooterButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  className,
}) => {
  const baseStyles =
    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-medium select-none";

  const variants = {
    ghost: "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95",
    primary:
      "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 dark:shadow-[0_0_20px_rgba(59,130,246,0.5)] shadow-[0_0_20px_rgba(245,158,11,0.5)]",
    outline:
      "border border-white/10 text-slate-300 hover:bg-white/5 active:scale-95",
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {Icon && <Icon size={14} />}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  );
};

const SelectorButton = ({
  icon: _Icon,
  label,
  subLabel,
  onClick,
  isActive,
  hasUnsavedChanges,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group h-full focus:outline-none",
      isActive && "bg-white/5",
    )}
  >
    {/* Unsaved Indicator */}
    {hasUnsavedChanges && (
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" />
    )}
    <div
      className={cn(
        "p-1.5 rounded-full transition-colors",
        isActive
          ? "bg-indigo-500/20 text-indigo-300"
          : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300",
      )}
    >
      <_Icon size={14} />
    </div>
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider leading-none">
        {label}
      </span>
      <div className="flex items-center gap-1 text-xs font-medium text-slate-200 group-hover:text-white">
        <span className="max-w-[100px] truncate">{subLabel}</span>
        <ChevronDown
          size={10}
          className={cn(
            "opacity-50 transition-transform duration-200",
            isActive && "rotate-180",
          )}
        />
      </div>
    </div>
  </button>
);

const MenuOption = ({
  item,
  isActive,
  onClick,
  onRename,
  onDelete,
  icon: Icon,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = (e) => {
    e.stopPropagation();
    if (editName.trim() && editName !== item.name) {
      onRename?.(item, editName);
    }
    setIsEditing(false);
  };

  const handleDisplayClick = () => {
    if (!isEditing) onClick(item);
  };

  if (isEditing) {
    return (
      <div className="w-full flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-indigo-500/30">
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave(e);
            if (e.key === "Escape") setIsEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none text-xs text-white focus:ring-0 focus:outline-none p-0"
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-400 hover:text-green-300"
        >
          <Check size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(false);
          }}
          className="p-1 text-red-400 hover:text-red-300"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group cursor-pointer relative",
        isActive
          ? "bg-indigo-500/20 text-indigo-300"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
      onClick={handleDisplayClick}
    >
      <div className="flex items-center gap-2 truncate">
        {Icon && (
          <Icon
            size={12}
            className={isActive ? "text-indigo-400" : "text-slate-500"}
          />
        )}
        <span className="truncate max-w-[140px]">{item.name}</span>
      </div>

      <div className="flex items-center gap-1">
        {isHovered && !item.readOnly && (
          <div className="flex items-center gap-1 mr-1">
            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Rename"
              >
                <Pencil size={10} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this?"))
                    onDelete(item);
                }}
                className="p-1 text-slate-400 hover:text-red-400 rounded"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        )}
        {isActive && !isHovered && (
          <Check size={12} className="text-indigo-400" />
        )}
      </div>
    </div>
  );
};

const GlassMenu = ({
  items,
  onItemClick,
  activeId,
  type,
  onNew,
  onRename,
  onDelete,
}) => {
  const isFlowMenu = type === "Flow";
  const mainItems = isFlowMenu
    ? items.filter((i) => !i.type || i.type === "main")
    : items;
  const componentItems = isFlowMenu
    ? items.filter((i) => i.type === "component")
    : [];

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[240px] flex flex-col p-1 mb-1"
    >
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
        {isFlowMenu ? (
          <>
            {mainItems.length > 0 && (
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Main Flows
              </div>
            )}
            {mainItems.map((item) => (
              <MenuOption
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                onClick={onItemClick}
                onRename={onRename}
                onDelete={onDelete}
                icon={GitBranch}
              />
            ))}

            {componentItems.length > 0 && (
              <>
                <div className="my-1 border-t border-white/5" />
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Components
                </div>
                {componentItems.map((item) => (
                  <MenuOption
                    key={item.id}
                    item={item}
                    isActive={item.id === activeId}
                    onClick={onItemClick}
                    onRename={onRename}
                    onDelete={onDelete}
                    icon={Box}
                  />
                ))}
              </>
            )}

            {items.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                No flows found
              </div>
            )}
          </>
        ) : // Standard Project List
        items && items.length > 0 ? (
          items.map((item) => (
            <MenuOption
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              onClick={onItemClick}
              onRename={onRename}
              onDelete={onDelete}
              icon={Folder}
            />
          ))
        ) : (
          <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
            No {type}s found
          </div>
        )}
      </div>

      {/* Footer for 'New' action */}
      <div className="border-t border-white/10 mt-1 pt-1 p-1">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
        >
          <div className="p-0.5 rounded border border-indigo-500/30">
            <Plus size={10} />
          </div>
          <span>Create New {type}...</span>
        </button>
      </div>
    </Motion.div>
  );
};

function AppFooter({
  projectName,
  projects = [], // Array of projects
  onSwitchProject,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  flowName,
  flows = [], // Array of flows
  onSwitchFlow,
  onNewFlow,
  onRenameFlow,
  onDeleteFlow,
  onRun,
  onSave,
  onShowImport,
  onShowExport,
  hasUnsavedChanges,
  _onResetEnvironment,
  version,
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'project' | 'flow' | null
  const containerRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleProjectSwitch = (p) => {
    onSwitchProject(p);
    setActiveMenu(null);
  };

  const handleFlowSwitch = (f) => {
    onSwitchFlow(f);
    setActiveMenu(null);
  };

  // Find active IDs safely
  const activeProjectId = projects?.find((p) => p.name === projectName)?.id;
  const activeFlowId = flows?.find((f) => f.name === flowName)?.id;

  const projectButtonRef = useRef(null);
  const flowButtonRef = useRef(null);

  // Calculate menu position
  const getMenuPosition = () => {
    if (activeMenu === "project" && projectButtonRef.current) {
      // Align with project button
      return { left: projectButtonRef.current.offsetLeft };
    }
    if (activeMenu === "flow" && flowButtonRef.current) {
      // Align with flow button
      return { left: flowButtonRef.current.offsetLeft };
    }
    return { left: 16 }; // Fallback
  };

  return (
    <div className="w-full h-14 flex items-center justify-between px-2 md:px-4 glass-panel z-[var(--z-hud)] relative rounded-none border-t border-white/5">
      {/* MENUS POPUP ABOVE - Adjusted position */}
      <AnimatePresence>
        {activeMenu === "project" && (
          <div
            style={{ ...getMenuPosition(), bottom: "100%" }}
            className="absolute z-50 pb-1"
          >
            <GlassMenu
              type="Project"
              items={projects}
              activeId={activeProjectId}
              onItemClick={handleProjectSwitch}
              onRename={onRenameProject}
              onDelete={onDeleteProject}
              onNew={() => {
                onNewProject?.();
                setActiveMenu(null);
              }}
            />
          </div>
        )}
        {activeMenu === "flow" && (
          <div
            style={{ ...getMenuPosition(), bottom: "100%" }}
            className="absolute z-50 pb-1"
          >
            <GlassMenu
              type="Flow"
              items={flows}
              activeId={activeFlowId}
              onItemClick={handleFlowSwitch}
              onRename={onRenameFlow}
              onDelete={onDeleteFlow}
              onNew={() => {
                onNewFlow?.();
                setActiveMenu(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* LEFT: Project & Flow Info */}
      <div className="flex items-center gap-1 md:gap-4">
        {/* SECTION 1: PROJECT SELECTOR */}
        <div ref={projectButtonRef}>
          <SelectorButton
            icon={Folder}
            label="Project"
            subLabel={projectName}
            isActive={activeMenu === "project"}
            onClick={() => toggleMenu("project")}
          />
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* SECTION 2: FLOW SELECTOR */}
        <div ref={flowButtonRef}>
          <SelectorButton
            icon={GitBranch}
            label="Flow"
            subLabel={flowName}
            isActive={activeMenu === "flow"}
            onClick={() => toggleMenu("flow")}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      </div>

      {/* CENTER: Status or Empty Space */}
      <div className="flex-1" />

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Import / Export */}
        <FooterButton
          icon={Folder}
          label="Import"
          variant="outline"
          onClick={onShowImport}
        />
        <FooterButton
          icon={Share2}
          label="Export"
          variant="outline"
          onClick={onShowExport}
        />

        <div className="h-6 w-px bg-white/10 mx-2" />

        <FooterButton
          icon={Play}
          label="RUN FLOW"
          variant="primary"
          onClick={onRun}
          className="pl-4 pr-5 py-2" // Bigger click area
        />

        <button
          onClick={onSave}
          className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-white/5"
          title="Save Flow (Ctrl+S)"
        >
          <Save size={18} />
        </button>

        {/* VERSION DISPLAY */}
        {version && (
          <div className="ml-2 px-2 py-1 rounded bg-white/5 border border-white/5">
            <span className="text-[10px] font-mono font-bold text-slate-500 tracking-tighter">
              {version}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AppFooter);
