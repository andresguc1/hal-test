import ExplorerHeader from "./ExplorerHeader";
import SearchFilterBar from "./SearchFilterBar";
import FlowTreeList from "./FlowTreeList";
import ExplorerContextMenu from "./ExplorerContextMenu";
import { useExplorerStore } from "@/stores/useExplorerStore";
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
  const { isOpen } = useExplorerStore();

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
      <ExplorerHeader
        projects={projects}
        currentProject={currentProject}
        onSwitchProject={onSwitchProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
        onNewProject={onNewProject}
        onNewFlow={onNewFlow}
      />

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
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
          </Motion.div>
        )}
      </AnimatePresence>

      <ExplorerContextMenu
        onRename={onRenameFlow}
        onDelete={onDeleteFlow}
        onDuplicate={onDuplicateFlow}
        onMoveFlowType={onMoveFlowType}
        onNewFlow={onNewFlow}
        onRun={onRunFlow}
      />
    </Motion.div>
  );
}
