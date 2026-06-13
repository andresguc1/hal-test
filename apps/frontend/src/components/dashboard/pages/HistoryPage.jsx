import React, { useState, useMemo } from "react";
import { History, Search, Calendar, Filter } from "lucide-react";
import { useRuns, useProjects } from "../hooks/useDashboardData";
import RunStatusBadge from "../components/RunStatusBadge";
import EmptyState from "../components/EmptyState";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function groupByDay(runs) {
  const groups = {};
  runs.forEach((run) => {
    const d = new Date(run.started_at || run.created_at || "");
    const key = d.toLocaleDateString("en", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(run);
  });
  return Object.entries(groups);
}

const STATUS_FILTERS = ["all", "passed", "failed", "cancelled"];

export default function HistoryPage({ onViewReport }) {
  const { data: projects = [] } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const { data: runs = [], isLoading } = useRuns({
    status: statusFilter !== "all" ? statusFilter : undefined,
    projectId: projectFilter !== "all" ? projectFilter : undefined,
    limit: 100,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return runs;
    const q = search.toLowerCase();
    return runs.filter(
      (r) =>
        r.flow_name?.toLowerCase().includes(q) ||
        r.project_name?.toLowerCase().includes(q),
    );
  }, [runs, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 4px",
          }}
        >
          History
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Complete execution timeline grouped by day
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div
          className="dash-search-input"
          style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
        >
          <Search
            size={13}
            style={{ color: "var(--dash-text-tertiary)", flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="dash-filter-bar">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`dash-filter-chip ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Filter size={12} style={{ color: "var(--dash-text-tertiary)" }} />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 7,
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--dash-text-primary)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
          }}
        >
          <EmptyState
            icon={<History size={24} />}
            title="No history found"
            description="Execution history will appear here once you run your flows"
          />
        </div>
      )}

      {/* Grouped Timeline */}
      {grouped.map(([day, dayRuns]) => (
        <div key={day} style={{ marginBottom: 28 }}>
          {/* Day header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Calendar size={13} style={{ color: "var(--dash-accent)" }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--dash-text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              {day}
            </span>
            <span style={{ fontSize: 11, color: "var(--dash-text-tertiary)" }}>
              — {dayRuns.length} run{dayRuns.length !== 1 ? "s" : ""}
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--dash-border-subtle)",
              }}
            />
          </div>

          {/* Runs for this day */}
          <div
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "var(--dash-shadow-card)",
            }}
          >
            {dayRuns.map((run, i) => (
              <div
                key={run.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderBottom:
                    i < dayRuns.length - 1
                      ? "1px solid var(--dash-border-subtle)"
                      : "none",
                  cursor: "pointer",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--dash-surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <RunStatusBadge status={run.status} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--dash-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {run.flow_name || "Unnamed Flow"}
                  </div>
                  {run.project_name && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--dash-text-tertiary)",
                        marginTop: 1,
                      }}
                    >
                      {run.project_name}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--dash-text-secondary)",
                    fontFamily: "monospace",
                  }}
                >
                  {formatDuration(run.duration_ms)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--dash-text-tertiary)",
                    minWidth: 96,
                    textAlign: "right",
                  }}
                >
                  {formatDate(run.started_at || run.created_at)}
                </div>
                {onViewReport && (
                  <button
                    className="dash-btn dash-btn-ghost"
                    style={{ padding: "3px 8px", fontSize: 11 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReport(run.id);
                    }}
                  >
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
