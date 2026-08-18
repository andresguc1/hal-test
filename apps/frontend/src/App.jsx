import React, { useState, useCallback, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {
  ReactFlow,
  Controls,
  ControlButton,
  Background,
  useReactFlow,
  useStoreApi,
  MarkerType,
  ConnectionMode,
  useNodesInitialized,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./components/styles/App.css";
import "./components/styles/reactflow-theme.css";

import AppHeader from "./components/AppHeader";
import Toolbox from "./components/Toolbox";
import NodeConfigurationPanel from "./components/NodeConfigurationPanel";
import AppFooter from "./components/AppFooter";
import StyledMiniMap from "./components/StyledMiniMap";
import { nodeTypes } from "./components/nodes";
import CustomConnectionLine from "./components/CustomConnectionLine";
import CustomEdge from "./components/edges/CustomEdge";
// import ApiKeysModal from "./components/APIKeysModal"; // Deprecated
import SettingsModal from "./components/SettingsModal";
import { useSettings } from "./context/SettingsContext";
import ProgressBar from "./components/ProgressBar";

import ImportDialog from "./components/ImportDialog";
import ExportDialog from "./components/ExportDialog";
import MetricsDashboardModal from "./components/MetricsDashboardModal";
import ContextMenu from "./components/ContextMenu";
import CreationModal from "./components/CreationModal";
import StarterOverlay from "./components/StarterOverlay";
import ErrorBoundary from "./components/ErrorBoundary";

// import { colors } from "./components/styles/colors"; // Unused
import { useFlowManager } from "./components/hooks/useFlowManager.js";
import { useProjectManager } from "./components/hooks/useProjectManager.js";
import { migrateFromLegacy } from "./utils/migration";
import { runPolicyEnforcer } from "./utils/policyEnforcer";

import { useFlowShortcuts } from "./hooks/useKeyboardShortcuts";
import { useToast } from "./hooks/useToast";
import { HalToaster } from "./components/Toast";
import { useHaltestSocket } from "./hooks/useHaltestSocket";
import { useFigmaInteraction } from "./hooks/useFigmaInteraction";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useNodeDefinitions } from "./hooks/useNodeDefinitions";
import RunHistoryPanel from "./components/RunHistoryPanel";
import StepDetailsModal from "./components/StepDetailsModal";
import ReportDashboard from "./components/reporting/ReportDashboard";
import { ExportModal } from "./components/modals/ExportModal";
import { ImportModal } from "./components/modals/ImportModal";
import ExecutionDashboard from "./components/reporting/ExecutionDashboard";
import HalDashboard from "./components/dashboard/HalDashboard";
import { api } from "./utils/api";
import { useElementPicker } from "./hooks/useElementPicker";
import { AnimatePresence, motion } from "framer-motion";
import GuestModeModal from "./components/modals/GuestModeModal";
import DatasetRunModal from "./components/modals/DatasetRunModal";
import PerformanceRunModal from "./components/performance/PerformanceRunModal";
import SecurityRunModal from "./components/security/SecurityRunModal";
import { useExecutionStore } from "./stores/useExecutionStore";

import NodeCreationPanel from "./components/NodeCreationPanel";
import { useAuth } from "./context/AuthContext";
import {
  CollaborationProvider,
  RemoteCursors,
  useCollaboration,
  useAwareness,
} from "./collaboration";

import { NODE_STATES } from "./components/hooks/flowStyles";
import {
  Terminal,
  Settings,
  History,
  Sun,
  Moon,
  Database,
  Search,
  Plus,
  Trash2,
  Play,
  Info,
  ChevronDown,
  Wand2,
  X,
} from "lucide-react";
import { useLogStore } from "./context/LogContext";
import TerminalPanel from "./components/TerminalPanel";
import VariablePanel from "./components/VariablePanel";
import AskAIPanel from "./components/AskAIPanel";
import { cn } from "@/lib/utils";

const edgeTypes = {
  custom: CustomEdge,
};

// ========================================
// DASHBOARD COMPONENT (Main Work Area)
// ========================================

function Dashboard({
  projects,
  currentProject,
  currentFlowId,
  loadProjects,
  createProject,
  loadProject,
  deleteProject,
  createFlow,
  switchFlow,
  deleteFlow,
  renameFlow,
  renameProject,
  updateProject,
}) {
  // 1. Utility Hooks
  const { t } = useTranslation();
  const { theme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch dynamic node definitions from API on mount (updates nodeConstants in-place)
  useNodeDefinitions();
  const hasLogs = useLogStore((state) => state.logs.length > 0);
  const addLog = useLogStore((state) => state.addLog);
  const isPanelVisible = useLogStore((state) => state.isPanelVisible);
  const togglePanel = useLogStore((state) => state.togglePanel);
  const reactFlowWrapper = React.useRef(null);
  const prevEnforceStructureRef = React.useRef("");
  const warningsMapRef = React.useRef({});

  // 2. Navigation & Context Hooks

  const {
    openSettings,
    closeSettings,
    isSettingsOpen,
    settingsTab,
    openApiKeys,
    showGrid,
    enableSnapping,
    showMinimap,
  } = useSettings();

  const { figmaConfig, handlers } = useFigmaInteraction();
  const { zoomIn, zoomOut, fitView } = handlers;

  const {
    getNodes,
    getEdges,
    deleteElements,
    setViewport,
    fitView: reactFlowFitView,
    screenToFlowPosition,
  } = useReactFlow();
  const store = useStoreApi();
  window.rfGetNodes = getNodes;
  window.rfGetEdges = getEdges;
  window.rfStore = store;

  // 3. Core Flow Management Hub
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    updateNodeConfiguration,
    deleteNode,
    executeFlow,
    executeSingleNode,
    saveFlow,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedAction,
    setNodes,
    setEdges,
    addNode,
    copyElements,
    pasteElements,
    cutElements,
    duplicateElements,
    clipboard,
    groupNodes,
    loopNodes,
    ungroupNodes,
    viewStack,
    setViewStack,
    enterComponent,
    exitComponent,
    deepNavigate,
    setSelectedNodeId,
    validateFlowStructure,
    updateNodeState,
    activeBrowserId,
    setActiveBrowserId,
    stopSession,
    hasUnsavedChanges,
    detectOrphans,
    projectPath,
    isReadOnly,
    replayRun,
    resetExecutionStates,
    loadStarterTemplate,
    isStarterTemplate,
    addGhostNode,
    migrateNodes,
    onLayout,
    apiStatus,
    toggleNodesDisabled,
    toggleDownstreamDisabled,
    designTimeContext,
    simulatedResults,
    activeRunId,
  } = useFlowManager(currentProject, currentFlowId, switchFlow);
  window.nodes = nodes;
  window.edges = edges;

  const { updateCursor, role, isCollaborative } = useCollaboration();
  const { isRemoteExecuting, remoteExecution } = useAwareness();
  const isWorkspaceReadOnly =
    isReadOnly || (isCollaborative && role === "viewer");

  // Initial Layout Logic (Magic Organizer)
  const nodesInitialized = useNodesInitialized();
  const initialLayoutApplied = React.useRef(false);

  useEffect(() => {
    if (nodesInitialized && !initialLayoutApplied.current) {
      if (nodes.length > 0) {
        onLayout("LR", reactFlowFitView);
      }
      initialLayoutApplied.current = true;
    }
  }, [nodesInitialized, onLayout, reactFlowFitView, nodes.length]);

  // Collaboration toggle handler
  const handleToggleCollaboration = useCallback(async () => {
    if (!currentProject) return;
    try {
      const newValue = !currentProject.collaborationEnabled;
      await updateProject(currentProject.id, {
        collaborationEnabled: newValue,
      });
    } catch (err) {
      console.error("[Dashboard] Failed to toggle collaboration:", err);
    }
  }, [currentProject, updateProject]);

  const handleMouseMove = useCallback(
    (event) => {
      if (!updateCursor) return;
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateCursor(flowPos);
    },
    [updateCursor, screenToFlowPosition],
  );

  useEffect(() => {
    const handleUpdateNodeConfig = (event) => {
      const { nodeId, configuration } = event.detail;
      updateNodeConfiguration(nodeId, configuration);
    };

    window.addEventListener("update-node-config", handleUpdateNodeConfig);
    return () => {
      window.removeEventListener("update-node-config", handleUpdateNodeConfig);
    };
  }, [updateNodeConfiguration]);

  // Navigate to a node: select it AND center the canvas on it
  const handleNavigateToNode = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      setSelectedNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        })),
      );
      // Small delay so the panel re-renders with the new node first
      setTimeout(() => {
        reactFlowFitView({
          nodes: [{ id: nodeId }],
          duration: 600,
          padding: 0.8, // More padding when focusing a single node
          maxZoom: 1.2,
        });
      }, 80);
    },
    [setSelectedNodeId, reactFlowFitView, setNodes],
  );

  const handleRunDataset = React.useCallback(
    async (dataset, concurrency = 2, options = {}) => {
      if (!currentFlowId) {
        toast.info(
          t(
            "common.save_before_dataset",
            "Save the flow before running dataset.",
          ),
        );
        return;
      }
      const toastId = toast.loading(
        t("common.dataset_processing", "Preparing dataset run..."),
      );
      try {
        const result = await api.post("/runs/dataset-batch", {
          flowId: currentFlowId,
          projectId: currentProject?.id,
          dataset: dataset,
          variablesMapping: {},
          concurrency: concurrency,
          overrides: { headless: options.headless ?? false },
        });
        if (result.success) {
          toast.dismiss(toastId);
          toast.success(
            t("common.dataset_started", {
              defaultValue: `Dataset batch started with ${result.batchId ? "batch: " + result.batchId : "success"}`,
            }),
          );
          setIsDatasetModalOpen(false);
        } else {
          toast.dismiss(toastId);
          toast.error(result.message || t("common.dataset_error"));
        }
      } catch (error) {
        toast.dismiss(toastId);
        console.error("[App] Dataset run failed:", error);
        toast.error(
          t("common.dataset_error_msg", "Dataset run failed: {{message}}", {
            message: error.message,
          }),
        );
      }
    },
    [currentFlowId, currentProject?.id, toast, t],
  );

  const [canvasViewMode, setCanvasViewMode] = useState("calidad");

  const handleExecuteFlow = useCallback(
    async (options = {}) => {
      const targetMode = options?.executionMode || canvasViewMode;
      // --- COLLABORATION LOCK CHECKS ---
      if (isCollaborative) {
        if (role !== "owner") {
          toast.error(
            t(
              "common.owner_execute_only",
              "🔒 Solo el propietario (owner) puede ejecutar el flujo.",
            ),
          );
          return;
        }
        if (isRemoteExecuting) {
          toast.error(
            t(
              "common.remote_executing",
              "🔒 {{user}} está ejecutando este flujo actualmente...",
              {
                user: remoteExecution?.user?.name || "Otro colaborador",
              },
            ),
          );
          return;
        }
      }

      // --- UNIVERSAL EXECUTION CONTEXT ---
      // We stay in the current view context (sub-flow or root) to allow local monitoring.
      // The engine handles global initialization automatically.
      // ------------------------------------------

      // 0. DRY RUN VALIDATION (Clean UX: No loading toast for instant validation)
      const draftMode = useExecutionStore.getState().draftMode;
      const validationErrors = draftMode
        ? []
        : validateFlowStructure(nodes, edges);
      if (validationErrors.length > 0) {
        const firstError = validationErrors[0];
        const errorMsg =
          typeof firstError === "string" ? firstError : firstError.message;
        const errorNodeId =
          typeof firstError === "string" ? null : firstError.nodeId;

        toast.error(errorMsg, {
          duration: 5000,
          style: { border: "1px solid #ef4444", color: "#ef4444" },
        });

        if (errorNodeId) {
          addLog(
            `[ValidationError] NodeId=${errorNodeId} Error="${errorMsg}"`,
            "error",
            errorNodeId,
          );
          handleNavigateToNode(errorNodeId);
        } else {
          addLog(`[ValidationError] Error="${errorMsg}"`, "error");
        }
        return; // Stop here, no processing toast shown.
      }

      if (!currentFlowId) {
        toast.info(
          t(
            "common.save_before_execute",
            "Debes guardar el flujo antes de ejecutarlo.",
          ),
        );
        setCreationModal({ isOpen: true, type: "flow" });
        return;
      }

      // Log execution start indicating active view mode
      const modeLabel =
        targetMode === "performance"
          ? "PERFORMANCE"
          : targetMode === "seguridad"
            ? "SECURITY"
            : "QUALITY AUTOMATION";
      addLog(`[System] 🚀 Starting ${modeLabel} flow execution...`, "info");
      useExecutionStore.getState().startExecution({
        mode: targetMode,
        flowId: currentFlowId,
      });

      // 1. Show Loading Toast immediately (Duration 0 = indefinite until dismissed)
      const toastId = toast.loading(t("common.processing"));

      let executionSuccess = false;
      try {
        // --- EXECUTION ISOLATION (Debug vs E2E) ---
        if (activeBrowserId) {
          if (
            confirm(
              t(
                "common.confirm_close_debug",
                "Active debug session detected. Close it to ensure a clean E2E run?",
              ),
            )
          ) {
            toast.loading("Closing debug session...", { id: toastId });
            await stopSession();
          } else {
            // If user refuses to close, we abort to prevent collisions
            toast.dismiss(toastId);
            toast.info("Execution cancelled to preserve debug session.");
            useExecutionStore
              .getState()
              .finishExecution({ status: "cancelled" });
            return;
          }
        }
        // ------------------------------------------

        const result = await executeFlow({ executionMode: targetMode }); // Returns { success, stats, failedNodeId, divePath, healedNodes }
        executionSuccess = result?.success === true;

        // 2. Clear loading
        toast.dismiss(toastId);

        // --- AUTO-APPLY AI HEALING ---
        if (result.healedNodes?.length > 0) {
          console.log("[App] AI Healed nodes detected:", result.healedNodes);
          result.healedNodes.forEach((repair) => {
            updateNodeConfiguration(repair.nodeId, {
              selector: repair.newSelector,
            });
          });
          toast.success(
            t("common.ai_repair_applied", {
              defaultValue: `AI automatically repaired ${result.healedNodes.length} selector(s).`,
              count: result.healedNodes.length,
            }),
          );
        }

        // --- DEEP DIVE LOGIC (If execution failed inside a composite) ---
        if (result.success) {
          addLog(
            `[System] ✓ Flow execution completed successfully in ${
              targetMode === "performance"
                ? "performance"
                : targetMode === "seguridad"
                  ? "security"
                  : "quality"
            } mode.`,
            "success",
          );
          toast.success(
            t("common.flow_exec_success", "Flow executed successfully"),
          );

          // Redirect to dashboard tab after 1.5 seconds
          setTimeout(() => {
            if (targetMode === "performance") {
              navigate("/dashboard", {
                state: { activePage: "performance", activeTab: "results" },
              });
            } else if (targetMode === "seguridad") {
              navigate("/dashboard", {
                state: { activePage: "security", activeTab: "results" },
              });
            }
          }, 1500);
          return;
        }

        if (!result.success && result.failedNodeId) {
          try {
            // Show error toast for immediate feedback
            const errorMsg = result.error || t("common.flow_exec_error");
            toast.error(`✗ ${errorMsg}`, {
              duration: 5000,
              style: { border: "1px solid #ef4444", color: "#ef4444" },
            });

            // Explicit console log for the user
            console.error(
              `%c[ExecutionError] NodeId=${result.failedNodeId} Error="${errorMsg}"`,
              "color: #ef4444; font-weight: bold; font-size: 12px;",
            );

            // Synchronize with Internal Execution Log
            addLog(
              `[System] ✗ Execution failed on node ${result.failedNodeId} during ${
                canvasViewMode === "performance"
                  ? "performance"
                  : canvasViewMode === "seguridad"
                    ? "security"
                    : "quality"
              } run.`,
              "error",
              result.failedNodeId,
            );
            addLog(
              `[NodeError] NodeId=${result.failedNodeId} Error="${errorMsg}"`,
              "error",
              result.failedNodeId,
            );

            // Use deepNavigate to handle multi-level sub-flow traversal and node focus
            await deepNavigate(result.divePath || [], result.failedNodeId);
          } catch (navError) {
            console.error("[App] Failed auto-focus navigation:", navError);
          }
        } else if (result.error && !result.stats) {
          // General Failure
          if (result.error !== "Max reintentos alcanzados") {
            toast.error(result.error);
          }
          addLog(
            `[System] ✗ Execution failed: ${result.error} during ${
              canvasViewMode === "performance"
                ? "performance"
                : canvasViewMode === "seguridad"
                  ? "security"
                  : "quality"
            } run.`,
            "error",
          );
        } else {
          // Failure with Count (Run happened but no specific node tracked)
          const failedCount = result.stats?.failed || 0;
          toast.error(`${t("common.flow_exec_error")} (${failedCount} failed)`);
          addLog(
            `[System] ✗ Execution completed with ${failedCount} failures during ${
              canvasViewMode === "performance"
                ? "performance"
                : canvasViewMode === "seguridad"
                  ? "security"
                  : "quality"
            } run.`,
            "error",
          );
        }
      } catch (error) {
        // 3. Unexpected Error
        toast.dismiss(toastId);
        console.error("Error ejecutando flujo:", error);
        toast.error(
          t(
            "common.flow_exec_error_msg",
            "Flow execution failed: {{message}}",
            {
              message: error.message,
            },
          ),
        );
      } finally {
        let runDetails = null;
        const activeRunId = useExecutionStore.getState().activeRunId;
        if (activeRunId && targetMode === "performance") {
          try {
            const runRes = await api.get(`/runs/${activeRunId}`);
            if (runRes.success && runRes.data) {
              runDetails = runRes.data;
            }
          } catch (e) {
            console.error(
              "Failed to fetch run details for profiling dashboard:",
              e,
            );
          }
        }
        useExecutionStore.getState().finishExecution({
          status: executionSuccess ? "completed" : "failed",
          perfReport: runDetails,
        });
      }
    },
    [
      executeFlow,
      validateFlowStructure,
      toast,
      t,
      nodes,
      edges,
      activeBrowserId,
      stopSession,
      currentFlowId,
      updateNodeConfiguration,
      deepNavigate,
      addLog,
      handleNavigateToNode,
      isCollaborative,
      role,
      isRemoteExecuting,
      remoteExecution,
      canvasViewMode,
      navigate,
    ],
  );

  // 4. Local UI State
  const [pendingExecution, setPendingExecution] = useState(false);
  const [isCreationPanelVisible, setIsCreationPanelVisible] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false);
  const [isVariablePanelVisible, setIsVariablePanelVisible] = useState(false);
  const [isAskAIPanelVisible, setIsAskAIPanelVisible] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMetricsDashboardOpen, setIsMetricsDashboardOpen] = useState(false);

  const [isExecutionDashboardOpen, setIsExecutionDashboardOpen] =
    useState(false);
  const [proposedNodes, setProposedNodes] = useState(null);
  const [confirmationPromise, setConfirmationPromise] = useState(null);
  const [creationModal, setCreationModal] = useState({
    isOpen: false,
    type: "project",
  });
  const [executionProgress, setExecutionProgress] = useState({
    current: 0,
    total: 0,
    status: "",
  });
  const [isStarterDismissed, setIsStarterDismissed] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState(null);
  const [stepDetailsModal, setStepDetailsModal] = useState({
    isOpen: false,
    nodeData: null,
  });
  const [pendingFocusNode, setPendingFocusNode] = useState(null);
  const { user, authMode } = useAuth();
  const isGuest = user?.isGuest || authMode === "local";
  const [isGuestModeModalOpen, setIsGuestModeModalOpen] = useState(false);

  const handleSyncCloud = useCallback(() => {
    if (isGuest) {
      setIsGuestModeModalOpen(true);
    } else {
      toast.info("Syncing to HalTest Cloud...");
      // Implementation for cloud sync would go here
    }
  }, [isGuest, toast]);

  const handleLoginRedirect = useCallback(() => {
    setIsGuestModeModalOpen(false);
    window.location.href = "/login"; // Or trigger Supabase login flow
  }, []);

  const [reportingRunId, setReportingRunId] = useState(null);

  // 5. Effects
  React.useEffect(() => {
    const runMigration = async () => {
      try {
        const migratedProject = await migrateFromLegacy();
        if (migratedProject) {
          toast.success(`✓ ${t("common.migrate_success")}`);
          loadProjects();
        }
      } catch (error) {
        console.error("Migration error:", error);
        toast.error(t("common.migrate_error"));
      }
    };
    runMigration();
  }, [toast, loadProjects, t]);

  React.useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      loadProject(projects[0].id);
    }
  }, [projects, currentProject, loadProject]);

  React.useEffect(() => {
    if (currentProject?.flows?.length > 0 && !currentFlowId) {
      const mainFlow =
        currentProject.flows.find((f) => f.name === "Main Flow") ||
        currentProject.flows[0];
      if (mainFlow) {
        switchFlow(mainFlow.id);
        setIsStarterDismissed(false);
      }
    }
  }, [currentProject, currentFlowId, switchFlow]);

  React.useEffect(() => {
    if (pendingExecution && viewStack.length === 0 && nodes.length > 0) {
      const hasLaunchBrowser = nodes.some(
        (n) => n.type === "launch_browser" || n.data?.type === "launch_browser",
      );
      if (hasLaunchBrowser) {
        console.log("[App] 🚀 Resuming execution at root level...");
        setPendingExecution(false);
        handleExecuteFlow();
      }
    }
  }, [pendingExecution, viewStack.length, nodes, handleExecuteFlow]);

  React.useEffect(() => {
    if (nodes.length > 0) {
      // Just fit view when switching flows, do not force a magic layout automatically
      const timer = setTimeout(() => {
        reactFlowFitView({
          duration: 800,
          padding: 0.5,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentFlowId, reactFlowFitView, nodes.length]);

  // Element Picker Hook
  const {
    handleStartPicking,
    handleCancelPicking,
    handleElementPicked,
    handleElementSanitized,
  } = useElementPicker({
    selectedAction,
    updateNodeState,
    updateNodeConfiguration,
    activeBrowserId,
    setActiveBrowserId,
    nodes,
    edges,
    executeFlow,
    setNodes,
  });

  const handleSelectRun = useCallback(
    async (runBasic, openReport = false) => {
      if (!runBasic) {
        resetExecutionStates();
        setReportingRunId(null);
        return;
      }

      if (openReport) {
        setReportingRunId(runBasic.id);
        setIsHistoryPanelVisible(false); // Close history when opening report
        return;
      }

      try {
        const res = await api.get(`/runs/${runBasic.id}`);
        if (res.success) {
          const run = res.data;
          toast.success(
            `Loaded run from ${new Date(run.started_at).toLocaleTimeString()}`,
          );
          replayRun(run);
        }
      } catch (error) {
        console.error("Failed to load run details:", error);
        toast.error("Failed to load run history");
      }
    },
    [replayRun, resetExecutionStates, toast],
  );

  // Socket setup
  const handleCodegenAction = useCallback(
    (data) => {
      console.log("[App] 👻 Ghost Action Detected:", data);
      // Map Playwright actions to our node types
      const typeMapping = {
        goto: "open_url",
        fill: "type_text",
        type: "type_text",
        click: "click",
        press: "press_key",
      };

      const halType = typeMapping[data.actionType] || data.actionType;
      addGhostNode(halType, data.selector, data.value);
    },
    [addGhostNode],
  );

  // --- MCP Phase 3 Methods ---
  const getCanvasState = useCallback(() => {
    return { nodes, edges };
  }, [nodes, edges]);

  // Make it globally accessible for AIContext
  useEffect(() => {
    window.__HAL_GET_CANVAS_STATE__ = getCanvasState;
    return () => {
      delete window.__HAL_GET_CANVAS_STATE__;
    };
  }, [getCanvasState]);

  const handleMCPInjectNodes = useCallback(
    async (newNodesData) => {
      // Basic coordinate offset so they don't all stack at 0,0
      let startX = 100;
      let startY = 100;

      // Create new nodes and layout them
      const mappedNodes = newNodesData.map((nodeData, index) => {
        const id = `node_${uuidv4()}`;
        return {
          id,
          type: nodeData.type,
          position: { x: startX + index * 250, y: startY },
          data: {
            ...nodeData.data,
            state: NODE_STATES.DEFAULT,
            configuration: nodeData.data || {},
          },
        };
      });

      // Create sequential edges between them
      const newEdges = [];
      for (let i = 0; i < mappedNodes.length - 1; i++) {
        newEdges.push({
          id: `edge_${mappedNodes[i].id}_${mappedNodes[i + 1].id}`,
          source: mappedNodes[i].id,
          target: mappedNodes[i + 1].id,
          type: "custom",
          animated: !import.meta.env.DEV,
        });
      }

      // Add them to canvas (this triggers saveFlow automatically in useFlowManager if configured)
      setNodes((prev) => [...prev, ...mappedNodes]);
      setEdges((prev) => [...prev, ...newEdges]);

      return { success: true, nodeIds: mappedNodes.map((n) => n.id) };
    },
    [setNodes, setEdges],
  );

  const handleMCPProposeNodes = useCallback(
    async (nodes) => {
      return new Promise((resolve, reject) => {
        setProposedNodes(nodes);
        setIsAskAIPanelVisible(true); // Abrir el panel para mostrar la propuesta
        setConfirmationPromise({ resolve, reject });
      });
    },
    [setIsAskAIPanelVisible],
  );

  const handleConfirmProposal = useCallback(async () => {
    if (proposedNodes && confirmationPromise) {
      const result = await handleMCPInjectNodes(proposedNodes);
      await saveFlow(true); // Explictly save nodes to DB to prevent descriptive desync
      confirmationPromise.resolve(result);
      setProposedNodes(null);
      setConfirmationPromise(null);
    }
  }, [proposedNodes, confirmationPromise, handleMCPInjectNodes, saveFlow]);

  const handleRejectProposal = useCallback(() => {
    if (confirmationPromise) {
      confirmationPromise.resolve({
        error: "User rejected node injection proposal.",
      });
      setProposedNodes(null);
      setConfirmationPromise(null);
    }
  }, [confirmationPromise]);

  // MCP phase 3 granular tools
  const handleMCPAddNode = useCallback(
    async (nodeData) => {
      const id = `node_${uuidv4()}`;
      const newNode = {
        id,
        type: nodeData.type,
        position: nodeData.position || { x: 100, y: 100 },
        data: {
          ...nodeData.data,
          state: NODE_STATES.DEFAULT,
          configuration: nodeData.data || {},
        },
      };
      setNodes((prev) => [...prev, newNode]);
      return { success: true, nodeId: id };
    },
    [setNodes],
  );

  const handleMCPConnectNodes = useCallback(
    async ({ sourceId, targetId }) => {
      const newEdge = {
        id: `edge_${sourceId}_${targetId}`,
        source: sourceId,
        target: targetId,
        type: "custom",
        animated: !import.meta.env.DEV,
      };
      setEdges((prev) => [...prev, newEdge]);
      return { success: true };
    },
    [setEdges],
  );

  const handleMCPRemoveNode = useCallback(
    async (nodeId) => {
      deleteNode(nodeId);
      return { success: true };
    },
    [deleteNode],
  );

  const handleMCPUpdateNode = useCallback(
    async (nodeId, data) => {
      await updateNodeConfiguration(nodeId, data);
      return { success: true };
    },
    [updateNodeConfiguration],
  );

  const socket = useHaltestSocket({
    activeRunId,
    setNodes,
    setEdges,
    onElementPicked: handleElementPicked,
    onElementSanitized: handleElementSanitized,
    onLogReceived: addLog,
    onTerminalOutput: null,
    onCodegenAction: handleCodegenAction,
    getCanvasState,
    onProposeNodes: handleMCPProposeNodes,
    onAddNode: handleMCPAddNode,
    onConnectNodes: handleMCPConnectNodes,
    onRemoveNode: handleMCPRemoveNode,
    onUpdateNode: handleMCPUpdateNode,
    onSaveFlow: saveFlow,
    toast,
    executionMode: canvasViewMode,
  });

  // Computed values
  const isConfigurationPanelVisible = selectedAction !== null;

  // Track Node Usage for Smart Favorites
  const [nodeUsage, setNodeUsage] = useState({});
  const frequentNodes = useMemo(() => {
    return Object.entries(nodeUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([type]) => type);
  }, [nodeUsage]);

  // ========================================
  // CALLBACKS - UI
  // ========================================

  // Clear configuration and selection on flow switch
  useEffect(() => {
    closeConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId]);

  const closeConfiguration = useCallback(() => {
    if (setSelectedNodeId) {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  // Navigate to a node moved up.
  useEffect(() => {
    const handleFocusRequest = (e) => {
      const { nodeId, divePath, autoSwitchToSecurity } = e.detail;
      if (autoSwitchToSecurity) {
        setCanvasViewMode("seguridad");
      }
      setPendingFocusNode({ nodeId, divePath });
    };
    window.addEventListener("hal:focus-node", handleFocusRequest);
    return () =>
      window.removeEventListener("hal:focus-node", handleFocusRequest);
  }, []);

  // Process pending focus request once the nodes are loaded/updated in state
  useEffect(() => {
    if (!pendingFocusNode) return;
    const { nodeId, divePath } = pendingFocusNode;
    const nodeExists = nodes.some((n) => n.id === nodeId);
    if (nodeExists) {
      setPendingFocusNode(null);
      if (divePath && divePath.length > 0) {
        deepNavigate(divePath, nodeId);
      } else {
        handleNavigateToNode(nodeId);
      }
    }
  }, [nodes, pendingFocusNode, deepNavigate, handleNavigateToNode]);

  // ========================================
  // CALLBACKS - Footer Actions
  // ========================================

  const ensureProjectAndGetId = useCallback(async () => {
    if (currentProject?.id) return currentProject.id;
    if (projects && projects.length > 0) {
      loadProject(projects[0].id);
      return projects[0].id;
    }
    const { project } = await createProject(
      t("projects.default_name", "General Project"),
    );
    return project.id;
  }, [currentProject, projects, loadProject, createProject, t]);

  // AI Generation Handler
  const handleAIFlowGeneration = useCallback(
    async (prompt) => {
      const toastId = toast.info(
        t("ai.generating", "Generating flow with AI... ✨"),
        { duration: 120000 },
      );
      try {
        const projectId = await ensureProjectAndGetId();

        // 1. Call AI Endpoint
        const responseData = await api.post("/ai/generate-flow", { prompt });

        // 2. Create Container Flow
        const flowName = `AI: ${prompt.slice(0, 20)}...`;
        const response = await createFlow(flowName, projectId);
        const newFlowId = response.flow?.id || response.id; // defensive

        const flowNodes = (
          responseData.flow_json?.nodes ||
          responseData.nodes ||
          []
        ).map((node, index) => ({
          id: node.id || `node_${uuidv4()}`,
          type: node.type,
          position: node.position || { x: 100 + index * 250, y: 150 },
          data: {
            ...node.data,
            state: NODE_STATES.DEFAULT,
            configuration: node.data || {},
          },
        }));
        const flowEdges =
          responseData.flow_json?.edges || responseData.edges || [];

        if (newFlowId && projectId) {
          // 3. Save Generated Content
          await api.put(`/projects/${projectId}/flows/${newFlowId}`, {
            nodes: flowNodes,
            edges: flowEdges,
            viewport: { x: 0, y: 0, zoom: 1 },
          });

          // Force local update if we are already on the new flow
          setNodes(flowNodes);
          setEdges(flowEdges);
          toast.dismiss(toastId);
          toast.success(t("ai.success", "Flow generated successfully! 🧠"));
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error("AI Generation failed", err);
        toast.error(t("ai.error", "AI Generation failed"));
      }
    },
    [createFlow, ensureProjectAndGetId, setNodes, setEdges, toast, t],
  );

  const handleSaveFlow = useCallback(() => {
    if (!currentFlowId) {
      toast.info(
        t(
          "common.save_flow_first",
          "Por favor, dale un nombre y guarda este nuevo flujo.",
        ),
      );
      setCreationModal({ isOpen: true, type: "flow" });
      return;
    }

    try {
      setIsSaving(true);
      saveFlow();
      toast.success(`✓ ${t("common.flow_save_success")}`);
    } catch (error) {
      console.error("Error guardando flujo:", error);
      toast.error(`✗ ${t("common.flow_save_error")}`);
    } finally {
      setIsSaving(false);
    }
  }, [saveFlow, currentFlowId, toast, t]);

  // Export/Import Flow handlers (currently unused)
  /* 
  const handleExportFlow = useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  const handleImportFlow = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []); 
  */
  const handleExportDialogClose = useCallback(() => {
    setIsExportDialogOpen(false);
  }, []);

  const handleImportDialogClose = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const convertActionsToFlowData = useCallback((actions) => {
    const nodes = [];
    const edges = [];

    actions.forEach((actionObj, index) => {
      const nodeId = `imported_${actionObj.action}_${index}_${uuidv4().slice(0, 8)}`;
      const { action, ...config } = actionObj;

      nodes.push({
        id: nodeId,
        type: action,
        position: { x: 100 + index * 250, y: 150 },
        data: {
          type: action,
          label: action
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          configuration: config,
          state: NODE_STATES.DEFAULT,
        },
      });

      if (index > 0) {
        edges.push({
          id: `edge_${nodes[index - 1].id}_to_${nodeId}`,
          source: nodes[index - 1].id,
          target: nodeId,
          animated: !import.meta.env.DEV,
          type: "custom",
        });
      }
    });

    return { nodes, edges };
  }, []);

  const handleImport = useCallback(
    async (importData) => {
      try {
        if (!importData) return;

        // Handle File Import (Client-Side Backup or Single Code File)
        if (importData.mode === "file" && importData.content) {
          let flowData = null;
          try {
            flowData = JSON.parse(importData.content);
          } catch {
            console.log(
              "[DEBUG] File content is not JSON, parsing as test code script...",
            );
          }

          if (flowData && (flowData.nodes || flowData.edges)) {
            // VERSION CHECK
            if (flowData.meta && flowData.meta.version) {
              const version = flowData.meta.version;
              if (version.startsWith("1.")) {
                toast("Importing legacy flow (v1.x)", { icon: "ℹ️" });
              }
            }

            // ORPHAN DETECTION (Pre-checks)
            const orphans = detectOrphans(
              flowData.nodes || [],
              flowData.edges || [],
            );

            // 1. MIGRATE PORTABLE COMPONENTS
            const processedNodes = await migrateNodes(
              flowData.nodes || [],
              currentProject?.id,
            );

            // 2. Restore state
            setNodes(processedNodes);
            setEdges(flowData.edges || []);

            if (flowData.viewport) {
              setViewport(flowData.viewport);
            } else {
              setTimeout(() => fitView({ duration: 800 }), 100);
            }

            if (orphans.length > 0) {
              toast.warning(
                `Imported with warnings: ${orphans.length} orphan nodes detected.`,
              );
            } else {
              toast.success(`✓ ${t("common.flow_import_success")}`);
            }

            setIsImportDialogOpen(false);
          } else {
            // Code script conversion path
            const convertResult = await api.post("/import/convert", {
              content: importData.content,
              framework: importData.framework || "playwright",
              filename: importData.filename,
            });

            if (
              convertResult.success &&
              convertResult.flows &&
              convertResult.flows.length > 0
            ) {
              const importedFlow = convertResult.flows[0];
              const { nodes: flowNodes, edges: flowEdges } =
                convertActionsToFlowData(importedFlow.flow || []);

              const flowName =
                importedFlow.meta?.name ||
                importData.filename?.replace(/\.[^/.]+$/, "") ||
                `Imported ${Date.now()}`;
              const projectId = currentProject?.id;

              if (!projectId) {
                toast.error(
                  t("common.no_active_project", "No active project."),
                );
                return;
              }

              const newFlow = await createFlow(flowName, projectId, {
                nodes: flowNodes,
                edges: flowEdges,
              });

              const newFlowId = newFlow.id || newFlow.flow?.id;
              if (newFlowId) {
                switchFlow(newFlowId);
              }
              toast.success(
                t("common.flow_import_success", "Flow imported successfully!"),
              );
              setIsImportDialogOpen(false);
            } else {
              throw new Error(
                convertResult.error ||
                  "No valid flows could be converted from the file.",
              );
            }
          }
        }
        // Handle Directory Import (Server-Side Result)
        else if (importData.result) {
          const result = importData.result;
          const projectId = currentProject?.id;
          if (!projectId) {
            toast.error(t("common.no_active_project", "No active project."));
            return;
          }

          if (!result.flows || result.flows.length === 0) {
            toast.warning(
              t(
                "dialogs.import.no_flows_converted",
                "No flows could be imported from the directory.",
              ),
            );
            setIsImportDialogOpen(false);
            return;
          }

          let successCount = 0;
          let firstFlowId = null;

          for (const importedFlow of result.flows) {
            try {
              const flowName =
                importedFlow.meta?.name || `Imported Flow ${Date.now()}`;
              const { nodes: flowNodes, edges: flowEdges } =
                convertActionsToFlowData(importedFlow.flow || []);

              const newFlow = await createFlow(flowName, projectId, {
                nodes: flowNodes,
                edges: flowEdges,
              });

              const newFlowId = newFlow.id || newFlow.flow?.id;
              if (newFlowId && !firstFlowId) {
                firstFlowId = newFlowId;
              }
              successCount++;
            } catch (err) {
              console.error("Failed to save imported flow:", err);
            }
          }

          toast.success(
            `✓ Successfully imported and persisted ${successCount} flows.`,
          );

          if (firstFlowId) {
            switchFlow(firstFlowId);
          }

          setIsImportDialogOpen(false);
        }
      } catch (error) {
        console.error("Import Failed:", error);
        toast.error(`Import error: ${error.message}`);
      }
    },
    [
      currentProject?.id,
      setNodes,
      setEdges,
      setViewport,
      fitView,
      toast,
      t,
      detectOrphans,
      migrateNodes,
      createFlow,
      switchFlow,
      convertActionsToFlowData,
    ],
  );

  // ========================================
  // CALLBACKS - Eliminación de elementos
  // ========================================
  const handleDeleteSelected = useCallback(() => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    // Encontrar nodos y edges seleccionados
    const selectedNodes = allNodes.filter((node) => node.selected);
    const selectedEdges = allEdges.filter((edge) => edge.selected);

    // PRIORIDAD 1: Si hay edges seleccionados, eliminarlos (y nodos seleccionados también)
    // Esto evita que se elimine el "nodo activo" del panel si el usuario en realidad quería borrar un edge
    if (selectedEdges.length > 0 || selectedNodes.length > 0) {
      const elementsToDelete = {
        nodes: selectedNodes,
        edges: selectedEdges,
      };
      deleteElements(elementsToDelete);

      // Si el nodo que se estaba configurando fue eliminado, cerrar el panel
      if (
        selectedAction &&
        selectedNodes.some((n) => n.id === selectedAction.nodeId)
      ) {
        closeConfiguration();
      }
      return;
    }
  }, [selectedAction, getNodes, getEdges, deleteElements, closeConfiguration]);

  // ========================================
  // CALLBACKS - Duplicar nodos
  // ========================================
  const handleDuplicateNodes = useCallback(() => {
    const count = duplicateElements();
    if (count > 0) {
      toast.success(t("common.duplicated_elements", { count }));
    }
  }, [duplicateElements, toast, t]);

  const handleUngroup = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (
      selected.length === 1 &&
      (selected[0].type === "component" ||
        selected[0].data?.type === "component" ||
        selected[0].type === "loop" ||
        selected[0].data?.type === "loop")
    ) {
      ungroupNodes(selected[0].id);
    } else {
      toast.error("Select a single component to ungroup");
    }
  }, [nodes, ungroupNodes, toast]);

  const handleCopy = useCallback(() => {
    const count = copyElements();
    if (count > 0) {
      toast.success(t("common.copied_to_clipboard", { count }));
    }
  }, [copyElements, toast, t]);

  const handlePaste = useCallback(() => {
    const count = pasteElements();
    if (count > 0) {
      toast.success(t("common.pasted_from_clipboard", { count }));
    }
  }, [pasteElements, toast, t]);

  const handleCut = useCallback(() => {
    const count = cutElements();
    if (count > 0) {
      toast.success(t("common.cut_to_clipboard", { count }));
    }
  }, [cutElements, toast, t]);

  // ========================================
  // CALLBACKS - Seleccionar todos
  // ========================================
  const handleSelectAll = useCallback(() => {
    const allNodes = getNodes();
    if (setNodes) {
      setNodes(allNodes.map((node) => ({ ...node, selected: true })));
    }
  }, [getNodes, setNodes]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        type: "node",
        x: event.clientX,
        y: event.clientY,
        data: node,
      });
    },
    [setMenu],
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setMenu({
        id: edge.id,
        type: "edge",
        x: event.clientX,
        y: event.clientY,
        data: edge,
      });
    },
    [setMenu],
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setMenu({
        id: "canvas",
        type: "canvas",
        x: event.clientX,
        y: event.clientY,
        data: { nodes: [] }, // Provide empty selection data for robustness
      });
    },
    [setMenu],
  );

  const onSelectionContextMenu = useCallback(
    (event, nodes) => {
      event.preventDefault();
      setMenu({
        id: "selection",
        type: "selection",
        x: event.clientX,
        y: event.clientY,
        data: { nodes },
      });
    },
    [setMenu],
  );

  const handleToggleDisabled = useCallback(
    (nodeId) => {
      // If we are in 'selection' mode, toggle everything selected
      const ids =
        menu?.type === "selection" && menu.data?.nodes
          ? menu.data.nodes.map((n) => n.id)
          : Array.isArray(nodeId)
            ? nodeId
            : [nodeId];

      toggleNodesDisabled(ids);

      // Dispatch event for real-time refresh in canvas
      ids.forEach((id) => {
        window.dispatchEvent(
          new CustomEvent("node-data-updated", { detail: { nodeId: id } }),
        );
      });

      setMenu(null);
    },
    [toggleNodesDisabled, menu],
  );

  const handleToggleDownstream = useCallback(
    (nodeId) => {
      toggleDownstreamDisabled(nodeId);
      setMenu(null);
    },
    [toggleDownstreamDisabled],
  );

  // ========================================
  // KEYBOARD SHORTCUTS (Moved here to access handlers)
  // ========================================
  useFlowShortcuts(
    {
      onSave: handleSaveFlow,
      onUndo: undo,
      onRedo: redo,
      onExecute: handleExecuteFlow,
      onDelete: handleDeleteSelected,
      onSelectAll: handleSelectAll,
      onDuplicate: handleDuplicateNodes,
      onDeselect: () => {
        /* Deselect logic handled by React Flow onClick */
      },
      onCopy: handleCopy,
      onPaste: handlePaste,
      onCut: handleCut,
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onFitView: fitView,
      onGroup: groupNodes, // Trigger group logic
      onUngroup: handleUngroup,
    },
    !isSettingsOpen, // Disable shortcuts when modal is open
  );

  // ========================================
  // DRAG & DROP HANDLERS
  // ========================================

  const handleResetCanvas = useCallback(async () => {
    setNodes([]);
    setEdges([]);
    if (currentProject?.id && loadStarterTemplate) {
      try {
        await loadStarterTemplate(currentProject.id);
      } catch (err) {
        console.error("Failed to restore starter template on reset:", err);
      }
    }
  }, [setNodes, setEdges, currentProject, loadStarterTemplate]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      // Convert screen coordinates to flow coordinates
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Add node at the drop position
      addNode(type, flowPosition);
    },
    [addNode, screenToFlowPosition],
  );

  const onNodeDragStop = useCallback((_event, node) => {
    // Logic for automatic grouping has been removed for Loop nodes
    // as they now behave as encapsulated sub-flows (Dive-in).
    if (node.parentId) {
      // If it was inside something (other than loop) but dropped outside,
      // we might still want to handle it, but for now we simplify.
    }
  }, []);

  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================
  useFlowShortcuts({
    onSave: handleSaveFlow,
    onUndo: canUndo ? undo : undefined,
    onRedo: canRedo ? redo : undefined,
    onExecute: handleExecuteFlow,
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateNodes,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onCut: handleCut,
    onSelectAll: handleSelectAll,
    onDeselect: selectedAction ? closeConfiguration : undefined,
    onZoomIn: () => zoomIn({ duration: 300 }),
    onZoomOut: () => zoomOut({ duration: 300 }),
    onFitView: () => fitView({ duration: 300 }),
  });

  // ========================================
  // MEMOIZACIÓN OPTIMIZADA
  // ========================================

  // ========================================
  // CALLBACKS - Eliminación y Panel Huérfano
  // ========================================
  const onNodesDelete = useCallback(
    (deletedNodes) => {
      // Check if the currently selected node is among the deleted ones
      const isCurrentNodeDeleted = deletedNodes.some(
        (node) => node.id === selectedAction?.nodeId,
      );

      if (isCurrentNodeDeleted) {
        closeConfiguration();
      }
    },
    [selectedAction, closeConfiguration],
  );

  // Props estáticas que no cambian
  const staticFlowProps = useMemo(
    () => ({
      // Disable automatic fitView on mount – we will control zoom ourselves
      defaultViewport: { x: 0, y: 0, zoom: 0.6 },
      snapToGrid: true,
      snapGrid: [15, 15],
      // Habilitar selección y eliminación de edges
      edgesFocusable: true,
      edgesReconnectable: true,
      elementsSelectable: true,
      // Mejorar selección múltiple
      multiSelectionKeyCode: "Shift", // Shift para selección múltiple
      selectionKeyCode: "Shift", // Shift para selección de área
      // Disable native delete to prevent conflicts with our custom handler
      deleteKeyCode: null,
      // Mejorar interacción
      selectNodesOnDrag: false, // No seleccionar al arrastrar
      panOnDrag: [1, 2], // Pan con click medio o derecho
      zoomOnScroll: true, // Zoom con scroll
      zoomOnPinch: true, // Zoom con pinch en trackpad
      zoomOnDoubleClick: false, // Deshabilitar zoom con doble click

      // OPTIMIZATION: Performance Overhaul
      minZoom: 0.4, // Standard zoom limits
      maxZoom: 2.0, // Standard zoom limits
      connectionMode: ConnectionMode.Strict, // Strict connections so it only snaps to target (input) handles, fixing the visual jump bug
      onlyRenderVisibleElements: true, // Only render visible nodes/edges for performance
      defaultEdgeOptions: { type: "custom" }, // Force our custom edge (SmoothStep) globally
      translateExtent: [
        [-5000, -5000],
        [5000, 5000],
      ], // Dynamic Extent (Large enough)

      ...figmaConfig, // Use Figma configuration
    }),
    [figmaConfig],
  );

  // -------------------------------------------------------------------------
  // NODE DATA ENRICHMENT
  // -------------------------------------------------------------------------
  // Resolve sub-flow information (like node count) dynamically for UI display
  const enrichedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0 || !currentProject) return nodes;

    const currentStructure =
      nodes
        .map(
          (n) =>
            `${n.id}:${n.type}:${JSON.stringify(n.data?.configuration || {})}`,
        )
        .join(",") +
      "|" +
      edges.map((e) => `${e.source}->${e.target}`).join(",");

    if (currentStructure !== prevEnforceStructureRef.current) {
      prevEnforceStructureRef.current = currentStructure;
      warningsMapRef.current = runPolicyEnforcer(nodes, edges);
    }

    const warningsMap = warningsMapRef.current;

    return nodes.map((node) => {
      const nodeWarnings = warningsMap[node.id] || [];
      const isContainer = ["component", "loop"].includes(
        node.type || node.data?.type,
      );

      let updatedNode = node;

      if (isContainer) {
        const flowId = node.data?.flowId || node.data?.configuration?.flowId;
        if (flowId) {
          const allWorkspaceFlows = (currentProject?.flows || []).concat(
            (projects || []).flatMap((p) => p.flows || []),
          );
          const subFlow = allWorkspaceFlows.find((f) => f.id === flowId);
          if (subFlow) {
            const nodeCount =
              subFlow.nodeCount !== undefined
                ? subFlow.nodeCount
                : subFlow.nodes?.length || 0;
            const hasInput =
              subFlow.nodes?.some((n) => n.type === "input") ||
              node.data?.hasInput;
            const hasOutput =
              subFlow.nodes?.some((n) => n.type === "output") ||
              node.data?.hasOutput;

            if (
              node.data?.nodeCount !== nodeCount ||
              node.data?.hasInput !== hasInput ||
              node.data?.hasOutput !== hasOutput
            ) {
              updatedNode = {
                ...node,
                data: {
                  ...node.data,
                  nodeCount,
                  hasInput,
                  hasOutput,
                  onEnterSubFlow: enterComponent,
                },
              };
            }
          }
        }
      }

      // Check if warnings/mode changed to prevent re-renders when identical
      const currentWarningsJSON = JSON.stringify(node.data?.warnings || []);
      const newWarningsJSON = JSON.stringify(nodeWarnings);

      if (
        currentWarningsJSON !== newWarningsJSON ||
        updatedNode !== node ||
        node.data?.canvasViewMode !== canvasViewMode
      ) {
        return {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            warnings: nodeWarnings,
            canvasViewMode,
          },
        };
      }

      return node;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, currentProject, canvasViewMode]); // Removed enterComponent because it changes on every node update

  // Props dinámicas que sí cambian
  const flowConfig = useMemo(
    () => ({
      ...staticFlowProps,
      snapToGrid: enableSnapping, // Controlled by Global Settings
      nodes: enrichedNodes,
      edges: edges.map((edge) => ({ ...edge, type: "custom" })),
      onNodesChange: isWorkspaceReadOnly ? undefined : onNodesChange,
      onEdgesChange: isWorkspaceReadOnly ? undefined : onEdgesChange,
      onConnect: isWorkspaceReadOnly ? undefined : onConnect,
      onNodeClick,
      onPaneClick: (event) => {
        // Prevent closing the panel if the user clicked on a Node or Edge by checking the DOM target
        // This is a workaround for React Flow bubbling issues where onPaneClick fires after onNodeClick
        if (event && event.target) {
          const isNodeOrEdge = event.target.closest(
            ".react-flow__node, .react-flow__edge",
          );
          if (isNodeOrEdge) return;
        }
        closeConfiguration();
        setMenu(null);
      },
      onNodeContextMenu: isWorkspaceReadOnly ? undefined : onNodeContextMenu,
      onEdgeContextMenu: isWorkspaceReadOnly ? undefined : onEdgeContextMenu,
      onPaneContextMenu: isWorkspaceReadOnly ? undefined : onPaneContextMenu,
      onSelectionContextMenu: isWorkspaceReadOnly
        ? undefined
        : onSelectionContextMenu,
      onNodeDoubleClick: (event, node) => {
        if (
          node.type === "component" ||
          node.type === "loop" ||
          node.data?.type === "component" ||
          node.data?.type === "loop"
        ) {
          enterComponent(node.id);
        } else {
          // Open Step Details Modal on double-click
          console.log("[DEBUG] Node double-clicked:", node.id, node.data);
          setStepDetailsModal({
            isOpen: true,
            nodeData: node.data,
          });
        }
      },
      onDrop: isWorkspaceReadOnly ? undefined : onDrop,
      onDragOver: isWorkspaceReadOnly ? undefined : onDragOver,
      onNodeDragStop: isWorkspaceReadOnly ? undefined : onNodeDragStop,
      nodesDraggable: !isWorkspaceReadOnly,
      nodesConnectable: !isWorkspaceReadOnly,
      elementsSelectable: true,
      nodeTypes, // Custom node types for optimized rendering
      edgeTypes, // Custom edge types with animations
      // Visual feedback for connections
      connectionLineComponent: CustomConnectionLine,
      connectionLineStyle: {
        strokeWidth: 2,
        stroke: "var(--connection-line)",
      },
    }),
    [
      staticFlowProps,
      enrichedNodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeClick,
      closeConfiguration,
      onNodeContextMenu,
      onEdgeContextMenu,
      onPaneContextMenu,
      onSelectionContextMenu,
      enterComponent,
      onDrop,
      onDragOver,
      onNodeDragStop,
      enableSnapping, // Dependency for memo
      isWorkspaceReadOnly,
    ],
  );

  // ========================================
  // RENDER - MAREA LAYOUT
  // ========================================

  const derivedFlowData = useMemo(() => {
    const dbFlows = currentProject?.flows || [];
    const overrideNames = new Map();

    // 1. Scan ALL DB flows to find component nodes and extract their custom names
    dbFlows.forEach((f) => {
      let fNodes = [];
      if (Array.isArray(f.nodes)) {
        fNodes = f.nodes;
      } else if (typeof f.nodes === "string") {
        try {
          fNodes = JSON.parse(f.nodes) || [];
          if (!Array.isArray(fNodes)) fNodes = [];
        } catch {
          fNodes = [];
        }
      }
      fNodes.forEach((n) => {
        if (
          (n.type === "component" || n.data?.type === "component") &&
          n.data?.flowId
        ) {
          overrideNames.set(
            n.data.flowId,
            n.data.customLabel || n.data.label || "Untitled Component",
          );
        }
      });
    });

    console.log("[DEBUG] overrideNames:", Array.from(overrideNames.entries()));

    // 2. Override with live canvas nodes (in case of unsaved edits in current flow)
    nodes.forEach((n) => {
      if (
        (n.type === "component" || n.data?.type === "component") &&
        n.data?.flowId
      ) {
        overrideNames.set(
          n.data.flowId,
          n.data.customLabel || n.data.label || "Untitled Component",
        );
      }
    });

    // 3. Rebuild flows list with updated names
    const flowMap = new Map();
    dbFlows.forEach((f) => {
      if (f.type === "component" && overrideNames.has(f.id)) {
        flowMap.set(f.id, {
          ...f,
          name: overrideNames.get(f.id),
          isLive: true,
        });
      } else {
        flowMap.set(f.id, f);
      }
    });

    // 4. Also add any live components on canvas that might not be in DB yet
    nodes.forEach((n) => {
      if (
        (n.type === "component" || n.data?.type === "component") &&
        n.data?.flowId
      ) {
        if (!flowMap.has(n.data.flowId)) {
          flowMap.set(n.data.flowId, {
            id: n.data.flowId,
            name: n.data.customLabel || n.data.label || "Untitled Component",
            type: "component",
            isLive: true,
          });
        }
      }
    });

    // Determine current flow name
    const currentOverride = overrideNames.get(currentFlowId);
    let name = "No Flow Selected";
    if (currentOverride) {
      name = currentOverride;
    } else {
      const f = dbFlows.find((f) => f.id === currentFlowId);
      if (f) name = f.name;
    }

    return { flows: [...flowMap.values()], flowName: name };
  }, [currentProject?.flows, nodes, currentFlowId]);

  return (
    <>
      <div className="relative h-dvh w-screen flex flex-col overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-all duration-400 antialiased font-sans selection:bg-cyan-500/30 m-0 p-0 border-none">
        {/* Skip Navigation Link (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="visually-hidden focus:not-visually-hidden focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
          }}
          onFocus={(e) => {
            e.target.style.position = "fixed";
            e.target.style.width = "auto";
            e.target.style.height = "auto";
            e.target.style.overflow = "visible";
            e.target.style.clip = "auto";
          }}
          onBlur={(e) => {
            e.target.style.position = "absolute";
            e.target.style.width = "1px";
            e.target.style.height = "1px";
            e.target.style.overflow = "hidden";
            e.target.style.clip = "rect(0,0,0,0)";
          }}
        >
          Skip to main content
        </a>

        {/* Progress Bar */}
        {executionProgress.total > 0 && (
          <ProgressBar
            current={executionProgress.current}
            total={executionProgress.total}
            status={executionProgress.status}
            onCancel={() =>
              setExecutionProgress({ current: 0, total: 0, status: "" })
            }
          />
        )}

        {/* 1. Header (MAREA Refactored) */}
        <AppHeader
          isStarterTemplate={isStarterTemplate}
          onOpenSettings={openSettings}
          onOpenApiKeys={openApiKeys}
          onOpenMetricsDashboard={() => setIsMetricsDashboardOpen(true)}
          onToggleHistory={() => {
            setIsHistoryPanelVisible((prev) => !prev);
            if (!isHistoryPanelVisible) {
              setIsVariablePanelVisible(false);
              setIsCreationPanelVisible(false);
            }
          }}
          isVariablesVisible={isVariablePanelVisible}
          onToggleVariables={() => {
            setIsVariablePanelVisible((prev) => !prev);
            if (!isVariablePanelVisible) {
              setIsHistoryPanelVisible(false);
              setIsCreationPanelVisible(false);
            }
          }}
          isAskAIVisible={isAskAIPanelVisible}
          onToggleAskAI={() => setIsAskAIPanelVisible((prev) => !prev)}
          isToolboxVisible={isCreationPanelVisible}
          onToggleToolbox={() => {
            setIsCreationPanelVisible((prev) => !prev);
            if (!isCreationPanelVisible) {
              setIsHistoryPanelVisible(false);
              setIsVariablePanelVisible(false);
            }
          }}
          selectedProject={currentProject}
          selectedFlow={currentProject?.flows?.find(
            (f) => f.id === currentFlowId,
          )}
          viewStack={viewStack}
          onExitComponent={exitComponent}
          activeBrowserId={activeBrowserId}
          onStopSession={stopSession}
          apiStatus={apiStatus}
          onSyncCloud={handleSyncCloud}
          onToggleCollaboration={handleToggleCollaboration}
          isCollaborationEnabled={currentProject?.collaborationEnabled || false}
          isRemoteExecuting={isRemoteExecuting}
          remoteExecution={remoteExecution}
          role={role}
        />

        <GuestModeModal
          isOpen={isGuestModeModalOpen}
          onClose={() => setIsGuestModeModalOpen(false)}
          onLogin={handleLoginRedirect}
        />

        {/* 2. Content Wrapper */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          {/* SIDEBAR IZQUIERDO - Either Toolbox OR History Panel */}
          {isHistoryPanelVisible ? (
            <RunHistoryPanel
              isOpen={true}
              onClose={() => {
                setIsHistoryPanelVisible(false);
                setIsCreationPanelVisible(true);
              }}
              onSelectRun={handleSelectRun}
              currentFlowId={currentFlowId}
            />
          ) : isVariablePanelVisible ? (
            <VariablePanel
              currentFlowId={currentFlowId}
              projectId={currentProject?.id}
              isOpen={isVariablePanelVisible}
              nodes={nodes}
              onClose={() => {
                setIsVariablePanelVisible(false);
                setIsCreationPanelVisible(true);
              }}
              onDeleteNode={deleteNode}
              onUpdateNode={updateNodeConfiguration}
              onAddNode={(type, configData) => {
                addNode(type, { x: 100, y: 100 }, configData);
              }}
            />
          ) : (
            <Toolbox
              addNode={addNode}
              activeBrowserId={activeBrowserId}
              isCollapsed={!isCreationPanelVisible}
              onToggleCollapse={(collapsed) =>
                setIsCreationPanelVisible(!collapsed)
              }
            />
          )}

          {/* LIENZO (CANVAS - Abyss Blue Environment) */}
          <main
            id="main-content"
            aria-label="Flow canvas"
            className="flex-1 relative kanban-board-bg flex flex-col overflow-hidden"
          >
            <div ref={reactFlowWrapper} className="flex-1 w-full relative">
              <ErrorBoundary onReset={handleResetCanvas}>
                {/* Canvas View Mode Toggle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10] flex bg-slate-900/90 border border-white/10 p-1 rounded-xl shadow-lg backdrop-blur-md">
                  {["calidad", "performance", "seguridad"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCanvasViewMode(mode)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                        canvasViewMode === mode
                          ? mode === "seguridad"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 font-bold animate-[pulse_2s_infinite]"
                            : mode === "performance"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold"
                              : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold"
                          : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5",
                      )}
                    >
                      {mode === "calidad"
                        ? t("canvas.view_mode.quality", "Quality")
                        : mode === "performance"
                          ? t("canvas.view_mode.performance", "Performance")
                          : t("canvas.view_mode.security", "Security")}
                    </button>
                  ))}
                </div>

                <ReactFlow
                  {...flowConfig}
                  onNodesDelete={onNodesDelete}
                  onMouseMove={handleMouseMove}
                >
                  {showMinimap && <StyledMiniMap />}
                  <Controls>
                    <ControlButton
                      onClick={() => onLayout("LR")}
                      title={t("common.magic_organize", "Magic Organize")}
                    >
                      <Wand2 className="w-4 h-4" />
                    </ControlButton>
                  </Controls>

                  {showGrid && (
                    <Background
                      className="react-flow-background"
                      variant="dots"
                      gap={24}
                      size={1}
                      color="var(--grid-dots)"
                    />
                  )}

                  {/* VIGNETTE OVERLAY (For depth) - Theme Aware */}
                  <div
                    className="absolute inset-0 pointer-events-none z-[1] mix-blend-multiply transition-opacity duration-400"
                    style={{
                      background:
                        "radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.2) 100%)",
                      opacity: theme === "dark" ? 0.4 : 0.1,
                    }}
                  />

                  {/* EXECUTION PULSE OVERLAY */}
                  {isReadOnly && (
                    <div className="absolute inset-0 z-[10] pointer-events-none animate-pulse-overlay border-[4px] border-indigo-500/10 rounded-xl" />
                  )}

                  {/* Context Menu Overlay */}
                  {menu && (
                    <ContextMenu
                      x={menu.x}
                      y={menu.y}
                      type={menu.type}
                      data={menu.data}
                      recentNodes={frequentNodes} // Pass smart favorites
                      onClose={() => setMenu(null)}
                      actions={{
                        copy: handleCopy,
                        paste: handlePaste,
                        cut: handleCut,
                        delete: () => {
                          if (menu.type === "node") deleteNode(menu.id);
                          if (menu.type === "edge") {
                            setEdges((eds) =>
                              eds.filter((e) => e.id !== menu.id),
                            );
                          }
                          if (menu.type === "selection") {
                            handleDeleteSelected();
                          }
                        },
                        group: () => {
                          groupNodes();
                          setMenu(null);
                        },
                        loopSelection: () => {
                          loopNodes();
                          setMenu(null);
                        },
                        ungroup: () => {
                          // Handle ungrouping via context menu
                          // Check if the right-clicked node is a component, or if selection contains one
                          if (
                            menu.data &&
                            (menu.data.type === "component" ||
                              menu.data.data?.type === "component" ||
                              menu.data.type === "loop" ||
                              menu.data.data?.type === "loop")
                          ) {
                            ungroupNodes(menu.data.id);
                          } else {
                            handleUngroup(); // Fallback to selection based
                          }
                          setMenu(null);
                        },
                        duplicate: handleDuplicateNodes,
                        addNode: () => setIsCreationPanelVisible(true), // Legacy: Open Panel
                        createNode: (type) => {
                          const position = screenToFlowPosition({
                            x: menu.x,
                            y: menu.y,
                          });
                          addNode(type, position);
                          // Track usage
                          setNodeUsage((prev) => ({
                            ...prev,
                            [type]: (prev[type] || 0) + 1,
                          }));
                        },
                        selectAll: handleSelectAll,
                        undo: undo,
                        redo: redo,
                        canUndo: canUndo,
                        canRedo: canRedo,
                        canPaste:
                          clipboard.nodes.length > 0 ||
                          clipboard.edges.length > 0,
                        cleanLayout: () => onLayout("LR"),
                        toggleDisabled: handleToggleDisabled,
                        toggleDownstream: handleToggleDownstream,
                        runNode: (id) => {
                          const node = nodes.find((n) => n.id === id);
                          if (node) {
                            executeSingleNode(
                              node.id,
                              node.type,
                              node.data?.configuration || {},
                              {
                                runId: reportingRunId,
                                socketId: socket?.id,
                              },
                            );
                          }
                        },
                        diveIn: (id) => enterComponent(id),
                        selectNext: (id) => {
                          const nextEdge = edges.find((e) => e.source === id);
                          if (nextEdge) {
                            handleNavigateToNode(nextEdge.target);
                          }
                        },
                        selectPrev: (id) => {
                          const prevEdge = edges.find((e) => e.target === id);
                          if (prevEdge) {
                            handleNavigateToNode(prevEdge.source);
                          }
                        },
                      }}
                    />
                  )}
                </ReactFlow>
                <RemoteCursors />
              </ErrorBoundary>
            </div>

            {/* Real-time Execution Terminal - Now inside Main Layout */}
            <TerminalPanel
              socket={socket}
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              executionMode={canvasViewMode}
            />

            {/* Ask AI Debug Console */}
            <AskAIPanel
              isVisible={isAskAIPanelVisible}
              onClose={() => setIsAskAIPanelVisible(false)}
              onOpenSettings={() => openSettings("integrations")}
              proposedNodes={proposedNodes}
              onConfirmProposal={handleConfirmProposal}
              onRejectProposal={handleRejectProposal}
            />

            {/* TERMINAL TAG (Vignette) - Only visible when terminal is closed */}
            {!isPanelVisible && (
              <button className="terminal-tag" onClick={togglePanel}>
                <Terminal size={14} className="icon" />
                <span>Terminal</span>
                {hasLogs && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
                )}
              </button>
            )}
            {/* EXECUTION SCANNING BAR */}
            {isReadOnly && (
              <div className="absolute top-0 left-0 right-0 h-[2px] z-[1000] pointer-events-none overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-scanning-bar" />
              </div>
            )}
          </main>

          {isConfigurationPanelVisible && selectedAction && (
            <NodeConfigurationPanel
              isVisible={isConfigurationPanelVisible}
              action={selectedAction}
              nodes={enrichedNodes}
              edges={edges}
              onSelectNode={handleNavigateToNode}
              nodeId={selectedAction.nodeId}
              type={selectedAction.type}
              initialData={selectedAction.data}
              viewStack={viewStack}
              currentProject={currentProject}
              onClose={() => {
                setSelectedNodeId(null);
              }}
              onExecute={executeSingleNode} // ATOMIC EXECUTION (Run Node)
              onRunNode={executeSingleNode} // Redundant but kept for safety if header used it
              updateNodeConfiguration={(nodeId, newData) => {
                updateNodeConfiguration(nodeId, newData);

                // If the user renamed a Component node, keep the underlying flow entity's name in sync!
                if (
                  newData.customLabel !== undefined ||
                  newData.label !== undefined
                ) {
                  const node = enrichedNodes.find((n) => n.id === nodeId);
                  const newName = newData.customLabel || newData.label;
                  if (
                    node &&
                    (node.type === "component" ||
                      node.data?.type === "component") &&
                    node.data?.flowId &&
                    newName
                  ) {
                    renameFlow(node.data.flowId, newName);
                  }
                }
              }}
              onDeleteNode={deleteNode}
              projectPath={projectPath}
              isReadOnly={isWorkspaceReadOnly}
              onStartPick={handleStartPicking}
              onCancelPick={handleCancelPicking}
              onUngroup={ungroupNodes}
              onEnterSubFlow={enterComponent}
              updateNodeState={updateNodeState}
              designTimeContext={designTimeContext}
              simulatedResults={simulatedResults}
            />
          )}
          {/* Global Settings Modal (Unified Hub) */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={closeSettings}
            initialTab={settingsTab}
          />
          {/* <ApiKeysModal /> deprecated - moved to SettingsHub */}
        </div>
        {/* Modals/Dialogs */}
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={handleImportDialogClose}
          onImport={handleImport}
        />

        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={handleExportDialogClose}
          nodes={nodes}
          edges={edges}
          projectId={currentProject?.id}
        />

        <MetricsDashboardModal
          isOpen={isMetricsDashboardOpen}
          onClose={() => setIsMetricsDashboardOpen(false)}
        />

        <DatasetRunModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          onRun={handleRunDataset}
        />

        <PerformanceRunModal
          isOpen={isPerfModalOpen}
          onClose={() => setIsPerfModalOpen(false)}
          flowId={currentFlowId}
          projectId={currentProject?.id}
          onRunProfiling={handleExecuteFlow}
          flowName={
            currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
            "Sin Nombre"
          }
        />

        <SecurityRunModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          flowId={currentFlowId}
          projectId={currentProject?.id}
          onRunSecurity={handleExecuteFlow}
          flowName={
            currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
            "Sin Nombre"
          }
        />

        {/* FLOATING COMMAND CENTER (Footer) - Positioned Absolutely */}
        {/* MANIFIESTO DE REACTIVIDAD: Derived State for Flows */}
        {/* We merge persistent flows (DB) with live component nodes (Canvas) to ensure instant updates */}
        {/* TERMINAL TAG (Vignette) - Moved to main container above */}

        <AppFooter
          // Project Props
          projectName={currentProject?.name || "No Project"}
          projects={projects}
          onSwitchProject={(p) => loadProject(p.id)}
          onNewProject={() =>
            setCreationModal({ isOpen: true, type: "project" })
          }
          onRenameProject={(p, newName) => renameProject(p.id, newName)}
          onDeleteProject={(p) => deleteProject(p.id)}
          // Flow Props
          flowName={derivedFlowData.flowName}
          flows={derivedFlowData.flows}
          onSwitchFlow={(f) => {
            setViewStack([]);
            switchFlow(f.id);
          }}
          onNewFlow={() => setCreationModal({ isOpen: true, type: "flow" })}
          onRenameFlow={(f, newName) => renameFlow(f.id, newName)}
          onDeleteFlow={(f) => {
            deleteFlow(f.id);
            if (f.id === currentFlowId) {
              setNodes([]);
              setEdges([]);
              if (!currentProject?.flows || currentProject.flows.length <= 1) {
                setIsStarterDismissed(false);
              }
            }
          }}
          // Global Props
          version={`v${__APP_VERSION__}`}
          isReadOnly={false}
          isRunning={executionProgress.status === "running"}
          onRun={() => {
            if (canvasViewMode === "performance") {
              setIsPerfModalOpen(true);
            } else if (canvasViewMode === "seguridad") {
              setIsSecurityModalOpen(true);
            } else {
              handleExecuteFlow();
            }
          }}
          onSave={handleSaveFlow}
          onShowImport={() => setIsImportDialogOpen(true)}
          onShowExport={() => setIsExportDialogOpen(true)}
          onResetStates={resetExecutionStates}
          hasUnsavedChanges={hasUnsavedChanges}
          onRunBatch={() => setIsExecutionDashboardOpen(true)}
          onRunDataset={() => setIsDatasetModalOpen(true)}
          apiStatus={apiStatus}
          isRemoteExecuting={isRemoteExecuting}
          remoteExecution={remoteExecution}
          role={role}
          isCollaborative={isCollaborative}
          executionMode={canvasViewMode}
        />

        <ExecutionDashboard
          isOpen={isExecutionDashboardOpen}
          onClose={() => setIsExecutionDashboardOpen(false)}
          currentProject={currentProject}
          onViewReport={(id) => setReportingRunId(id)}
        />

        <DatasetRunModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          onRun={handleRunDataset}
        />

        <StarterOverlay
          isVisible={
            !isStarterDismissed &&
            ((projects && projects.length === 0) ||
              !currentProject?.flows ||
              currentProject.flows.length === 0 ||
              (nodes.length === 0 &&
                !!currentFlowId &&
                currentProject?.flows?.length === 1))
          }
          onLoadTemplate={async () => {
            const projectId = await ensureProjectAndGetId();
            await loadStarterTemplate(projectId);
            setIsStarterDismissed(true);
          }}
          onDismiss={async () => {
            setIsStarterDismissed(true);
            if (projects && projects.length === 0) {
              await ensureProjectAndGetId();
            }
          }}
        />

        <CreationModal
          isOpen={creationModal.isOpen}
          title={
            creationModal.type === "project"
              ? t("common.new_project")
              : t("common.new_flow")
          }
          placeholder={
            creationModal.type === "project"
              ? "Project Name..."
              : "Flow Name..."
          }
          onClose={() =>
            setCreationModal((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={async (result) => {
            if (typeof result === "object" && result.mode === "ai") {
              await handleAIFlowGeneration(result.prompt);
            } else {
              // Standard creation from modal
              if (creationModal.type === "flow") {
                const projectId = await ensureProjectAndGetId();
                // If there's no active flow, but the canvas has content, we save that content
                const options =
                  !currentFlowId && nodes.length > 0 ? { nodes, edges } : {};
                createFlow(result, projectId, options);
              } else {
                const options =
                  !currentProject?.id && nodes.length > 0
                    ? { nodes, edges }
                    : {};
                createProject(result, "", options);
              }
            }
          }}
        />

        {/* STEP DETAILS MODAL (Replay Mode) */}
        <StepDetailsModal
          isOpen={stepDetailsModal.isOpen}
          onClose={() => setStepDetailsModal({ isOpen: false, nodeData: null })}
          nodeData={stepDetailsModal.nodeData}
        />

        {/* TOAST SYSTEM (Positioned relative to Panel) */}
        <HalToaster offsetRight={isConfigurationPanelVisible ? 350 : 0} />
      </div>
      <AnimatePresence>
        {reportingRunId && (
          <ReportDashboard
            runId={reportingRunId}
            onClose={() => setReportingRunId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ========================================
// COLLABORATIVE DASHBOARD WRAPPER
// ========================================

function CollaborativeDashboard() {
  const { user } = useAuth();
  const projectManagerData = useProjectManager();

  return (
    <CollaborationProvider
      flowId={projectManagerData.currentFlowId}
      user={user}
      enabled={projectManagerData.currentProject?.collaborationEnabled || false}
      role={projectManagerData.currentProject?.role || "owner"}
    >
      <Dashboard {...projectManagerData} />
    </CollaborationProvider>
  );
}

// ========================================
// MAIN APP COMPONENT (Router Entry)
// ========================================

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CollaborativeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HalDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
