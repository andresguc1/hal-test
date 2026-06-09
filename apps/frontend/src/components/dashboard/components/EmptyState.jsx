import React from "react";

/**
 * EmptyState — generic empty state with illustration + CTA
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
}) {
  return (
    <div className="dash-empty-state">
      <div className="dash-empty-state__icon">{icon}</div>
      <div className="dash-empty-state__title">{title}</div>
      {description && (
        <div className="dash-empty-state__desc">{description}</div>
      )}
      {action && actionLabel && (
        <button
          className="dash-btn dash-btn-primary"
          onClick={action}
          style={{ marginTop: 8 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
