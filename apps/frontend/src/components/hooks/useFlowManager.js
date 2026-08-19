// hal_test/src/components/hooks/useFlowManager.js
// ✨ ORCHESTRATOR VERSION: Modularized according to best practices

import { useReactFlow } from "@xyflow/react";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { useLogs } from "../../context/LogContext";
import { useFlowState } from "../../hooks/flow/useFlowState";
import { useFlowExecution } from "../../hooks/flow/useFlowExecution";
import { useFlowSync } from "../../hooks/flow/useFlowSync";
import { usePickerReplay } from "../../hooks/usePickerReplay";

/**
 * useFlowManager: Central orchestrator for flow logic.
 * Now decomposed into specialized hooks for better maintainability.
 */
export function useFlowManager(currentProject, currentFlowId, switchFlow) {
  const { t } = useTranslation();
  const { addLog } = useLogs();
  const toast = useToast();
  const { getViewport, fitView } = useReactFlow();

  // 1. STATE MANAGEMENT (Nodes, Edges, Selection, History)
  const state = useFlowState({ currentProject, currentFlowId });

  // 2. EXECUTION ENGINE (Execute Step, Flow, Session)
  const execution = useFlowExecution({
    nodes: state.nodes,
    edges: state.edges,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    updateNodeState: state.updateNodeState,
    currentProject,
    currentFlowId,
    addLog,
    toast,
    t,
    isCollabActive: state.isCollabActive,
    broadcastElementState: state.broadcastElementState,
    clearExecutionStates: state.clearExecutionStates,
  });

  // 3. PERSISTENCE & SYNC (Load, Save, Auto-save, Navigation)
  const sync = useFlowSync({
    currentProject,
    currentFlowId,
    nodes: state.nodes,
    edges: state.edges,
    nodesRef: state.nodesRef,
    edgesRef: state.edgesRef,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    hasUnsavedChanges: state.hasUnsavedChanges,
    setHasUnsavedChanges: state.setHasUnsavedChanges,
    getViewport,
    setApiStatus: execution.setApiStatus,
    toast,
    t,
    switchFlow,
    setSelectedNodeId: state.setSelectedNodeId,
    fitView,
    migrateNodes: state.migrateNodes,
  });

  // 4. PICKER REPLAY (replay ancestors before single-node execution)
  const pickerReplay = usePickerReplay({
    nodes: state.nodes,
    edges: state.edges,
    activeBrowserId: execution.activeBrowserId,
    setActiveBrowserId: execution.setActiveBrowserId,
    updateNodeState: state.updateNodeState,
  });

  // Connect saveFlow persistence callback to state hook
  state.setSaveFlow(sync.saveFlow);

  // Backward compatibility mappings
  return {
    ...state,
    ...execution,
    ...sync,
    // Explicit mappings for common names if needed
    saveFlow: sync.saveFlow,
    executeFlow: execution.executeFlow,
    executeStep: execution.executeStep,
    executeSingleNode: (nodeId, _type, config, _options) => {
      return pickerReplay.replayAndExecuteNode(
        nodeId,
        execution.executeStep,
        config,
      );
    },
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    onNodeClick: state.onNodeClick,
    migrateNodes: state.migrateNodes,
    loopNodes: (project, flowId, qc, toastInstance, tInstance) =>
      state.loopNodes(
        project || currentProject,
        flowId || currentFlowId,
        qc,
        toastInstance,
        tInstance,
      ),
    groupNodes: (project, flowId, qc, toastInstance, tInstance) =>
      state.groupNodes(
        project || currentProject,
        flowId || currentFlowId,
        qc,
        toastInstance,
        tInstance,
      ),
    ungroupNodes: state.ungroupNodes,
    updateNodeConfiguration: state.updateNodeConfiguration,
    loadStarterTemplate: sync.loadStarterTemplate,
    isStarterTemplate: sync.isStarterTemplate,
    detectOrphans: state.detectOrphans,
    onLayout: (dir) => state.onLayout(dir, fitView),
    addGhostNode: state.addGhostNode,
    toggleNodesDisabled: state.toggleNodesDisabled,
    toggleDownstreamDisabled: state.toggleDownstreamDisabled,
    replayRun: (run) => state.replayRun(run, toast),
    stopSession: execution.stopSession,
    isReadOnly: execution.isReadOnly,
    validateFlowStructure: execution.validateFlowStructure,
    projectPath: sync.projectPath,
    isReplayingNode: pickerReplay.isReplaying,
    replayNodeProgress: pickerReplay.replayProgress,
    enterComponent: sync.enterComponent,
    exitComponent: sync.exitComponent,
    deepNavigate: sync.deepNavigate,
    isNavigating: sync.isNavigating,
    copyElements: state.copyElements,
    cutElements: state.cutElements,
    pasteElements: state.pasteElements,
    duplicateElements: state.duplicateElements,
    clipboard: state.clipboard,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  };
}
