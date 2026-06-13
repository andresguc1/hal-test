import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRuns, useProjects } from "../hooks/useDashboardData";
import RunStatusBadge from "../components/RunStatusBadge";
import EmptyState from "../components/EmptyState";

function formatDuration(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_FILTERS = ["all", "running", "passed", "failed", "cancelled"];

export default function RunsPage({ onViewReport }) {
  const { data: projects = [] } = useProjects();
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [expandedRun, setExpandedRun] = useState(null);

  const {
    data: runs = [],
    isLoading,
    refetch,
  } = useRuns({
    status: statusFilter !== "all" ? statusFilter : undefined,
    projectId: projectFilter !== "all" ? projectFilter : undefined,
    limit: 50,
  });

  const toggleExpand = (id) =>
    setExpandedRun((prev) => (prev === id ? null : id));

  return (
    <div>
      {/* Title */}
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
          Runs{" "}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--dash-text-tertiary)",
              marginLeft: 8,
            }}
          >
            {runs.length}
          </span>
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Execution history and live run status
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
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
        <div style={{ marginLeft: "auto" }}>
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
        <button
          className="dash-btn dash-btn-ghost"
          onClick={refetch}
          style={{ padding: "6px 8px" }}
          title="Refresh"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Empty */}
      {!isLoading && runs.length === 0 && (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
          }}
        >
          <EmptyState
            icon={<Play size={24} />}
            title="No runs found"
            description="Run a flow to see execution results here"
          />
        </div>
      )}

      {/* Runs list */}
      {runs.length > 0 && (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "var(--dash-shadow-card)",
          }}
        >
          {runs.map((run, idx) => {
            const isExpanded = expandedRun === run.id;
            const isLast = idx === runs.length - 1;
            return (
              <div
                key={run.id}
                style={{
                  borderBottom: isLast
                    ? "none"
                    : "1px solid var(--dash-border-subtle)",
                }}
              >
                {/* Run header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "background 0.12s ease",
                  }}
                  onClick={() => toggleExpand(run.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--dash-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <RunStatusBadge status={run.status} />
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
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--dash-text-tertiary)",
                        marginTop: 2,
                      }}
                    >
                      {run.project_name && <span>{run.project_name} · </span>}
                      {formatDate(run.started_at || run.created_at)}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--dash-text-secondary)",
                      }}
                    >
                      <Clock size={12} />
                      {formatDuration(run.duration_ms)}
                    </div>
                    {onViewReport && (
                      <button
                        className="dash-btn dash-btn-secondary"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewReport(run.id);
                        }}
                      >
                        Report
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp
                        size={14}
                        style={{ color: "var(--dash-text-tertiary)" }}
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                        style={{ color: "var(--dash-text-tertiary)" }}
                      />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      borderTop: "1px solid var(--dash-border-subtle)",
                      background: "var(--dash-surface-hover)",
                      padding: "16px",
                    }}
                  >
                    <RunDetail run={run} />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RunDetail({ run }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Metadata */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--dash-text-tertiary)",
            marginBottom: 8,
          }}
        >
          Details
        </div>
        {[
          ["Status", run.status],
          [
            "Duration",
            run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—",
          ],
          [
            "Started",
            run.started_at ? new Date(run.started_at).toLocaleString() : "—",
          ],
          ["Trigger", run.trigger_source || "manual"],
          ["Browser", run.browser || "chromium"],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              borderBottom: "1px solid var(--dash-border-subtle)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--dash-text-secondary)" }}>{label}</span>
            <span
              style={{ color: "var(--dash-text-primary)", fontWeight: 500 }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Error */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--dash-text-tertiary)",
            marginBottom: 8,
          }}
        >
          {run.error ? "Error" : "Steps"}
        </div>
        {run.error ? (
          <div
            style={{
              background: "var(--dash-error-subtle)",
              border: "1px solid var(--dash-error)",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: "var(--dash-error-text)",
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontWeight: 600 }}>Execution Error</div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {run.error}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--dash-text-tertiary)" }}>
            {run.steps_count
              ? `${run.steps_count} steps executed`
              : "No step data available"}
          </div>
        )}
      </div>
    </div>
  );
}
