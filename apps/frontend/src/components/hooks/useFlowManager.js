// hal_test/src/components/hooks/useFlowManager.js
// ✨ VERSIÓN OPTIMIZADA según best practices de React Flow

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import * as payloadBuilders from "./payloadBuilders";
import { NODE_STATES, PROFESSIONAL_COLORS, getNodeStyle } from "./flowStyles";
import { debounce, wouldCreateCycle } from "../../utils/flowUtils";
import { logger } from "../../utils/logger";
import screenshotManager from "../../utils/ScreenshotManager";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast"; // Use custom hook instead of direct sonner
import { useTranslation } from "react-i18next";

// NEW: Orphan Detection Helper
const detectOrphans = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  // Find all Launch Browser nodes (Roots)
  const roots = nodes.filter((n) => n.type === "launch_browser");
  if (roots.length === 0) {
    // If no launch browser, techincally all are orphans unless it's a component
    // But for now, let's just return all non-roots
    return nodes.map((n) => n.id);
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
  open_url: { url: "https://www.google.com" },
  launch_browser: { headless: false },
  set_viewport: { width: 1280, height: 720 },
  wait_for_timeout: { duration: 1000 },
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

import { projectManager } from "../../utils/ProjectManager";
import { useSettings } from "../../context/SettingsContext"; // Assuming this is available

export const useFlowManager = (currentProject, currentFlowId, switchFlow) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast(); // Custom HAL Toast
  const { getViewport } = useReactFlow();

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

    nodesRef.current = resolvedNodes;
    setNodesState(resolvedNodes);
    setHasUnsavedChanges(true); // Mark as dirty on ANY node change
  }, []);

  const setEdges = useCallback((newEdges) => {
    const resolvedEdges =
      typeof newEdges === "function" ? newEdges(edgesRef.current) : newEdges;

    edgesRef.current = resolvedEdges;
    setEdgesState(resolvedEdges);
    setHasUnsavedChanges(true); // Mark as dirty on ANY edge change
  }, []);

  const [, setSelectedNodeId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

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

  const executionAbortController = useRef(null);
  const lastLoadedFlowId = useRef(null); // Ref for preventing race conditions
  const [changeCounter, setChangeCounter] = useState(0); // For auto-save versioning logic
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // NEW: Unsaved Indicator
  const { autoSaveEnabled, setAutoSaveEnabled } = useSettings();

  // NEW: Read-Only Mode derived from execution status
  const isReadOnly = useMemo(
    () => apiStatus.state === "running",
    [apiStatus.state],
  );

  // Load flow data
  useEffect(() => {
    const loadFlowData = async () => {
      if (currentProject && currentFlowId) {
        try {
          // If we are just switching back via navigation, maybe we don't need to reload if state is preserved?
          // But since we are switching 'flows' in the DB now, we MUST reload.

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
          }
        } catch (err) {
          logger.error("Error loading flow", err, "useFlowManager");
        }
      }
    };

    loadFlowData();
  }, [currentProject, currentProject?.id, currentFlowId, setNodes, setEdges]);

  // MANIFIESTO: Bidirectional Sync (Footer -> Canvas)
  // If a flow is renamed in the Footer (Global State), update the Node on Canvas
  useEffect(() => {
    if (!currentProject?.flows) return;

    setNodes((currentNodes) => {
      let hasChanges = false;
      const newNodes = currentNodes.map((n) => {
        if (n.type === "component" && n.data?.flowId) {
          const flowRecord = currentProject.flows.find(
            (f) => f.id === n.data.flowId,
          );
          // If flow exists and name is different, sync it
          if (flowRecord && flowRecord.name !== n.data.label) {
            hasChanges = true;
            return {
              ...n,
              data: {
                ...n.data,
                label: flowRecord.name,
                customLabel: flowRecord.name,
              },
            };
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
  // OPTIMIZACIÓN 3: Topological Sort memoizado
  // ========================================
  const topologicalSort = useMemo(() => {
    return (nodesList, edgesList) => {
      if (!nodesList || nodesList.length === 0) return [];

      const indegree = {};
      const adj = {};

      nodesList.forEach((n) => {
        indegree[n.id] = 0;
        adj[n.id] = [];
      });

      (edgesList || []).forEach((e) => {
        if (adj[e.source]) {
          adj[e.source].push(e.target);
          indegree[e.target] = (indegree[e.target] || 0) + 1;
        }
      });

      const queue = [];
      Object.keys(indegree).forEach((id) => {
        if (indegree[id] === 0) queue.push(id);
      });

      const resultIds = [];
      while (queue.length > 0) {
        const id = queue.shift();
        resultIds.push(id);
        (adj[id] || []).forEach((nei) => {
          indegree[nei] -= 1;
          if (indegree[nei] === 0) queue.push(nei);
        });
      }

      if (resultIds.length !== nodesList.length) {
        return nodesList;
      }

      const nodeMap = Object.fromEntries(nodesList.map((n) => [n.id, n]));
      return resultIds.map((id) => nodeMap[id]);
    };
  }, []); // Pure function, no dependencies needed

  // ========================================
  // OPTIMIZACIÓN 4: useCallback con deps correctas
  // ========================================
  const saveFlow = useCallback(
    async (silent = false) => {
      if (!currentProject || !currentFlowId) return;

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
            message: "✓ Flujo guardado correctamente",
          });
          setHasUnsavedChanges(false); // Clear dirty flag
        }

        // Increment change counter for versioning
        setChangeCounter((prev) => prev + 1);

        return flowData;
      } catch (err) {
        logger.error("Error al guardar el flujo", err, "useFlowManager");
        setApiStatus({
          state: "error",
          message: `✗ Error al guardar: ${err.message}`,
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
    if (
      !autoSaveEnabled ||
      !currentProject ||
      !currentFlowId ||
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
  }, [nodes, edges, autoSaveEnabled, saveFlow, currentProject, currentFlowId]);

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
    (nodeId, state, errorDetails = null) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          return {
            ...node,
            data: {
              ...node.data,
              state,
              errorDetails,
              error: errorDetails?.message || null,
              lastExecuted: new Date().toISOString(),
            },
            style: getNodeStyle(state, node.style),
          };
        }),
      );

      // NEW: Also update outgoing edges for visual feedback!
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === nodeId) {
            return {
              ...edge,
              animated: state === "running",
              data: {
                ...edge.data,
                executionState: state, // "running", "success", "error"
              },
            };
          }
          return edge;
        }),
      );
    },
    [setNodes, setEdges],
  );

  const resetNodeStates = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
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
      message: "Estados de nodos reseteados",
    });
  }, [setNodes, setExecutionStats, setApiStatus]);

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
        const nodeWidth = 160; // Reduced from 220
        const nodeHeight = 60; // Reduced from 80
        const horizontalSpacing = 100; // Spacing between columns
        const verticalSpacing = 150; // Increased from 80 to prevent overlap
        const nodesPerRow = 3; // Number of nodes per row

        // NEW: Central offset to position nodes in the middle of the canvas
        const startX = 400;
        const startY = 250;

        // Calculate grid position
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
        type: typeKey, // Explicitly use the registered node type (maps to AbyssNode)
        position: nodePosition,
        data: {
          label, // Only show user-friendly label
          type: typeKey,
          configuration: DEFAULT_NODE_CONFIGS[typeKey] || {},
          state: NODE_STATES.DEFAULT,
        },
        style: getNodeStyle(NODE_STATES.DEFAULT),
        sourcePosition: "right",
        targetPosition: "left",
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);

      // Auto-fit view removed to prevent unwanted zoom
    },
    [saveToHistory, setNodes],
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
      setSelectedAction((prev) => (prev?.nodeId === nodeId ? null : prev));
    },
    [saveToHistory, setNodes, setEdges, setSelectedAction],
  );

  const updateNodeConfiguration = useCallback(
    async (nodeId, newConfig) => {
      saveToHistory();

      let targetFlowId = null;
      let newName = null;

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;

          // Check if this is a component rename
          if (n.type === "component" || n.data.type === "component") {
            const proposedName = newConfig.customLabel || newConfig.label;
            if (proposedName && proposedName !== n.data.label) {
              targetFlowId = n.data.flowId;
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
          await projectManager.updateFlow(currentProject.id, targetFlowId, {
            name: newName,
          });

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
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              screenshots: {
                ...node.data.screenshots,
                [timing]: screenshotData,
              },
            },
          };
          return updatedNode;
        }),
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

    // ⛔ NESTING RULE (V1): Prevent nesting components
    const hasComponent = selectedNodes.some(
      (n) => n.type === "component" || n.data?.type === "component",
    );
    if (hasComponent) {
      toast.error(
        t("groups.no_nesting", "Grouping components is not supported yet"),
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
      const inputId = `input_${Date.now()}`;
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
      const outputId = `output_${Date.now()}`;
      const outputNode = {
        id: outputId,
        type: "output",
        position: { x: groupWidth + 100, y: groupHeight / 2 - 25 }, // Right of content
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
        setSelectedAction({
          nodeId: componentId,
          type: "component",
          data: componentNode.data,
        });
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
    setSelectedAction,
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
        componentNode.data.type !== "component"
      ) {
        toast.error("Cannot enter: Not a component node");
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

      // 2. Push to Stack
      const currentFlowName =
        currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
        "Previous Flow";

      setViewStack((prev) => [
        ...prev,
        {
          id: currentFlowId,
          label: currentFlowName,
        },
      ]);

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

  // ========================================
  // OPTIMIZACIÓN 8: Ejecutar paso con mejor manejo de errores
  // ========================================
  const executeStep = useCallback(
    async (nodeOrAction, _options = {}) => {
      let action = nodeOrAction;

      // Adapter: support direct Node object execution (from Panel)
      if (nodeOrAction && nodeOrAction.id && nodeOrAction.data) {
        action = {
          nodeId: nodeOrAction.id,
          type: nodeOrAction.type,
          payload: nodeOrAction.data.configuration,
          ...nodeOrAction,
        };
      }

      if (!action || !action.nodeId) {
        console.error("Acción inválida", action);
        return { success: false, error: "Acción inválida" };
      }

      const { nodeId, type, payload } = action;
      const endpoint =
        (payload && payload.endpoint) || `/actions/${type || "unknown"}`;

      // Get node (refresh from store ONLY if we need fallback data, but prefer payload)
      const storeNode = nodesRef.current.find((n) => n.id === nodeId);
      const config = payload || storeNode?.data?.configuration || {};

      // PRIORITY: Payload > Config > Active Session
      const browserId =
        payload?.browserId || config?.browserId || activeBrowserId;

      // Automatic screenshot for visual-change nodes
      const shouldAutoCapture = VISUAL_CHANGE_NODES.has(type) && browserId;

      updateNodeState(nodeId, NODE_STATES.EXECUTING);
      setIsLoading(true);
      setApiStatus({
        state: "loading",
        message: `Ejecutando ${NODE_LABELS[type] || type}...`,
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
            error: "Ejecución cancelada",
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
          console.error(`Error en payload builder para ${type}:`, builderError);
          const errorMsg = `Payload inválido: ${builderError.message}`;
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
          }

          // ✨ OPTIMIZACIÓN: Actualización batch
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id !== nodeId) return node;

              const newConfig = {
                ...(node.data.configuration || {}),
                ...(payload || {}),
              };

              if (instanceId) {
                newConfig.instanceId = instanceId;
                newConfig.browserId = instanceId;
              }

              return {
                ...node,
                data: {
                  ...node.data,
                  configuration: newConfig,
                  executed: true,
                  state: NODE_STATES.SUCCESS,
                  result,
                  executionTime: duration,
                },
                style: getNodeStyle(NODE_STATES.SUCCESS),
              };
            }),
          );

          setApiStatus({
            state: "success",
            message: `✓ Ejecución exitosa en ${duration}ms`,
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
            error.message.includes("NetworkError");

          if (
            isNetworkError &&
            attempt < MAX_RETRIES - 1 &&
            error.name !== "AbortError"
          ) {
            const delay = RETRY_BASE_MS * 2 ** attempt;
            updateNodeState(nodeId, NODE_STATES.WARNING, {
              message: `Fallo de red. Reintentando...`,
              attempt: attempt + 1,
            });
            setApiStatus({
              state: "warning",
              message: `Fallo de red. Reintentando en ${delay / 1000}s...`,
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
            message: `✗ Fallo: ${error.message}`,
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
      return { success: false, error: "Max reintentos alcanzados" };
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
          message: "⚠️ Ya existe una conexión entre estos nodos",
        });
        return;
      }

      // VALIDACIÓN 2: Prevenir auto-conexiones
      if (connection.source === connection.target) {
        setApiStatus({
          state: "warning",
          message: "⚠️ No se puede conectar un nodo consigo mismo",
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
          message: "⚠️ No se puede crear un ciclo en el flujo",
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
        message: "✓ Conexión creada exitosamente",
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
    setSelectedAction({
      nodeId: node.id,
      type: node.type,
      data: node.data,
    });
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
          "⚠️ ¿Falta 'Open URL'? Conectar el navegador directamente a un Click suele fallar si no hay página cargada.",
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

      // 1. Check for empty flow
      if (nodesToValidate.length === 0) {
        errors.push("The flow is empty. Add at least one node.");
        return errors;
      }

      // 2. Find Root Nodes (nodes with no incoming edges)
      // We filter out edges that are part of loops to correctly identify roots in cyclical graphs?
      // For now, strict root definition: No target handles pointing to it.
      const targets = new Set(edgesToValidate.map((e) => e.target));
      const roots = nodesToValidate.filter((n) => !targets.has(n.id));

      // 3. Rule: Mandatory Master Node (Launch Browser)
      // There must be exactly ONE root, and it must be 'launch_browser'
      if (roots.length === 0) {
        // Only loops?
        errors.push(
          "Invalid Flow: No starting point found (Cycle detected or no roots).",
        );
      } else if (roots.length > 1) {
        // Multiple disconnected starts allowed?
        // Requirement: "Unicidad del Navegador: No se permite más de un nodo Launch Browser activo por flujo"
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
          // 4. Rule: Navigation Root (Launch -> Open URL)
          // Check outgoing edges from root
          const outgoing = edgesToValidate.filter((e) => e.source === root.id);
          if (outgoing.length === 0) {
            errors.push(
              "Invalid Flow: 'Launch Browser' must connect to 'Open URL'.",
            );
          } else {
            // Check if ANY outgoing connects to 'Open URL' (or a component starting with it)
            const targets = outgoing.map((e) =>
              nodesToValidate.find((n) => n.id === e.target),
            );

            const isOrContainsOpenUrl = (node) => {
              if (!node) return false;
              // Direct check
              if (node.type === "open_url" || node.data?.type === "open_url")
                return true;

              // Component check (Recursive-ish for V1)
              if (
                node.type === "component" ||
                node.data?.type === "component"
              ) {
                const subFlow = node.data?.subFlow;
                if (!subFlow || !subFlow.nodes || !subFlow.edges) return false;

                // Find internal Input node
                // Note: Boundary nodes might be named 'input' or have specific type
                const internalInput = subFlow.nodes.find(
                  (n) => n.type === "input" || n.data?.type === "input",
                );
                if (!internalInput) return false;

                // Find what follows the input
                const internalEdges = subFlow.edges.filter(
                  (e) => e.source === internalInput.id,
                );
                const firstSteps = internalEdges.map((e) =>
                  subFlow.nodes.find((n) => n.id === e.target),
                );

                // Check if any of the first steps is Open URL
                return firstSteps.some((step) => isOrContainsOpenUrl(step)); // Recursive for nested (future proof)
              }
              return false;
            };

            const hasOpenUrl = targets.some((n) => isOrContainsOpenUrl(n));

            if (!hasOpenUrl) {
              errors.push(
                "Invalid Flow: 'Launch Browser' must be followed by 'Open URL' (or a component starting with it).",
              );
            }
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
      const runtimeContext = {};
      let browserId = activeBrowserId || null; // Start with active session if available

      let runId = null;

      // --- FLIGHT RECORDER: Start Run ---
      // (Only create run if NOT a partial execution or if desired)
      try {
        // If we have a runId passed in options, use it? Usually it's new.
        if (!options.runId) {
          const { runId: newRunId } = await projectManager.createRun(
            currentProject.id,
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

      // Recursive Execution Function
      const executeGraph = async (graphNodes, graphEdges, depth = 0) => {
        if (depth > 10) throw new Error("Max recursion depth exceeded");

        // A. Split into connected islands (Components)
        // We utilize the existing 'getConnectedComponents' helper if available, or just treat whole graph?
        // The 'getWeaklyConnectedComponents' is imported/available?
        // Let's assume we sort the WHOLE graph if it's connected, or we implement simple island detection.
        // For simplicity/robustness, we can treat the provided nodes/edges as a single scope,
        // but topological sort handles disjoint graphs primarily by returning a valid sequence?
        // Standard topological sort on a disjoint graph usually returns A valid linear ordering.
        // However, the original code explicitly split components.
        // We will rely on our `topologicalSort` to handle the list of nodes.

        // Re-implement island detection or just sort all?
        // Previous implementation: `getConnectedComponents`.
        // We should emulate that behavior to ensure correct independent execution of parallel flows?
        // Actually, "parallel" flows in this engine are executed sequentially island-by-island.
        // Let's keep it simple: Sort ALL nodes. If there are disjoint islands, unique sort order doesn't matter much unless we want parallelism.

        const sortedAll = topologicalSort(graphNodes, graphEdges);

        // Update total count estimate (just adding current level nodes)
        if (depth === 0) globalStats.total = sortedAll.length; // Initial estimate

        for (let i = 0; i < sortedAll.length; i++) {
          if (executionAbortController.current?.signal.aborted) break;

          const node = sortedAll[i];

          // DEBUG EXECUTION FLOW
          console.log(`[FlowManager] Processing node ${i}:`, {
            id: node.id,
            type: node.type,
            dataType: node.data?.type,
            isComponent:
              node.type === "component" || node.data?.type === "component",
          });

          // RECURSION CHECK: Component Node
          if (node.type === "component" || node.data.type === "component") {
            const { flowId } = node.data;
            if (flowId) {
              setApiStatus({
                state: "loading",
                message: `Entering component: ${node.data.label || "Sub-flow"} (Depth ${depth})...`,
              });

              try {
                // Fetch Sub-flow
                const subFlow = await projectManager.getFlow(
                  currentProject.id,
                  flowId,
                );
                if (subFlow && subFlow.nodes && subFlow.nodes.length > 0) {
                  // VISUAL: Set Component Node to RUNNING
                  updateNodeState(node.id, NODE_STATES.RUNNING);

                  // Execute Sub-flow
                  await executeGraph(subFlow.nodes, subFlow.edges, depth + 1);

                  // Check if sub-flow had failures
                  const hadFailures = globalStats.failed > 0;

                  // VISUAL: Set Component Node to SUCCESS or ERROR
                  updateNodeState(
                    node.id,
                    hadFailures ? NODE_STATES.ERROR : NODE_STATES.SUCCESS,
                    hadFailures
                      ? { message: "Component execution failed" }
                      : null,
                  );

                  if (hadFailures && stopOnError) return; // Stop if sub-flow failed
                } else {
                  logger.warn(`Empty or missing sub-flow: ${flowId}`);
                }
              } catch (err) {
                logger.error("Failed to load/execute component", err);
                globalStats.failed++;
                // If critical, stop?
                if (stopOnError) return;
              }
            }
            // Components don't count as "steps" in stats? Or do they?
            // Let's count them as skipped or successful container steps?
            // We won't increment 'successful' for the container itself, just its children.
            continue;
          }

          // CRITICAL FIX: If node type is explicitly "component" but didn't pass the check above (e.g. missing flowId),
          // we must NOT try to execute it as an API action 'unknown' or 'component'.
          // Double check to prevent fall-through.
          if (node.type === "component" || node.data.type === "component") {
            logger.warn(`Skipping invalid/empty component node: ${node.id}`);
            continue;
          }

          // FIX: Skip Boundary Nodes (Input/Output) which are structural only
          if (node.type === "input" || node.type === "output") {
            continue;
          }

          // NORMAL STEP EXECUTION
          const payload = {
            ...(node.data.configuration || {}),
            ...runtimeContext,
            runId,
          };

          // Map 'component' type to something else? No, we skipped components above.
          const action = {
            nodeId: node.id,
            type: node.data.type,
            payload,
          };

          setApiStatus({
            state: "loading",
            message: `Step ${i + 1}/${sortedAll.length} (Depth ${depth}): ${node.data.label || node.data.type}`,
          });

          try {
            const result = await executeStep(action, options);

            // Update Context
            if (result.success && result.instanceId) {
              browserId = result.instanceId;
              runtimeContext.browserId = result.instanceId;
              runtimeContext.instanceId = result.instanceId;
            }

            if (result.skipped) globalStats.skipped++;
            else if (result.success) globalStats.successful++;
            else {
              globalStats.failed++;
              if (stopOnError) return;
            }
          } catch {
            globalStats.failed++;
            if (stopOnError) return;
          }
        }
      };

      // 2. Start Execution
      try {
        // Use nodes from options (fresh from App) or state nodes (may be stale if called immediately after type)
        const nodesToExecute = options.nodes || nodes;
        await executeGraph(nodesToExecute, edges, 0);
      } catch (error) {
        console.error("Execution error:", error);
        globalStats.failed++;
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

      return { success: globalStats.failed === 0, stats: globalStats };
    },
    [
      nodes,
      edges,
      currentProject,
      currentFlowId,
      topologicalSort,
      executeStep,
      resetNodeStates,
      activeBrowserId, // Added dependency
      updateNodeState,
      validateFlowStructure,
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
  }, [activeBrowserId, setApiStatus, toast]);

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
            throw new Error(
              "Formato de archivo inválido: falta el array de nodos",
            );
          }

          if (!flowData.edges || !Array.isArray(flowData.edges)) {
            throw new Error(
              "Formato de archivo inválido: falta el array de edges",
            );
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
            message: `✓ Flujo importado: ${flowData.nodes.length} nodos, ${flowData.edges.length} conexiones`,
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
            throw new Error("No se generaron flujos desde el directorio");
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
            message: `✓ ${result.flows.length} flujos importados (${allNodes.length} nodos totales)`,
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
            message: "Analizando archivo de prueba...",
          });

          // 1. Analyze the file (if framework not provided)
          let detectedFramework = framework;
          if (!detectedFramework) {
            const analysis = await api.post("/import/analyze", {
              content,
              filename,
            });

            if (!analysis.detected) {
              throw new Error("No se pudo detectar el framework de pruebas.");
            }

            detectedFramework = analysis.framework;
          }

          setApiStatus({
            state: "loading",
            message: `Framework detectado: ${detectedFramework}. Convirtiendo...`,
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
            throw new Error("No se pudieron generar flujos desde el archivo.");
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
            message: `✓ Importación completada: ${newNodes.length} pasos generados`,
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
          message: `✗ Error al importar: ${error.message}`,
        });
        throw error;
      }
    },
    [saveToHistory, setNodes, setEdges, setApiStatus],
  );

  // ========================================
  // UNGROUPING LOGIC (Inverse of groupNodes)
  // ========================================

  const ungroupNodes = useCallback(
    async (componentNodeId) => {
      const componentNode = nodesRef.current.find(
        (n) => n.id === componentNodeId,
      );

      if (!componentNode || componentNode.data?.type !== "component") {
        return; // Safety check
      }

      console.log(`[Ungroup] Desagrupando componente: ${componentNodeId}`);
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
    selectedAction,
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
    setSelectedAction, // CORRECTED: Expose real setter, not alias to setSelectedNodeId
    setSelectedNodeId, // Expose this too if needed externally
    setAutoSaveEnabled,

    addNode,
    deleteNode,
    updateNodeConfiguration,
    updateNodeState,

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
    }, []),

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
            else if (step.status === "running") nodeState = NODE_STATES.RUNNING;

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
            label: `${node.data.label} (copia)`,
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
    ungroupNodes,

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
  };
};
