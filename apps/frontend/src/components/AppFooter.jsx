import React, { memo, useState, useRef, useEffect } from "react";
import {
  Play,
  Save,
  Folder,
  GitBranch,
  ChevronDown,
  Plus,
  Check,
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
      "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95",
    outline:
      "border border-white/10 text-slate-300 hover:bg-white/5 active:scale-95",
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {Icon && <Icon size={14} />}
      {label && <span>{label}</span>}
    </button>
  );
};

const SelectorButton = ({ icon: _Icon, label, subLabel, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group h-full focus:outline-none",
      isActive && "bg-white/5",
    )}
  >
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

const GlassMenu = ({ items, onItemClick, activeId, type, onNew }) => (
  <Motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="absolute bottom-20 left-0 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[240px] z-50 flex flex-col p-1"
  >
    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
      {items && items.length > 0 ? (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group",
              item.id === activeId
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <span className="truncate">{item.name}</span>
            {item.id === activeId && (
              <Check size={12} className="text-indigo-400" />
            )}
          </button>
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

function AppFooter({
  projectName,
  projects = [], // Array of projects
  onSwitchProject,
  onNewProject,
  flowName,
  flows = [], // Array of flows
  onSwitchFlow,
  onNewFlow,
  onRun,
  onSave,
  version = "v1.0.0",
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

  return (
    <div
      ref={containerRef}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
    >
      {/* MENUS POPUP ABOVE */}
      <AnimatePresence>
        {activeMenu === "project" && (
          <GlassMenu
            type="Project"
            items={projects}
            activeId={activeProjectId}
            onItemClick={handleProjectSwitch}
            onNew={() => {
              onNewProject?.();
              setActiveMenu(null);
            }}
          />
        )}
        {activeMenu === "flow" && (
          <GlassMenu
            type="Flow"
            items={flows}
            activeId={activeFlowId}
            onItemClick={handleFlowSwitch}
            onNew={() => {
              onNewFlow?.();
              setActiveMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "flex items-center h-16 pl-2 pr-4 rounded-full border border-white/10",
          "bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl shadow-black/50 relative z-50",
        )}
      >
        {/* SECTION 1: PROJECT SELECTOR */}
        <SelectorButton
          icon={Folder}
          label="Project"
          subLabel={projectName}
          isActive={activeMenu === "project"}
          onClick={() => toggleMenu("project")}
        />

        {/* DIVIDER */}
        <div className="h-8 w-px bg-white/10 mx-1" />

        {/* SECTION 2: FLOW SELECTOR */}
        <SelectorButton
          icon={GitBranch}
          label="Flow"
          subLabel={flowName}
          isActive={activeMenu === "flow"}
          onClick={() => toggleMenu("flow")}
        />

        {/* DIVIDER */}
        <div className="h-8 w-px bg-white/10 mx-4" />

        {/* SECTION 3: ACTIONS */}
        <div className="flex items-center gap-3">
          <FooterButton
            icon={Play}
            label="RUN"
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
        </div>

        {/* SECTION 4: STATUS (Right Edge) */}
        <div className="ml-6 flex items-center gap-2 pl-6 border-l border-white/5 h-full opacity-50 hover:opacity-100 transition-opacity select-none">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[10px] font-mono text-slate-400">
            {version}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(AppFooter);
