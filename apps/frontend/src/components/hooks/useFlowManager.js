// hal_test/src/components/hooks/useFlowManager.js
// ✨ VERSIÓN OPTIMIZADA según best practices de React Flow

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import {
  NODE_LABELS,
  STORAGE_KEYS,
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
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const AUTO_SAVE_INTERVAL = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const API_BASE_URL = "/api/actions";

// ========================================
// OPTIMIZACIÓN 1: Funciones puras fuera del hook
// ========================================
const generateNodeId = () => `node_${uuidv4()}`;

const createExecutedLabel = (action) => {
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
  }, []);

  const setEdges = useCallback((newEdges) => {
    const resolvedEdges =
      typeof newEdges === "function" ? newEdges(edgesRef.current) : newEdges;

    edgesRef.current = resolvedEdges;
    setEdgesState(resolvedEdges);
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

  const executionAbortController = useRef(null);
  const lastLoadedFlowId = useRef(null); // Ref for preventing race conditions
  const [changeCounter, setChangeCounter] = useState(0); // For auto-save versioning logic
  const { autoSaveEnabled, setAutoSaveEnabled } = useSettings();

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
            setEdges(flow.edges || []);
            // History reset on flow switch
            setHistory({ past: [], future: [] });

            logger.info("Flow loaded", { flowId: flow.id }, "useFlowManager");
          }
        } catch (err) {
          logger.error("Error loading flow", err, "useFlowManager");
        }
      }
    };

    loadFlowData();
  }, [currentProject, currentFlowId, setNodes, setEdges]);

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
  }, []); // Función pura, no necesita dependencias

  // ========================================
  // OPTIMIZACIÓN 4: useCallback con deps correctas
  // ========================================
  const saveFlow = useCallback(
    async (silent = false) => {
      if (!currentProject || !currentFlowId) return;

      const flowData = {
        nodes,
        edges,
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
            state: "success",
            message: "✓ Flujo guardado correctamente",
          });
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
    [nodes, edges, getViewport, currentProject, currentFlowId],
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
              error: errorDetails?.message || null, // NEW: Store simple error message
              lastExecuted: new Date().toISOString(),
            },
            style: getNodeStyle(state, node.style),
          };
        }),
      );
    },
    [setNodes],
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
    (nodeId, newConfig) => {
      saveToHistory();
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;

          const updated = {
            ...n,
            data: {
              ...n.data,
              configuration: newConfig,
              label: n.data.label || NODE_LABELS[n.data.type] || n.data.type,
            },
          };

          // selectedAction will update automatically via useMemo

          return updated;
        }),
      );
    },
    [saveToHistory, setNodes],
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

        const response = await fetch(`${API_BASE_URL}/take_screenshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(screenshotPayload),
        });

        if (!response.ok) {
          throw new Error(`Screenshot API error: ${response.statusText}`);
        }

        const data = await response.json();

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
      toast.error("Select at least 2 nodes to group");
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
      maxX = Math.max(maxX, n.position.x + n.width || n.position.x + 200);
      maxY = Math.max(maxY, n.position.y + n.height || n.position.y + 100);
    });

    // 3. Center of the group (for the new node)
    const centerX = minX;
    const centerY = minY;

    // 4. Extract Sub-Flow (Nodes & Edges)
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Valid Edges: Both Source and Target must be inside the group
    const internalEdges = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // External Edges to Rewire
    const externalIncoming = edgesRef.current.filter(
      (e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    const externalOutgoing = edgesRef.current.filter(
      (e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
    );

    // Normalize Sub-Nodes Positions (Relative to 0,0 of the component flow)
    const subNodes = selectedNodes.map((n) => ({
      ...n,
      position: {
        x: n.position.x - minX,
        y: n.position.y - minY,
      },
      selected: false,
      parentNode: null,
    }));

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
          edges: internalEdges,
        },
      );

      if (!newFlow || !newFlow.id)
        throw new Error("Failed to create component flow");

      // 6. Create The Component Node
      const componentId = generateNodeId();
      const componentNode = {
        id: componentId,
        type: "component",
        position: { x: centerX, y: centerY },
        data: {
          label: componentName,
          type: "component",
          flowId: newFlow.id, // Reference to the real Flow
          configuration: {},
        },
        style: getNodeStyle(NODE_STATES.DEFAULT),
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

      // Rewire External Edges
      const newIncomingEdges = externalIncoming.map((e) => ({
        ...e,
        id: `e_${e.source}-${componentId}`,
        target: componentId,
      }));

      const newOutgoingEdges = externalOutgoing.map((e) => ({
        ...e,
        id: `e_${componentId}-${e.target}`,
        source: componentId,
      }));

      // Update State
      const finalNodes = [...remainingNodes, componentNode];
      const finalEdges = [
        ...remainingEdges,
        ...newIncomingEdges,
        ...newOutgoingEdges,
      ];

      setNodes(finalNodes);
      setEdges(finalEdges);
      setSelectedNodeId(componentId);

      // Explicit save to persist the replacement
      // Trigger save immediately to avoid data loss if page is refreshed before auto-save
      // We use the raw 'projectManager.updateFlow' or reuse 'saveFlow' but with the new data?
      // 'saveFlow' uses current state 'nodes' (from closure or ref?). 'saveFlow' uses 'nodes' from deps in useCallback.
      // But here we are inside a callback. We should wait for state update or call updateFlow directly.
      // It's safer to rely on 'setNodes' and then auto-save, but for critical actions, explicit save is better.
      // Currently 'saveFlow' depends on 'nodes' state. We haven't updated 'nodes' state yet (React batching).
      // So we can't call 'saveFlow()' immediately.
      // We will trust the setNodes + autoSave or effect.

      toast.success(`Grouped ${selectedNodes.length} nodes into Component`);
    } catch (error) {
      console.error("Failed to group nodes:", error);
      toast.error("Failed to create component flow");
    }
  }, [currentProject, currentFlowId, saveToHistory, setNodes, setEdges]);

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
    [currentFlowId, currentProject, saveFlow, switchFlow],
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
        (payload && payload.endpoint) || `${API_BASE_URL}/${type || "unknown"}`;

      // Get node (refresh from store ONLY if we need fallback data, but prefer payload)
      const storeNode = nodesRef.current.find((n) => n.id === nodeId);
      const config = payload || storeNode?.data?.configuration || {};
      const browserId = payload?.browserId || config?.browserId;

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
          const openaiKey = localStorage.getItem("hal_openai_key");
          const googleKey = localStorage.getItem("hal_google_key");
          const anthropicKey = localStorage.getItem("hal_anthropic_key");

          const headers = {
            "Content-Type": "application/json",
          };

          if (openaiKey) headers["x-openai-key"] = openaiKey;
          if (googleKey) headers["x-google-key"] = googleKey;
          if (anthropicKey) headers["x-anthropic-key"] = anthropicKey;

          const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(bodyToSend),
            signal: executionAbortController.current?.signal,
          });

          if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errData = null;
            let errorMessage = `HTTP Error ${response.status}`;

            try {
              errData = JSON.parse(text);
              if (errData && errData.message) {
                errorMessage = errData.message;
              }
            } catch {
              // Ignore parsing error, use text if available
              if (text && text.length < 200) errorMessage = text;
            }

            throw new Error(errorMessage);
          }

          const result = await response.json();
          const duration = Date.now() - startTime;

          const instanceId =
            result.data?.instanceId ??
            result.data?.browserId ??
            result.browserId ?? // Critical Fix: Action controller returns browserId at root
            result.instance?.id ??
            null;

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
            logger.info(
              "📸 Screenshot returned by node, reusing for history...",
            );
            // Save the returned screenshot as the "after" state
            const screenshotMetadata = await screenshotManager.saveScreenshot(
              nodeId,
              "after",
              explicitScreenshot,
            );
            updateNodeScreenshot(nodeId, "after", screenshotMetadata);
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
    [updateNodeState, captureScreenshot, updateNodeScreenshot, setNodes],
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
  // Resto de funciones (executeFlow, etc.)
  // Mantener la lógica existente con las optimizaciones aplicadas
  // ========================================

  /**
   * Validates the flow before execution
   * @returns {Array<string>} Array of error messages (empty if valid)
   */

  const executeFlow = useCallback(
    async (options = {}) => {
      const { stopOnError = true } = options;

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

      // Shared Runtime Context (Browser Session, Variables)
      const runtimeContext = {};
      let browserId = null; // Track locally for final cleanup

      let runId = null;

      // --- FLIGHT RECORDER: Start Run ---
      // (Only create run if NOT a partial execution or if desired)
      try {
        // If we have a runId passed in options, use it? Usually it's new.
        if (!options.runId) {
          const { runId: newRunId } = await projectManager.createRun(
            currentProject.id,
            currentFlowId,
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
                  // Execute Sub-flow
                  await executeGraph(subFlow.nodes, subFlow.edges, depth + 1);

                  if (globalStats.failed > 0 && stopOnError) return; // Stop if sub-flow failed
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
        if (browserId) {
          try {
            await fetch(`/api/actions/close_browser`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ browserId }),
            });
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
    ],
  );

  // ========================================
  // Export and Import Flow Functions
  // ========================================

  /**
   * Exports the current flow as a downloadable JSON file
   * @returns {object} The exported flow data
   */
  const exportFlow = useCallback(() => {
    const flowData = {
      nodes,
      edges,
      viewport: getViewport(),
      timestamp: new Date().toISOString(),
      version: "2.0",
      stats: executionStats,
      metadata: {
        exportedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };

    try {
      // Create blob and download
      const blob = new Blob([JSON.stringify(flowData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hal_test_flow_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setApiStatus({
        state: "success",
        message: "✓ Flujo exportado correctamente",
      });

      return flowData;
    } catch (error) {
      console.error("Error al exportar el flujo:", error);
      setApiStatus({
        state: "error",
        message: `✗ Error al exportar: ${error.message}`,
      });
      throw error;
    }
  }, [nodes, edges, getViewport, executionStats]);

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
            const analyzeResponse = await fetch("/api/import/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content, filename }),
            });

            if (!analyzeResponse.ok) {
              throw new Error(
                `Error al analizar el archivo: ${analyzeResponse.statusText}`,
              );
            }

            const analysis = await analyzeResponse.json();

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
          const convertResponse = await fetch("/api/import/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content,
              framework: detectedFramework,
            }),
          });

          if (!convertResponse.ok) {
            throw new Error(
              `Error al convertir el archivo: ${convertResponse.statusText}`,
            );
          }

          const conversion = await convertResponse.json();

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
    setSelectedAction: setSelectedNodeId, // Expose as setSelectedAction for backward compatibility
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
    setSelectedNodeId,

    NODE_STATES,
    PROFESSIONAL_COLORS,
  };
};
