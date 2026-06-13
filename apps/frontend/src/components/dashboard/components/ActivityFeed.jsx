import React from "react";
import RunStatusBadge from "./RunStatusBadge";

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

function formatDuration(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

/**
 * ActivityFeed — compact list of recent run events
 */
export default function ActivityFeed({ runs = [], maxItems = 8, onViewRun }) {
  const items = runs.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "24px 0",
          textAlign: "center",
          color: "var(--dash-text-tertiary)",
          fontSize: 13,
        }}
      >
        No recent activity
      </div>
    );
  }

  return (
    <div>
      {items.map((run, idx) => (
        <div
          key={run.id || idx}
          className="dash-activity-item"
          style={{ cursor: onViewRun ? "pointer" : "default" }}
          onClick={() => onViewRun?.(run)}
        >
          <span
            className="dash-activity-dot"
            style={{
              background:
                run.status === "completed" || run.status === "passed"
                  ? "var(--dash-success)"
                  : run.status === "running"
                    ? "var(--dash-running)"
                    : run.status === "failed" || run.status === "error"
                      ? "var(--dash-error)"
                      : "var(--dash-text-tertiary)",
            }}
          />
          <div className="dash-activity-text">
            <span
              style={{ fontWeight: 600, color: "var(--dash-text-primary)" }}
            >
              {run.flow_name || "Flow"}
            </span>
            {run.project_name && (
              <span style={{ color: "var(--dash-text-tertiary)" }}>
                {" "}
                in {run.project_name}
              </span>
            )}
            <div
              style={{
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RunStatusBadge status={run.status} size="sm" />
              <span
                style={{ fontSize: 11, color: "var(--dash-text-tertiary)" }}
              >
                {formatDuration(run.duration_ms)}
              </span>
            </div>
          </div>
          <div className="dash-activity-time">
            {timeAgo(run.started_at || run.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
