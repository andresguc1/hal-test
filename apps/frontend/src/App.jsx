import React, { useState, useCallback, useMemo, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {
  ReactFlow,
  Controls,
  ControlButton,
  Background,
  useReactFlow,
  MarkerType,
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
const edgeTypes = {
  custom: CustomEdge,
};
import ProgressBar from "./components/ProgressBar";
import ImportDialog from "./components/ImportDialog";
import ExportDialog from "./components/ExportDialog";
{
  /* SettingsDialog removed in favor of internal panel navigation */
}
import ContextMenu from "./components/ContextMenu";
import CreationModal from "./components/CreationModal";
import StarterOverlay from "./components/StarterOverlay";

// import { colors } from "./components/styles/colors"; // Unused
import { useFlowManager } from "./components/hooks/useFlowManager.js";
import { useProjectManager } from "./components/hooks/useProjectManager.js";
import { migrateFromLegacy } from "./utils/migration";

import { useFlowShortcuts } from "./hooks/useKeyboardShortcuts";
import { useToast } from "./hooks/useToast";
import { HalToaster } from "./components/Toast";
import { useHaltestSocket } from "./hooks/useHaltestSocket";
import { useFigmaInteraction } from "./hooks/useFigmaInteraction";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import RunHistoryPanel from "./components/RunHistoryPanel";
import StepDetailsModal from "./components/StepDetailsModal";
import { ExportModal } from "./components/modals/ExportModal";
import { ImportModal } from "./components/modals/ImportModal";
import { api } from "./utils/api";
import { useElementPicker } from "./hooks/useElementPicker";
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
} from "lucide-react";
import { useLogs } from "./context/LogContext";
import TerminalPanel from "./components/TerminalPanel";
import VariablePanel from "./components/VariablePanel";
import AskAIPanel from "./components/AskAIPanel";

// ========================================
// DASHBOARD COMPONENT (Main Work Area)
// ========================================

function Dashboard() {
  const { t } = useTranslation();

  // Theme
  const { theme } = useTheme();

  const toast = useToast();

  const { logs, isPanelVisible, togglePanel } = useLogs();

  // Refs
  const reactFlowWrapper = React.useRef(null);

  // Project Manager Hook
  const {
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
  } = useProjectManager();

  // Settings Context
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

  // Migration Effect
  React.useEffect(() => {
    const runMigration = async () => {
      try {
        const migratedProject = await migrateFromLegacy();
        if (migratedProject) {
          toast.success(`✓ ${t("common.migrate_success")}`);
          loadProjects(); // Invalidate and refetch projects
        }
      } catch (error) {
        console.error("Migration error:", error);
        toast.error(t("common.migrate_error"));
      }
    };

    runMigration();
  }, [toast, loadProjects, t]);

  // Load project when initial list arrives and no project is selected
  React.useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      // Load most recent project by default
      loadProject(projects[0].id);
    }
  }, [projects, currentProject, loadProject]);

  // Auto-select first flow if project is loaded but no flow selected
  React.useEffect(() => {
    if (
      currentProject &&
      currentProject.flows &&
      currentProject.flows.length > 0 &&
      !currentFlowId
    ) {
      // Prefer "Main Flow" if exists, otherwise first one
      const mainFlow =
        currentProject.flows.find((f) => f.name === "Main Flow") ||
        currentProject.flows[0];
      if (mainFlow) {
        switchFlow(mainFlow.id);
        setIsStarterDismissed(false); // Reset dismissal on flow switch
      }
    }
  }, [currentProject, currentFlowId, switchFlow]);

  // React Flow hooks & Figma Interaction
  const { figmaConfig, handlers } = useFigmaInteraction();
  const { zoomIn, zoomOut, fitView } = handlers;

  // Hook de React Flow para acceder a funciones de eliminación
  const {
    getNodes,
    getEdges,
    deleteElements,
    setViewport,
    fitView: reactFlowFitView,
  } = useReactFlow();

  // Auto-fit view when flow changes
  React.useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to allow rendering
      const timer = setTimeout(() => {
        reactFlowFitView({ duration: 800, padding: 0.2 });
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId, reactFlowFitView]); // Intentionally omitting nodes.length to avoid re-fitting on every node add

  // Panel visibility state
  const [isCreationPanelVisible, setIsCreationPanelVisible] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false); // HISTORY PANEL
  const [isVariablePanelVisible, setIsVariablePanelVisible] = useState(false); // VARIABLE EXPLORER
  const [isAskAIPanelVisible, setIsAskAIPanelVisible] = useState(false); // ASK AI DEBUG CONSOLE
  const [proposedNodes, setProposedNodes] = useState(null);
  const [confirmationPromise, setConfirmationPromise] = useState(null);
  const [creationModal, setCreationModal] = useState({
    isOpen: false,
    type: "project",
  });

  // Execution state for progress bar
  const [executionProgress, setExecutionProgress] = useState({
    current: 0,
    total: 0,
    status: "",
  });
  const [isStarterDismissed, setIsStarterDismissed] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState(null);
  /* --- MODAL STATES --- */
  // Unused placeholder states removed
  // const [currentNodeId, setCurrentNodeId] = useState(null);

  // History Panel State

  // Step Details Modal State (for replay mode)
  const [stepDetailsModal, setStepDetailsModal] = useState({
    isOpen: false,
    nodeData: null,
  });

  // Custom hook para manejar el flujo
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    updateNodeConfiguration,
    deleteNode,
    // executeStep, // Removed unused
    executeFlow,
    executeSingleNode, // Destructure new function
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
    // clearFlow, // Unused
    groupNodes, // Composition feature
    ungroupNodes,
    viewStack, // Nav stack
    enterComponent,
    exitComponent,
    setSelectedNodeId,
    validateFlowStructure,
    updateNodeState,
    activeBrowserId,
    stopSession,
    // NEW
    hasUnsavedChanges,
    detectOrphans,
    projectPath, // Added from useFlowManager
    isReadOnly, // Added from useFlowManager
    replayRun, // HISTORY
    resetNodeStates, // HISTORY
    loadStarterTemplate,
    isStarterTemplate,
    addGhostNode,
    migrateNodes,
    onLayout,
    apiStatus, // NEW: added for indicator
  } = useFlowManager(currentProject, currentFlowId, switchFlow);

  // Element Picker Hook
  const { handleStartPicking, handleCancelPicking, handleElementPicked } =
    useElementPicker({
      selectedAction,
      updateNodeState,
      updateNodeConfiguration,
      activeBrowserId,
      nodes,
      edges,
      executeFlow,
      setNodes,
    });

  const handleSelectRun = useCallback(
    async (runBasic) => {
      if (!runBasic) {
        resetNodeStates();
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
    [replayRun, resetNodeStates, toast],
  );

  // Logs Context
  const { addLog } = useLogs();

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
        const id = `node_${Date.now()}_${index}`;
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
          animated: true,
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
      const id = `node_${Date.now()}`;
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
        animated: true,
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

  const socket = useHaltestSocket(
    setNodes,
    setEdges,
    handleElementPicked,
    addLog,
    null, // onTerminalOutput (handled elsewhere or passed via ref)
    handleCodegenAction,
    getCanvasState, // MCP Phase 3
    handleMCPProposeNodes, // Proponer en vez de inyectar directamente
    handleMCPAddNode, // Granular
    handleMCPConnectNodes, // Granular
    handleMCPRemoveNode,
    handleMCPUpdateNode,
  );

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

  // ========================================
  // CALLBACKS - Footer Actions
  // ========================================

  const handleExecuteFlow = useCallback(async () => {
    // 0. DRY RUN VALIDATION (Clean UX: No loading toast for instant validation)
    const validationErrors = validateFlowStructure(nodes, edges);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0], {
        duration: 5000,
        style: { border: "1px solid #ef4444", color: "#ef4444" },
      });
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

    // 1. Show Loading Toast immediately (Duration 0 = indefinite until dismissed)
    // 1. Show Loading Toast immediately (Duration 0 = indefinite until dismissed)
    const toastId = toast.loading(t("common.processing"));

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
          return;
        }
      }
      // ------------------------------------------

      const result = await executeFlow(); // Returns { success, stats }

      // 2. Clear loading
      toast.dismiss(toastId);

      if (result.success) {
        // Success with Duration
        const durationStr = (result.stats?.duration / 1000).toFixed(2);
        toast.success(`${t("common.flow_exec_success")} (${durationStr}s)`);
      } else {
        // General Failure
        // Validation errors should be caught above, but if executeFlow fails internally (e.g. max retries):
        if (result.error && !result.stats) {
          if (result.error !== "Max reintentos alcanzados") {
            toast.error(result.error);
          }
        } else {
          // Failure with Count (Run happened)
          const failedCount = result.stats?.failed || 0;
          toast.error(`${t("common.flow_exec_error")} (${failedCount} failed)`);
        }
      }
    } catch (error) {
      // 3. Unexpected Error
      toast.dismiss(toastId);
      console.error("Error ejecutando flujo:", error);
      toast.error(t("common.flow_exec_error") + ": " + error.message);
    }
  }, [
    executeFlow,
    validateFlowStructure,
    toast,
    t,
    nodes,
    edges,
    activeBrowserId,
    stopSession,
    currentFlowId,
  ]);

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
          id: node.id || `node_${Date.now()}_${index}`,
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

  const handleImport = useCallback(
    async (importData) => {
      try {
        if (!importData) return;

        // Handle File Import (Client-Side)
        if (importData.mode === "file" && importData.content) {
          const flowData = JSON.parse(importData.content);

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
          // If the flow contains components with embedded subFlow data, migrate them now
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
          // Reset unsaved changes since we just loaded a fresh flow?
          // Actually, loading a flow IS a change unless we consider it "saved" immediately.
          // Usually, opening a file means it is saved content.
          // useFlowManager handles this in setNodes? No, setNodes sets it to true.
          // We might want to force reset it only if it's a full replace.
          // But sticking to default behavior (dirty) is safer unless we sync with backend immediately.
          // For now, let it be dirty until user hits Save (which persists to backend).
        }
        // Handle Directory Import (Server-Side Result)
        else if (importData.result) {
          // Logic for directory import result if needed
          toast.success(
            `✓ ${importData.result.stats?.successfulConversions || 0} flows imported.`,
          );
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
        selected[0].data?.type === "component")
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
  const { screenToFlowPosition } = useReactFlow();

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
      minZoom: 0.2, // Allow zooming out far
      maxZoom: 4, // Prevent excessive zoom in
      onlyRenderVisibleElements: true, // Critical for performance
      translateExtent: [
        [-5000, -5000],
        [5000, 5000],
      ], // Dynamic Extent (Large enough)

      ...figmaConfig, // Use Figma configuration
    }),
    [figmaConfig],
  );

  // Props dinámicas que sí cambian
  const flowConfig = useMemo(
    () => ({
      ...staticFlowProps,
      snapToGrid: enableSnapping, // Controlled by Global Settings
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
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
      onNodeContextMenu,
      onEdgeContextMenu,
      onPaneContextMenu,
      onSelectionContextMenu,
      onNodeDoubleClick: (event, node) => {
        if (node.type === "component") {
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
      onDrop,
      onDragOver,
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
      nodes,
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
      enableSnapping, // Dependency for memo
    ],
  );

  // ========================================
  // RENDER - MAREA LAYOUT
  // ========================================

  return (
    <>
      <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-all duration-400 antialiased font-sans selection:bg-cyan-500/30 m-0 p-0 border-none">
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
              isOpen={true}
              onClose={() => {
                setIsVariablePanelVisible(false);
                setIsCreationPanelVisible(true);
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
          <main className="flex-1 relative kanban-board-bg flex flex-col overflow-hidden">
            <div ref={reactFlowWrapper} className="flex-1 w-full relative">
              <ReactFlow {...flowConfig} onNodesDelete={onNodesDelete}>
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
                      ungroup: () => {
                        // Handle ungrouping via context menu
                        // Check if the right-clicked node is a component, or if selection contains one
                        if (
                          menu.data &&
                          (menu.data.type === "component" ||
                            menu.data.data?.type === "component")
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
                    }}
                  />
                )}
              </ReactFlow>
            </div>

            {/* Real-time Execution Terminal - Now inside Main Layout */}
            <TerminalPanel socket={socket} nodes={nodes} edges={edges} />

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
                {logs.length > 0 && (
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
              nodes={nodes}
              edges={edges}
              onSelectNode={setSelectedNodeId}
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
              updateNodeConfiguration={(nodeId, newData) =>
                updateNodeConfiguration(nodeId, newData)
              }
              onDeleteNode={deleteNode}
              projectPath={projectPath}
              isReadOnly={isReadOnly}
              onStartPick={handleStartPicking}
              onCancelPick={handleCancelPicking}
              onUngroup={ungroupNodes}
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
          flowName={
            // 1. Check if we're inside a Component (Sub-flow)
            // If so, we want to find its representation in the parent flow to get its customLabel
            nodes.find(
              (n) => n.id === currentFlowId || n.data?.flowId === currentFlowId,
            )?.data?.customLabel ||
            nodes.find(
              (n) => n.id === currentFlowId || n.data?.flowId === currentFlowId,
            )?.data?.label ||
            // 2. Fallback to DB flow name
            currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
            "No Flow Selected"
          }
          flows={useMemo(() => {
            const dbFlows = currentProject?.flows || [];

            // 1. Extract Live Components from Canvas
            const liveComponentFlows = nodes
              .filter(
                (n) =>
                  (n.type === "component" || n.data?.type === "component") &&
                  n.data?.flowId,
              )
              .map((n) => ({
                id: n.data.flowId,
                name:
                  n.data.customLabel || n.data.label || "Untitled Component",
                type: "component",
                isLive: true, // Flag for styling if needed
              }));

            // 2. Filter out DB flows that are currently represented by live nodes (to avoid duplicates)
            //    OR merge them updating the name.
            //    Strategy: Keep DB flows but valid ONLY non-components or components NOT on canvas?
            //    Actually, if we are in Main Flow, 'dbFlows' has all components.
            //    We want to OVERRIDE the DB flow entry with the Live Node entry if IDs match.

            // 3. Final deduplication: DB flows first, then live overrides (last write wins)
            const flowMap = new Map();
            dbFlows.forEach((f) => flowMap.set(f.id, f));
            liveComponentFlows.forEach((f) => flowMap.set(f.id, f));

            return [...flowMap.values()];
          }, [currentProject?.flows, nodes])}
          onSwitchFlow={(f) => switchFlow(f.id)}
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
          onRun={handleExecuteFlow}
          onSave={handleSaveFlow}
          onShowImport={() => setIsImportDialogOpen(true)}
          onShowExport={() => setIsExportDialogOpen(true)}
          hasUnsavedChanges={hasUnsavedChanges}
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
    </>
  );
}

// ========================================
// MAIN APP COMPONENT (Router Entry)
// ========================================

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
