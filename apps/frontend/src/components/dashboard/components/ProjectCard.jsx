import React from "react";
import { GitBranch, Clock, Play, MoreHorizontal, Copy, Trash2, ArrowRight } from "lucide-react";

/**
 * Generates a deterministic gradient from a project name/id
 */
function projectGradient(nameOrId = "") {
  const hash = nameOrId.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 40) % 360;
  return {
    gradient: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${hue2} 80% 60%))`,
    initial: nameOrId.trim()[0]?.toUpperCase() || "P",
  };
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * ProjectCard — grid card for project management page
 */
export default function ProjectCard({
  project,
  onOpen,
  _onRename,
  onDelete,
  onDuplicate,
  recentRun,
}) {
  const { gradient, initial } = projectGradient(project.id || project.name);
  const flowCount = project.flows?.length || 0;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="dash-project-card" onClick={() => onOpen?.(project)}>
      {/* Accent bar */}
      <div className="dash-project-card__accent-bar" style={{ background: gradient }} />

      {/* Header */}
      <div className="dash-project-card__header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
          {/* Avatar */}
          <div
            className="dash-project-card__avatar"
            style={{ background: gradient }}
          >
            {initial}
          </div>

          {/* Name + desc */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dash-project-card__name">{project.name}</div>
            {project.description && (
              <div className="dash-project-card__desc">{project.description}</div>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div
          ref={menuRef}
          style={{ position: "relative", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="dash-btn dash-btn-ghost"
            style={{ padding: "4px 6px" }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 8,
                padding: "4px",
                minWidth: 160,
                boxShadow: "var(--dash-shadow-lg)",
                zIndex: 50,
              }}
            >
              <MenuItem
                icon={<ArrowRight size={13} />}
                label="Open Project"
                onClick={() => { setMenuOpen(false); onOpen?.(project); }}
              />
              <MenuItem
                icon={<Copy size={13} />}
                label="Duplicate"
                onClick={() => { setMenuOpen(false); onDuplicate?.(project); }}
              />
              <div style={{ height: 1, background: "var(--dash-border-subtle)", margin: "4px 0" }} />
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Delete"
                danger
                onClick={() => { setMenuOpen(false); onDelete?.(project); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="dash-project-card__meta">
        <div className="dash-project-card__meta-item">
          <GitBranch size={11} />
          {flowCount} {flowCount === 1 ? "flow" : "flows"}
        </div>
        {recentRun && (
          <>
            <div
              style={{
                width: 1,
                height: 12,
                background: "var(--dash-border)",
                flexShrink: 0,
              }}
            />
            <div className="dash-project-card__meta-item">
              <Clock size={11} />
              {timeAgo(recentRun.started_at || recentRun.created_at)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginLeft: "auto",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    recentRun.status === "completed" || recentRun.status === "passed"
                      ? "var(--dash-success)"
                      : recentRun.status === "running"
                      ? "var(--dash-running)"
                      : "var(--dash-error)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--dash-text-tertiary)" }}>
                Last run
              </span>
            </div>
          </>
        )}
        {!recentRun && flowCount === 0 && (
          <div
            className="dash-project-card__meta-item"
            style={{ marginLeft: "auto" }}
          >
            <Play size={11} />
            No runs yet
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 10px",
        borderRadius: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
        color: danger ? "var(--dash-error-text)" : "var(--dash-text-primary)",
        textAlign: "left",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "var(--dash-error-subtle)"
          : "var(--dash-surface-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
      }}
    >
      <span style={{ color: danger ? "var(--dash-error)" : "var(--dash-text-secondary)" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
