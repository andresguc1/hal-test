import { useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion as Motion } from "framer-motion";

const GROUP_TYPE_MAP = {
  _main: "main",
  _components: "component",
  _loops: "loop",
};

export default function FolderTreeNode({
  label,
  isExpanded,
  onToggle,
  depth = 0,
  count = 0,
  icon: IconComp,
  isGroup = false,
  groupId,
  onDropFlow,
}) {
  const FolderIcon = isExpanded ? FolderOpen : Folder;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    if (!onDropFlow || !groupId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!onDropFlow || !groupId) return;

    const flowId = e.dataTransfer.getData("application/flow-id");
    if (!flowId) return;

    const targetTypeId = GROUP_TYPE_MAP[groupId];
    if (targetTypeId) {
      onDropFlow(flowId, targetTypeId);
    }
  };

  return (
    <Motion.div
      whileHover={{ x: 2 }}
      onClick={onToggle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="treeitem"
      aria-expanded={isExpanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle?.();
        }
      }}
      className={cn(
        "flex items-center gap-2 py-1.5 cursor-pointer transition-colors select-none",
        "text-xs font-medium",
        isGroup
          ? "text-slate-300 hover:text-white"
          : "text-slate-400 hover:text-slate-200",
        "hover:bg-white/5",
        isDragOver && "bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/30",
      )}
      style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: "8px" }}
    >
      {!isGroup && (
        <Motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
        >
          <ChevronRight size={12} className="text-slate-500" />
        </Motion.div>
      )}
      {IconComp ? (
        <IconComp
          size={13}
          className={cn(
            "shrink-0",
            isDragOver ? "text-indigo-300" : "text-indigo-400",
          )}
        />
      ) : (
        <FolderIcon
          size={13}
          className={cn(
            "shrink-0",
            isDragOver
              ? "text-indigo-300"
              : isExpanded
                ? "text-indigo-400"
                : "text-slate-500",
          )}
        />
      )}
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="text-[10px] text-slate-600 font-mono tabular-nums">
          {count}
        </span>
      )}
    </Motion.div>
  );
}
