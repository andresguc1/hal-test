import React, { useState, useRef, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { tabVariants } from "../utils/motion-variants";
import { Plus, X, Copy, Pencil, Trash2, FolderGit2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * MAREA DESIGN SYSTEM - FLOW TABS
 * "Chrome-like" glass tabs for flow navigation.
 */

// ========================================
// SORTABLE TAB COMPONENT
// ========================================

const SortableTab = ({
  flow,
  isActive,
  onSwitch,
  onContextMenu,
  onDoubleClick,
  onDelete,
  isEditing,
  editName,
  setEditName,
  onEditSubmit,
  onKeyDown,
  editInputRef,
  t,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flow.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1001 : 1,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "pointer",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      variants={tabVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "group relative flex items-center min-w-[120px] max-w-[180px] h-full px-3 py-1.5 mr-1 rounded-t-lg text-[11px] font-medium transition-all select-none border-t border-x border-transparent",

        // MAREA: Tab States
        isActive
          ? "bg-[#0f172a] text-blue-400 border-t-blue-500/50 border-x-white/5 shadow-[0_-4px_10px_-5px_rgba(59,130,246,0.1)]"
          : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5",

        isDragging && "scale-105 shadow-xl z-50 bg-slate-800",
      )}
      onClick={() => onSwitch(flow.id)}
      onContextMenu={(e) => onContextMenu(e, flow)}
      onDoubleClick={() => onDoubleClick(flow)}
      {...attributes}
      {...listeners}
    >
      {/* Active Indicator Line (Top) */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" />
      )}

      {/* Content */}
      <div className="flex items-center gap-2 w-full overflow-hidden">
        {/* Icon based on type (generic for now) */}
        {!isEditing && (
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              isActive
                ? "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"
                : "bg-slate-600",
            )}
          />
        )}

        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={onEditSubmit}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent border-none text-white outline-none font-mono text-[11px] p-0 m-0 placeholder:text-slate-600"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="truncate flex-grow font-mono tracking-tight">
            {flow.name}
          </span>
        )}
      </div>

      {/* Close Button */}
      <button
        className={cn(
          "ml-1 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200",
          "hover:bg-red-500/20 hover:text-red-400 text-slate-500",
          isActive && "opacity-0 group-hover:opacity-100", // Only show on hover even if active for clean look
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (
            window.confirm(t("common.delete_flow_confirm", { name: flow.name }))
          ) {
            onDelete(flow.id);
          }
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const FlowTabs = ({
  flows,
  activeFlowId,
  onSwitchFlow,
  onRenameFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onReorderFlows,
  // Unused props commented out
  // onCreateFlow,
  // projects,
  // currentProject,
  // onSelectProject,
  // onCreateProject,
  // onDeleteProject,
}) => {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const [editingFlowId, setEditingFlowId] = useState(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (editingFlowId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFlowId]);

  const handleContextMenu = (e, flow) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      flowId: flow.id,
    });
  };

  const startEditing = (flow) => {
    setEditingFlowId(flow.id);
    setEditName(flow.name);
    setContextMenu(null);
  };

  const handleEditSubmit = () => {
    if (editName.trim()) {
      onRenameFlow(editingFlowId, editName.trim());
    }
    setEditingFlowId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleEditSubmit();
    } else if (e.key === "Escape") {
      setEditingFlowId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = flows.findIndex((f) => f.id === active.id);
      const newIndex = flows.findIndex((f) => f.id === over.id);

      const newFlows = arrayMove(flows, oldIndex, newIndex);

      const orders = newFlows.map((flow, index) => ({
        id: flow.id,
        order: index,
      }));

      onReorderFlows(orders);
    }
  };

  return (
    <div className="h-[40px] flex items-center px-4 relative z-20 select-none pointer-events-auto">
      {/* Flow Tabs */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={flows.map((f) => f.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-1 h-full items-end overflow-x-auto no-scrollbar pt-1">
            <AnimatePresence mode="popLayout">
              {flows.map((flow) => (
                <SortableTab
                  key={flow.id}
                  flow={flow}
                  isActive={flow.id === activeFlowId}
                  onSwitch={onSwitchFlow}
                  onContextMenu={handleContextMenu}
                  onDoubleClick={startEditing}
                  onDelete={onDeleteFlow}
                  isEditing={editingFlowId === flow.id}
                  editName={editName}
                  setEditName={setEditName}
                  onEditSubmit={handleEditSubmit}
                  onKeyDown={handleKeyDown}
                  editInputRef={editInputRef}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Context Menu (Glass styled) */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-1 transform -translate-y-full"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-3 py-2 text-slate-300 hover:bg-blue-500/20 hover:text-blue-200 cursor-pointer flex items-center gap-2 text-xs font-medium transition-colors"
            onClick={() =>
              startEditing(flows.find((f) => f.id === contextMenu.flowId))
            }
          >
            <Pencil size={12} />
            {t("common.rename")}
          </div>

          {onDuplicateFlow && (
            <div
              className="px-3 py-2 text-slate-300 hover:bg-blue-500/20 hover:text-blue-200 cursor-pointer flex items-center gap-2 text-xs font-medium transition-colors"
              onClick={() => {
                onDuplicateFlow(contextMenu.flowId);
                setContextMenu(null);
              }}
            >
              <Copy size={12} />
              {t("common.duplicate")}
            </div>
          )}

          <div className="h-px bg-white/5 my-1" />

          <div
            className="px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer flex items-center gap-2 text-xs font-medium transition-colors"
            onClick={() => {
              setContextMenu(null);
              if (window.confirm(t("common.delete_flow_simple_confirm"))) {
                onDeleteFlow(contextMenu.flowId);
              }
            }}
          >
            <Trash2 size={12} />
            {t("common.delete")}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(FlowTabs);
