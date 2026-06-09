import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  Play,
  History,
  BarChart2,
  Settings,
  Sparkles,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const NAV_SECTIONS = [
  {
    items: [{ id: "overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Automation",
    items: [
      { id: "projects", label: "Projects", icon: FolderKanban },
      { id: "flows", label: "Flows", icon: GitBranch },
    ],
  },
  {
    label: "Execution",
    items: [
      { id: "runs", label: "Runs", icon: Play, badgeKey: "activeRuns" },
      { id: "history", label: "History", icon: History },
      { id: "reports", label: "Reports", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { id: "ai", label: "AI & Integrations", icon: Sparkles },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar({
  activePage,
  onNavigate,
  onBackToCanvas,
  activeRunsCount = 0,
  user,
}) {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hal-dashboard__sidebar">
      {/* Logo */}
      <div className="dash-sidebar-logo">
        <div className="dash-sidebar-logo__mark">H</div>
        <div className="dash-sidebar-logo__text">
          <span className="dash-sidebar-logo__name">HalTest</span>
          <span className="dash-sidebar-logo__version">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="dash-nav-section" aria-label="Dashboard navigation">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <div className="dash-nav-section__label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const badge =
                item.badgeKey === "activeRuns" && activeRunsCount > 0
                  ? activeRunsCount
                  : null;

              return (
                <button
                  key={item.id}
                  id={`dash-nav-${item.id}`}
                  className={`dash-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => onNavigate(item.id)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={15} className="dash-nav-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge && (
                    <span className="dash-nav-badge running">{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="dash-sidebar-footer">
        {/* Back to Canvas */}
        <button
          id="dash-back-to-canvas"
          className="dash-btn dash-btn-secondary"
          style={{ width: "100%", justifyContent: "center", marginBottom: 8, gap: 6 }}
          onClick={onBackToCanvas}
        >
          <ChevronLeft size={14} />
          Back to Canvas
        </button>

        {/* Theme toggle + user */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 0",
          }}
        >
          {/* User avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--dash-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--dash-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email || "Local User"}
            </div>
          </div>
          {/* Theme toggle */}
          <button
            className="dash-btn dash-btn-ghost"
            style={{ padding: "4px 6px", flexShrink: 0 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
