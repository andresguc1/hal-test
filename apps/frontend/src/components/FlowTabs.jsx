import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./styles/FlowTabs.css";
import ProjectSelector from "./ProjectSelector";

const FlowTabs = ({
  flows,
  activeFlowId,
  onSwitchFlow,
  onCreateFlow,
  onRenameFlow,
  onDeleteFlow,
  onDuplicateFlow,
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

      {/* Flow Tabs */}
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={`flow-tab ${flow.id === activeFlowId ? "active" : ""}`}
          onClick={() => onSwitchFlow(flow.id)}
          onContextMenu={(e) => handleContextMenu(e, flow)}
          onDoubleClick={() => startEditing(flow)}
        >
          {editingFlowId === flow.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleKeyDown}
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
              if (window.confirm(t("common.delete_flow_confirm", { name: flow.name }))) {
                onDeleteFlow(flow.id);
              }
            }}
          >
            ×
          </span>
        </div>
      ))}

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
