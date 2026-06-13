import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../hooks/useToast";
import { useProjectManager } from "../hooks/useProjectManager";
import "./dashboard.css";

import DashboardSidebar from "./layout/DashboardSidebar";
import DashboardHeader from "./layout/DashboardHeader";
import OverviewPage from "./pages/OverviewPage";
import ProjectsPage from "./pages/ProjectsPage";
import FlowsPage from "./pages/FlowsPage";
import RunsPage from "./pages/RunsPage";
import HistoryPage from "./pages/HistoryPage";
import { ReportsPage, AIPage, SettingsPageDash } from "./pages/StubPages";
import { dashboardKeys } from "./hooks/useDashboardData";
import CreationModal from "../CreationModal";
import { useRuns } from "./hooks/useDashboardData";

const PAGE_SEARCH_ENABLED = ["projects", "flows", "history", "runs"];
const PAGE_PRIMARY_ACTION = {
  projects: "New Project",
};

const pageVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function HalDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { openSettings } = useSettings();
  const { createProject, loadProject, deleteProject } = useProjectManager();

  const [activePage, setActivePage] = useState("overview");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [creationModal, setCreationModal] = useState({ isOpen: false });

  // Track active runs count for sidebar badge
  const { data: activeRunsData = [] } = useRuns({
    status: "running",
    limit: 10,
  });
  const activeRunsCount = activeRunsData.length;

  // ── Navigation ──────────────────────────────────────────────
  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    setSearch("");
  }, []);

  const handleBackToCanvas = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // ── Refresh ──────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: dashboardKeys.all });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [qc]);

  // ── Projects ─────────────────────────────────────────────────
  const handleCreateProject = useCallback(() => {
    setCreationModal({ isOpen: true });
  }, []);

  const handleConfirmCreateProject = useCallback(
    async (name) => {
      try {
        await createProject(name, "");
        await qc.invalidateQueries({ queryKey: dashboardKeys.projects() });
        toast.success(`Project "${name}" created`);
      } catch {
        toast.error("Failed to create project");
      }
    },
    [createProject, qc, toast],
  );

  const handleOpenProject = useCallback(
    (project) => {
      loadProject(project.id);
      navigate("/");
    },
    [loadProject, navigate],
  );

  const handleDeleteProject = useCallback(
    async (project) => {
      if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
      try {
        await deleteProject(project.id);
        await qc.invalidateQueries({ queryKey: dashboardKeys.projects() });
        toast.success(`Project "${project.name}" deleted`);
      } catch {
        toast.error("Failed to delete project");
      }
    },
    [deleteProject, qc, toast],
  );

  // ── Flows ─────────────────────────────────────────────────────
  const handleOpenFlow = useCallback(
    (flow) => {
      if (flow.projectId) loadProject(flow.projectId);
      navigate("/");
    },
    [loadProject, navigate],
  );

  // ── Reports ───────────────────────────────────────────────────
  const handleViewReport = useCallback(
    (runId) => {
      if (runId) {
        navigate(`/?reportRunId=${runId}`);
      } else {
        handleNavigate("runs");
      }
    },
    [navigate, handleNavigate],
  );

  // ── Primary action per page ───────────────────────────────────
  const handlePrimaryAction = useCallback(() => {
    if (activePage === "projects") handleCreateProject();
  }, [activePage, handleCreateProject]);

  // ── Page render ───────────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return (
          <OverviewPage
            onNavigate={handleNavigate}
            onViewRun={(run) => handleViewReport(run?.id)}
          />
        );
      case "projects":
        return (
          <ProjectsPage
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        );
      case "flows":
        return (
          <FlowsPage
            onOpenFlow={handleOpenFlow}
            onRunFlow={(flow) => {
              handleOpenFlow(flow);
            }}
            onNavigate={handleNavigate}
          />
        );
      case "runs":
        return <RunsPage onViewReport={handleViewReport} />;
      case "history":
        return <HistoryPage onViewReport={handleViewReport} />;
      case "reports":
        return <ReportsPage onViewReport={() => handleNavigate("runs")} />;
      case "ai":
        return <AIPage />;
      case "settings":
        return (
          <SettingsPageDash
            onOpenSettings={() => {
              navigate("/");
              openSettings();
            }}
          />
        );
      default:
        return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="hal-dashboard">
      {/* Sidebar */}
      <DashboardSidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onBackToCanvas={handleBackToCanvas}
        activeRunsCount={activeRunsCount}
        user={user}
      />

      {/* Main area */}
      <div className="hal-dashboard__main">
        {/* Header */}
        <DashboardHeader
          activePage={activePage}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onPrimaryAction={
            PAGE_PRIMARY_ACTION[activePage] ? handlePrimaryAction : undefined
          }
          primaryActionLabel={PAGE_PRIMARY_ACTION[activePage]}
          searchValue={
            PAGE_SEARCH_ENABLED.includes(activePage) ? search : undefined
          }
          onSearchChange={
            PAGE_SEARCH_ENABLED.includes(activePage) ? setSearch : undefined
          }
        />

        {/* Content with page transition */}
        <div className="hal-dashboard__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Creation Modal */}
      <CreationModal
        isOpen={creationModal.isOpen}
        title="New Project"
        placeholder="Project name..."
        onClose={() => setCreationModal({ isOpen: false })}
        onConfirm={async (result) => {
          if (typeof result === "string") {
            await handleConfirmCreateProject(result);
          }
          setCreationModal({ isOpen: false });
        }}
      />
    </div>
  );
}
