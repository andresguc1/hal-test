import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
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
import ApiKeysModal from "./components/ApiKeysModal";
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

// ========================================
// COMPONENTE PRINCIPAL (MAREA REFACTOR)
// ========================================

export default function App() {
  const { t } = useTranslation();

  // Theme
  const { theme } = useTheme();

  // Toast notifications
  const toast = useToast();

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
  const { openSettings, openApiKeys, showGrid, enableSnapping, showMinimap } =
    useSettings();

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

  // React Flow hooks & Figma Interaction
  const { figmaConfig, handlers } = useFigmaInteraction();
  const { zoomIn, zoomOut, fitView } = handlers;

  // Hook de React Flow para acceder a funciones de eliminación
  const { getNodes, getEdges, deleteElements, setViewport } = useReactFlow();

  // Panel visibility state
  const [isCreationPanelVisible, setIsCreationPanelVisible] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
  const [_isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState(null);

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
    executeStep,
    executeFlow,
    saveFlow,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedAction,
    setSelectedAction,
    setNodes,
    setEdges,
    addNode,
    copyElements,
    pasteElements,
    cutElements,
    duplicateElements,
    clipboard,
    // clearFlow, // Unused
  } = useFlowManager(currentProject, currentFlowId);

  // Initialize Socket.io connection for real-time updates
  useHaltestSocket(setNodes);

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
    if (setSelectedAction) {
      setSelectedAction(null);
    }
  }, [setSelectedAction]);

  // ========================================
  // CALLBACKS - Footer Actions
  // ========================================

  const handleExecuteFlow = useCallback(async () => {
    // 1. Show Loading Toast immediately (Duration 0 = indefinite until dismissed)
    const toastId = toast.loading(t("common.processing"));

    try {
      const result = await executeFlow(); // Returns { success, stats }

      // 2. Clear loading
      toast.dismiss(toastId);

      if (result.success) {
        // Success with Duration
        const durationStr = (result.stats.duration / 1000).toFixed(2);
        toast.success(`${t("common.flow_exec_success")} (${durationStr}s)`);
      } else {
        // Failure with Count
        toast.error(
          `${t("common.flow_exec_error")} (${result.stats.failed} failed)`,
        );
      }
    } catch (error) {
      // 3. Unexpected Error
      toast.dismiss(toastId);
      console.error("Error ejecutando flujo:", error);
      toast.error(t("common.flow_exec_error") + ": " + error.message);
    }
  }, [executeFlow, toast, t]);

  const handleSaveFlow = useCallback(() => {
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
  }, [saveFlow, toast, t]);

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

          // Restore state
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);

          if (flowData.viewport) {
            setViewport(flowData.viewport);
          } else {
            setTimeout(() => fitView({ duration: 800 }), 100);
          }

          toast.success(`✓ ${t("common.flow_import_success")}`);
          setIsImportDialogOpen(false);
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
    [setNodes, setEdges, setViewport, fitView, toast, t],
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
      onPaneClick: () => {
        closeConfiguration();
        setMenu(null);
      },
      onNodeContextMenu,
      onEdgeContextMenu,
      onPaneContextMenu,
      onSelectionContextMenu,
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
          onOpenSettings={openSettings}
          onOpenApiKeys={openApiKeys}
          selectedProject={currentProject}
          selectedFlow={currentProject?.flows?.find(
            (f) => f.id === currentFlowId,
          )}
        />

        {/* 2. Content Wrapper */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          {/* SIDEBAR IZQUIERDO */}
          {isCreationPanelVisible && <Toolbox addNode={addNode} />}

          {/* LIENZO (CANVAS - Abyss Blue Environment) */}
          <main className="flex-1 relative kanban-board-bg">
            <div ref={reactFlowWrapper} className="w-full h-full relative">
              <ReactFlow {...flowConfig}>
                {showMinimap && <StyledMiniMap />}
                <Controls />

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
          </main>

          {/* PANEL DERECHO (CONFIGURACIÓN) */}
          <NodeConfigurationPanel
            action={selectedAction}
            isVisible={isConfigurationPanelVisible}
            onExecute={executeStep}
            onClose={closeConfiguration}
            onDeleteNode={deleteNode}
            updateNodeConfiguration={updateNodeConfiguration}
            nodes={nodes}
          />

          {/* Global Settings Modal */}
          <SettingsModal />
          <ApiKeysModal />
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
            currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
            "No Flow Selected"
          }
          flows={currentProject?.flows || []}
          onSwitchFlow={(f) => switchFlow(f.id)}
          onNewFlow={() => setCreationModal({ isOpen: true, type: "flow" })}
          onRenameFlow={(f, newName) => renameFlow(f.id, newName)}
          onDeleteFlow={(f) => deleteFlow(f.id)}
          // Global Props
          version="v1.0.2"
          isReadOnly={false}
          isRunning={executionProgress.status === "running"}
          onRun={handleExecuteFlow}
          onSave={handleSaveFlow}
          onShowImport={() => setIsImportDialogOpen(true)}
          onShowExport={() => setIsExportDialogOpen(true)}
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
          onConfirm={(name) => {
            if (creationModal.type === "project") {
              createProject(name);
            } else {
              createFlow(name);
            }
          }}
        />

        {/* TOAST SYSTEM (Positioned relative to Panel) */}
        <HalToaster offsetRight={isConfigurationPanelVisible ? 350 : 0} />
      </div>
    </>
  );
}
