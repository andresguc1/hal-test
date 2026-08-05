/**
 * Progress Bar Component
 * Shows progress during flow execution
 */

import React from "react";
import "./ProgressBar.css";

/**
 * Progress Bar Component
 *
 * @param {Object} props
 * @param {number} props.current - Current step
 * @param {number} props.total - Total steps
 * @param {string} props.status - Current status message
 * @param {Function} props.onCancel - Cancel callback
 */
export default function ProgressBar({
  current = 0,
  total = 0,
  status = "",
  onCancel,
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-bar-text">
          Executing: {current} of {total} nodes
        </span>
        {onCancel && (
          <button
            className="progress-bar-cancel"
            onClick={onCancel}
            aria-label="Cancel execution"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>

      {status && <div className="progress-bar-status">{status}</div>}
    </div>
  );
}
