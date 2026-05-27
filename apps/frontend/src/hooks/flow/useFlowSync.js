import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
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
  migrateNodes,
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
      if (!componentNode) return;

      const isContainer = ["component", "loop"].includes(
        componentNode.type || componentNode.data?.type
      );
      if (!isContainer) return;

      let flowId = componentNode.data?.flowId;

      if (!flowId) {
        if (!currentProject) {
          logger.error("No active project to create a subflow");
          return;
        }
        try {
          const flowName =
            componentNode.data?.customLabel ||
            componentNode.data?.label ||
            (componentNode.type === "loop" || componentNode.data?.type === "loop"
              ? "Loop Sub-flow"
              : "Sub Flow");

          const flowType =
            componentNode.type === "loop" || componentNode.data?.type === "loop"
              ? "loop"
              : "component";

          const response = await projectManager.createFlow(
            currentProject.id,
            flowName,
            { type: flowType }
          );
          flowId = response.flow?.id || response.id;

          if (!flowId) {
            throw new Error("Failed to retrieve new flow ID");
          }

          const defaultNodes = [];
          const isContainer = ["component", "loop"].includes(
            componentNode.type || componentNode.data?.type
          );
          if (isContainer) {
            defaultNodes.push(
              {
                id: `node_${uuidv4()}`,
                type: "input",
                position: { x: 100, y: 150 },
                data: {
                  type: "input",
                  label: "Input Parameters",
                  state: "default",
                },
              },
              {
                id: `node_${uuidv4()}`,
                type: "output",
                position: { x: 600, y: 150 },
                data: {
                  type: "output",
                  label: "Output Return",
                  state: "default",
                },
              }
            );
          }

          await projectManager.updateFlow(currentProject.id, flowId, {
            nodes: defaultNodes,
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          });

          // Update parent node data
          componentNode.data = {
            ...componentNode.data,
            flowId,
            configuration: {
              ...componentNode.data?.configuration,
              flowId,
            },
          };

          // Save the parent flow
          await saveFlow(true);
        } catch (err) {
          logger.error("Failed to automatically create subflow for container", err);
          if (toast) toast.error("Failed to initialize sub-flow");
          return;
        }
      }

      await saveFlow(true);
      const flowName =
        currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
        "Flow";

      setViewStack((prev) => [
        ...prev,
        { id: currentFlowId, label: flowName, nodeId: componentId },
      ]);
      switchFlow(flowId);
    },
    [currentFlowId, currentProject, saveFlow, switchFlow, nodesRef, toast],
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
        // Fetch latest project flows to check if we can reuse/overwrite the default empty flow
        const projectData = await projectManager.getProject(projectId);
        const existingFlows = projectData?.flows || [];

        // Find if there's a default empty "Main Flow" we can reuse
        const defaultEmptyFlow = existingFlows.find(
          (f) =>
            (f.name === "Main Flow" &&
              (!f.nodeCount || Number(f.nodeCount) === 0)) ||
            (existingFlows.length === 1 &&
              (!f.nodeCount || Number(f.nodeCount) === 0)),
        );

        let targetFlowId;
        const processedNodes = migrateNodes
          ? await migrateNodes(STARTER_TEMPLATE.nodes, projectId)
          : STARTER_TEMPLATE.nodes;

        if (defaultEmptyFlow) {
          console.log(
            "[useFlowSync] Reusing existing empty default flow:",
            defaultEmptyFlow.id,
          );
          targetFlowId = defaultEmptyFlow.id;

          // Update/Rename the existing flow to the template name
          await projectManager.updateFlow(projectId, targetFlowId, {
            name: STARTER_TEMPLATE.name,
            nodes: processedNodes,
            edges: STARTER_TEMPLATE.edges,
          });
        } else {
          // Create a new flow for the template if there's already work or no empty default flow
          console.log(
            "[useFlowSync] Creating new flow with name:",
            STARTER_TEMPLATE.name,
          );
          const response = await projectManager.createFlow(
            projectId,
            STARTER_TEMPLATE.name,
          );
          console.log("[useFlowSync] Flow created response:", response);
          targetFlowId = response.flow?.id || response.id;

          // Persist the nodes and edges to the new flow
          await projectManager.updateFlow(projectId, targetFlowId, {
            nodes: processedNodes,
            edges: STARTER_TEMPLATE.edges,
          });
        }

        // Set the nodes and edges locally
        setNodes(processedNodes);
        setEdges(
          STARTER_TEMPLATE.edges.map((e) => ({
            ...e,
            type: "custom",
            animated: true,
          })),
        );

        // Switch to it
        switchFlow(targetFlowId);
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
    [setNodes, setEdges, switchFlow, toast, t, migrateNodes],
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
