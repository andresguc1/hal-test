import React, { useState, useRef, useEffect } from "react";
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
import { Plus, X, Copy, Pencil, Trash2 } from "lucide-react"; // Icons
import ProjectSelector from "./ProjectSelector";
import { cn } from "@/lib/utils";

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
        "group relative flex items-center min-w-[120px] max-w-[200px] h-full px-3 py-1.5 mr-0.5 rounded-t bg-[#2d2d2d] text-gray-400 text-xs transition-colors hover:bg-[#3d3d3d] hover:text-white select-none",
        isActive &&
          "bg-[#1e1e1e] text-white border-b-2 border-orange-500 hover:bg-[#1e1e1e]", // Active state
      )}
      onClick={() => onSwitch(flow.id)}
      onContextMenu={(e) => onContextMenu(e, flow)}
      onDoubleClick={() => onDoubleClick(flow)}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={onEditSubmit}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent border-none text-white outline-none font-inherit text-xs p-0 m-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate flex-grow mr-2">{flow.name}</span>
      )}

      {/* Close Button (Hidden unless hover or active? Original was visible on hover) */}
      <span
        className={cn(
          "ml-auto p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#444] hover:text-red-400",
          isActive && "opacity-100", // Always show on active? Optional.
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
        <X size={12} />
      </span>
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
  onCreateFlow,
  onRenameFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onReorderFlows,
  // Project selector props
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const [editingFlowId, setEditingFlowId] = useState(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts (allows clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Focus input when editing starts
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

      // Create orders array for backend
      const orders = newFlows.map((flow, index) => ({
        id: flow.id,
        order: index,
      }));

      onReorderFlows(orders);
    }
  };

  return (
    <div className="fixed bottom-[56px] left-0 right-0 h-[40px] bg-[#1e1e1e] border-t border-[#333] flex items-center px-2 z-20 shadow-md">
      {/* Project Selector */}
      <ProjectSelector
        projects={projects || []}
        currentProject={currentProject}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
        onDeleteProject={onDeleteProject}
      />

      {/* Separator */}
      <div className="w-px h-6 bg-[#444] mx-3" />

      {/* Flow Tabs with DND */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={flows.map((f) => f.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-1 h-full items-end overflow-x-auto no-scrollbar">
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

      <button
        className="ml-1 w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-[#333] hover:text-white transition-colors"
        onClick={() => onCreateFlow(t("common.new_flow"))}
        title={t("common.create_new_flow")}
      >
        <Plus size={18} />
      </button>

      {/* Context Menu (Custom Implementation to match Shadcn style) */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] bg-[#252526] border border-[#454545] rounded-md shadow-lg py-1 text-gray-200 text-sm animate-in fade-in zoom-in-95 cursor-default"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing immediately? Wrapper closes it.
        >
          <div
            className="px-3 py-2 hover:bg-[#094771] hover:text-white cursor-pointer flex items-center gap-2"
            onClick={() =>
              startEditing(flows.find((f) => f.id === contextMenu.flowId))
            }
          >
            <Pencil size={14} />
            {t("common.rename")}
          </div>
          {onDuplicateFlow && (
            <div
              className="px-3 py-2 hover:bg-[#094771] hover:text-white cursor-pointer flex items-center gap-2"
              onClick={() => {
                onDuplicateFlow(contextMenu.flowId);
                setContextMenu(null);
              }}
            >
              <Copy size={14} />
              {t("common.duplicate")}
            </div>
          )}
          <div className="h-px bg-[#454545] my-1"></div>
          <div
            className="px-3 py-2 hover:bg-[#2d2d2d] text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-2"
            onClick={() => {
              setContextMenu(null);
              if (window.confirm(t("common.delete_flow_simple_confirm"))) {
                onDeleteFlow(contextMenu.flowId);
              }
            }}
          >
            <Trash2 size={14} />
            {t("common.delete")}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowTabs;
