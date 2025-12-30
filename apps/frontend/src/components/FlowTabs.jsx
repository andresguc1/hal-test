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
import "./styles/FlowTabs.css";
import ProjectSelector from "./ProjectSelector";

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
      className={`flow-tab ${isActive ? "active" : ""}`}
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
          className="flow-tab-edit-input"
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            width: "100%",
            outline: "none",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flow-tab-label">{flow.name}</span>
      )}

      <span
        className="flow-tab-close"
        onClick={(e) => {
          e.stopPropagation();
          if (
            window.confirm(t("common.delete_flow_confirm", { name: flow.name }))
          ) {
            onDelete(flow.id);
          }
        }}
      >
        ×
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
    <div className="flow-tabs-container">
      {/* Project Selector */}
      <ProjectSelector
        projects={projects || []}
        currentProject={currentProject}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
        onDeleteProject={onDeleteProject}
      />

      {/* Separator */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#444",
          margin: "0 8px",
        }}
      />

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
        </SortableContext>
      </DndContext>

      <div
        className="flow-tab-add"
        onClick={() => onCreateFlow(t("common.new_flow"))}
        title={t("common.create_new_flow")}
      >
        +
      </div>

      {contextMenu && (
        <div
          className="flow-tab-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div
            className="context-menu-item"
            onClick={() =>
              startEditing(flows.find((f) => f.id === contextMenu.flowId))
            }
          >
            {t("common.rename")}
          </div>
          {onDuplicateFlow && (
            <div
              className="context-menu-item"
              onClick={() => onDuplicateFlow(contextMenu.flowId)}
            >
              {t("common.duplicate")}
            </div>
          )}
          <div className="context-menu-separator"></div>
          <div
            className="context-menu-item delete"
            onClick={() => {
              if (window.confirm(t("common.delete_flow_simple_confirm"))) {
                onDeleteFlow(contextMenu.flowId);
              }
            }}
          >
            {t("common.delete")}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowTabs;
