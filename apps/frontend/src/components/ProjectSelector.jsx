import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const ProjectSelector = ({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = () => {
    const name = prompt(t("common.new_project_name_prompt"));
    if (name) {
      const description = prompt(t("common.new_project_desc_prompt"));
      onCreateProject(name, description || "");
      setIsOpen(false);
    }
  };

  return (
    <div
      className="project-selector"
      ref={dropdownRef}
      style={{ position: "relative", marginLeft: "10px" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "#2d2d2d",
          border: "1px solid #444",
          color: "white",
          padding: "5px 10px",
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
        }}
      >
        <span style={{ fontWeight: "bold" }}>
          {currentProject ? currentProject.name : t("common.select_project")}
        </span>
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: "4px",
            background: "#252526",
            border: "1px solid #454545",
            borderRadius: "4px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            zIndex: 1000,
            minWidth: "200px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "8px", borderBottom: "1px solid #333" }}>
            <button
              onClick={handleCreate}
              style={{
                width: "100%",
                padding: "6px",
                background: "#0e639c",
                border: "none",
                color: "white",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              + {t("common.new_project")}
            </button>
          </div>

          <div className="project-list">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  onSelectProject(project.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #333",
                  background:
                    currentProject?.id === project.id
                      ? "#37373d"
                      : "transparent",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#2a2d2e")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentProject?.id === project.id
                      ? "#37373d"
                      : "transparent")
                }
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "white", fontSize: "13px" }}>
                    {project.name}
                  </span>
                  <span style={{ color: "#888", fontSize: "11px" }}>
                    {new Date(project.updatedAt).toLocaleDateString(
                      i18n.language === "es" ? "es-ES" : "en-US",
                    )}
                  </span>
                </div>

                {onDeleteProject && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          t("common.delete_project_confirm", {
                            name: project.name,
                          }),
                        )
                      ) {
                        onDeleteProject(project.id);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#666",
                      cursor: "pointer",
                      padding: "4px",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#ff4444")}
                    onMouseLeave={(e) => (e.target.style.color = "#666")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
