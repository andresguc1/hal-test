// hal_test/src/components/hooks/useFlowManager.js
// ✨ VERSIÓN OPTIMIZADA según best practices de React Flow

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GraphValidator } from "../../utils/GraphValidator.js";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import {
  NODE_LABELS,
  SCREENSHOT_RECOMMENDATIONS,
  VISUAL_CHANGE_NODES,
} from "./constants";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "../../config/nodeConstants";
import { STARTER_TEMPLATE } from "../../config/starterTemplate";
import * as payloadBuilders from "./payloadBuilders";
import { NODE_STATES, PROFESSIONAL_COLORS, getNodeStyle } from "./flowStyles";
import {
  debounce,
  wouldCreateCycle,
  resolveVariables,
} from "../../utils/flowUtils";
import { logger } from "../../utils/logger";
import screenshotManager from "../../utils/ScreenshotManager";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast"; // Use custom hook instead of direct sonner
import { useTranslation } from "react-i18next";
import { getLayoutedElements } from "../../utils/layoutUtils";
import { projectManager } from "../../utils/ProjectManager";
import { useSettings } from "../../context/SettingsContext";

// NEW: Orphan Detection Helper
const detectOrphans = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  // Find all Entry Points (Roots)
  // We include 'launch_browser' (Main), 'input' (Sub-flows), and 'trigger' (Events)
  const roots = nodes.filter((n) =>
    ["launch_browser", "input", "trigger"].includes(n.type),
  );
  if (roots.length === 0) {
    // If no explicit entry point, we can't determine reachability accurately.
    // However, to avoid spamming "everything is an orphan", we return empty if there's at least one node.
    // (A flow with nodes but no entry point IS technically broken, but we'll be silent for now or just warn about missing input)
    return [];
  }

  const visited = new Set();
  const queue = [...roots.map((n) => n.id)];
  roots.forEach((n) => visited.add(n.id));

  // Build Adjacency Map
  const adj = {};
  edges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  // BFS
  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adj[current] || [];
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    });
  }

  // Orphans are nodes NOT visited
  return nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
};

// NEW: Recursive Helper for Modifying Nodes Data even if they are deep inside Components
const updateNodeRecursively = (nodes, nodeId, updaterFn) => {
  let hasChanges = false;
  const recursiveMap = (list) => {
    return list.map((node) => {
      if (node.id === nodeId) {
        hasChanges = true;
        return updaterFn(node);
      }
      if (
        (node.type === "component" || node.data?.type === "component") &&
        node.data?.subFlow?.nodes
      ) {
        const oldSubNodes = node.data.subFlow.nodes;
        const newSubNodes = recursiveMap(oldSubNodes);
        if (oldSubNodes !== newSubNodes) {
          hasChanges = true;
          return {
            ...node,
            data: {
              ...node.data,
              subFlow: {
                ...node.data.subFlow,
                nodes: newSubNodes,
              },
            },
          };
        }
      }
      return node;
    });
  };
  const result = recursiveMap(nodes);
  return hasChanges ? result : nodes;
};

// NEW: Helper to reset all nodes recursively
const resetNodeStatesRecursively = (list) => {
  return list.map((node) => {
    let newNode = {
      ...node,
      data: {
        ...node.data,
        state: NODE_STATES.DEFAULT,
        executed: false,
        errorDetails: null,
        error: null, // NEW: Clear error message
        executionTime: null,
      },
      style: getNodeStyle(NODE_STATES.DEFAULT, node.style),
    };

    if (
      (newNode.type === "component" || newNode.data?.type === "component") &&
      newNode.data?.subFlow?.nodes
    ) {
      newNode.data.subFlow.nodes = resetNodeStatesRecursively(
        newNode.data.subFlow.nodes,
      );
    }
    return newNode;
  });
};

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const AUTO_SAVE_INTERVAL = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Redundant constant removed - moved to utils/api.js logic
// export const API_BASE_URL = "/api/actions";

// ========================================
// OPTIMIZACIÓN 1: Funciones puras fuera del hook
// ========================================
const generateNodeId = () => `node_${uuidv4()}`;

const createExecutedLabel = (action) => {
  if (action?.data?.customLabel) return action.data.customLabel;

  const typeLabel = NODE_LABELS[action.type] || action.type;
  const payload = action.payload || action || {};
  let detail = "";

  if (payload.url) detail = payload.url;
  else if (payload.width && payload.height)
    detail = `${payload.width}x${payload.height}`;
  else if (payload.duration) detail = `${payload.duration}ms`;
  else if (payload.text) detail = payload.text;
  else if (payload.selector) detail = payload.selector;
  else if (payload.browserType) detail = payload.browserType;

  const fullLabel = detail ? `${typeLabel}: ${detail}` : typeLabel;
  return fullLabel.length > 35 ? `${fullLabel.substring(0, 32)}...` : fullLabel;
};

// Default configurations for specific node types
const DEFAULT_NODE_CONFIGS = {
  open_url: { url: "https://www.saucedemo.com" },
  launch_browser: { headless: false },
  set_viewport: { width: 1280, height: 720 },
  wait_for_timeout: { duration: 1000 },
  loop: { mode: "count", iterations: 1 },
};

// ========================================
// OPTIMIZACIÓN 2: Memoización de estilos de edges
// ========================================
const DEFAULT_EDGE_OPTIONS = {
  animated: true,
  style: {
    stroke: "#ff8c32", // hal-orange
    strokeWidth: 2,
  },
  markerEnd: {
    type: "arrowclosed",
    width: 20,
    height: 20,
    color: "#ff8c32", // hal-orange to match theme
  },
  // Hacer los edges seleccionables y eliminables
  focusable: true,
  deletable: true,
  // Estilos cuando el edge está seleccionado
  selectedStyle: {
    stroke: "#FF8C32", // halOrange
    strokeWidth: 3,
  },
};

