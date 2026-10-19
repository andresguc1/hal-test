/**
 * Progress Bar Component
 * Shows progress during flow execution
 */

import React, { useEffect, useRef } from "react";
import "./ProgressBar.css";

/**
 * Progress Bar Component
 *
 * @param {Object} props
 * @param {number} props.current - Current step
 * @param {number} props.total - Total steps
 * @param {string} props.status - Current status message
 * @param {Function} props.onCancel - Cancel callback
 * @param {Function} props.onHeightChange - Reports the measured height so other
 *   floating overlays (notification stack) can position themselves below it.
 */
export default function ProgressBar({
  current = 0,
  total = 0,
  status = "",
  onCancel,
  onHeightChange,
}) {
  const containerRef = useRef(null);
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const isVisible = total > 0;

  useEffect(() => {
    if (!onHeightChange) return;

    const node = containerRef.current;
    if (!isVisible || !node) {
      onHeightChange(0);
      return;
    }

    const report = () => onHeightChange(node.getBoundingClientRect().height);

    if (typeof ResizeObserver === "undefined") {
      report();
      return () => onHeightChange(0);
    }

    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => {
      observer.disconnect();
      onHeightChange(0);
    };
  }, [isVisible, onHeightChange]);

  if (!isVisible) return null;

  return (
    <div ref={containerRef} className="progress-bar-container">
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
