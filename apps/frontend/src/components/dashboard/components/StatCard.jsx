import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard — Reusable metric card for Overview page
 * @param {string} label
 * @param {string|number} value
 * @param {React.ReactNode} icon
 * @param {string} iconColor — CSS color class or inline
 * @param {string} iconBg — background color for icon wrapper
 * @param {number|null} trend — percentage change (positive = up, negative = down)
 * @param {boolean} isLoading
 * @param {string} variant — 'default' | 'success' | 'error' | 'warning' | 'accent'
 * @param {string} suffix — unit suffix (e.g. "%" or "s")
 */
export default function StatCard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  trend = null,
  isLoading = false,
  suffix = "",
  onClick,
}) {
  const TrendIcon =
    trend === null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendClass = trend === null ? "" : trend > 0 ? "up" : trend < 0 ? "down" : "";

  if (isLoading) {
    return (
      <div className="dash-stat-card">
        <div
          className="dash-skeleton"
          style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 12 }}
        />
        <div
          className="dash-skeleton"
          style={{ width: "60%", height: 28, borderRadius: 4, marginBottom: 6 }}
        />
        <div
          className="dash-skeleton"
          style={{ width: "45%", height: 14, borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <div
      className="dash-stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Icon */}
      <div
        className="dash-stat-card__icon-wrap"
        style={{ background: iconBg || "var(--dash-accent-subtle)" }}
      >
        <span style={{ color: iconColor || "var(--dash-accent)", display: "flex" }}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div
        className="dash-stat-card__value"
        style={{ color: "var(--dash-text-primary)" }}
      >
        {value !== null && value !== undefined ? (
          <>
            {value}
            {suffix && (
              <span
                style={{
                  fontSize: "0.5em",
                  fontWeight: 600,
                  marginLeft: 2,
                  color: "var(--dash-text-secondary)",
                }}
              >
                {suffix}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: "var(--dash-text-tertiary)", fontSize: "0.6em" }}>
            —
          </span>
        )}
      </div>

      {/* Label */}
      <div className="dash-stat-card__label">{label}</div>

      {/* Trend */}
      {trend !== null && TrendIcon && (
        <div className={`dash-stat-card__trend ${trendClass}`}>
          <TrendIcon size={11} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
