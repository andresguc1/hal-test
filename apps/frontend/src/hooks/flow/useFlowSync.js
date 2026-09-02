import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "../../utils/logger";
import { projectManager } from "../../utils/ProjectManager";
import { subFlowCache } from "../../utils/subFlowCache";
import { debounce, deepClone } from "../../utils/flowUtils";
import { STARTER_TEMPLATE } from "../../config/starterTemplate";
import { useCollaboration } from "../../collaboration";

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
  const queryClient = useQueryClient();
  const [isStarterTemplate, setIsStarterTemplate] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [viewStack, setViewStack] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false); // Navigation guard state
  const currentProjectId = currentProject?.id;
  const lastLoadedFlowId = useRef(null);
  const activeFlowIdRef = useRef(currentFlowId);
  const isSavingRef = useRef(false);
  const saveQueueRef = useRef([]);
  const isNavigatingRef = useRef(isNavigating);

  useEffect(() => {
    activeFlowIdRef.current = currentFlowId;
  }, [currentFlowId]);

  // Auto-rebuild viewStack for deep links or page refreshes
  useEffect(() => {
    if (viewStack.length === 0 && currentProject && currentFlowId) {
      const flow = currentProject.flows?.find((f) => f.id === currentFlowId);
      if (flow && flow.parentId) {
        const newStack = [];
        let current = flow;
        while (current && current.parentId) {
          const parent = currentProject.flows?.find(
            (f) => f.id === current.parentId,
          );
          if (parent) {
            newStack.unshift({
              id: parent.id,
              label: parent.name,
              nodeId: null,
            });
            current = parent;
          } else {
            break;
          }
        }
        if (newStack.length > 0) {
          setViewStack(newStack);
        }
      }
    }
  }, [currentProject, currentFlowId, viewStack.length]);

  const saveFlow = useCallback(
    async (silent = false) => {
      const targetFlowId = currentFlowId;
      const targetProjectId = currentProjectId;
      if (!targetProjectId || !targetFlowId) return;

      // Prevent saving if current active flow or last loaded flow ID does not match target flow
      if (
        activeFlowIdRef.current !== targetFlowId ||
        lastLoadedFlowId.current !== targetFlowId
      ) {
        console.warn(
          `[useFlowSync] Blocked save: flow ID mismatch (activeFlowId: ${activeFlowIdRef.current}, targetFlowId: ${targetFlowId}, lastLoadedFlowId: ${lastLoadedFlowId.current})`,
        );
        return;
      }

      if (isSavingRef.current) {
        return new Promise((resolve, reject) => {
          saveQueueRef.current.push({
            targetProjectId,
            targetFlowId,
            silent,
            resolve,
            reject,
          });
        });
      }

      isSavingRef.current = true;
      try {
        const flowData = {
          nodes: deepClone(nodesRef.current || []),
          edges: deepClone(edgesRef.current || []),
          viewport: getViewport(),
          updatedAt: new Date().toISOString(),
        };

        await projectManager.updateFlow(
          targetProjectId,
          targetFlowId,
          flowData,
        );

        subFlowCache.invalidate(targetProjectId, targetFlowId);

        if (targetProjectId && targetFlowId) {
          try {
            localStorage.setItem(
              `hal_last_flow_${targetProjectId}`,
              targetFlowId,
            );
          } catch (e) {}
        }

        // Invalidate query to keep global project state (and derived flow names) in sync
        queryClient.invalidateQueries({
          queryKey: ["project", targetProjectId],
        });

        if (!silent) setApiStatus({ message: "✓ Flow saved" });
        setHasUnsavedChanges(false);

        isSavingRef.current = false;
        if (saveQueueRef.current.length > 0) {
          const next = saveQueueRef.current.shift();
          if (
            next.targetFlowId === activeFlowIdRef.current &&
            next.targetProjectId === currentProjectId &&
            lastLoadedFlowId.current === activeFlowIdRef.current
          ) {
            saveFlow(next.silent).then(next.resolve).catch(next.reject);
          } else {
            console.warn(
              `[useFlowSync] Discarding queued save for inactive flow ${next.targetFlowId}`,
            );
            next.resolve();
          }
        }
        return flowData;
      } catch (err) {
        logger.error("Save failed", err);
        setApiStatus({ state: "error", message: `✗ Error: ${err.message}` });
        isSavingRef.current = false;
        if (saveQueueRef.current.length > 0) {
          const next = saveQueueRef.current.shift();
          if (
            next.targetFlowId === activeFlowIdRef.current &&
            next.targetProjectId === currentProjectId &&
            lastLoadedFlowId.current === activeFlowIdRef.current
          ) {
            saveFlow(next.silent).then(next.resolve).catch(next.reject);
          } else {
            next.resolve();
          }
        }
        throw err;
      }
    },
    [
      currentProjectId,
      currentFlowId,
      getViewport,
      setApiStatus,
      setHasUnsavedChanges,
      nodesRef,
      edgesRef,
      queryClient,
    ],
  );

  const collab = useCollaboration();
  const isCollabActive = collab.isCollaborative && collab.isSynced;

  useEffect(() => {
    if (
      isCollabActive ||
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
    isCollabActive,
  ]);

  const loadFlowData = useCallback(async () => {
    if (!currentProjectId || !currentFlowId) return;
    const targetFlowId = currentFlowId;
    try {
      const flow = await projectManager.getFlow(currentProjectId, targetFlowId);
      // Guard against race condition: check if user switched flow while request was in-flight
      if (activeFlowIdRef.current !== targetFlowId) {
        console.warn(
          `[useFlowSync] Ignored stale loadFlowData response for flow: ${targetFlowId}`,
        );
        return;
      }
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(
          (flow.edges || []).map((e) => {
            const sourceHandle =
              e.sourceHandle === "default" ? undefined : e.sourceHandle;
            const targetHandle =
              e.targetHandle === "default" ? undefined : e.targetHandle;
            return {
              ...e,
              ...(sourceHandle && { sourceHandle }),
              ...(targetHandle && { targetHandle }),
              type: "custom",
              animated: !import.meta.env.DEV,
            };
          }),
        );
        // Only set loaded ID after state is successfully populated to prevent auto-saving old state
        lastLoadedFlowId.current = targetFlowId;
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      logger.error("Load failed", err);
    }
  }, [
    currentProjectId,
    currentFlowId,
    setNodes,
    setEdges,
    setHasUnsavedChanges,
  ]);

  useEffect(() => {
    // Clear save queue, cancel pending state, and reset loaded flow ID when switching flows
    lastLoadedFlowId.current = null;
    saveQueueRef.current = [];
    isSavingRef.current = false;

    if (collab.isCollaborative) {
      if (collab.isSynced && collab.ydoc) {
        const yMeta = collab.ydoc.getMap("meta");
        const isSeeded = yMeta.get("seeded");
        const yNodes = collab.ydoc.getMap("nodes");
        const yEdges = collab.ydoc.getMap("edges");

        // Self-healing: if the room was already marked seeded but edges are empty (e.g. due to the previous connection regression),
        // we force re-seeding from the SQLite database to restore the flow connections.
        const needsSeeding =
          !isSeeded || yNodes.size === 0 || yEdges.size === 0;

        if (needsSeeding) {
          console.log(
            `[Collaboration] CRDT room needs seeding (isSeeded: ${!!isSeeded}, yNodes: ${yNodes.size}, yEdges: ${yEdges.size}). Seeding from SQLite...`,
          );
          loadFlowData().then(() => {
            yMeta.set("seeded", true);
            yMeta.set("edges_seeded", true);
          });
        } else {
          console.log(
            `[Collaboration] CRDT room is already seeded (isSeeded: ${!!isSeeded}, yNodes: ${yNodes.size}, yEdges: ${yEdges.size}), skipping SQLite load.`,
          );
          lastLoadedFlowId.current = currentFlowId;
        }
      } else {
        // Fallback: if collaborative but not yet synced, load from SQLite
        // so the canvas isn't empty while waiting for WebSocket connection.
        console.log(
          "[Collaboration] Not yet synced, loading from SQLite as fallback...",
        );
        loadFlowData();
      }
    } else {
      loadFlowData();
    }
  }, [
    currentFlowId,
    loadFlowData,
    collab.isCollaborative,
    collab.isSynced,
    collab.ydoc,
  ]);

  // Sync isNavigating state to ref for race condition prevention in callbacks
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const enterComponent = useCallback(
    async (componentId) => {
      if (isNavigatingRef.current) {
        console.log(
          "[useFlowSync] Navigation already in progress, skipping...",
        );
        return;
      }
      setIsNavigating(true);
      isNavigatingRef.current = true;
      try {
        const componentNode = nodesRef.current.find(
          (n) => n.id === componentId,
        );
        if (!componentNode) return;

        const isContainer = ["component", "loop", "for_each"].includes(
          componentNode.type || componentNode.data?.type,
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
              (componentNode.type === "loop" ||
              componentNode.type === "for_each" ||
              componentNode.data?.type === "loop" ||
              componentNode.data?.type === "for_each"
                ? "Loop Sub-flow"
                : "Sub Flow");

            const flowType =
              componentNode.type === "loop" ||
              componentNode.data?.type === "loop" ||
              componentNode.type === "for_each" ||
              componentNode.data?.type === "for_each"
                ? "loop"
                : "component";

            const response = await projectManager.createFlow(
              currentProject.id,
              flowName,
              { type: flowType },
            );
            flowId = response.flow?.id || response.id;

            if (!flowId) {
              throw new Error("Failed to retrieve new flow ID");
            }

            const defaultNodes = [];
            const isContainer = ["component", "loop"].includes(
              componentNode.type || componentNode.data?.type,
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
                },
              );
            }

            await projectManager.updateFlow(currentProject.id, flowId, {
              nodes: defaultNodes,
              edges: [],
              viewport: { x: 0, y: 0, zoom: 1 },
            });

            // Update parent node data using deepClone to avoid in-place reference mutation
            const clonedComponentNode = deepClone(componentNode);
            clonedComponentNode.data = {
              ...clonedComponentNode.data,
              flowId,
              configuration: {
                ...clonedComponentNode.data?.configuration,
                flowId,
              },
            };

            const updatedNodes = nodesRef.current.map((n) =>
              n.id === componentId ? clonedComponentNode : n,
            );
            nodesRef.current = updatedNodes;
            setNodes(updatedNodes);

            // Save the parent flow
            await saveFlow(true);
          } catch (err) {
            logger.error(
              "Failed to automatically create subflow for container",
              err,
            );
            if (toast) toast.error("Failed to initialize sub-flow");
            return;
          }
        }

        await saveFlow(true);
        subFlowCache.invalidate(currentProject?.id, currentFlowId);
        const flowName =
          componentNode.data?.customLabel ||
          componentNode.data?.label ||
          (componentNode.type === "loop" ||
          componentNode.type === "for_each" ||
          componentNode.data?.type === "loop" ||
          componentNode.data?.type === "for_each"
            ? "Loop Sub-flow"
            : "Sub Flow");

        setViewStack((prev) => [
          ...prev,
          { id: currentFlowId, label: flowName, nodeId: componentId },
        ]);
        switchFlow(flowId);
      } catch (err) {
        console.error("[useFlowSync] Error during enterComponent:", err);
      } finally {
        setIsNavigating(false);
        isNavigatingRef.current = false;
      }
    },
    [
      currentFlowId,
      currentProject,
      saveFlow,
      switchFlow,
      nodesRef,
      setNodes,
      toast,
    ],
  );

  const exitComponent = useCallback(
    async (targetIndex) => {
      if (isNavigatingRef.current) {
        console.log(
          "[useFlowSync] Navigation already in progress, skipping exit...",
        );
        return;
      }
      setIsNavigating(true);
      isNavigatingRef.current = true;
      try {
        if (viewStack.length === 0) return;
        await saveFlow(true);
        subFlowCache.invalidate(currentProject?.id, currentFlowId);
        // Support indexed exit: if targetIndex provided, truncate stack to that point
        const newLength =
          typeof targetIndex === "number" ? targetIndex : viewStack.length - 1;

        const targetView =
          typeof targetIndex === "number"
            ? viewStack[targetIndex]
            : viewStack[newLength];

        if (targetView) {
          switchFlow(targetView.id);
          setViewStack((prev) => prev.slice(0, newLength));
        }
      } catch (err) {
        console.error("[useFlowSync] Error during exitComponent:", err);
      } finally {
        setIsNavigating(false);
        isNavigatingRef.current = false;
      }
    },
    [viewStack, saveFlow, switchFlow],
  );

  const loadStarterTemplate = useCallback(
    async (projectId) => {
      console.log(
        "[useFlowSync] Loading starter template for project:",
        projectId,
      );
      const MAX_TEMPLATE_RETRIES = 3;
      const TEMPLATE_RETRY_DELAY = 1500;

      for (let attempt = 1; attempt <= MAX_TEMPLATE_RETRIES; attempt++) {
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

          let finalName = STARTER_TEMPLATE.name;
          let counter = 1;

          if (defaultEmptyFlow) {
            console.log(
              "[useFlowSync] Reusing existing empty default flow:",
              defaultEmptyFlow.id,
            );
            targetFlowId = defaultEmptyFlow.id;

            while (
              existingFlows.some(
                (f) => f.name === finalName && f.id !== targetFlowId,
              )
            ) {
              finalName = `${STARTER_TEMPLATE.name} (${counter++})`;
            }

            // Update/Rename the existing flow to the template name
            await projectManager.updateFlow(projectId, targetFlowId, {
              name: finalName,
              nodes: processedNodes,
              edges: STARTER_TEMPLATE.edges,
            });
          } else {
            // Create a new flow for the template if there's already work or no empty default flow
            while (existingFlows.some((f) => f.name === finalName)) {
              finalName = `${STARTER_TEMPLATE.name} (${counter++})`;
            }
            console.log(
              "[useFlowSync] Creating new flow with name:",
              finalName,
            );
            const response = await projectManager.createFlow(
              projectId,
              finalName,
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
              animated: !import.meta.env.DEV,
            })),
          );

          // Switch to it
          switchFlow(targetFlowId);
          setIsStarterTemplate(true);

          if (toast)
            toast.success(
              t("common.template_loaded", "Starter template loaded!"),
            );
          return;
        } catch (err) {
          const isLastAttempt = attempt === MAX_TEMPLATE_RETRIES;
          console.error(
            `[useFlowSync] Template load attempt ${attempt}/${MAX_TEMPLATE_RETRIES} failed:`,
            err.message,
          );
          if (isLastAttempt) {
            logger.error("Failed to load starter template", err);
            if (toast)
              toast.error(
                t("common.template_error", "Failed to load template"),
              );
          } else {
            console.log(
              `[useFlowSync] Retrying template load in ${TEMPLATE_RETRY_DELAY}ms...`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, TEMPLATE_RETRY_DELAY * attempt),
            );
          }
        }
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
    isNavigating,
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
