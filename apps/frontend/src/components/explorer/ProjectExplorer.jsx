import ExplorerHeader from "./ExplorerHeader";
import SearchFilterBar from "./SearchFilterBar";
import FlowTreeList from "./FlowTreeList";
import ExplorerContextMenu from "./ExplorerContextMenu";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion as Motion, AnimatePresence } from "framer-motion";

const WIDTH_EXPANDED = 280;
const WIDTH_COLLAPSED = 48;

export default function ProjectExplorer({
  flows = [],
  projects = [],
  currentProject,
  currentFlowId,
  onSwitchProject,
  onRenameProject,
  onDeleteProject,
  onSwitchFlow,
  onNewProject,
  onNewFlow,
  onRenameFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onMoveFlowType,
  _onMoveFlowToFolder,
  onRunFlow,
}) {
  const { isOpen, togglePanel } = useExplorerStore();
  const { t } = useTranslation();

  return (
    <Motion.div
      initial={false}
      animate={{ width: isOpen ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative h-full flex flex-col shrink-0 font-sans",
        "z-[var(--z-hud)]",
        "border-r border-white/5 bg-[var(--bg-panel)]",
      )}
    >
      {isOpen ? (
        <>
          <ExplorerHeader
            projects={projects}
            currentProject={currentProject}
            onSwitchProject={onSwitchProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
            onNewProject={onNewProject}
            onNewFlow={onNewFlow}
          />

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <SearchFilterBar />
            <FlowTreeList
              flows={flows}
              currentFlowId={currentFlowId}
              onSwitchFlow={onSwitchFlow}
              onNewFlow={onNewFlow}
              onRenameFlow={onRenameFlow}
              onDeleteFlow={onDeleteFlow}
              onDuplicateFlow={onDuplicateFlow}
              onMoveFlowType={onMoveFlowType}
              onRunFlow={onRunFlow}
            />
          </div>

          <ExplorerContextMenu
            onRename={onRenameFlow}
            onDelete={onDeleteFlow}
            onDuplicate={onDuplicateFlow}
            onMoveFlowType={onMoveFlowType}
            onNewFlow={onNewFlow}
            onRun={onRunFlow}
          />

          <div className="p-3 border-t border-[var(--border-ui)] shrink-0 bg-[var(--bg-panel)]">
            <button
              onClick={togglePanel}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-canvas)] transition-all group"
            >
              <ChevronLeft size={16} />
              <span className="text-xs font-medium">
                {t("common.hide_panel", "Collapse Panel")}
              </span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pt-3 gap-3">
          <button
            onClick={togglePanel}
            title={t("nodes.categories.favorites", "Explorer")}
            aria-label={t("nodes.categories.favorites", "Explorer")}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
          >
            <FolderGit2 size={18} />
          </button>
        </div>
      )}
    </Motion.div>
  );
}
