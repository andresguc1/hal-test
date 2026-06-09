import React from "react";

/**
 * RunStatusBadge — displays run status as a colored pill badge
 * Supports: running | passed | completed | failed | error | cancelled | queued
 */
export default function RunStatusBadge({ status = "unknown", size = "md" }) {
  const normalized = status?.toLowerCase();

  const map = {
    running: "running",
    passed: "passed",
    completed: "passed",
    success: "passed",
    failed: "failed",
    error: "failed",
    cancelled: "cancelled",
    canceled: "cancelled",
    queued: "queued",
    pending: "queued",
  };

  const label = {
    running: "Running",
    passed: "Passed",
    failed: "Failed",
    cancelled: "Cancelled",
    queued: "Queued",
  };

  const variant = map[normalized] || "cancelled";

  return (
    <span
      className={`dash-status-badge dash-status-badge--${variant}`}
      style={size === "sm" ? { fontSize: 10, padding: "2px 6px" } : {}}
    >
      <span className="dash-status-dot" />
      {label[variant] || status}
    </span>
  );
}
