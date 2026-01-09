import React, { useState, useEffect } from "react";

const AppFooter = ({
  projectName,
  projects = [],
  onSwitchProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  flowName,
  flows = [],
  onSwitchFlow,
  onNewFlow,
  onDeleteFlow,
  onRenameFlow,
  version = "v1.0.2",
  // isReadOnly, isRunning, // Unused props
  onRun,
  onSave,
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // Close menu on outside click
  useEffect(() => {
    const close = () => setActiveMenu(null);
    if (activeMenu) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [activeMenu]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (msg) => setToast({ msg });

  // --- ACTIONS WRAPPERS ---
  const handleNewProject = () => {
    onNewProject();
    showNotification("✨ New Project Created");
  };
  const handleNewFlow = () => {
    onNewFlow();
    showNotification("✨ New Flow Added");
  };

  // --- RENAME LOGIC ---
  const startEditing = (item, e) => {
    e.stopPropagation(); // Stop menu from closing
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = (originalItem, isProject) => {
    if (editName.trim() && editName !== originalItem.name) {
      if (isProject) onRenameProject(originalItem, editName);
      else onRenameFlow(originalItem, editName);
      showNotification("✏️ Renamed successfully");
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, item, isProject) => {
    if (e.key === "Enter") saveEdit(item, isProject);
    if (e.key === "Escape") setEditingId(null);
  };

  // --- DELETE HANDLER (FIXED) ---
  const requestDelete = (e, item, isProject) => {
    e.stopPropagation(); // <--- CRITICAL: Prevents row click
    e.preventDefault();

    // Correct String Interpolation using backticks
    const message = `Delete ${isProject ? "Project" : "Flow"} "${item.name}"?`;

    if (window.confirm(message)) {
      if (isProject) onDeleteProject(item);
      else onDeleteFlow(item);
      showNotification("🗑 Deleted successfully");
    }
  };

  // --- STYLES ---
  const styles = {
    container: {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      minWidth: "850px",
      backgroundColor: "rgba(30, 30, 30, 0.85)",
      backdropFilter: "blur(12px)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
      zIndex: 20000,
      color: "#eee",
      fontFamily: "sans-serif",
      userSelect: "none",
    },
    menuPopup: {
      position: "absolute",
      bottom: "50px",
      left: "0",
      minWidth: "280px",
      maxHeight: "300px",
      overflowY: "auto",
      backgroundColor: "rgba(20, 20, 20, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      padding: "6px",
      zIndex: 20001,
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    menuItem: {
      padding: "8px 12px",
      fontSize: "0.85rem",
      color: "#ccc",
      cursor: "pointer",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "background 0.2s",
      position: "relative",
    },
    itemContent: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: 1,
      overflow: "hidden",
    },
    inputEdit: {
      background: "#333",
      border: "1px solid #555",
      color: "white",
      borderRadius: "4px",
      padding: "2px 5px",
      width: "100%",
      fontSize: "0.85rem",
      outline: "none",
    },
    deleteBtn: {
      color: "#ef4444",
      opacity: 0.6,
      fontSize: "0.9rem",
      padding: "4px 8px",
      cursor: "pointer",
      fontWeight: "bold",
      marginLeft: "10px",
      borderRadius: "4px",
      border: "1px solid transparent",
    },
  };

  // --- RENDER HELPERS ---
  const renderList = (items, isProject) => (
    <div style={styles.menuPopup} onClick={(e) => e.stopPropagation()}>
      <div
        style={{
          padding: "6px 10px",
          fontSize: "0.7rem",
          color: "#666",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        {isProject ? "YOUR PROJECTS" : "FLOWS IN PROJECT"}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id || index}
          className="menu-item-hover"
          style={styles.menuItem}
          onClick={() => {
            if (editingId) return;
            if (isProject) onSwitchProject(item);
            else onSwitchFlow(item);
            setActiveMenu(null);
          }}
        >
          <div style={styles.itemContent}>
            <span>{isProject ? "📁" : "📄"}</span>

            {editingId === item.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveEdit(item, isProject)}
                onKeyDown={(e) => handleKeyDown(e, item, isProject)}
                onClick={(e) => e.stopPropagation()}
                style={styles.inputEdit}
              />
            ) : (
              <span
                title="Double click to rename"
                onDoubleClick={(e) => startEditing(item, e)}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: (
                    isProject
                      ? item.name === projectName
                      : item.name === flowName
                  )
                    ? "#4ade80"
                    : "inherit",
                  fontWeight: (
                    isProject
                      ? item.name === projectName
                      : item.name === flowName
                  )
                    ? "600"
                    : "400",
                  fontStyle: item.name ? "normal" : "italic",
                  opacity: item.name ? 1 : 0.5,
                }}
              >
                {item.name ||
                  (isProject ? "Untitled Project" : "Untitled Flow")}
              </span>
            )}
          </div>

          {!editingId && (
            <div
              className="delete-btn-hover"
              style={styles.deleteBtn}
              title="Delete"
              onClick={(e) => requestDelete(e, item, isProject)}
            >
              ✕
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        .menu-item-hover:hover { background: rgba(255,255,255,0.08); }
        .action-btn-hover { opacity: 0.4; transition: all 0.2s; }
        .menu-item-hover:hover .action-btn-hover { opacity: 0.7; }
        .action-btn-hover:hover { opacity: 1 !important; transform: scale(1.1); }
        .delete-btn-hover:hover { color: #ef4444 !important; }
        .footer-btn:hover { transform: translateY(-2px); }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 20px",
            background: "#10b981",
            color: "white",
            borderRadius: "30px",
            animation: "slideUp 0.3s",
            zIndex: 20002,
          }}
        >
          <span>🔔</span> {toast.msg}
        </div>
      )}

      <div style={styles.container}>
        {/* PROJECT SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "6px 10px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === "project" ? null : "project");
            }}
          >
            <div
              style={{ filter: "drop-shadow(0 0 5px rgba(168,85,247,0.5))" }}
            >
              📁
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
              {projectName}
            </span>
            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
          </div>
          <button
            style={{
              background: "transparent",
              border: "1px solid #555",
              color: "#aaa",
              borderRadius: "4px",
              marginLeft: "5px",
              cursor: "pointer",
            }}
            onClick={handleNewProject}
          >
            +
          </button>
          {activeMenu === "project" && renderList(projects, true)}
        </div>

        <div
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.1)",
            margin: "0 15px",
          }}
        ></div>

        {/* FLOW SECTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "6px 10px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === "flow" ? null : "flow");
            }}
          >
            <div>📄</div>
            <span style={{ fontSize: "0.85rem", color: "#ccc" }}>
              {flowName}
            </span>
            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
          </div>
          <button
            style={{
              background: "transparent",
              border: "1px solid #555",
              color: "#aaa",
              borderRadius: "4px",
              marginLeft: "5px",
              cursor: "pointer",
            }}
            onClick={handleNewFlow}
          >
            +
          </button>
          {activeMenu === "flow" && renderList(flows, false)}
        </div>

        {/* ACTIONS & STATUS */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={onRun}
            className="footer-btn"
            style={{
              background: "#2563eb",
              border: "none",
              padding: "6px 15px",
              borderRadius: "6px",
              color: "white",
            }}
          >
            ▶ RUN
          </button>
          <button
            onClick={onSave}
            className="footer-btn"
            style={{
              background: "transparent",
              border: "1px solid #444",
              padding: "6px 12px",
              borderRadius: "6px",
              color: "white",
            }}
          >
            💾
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingLeft: "15px",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#4ade80",
            }}
          ></div>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>{version}</span>
        </div>
      </div>
    </>
  );
};
export default AppFooter;
