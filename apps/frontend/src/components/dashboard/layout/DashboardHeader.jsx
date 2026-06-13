import React from "react";
import { Search, RefreshCw, ChevronRight, Plus } from "lucide-react";

const PAGE_LABELS = {
  overview: "Overview",
  projects: "Projects",
  flows: "Flows",
  runs: "Runs",
  history: "History",
  reports: "Reports",
  ai: "AI & Integrations",
  settings: "Settings",
};

export default function DashboardHeader({
  activePage,
  onRefresh,
  isRefreshing = false,
  onPrimaryAction,
  primaryActionLabel,
  searchValue = "",
  onSearchChange,
}) {
  return (
    <header className="hal-dashboard__header">
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--dash-text-tertiary)",
            fontWeight: 500,
          }}
        >
          HalTest
        </span>
        <ChevronRight
          size={12}
          style={{ color: "var(--dash-text-tertiary)", flexShrink: 0 }}
        />
        <h1
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--dash-text-primary)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {PAGE_LABELS[activePage] || activePage}
        </h1>
      </div>

      {/* Search */}
      {onSearchChange && (
        <div className="dash-search-input">
          <Search
            size={13}
            style={{ color: "var(--dash-text-tertiary)", flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search"
          />
        </div>
      )}

      {/* Refresh */}
      <button
        className="dash-btn dash-btn-ghost"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh data"
        style={{ padding: "6px 8px" }}
      >
        <RefreshCw
          size={14}
          style={{
            transition: "transform 0.4s ease",
            transform: isRefreshing ? "rotate(360deg)" : "none",
          }}
        />
      </button>

      {/* Primary CTA */}
      {primaryActionLabel && onPrimaryAction && (
        <button
          id="dash-primary-action"
          className="dash-btn dash-btn-primary"
          onClick={onPrimaryAction}
        >
          <Plus size={14} />
          {primaryActionLabel}
        </button>
      )}
    </header>
  );
}
