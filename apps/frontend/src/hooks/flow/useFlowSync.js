import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { logger } from "../../utils/logger";
import { projectManager } from "../../utils/ProjectManager";
import { debounce } from "../../utils/flowUtils";
import { STARTER_TEMPLATE } from "../../config/starterTemplate";

export function useFlowSync({
  currentProject,
  currentFlowId,
  nodes,
  edges,
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  getViewport,
  setApiStatus,
  toast,
  t,
  switchFlow,
  setSelectedNodeId,
  fitView,
}) {
  const [isStarterTemplate, setIsStarterTemplate] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [viewStack, setViewStack] = useState([]);
  const lastLoadedFlowId = useRef(null);

  const saveFlow = useCallback(
    async (silent = false) => {
      if (!currentProject || !currentFlowId) return;
      const flowData = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: getViewport(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await projectManager.updateFlow(
          currentProject.id,
          currentFlowId,
          flowData,
        );
        if (!silent) setApiStatus({ message: "✓ Flow saved" });
        setHasUnsavedChanges(false);
        return flowData;
      } catch (err) {
        logger.error("Save failed", err);
        setApiStatus({ state: "error", message: `✗ Error: ${err.message}` });
      }
    },
    [
      currentProject,
      currentFlowId,
      getViewport,
      setApiStatus,
      setHasUnsavedChanges,
      nodesRef,
      edgesRef,
    ],
  );

  useEffect(() => {
    if (
      !autoSaveEnabled ||
      !hasUnsavedChanges ||
      lastLoadedFlowId.current !== currentFlowId
    )
      return;
    const debouncedSave = debounce(() => saveFlow(true), 2000);
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [
    nodes,
    edges,
    autoSaveEnabled,
    hasUnsavedChanges,
    currentFlowId,
    saveFlow,
  ]);

  const loadFlowData = useCallback(async () => {
    if (!currentProject || !currentFlowId) return;
    try {
      lastLoadedFlowId.current = currentFlowId;
      const flow = await projectManager.getFlow(
        currentProject.id,
        currentFlowId,
      );
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(
          (flow.edges || []).map((e) => ({
            ...e,
            type: "custom",
            animated: true,
          })),
        );
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      logger.error("Load failed", err);
    }
  }, [currentProject, currentFlowId, setNodes, setEdges, setHasUnsavedChanges]);

  useEffect(() => {
    loadFlowData();
  }, [currentFlowId, loadFlowData]);

  const enterComponent = useCallback(
    async (componentId) => {
      const componentNode = nodesRef.current.find((n) => n.id === componentId);
      if (!componentNode?.data?.flowId) return;

      await saveFlow(true);
      const flowName =
        currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
        "Flow";

      setViewStack((prev) => [
        ...prev,
        { id: currentFlowId, label: flowName, nodeId: componentId },
      ]);
      switchFlow(componentNode.data.flowId);
    },
    [currentFlowId, currentProject, saveFlow, switchFlow, nodesRef],
  );

  const exitComponent = useCallback(async () => {
    if (viewStack.length === 0) return;
    await saveFlow(true);
    const lastView = viewStack[viewStack.length - 1];
    setViewStack((prev) => prev.slice(0, -1));
    switchFlow(lastView.id);
  }, [viewStack, saveFlow, switchFlow]);

  const loadStarterTemplate = useCallback(
    async (projectId) => {
      console.log(
        "[useFlowSync] Loading starter template for project:",
        projectId,
      );
      try {
        // 1. Create a new flow for the template
        console.log(
          "[useFlowSync] Creating flow with name:",
          STARTER_TEMPLATE.name,
        );
        const response = await projectManager.createFlow(
          projectId,
          STARTER_TEMPLATE.name,
        );
        console.log("[useFlowSync] Flow created response:", response);
        const newFlowId = response.flow?.id || response.id;
        console.log("[useFlowSync] New flow ID:", newFlowId);

        // 2. Set the nodes and edges locally
        setNodes(STARTER_TEMPLATE.nodes);
        setEdges(
          STARTER_TEMPLATE.edges.map((e) => ({
            ...e,
            type: "custom",
            animated: true,
          })),
        );

        // 3. Persist it immediately
        await projectManager.updateFlow(projectId, newFlowId, {
          nodes: STARTER_TEMPLATE.nodes,
          edges: STARTER_TEMPLATE.edges,
        });

        // 4. Switch to it
        switchFlow(newFlowId);
        setIsStarterTemplate(true);

        if (toast)
          toast.success(
            t("common.template_loaded", "Starter template loaded!"),
          );
      } catch (err) {
        logger.error("Failed to load starter template", err);
        if (toast)
          toast.error(t("common.template_error", "Failed to load template"));
      }
    },
    [setNodes, setEdges, switchFlow, toast, t],
  );

  const projectPath = useMemo(() => {
    const parts = [currentProject?.name || "Project"];
    viewStack.forEach((v) => parts.push(v.label));
    return parts.join(" / ");
  }, [currentProject, viewStack]);

  return {
    saveFlow,
    loadFlowData,
    loadStarterTemplate,
    isStarterTemplate,
    setIsStarterTemplate,
    autoSaveEnabled,
    setAutoSaveEnabled,
    viewStack,
    setViewStack,
    exitComponent,
    enterComponent,
    projectPath,
    deepNavigate: useCallback(
      async (divePath, targetNodeId) => {
        if (divePath && divePath.length > 0) {
          for (const componentId of divePath) {
            const node = nodesRef.current.find((n) => n.id === componentId);
            if (node) {
              await enterComponent(componentId);
              await new Promise((r) => setTimeout(r, 800));
            }
          }
        }

        if (targetNodeId) {
          setSelectedNodeId(targetNodeId);
          let retries = 15;
          const attemptFocus = () => {
            const nodeExists = nodesRef.current.some(
              (n) => n.id === targetNodeId,
            );
            if (nodeExists) {
              fitView({
                nodes: [{ id: targetNodeId }],
                duration: 800,
                padding: 0.4,
                maxZoom: 1.2,
              });
            } else if (retries > 0) {
              retries--;
              setTimeout(attemptFocus, 300);
            }
          };
          setTimeout(attemptFocus, 200);
        }
      },
      [enterComponent, nodesRef, setSelectedNodeId, fitView],
    ),
  };
}
