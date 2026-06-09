import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  SortAsc,
} from "lucide-react";
import { useProjects, useRecentRuns } from "../hooks/useDashboardData";
import ProjectCard from "../components/ProjectCard";
import EmptyState from "../components/EmptyState";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function ProjectsPage({
  onOpenProject,
  onCreateProject,
  onDeleteProject,
}) {
  const { data: projects = [], isLoading } = useProjects();
  const { data: recentRuns = [] } = useRecentRuns(50);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("name");

  // Map runs to projects
  const runsByProject = useMemo(() => {
    const map = {};
    recentRuns.forEach((run) => {
      if (run.project_id && !map[run.project_id]) {
        map[run.project_id] = run;
      }
    });
    return map;
  }, [recentRuns]);

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (sort === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "flows") {
      list.sort((b, a) => (a.flows?.length || 0) - (b.flows?.length || 0));
    } else if (sort === "recent") {
      list.sort((a, b) => {
        const aRun = runsByProject[a.id];
        const bRun = runsByProject[b.id];
        if (!aRun && !bRun) return 0;
        if (!aRun) return 1;
        if (!bRun) return -1;
        return (
          new Date(bRun.started_at || bRun.created_at) -
          new Date(aRun.started_at || aRun.created_at)
        );
      });
    }
    return list;
  }, [projects, search, sort, runsByProject]);

  // Skeleton loader
  if (isLoading) {
    return (
      <div>
        <PageHeader
          count={null}
          search={search}
          onSearch={setSearch}
          view={view}
          onView={setView}
          sort={sort}
          onSort={setSort}
          onNew={onCreateProject}
          isLoading
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="dash-skeleton"
              style={{ height: 160, borderRadius: 12 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        count={filtered.length}
        search={search}
        onSearch={setSearch}
        view={view}
        onView={setView}
        sort={sort}
        onSort={setSort}
        onNew={onCreateProject}
      />

      {/* Empty State */}
      {filtered.length === 0 && !isLoading && (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 12,
            marginTop: 20,
          }}
        >
          <EmptyState
            icon={<FolderKanban size={24} />}
            title={
              search ? "No projects match your search" : "No projects yet"
            }
            description={
              search
                ? "Try a different keyword"
                : "Create your first project to start building automation flows"
            }
            action={!search ? onCreateProject : undefined}
            actionLabel="Create Project"
          />
        </div>
      )}

      {/* Grid / List */}
      {filtered.length > 0 && (
        <>
          {view === "grid" ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                marginTop: 20,
              }}
            >
              {filtered.map((project) => (
                <motion.div key={project.id} variants={item}>
                  <ProjectCard
                    project={project}
                    recentRun={runsByProject[project.id]}
                    onOpen={onOpenProject}
                    onDelete={onDeleteProject}
                    onDuplicate={() => {}} // stub
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div
              className="dash-table-wrap"
              style={{ marginTop: 20 }}
            >
              <table className="dash-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Flows</th>
                    <th>Last Run</th>
                    <th>Status</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => {
                    const run = runsByProject[project.id];
                    return (
                      <tr
                        key={project.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => onOpenProject?.(project)}
                      >
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {project.name}
                          </div>
                          {project.description && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--dash-text-secondary)",
                                marginTop: 2,
                              }}
                            >
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td style={{ color: "var(--dash-text-secondary)", fontSize: 12 }}>
                          {project.flows?.length || 0} flows
                        </td>
                        <td style={{ color: "var(--dash-text-secondary)", fontSize: 12 }}>
                          {run
                            ? new Date(
                                run.started_at || run.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {run ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color:
                                  run.status === "completed" ||
                                  run.status === "passed"
                                    ? "var(--dash-success)"
                                    : run.status === "running"
                                    ? "var(--dash-running)"
                                    : "var(--dash-error)",
                              }}
                            >
                              {run.status}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--dash-text-tertiary)",
                              }}
                            >
                              no runs
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="dash-btn dash-btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject?.(project);
                            }}
                          >
                            ···
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageHeader({
  count,
  search,
  onSearch,
  view,
  onView,
  sort,
  onSort,
  onNew,
  isLoading,
}) {
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
          Projects
          {count !== null && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--dash-text-tertiary)",
                marginLeft: 10,
              }}
            >
              {count}
            </span>
          )}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Manage and organize your automation projects
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div className="dash-search-input" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={13} style={{ color: "var(--dash-text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <SortAsc size={13} style={{ color: "var(--dash-text-tertiary)" }} />
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 7,
              padding: "6px 10px",
              fontSize: 12,
              color: "var(--dash-text-primary)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <option value="name">Name</option>
            <option value="flows">Most Flows</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            borderRadius: 7,
            padding: 2,
            gap: 2,
          }}
        >
          <ViewBtn
            active={view === "grid"}
            onClick={() => onView("grid")}
            icon={<LayoutGrid size={13} />}
            title="Grid view"
          />
          <ViewBtn
            active={view === "list"}
            onClick={() => onView("list")}
            icon={<List size={13} />}
            title="List view"
          />
        </div>

        {/* New Project */}
        <button
          id="dash-new-project-btn"
          className="dash-btn dash-btn-primary"
          onClick={onNew}
          disabled={isLoading}
        >
          <Plus size={14} />
          New Project
        </button>
      </div>
    </div>
  );
}

function ViewBtn({ active, onClick, icon, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: "5px 8px",
        borderRadius: 5,
        border: "none",
        background: active ? "var(--dash-accent-subtle)" : "transparent",
        color: active ? "var(--dash-accent)" : "var(--dash-text-tertiary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.12s ease",
      }}
    >
      {icon}
    </button>
  );
}