export function useFlowManager(currentProject, currentFlowId, switchFlow) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast(); // Custom HAL Toast
  const { getViewport, fitView } = useReactFlow();

  // State for nodes and edges
  const nodesRef = useRef([]); // To access updated state in callbacks
  const edgesRef = useRef([]);

  const [nodes, setNodesState] = useState([]);
  const [edges, setEdgesState] = useState([]);

  // Sync ref with state
  const setNodes = useCallback((newNodes) => {
    // Handle function update
    const resolvedNodes =
      typeof newNodes === "function" ? newNodes(nodesRef.current) : newNodes;

    // ✨ ROBUST DEDUPLICATION: Prevent duplicate IDs that crash React Flow
    const uniqueNodes = [];
    const seenIds = new Set();

    for (const node of resolvedNodes) {
      if (!seenIds.has(node.id)) {
        seenIds.add(node.id);
        uniqueNodes.push(node);
      } else {
        console.warn(
          `[useFlowManager] 🛡️ Duplicate node detected and filtered: ${node.id}`,
        );
      }
    }

    nodesRef.current = uniqueNodes;
    setNodesState(uniqueNodes);
    setHasUnsavedChanges(true); // Mark as dirty on ANY node change
  }, []);

  const setEdges = useCallback((newEdges) => {
    const resolvedEdges =
      typeof newEdges === "function" ? newEdges(edgesRef.current) : newEdges;

    // ✨ ROBUST DEDUPLICATION: Prevent duplicate edge IDs that crash React Flow
    const uniqueEdges = [];
    const seenIds = new Set();

    for (const edge of resolvedEdges) {
      if (!seenIds.has(edge.id)) {
        seenIds.add(edge.id);
        uniqueEdges.push(edge);
      } else {
        console.warn(
          `[useFlowManager] 🛡️ Duplicate edge detected and filtered: ${edge.id}`,
        );
      }
    }

    edgesRef.current = uniqueEdges;
    setEdgesState(uniqueEdges);
    setHasUnsavedChanges(true); // Mark as dirty on ANY edge change
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedAction = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = updateNodeRecursively(
      nodesRef.current,
      selectedNodeId,
      (n) => n,
    )?.find((n) => n.id === selectedNodeId);
    // Fallback search in flat nodes if recursive search is not needed for selectedAction logic here
    const flatNode = nodes.find((n) => n.id === selectedNodeId);
    const activeNode = flatNode || node;

    if (!activeNode) return null;
    return {
      nodeId: activeNode.id,
      type: activeNode.type,
      data: activeNode.data,
    };
  }, [selectedNodeId, nodes]);

  // History (Undo/Redo)
  const [history, setHistory] = useState({ past: [], future: [] });

  // Clipboard
  const [clipboard, setClipboard] = useState({ nodes: [], edges: [] });

  // Navigation (View Stack)
  const [viewStack, setViewStack] = useState([]);

  // ... (execution state) ...
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ state: "idle", message: "" });
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  });

  // PERSISTENT SESSION STATE
  const [activeBrowserId, setActiveBrowserId] = useState(null);
  const [isStarterTemplate, setIsStarterTemplate] = useState(false);

  const executionAbortController = useRef(null);
  const lastLoadedFlowId = useRef(null); // Ref for preventing race conditions
  const [changeCounter, setChangeCounter] = useState(0); // For auto-save versioning logic
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // NEW: Unsaved Indicator
  const { autoSaveEnabled, setAutoSaveEnabled } = useSettings();

  // RELOAD PERSISTENCE: Check if there's an active session in the backend on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get("/inspector/sessions");
        if (res.success && res.sessions && res.sessions.length > 0) {
          console.log(
            "[useFlowManager] 🔄 Restored active session from backend:",
            res.sessions[0],
          );
          setActiveBrowserId(res.sessions[0]);
        }
      } catch (e) {
        console.warn("[useFlowManager] Could not restore session:", e);
      }
    };
    restoreSession();
  }, []);

  // NEW: Read-Only Mode derived from execution status
  const isReadOnly = useMemo(
    () => apiStatus.state === "running",
    [apiStatus.state],
  );

  // ========================================
  // OPTIMIZACIÓN 6: Historial con límite
  // ========================================
  const saveToHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [
        ...prev.past.slice(-19), // Mantener solo últimos 20
        { nodes: nodesRef.current, edges: edgesRef.current },
      ],
      future: [],
    }));
  }, []);

  const onLayout = useCallback(
    (direction) => {
      saveToHistory();
      const [layoutedNodes, layoutedEdges] = getLayoutedElements(
        nodesRef.current,
        edgesRef.current,
        direction || "LR",
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Re-fit view to show the new layout
      setTimeout(() => {
        fitView({ duration: 800 });
      }, 50);
    },
    [setNodes, setEdges, saveToHistory, fitView],
  );

  // Load flow data
  useEffect(() => {
    const loadFlowData = async () => {
      if (currentProject && currentFlowId) {
        // Prevent fetching a deleted flow due to React state batching lag
        if (
          currentProject.flows &&
          !currentProject.flows.some((f) => f.id === currentFlowId)
        ) {
          return;
        }

        try {
          lastLoadedFlowId.current = currentFlowId; // Mark start of load

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
                animated: true, // Optional: force animation by default
              })),
            );
            // History reset on flow switch
            setHistory({ past: [], future: [] });
            setHasUnsavedChanges(false); // Reset on load

            // NEW: Check for Orphans on Load
            const orphanIds = detectOrphans(flow.nodes || [], flow.edges || []);
            if (orphanIds.length > 0) {
              // Optional: visual indication or toast
              // toast.warning(t('warnings.orphans_detected', { count: orphanIds.length }));
              // We could also mark them visually, but let's just log for now
              logger.warn(
                "Orphan nodes detected",
                { count: orphanIds.length },
                "useFlowManager",
              );
            }

            logger.info("Flow loaded", { flowId: flow.id }, "useFlowManager");

            // ✨ AUTO-MAGIC LAYOUT: Automatically organize the canvas on load
            setTimeout(() => {
              onLayout("LR");
            }, 150);
          }
        } catch (err) {
          logger.error("Error loading flow", err, "useFlowManager");
        }
      }
    };

    loadFlowData();
  }, [currentProject, currentFlowId, setNodes, setEdges, toast, t, onLayout]); // Satisfy linter while currentProject is the owner of id

  // MANIFIESTO: Bidirectional Sync (Footer -> Canvas)
  // If a flow is renamed in the Footer (Global State), update the Node on Canvas
  useEffect(() => {
    if (!currentProject?.flows) return;

    setNodes((currentNodes) => {
      let hasChanges = false;
      const newNodes = currentNodes.map((n) => {
        if ((n.type === "component" || n.type === "loop") && n.data?.flowId) {
          const flowRecord = currentProject.flows.find(
            (f) => f.id === n.data.flowId,
          );

          if (flowRecord) {
            const hasNameChanged = flowRecord.name !== n.data.label;
            // Support syncing updated node count if available from backend
            const hasCountChanged =
              flowRecord.nodeCount !== undefined &&
              flowRecord.nodeCount !== n.data.nodeCount;

            if (hasNameChanged || hasCountChanged) {
              hasChanges = true;
              return {
                ...n,
                data: {
                  ...n.data,
                  ...(hasNameChanged && {
                    label: flowRecord.name,
                    customLabel: flowRecord.name,
                  }),
                  ...(hasCountChanged && { nodeCount: flowRecord.nodeCount }),
                },
              };
            }
          }
        }
        return n;
      });

      return hasChanges ? newNodes : currentNodes;
    });
  }, [currentProject?.flows, setNodes]);

  // ========================================
  // COMPOSITION: NAVIGATION (DIVE-IN)
  // ========================================
  // Handles navigation between flows (Main -> Component -> Component)

  // ========================================
  // OPTIMIZACIÓN: Cleanup de AbortController
  // ========================================
  useEffect(() => {
    return () => {
      // Cleanup al desmontar componente
      if (executionAbortController.current) {
        executionAbortController.current.abort();
        executionAbortController.current = null;
        logger.debug("AbortController cleaned up", null, "useFlowManager");
      }
    };
  }, []);

  // ========================================
  // OPTIMIZACIÓN 4: useCallback con deps correctas
  const saveFlow = useCallback(
    async (silent = false) => {
      if (!currentProject || !currentFlowId) return;

      // Prevent saving to a deleted flow
      if (
        currentProject.flows &&
        !currentProject.flows.some((f) => f.id === currentFlowId)
      ) {
        return;
      }

      const flowData = {
        nodes: nodesRef.current, // Use Ref for latest state
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

        if (!silent) {
          setApiStatus({
            message: "✓ Flow saved successfully",
          });
        }

        // Always clear dirty flag on successful save (both manual and auto-save)
        setHasUnsavedChanges(false);

        // Increment change counter for versioning
        setChangeCounter((prev) => prev + 1);

        return flowData;
      } catch (err) {
        logger.error("Error al guardar el flujo", err, "useFlowManager");
        setApiStatus({
          state: "error",
          message: `✗ Error saving flow: ${err.message}`,
        });
        return flowData;
      }
    },
    [getViewport, currentProject, currentFlowId],
  );

  // ========================================
  // OPTIMIZACIÓN: Auto-guardado con debounce
  // ========================================
  useEffect(() => {
    // Only save if auto-save is enabled AND the current nodes belong to the active flowId
    // AND there are actual unsaved changes
    if (
      !autoSaveEnabled ||
      !currentProject ||
      !currentFlowId ||
      !hasUnsavedChanges ||
      lastLoadedFlowId.current !== currentFlowId
    )
      return;

    // Debounce de 2 segundos - solo guarda si no hay cambios recientes
    const debouncedSave = debounce(() => {
      // Final guard to ensure we don't save inconsistent state
      if (lastLoadedFlowId.current !== currentFlowId) return;

      logger.debug(
        "Auto-saving flow",
        { nodeCount: nodes.length, flowId: currentFlowId },
        "useFlowManager",
      );
      saveFlow(true);
    }, 2000);

    debouncedSave();

    return () => {
      debouncedSave.cancel();
    };
  }, [
    nodes,
    edges,
    autoSaveEnabled,
    saveFlow,
    currentProject,
    currentFlowId,
    hasUnsavedChanges,
  ]);

  // ========================================
  // VERSIONADO AUTOMÁTICO
  // ========================================
  useEffect(() => {
    if (changeCounter > 0 && changeCounter % 10 === 0 && currentProject) {
      projectManager
        .saveVersion(
          currentProject.id,
          `Auto-save: ${changeCounter} changes`,
          true,
        )
        .then(() => {
          logger.info(
            "Auto-version created",
            { changeCounter },
            "useFlowManager",
          );
        })
        .catch((err) => {
          logger.error("Failed to create auto-version", err, "useFlowManager");
        });
    }
  }, [changeCounter, currentProject]);

  // ========================================
  // OPTIMIZACIÓN 5: Batch updates con useCallback
  // ========================================
  const updateNodeState = useCallback(
    (nodeId, state, extraData = null) => {
      setNodes((nds) =>
        updateNodeRecursively(nds, nodeId, (node) => {
          const newData = {
            ...node.data,
            state,
            lastExecuted: new Date().toISOString(),
          };

          // If extraData has pickingField (even if null), add/reset it.
          // If it's an error object, handle legacy error structure.
          if (extraData && "pickingField" in extraData) {
            newData.pickingField = extraData.pickingField;
          } else if (extraData?.message) {
            newData.errorDetails = extraData;
            newData.error = extraData.message;
          }

          return {
            ...node,
            data: newData,
            style: getNodeStyle(state, node.style),
          };
        }),
      );

      // NOTE: Removed automatic outgoing edge update to allow Switch/Conditional
      // nodes to strictly control their animated paths.
    },
    [setNodes],
  );

  const updateEdgeStatus = useCallback(
    (edgeId, state, animated = false) => {
      const recursiveEdgeMap = (edges) => {
        return edges.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              animated,
              data: {
                ...edge.data,
                executionState: state,
              },
            };
          }

          // Recurse into components if they have subflows with edges
          // Actually, edges in HalTest are top-level unless in data.subFlow.edges.
          return edge;
        });
      };

      setNodes((nds) =>
        nds.map((node) => {
          if (
            (node.type === "component" || node.data?.type === "component") &&
            node.data?.subFlow?.edges
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                subFlow: {
                  ...node.data.subFlow,
                  edges: recursiveEdgeMap(node.data.subFlow.edges),
                },
              },
            };
          }
          return node;
        }),
      );

      // Also update top-level edges
      setEdges((eds) => recursiveEdgeMap(eds));
    },
    [setNodes, setEdges],
  );

  const resetNodeStates = useCallback(() => {
    setNodes((nds) => resetNodeStatesRecursively(nds));
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        data: {
          ...edge.data,
          executionState: "default",
        },
      })),
    );
    setExecutionStats({
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    });
    setApiStatus({
      state: "idle",
      message: "Node states reset",
    });
  }, [setNodes, setEdges, setExecutionStats, setApiStatus]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      const newFuture = [
        { nodes: nodesRef.current, edges: edgesRef.current },
        ...prev.future,
      ];
      setNodes(previous.nodes);
      setEdges(previous.edges);
      return { past: newPast, future: newFuture };
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      const newPast = [
        ...prev.past,
        { nodes: nodesRef.current, edges: edgesRef.current },
      ];
      setNodes(next.nodes);
      setEdges(next.edges);
      return { past: newPast, future: newFuture };
    });
  }, [setNodes, setEdges]);

  // ========================================
  // OPTIMIZACIÓN 7: Operaciones de nodo optimizadas
  // ========================================
  const addNode = useCallback(
    (typeKey, position = null) => {
      saveToHistory();
      const id = generateNodeId();
      const label = NODE_LABELS[typeKey] || typeKey;

      let nodePosition;

      if (position) {
        // Use provided position (from drag & drop)
        nodePosition = position;
      } else {
        // Calculate position based on existing nodes to avoid overlap
        const nodeWidth = 160;
        const nodeHeight = 60;
        const horizontalSpacing = 100;
        const verticalSpacing = 150;
        const nodesPerRow = 3;

        const startX = 400;
        const startY = 250;

        const nodeCount = nodesRef.current.length;
        const row = Math.floor(nodeCount / nodesPerRow);
        const col = nodeCount % nodesPerRow;

        nodePosition = {
          x: startX + col * (nodeWidth + horizontalSpacing),
          y: startY + row * (nodeHeight + verticalSpacing),
        };
      }

      const newNode = {
        id,
        type: typeKey,
        position: nodePosition,
        data: {
          label,
          type: typeKey,
          configuration:
            (DEFAULT_NODE_CONFIGS && DEFAULT_NODE_CONFIGS[typeKey]) || {},
          state: NODE_STATES.DEFAULT,
        },
        sourcePosition: "right",
        targetPosition: "left",
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);

      // SPECIAL CASE: Create backing flow for sub-flow nodes (component/loop)
      if (typeKey === "component" || typeKey === "loop") {
        const projectId = currentProject?.id;

        if (!projectId) {
          logger.error(
            "Cannot create backing flow: No active project.",
            null,
            "useFlowManager",
          );
          toast.error("Please ensure a project is selected first.");
          return;
        }

        (async () => {
          try {
            const flowName = `${label} (${id.slice(0, 4)})`;
            const response = await projectManager.createFlow(
              projectId,
              flowName,
            );
            const flowId = response.flow?.id || response.id;

            if (flowId) {
              // Create default input/output for the new flow
              await projectManager.updateFlow(projectId, flowId, {
                nodes: [
                  {
                    id: "input-" + Date.now(),
                    type: "input",
                    position: { x: 100, y: 150 },
                    data: { label: "Input", type: "input" },
                  },
                  {
                    id: "output-" + uuidv4(),
                    type: "output",
                    position: { x: 600, y: 150 },
                    data: { label: "Output", type: "output" },
                  },
                ],
                edges: [],
              });

              // Link the node to the flow using functional update for state safety
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === id ? { ...n, data: { ...n.data, flowId } } : n,
                ),
              );

              // ✨ CRITICAL FIX: Explicitly save the main flow NOW before invalidating
              // This prevents a race condition where the auto-reload (triggered by query invalidation)
              // might overwrite the local nodes before they are saved to the backend.
              await saveFlow(true);

              queryClient.invalidateQueries(["project", projectId]);
              logger.info(
                "Backing flow created, linked and main flow saved",
                { nodeId: id, flowId },
                "useFlowManager",
              );
            }
          } catch (error) {
            logger.error(
              "Failed to create backing flow",
              error,
              "useFlowManager",
            );
            toast.error("Failed to initialize sub-flow logic.");
          }
        })();
      }
    },
    [saveToHistory, setNodes, currentProject, queryClient, toast, saveFlow],
  );

  // --- GHOST NODES (Phase 2) ---
  const confirmGhostNode = useCallback(
    (nodeId) => {
      saveToHistory();
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                isGhost: false,
                // Remove confirm callback from data to keep it clean for save
                onConfirmGhost: undefined,
              },
            };
          }
          return n;
        }),
      );
    },
    [saveToHistory, setNodes],
  );

  const addGhostNode = useCallback(
    (type, selector, value) => {
      const id = generateNodeId();
      const label = NODE_LABELS[type] || type;

      // Position: Find the rightmost node and add to the right
      const rightmostXP = nodesRef.current.reduce(
        (max, n) => Math.max(max, n.position.x),
        100,
      );
      const lastNodeAtY = nodesRef.current
        .filter((n) => n.position.x === rightmostXP)
        .reduce((max, n) => Math.max(max, n.position.y), 100);

      const newNode = {
        id,
        type,
        position: { x: rightmostXP + 300, y: lastNodeAtY },
        data: {
          label,
          type,
          configuration: { selector, text: value },
          isGhost: true,
          onConfirmGhost: confirmGhostNode,
          state: NODE_STATES.DEFAULT,
        },
        sourcePosition: "right",
        targetPosition: "left",
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, confirmGhostNode],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      saveToHistory();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setSelectedNodeId(null);

      // CRITICAL FIX: Close panel if we deleted the active node
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
    },
    [saveToHistory, setNodes, setEdges, setSelectedNodeId],
  );

  const updateNodeConfiguration = useCallback(
    async (nodeId, newConfig) => {
      saveToHistory();

      let targetFlowId = null;
      let newName = null;

      setNodes((nds) =>
        updateNodeRecursively(nds, nodeId, (n) => {
          // Check if this is a container rename (component or loop)
          const isContainer =
            n.type === "component" ||
            n.data?.type === "component" ||
            n.type === "loop" ||
            n.data?.type === "loop";
          if (isContainer) {
            const proposedName = newConfig.customLabel || newConfig.label;
            if (proposedName && proposedName !== n.data?.label) {
              targetFlowId = n.data?.flowId;
              newName = proposedName;
            }
          }

          const updated = {
            ...n,
            data: {
              ...n.data,
              configuration: newConfig,
              // LIFT customLabel to top-level data for easy access
              customLabel:
                newConfig.customLabel !== undefined
                  ? newConfig.customLabel
                  : n.data.customLabel,
              // Fallback for Component: if passed as label, treat as customLabel?
              // No, let's stick to explicit customLabel from UI.
              label:
                newConfig.label ||
                n.data.label ||
                NODE_LABELS[n.data.type] ||
                n.data.type,
              // LIFT description to top-level data
              description:
                newConfig.description !== undefined
                  ? newConfig.description
                  : n.data.description,
            },
          };

          // selectedAction will update automatically via useMemo

          return updated;
        }),
      );
      // SYNC COMPONENT NAME TO BACKEND
      if (targetFlowId && newName && currentProject?.id) {
        try {
          // 1. Update Backend
          const pId = currentProject?.id;
          const fId = targetFlowId;

          if (!pId || !fId) {
            console.warn(
              "[FlowManager] Skipping updateFlow: No active project/flow",
            );
            return;
          }

          await projectManager.updateFlow(pId, fId, {
            name: newName,
          });
          // FORCE UPDATE: Invalidate project query to sync flow list and tabs
          queryClient.invalidateQueries(["project", currentProject.id]);
          console.log(
            "[useFlowManager] ✅ Component renamed and synced:",
            newName,
          );

          // 2. Optimistic UI Update (Menu)
          queryClient.setQueryData(["project", currentProject.id], (old) => {
            if (!old) return old;
            return {
              ...old,
              flows: old.flows.map((f) =>
                f.id === targetFlowId ? { ...f, name: newName } : f,
              ),
            };
          });
          console.log(`[FlowManager] Synced component rename: ${newName}`);
        } catch (err) {
          console.error("Failed to sync component name to backend", err);
          toast.error(
            t(
              "errors.rename_failed",
              "Failed to updates component name on server",
            ),
          );
        }
      }
    },
    [saveToHistory, setNodes, currentProject, queryClient, t, toast],
  );

  // ========================================
  // SCREENSHOT CAPTURE METHODS
  // ========================================

  /**
   * Update node with screenshot data
   */
  const updateNodeScreenshot = useCallback(
    (nodeId, timing, screenshotData) => {
      setNodes((nds) =>
        updateNodeRecursively(nds, nodeId, (node) => ({
          ...node,
          data: {
            ...node.data,
            screenshots: {
              ...node.data.screenshots,
              [timing]: screenshotData,
            },
          },
        })),
      );
    },
    [setNodes],
  );

  /**
   * Capture screenshot for a node
   */
  const captureScreenshot = useCallback(
    async ({ nodeId, timing, browserId, nodeType }) => {
      try {
        // Get recommended delay for this node type
        const recommendation = SCREENSHOT_RECOMMENDATIONS[nodeType];
        const delay = recommendation?.delay?.[timing] || 0;

        // Wait for animations/transitions to complete
        if (delay > 0) {
          await sleep(delay);
        }

        // Call backend to capture screenshot
        // Use the correct payload format matching take_screenshot action
        const screenshotPayload = {
          browserId,
          selector: null, // Capture full viewport
          path: null, // EXPLICITLY null to force base64 return
          fullPage: false, // Only viewport
          format: "jpeg", // JPEG for compression
          quality: 80, // 80% quality
          timeout: 30000, // 30 second timeout
        };

        const data = await api.post(
          "/actions/take_screenshot",
          screenshotPayload,
        );

        // Log response for debugging
        logger.debug(
          "Screenshot API response",
          {
            dataKeys: Object.keys(data),
            hasScreenshot: !!data.screenshot,
            screenshotType: typeof data.screenshot,
          },
          "useFlowManager",
        );

        // Check for screenshot data in response
        // Backend might return it as 'screenshot', 'image', or 'data'
        // CRITICAL: Ensure we pick a STRING, not an object (like { path: ... })
        let base64Screenshot = null;

        if (typeof data.screenshot === "string")
          base64Screenshot = data.screenshot;
        else if (typeof data.image === "string") base64Screenshot = data.image;
        else if (typeof data.data === "string") base64Screenshot = data.data;
        else if (data.data && typeof data.data.screenshot === "string")
          base64Screenshot = data.data.screenshot;

        if (!base64Screenshot) {
          logger.error(
            "No valid screenshot string in response",
            { data },
            "useFlowManager",
          );
          throw new Error(
            "No screenshot string in response. Got: " + JSON.stringify(data),
          );
        }

        // Cleanup old screenshot before saving new one
        await screenshotManager.deleteScreenshot(nodeId, timing);

        // Save screenshot using ScreenshotManager
        const screenshotMetadata = await screenshotManager.saveScreenshot(
          nodeId,
          timing,
          base64Screenshot,
        );

        // Update node with screenshot metadata
        updateNodeScreenshot(nodeId, timing, screenshotMetadata);

        logger.debug(
          "Screenshot captured",
          { nodeId, timing },
          "useFlowManager",
        );

        return screenshotMetadata;
      } catch (error) {
        logger.error("Screenshot capture failed", error, "useFlowManager");
        return null;
      }
    },
    [updateNodeScreenshot],
  );

  const groupNodes = useCallback(async () => {
    // 1. Identify selected nodes
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    if (selectedNodes.length < 2) {
      toast.error(
        t("groups.min_selection", "Select at least 2 nodes to group"),
      );
      return;
    }

    saveToHistory();

    // 2. Calculate Bounding Box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedNodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + (n.width || 200));
      maxY = Math.max(maxY, n.position.y + (n.height || 100));
    });

    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    // 3. Center of the group (for the new node)

    // 4. Extract Sub-Flow Logic
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Internal Edges: Both Source and Target inside group (Keep them)
    const internalEdges = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // External Incoming: Source OUTSIDE, Target INSIDE (Needs Input Node)
    const externalIncoming = edgesRef.current.filter(
      (e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // External Outgoing: Source INSIDE, Target OUTSIDE (Needs Output Node)
    const externalOutgoing = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
    );

    // ---------------------------------------------------------
    // GENERATE SUB-FLOW NODES (Normalized + Boundaries)
    // ---------------------------------------------------------
    const subNodes = selectedNodes.map((n) => ({
      ...n,
      position: {
        x: n.position.x - minX,
        y: n.position.y - minY,
      },
      selected: false,
      parentNode: null,
      extent: undefined, // Clear extent if parent related
    }));

    const finalSubEdges = [...(internalEdges || [])]; // Start with internal edges

    // -> HANDLE INPUT BOUNDARY
    if (externalIncoming.length > 0) {
      const inputId = `input_${uuidv4()}`;
      const inputNode = {
        id: inputId,
        type: "input",
        position: { x: -250, y: groupHeight / 2 - 25 }, // Left of content
        data: { label: "Input" },
      };
      subNodes.push(inputNode);

      // Connect Input Node -> Original Targets of incoming edges
      externalIncoming.forEach((edge) => {
        // Find which node inside was the target
        // We create a new edge inside: Input -> TargetNode
        const newInternalEdge = {
          id: `e_${inputId}-${edge.target}`,
          source: inputId,
          target: edge.target,
          type: "default",
          animated: true,
        };
        // Avoid duplicates if multiple external edges point to same target?
        // Actually, logic allows multiple edges from Input.
        finalSubEdges.push(newInternalEdge);
      });
    }

    // -> HANDLE OUTPUT BOUNDARY
    if (externalOutgoing.length > 0) {
      const outputId = `output_${uuidv4()}`;
      const outputNode = {
        id: outputId,
        type: "output",
        position: { x: groupWidth + 200, y: groupHeight / 2 - 25 }, // Right of content
        data: { label: "Output" },
      };
      subNodes.push(outputNode);

      // Connect Original Sources -> Output Node
      externalOutgoing.forEach((edge) => {
        const newInternalEdge = {
          id: `e_${edge.source}-${outputId}`,
          source: edge.source,
          target: outputId,
          type: "default",
          animated: true,
        };
        finalSubEdges.push(newInternalEdge);
      });
    }

    try {
      // 5. Create Component Flow via API
      const componentName = `Component ${new Date().toLocaleTimeString()}`;
      const { flow: newFlow } = await projectManager.createFlow(
        currentProject.id,
        componentName,
        {
          type: "component",
          parentId: currentFlowId,
          nodes: subNodes,
          edges: finalSubEdges,
        },
      );

      if (!newFlow || !newFlow.id)
        throw new Error("Failed to create component flow");

      // REFRESH PROJECT DATA (Optimistic Update for Instant UI)
      queryClient.setQueryData(["project", currentProject.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          flows: [...(old.flows || []), newFlow],
        };
      });

      // 6. Create The Component Node in Main Flow
      const componentId = generateNodeId();
      const componentNode = {
        id: componentId,
        type: "component",
        position: { x: minX, y: minY }, // Use top-left of group
        width: groupWidth, // Optional: preserve dimensions?
        height: groupHeight,
        data: {
          label: componentName,
          type: "component",
          flowId: newFlow.id,
          configuration: {},
          nodeCount: subNodes.length,
          hasInput: subNodes.some((n) => n.type === "input"),
          hasOutput: subNodes.some((n) => n.type === "output"),
          subFlow: { nodes: subNodes, edges: finalSubEdges }, // Include edges for stats and restoration
        },
        style: getNodeStyle ? getNodeStyle(NODE_STATES.DEFAULT) : {},
      };

      // 7. Update Main Flow State
      const remainingNodes = nodesRef.current.filter(
        (n) => !selectedNodeIds.has(n.id),
      );

      const remainingEdges = edgesRef.current.filter(
        (e) =>
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target) &&
          !externalIncoming.includes(e) &&
          !externalOutgoing.includes(e),
      );

      // Rewire Main Flow Edges to Component Node
      // Incoming: Original Source -> Component Node
      const newIncomingEdges = externalIncoming.map((e) => ({
        ...e,
        id: `e_${e.source}-${componentId}`,
        target: componentId,
      }));

      // Outgoing: Component Node -> Original Target
      const newOutgoingEdges = externalOutgoing.map((e) => ({
        ...e,
        id: `e_${componentId}-${e.target}`,
        source: componentId,
      }));

      const finalNodes = [...remainingNodes, componentNode];
      const finalEdges = [
        ...remainingEdges,
        ...newIncomingEdges,
        ...newOutgoingEdges,
      ];

      setNodes(finalNodes);
      setEdges(finalEdges);

      // Persist changes immediately to prevent "ungrouping" on reload
      await saveFlow();

      // AUTO-FOCUS: Select Node and Open Inspector
      setTimeout(() => {
        setSelectedNodeId(componentId);
      }, 50);

      toast.success(t("groups.success", "Grouped into Component"));
    } catch (error) {
      console.error("Failed to group nodes:", error);
      toast.error(t("groups.error", "Failed to create component"));
    }
  }, [
    currentProject,
    currentFlowId,
    saveToHistory,
    setNodes,
    setEdges,
    t,
    setSelectedNodeId,

    toast,
    queryClient,
    saveFlow,
  ]);

  const loopNodes = useCallback(async () => {
    // 1. Identify selected nodes
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    if (selectedNodes.length < 2) {
      toast.error(t("groups.min_selection", "Select at least 2 nodes to loop"));
      return;
    }

    saveToHistory();

    // 2. Calculate Bounding Box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedNodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + (n.width || 200));
      maxY = Math.max(maxY, n.position.y + (n.height || 100));
    });

    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    // 4. Extract Sub-Flow Logic
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Internal Edges: Both Source and Target inside group (Keep them)
    const internalEdges = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // External Incoming: Source OUTSIDE, Target INSIDE (Needs Input Node)
    const externalIncoming = edgesRef.current.filter(
      (e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // External Outgoing: Source INSIDE, Target OUTSIDE (Needs Output Node)
    const externalOutgoing = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
    );

    // ---------------------------------------------------------
    // GENERATE SUB-FLOW NODES (Normalized + Boundaries)
    // ---------------------------------------------------------
    const subNodes = selectedNodes.map((n) => ({
      ...n,
      position: {
        x: n.position.x - minX,
        y: n.position.y - minY,
      },
      selected: false,
      parentNode: null,
      extent: undefined,
    }));

    const finalSubEdges = [...(internalEdges || [])];

    // -> HANDLE INPUT BOUNDARY
    if (externalIncoming.length > 0) {
      const inputId = `input_${uuidv4()}`;
      const inputNode = {
        id: inputId,
        type: "input",
        position: { x: -250, y: groupHeight / 2 - 25 },
        data: { label: "Input", type: "input" },
      };
      subNodes.push(inputNode);

      externalIncoming.forEach((edge) => {
        finalSubEdges.push({
          id: `e_${inputId}-${edge.target}`,
          source: inputId,
          target: edge.target,
          type: "default",
          animated: true,
        });
      });
    }

    // -> HANDLE OUTPUT BOUNDARY
    if (externalOutgoing.length > 0) {
      const outputId = `output_${uuidv4()}`;
      const outputNode = {
        id: outputId,
        type: "output",
        position: { x: groupWidth + 200, y: groupHeight / 2 - 25 },
        data: { label: "Output", type: "output" },
      };
      subNodes.push(outputNode);

      externalOutgoing.forEach((edge) => {
        finalSubEdges.push({
          id: `e_${edge.source}-${outputId}`,
          source: edge.source,
          target: outputId,
          type: "default",
          animated: true,
        });
      });
    }

    try {
      // 5. Create Loop Flow via API
      const loopName = `Loop ${new Date().toLocaleTimeString()}`;
      const { flow: newFlow } = await projectManager.createFlow(
        currentProject.id,
        loopName,
        {
          type: "loop",
          parentId: currentFlowId,
          nodes: subNodes,
          edges: finalSubEdges,
        },
      );

      if (!newFlow || !newFlow.id)
        throw new Error("Failed to create loop flow");

      // REFRESH PROJECT DATA
      queryClient.setQueryData(["project", currentProject.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          flows: [...(old.flows || []), newFlow],
        };
      });

      // 6. Create The Loop Node in Main Flow
      const loopId = generateNodeId();
      const loopNode = {
        id: loopId,
        type: "loop",
        position: { x: minX, y: minY },
        width: groupWidth,
        height: groupHeight,
        data: {
          label: loopName,
          type: "loop",
          flowId: newFlow.id,
          configuration: { mode: "count", iterations: 1 },
          nodeCount: subNodes.length,
          hasInput: subNodes.some((n) => n.type === "input"),
          hasOutput: subNodes.some((n) => n.type === "output"),
          subFlow: { nodes: subNodes, edges: finalSubEdges },
        },
        style: getNodeStyle ? getNodeStyle(NODE_STATES.DEFAULT) : {},
      };

      // 7. Update Main Flow State
      const remainingNodes = nodesRef.current.filter(
        (n) => !selectedNodeIds.has(n.id),
      );

      const remainingEdges = edgesRef.current.filter(
        (e) =>
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target) &&
          !externalIncoming.includes(e) &&
          !externalOutgoing.includes(e),
      );

      const newIncomingEdges = externalIncoming.map((e) => ({
        ...e,
        id: `e_${e.source}-${loopId}`,
        target: loopId,
      }));

      const newOutgoingEdges = externalOutgoing.map((e) => ({
        ...e,
        id: `e_${loopId}-${e.target}`,
        source: loopId,
      }));

      setNodes([...remainingNodes, loopNode]);
      setEdges([...remainingEdges, ...newIncomingEdges, ...newOutgoingEdges]);

      await saveFlow();

      setTimeout(() => {
        setSelectedNodeId(loopId);
      }, 50);

      toast.success(t("groups.loop_success", "Iterated Selection Created"));
    } catch (error) {
      console.error("Failed to loop nodes:", error);
      toast.error(t("groups.loop_error", "Failed to create iterate selection"));
    }
  }, [
    currentProject,
    currentFlowId,
    saveToHistory,
    setNodes,
    setEdges,
    t,
    setSelectedNodeId,
    toast,
    queryClient,
    saveFlow,
  ]);

  // ========================================
  // COMPOSITION: NAVIGATION (DIVE-IN)
  // ========================================
  // ========================================
  // COMPOSITION: NAVIGATION (DIVE-IN)
  // ========================================
  const enterComponent = useCallback(
    async (componentId) => {
      const componentNode = nodesRef.current.find((n) => n.id === componentId);

      if (!componentNode) return;

      if (
        componentNode.type !== "component" &&
        componentNode.data.type !== "component" &&
        componentNode.type !== "loop" &&
        componentNode.data.type !== "loop"
      ) {
        toast.error("Cannot enter: Not a component or loop node");
        return;
      }

      const { flowId } = componentNode.data;
      if (!flowId) {
        if (componentNode.data.subFlow) {
          toast.error(
            "Legacy component detected. Please ungroup and regroup to migrate.",
          );
          return;
        }
        toast.error("Component flow ID missing.");
        return;
      }

      // 1. Save Current Flow
      try {
        await saveFlow();
      } catch (e) {
        console.warn("Auto-save before switch failed", e);
      }

      // 2. Push to Stack (Defensive: Avoid duplicate IDs in breadcrumbs)
      const currentFlowName =
        currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
        "Previous Flow";

      setViewStack((prev) => {
        // Prevent adding the same ID consecutively
        if (prev.length > 0 && prev[prev.length - 1].id === currentFlowId) {
          return prev;
        }
        return [
          ...prev,
          {
            id: currentFlowId,
            label: currentFlowName,
            nodeId: componentId, // Track which node triggered the dive
          },
        ];
      });

      // 3. Switch Flow
      if (switchFlow) {
        switchFlow(flowId);
      } else {
        console.error("switchFlow function is missing in useFlowManager");
      }
    },
    [currentFlowId, currentProject, saveFlow, switchFlow, toast],
  );

  const exitComponent = useCallback(async () => {
    if (viewStack.length === 0) return;

    // 1. Save Sub-Flow
    try {
      await saveFlow();
    } catch (e) {
      console.warn("Auto-save before exit failed", e);
    }

    // 2. Pop Stack
    const lastView = viewStack[viewStack.length - 1];
    setViewStack((prev) => prev.slice(0, -1));

    // 3. Switch Back
    if (switchFlow) {
      switchFlow(lastView.id);
    }
  }, [viewStack, saveFlow, switchFlow]);

  const exitToRoot = useCallback(async () => {
    if (viewStack.length === 0) return;

    // 1. Save Current (wherever we are)
    await saveFlow().catch(() => {});

    // 2. Identify Root
    const root = viewStack[0];

    // 3. Reset Stack and Switch
    setViewStack([]);
    if (switchFlow) {
      switchFlow(root.id);
    }
  }, [viewStack, saveFlow, switchFlow]);

  // ========================================
  // OPTIMIZACIÓN 8: Ejecutar paso con mejor manejo de errores
  // ========================================
  const executeStep = useCallback(
    async (nodeOrAction, _type, _payload = {}, _options = {}) => {
      let action = nodeOrAction;

      // Adapter 1: support explicit arguments (taskId, taskType, taskPayload)
      if (typeof nodeOrAction === "string") {
        action = {
          nodeId: nodeOrAction,
          type: _type,
          payload: _payload,
        };
      }
      // Adapter 2: support direct Node object execution (from Panel)
      else if (nodeOrAction && nodeOrAction.id && nodeOrAction.data) {
        action = {
          nodeId: nodeOrAction.id,
          type: nodeOrAction.type,
          payload: nodeOrAction.data.configuration,
          ...nodeOrAction,
        };
      }

      if (!action || !action.nodeId) {
        console.error("Invalid action", action);
        return { success: false, error: "Invalid action" };
      }

      const { nodeId, payload } = action;

      // Get node (refresh from store ONLY if we need fallback data, but prefer payload)
      const storeNode = nodesRef.current.find((n) => n.id === nodeId);

      // Robust type detection: check action.type, then node.data.type, then node.type
      const type =
        action.type || storeNode?.data?.type || storeNode?.type || "unknown";

      if (type === "unknown") {
        logger.error(
          "Could not determine action type for node",
          { nodeId, actionKeys: Object.keys(action) },
          "useFlowManager",
        );
      }

      const endpoint = (payload && payload.endpoint) || `/actions/${type}`;
      const config = payload || storeNode?.data?.configuration || {};

      // PRIORITY: Payload > Config > Active Session
      const browserId =
        payload?.browserId || config?.browserId || activeBrowserId;

      // Automatic screenshot for visual-change nodes (NOW EVALUATED AFTER PAYLOAD)

      updateNodeState(nodeId, NODE_STATES.EXECUTING);
      setIsLoading(true);
      setApiStatus({
        state: "loading",
        message: `Executing ${NODE_LABELS[type] || type}...`,
        details: null,
      });

      const startTime = Date.now();
      let lastErrorDetails = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (executionAbortController.current?.signal.aborted) {
          updateNodeState(nodeId, NODE_STATES.SKIPPED);
          setIsLoading(false);
          return {
            success: false,
            skipped: true,
            error: "Execution cancelled",
          };
        }

        let bodyToSend;

        try {
          const builder = payloadBuilders[type];
          bodyToSend = builder ? builder(payload || {}) : payload || {};
          // Inject nodeId and runId for WebSocket tracking and Flight Recorder
          bodyToSend.nodeId = nodeId;

          // Inject persistent browserId if available and not overridden
          if (activeBrowserId && !bodyToSend.browserId) {
            bodyToSend.browserId = activeBrowserId;
          }

          // Persistent Browser: Allow reuse and prevent auto-close in Editor
          // EXCEPTION: If the user explicitly uses "Close Browser", let it close.
          if (type !== "close_browser") {
            bodyToSend.debugMode = true;
          }

          // Force headless: false in dev for visual debugging
          if (type === "launch_browser" && import.meta.env.DEV) {
            bodyToSend.headless = false;
          }

          if (payload?.runId) {
            bodyToSend.runId = payload.runId;
          }

          // Inject takeScreenshot if present in payload (Flight Recorder)
          if (payload?.takeScreenshot !== undefined) {
            bodyToSend.takeScreenshot = payload.takeScreenshot;
          }
        } catch (builderError) {
          console.error(`Error in payload builder for ${type}:`, builderError);
          const errorMsg = `Invalid payload: ${builderError.message}`;
          lastErrorDetails = {
            message: errorMsg,
            timestamp: new Date().toISOString(),
            attempt: attempt + 1,
          };
          updateNodeState(nodeId, NODE_STATES.ERROR, lastErrorDetails);
          setApiStatus({
            state: "error",
            message: errorMsg,
            details: lastErrorDetails,
          });
          setIsLoading(false);
          return { success: false, error: errorMsg };
        }

        // ONLY capture automatically if explicitly requested by the payload's takeScreenshot config
        const shouldAutoCapture =
          bodyToSend?.takeScreenshot === true && browserId;

        try {
          // NOTE: "Before" screenshot logic removed as per simplified requirements.

          // Inject AI Keys from settings
          // Inject AI Keys from settings

          // api.post handles headers like 'Content-Type' and AI keys automatically
          const result = await api.post(endpoint, bodyToSend, {
            signal: executionAbortController.current?.signal,
          });

          const duration = Date.now() - startTime;

          const instanceId =
            result.data?.browserId ??
            result.browserId ?? // Critical Fix: Action controller returns browserId at root
            result.instance?.id ??
            null;

          // UPDATE PERSISTENT SESSION
          if (instanceId && !activeBrowserId) {
            setActiveBrowserId(instanceId);
            localStorage.setItem("lastBrowserId", instanceId);
          }

          // ✨ OPTIMIZACIÓN: Actualización batch recursiva
          setNodes((nds) =>
            updateNodeRecursively(nds, nodeId, (node) => {
              const newConfig = {
                ...(node.data.configuration || {}),
                ...(payload || {}),
              };

              if (instanceId) {
                newConfig.instanceId = instanceId;
                newConfig.browserId = instanceId;
              }

              const isHealed = result?.healed === true;
              if (isHealed && result.newSelector) {
                console.log(
                  `[Auto-Patch] Applying AI healed selector to node ${nodeId}:`,
                  result.newSelector,
                );
                // Apply the fix permanently to the configuration
                newConfig.selector = result.newSelector;
                newConfig.isAI = true;
                newConfig.aiReasoning = result.reasoning;
              }

              const finalState = isHealed
                ? NODE_STATES.HEALED
                : NODE_STATES.SUCCESS;

              return {
                ...node,
                data: {
                  ...node.data,
                  configuration: newConfig,
                  executed: true,
                  state: finalState,
                  result,
                  executionTime: duration,
                },
                style: getNodeStyle(finalState, node.style),
              };
            }),
          );

          setApiStatus({
            state: "success",
            message: `✓ Execution successful in ${duration}ms`,
            details: result,
          });

          // SCREENSHOT: Logic for reuse or automatic capture
          let explicitScreenshot = null;
          if (
            result?.data?.screenshot &&
            typeof result.data.screenshot === "string"
          ) {
            explicitScreenshot = result.data.screenshot;
          } else if (
            result?.screenshot &&
            typeof result.screenshot === "string"
          ) {
            explicitScreenshot = result.screenshot;
          }

          if (explicitScreenshot) {
            // FIX: Check if it's a server path (Forensic) or Base64 (Legacy/Client)
            const isServerPath =
              explicitScreenshot.startsWith("storage/") ||
              explicitScreenshot.startsWith("http");

            // If it's pure Base64 without the prefix, add it so the image renders properly
            if (
              !isServerPath &&
              !explicitScreenshot.startsWith("data:") &&
              !explicitScreenshot.startsWith("blob:")
            ) {
              explicitScreenshot = `data:image/jpeg;base64,${explicitScreenshot}`;
            }

            if (isServerPath) {
              // Server-side path: Don't save to Client DB (atob fails). Just update reference.
              logger.info(
                "📸 Server-side screenshot detected, linking reference...",
              );
              updateNodeScreenshot(nodeId, "after", {
                url: explicitScreenshot,
                path: explicitScreenshot,
                timestamp: Date.now(),
              });
            } else {
              // Base64: Save to Client DB
              logger.info(
                "📸 Base64 Screenshot returned, saving to client DB...",
              );
              try {
                const screenshotMetadata =
                  await screenshotManager.saveScreenshot(
                    nodeId,
                    "after",
                    explicitScreenshot,
                  );
                updateNodeScreenshot(nodeId, "after", screenshotMetadata);
              } catch (err) {
                console.error("Failed to save base64 screenshot:", err);
              }
            }
          } else if (shouldAutoCapture) {
            updateNodeState(nodeId, NODE_STATES.CAPTURING_AFTER);
            await captureScreenshot({
              nodeId,
              timing: "after",
              browserId,
              nodeType: type,
            });
            updateNodeState(nodeId, NODE_STATES.SUCCESS);
          }

          setIsLoading(false);
          return { success: true, result, duration, instanceId };
        } catch (error) {
          const isNetworkError =
            error.name === "AbortError" ||
            error.message === "Failed to fetch" ||
            (error.message && error.message.includes("NetworkError"));

          if (
            isNetworkError &&
            attempt < MAX_RETRIES - 1 &&
            error.name !== "AbortError"
          ) {
            const delay = RETRY_BASE_MS * 2 ** attempt;
            updateNodeState(nodeId, NODE_STATES.WARNING, {
              message: `Network failure. Retrying...`,
              attempt: attempt + 1,
            });
            setApiStatus({
              state: "warning",
              message: `Network failure. Retrying in ${delay / 1000}s...`,
            });
            await sleep(delay);
            continue;
          }

          lastErrorDetails = {
            message: error.message,
            timestamp: new Date().toISOString(),
            attempts: attempt + 1,
            duration: Date.now() - startTime,
          };

          updateNodeState(nodeId, NODE_STATES.ERROR, lastErrorDetails);
          setApiStatus({
            state: "error",
            message: `✗ Failure: ${error.message}`,
            details: lastErrorDetails,
          });
          setIsLoading(false);

          return {
            success: false,
            error: error.message,
            details: lastErrorDetails,
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: "Max retries reached" };
    },
    [
      updateNodeState,
      captureScreenshot,
      updateNodeScreenshot,
      setNodes,
      activeBrowserId,
      setApiStatus,
      setIsLoading,
    ],
  );

  // ========================================
  // OPTIMIZACIÓN 9: ReactFlow callbacks optimizados
  // ========================================
  const onConnect = useCallback(
    (connection) => {
      // VALIDACIÓN 1: Prevenir conexiones duplicadas
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target,
      );

      if (isDuplicate) {
        logger.warn(
          "Duplicate connection rejected",
          connection,
          "useFlowManager",
        );
        setApiStatus({
          state: "warning",
          message: "⚠️ A connection already exists between these nodes",
        });
        return;
      }

      // VALIDACIÓN 2: Prevenir auto-conexiones
      if (connection.source === connection.target) {
        setApiStatus({
          state: "warning",
          message: "⚠️ Cannot connect a node to itself",
        });
        return;
      }

      // VALIDACIÓN 3: Validar ciclos antes de agregar edge
      if (wouldCreateCycle(connection, nodes, edges)) {
        logger.warn(
          "Cycle detected, connection rejected",
          connection,
          "useFlowManager",
        );
        setApiStatus({
          state: "warning",
          message: "⚠️ Cannot create a cycle in the flow",
        });
        return;
      }

      saveToHistory();

      // Agregar edge con ID único y label
      const edgeId = `edge-${connection.source}-${connection.target}`;

      setEdges((eds) => {
        // Find source node to determine color
        const sourceNode = nodes.find((n) => n.id === connection.source);
        let edgeStyle = { ...DEFAULT_EDGE_OPTIONS };

        if (sourceNode) {
          const type =
            sourceNode.data?.subType ||
            sourceNode.data?.type ||
            sourceNode.type;
          const config = NODE_TYPE_MAP[type];

          if (config && config.color && CATEGORY_STYLES[config.color]) {
            // Extract hex color from theme or map common names
            // Since theme uses Tailwind classes, we map manual colors or parse if needed.
            // Simpler: Map our internal color names to HEX values directly or use a helper.

            const colorMap = {
              blue: "#3b82f6", // Browser
              cyan: "#06b6d4", // DOM
              pink: "#ec4899", // User
              orange: "#f97316", // Sync
              rose: "#f43f5e", // Diagnostics
              emerald: "#10b981", // Network
              indigo: "#6366f1", // Session
              lime: "#84cc16", // Test
              yellow: "#eab308", // Files
              slate: "#64748b", // CLI
              purple: "#a855f7", // Logic
            };

            const strokeColor = colorMap[config.color] || "#ff8c32";

            edgeStyle = {
              ...edgeStyle,
              style: {
                ...edgeStyle.style,
                stroke: strokeColor,
              },
              markerEnd: {
                ...edgeStyle.markerEnd,
                color: strokeColor,
              },
            };
          }
        }

        return addEdge(
          {
            ...connection,
            id: edgeId,
            type: "custom", // Enforce CustomEdge
            animated: true,
            ...edgeStyle,
          },
          eds,
        );
      });

      logger.debug("Edge added", connection, "useFlowManager");

      setApiStatus({
        state: "success",
        message: "✓ Connection created successfully",
      });
    },
    [saveToHistory, nodes, edges, setEdges, setApiStatus],
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes) => {
      // Guardar historial si se está eliminando un edge
      const hasRemove = changes.some((change) => change.type === "remove");
      if (hasRemove) {
        saveToHistory();
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [saveToHistory, setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    // Prevent pane click from firing and closing the panel immediately
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    setSelectedNodeId(node.id);
  }, []);

  // ========================================
  // VALIDACIÓN LÓGICA (Incompatibilidades)
  // ========================================

  const validateLogicalConnection = useCallback((connection, currentNodes) => {
    const sourceNode = currentNodes.find((n) => n.id === connection.source);
    const targetNode = currentNodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return null;

    const sourceType = sourceNode.data?.subType || sourceNode.type;
    const targetType = targetNode.data?.subType || targetNode.type;

    // Rule: Type Text without Input Focus
    if (targetType === "type_text") {
      const validPredecessors = [
        "click",
        "open_url",
        "wait_visible",
        "wait_for_element",
      ];
      if (!validPredecessors.includes(sourceType)) {
        return {
          type: "warning",
          message:
            "⚠️ 'Type Text' generalmente requiere un 'Click' o 'Wait Visible' previo para asegurar foco.",
        };
      }
    }

    // Rule: Launch Browser -> Click (Direct connection warning)
    if (sourceType === "launch_browser" && targetType === "click") {
      return {
        type: "warning",
        message:
          "⚠️ Missing 'Open URL'? Connecting browser directly to a Click usually fails if no page is loaded.",
      };
    }

    return null;
  }, []);

  // ========================================
  // Resto de funciones (executeFlow, etc.)
  // Mantener la lógica existente con las optimizaciones aplicadas
  // ========================================

  /**
   * Validates the flow before execution
   * @returns {Array<string>} Array of error messages (empty if valid)
   */
  const validateFlowStructure = useCallback(
    (nodesToValidate, edgesToValidate) => {
      const errors = [];

      // Filtrar nodos puramente visuales/explicativos
      const ignoredTypes = ["guide", "note", "comment"];
      const executionNodes = nodesToValidate.filter(
        (n) =>
          !ignoredTypes.includes(n.type) &&
          !ignoredTypes.includes(n.data?.type),
      );

      // 1. Check for empty flow
      if (executionNodes.length === 0) {
        errors.push("The flow is empty. Add at least one execution node.");
        return errors;
      }

      // 2. Find Root Nodes (nodes with no incoming edges)
      const targets = new Set(edgesToValidate.map((e) => e.target));
      const roots = executionNodes.filter((n) => !targets.has(n.id));

      // 3. Rule: Mandatory Master Node (Launch Browser)
      // There must be exactly ONE root, and it must be 'launch_browser'
      if (roots.length === 0) {
        // Only loops?
        errors.push(
          "Invalid Flow: No starting point found (Cycle detected or no roots).",
        );
      } else if (roots.length > 1) {
        // Multiple disconnected starts allowed?
        // Requirement: "Browser Uniqueness: Only one active Launch Browser node per flow is allowed"
        // Requirement: "Todo flujo debe originarse en un nodo Launch Browser"
        // Strict V1: Only 1 start node allowed.
        errors.push(
          "Invalid Flow: Multiple starting points detected. Only one 'Launch Browser' is allowed as root.",
        );
      } else {
        const root = roots[0];
        const type = root.type || root.data?.type;
        if (type !== "launch_browser") {
          errors.push(
            "Invalid Start: The first node must be 'Launch Browser'.",
          );
        } else {
          // 4. Rule: Navigation Mandatory (Flow must eventually open a URL)
          const hasReachToOpenUrl = () => {
            const visited = new Set();
            const queue = [root.id];

            const isOrContainsOpenUrl = (node) => {
              if (!node) return false;
              if (node.type === "open_url" || node.data?.type === "open_url")
                return true;

              if (
                node.type === "component" ||
                node.data?.type === "component"
              ) {
                const subFlow = node.data?.subFlow;
                if (!subFlow || !subFlow.nodes || !subFlow.edges) return false;
                const internalInput = subFlow.nodes.find(
                  (n) => n.type === "input" || n.data?.type === "input",
                );
                if (!internalInput) return false;
                const internalEdges = subFlow.edges.filter(
                  (e) => e.source === internalInput.id,
                );
                const firstSteps = internalEdges.map((e) =>
                  subFlow.nodes.find((n) => n.id === e.target),
                );
                return firstSteps.some((step) => isOrContainsOpenUrl(step));
              }
              return false;
            };

            while (queue.length > 0) {
              const currentId = queue.shift();
              if (visited.has(currentId)) continue;
              visited.add(currentId);

              const node = nodesToValidate.find((n) => n.id === currentId);
              if (isOrContainsOpenUrl(node)) return true;

              // Add successors to queue
              const outgoing = edgesToValidate.filter(
                (e) => e.source === currentId,
              );
              for (const edge of outgoing) {
                queue.push(edge.target);
              }
            }
            return false;
          };

          if (!hasReachToOpenUrl()) {
            errors.push(
              "Invalid Flow: The flow must eventually include an 'Open URL' node to navigate.",
            );
          }
        }
      }

      // 5. Rule: Browser Uniqueness (Global check)
      const launchNodes = nodesToValidate.filter(
        (n) => n.type === "launch_browser" || n.data?.type === "launch_browser",
      );
      if (launchNodes.length > 1) {
        errors.push(
          "Invalid Flow: Multiple 'Launch Browser' nodes detected. Only one is permitted.",
        );
      }

      // 6. Enforce GraphValidator Check
      try {
        const result = GraphValidator.validate({
          nodes: nodesToValidate,
          edges: edgesToValidate,
        });
        if (!result.valid) {
          errors.push(...result.errors);
        }
      } catch (err) {
        console.error("GraphValidator execution failed", err);
      }

      return errors;
    },
    [],
  );

  /**
   * ATOMIC EXECUTION (Debug Mode)
   * Executes a single node with the specific configuration passed from the UI
   * @param {Object} nodeWithOverrides - The node object with current panel configuration
   */
  const executeSingleNode = useCallback(
    async (nodeWithOverrides) => {
      // 1. Validar que recibimos un objeto válido
      if (!nodeWithOverrides || !nodeWithOverrides.id) {
        console.error("executeSingleNode: Invalid Argument", nodeWithOverrides);
        toast.error("Error interal: Invalid node data for execution");
        return;
      }

      const { id, type, data } = nodeWithOverrides;
      const config = data?.configuration || {};

      // 2. Visual Feedback & State Update (Optimistic)
      updateNodeState(id, NODE_STATES.EXECUTING);

      // 3. Delegation to executeStep
      // executeStep(nodeId, type, payload, browserId, runId)
      // Note: runId is null for atomic debug to avoid polluting history or tracking as flow run
      const result = await executeStep(id, type, config);

      // 4. Feedback is handled inside executeStep (Socket events)
      return result;
    },
    [executeStep, updateNodeState, toast],
  );

  /**
   * Migrate Nodes (Recursive Sub-flow Creation)
   * Essential for portability: creates backing flows for component nodes with embedded subFlow data.
   */
  const migrateNodes = useCallback(
    async (nodesToMigrate, targetProjectId) => {
      // 🛡️ DEFENSIVE: Stop migration if project was deleted/switched
      if (!targetProjectId || targetProjectId !== currentProject?.id) {
        console.warn(
          "[FlowManager] Migration aborted: Project mismatch/missing",
        );
        return nodesToMigrate;
      }

      return await Promise.all(
        nodesToMigrate.map(async (node) => {
          // Re-check target within the map/loop for depth
          if (targetProjectId !== currentProject?.id) return node;

          if (
            (node.type === "component" || node.data?.type === "component") &&
            node.data?.subFlow &&
            node.data.subFlow.nodes // Must have actual nodes to migrate
          ) {
            console.log(
              `[FlowManager] 🧩 Migrating portable component: ${node.data.label}`,
            );

            try {
              // 1. Create the backing flow
              const response = await projectManager.createFlow(
                targetProjectId,
                node.data.subFlow.name || node.data.label || "Sub-flow",
              );
              const flowId = response.flow?.id || response.id;

              if (flowId) {
                // 2. Populate it (Recursive migration if sub-flows within sub-flows exist)
                const innerNodes = await migrateNodes(
                  node.data.subFlow.nodes,
                  targetProjectId,
                );

                await projectManager.updateFlow(targetProjectId, flowId, {
                  nodes: innerNodes,
                  edges: (node.data.subFlow.edges || []).map((e) => ({
                    ...e,
                    type: "custom",
                    animated: true,
                  })),
                });

                // 3. Return node linked to new flow, with persistent count
                return {
                  ...node,
                  data: {
                    ...node.data,
                    flowId,
                    nodeCount: node.data.subFlow.nodes.length,
                    hasInput: node.data.subFlow.nodes.some(
                      (n) => n.type === "input",
                    ),
                    hasOutput: node.data.subFlow.nodes.some(
                      (n) => n.type === "output",
                    ),
                    configuration: {
                      ...node.data.configuration,
                      flowId,
                    },
                    subFlow: undefined, // Clear template data
                  },
                };
              }
            } catch (err) {
              console.error("Failed to migrate component node:", err);
              return node;
            }
          }
          return node;
        }),
      );
    },
    [currentProject],
  );

  const loadStarterTemplate = useCallback(
    async (explicitProjectId = null) => {
      const pId = explicitProjectId || currentProject?.id;
      if (!pId) return;

      const toastId = toast.loading(
        t("common.loading_starter", "Initializing Hal-Test Tour..."),
      );

      try {
        // 1. Process Nodes and create sub-flows (Using migration logic)
        const processedNodes = await migrateNodes(STARTER_TEMPLATE.nodes, pId);

        // 2. Apply to state
        setNodes(processedNodes);
        setEdges(
          STARTER_TEMPLATE.edges.map((e) => ({
            ...e,
            type: "custom",
            animated: true,
          })),
        );

        setIsStarterTemplate(true);
        setHasUnsavedChanges(true);

        toast.dismiss(toastId);
        toast.success(
          t("common.starter_template_loaded", "Starter Template loaded!"),
        );

        // 3. Auto-center
        setTimeout(() => {
          // Double check project still exists after async toast
          if (currentProject?.id !== pId) return;

          console.log(
            "[FlowManager] 🚀 Loading starter template for project:",
            pId,
          );
          fitView({
            duration: 400,
            padding: { top: 0.1, bottom: 0.1, left: 0.02, right: 0.45 },
            includeNodes: true,
            minZoom: 0.1,
            maxZoom: 0.95,
          });
        }, 300);
      } catch (err) {
        toast.dismiss(toastId);
        console.error("[FlowManager] Error loading starter template:", err);
        toast.error("Failed to initialize tour.");
      }
    },
    [currentProject, setNodes, setEdges, t, toast, fitView, migrateNodes],
  );

  const executeFlow = useCallback(
    async (options = {}) => {
      const { stopOnError = true, keepOpen = true } = options; // Default keepOpen=true for Edit Mode

      // 1. Initialize Stats & Context
      const startTime = Date.now();
      const globalStats = {
        total: 0, // Will update dynamically
        successful: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      };

      // 0. Safety Check: currentProject must be loaded
      if (!currentProject) {
        const errorMsg = t(
          "common.error_no_project",
          "No project loaded. Please wait for the project to load or refresh.",
        );
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Execution State
      executionAbortController.current = new AbortController();
      resetNodeStates();

      // VALIDATION STEP
      // In partial execution (options.nodes provided), we might skip full validation?
      // User requirement says "Todo flujo debe originarse...", implying full flow validation.
      // But if user selects 3 nodes to "Run Selection", do we enforce Launch Browser?
      // Probably not for partial runs (debugging).
      // Let's enforce ONLY for full runs (when options.nodes is undefined)

      if (!options.nodes) {
        const validationErrors = validateFlowStructure(nodes, edges);
        if (validationErrors.length > 0) {
          const errorMsg = validationErrors[0]; // Show first error
          // toast.error(errorMsg); // REMOVED: Managed by App.jsx to avoid overlap
          setApiStatus({
            state: "error",
            message: errorMsg,
            details: { errors: validationErrors },
          });
          return { success: false, error: errorMsg };
        }
      }

      // Shared Runtime Context (Browser Session, Variables)
      const flowContext = {}; // NEW: Shared context for data propagation
      let browserId = activeBrowserId || null; // Start with active session if available

      let runId = null;

      // --- FLIGHT RECORDER: Start Run ---
      // (Only create run if NOT a partial execution or if desired)
      try {
        // If we have a runId passed in options, use it? Usually it's new.
        if (!options.runId) {
          const projectId = currentProject?.id;
          if (!projectId) throw new Error("Current Project ID is missing.");

          const { runId: newRunId } = await projectManager.createRun(
            projectId,
            currentFlowId,
            {
              // Capture Flow Snapshot for Forensic Replay
              nodes: nodes.map((n) => ({
                ...n,
                data: { ...n.data, result: undefined, replayData: undefined },
              })), // Clean state
              edges,
              flowName: currentProject?.flows?.find(
                (f) => f.id === currentFlowId,
              )?.name,
            },
          );
          runId = newRunId;
          logger.info(`Run started: ${runId}`, null, "useFlowManager");
        }
      } catch (e) {
        logger.error("Failed to init run", e);
      }
      // --------------------------------

      setApiStatus({ state: "loading", message: "Preparing execution..." });

      // Recursive Execution Function (Path-Aware Graph Traversal)
      const executeGraph = async (graphNodes, graphEdges, depth = 0) => {
        if (depth > 10) throw new Error("Max recursion depth exceeded");

        // Find root nodes if depth 0 and graphNodes is just the whole list
        let startNodes = graphNodes;
        if (depth === 0 && graphNodes.length > 1) {
          const incomingCount = new Map();
          graphNodes.forEach((n) => incomingCount.set(n.id, 0));
          graphEdges.forEach((e) => {
            if (incomingCount.has(e.target)) {
              incomingCount.set(e.target, incomingCount.get(e.target) + 1);
            }
          });
          startNodes = graphNodes.filter((n) => incomingCount.get(n.id) === 0);

          // Fallback if everyone has an incoming edge (cycle)
          if (startNodes.length === 0 && graphNodes.length > 0) {
            startNodes = [graphNodes[0]];
          }
        }

        const internalExecuted = new Set();
        const queue = [...startNodes];
        globalStats.total = graphNodes.length; // Update total estimate
        const healedNodes = []; // Track AI repairs: [{ nodeId, newSelector }]

        let lastResult = { success: true }; // To bubble up

        while (queue.length > 0) {
          if (executionAbortController.current?.signal.aborted) break;

          const node = queue.shift();
          if (internalExecuted.has(node.id)) continue;
          internalExecuted.add(node.id);

          let result = { success: true };
          lastResult = result; // Important: update bubble-up target
          console.log(
            `[FlowManager] -> Executing: "${node.id}" (${node.type})`,
          );

          try {
            // A. Execute Node
            if (node.type === "component" || node.data?.type === "component") {
              const { flowId } = node.data || {};
              if (flowId) {
                setApiStatus({
                  state: "loading",
                  message: `Entering component: ${node.data.label || "Sub-flow"}...`,
                });
                const subFlow = await projectManager.getFlow(
                  currentProject.id,
                  flowId,
                );
                if (subFlow?.nodes?.length > 0) {
                  updateNodeState(node.id, NODE_STATES.EXECUTING);
                  const subResult = await executeGraph(
                    subFlow.nodes,
                    subFlow.edges,
                    depth + 1,
                  );
                  result = subResult || { success: true };
                  updateNodeState(
                    node.id,
                    result.success ? NODE_STATES.SUCCESS : NODE_STATES.ERROR,
                  );
                  if (!result.success && stopOnError) {
                    // Prepend current component to the dive path
                    const divePath = result.divePath || [];
                    return {
                      ...result,
                      divePath: [node.id, ...divePath],
                      healedNodes, // Return what we found so far
                    };
                  }

                  // If sub-flow had healed nodes, merge them
                  if (result.healedNodes?.length > 0) {
                    healedNodes.push(...result.healedNodes);
                  }
                }
              }
            } else if (node.type === "loop" || node.data?.type === "loop") {
              const { flowId } = node.data || {};
              const config = node.data?.configuration || {};

              updateNodeState(node.id, NODE_STATES.EXECUTING);

              let finished = false;
              let loopResult = { success: true };

              // LOOP ORCHESTRATION: The frontend runner becomes the loop manager
              while (
                !finished &&
                !executionAbortController.current?.signal.aborted
              ) {
                // 1. Ask backend for next iteration state
                const resolvedConfig = resolveVariables(config, flowContext);
                const action = {
                  nodeId: node.id,
                  type: "loop",
                  payload: { ...resolvedConfig, browserId, runId },
                };

                const stepResult = await executeStep(action, options);
                if (!stepResult.success) {
                  loopResult = stepResult;
                  finished = true;
                  break;
                }

                // Robust path detection
                const path = String(
                  stepResult.path ||
                    stepResult.result?.path ||
                    stepResult.result?.data?.path ||
                    "",
                )
                  .trim()
                  .toLowerCase();

                if (
                  path === "completed" ||
                  path === "done" ||
                  path === "finish"
                ) {
                  finished = true;
                  break;
                }

                // 2. If path is "body", execute the sub-flow or follow cables
                // In Composition (Dive In) mode, we expect a flowId
                if (flowId && (path === "body" || path === "iteration")) {
                  setApiStatus({
                    state: "loading",
                    message: `Loop Iteration ${stepResult.result?.data?.index || ""}...`,
                  });

                  const subFlow = await projectManager.getFlow(
                    currentProject.id,
                    flowId,
                  );
                  if (subFlow?.nodes?.length > 0) {
                    const subResult = await executeGraph(
                      subFlow.nodes,
                      subFlow.edges,
                      depth + 1,
                    );
                    if (!subResult.success && stopOnError) {
                      loopResult = subResult;
                      finished = true;
                      break;
                    }
                    // Merge healed nodes
                    if (subResult.healedNodes?.length > 0) {
                      healedNodes.push(...subResult.healedNodes);
                    }
                  } else {
                    // Protection against empty loops causing infinite busy states
                    finished = true;
                  }
                } else if (!flowId && path === "body") {
                  // Compatibility with Branching mode (no dive-in)
                  // In this mode, executeGraph won't repeat automatically because it follows edges.
                  // But for consistency with the while loop, we break and let the main graph continue.
                  result = stepResult;
                  finished = true;
                } else {
                  finished = true;
                }
              }

              result = loopResult;
              updateNodeState(
                node.id,
                result.success ? NODE_STATES.SUCCESS : NODE_STATES.ERROR,
              );
            } else if (
              node.type !== "input" &&
              node.type !== "output" &&
              node.type !== "annotation"
            ) {
              const resolvedConfig = resolveVariables(
                node.data?.configuration || {},
                flowContext,
              );
              const action = {
                nodeId: node.id,
                type: node.data?.type || node.type,
                // Use a shorter timeout (8s) for faster failure detection
                payload: {
                  ...resolvedConfig,
                  browserId,
                  runId,
                  timeout: resolvedConfig.timeout || 8000,
                },
              };
              setApiStatus({
                state: "loading",
                message: `Executing: ${node.data?.label || node.type}`,
              });
              result = await executeStep(action, options);

              if (result.skipped) {
                globalStats.skipped++;
              } else if (result.success) {
                globalStats.successful++;
                if (result.instanceId) {
                  browserId = result.instanceId;
                  flowContext.browserId = result.instanceId;
                }
                const slug = (node.data?.label || node.id)
                  .toLowerCase()
                  .replace(/\s+/g, "_");
                flowContext[node.id] = result.result || result;
                flowContext[slug] = result.result || result;

                // Capture AI Healing for auto-patching
                if (result.healed && result.newSelector) {
                  healedNodes.push({
                    nodeId: node.id,
                    newSelector: result.newSelector,
                  });
                }
              } else {
                globalStats.failed++;
                if (stopOnError) {
                  return {
                    success: false,
                    error: result.error || "Action failed",
                    failedNodeId: node.id,
                    divePath: [],
                  };
                }
              }
            } else if (node.type === "output") {
              result = {
                success: true,
                path:
                  node.data?.configuration?.path || node.data?.path || node.id,
              };
            }

            // B. Enqueue Children
            let nextEdges = graphEdges.filter((e) => e.source === node.id);
            // FIX: Robust path extraction including .data layer, targetPath from backend
            const path = String(
              result?.path ||
                result?.result?.path ||
                result?.result?.data?.path ||
                result?.result?.data?.targetPath ||
                result?.result?.targetPath ||
                "",
            )
              .trim()
              .toLowerCase();

            // 🛡️ Robust type detection: check if it's a known branching node
            const nodeKey = String(
              node.data?.subType || node.data?.type || node.type || "",
            ).toLowerCase();
            const isBranchingNode =
              nodeKey === "switch" ||
              nodeKey === "conditional" ||
              nodeKey === "backend_js";

            // 🔀 HANDLE LOGIC BRANCHING
            const nextNodes = [];

            // 🛡️ Pre-reset all outgoing edges of this node!
            nextEdges.forEach((e) => updateEdgeStatus(e.id, "default", false));

            if (path && path !== "undefined" && path !== "") {
              console.log(
                `[FlowManager] 🔀 Branching Node "${node.id}" (${nodeKey}) winner path: "${path}"`,
              );
              let filtered = nextEdges.filter(
                (e) => String(e.sourceHandle || "").toLowerCase() === path,
              );

              // 🛡️ Final strict enforcement for branching nodes only
              if (isBranchingNode) {
                if (filtered.length === 0 && nextEdges.length > 0) {
                  console.warn(
                    `[FlowManager] 🛑 No matching edge for path "${path}" on node "${node.id}". Stopping branch.`,
                  );
                  updateNodeState(node.id, NODE_STATES.ERROR, {
                    message: `Ruta no encontrada: ${path}`,
                  });
                  nextEdges = [];
                } else {
                  nextEdges = filtered;
                }
              } else if (filtered.length > 0) {
                // For non-branching nodes, follow the path if it exists
                nextEdges = filtered;
              }
            } else if (isBranchingNode && nextEdges.length > 0) {
              // 🛡️ SAFETY: If we should branch but have no path, STOP instead of following all.
              console.warn(
                `[FlowManager] ⚠️ Node "${node.id}" requires branching but NO path was resolved. Stopping branch to prevent multi-run.`,
              );
              updateNodeState(node.id, NODE_STATES.ERROR, {
                message: "No se pudo resolver la ruta de ramificación",
              });
              nextEdges = [];
            }

            // 🌟 HIGHLIGHT ONLY THE WINNER EDGES
            nextEdges.forEach((e) =>
              updateEdgeStatus(e.id, NODE_STATES.SUCCESS, true),
            );

            nextEdges.forEach((e) => {
              const targetNode = graphNodes.find((n) => n.id === e.target);
              if (targetNode) nextNodes.push(targetNode);
            });

            console.log(
              `[FlowManager] -> Enqueuing ${nextNodes.length} children for "${node.id}"`,
            );
            queue.push(...nextNodes);
          } catch (err) {
            console.error(`[FlowManager] Error in node "${node.id}":`, err);
            globalStats.failed++;
            updateNodeState(node.id, NODE_STATES.ERROR, err);
            if (stopOnError) {
              return {
                success: false,
                error: err.message,
                failedNodeId: node.id,
                divePath: [],
              };
            }
          }
        }
        return { ...lastResult, healedNodes };
      };

      // 2. Start Execution
      let executionResult = { success: true };
      try {
        // Use nodes from options (fresh from App) or state nodes (may be stale if called immediately after type)
        const nodesToExecute = options.nodes || nodes;
        executionResult = await executeGraph(nodesToExecute, edges, 0);
      } catch (error) {
        console.error("Execution error:", error);
        globalStats.failed++;
        executionResult = { success: false, error: error.message };
      } finally {
        // 3. Cleanup & Finalize
        // Only close if keepOpen is FALSE
        if (browserId && !keepOpen) {
          try {
            await api.post("/actions/close_browser", { browserId });
            // If we closed the active one (shouldn't happen if keepOpen is true, but just in case)
            if (browserId === activeBrowserId) setActiveBrowserId(null);
          } catch (e) {
            console.warn("Cleanup failed", e);
          }
        }

        if (runId) {
          await api
            .post(`/runs/${runId}/end`, {
              status: globalStats.failed === 0 ? "completed" : "failed",
            })
            .catch((e) => console.warn("End run log failed", e));
        }

        globalStats.duration = Date.now() - startTime;
        setExecutionStats(globalStats);

        const alldone = globalStats.failed === 0;
        setApiStatus({
          state: alldone ? "success" : "warning",
          message: alldone
            ? `✓ Completed in ${(globalStats.duration / 1000).toFixed(2)}s`
            : `⚠ Finished with errors`,
          details: globalStats,
        });
      }

      return {
        success: globalStats.failed === 0,
        stats: globalStats,
        browserId,
        failedNodeId: executionResult?.failedNodeId,
        divePath: executionResult?.divePath,
        healedNodes: executionResult?.healedNodes || [],
        error: executionResult?.error,
      };
    },
    [
      nodes,
      edges,
      currentProject,
      currentFlowId,
      executeStep,
      resetNodeStates,
      activeBrowserId,
      updateNodeState,
      updateEdgeStatus,
      validateFlowStructure,
      t,
      toast,
      setApiStatus,
      setExecutionStats,
      setActiveBrowserId,
    ],
  );

  /**
   * Manually stop the persistent session
   */
  const stopSession = useCallback(async () => {
    if (!activeBrowserId) return;

    try {
      setApiStatus({ state: "loading", message: "Stopping session..." });
      await api.post("/actions/close_browser", { browserId: activeBrowserId });
      setActiveBrowserId(null);
      setApiStatus({ state: "idle", message: "Session stopped" });
      toast.success("Browser session closed");
    } catch (error) {
      console.error("Failed to stop session:", error);
      toast.error("Failed to close browser session");
    }
  }, [activeBrowserId, setApiStatus, toast, setActiveBrowserId]);

  // ========================================
  // Export and Import Flow Functions
  // ========================================

  /**
   * Exports the current flow as a downloadable JSON file
   * @returns {object} The exported flow data
   */
  /**
   * Exports the current flow as a downloadable JSON file (Enterprise V2)
   * Fetches the full package including dependencies and sanitized secrets from backend.
   */
  const exportFlow = useCallback(async () => {
    // Determine context IDs from hook arguments
    const flowId = currentFlowId;
    const projectId = currentProject?.id;

    try {
      if (!flowId || !projectId) {
        toast.error("Error: Cannot export flow without ID context");
        console.error("Missing context:", { flowId, projectId });
        return;
      }

      setApiStatus({
        state: "loading",
        message: "Preparing Enterprise Package...",
      });

      // Fetch the full export package from backend
      const flowData = await api.get(
        `/projects/${projectId}/flows/${flowId}/export`,
      );

      // Download Trigger
      const blob = new Blob([JSON.stringify(flowData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Use flow name in filename, sanitized
      const safeName = (flowData.flow.name || "flow")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      link.download = `${safeName}_v2.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setApiStatus({
        state: "success",
        message: "✓ Export complete (V2 Package)",
      });

      return flowData;
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(`Export failed: ${error.message}`);
    }
  }, [currentFlowId, currentProject, setApiStatus, toast]);

  /**
   * Enhanced import function supporting multiple modes
   * @param {Object} options - Import options
   * @param {string} options.mode - Import mode: 'file', 'directory', 'directory-pom'
   * @param {string} options.content - File content (for file mode)
   * @param {string} options.filename - Filename (for file mode)
   * @param {string} options.framework - Detected framework (optional)
   * @param {Object} options.result - Import result from backend (for directory modes)
   * @returns {Promise<void>}
   */
  const importFlow = useCallback(
    async (options = {}) => {
      const { mode = "file", content, filename, framework, result } = options;

      try {
        // Handle JSON flow import (legacy)
        if (filename?.endsWith(".json")) {
          const flowData = JSON.parse(content);

          // Validate flow data structure
          if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
            throw new Error("Invalid file format: missing nodes array");
          }

          if (!flowData.edges || !Array.isArray(flowData.edges)) {
            throw new Error("Invalid file format: missing edges array");
          }

          saveToHistory();
          setNodes(flowData.nodes);
          setEdges(flowData.edges);

          setExecutionStats({
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
          });

          setApiStatus({
            state: "success",
            message: `✓ Flow imported: ${flowData.nodes.length} nodes, ${flowData.edges.length} connections`,
            details: {
              version: flowData.version,
              timestamp: flowData.timestamp,
            },
          });

          return;
        }

        // Handle directory import result
        if (mode === "directory" || mode === "directory-pom") {
          if (!result || !result.flows || result.flows.length === 0) {
            throw new Error("No flows were generated from the directory");
          }

          // For now, merge all flows into a single canvas
          // In the future, we could create a flow selector UI
          const allNodes = [];
          const allEdges = [];
          let currentY = 100;
          const flowGap = 300;

          result.flows.forEach((flowData, flowIndex) => {
            const flow = flowData.flow;
            const startX = 100 + (flowIndex % 3) * 400; // Arrange flows in columns
            const startY = currentY + Math.floor(flowIndex / 3) * flowGap;
            let lastNodeId = null;

            flow.forEach((action, actionIndex) => {
              const nodeId = generateNodeId();
              const nodeType = action.action;
              const config = { ...action };
              const label = createExecutedLabel({
                type: nodeType,
                payload: config,
              });

              const newNode = {
                id: nodeId,
                type: "custom",
                position: { x: startX, y: startY + actionIndex * 150 },
                data: {
                  label,
                  type: nodeType,
                  configuration: config,
                  state: NODE_STATES.DEFAULT,
                },
                style: getNodeStyle(NODE_STATES.DEFAULT),
                sourcePosition: "bottom",
                targetPosition: "top",
              };

              allNodes.push(newNode);

              if (lastNodeId) {
                allEdges.push({
                  id: `e_${lastNodeId}_${nodeId}`,
                  source: lastNodeId,
                  target: nodeId,
                  ...DEFAULT_EDGE_OPTIONS,
                });
              }

              lastNodeId = nodeId;
            });
          });

          saveToHistory();
          setNodes(allNodes);
          setEdges(allEdges);

          setApiStatus({
            state: "success",
            message: `✓ ${result.flows.length} flows imported (${allNodes.length} total nodes)`,
            details: {
              mode,
              stats: result.stats,
            },
          });

          return;
        }

        // Handle single file import with conversion
        if (mode === "file" && content) {
          setApiStatus({
            state: "loading",
            message: "Analyzing test file...",
          });

          // 1. Analyze the file (if framework not provided)
          let detectedFramework = framework;
          if (!detectedFramework) {
            const analysis = await api.post("/import/analyze", {
              content,
              filename,
            });

            if (!analysis.detected) {
              throw new Error("Could not detect test framework.");
            }

            detectedFramework = analysis.framework;
          }

          setApiStatus({
            state: "loading",
            message: `Framework detected: ${detectedFramework}. Converting...`,
          });

          // 2. Convert to Flow
          const conversion = await api.post("/import/convert", {
            content,
            framework: detectedFramework,
          });

          if (
            !conversion.success ||
            !conversion.flows ||
            conversion.flows.length === 0
          ) {
            throw new Error("Could not generate flows from the file.");
          }

          // Take the first flow
          const generatedFlow = conversion.flows[0].flow;
          const newNodes = [];
          const newEdges = [];
          let lastNodeId = null;

          const startX = 100;
          const startY = 100;
          const gapY = 150;

          generatedFlow.forEach((action, index) => {
            const nodeId = generateNodeId();
            const nodeType = action.action;
            const config = { ...action };
            const label = createExecutedLabel({
              type: nodeType,
              payload: config,
            });

            const newNode = {
              id: nodeId,
              type: "custom",
              position: { x: startX, y: startY + index * gapY },
              data: {
                label,
                type: nodeType,
                configuration: config,
                state: NODE_STATES.DEFAULT,
              },
              style: getNodeStyle(NODE_STATES.DEFAULT),
              sourcePosition: "bottom",
              targetPosition: "top",
            };

            newNodes.push(newNode);

            if (lastNodeId) {
              newEdges.push({
                id: `e_${lastNodeId}_${nodeId}`,
                source: lastNodeId,
                target: nodeId,
                ...DEFAULT_EDGE_OPTIONS,
              });
            }

            lastNodeId = nodeId;
          });

          saveToHistory();
          setNodes(newNodes);
          setEdges(newEdges);

          setApiStatus({
            state: "success",
            message: `✓ Import completed: ${newNodes.length} steps generated`,
            details: {
              framework: detectedFramework,
              flowName: conversion.flows[0].meta?.name || filename,
            },
          });
        }
      } catch (error) {
        console.error("Error al importar:", error);
        setApiStatus({
          state: "error",
          message: `✗ Error importing: ${error.message}`,
        });
        throw error;
      }
    },
    [saveToHistory, setNodes, setEdges, setApiStatus, setExecutionStats],
  );

  // ========================================
  // UNGROUPING LOGIC (Inverse of groupNodes)
  // ========================================

  const ungroupNodes = useCallback(
    async (componentNodeId) => {
      const componentNode = nodesRef.current.find(
        (n) => n.id === componentNodeId,
      );

      if (
        !componentNode ||
        (componentNode.data?.type !== "component" &&
          componentNode.data?.type !== "loop")
      ) {
        return; // Safety check
      }

      console.log(`[Ungroup] Ungrouping component: ${componentNodeId}`);
      saveToHistory();

      const subFlow = componentNode.data.subFlow || { nodes: [], edges: [] };
      const { nodes: subNodes = [], edges: subEdges = [] } = subFlow;

      // 1. Identify Boundary Nodes
      const inputNode = subNodes.find((n) => n.type === "input");
      const outputNode = subNodes.find((n) => n.type === "output");

      // 2. Extract Real Nodes & Calculate New Positions
      const offsetX = componentNode.position.x;
      const offsetY = componentNode.position.y;

      const restoredNodes = subNodes
        .filter((n) => n.type !== "input" && n.type !== "output")
        .map((n) => ({
          ...n,
          data: { ...n.data }, // Deep copy data to avoid ref issues
          position: {
            x: n.position.x + offsetX,
            y: n.position.y + offsetY,
          },
          selected: true, // Auto-select extracted nodes
          parentNode: undefined,
        }));

      // 3. Prepare Edges (Restoration)
      const internalEdges = subEdges.filter((e) => {
        // Keep edge only if neither source nor target are boundary nodes
        const sourceIsBoundary =
          (inputNode && e.source === inputNode.id) ||
          (outputNode && e.source === outputNode.id);
        const targetIsBoundary =
          (inputNode && e.target === inputNode.id) ||
          (outputNode && e.target === outputNode.id);
        return !sourceIsBoundary && !targetIsBoundary;
      });

      // 4. Trace & Rewire External Connections
      let restoredExternalEdges = [];

      // A) Rewire INCOMING (Main -> Component)
      // Original: MainSrc -> Component
      // Goal: MainSrc -> InternalTarget
      // Path: MainSrc -> Component [maps to] InputNode -> InternalTarget
      const incomingToComponent = edgesRef.current.filter(
        (e) => e.target === componentNodeId,
      );

      incomingToComponent.forEach((mainEdge) => {
        // Find where the InputNode directed this flow inside the component
        // Note: For V1 assume single input flow or broadcast?
        // Let's find all edges starting from InputNode inside
        if (inputNode) {
          const edgesFromInput = subEdges.filter(
            (e) => e.source === inputNode.id,
          );
          edgesFromInput.forEach((innerEdge) => {
            // Reconnect Main Source to Internal Target
            restoredExternalEdges.push({
              id: `e_${mainEdge.source}-${innerEdge.target}`,
              source: mainEdge.source,
              target: innerEdge.target,
              sourceHandle: mainEdge.sourceHandle,
              targetHandle: innerEdge.targetHandle,
              type: "default",
              animated: true,
            });
          });
        }
      });

      // B) Rewire OUTGOING (Component -> Main)
      // Original: Component -> MainTgt
      // Goal: InternalSrc -> MainTgt
      // Path: InternalSrc -> OutputNode [maps to] Component -> MainTgt
      const outgoingFromComponent = edgesRef.current.filter(
        (e) => e.source === componentNodeId,
      );

      outgoingFromComponent.forEach((mainEdge) => {
        // Find which nodes pointed to OutputNode inside
        if (outputNode) {
          const edgesToOutput = subEdges.filter(
            (e) => e.target === outputNode.id,
          );
          edgesToOutput.forEach((innerEdge) => {
            restoredExternalEdges.push({
              id: `e_${innerEdge.source}-${mainEdge.target}`,
              source: innerEdge.source,
              target: mainEdge.target,
              sourceHandle: innerEdge.sourceHandle,
              targetHandle: innerEdge.targetHandle,
              type: "default",
              animated: true,
            });
          });
        }
      });

      // 5. Update Global State
      // Remove Component Node
      // Add Restored Nodes
      setNodes((currentNodes) => {
        const remainingNodes = currentNodes.filter(
          (n) => n.id !== componentNodeId,
        );
        return [...remainingNodes, ...restoredNodes];
      });

      // Remove Old Edges (connected to component)
      // Add Internal Restored Edges
      // Add Rewired External Edges
      setEdges((currentEdges) => {
        const remainingEdges = currentEdges.filter(
          (e) => e.source !== componentNodeId && e.target !== componentNodeId,
        );
        return [...remainingEdges, ...internalEdges, ...restoredExternalEdges];
      });

      // Persist immediately
      await saveFlow();

      toast.success(t("groups.ungrouped", "Group dissolved successfully"));
    },
    [setNodes, setEdges, saveToHistory, t, toast, saveFlow],
  );

  // Exportar funciones y estados
  return {
    nodes,
    edges,
    // nodes, edges, selectedAction removed (duplicates)
    viewStack,
    enterComponent,
    exitComponent,
    history,
    isLoading,
    apiStatus,
    executionStats,
    autoSaveEnabled,

    setNodes,
    setEdges,
    selectedNodeId,
    selectedAction,
    setSelectedNodeId,
    setAutoSaveEnabled,

    addNode,
    deleteNode,
    updateNodeConfiguration,
    updateNodeState,
    confirmGhostNode, // New
    addGhostNode, // New

    executeStep,
    executeFlow,

    onConnect,
    onNodesChange,
    onEdgesChange,
    onNodeClick,

    saveFlow,
    exportFlow,
    importFlow,
    resetNodeStates,

    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,

    clipboard,
    // Clipboard Actions
    copyElements: useCallback(() => {
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      const selectedEdges = edgesRef.current.filter((e) => e.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return 0;

      setClipboard({
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(selectedEdges)),
      });

      return selectedNodes.length + selectedEdges.length;
    }, [setClipboard]),

    cutElements: useCallback(() => {
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      const selectedEdges = edgesRef.current.filter((e) => e.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return 0;

      // Copy first
      setClipboard({
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(selectedEdges)),
      });

      // Then delete
      saveToHistory();
      const nodeIdsToRemove = new Set(selectedNodes.map((n) => n.id));
      const edgeIdsToRemove = new Set(selectedEdges.map((e) => e.id));

      setNodes((nds) => nds.filter((n) => !nodeIdsToRemove.has(n.id)));
      setEdges((eds) =>
        eds.filter(
          (e) =>
            !edgeIdsToRemove.has(e.id) &&
            !nodeIdsToRemove.has(e.source) &&
            !nodeIdsToRemove.has(e.target),
        ),
      );

      return selectedNodes.length + selectedEdges.length;
    }, [saveToHistory, setNodes, setEdges]),

    pasteElements: useCallback(() => {
      if (clipboard.nodes.length === 0 && clipboard.edges.length === 0)
        return 0;

      saveToHistory();

      // Mapping old IDs to new IDs
      const idMapping = {};
      const newNodes = clipboard.nodes.map((node) => {
        const newId = generateNodeId();
        idMapping[node.id] = newId;

        return {
          ...node,
          id: newId,
          selected: true,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
        };
      });

      const newEdges = clipboard.edges
        .map((edge) => {
          const newSource = idMapping[edge.source];
          const newTarget = idMapping[edge.target];

          // Only keep edges where BOTH source and target were pasted
          if (newSource && newTarget) {
            return {
              ...edge,
              id: `edge-${newSource}-${newTarget}`,
              source: newSource,
              target: newTarget,
              selected: true,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Deselect existing
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

      // Add new
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      return newNodes.length + newEdges.length;
    }, [clipboard, saveToHistory, setNodes, setEdges]),

    clearFlow: useCallback(() => {
      saveToHistory();
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setApiStatus({ state: "idle", message: "Canvas cleared" });
    }, [saveToHistory, setNodes, setEdges, setSelectedNodeId, setApiStatus]),

    replayRun: useCallback(
      (runData) => {
        if (!runData || !runData.steps) {
          console.warn("Invalid run data for replay");
          return;
        }

        // 1. Restore Flow Snapshot (if available and valid)
        if (runData.flow_snapshot) {
          try {
            const snapshot = JSON.parse(runData.flow_snapshot);
            if (snapshot.nodes && snapshot.edges) {
              logger.info(
                "Restoring Flow Snapshot from History...",
                null,
                "useFlowManager",
              );
              // Update canvas structure first
              setEdges(snapshot.edges);

              // Map status to restored nodes
              const restoredNodes = snapshot.nodes;
              const stepMap = new Map();
              runData.steps.forEach((step) => {
                stepMap.set(step.node_id, step);
              });

              const updatedNodes = restoredNodes.map((node) => {
                const step = stepMap.get(node.id);
                if (!step) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      state: "idle",
                      executed: false,
                      result: null,
                      executionTime: null,
                      isHistorical: false,
                      historicalStatus: null,
                      replayData: null,
                    },
                    style: getNodeStyle("idle"),
                  };
                }

                let nodeState = "idle";
                if (step.status === "success") nodeState = "success";
                else if (step.status === "failed") nodeState = "error";
                else if (step.status === "running") nodeState = "running";

                return {
                  ...node,
                  data: {
                    ...node.data,
                    state: nodeState,
                    executed: true,
                    result: {
                      status: step.status,
                      error: step.error,
                      screenshot: step.screenshot_path,
                      input: step.input_data,
                      output: step.output_data,
                      duration: step.duration_ms,
                    },
                    historicalStatus: step.status,
                    replayData: step,
                    isHistorical: true,
                  },
                  style: getNodeStyle(nodeState),
                };
              });

              setNodes(updatedNodes);
              return; // Exit early as we handled everything via snapshot
            }
          } catch (e) {
            logger.error("Failed to restore flow snapshot", e);
          }
        }

        setNodes((nds) =>
          nds.map((node) => {
            const step = runData.steps.find((s) => s.node_id === node.id);

            if (!step) {
              return {
                ...node,
                data: {
                  ...node.data,
                  state: NODE_STATES.IDLE,
                  executed: false,
                  result: null,
                  executionTime: null,
                  isHistorical: false,
                  historicalStatus: null, // Reset status
                  replayData: null,
                },
                style: getNodeStyle(NODE_STATES.IDLE),
              };
            }

            let nodeState = NODE_STATES.IDLE;
            if (step.status === "success") nodeState = NODE_STATES.SUCCESS;
            else if (step.status === "failed") nodeState = NODE_STATES.ERROR;
            else if (step.status === "skipped") nodeState = NODE_STATES.SKIPPED;
            else if (step.status === "running")
              nodeState = NODE_STATES.EXECUTING;

            return {
              ...node,
              data: {
                ...node.data,
                state: nodeState, // VISUAL FEEDBACK: Main color driver
                historicalStatus: step.status, // REACTIVE UI PROP
                executed: true,
                executionTime: step.duration_ms,
                result: {
                  // Legacy support for basic view
                  output: step.output_data,
                  input: step.input_data,
                  error: step.error,
                  screenshot: step.screenshot_path,
                  durationMs: step.duration_ms,
                  timestamp: step.created_at || runData.started_at,
                },
                execution_data: step, // Raw step data
                replayData: {
                  // NEW: Dedicated Historical Data Container
                  runId: runData.id,
                  nodeId: node.id,
                  status: step.status,
                  duration_ms: step.duration_ms,
                  screenshot_path: step.screenshot_path,
                  error: step.error,
                  timestamp: step.created_at,
                },
                isHistorical: true,
              },
              style: getNodeStyle(nodeState),
            };
          }),
        );
        toast.info(
          `Showing execution from ${new Date(runData.started_at).toLocaleTimeString()}`,
        );
      },
      [setNodes, setEdges, toast],
    ),

    duplicateElements: useCallback(() => {
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      const selectedEdges = edgesRef.current.filter((e) => e.selected);

      if (selectedNodes.length === 0) return 0;

      saveToHistory();

      const idMapping = {};
      const newNodes = selectedNodes.map((node) => {
        const newId = generateNodeId();
        idMapping[node.id] = newId;

        return {
          ...node,
          id: newId,
          selected: true,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: {
            ...node.data,
            label: `${node.data.label} (copy)`,
          },
        };
      });

      const newEdges = selectedEdges
        .map((edge) => {
          const newSource = idMapping[edge.source];
          const newTarget = idMapping[edge.target];

          if (newSource && newTarget) {
            return {
              ...edge,
              id: `edge-${newSource}-${newTarget}`,
              source: newSource,
              target: newTarget,
              selected: true,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Deselect existing
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

      // Add new
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      return newNodes.length + newEdges.length;
    }, [saveToHistory, setNodes, setEdges]),

    groupNodes,
    loopNodes,
    ungroupNodes,
    exitToRoot,

    validateLogicalConnection,
    validateFlowStructure, // Exposed for external validation

    PROFESSIONAL_COLORS,
    activeBrowserId,
    stopSession,
    executeSingleNode, // Export atomic executor

    // NEW EXPORTS

    isReadOnly,
    hasUnsavedChanges,
    detectOrphans: (n, e) => detectOrphans(n || nodes, e || edges),
    isConfigurationPanelVisible: !!selectedAction, // Derived visibility
    loadStarterTemplate,
    isStarterTemplate,
    onLayout,
  };
}
