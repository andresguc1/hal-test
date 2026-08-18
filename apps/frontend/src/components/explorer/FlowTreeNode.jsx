import { useState, useRef, useEffect, useCallback } from "react";
import {
  GitBranch,
  Box,
  Repeat,
  Check,
  X as XIcon,
  Minus,
  Pencil,
  Trash2,
  Copy,
  Play,
  GripVertical,
} from "lucide-react";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { cn } from "@/lib/utils";
import { motion as Motion } from "framer-motion";

const TYPE_ICONS = {
  main: GitBranch,
  component: Box,
  loop: Repeat,
};

const STATUS_STYLES = {
  passed: { icon: Check, color: "text-emerald-400" },
  failed: { icon: XIcon, color: "text-red-400" },
  "never-run": { icon: Minus, color: "text-slate-600" },
};

export default function FlowTreeNode({
  flow,
  isActive,
  onSelect,
  onContextMenu,
  onRename,
  onDelete,
  onDuplicate,
  onRun,
  depth = 0,
  isHighlighted = false,
}) {
  const { renamingFlowId, startRenaming, stopRenaming } = useExplorerStore();
  const isEditing = renamingFlowId === flow.id;
  const [isDragging, setIsDragging] = useState(false);

  const [editName, setEditName] = useState(flow.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) setEditName(flow.name);
  }, [isEditing, flow.name]);

  const handleSaveRename = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== flow.name) {
      onRename?.(flow, trimmed);
    }
    stopRenaming();
  }, [editName, flow, onRename, stopRenaming]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveRename();
      }
      if (e.key === "Escape") {
        setEditName(flow.name);
        stopRenaming();
      }
      e.stopPropagation();
    },
    [handleSaveRename, flow.name, stopRenaming],
  );

  const Icon = TYPE_ICONS[flow.type] || GitBranch;
  const status =
    STATUS_STYLES[flow.lastRunStatus] || STATUS_STYLES["never-run"];
  const StatusIcon = status.icon;

  const handleDragStart = (e) => {
    e.dataTransfer.setData("application/flow-id", flow.id);
    e.dataTransfer.setData("application/flow-parent-id", flow.parentId || "");
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Motion.div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={{ x: 2 }}
      onClick={() => {
        if (!isEditing) onSelect?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startRenaming(flow.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, flow);
      }}
      role="treeitem"
      aria-selected={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isEditing) onSelect?.();
        }
        if (e.key === "F2" && !isEditing) {
          e.preventDefault();
          startRenaming(flow.id);
        }
        if (e.key === "Delete" && !isEditing) {
          e.preventDefault();
          onDelete?.(flow);
        }
      }}
      className={cn(
        "flex items-center gap-1.5 py-1.5 cursor-pointer transition-all group select-none",
        "text-xs border-l-2",
        isDragging && "opacity-40",
        isActive
          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500"
          : isHighlighted
            ? "bg-amber-500/10 text-amber-300 border-amber-500/50"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent",
      )}
      style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: "4px" }}
    >
      <GripVertical
        size={10}
        className="shrink-0 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      />
      <Icon
        size={13}
        className={cn(
          "shrink-0",
          isActive ? "text-indigo-400" : "text-slate-500",
        )}
      />

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-slate-900/80 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 min-w-0"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveRename();
            }}
            className="p-0.5 text-emerald-400 hover:text-emerald-300"
            title="Save"
          >
            <Check size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditName(flow.name);
              stopRenaming();
            }}
            className="p-0.5 text-red-400 hover:text-red-300"
            title="Cancel"
          >
            <XIcon size={11} />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate">{flow.name}</span>

          {/* Inline action buttons on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun?.(flow);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-emerald-400 transition-colors"
              title="Run"
            >
              <Play size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRenaming(flow.id);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
              title="Rename (F2)"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(flow);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
              title="Duplicate"
            >
              <Copy size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(flow);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={10} />
            </button>
          </div>

          {/* Status indicator (always visible) */}
          <StatusIcon size={10} className={cn("shrink-0", status.color)} />
        </>
      )}
    </Motion.div>
  );
}
