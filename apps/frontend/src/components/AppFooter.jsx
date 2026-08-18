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
  Repeat,
  Database,
  Activity,
  Lock,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useExecutionStore } from "@/stores/useExecutionStore";
import { useSettings } from "@/context/SettingsContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { cn } from "@/lib/utils";
import { motion as Motion, AnimatePresence } from "framer-motion";

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
    primary_performance:
      "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 dark:shadow-[0_0_20px_rgba(37,99,235,0.5)]",
    primary_security:
      "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 active:scale-95 dark:shadow-[0_0_20px_rgba(220,38,38,0.5)] shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    outline:
      "border border-white/10 text-slate-300 hover:bg-white/5 active:scale-95",
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(baseStyles, variants[variant], className)}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
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
    aria-expanded={isActive}
    aria-label={`${label}: ${subLabel}`}
    className={cn(
      "relative flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group h-full focus:outline-none",
      isActive && "bg-white/5",
    )}
  >
    {/* Unsaved Indicator */}
    {hasUnsavedChanges && (
      <div
        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"
        aria-label="Unsaved changes"
        role="status"
      />
    )}
    <div
      className={cn(
        "p-1.5 rounded-full transition-colors",
        isActive
          ? "bg-indigo-500/20 text-indigo-300"
          : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300",
      )}
    >
      <_Icon size={14} aria-hidden="true" />
    </div>
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider leading-none">
        {label}
      </span>
      <div className="flex items-center gap-1 text-xs font-medium text-slate-200 group-hover:text-white">
        <span className="max-w-[100px] truncate">{subLabel}</span>
        <ChevronDown
          size={10}
          aria-hidden="true"
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
      role="menuitem"
      tabIndex={0}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group cursor-pointer relative",
        isActive
          ? "bg-indigo-500/20 text-indigo-300"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
      onClick={handleDisplayClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleDisplayClick();
        }
      }}
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
  const loopItems = isFlowMenu ? items.filter((i) => i.type === "loop") : [];

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      role="menu"
      aria-label={`${type} menu`}
      className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[240px] flex flex-col p-1 mb-1"
    >
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
        {isFlowMenu
          ? (() => {
              const renderedIds = new Set();
              return (
                <>
                  {mainItems.length > 0 && (
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Main Flows
                    </div>
                  )}
                  {mainItems.map((item) => {
                    if (renderedIds.has(item.id)) return null;
                    renderedIds.add(item.id);
                    return (
                      <MenuOption
                        key={item.id}
                        item={item}
                        isActive={item.id === activeId}
                        onClick={onItemClick}
                        onRename={onRename}
                        onDelete={onDelete}
                        icon={GitBranch}
                      />
                    );
                  })}

                  {componentItems.length > 0 && (
                    <>
                      <div className="my-1 border-t border-white/5" />
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Components
                      </div>
                      {componentItems.map((item) => {
                        if (renderedIds.has(item.id)) return null;
                        renderedIds.add(item.id);
                        return (
                          <MenuOption
                            key={item.id}
                            item={item}
                            isActive={item.id === activeId}
                            onClick={onItemClick}
                            onRename={onRename}
                            onDelete={onDelete}
                            icon={Box}
                          />
                        );
                      })}
                    </>
                  )}

                  {loopItems.length > 0 && (
                    <>
                      <div className="my-1 border-t border-white/5" />
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Loops
                      </div>
                      {loopItems.map((item) => {
                        if (renderedIds.has(item.id)) return null;
                        renderedIds.add(item.id);
                        return (
                          <MenuOption
                            key={item.id}
                            item={item}
                            isActive={item.id === activeId}
                            onClick={onItemClick}
                            onRename={onRename}
                            onDelete={onDelete}
                            icon={Repeat}
                          />
                        );
                      })}
                    </>
                  )}

                  {items.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                      No flows found
                    </div>
                  )}
                </>
              );
            })()
          : /* Standard Project List */
            (() => {
              const renderedIds = new Set();
              return items && items.length > 0 ? (
                items.map((item) => {
                  if (renderedIds.has(item.id)) return null;
                  renderedIds.add(item.id);
                  return (
                    <MenuOption
                      key={item.id}
                      item={item}
                      isActive={item.id === activeId}
                      onClick={onItemClick}
                      onRename={onRename}
                      onDelete={onDelete}
                      icon={Folder}
                    />
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                  No items found
                </div>
              );
            })()}
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
  projects: _projects = [],
  onSwitchProject: _onSwitchProject,
  onNewProject: _onNewProject,
  onRenameProject: _onRenameProject,
  onDeleteProject: _onDeleteProject,
  flowName,
  flows = [],
  onSwitchFlow: _onSwitchFlow,
  onNewFlow: _onNewFlow,
  onRenameFlow: _onRenameFlow,
  onDeleteFlow: _onDeleteFlow,
  onRun,
  onSave,
  onShowImport,
  onShowExport,
  hasUnsavedChanges,
  _onResetEnvironment,
  version,
  onRunBatch,
  onRunDataset,
  apiStatus = { state: "idle" },
  isRemoteExecuting = false,
  remoteExecution = null,
  role = "owner",
  isCollaborative = false,
  executionMode = "calidad",
}) {
  const { t } = useTranslation();
  const isLocked = isRemoteExecuting || (isCollaborative && role !== "owner");

  // Find active flow for icon/label
  const activeFlow = flows?.find(
    (f) => f.name === flowName,
  );
  const activeFlowIcon =
    activeFlow?.type === "loop"
      ? Repeat
      : activeFlow?.type === "component"
        ? Box
        : GitBranch;
  const activeFlowLabel =
    activeFlow?.type === "loop"
      ? "Loop"
      : activeFlow?.type === "component"
        ? "Component"
        : "Flow";

  const globalExecutionStatus = useExecutionStore((s) => s.status);
  const draftMode = useExecutionStore((s) => s.draftMode);
  const setDraftMode = useExecutionStore((s) => s.setDraftMode);

  const isRunning =
    apiStatus.state === "running" || globalExecutionStatus === "running";

  const {
    autoHealingEnabled,
    setAutoHealingEnabled,
    autoHealingRetryLimit,
    setAutoHealingRetryLimit,
    isAIConfigured,
  } = useSettings();

  const handleCancelOrResetRun = async () => {
    const activeRunId = useExecutionStore.getState().activeRunId;
    if (activeRunId) {
      try {
        const { api } = await import("@/utils/api");
        await api.post(`/runs/${activeRunId}/cancel`);
      } catch (err) {
        console.warn("Could not cancel run on backend", err);
      }
    }
    useExecutionStore.getState().finishExecution({ status: "cancelled" });
  };

  // Decoupled button configurations based on execution/view mode
  const getButtonConfig = () => {
    if (isLocked) {
      return {
        icon: Lock,
        label: isCollaborative && role !== "owner" ? "OWNER ONLY" : "LOCKED",
        variant: "outline",
        tooltip:
          isCollaborative && role !== "owner"
            ? "Only the flow owner can execute it."
            : `Locked: ${remoteExecution?.user?.name || "Another user"} is executing...`,
        className: "border-amber-500/30 text-amber-500 hover:bg-transparent",
      };
    }

    if (isRunning) {
      return {
        icon: RefreshCw,
        label: t("canvas.running", "RUNNING... (CANCELAR)"),
        variant: "outline",
        tooltip:
          "Haz clic para cancelar la ejecución y desbloquear la interfaz.",
        className:
          "border-amber-500/50 text-amber-400 hover:bg-amber-500/20 cursor-pointer animate-pulse",
      };
    }

    switch (executionMode) {
      case "performance":
        return {
          icon: Activity,
          label: t("canvas.run_performance", "Run Performance"),
          variant: "primary_performance",
          tooltip: t(
            "canvas.tooltip_run_performance",
            "Run performance latency test flow",
          ),
          className: "",
        };
      case "seguridad":
        return {
          icon: Shield,
          label: t("canvas.run_security", "Run Security"),
          variant: "primary_security",
          tooltip: t(
            "canvas.tooltip_run_security",
            "Run security auditor scanner flow",
          ),
          className: "",
        };
      case "calidad":
      default:
        return {
          icon: Play,
          label: t("canvas.run_automation", "Run Automation"),
          variant: "primary",
          tooltip: t(
            "canvas.tooltip_run_automation",
            "Run automation quality test flow",
          ),
          className: "",
        };
    }
  };

  const btnConfig = getButtonConfig();

  return (
    <div className="w-full h-14 flex items-center justify-between px-2 md:px-4 glass-panel z-[var(--z-hud)] relative rounded-none border-t border-white/5">
      {/* LEFT: Project & Flow Info (Compact - selectors moved to Explorer) */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Project indicator */}
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <Folder size={12} className="text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="text-slate-500 font-mono uppercase tracking-wider text-[10px] hidden md:inline">Project</span>
          <span className="text-slate-300 font-medium truncate max-w-[100px] md:max-w-[150px]">
            {projectName || "—"}
          </span>
        </div>

        <div className="h-8 w-px bg-white/10" role="separator" aria-orientation="vertical" />

        {/* Flow indicator */}
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          {activeFlowIcon && <activeFlowIcon size={12} className="text-indigo-400 shrink-0" aria-hidden="true" />}
          <span className="text-slate-500 font-mono uppercase tracking-wider text-[10px] hidden md:inline">{activeFlowLabel}</span>
          <span className={cn(
            "font-medium truncate max-w-[100px] md:max-w-[200px]",
            flowName ? "text-slate-300" : "text-slate-600 italic"
          )}>
            {flowName || "Select a flow"}
          </span>
          {hasUnsavedChanges && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" aria-label="Unsaved changes" />
          )}
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

        <div
          className="h-6 w-px bg-white/10 mx-2"
          role="separator"
          aria-orientation="vertical"
        />

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-white/10 bg-slate-950/80 text-xs">
          <span className="uppercase tracking-[0.25em] text-slate-400">
            Draft
          </span>
          <Switch
            checked={draftMode}
            onCheckedChange={setDraftMode}
            aria-label="Enable Draft Mode"
            title="Tolerant Design Mode: Relaxes strict validations and skips auto-healing to allow debugging incomplete flows."
          />
        </div>

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-white/10 bg-slate-950/80 text-xs">
          <span className="uppercase tracking-[0.25em] text-slate-400">
            Auto
          </span>
          <Switch
            checked={autoHealingEnabled}
            onCheckedChange={(checked) => {
              if (isAIConfigured) setAutoHealingEnabled(checked);
            }}
            disabled={!isAIConfigured || draftMode}
            aria-label="Enable auto healing"
            title={
              draftMode
                ? "Auto healing is forcibly disabled in Draft Mode"
                : isAIConfigured
                  ? "Enable auto healing"
                  : "AI provider/API is not configured"
            }
          />
          <Select
            value={String(autoHealingRetryLimit)}
            onValueChange={(value) => setAutoHealingRetryLimit(Number(value))}
            disabled={!autoHealingEnabled || !isAIConfigured || draftMode}
          >
            <SelectTrigger
              className={cn(
                "min-w-[2.75rem] h-8 bg-slate-950 border-slate-800 text-xs",
                (!autoHealingEnabled || draftMode) && "opacity-50",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map((retry) => (
                <SelectItem key={retry} value={String(retry)}>
                  {retry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FooterButton
          icon={Database}
          label="RUN DATASET"
          variant="outline"
          onClick={onRunDataset}
          className="pl-3 pr-4 py-2 hover:bg-emerald-500/10 hover:text-emerald-400 border-emerald-500/20"
        />
        <FooterButton
          icon={RefreshCw}
          label="RUN BATCH"
          variant="outline"
          onClick={onRunBatch}
          className="pl-3 pr-4 py-2 hover:bg-yellow-500/10 hover:text-yellow-400 border-yellow-500/20"
        />

        <FooterButton
          icon={btnConfig.icon}
          label={btnConfig.label}
          variant={btnConfig.variant}
          onClick={isLocked ? null : isRunning ? handleCancelOrResetRun : onRun}
          title={btnConfig.tooltip}
          className={cn(
            "pl-4 pr-5 py-2",
            isLocked &&
              "opacity-75 cursor-not-allowed grayscale pointer-events-none",
            btnConfig.className,
          )}
        />

        <button
          onClick={onSave}
          className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-white/5"
          title="Save Flow (Ctrl+S)"
          aria-label="Save Flow (Ctrl+S)"
        >
          <Save size={18} aria-hidden="true" />
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
