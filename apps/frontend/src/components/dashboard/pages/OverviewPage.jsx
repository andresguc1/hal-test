import React from "react";
import { motion } from "framer-motion";
import { useMotionVariants } from "../../../hooks/useReducedMotion";
import {
  FolderKanban,
  GitBranch,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  Play,
} from "lucide-react";
import { useOverviewMetrics } from "../hooks/useDashboardData";
import StatCard from "../components/StatCard";
import MiniSparkline from "../components/MiniSparkline";
import ActivityFeed from "../components/ActivityFeed";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const FADE_UP_FULL = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};
const FADE_UP_REDUCED = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

export default function OverviewPage({ onNavigate, onViewRun }) {
  const { isLoading, metrics, last7Days, recentRuns } = useOverviewMetrics();
  const fadeUp = useMotionVariants(FADE_UP_FULL, FADE_UP_REDUCED);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero Greeting */}
      <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 4px",
          }}
        >
          Automation Overview
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Real-time status of your projects, flows, and executions
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={fadeUp}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total Projects"
          value={metrics.totalProjects}
          icon={<FolderKanban size={18} />}
          iconColor="hsl(217 91% 60%)"
          iconBg="var(--dash-accent-subtle)"
          isLoading={isLoading}
          onClick={() => onNavigate("projects")}
        />
        <StatCard
          label="Total Flows"
          value={metrics.totalFlows}
          icon={<GitBranch size={18} />}
          iconColor="hsl(258 90% 66%)"
          iconBg="hsl(258 90% 10%)"
          isLoading={isLoading}
          onClick={() => onNavigate("flows")}
        />
        <StatCard
          label="Success Rate"
          value={metrics.successRate}
          suffix="%"
          icon={<CheckCircle2 size={18} />}
          iconColor="var(--dash-success)"
          iconBg="var(--dash-success-subtle)"
          isLoading={isLoading}
        />
        <StatCard
          label="Active Runs"
          value={metrics.activeRuns}
          icon={<Activity size={18} />}
          iconColor="var(--dash-running)"
          iconBg="var(--dash-running-subtle)"
          isLoading={isLoading}
          onClick={() => onNavigate("runs")}
        />
        <StatCard
          label="Avg Duration"
          value={metrics.avgDurationSec}
          suffix="s"
          icon={<Clock size={18} />}
          iconColor="var(--dash-warning)"
          iconBg="var(--dash-warning-subtle)"
          isLoading={isLoading}
        />
      </motion.div>

      {/* 2-col grid: Chart + Activity */}
      <motion.div
        variants={fadeUp}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {/* Execution Trend Chart */}
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: "var(--dash-card-radius)",
            padding: 20,
            boxShadow: "var(--dash-shadow-card)",
          }}
        >
          <div className="dash-section-header" style={{ marginBottom: 20 }}>
            <div>
              <div className="dash-section-title" style={{ fontSize: 14 }}>
                Executions (Last 7 Days)
              </div>
              <div className="dash-section-subtitle">
                Passed vs Failed trends
              </div>
            </div>
            <TrendingUp size={16} style={{ color: "var(--dash-accent)" }} />
          </div>

          {/* Bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 80,
            }}
          >
            {last7Days.map((day, i) => {
              const maxTotal = Math.max(...last7Days.map((d) => d.total), 1);
              const totalH = Math.round((day.total / maxTotal) * 64);
              const passedH = Math.round(
                (day.passed / Math.max(day.total, 1)) * totalH,
              );
              const failedH = totalH - passedH;

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      height: 64,
                      gap: 1,
                    }}
                  >
                    {failedH > 0 && (
                      <div
                        style={{
                          height: "100%",
                          maxHeight: failedH,
                          background: "hsl(0 84% 60% / 0.7)",
                          borderRadius: "3px 3px 0 0",
                          transform: `scaleY(${failedH / 64})`,
                          transformOrigin: "bottom",
                          transition:
                            "transform 0.5s var(--ease-standard, cubic-bezier(0.4,0,0.2,1))",
                        }}
                      />
                    )}
                    {passedH > 0 && (
                      <div
                        style={{
                          height: "100%",
                          maxHeight: passedH,
                          background: "hsl(142 71% 45% / 0.8)",
                          borderRadius: failedH > 0 ? 0 : "3px 3px 0 0",
                          transform: `scaleY(${passedH / 64})`,
                          transformOrigin: "bottom",
                          transition:
                            "transform 0.5s var(--ease-standard, cubic-bezier(0.4,0,0.2,1))",
                        }}
                      />
                    )}
                    {day.total === 0 && (
                      <div
                        style={{
                          height: 3,
                          background: "var(--dash-border)",
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--dash-text-tertiary)",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid var(--dash-border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "hsl(142 71% 45%)",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--dash-text-secondary)" }}>
                Passed
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "hsl(0 84% 60%)",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--dash-text-secondary)" }}>
                Failed
              </span>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "var(--dash-text-tertiary)",
              }}
            >
              {metrics.totalRuns} total runs
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: "var(--dash-card-radius)",
            padding: 20,
            boxShadow: "var(--dash-shadow-card)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="dash-section-header" style={{ marginBottom: 4 }}>
            <div>
              <div className="dash-section-title" style={{ fontSize: 14 }}>
                Recent Activity
              </div>
              <div className="dash-section-subtitle">Latest executions</div>
            </div>
            <button
              className="dash-btn dash-btn-ghost"
              style={{ fontSize: 11, padding: "4px 8px", gap: 4 }}
              onClick={() => onNavigate("history")}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ActivityFeed
              runs={recentRuns}
              maxItems={7}
              onViewRun={onViewRun}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <div className="dash-section-header" style={{ marginBottom: 12 }}>
          <div className="dash-section-title" style={{ fontSize: 14 }}>
            Quick Actions
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QuickAction
            icon={<FolderKanban size={16} />}
            label="New Project"
            onClick={() => onNavigate("projects")}
            accent
          />
          <QuickAction
            icon={<GitBranch size={16} />}
            label="View Flows"
            onClick={() => onNavigate("flows")}
          />
          <QuickAction
            icon={<Play size={16} />}
            label="Run History"
            onClick={() => onNavigate("history")}
          />
          <QuickAction
            icon={<Zap size={16} />}
            label="AI & Integrations"
            onClick={() => onNavigate("ai")}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ icon, label, onClick, accent }) {
  return (
    <button
      className={`dash-btn ${accent ? "dash-btn-primary" : "dash-btn-secondary"}`}
      onClick={onClick}
      style={{ gap: 8 }}
    >
      {icon}
      {label}
    </button>
  );
}
