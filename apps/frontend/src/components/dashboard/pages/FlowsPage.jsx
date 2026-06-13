import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Search,
  Play,
  Edit2,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useProjects } from "../hooks/useDashboardData";
import EmptyState from "../components/EmptyState";

function timeAgo(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000),
    h = Math.floor(diff / 3600000),
    days = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
}

const rowVariant = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export default function FlowsPage({ onOpenFlow, onRunFlow, onNavigate }) {
  const { data: projects = [], isLoading } = useProjects();
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");

  const allFlows = useMemo(
    () =>
      projects.flatMap((p) =>
        (p.flows || []).map((f) => ({
          ...f,
          projectName: p.name,
          projectId: p.id,
        })),
      ),
    [projects],
  );

  const filtered = useMemo(() => {
    let list = [...allFlows];
    if (selectedProject !== "all")
      list = list.filter((f) => f.projectId === selectedProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name?.toLowerCase().includes(q));
    }
    return list;
  }, [allFlows, search, selectedProject]);

  return (
    <div>
      {/* Page title */}
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
          Flows{" "}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--dash-text-tertiary)",
              marginLeft: 8,
            }}
          >
            {filtered.length}
          </span>
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          All automation flows across your projects
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
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
            placeholder="Search flows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Filter size={12} style={{ color: "var(--dash-text-tertiary)" }} />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
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

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
          }}
        >
          <EmptyState
            icon={<GitBranch size={24} />}
            title={search ? "No flows match" : "No flows yet"}
            description={
              search
                ? "Try a different keyword"
                : "Create flows within your projects"
            }
            action={!search ? () => onNavigate?.("projects") : undefined}
            actionLabel="Go to Projects"
          />
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="dash-table-wrap">
          <table className="dash-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Flow Name</th>
                <th>Project</th>
                <th>
                  <Clock
                    size={11}
                    style={{ display: "inline", marginRight: 4 }}
                  />
                  Modified
                </th>
                <th>
                  <CheckCircle2
                    size={11}
                    style={{ display: "inline", marginRight: 4 }}
                  />
                  Success Rate
                </th>
                <th style={{ width: 140, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {filtered.map((flow) => (
                <motion.tr
                  key={`${flow.projectId}-${flow.id}`}
                  variants={rowVariant}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenFlow?.(flow)}
                >
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "var(--dash-accent-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <GitBranch
                          size={13}
                          style={{ color: "var(--dash-accent)" }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--dash-text-primary)",
                          }}
                        >
                          {flow.name}
                        </div>
                        {flow.nodes && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--dash-text-tertiary)",
                              marginTop: 1,
                            }}
                          >
                            {flow.nodes.length} nodes
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        background: "var(--dash-surface-hover)",
                        border: "1px solid var(--dash-border)",
                        borderRadius: 5,
                        padding: "2px 7px",
                        color: "var(--dash-text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {flow.projectName}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--dash-text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    {timeAgo(flow.updated_at || flow.created_at)}
                  </td>
                  <td>
                    <SuccessRateBar rate={flow.successRate} />
                  </td>
                  <td>
                    <div
                      className="dash-row-actions"
                      style={{ justifyContent: "flex-end" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="dash-row-action-btn"
                        title="Run"
                        onClick={() => onRunFlow?.(flow)}
                      >
                        <Play size={12} />
                      </button>
                      <button
                        className="dash-row-action-btn"
                        title="Edit"
                        onClick={() => onOpenFlow?.(flow)}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="dash-row-action-btn"
                        title="Duplicate"
                        onClick={() => {}}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        className="dash-row-action-btn danger"
                        title="Delete"
                        onClick={() => {}}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SuccessRateBar({ rate }) {
  if (rate === null || rate === undefined)
    return (
      <span style={{ fontSize: 11, color: "var(--dash-text-tertiary)" }}>
        —
      </span>
    );
  const pct = Math.round(rate);
  const color =
    pct >= 80
      ? "var(--dash-success)"
      : pct >= 50
        ? "var(--dash-warning)"
        : "var(--dash-error)";
  return (
    <div className="dash-success-bar">
      <div className="dash-success-bar__track">
        <div
          className="dash-success-bar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="dash-success-bar__label"
        style={{ color, fontSize: 11, fontWeight: 700 }}
      >
        {pct}%
      </span>
    </div>
  );
}
