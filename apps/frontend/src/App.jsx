import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ReactFlow, Controls, Background, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./components/styles/App.css";

import AppHeader from "./components/AppHeader";
import NodeCreationPanel from "./components/NodeCreationPanel";
import NodeConfigurationPanel from "./components/NodeConfigurationPanel";
import AppFooter from "./components/AppFooter";
import StyledMiniMap from "./components/StyledMiniMap";
import { nodeTypes } from "./components/nodes";
import StatusIndicator from "./components/StatusIndicator";
import ProgressBar from "./components/ProgressBar";
import ImportDialog from "./components/ImportDialog";
import ExportDialog from "./components/ExportDialog";
import ContextMenu from "./components/ContextMenu";

import { colors } from "./components/styles/colors";
import { useFlowManager } from "./components/hooks/useFlowManager.js";
import { useProjectManager } from "./components/hooks/useProjectManager.js";
import { migrateFromLegacy } from "./utils/migration";
import FlowTabs from "./components/FlowTabs";
import { useFlowShortcuts } from "./hooks/useKeyboardShortcuts";
import { useToast } from "./hooks/useToast";
import { useFigmaInteraction } from "./hooks/useFigmaInteraction";
import { useTranslation } from "react-i18next";

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function App() {
  const { t } = useTranslation();
  // Toast notifications
  const toast = useToast();

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
  } = useProjectManager();

  // Migration Effect
  React.useEffect(() => {
    const runMigration = async () => {
      try {
        const migratedProject = await migrateFromLegacy();
        if (migratedProject) {
          toast.success(`✓ ${t("common.migrate_success")}`);
          await loadProjects(); // Reload projects list
        }
      } catch (error) {
        console.error("Migration error:", error);
        toast.error(t("common.migrate_error"));
      }
    };

    runMigration();
  }, [toast, loadProjects]);

  // Initial Load
  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load project when selected or initial load
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
  const { getNodes, getEdges, deleteElements } = useReactFlow();

  // Panel visibility state
  const [isCreationPanelVisible, setIsCreationPanelVisible] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Execution state for progress bar
  const [executionProgress, setExecutionProgress] = useState({
    current: 0,
    total: 0,
    status: "",
  });
  const [isSaving, setIsSaving] = useState(false);
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
    importFlow,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedAction,
    setSelectedAction,
    setNodes,
    addNode,
    copyElements,
    pasteElements,
    cutElements,
    duplicateElements,
    clipboard,
  } = useFlowManager(currentProject, currentFlowId);

  // Computed values
  const isConfigurationPanelVisible = selectedAction !== null;

  // ========================================
  // CALLBACKS - UI
  // ========================================

  // Clear configuration and selection on flow switch
  useEffect(() => {
    closeConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId]);

  const toggleCreationPanel = useCallback(() => {
    setIsCreationPanelVisible((prev) => !prev);
  }, []);

  const closeConfiguration = useCallback(() => {
    if (setSelectedAction) {
      setSelectedAction(null);
    }
  }, [setSelectedAction]);

  // ========================================
  // CALLBACKS - Footer Actions
  // ========================================

  const handleExecuteFlow = useCallback(async () => {
    try {
      await executeFlow();
      toast.success(`✓ ${t("common.flow_exec_success")}`);
    } catch (error) {
      console.error("Error ejecutando flujo:", error);
      toast.error(`✗ ${t("common.flow_exec_error")}: ` + error.message);
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

  const handleExportFlow = useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  const handleExportDialogClose = useCallback(() => {
    setIsExportDialogOpen(false);
  }, []);

  const handleImportFlow = useCallback(() => {
    setIsImportDialogOpen(true);
  }, []);

  const handleImportDialogClose = useCallback(() => {
    setIsImportDialogOpen(false);
  }, []);

  const handleImport = useCallback(
    async (options) => {
      try {
        await importFlow(options);
        toast.success(`✓ ${t("common.flow_import_success")}`);
      } catch (error) {
        console.error("Error importando flujo:", error);
        toast.error(`✗ ${t("common.flow_import_error")}: ` + error.message);
        throw error; // Re-throw to let ImportDialog handle it
      }
    },
    [importFlow, toast],
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
      fitView: false,
      // Sensible defaults with zoomed out view to see more nodes
      defaultViewport: { x: 0, y: 0, zoom: 0.6 },
      snapToGrid: true,
      snapGrid: [15, 15],
      style: { backgroundColor: colors.deepSpace },
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
      nodeTypes, // Custom node types for optimized rendering
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
    ],
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="app-container">
      {/* Status Indicator */}
      <div
        className="status-indicator-wrapper"
        style={{
          position: "fixed",
          top: "70px",
          right: isConfigurationPanelVisible ? "340px" : "20px",
          zIndex: 9998,
          transition: "right 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <StatusIndicator
          isConnected={true}
          isSaving={isSaving}
          executionStats={
            nodes.length > 0 ? { successful: 0, total: nodes.length } : null
          }
        />
      </div>

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

      {/* Header */}
      <AppHeader />

      {/* Panel izquierdo */}
      <NodeCreationPanel
        addNode={addNode}
        isVisible={isCreationPanelVisible}
        togglePanel={toggleCreationPanel}
      />

      {/* Área principal */}
      <div
        className={`main-content 
          ${isCreationPanelVisible ? "shifted-left" : ""} 
          ${isConfigurationPanelVisible ? "shifted-right" : ""}`}
      >
        <ReactFlow {...flowConfig}>
          <StyledMiniMap />
          <Controls />
          <Background
            color={colors.metallicSilver}
            variant="dots"
            gap={12}
            size={1}
          />
        </ReactFlow>

        {/* Context Menu Overlay */}
        {menu && (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            type={menu.type}
            data={menu.data}
            onClose={() => setMenu(null)}
            actions={{
              copy: handleCopy,
              paste: handlePaste,
              cut: handleCut,
              delete: () => {
                if (menu.type === 'node') deleteNode(menu.id);
                if (menu.type === 'edge') {
                  setEdges((eds) => eds.filter((e) => e.id !== menu.id));
                }
                if (menu.type === 'selection') {
                  handleDeleteSelected();
                }
              },
              duplicate: handleDuplicateNodes,
              addNode: () => setIsCreationPanelVisible(true),
              selectAll: handleSelectAll,
              undo: undo,
              redo: redo,
              canUndo: canUndo,
              canRedo: canRedo,
              canPaste: clipboard.nodes.length > 0 || clipboard.edges.length > 0,
            }}
          />
        )}
      </div>

      {/* Panel derecho */}
      <NodeConfigurationPanel
        action={selectedAction}
        isVisible={isConfigurationPanelVisible}
        onExecute={executeStep}
        onClose={closeConfiguration}
        onDeleteNode={deleteNode}
        updateNodeConfiguration={updateNodeConfiguration}
        nodes={nodes}
      />

      {/* Flow Tabs - Above Footer */}
      {currentProject && (
        <FlowTabs
          flows={currentProject.flows || []}
          activeFlowId={currentFlowId}
          onSwitchFlow={switchFlow}
          onCreateFlow={createFlow}
          onRenameFlow={renameFlow}
          onDeleteFlow={deleteFlow}
          onDuplicateFlow={() => {
            // TODO: Implement duplicate
            toast.info(`${t("common.coming_soon")}`);
          }}
          projects={projects}
          currentProject={currentProject}
          onSelectProject={loadProject}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
        />
      )}

      {/* Footer */}
      <AppFooter
        onExecuteFlow={handleExecuteFlow}
        onSave={handleSaveFlow}
        onExport={handleExportFlow}
        onImport={handleImportFlow}
      />

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={handleImportDialogClose}
        onImport={handleImport}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={handleExportDialogClose}
        nodes={nodes}
        edges={edges}
      />
    </div>
  );
}
