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
import * as payloadBuilders from "./payloadBuilders";
import { NODE_STATES, PROFESSIONAL_COLORS, getNodeStyle } from "./flowStyles";
import {
  debounce,
  wouldCreateCycle,
  getConnectedComponents,
} from "../../utils/flowUtils";
import { logger } from "../../utils/logger";
import screenshotManager from "../../utils/ScreenshotManager";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const AUTO_SAVE_INTERVAL = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const API_BASE_URL = import.meta.env.PROD
  ? "https://hal-test-backend.onrender.com/api/actions"
  : (import.meta.env?.VITE_API_BASE || "/api/actions");

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

// ========================================
// OPTIMIZACIÓN 2: Memoización de estilos de edges
// ========================================
const DEFAULT_EDGE_OPTIONS = {
  animated: true,
  style: {
    stroke: '#ff8c32', // hal-orange
    strokeWidth: 2,
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#ff8c32', // hal-orange to match theme
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

export const useFlowManager = (currentProject, currentFlowId) => {
  const { getViewport } = useReactFlow();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [clipboard, setClipboard] = useState({ nodes: [], edges: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    state: "idle",
    message: "Esperando acción...",
    details: null,
  });

  const [executionStats, setExecutionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  });

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [changeCounter, setChangeCounter] = useState(0);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const executionAbortController = useRef(null);
  const lastLoadedFlowId = useRef(null);

  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Compute selectedAction from current nodes state
  const selectedAction = useMemo(() => {
    if (!selectedNodeId) return null;

    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;

    return {
      type: node.data.type,
      nodeId: node.id,
      currentData: node.data.configuration || {},
      data: node.data, // Include full node data for screenshots
    };
  }, [selectedNodeId, nodes]);

  // ========================================
  // LOAD FLOW DATA
  // ========================================
  useEffect(() => {
    const loadFlowData = async () => {
      if (currentProject && currentFlowId) {
        // Reset local state immediately to avoid leakage
        setNodes([]);
        setEdges([]);
        setHistory({ past: [], future: [] });

        // Mark as loading (implicit by clearing lastLoadedFlowId)
        lastLoadedFlowId.current = null;

        try {
          // ALWAYS fetch from DB to get the freshest nodes/edges
          // The currentProject.flows list is just a structural snapshot and might be stale
          const flow = await projectManager.getFlow(
            currentProject.id,
            currentFlowId,
          );

          if (flow) {
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
          }
        } catch (err) {
          console.error("Error loading flow:", err);
          logger.error("Error loading flow", err, "useFlowManager");
        } finally {
          // Identify that nodes/edges now belong to this flowId
          lastLoadedFlowId.current = currentFlowId;
        }
      }
    };

    loadFlowData();
  }, [currentProject, currentFlowId]);

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
  const updateNodeState = useCallback((nodeId, state, errorDetails = null) => {
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
  }, []);

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
  }, []);

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
  }, []);

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
  }, []);

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
        type: "custom", // Use custom memoized node type
        position: nodePosition,
        data: {
          label, // Only show user-friendly label
          type: typeKey,
          configuration: {},
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
    [saveToHistory],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      saveToHistory();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [saveToHistory],
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
    [saveToHistory],
  );

  // ========================================
  // SCREENSHOT CAPTURE METHODS
  // ========================================

  /**
   * Update node with screenshot data
   */
  const updateNodeScreenshot = useCallback((nodeId, timing, screenshotData) => {
    console.log("🖼️ updateNodeScreenshot called:", {
      nodeId,
      timing,
      screenshotData,
    });
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
        console.log("🖼️ Updated node:", {
          nodeId,
          screenshots: updatedNode.data.screenshots,
        });
        return updatedNode;
      }),
    );
  }, []);

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

  // ========================================
  // OPTIMIZACIÓN 8: Ejecutar paso con mejor manejo de errores
  // ========================================
  const executeStep = useCallback(
    async (action, options = {}) => {
      console.log(options);
      if (!action || !action.nodeId) {
        console.error("Acción inválida", action);
        return { success: false, error: "Acción inválida" };
      }

      const { nodeId, type, payload } = action;
      const endpoint =
        (payload && payload.endpoint) || `${API_BASE_URL}/${type}`;

      // Get node and browserId for screenshot capture
      const node = nodesRef.current.find((n) => n.id === nodeId);
      const config = node?.data?.configuration || {};
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

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyToSend),
            signal: executionAbortController.current?.signal,
          });

          if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errData = null;
            try {
              errData = JSON.parse(text);
            } catch {
              // Ignorar error de parsing
            }

            let serverMsg =
              (errData && errData.message) || text || response.statusText;

            // If serverMsg contains HTML, extract text content
            if (
              typeof serverMsg === "string" &&
              serverMsg.includes("<!DOCTYPE")
            ) {
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(serverMsg, "text/html");
                const bodyText = doc.body?.textContent?.trim();
                if (bodyText && bodyText.length > 0) {
                  serverMsg = bodyText;
                } else {
                  serverMsg = `Error ${response.status}: ${response.statusText}`;
                }
              } catch {
                serverMsg = `Error ${response.status}: ${response.statusText}`;
              }
            }

            const shouldRetry =
              response.status >= 500 && attempt < MAX_RETRIES - 1;

            if (shouldRetry) {
              const delay = RETRY_BASE_MS * 2 ** attempt;
              updateNodeState(nodeId, NODE_STATES.WARNING, {
                message: `Error ${response.status}. Reintentando...`,
                attempt: attempt + 1,
              });
              setApiStatus({
                state: "warning",
                message: `Error ${response.status}. Reintentando en ${delay / 1000}s...`,
              });
              await sleep(delay);
              continue;
            }

            throw new Error(serverMsg || `Error ${response.status}`);
          }

          const result = await response.json().catch(() => ({}));
          const duration = Date.now() - startTime;

          const instanceId =
            result.instanceId ??
            result.browserId ??
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
                  // label: createExecutedLabel({ type, payload: newConfig }), // DISABLED: Keep original label
                  executionTime: duration,
                  result: result,
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
          // 1. Check if the action itself returned a screenshot (e.g. take_screenshot node)
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
            // Fallback for flat structure
            explicitScreenshot = result.screenshot;
          }

          if (explicitScreenshot) {
            console.log(
              "📸 Screenshot returned by node, reusing for history...",
            );
            // Save the returned screenshot as the "after" state
            const screenshotMetadata = await screenshotManager.saveScreenshot(
              nodeId,
              "after",
              explicitScreenshot,
            );
            updateNodeScreenshot(nodeId, "after", screenshotMetadata);
          }
          // 2. If no explicit screenshot, check if we should auto-capture
          else if (shouldAutoCapture) {
            updateNodeState(nodeId, NODE_STATES.CAPTURING_AFTER);
            await captureScreenshot({
              nodeId,
              timing: "after",
              browserId,
              nodeType: type,
            });
            // Restore success state after screenshot
            updateNodeState(nodeId, NODE_STATES.SUCCESS);
          }

          setIsLoading(false);

          return {
            success: true,
            result,
            duration,
            instanceId,
          };
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
    [updateNodeState, captureScreenshot, updateNodeScreenshot],
  );

  // ========================================
  // OPTIMIZACIÓN 9: ReactFlow callbacks optimizados
  // ========================================
  const onConnect = useCallback(
    (connection) => {
      console.log("🔗 onConnect triggered!", connection);
      console.log("📊 Current nodes:", nodes.length);
      console.log("📊 Current edges:", edges.length);

      // VALIDACIÓN 1: Prevenir conexiones duplicadas
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target,
      );

      if (isDuplicate) {
        console.log("❌ Duplicate connection detected");
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
        console.log("❌ Self-connection detected");
        setApiStatus({
          state: "warning",
          message: "⚠️ No se puede conectar un nodo consigo mismo",
        });
        return;
      }

      // VALIDACIÓN 3: Validar ciclos antes de agregar edge
      if (wouldCreateCycle(connection, nodes, edges)) {
        console.log("❌ Cycle detected, rejecting connection");
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

      console.log("✅ Adding edge...");
      saveToHistory();

      // Agregar edge con ID único y label
      const edgeId = `edge-${connection.source}-${connection.target}`;

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: edgeId,
            ...DEFAULT_EDGE_OPTIONS,
          },
          eds,
        ),
      );

      console.log("✅ Edge added successfully");
      logger.debug("Edge added", connection, "useFlowManager");

      setApiStatus({
        state: "success",
        message: "✓ Conexión creada exitosamente",
      });
    },
    [saveToHistory, nodes, edges],
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
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
    [saveToHistory],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // ========================================
  // Resto de funciones (executeFlow, etc.)
  // Mantener la lógica existente con las optimizaciones aplicadas
  // ========================================

  /**
   * Validates the flow before execution
   * @returns {Array<string>} Array of error messages (empty if valid)
   */
  const validateFlow = useCallback((nodes, edges) => {
    const errors = [];

    // Skip validation if there are no nodes
    if (nodes.length === 0) {
      return errors;
    }

    // Check for disconnected nodes (only if there's more than one node)
    if (nodes.length > 1) {
      const connectedNodeIds = new Set();
      edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const disconnectedNodes = nodes.filter(
        (n) => !connectedNodeIds.has(n.id),
      );
      if (disconnectedNodes.length > 0) {
        const labels = disconnectedNodes
          .map((n) => n.data.label || n.data.type)
          .join(", ");
        errors.push(
          `Nodos desconectados detectados: ${labels}. Todos los nodos deben estar conectados para ejecutar el flujo.`,
        );
      }
    }

    // Check for browser-dependent nodes without browser initialization
    const browserDependentTypes = [
      "open_url",
      "click",
      "type_text",
      "scroll",
      "submit_form",
      "drag_drop",
      "upload_file",
      "take_screenshot",
    ];
    const hasBrowserInit = nodes.some((n) => n.data.type === "launch_browser");
    const browserDependentNodes = nodes.filter((n) =>
      browserDependentTypes.includes(n.data.type),
    );

    if (browserDependentNodes.length > 0 && !hasBrowserInit) {
      errors.push(
        'El flujo contiene acciones que requieren un navegador (como "Abrir URL" o "Click"), pero no hay un nodo "Lanzar Navegador". Agrega un nodo "Lanzar Navegador" al inicio del flujo.',
      );
    }

    return errors;
  }, []);

  const executeFlow = useCallback(
    async (options = {}) => {
      const { stopOnError = true } = options;

      // 0. Validate flow before execution
      const validationErrors = validateFlow(nodes, edges);
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.join(" ");
        setApiStatus({
          state: "error",
          message: `✗ Validación fallida: ${errorMessage}`,
        });
        console.error("Flow validation failed:", validationErrors);
        return { success: false, error: errorMessage };
      }

      // 1. Identify independent flows (connected components)
      const connectedComponents = getConnectedComponents(nodes, edges);

      if (!connectedComponents || connectedComponents.length === 0) {
        setApiStatus({
          state: "idle",
          message: "No hay nodos para ejecutar.",
        });
        return { success: true, stats: executionStats };
      }

      console.group("🚀 Execute Flow - Plan");
      console.log(`Detected ${connectedComponents.length} independent flows.`);

      // Validate cycles in each component
      for (const componentNodes of connectedComponents) {
        const componentEdges = edges.filter(
          (e) =>
            componentNodes.some((n) => n.id === e.source) &&
            componentNodes.some((n) => n.id === e.target),
        );
        const sorted = topologicalSort(componentNodes, componentEdges);
        if (sorted.length !== componentNodes.length) {
          console.error("Cycle detected in component", componentNodes);
          setApiStatus({
            state: "error",
            message:
              "✗ Flujo no ejecutable: Ciclo detectado en uno de los flujos.",
          });
          console.groupEnd();
          return { success: false, error: "Ciclo detectado" };
        }
      }
      console.groupEnd();

      executionAbortController.current = new AbortController();
      resetNodeStates();

      const startTime = Date.now();
      const globalStats = {
        total: nodes.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      };

      setExecutionStats(globalStats);
      setApiStatus({
        state: "loading",
        message: `Ejecutando ${connectedComponents.length} flujos (${nodes.length} pasos totales)...`,
      });

      // 2. Execute each flow sequentially
      for (
        let flowIndex = 0;
        flowIndex < connectedComponents.length;
        flowIndex++
      ) {
        const flowNodes = connectedComponents[flowIndex];
        const flowEdges = edges.filter(
          (e) =>
            flowNodes.some((n) => n.id === e.source) &&
            flowNodes.some((n) => n.id === e.target),
        );

        // Sort nodes for this specific flow
        const sortedNodes = topologicalSort(flowNodes, flowEdges);

        // ISOLATION: Reset runtime context for each flow
        const runtimeContext = {};
        let browserId = null; // Track browser ID for cleanup

        console.log(
          `▶ Starting Flow ${flowIndex + 1}/${connectedComponents.length} (${sortedNodes.length} steps)`,
        );

        try {
          for (let i = 0; i < sortedNodes.length; i++) {
            if (executionAbortController.current?.signal.aborted) break;

            const node = sortedNodes[i];

            // Merge runtime context (e.g., browserId) into the payload
            const payload = {
              ...(node.data.configuration || {}),
              ...runtimeContext,
            };

            const action = {
              nodeId: node.id,
              type: node.data.type,
              payload,
            };

            const result = await executeStep(action, options);

            // Update runtime context with new instanceId/browserId if available
            if (result.success && result.instanceId) {
              browserId = result.instanceId; // Track for cleanup
              runtimeContext.browserId = result.instanceId;
              runtimeContext.instanceId = result.instanceId;
            }

            if (result.skipped) {
              globalStats.skipped++;
            } else if (result.success) {
              globalStats.successful++;
            } else {
              globalStats.failed++;
              if (stopOnError) {
                globalStats.duration = Date.now() - startTime;
                setExecutionStats({ ...globalStats });
                setApiStatus({
                  state: "error",
                  message: `✗ Flujo detenido en paso ${i + 1}/${sortedNodes.length} del Flujo ${flowIndex + 1}`,
                  details: globalStats,
                });
                // Browser cleanup will happen in finally block
                return { success: false, stats: globalStats };
              }
            }

            setApiStatus({
              state: "loading",
              message: `Flujo ${flowIndex + 1}/${connectedComponents.length}: Paso ${i + 1}/${sortedNodes.length} (${globalStats.successful} OK, ${globalStats.failed} Err)`,
            });
          }
        } catch (error) {
          console.error(`Error in flow ${flowIndex + 1}:`, error);
          globalStats.failed++;
        } finally {
          // CLEANUP: Always close browser if it was opened, even on error
          if (browserId) {
            try {
              console.log(`🧹 Cleaning up browser ${browserId}...`);
              const apiBase = import.meta.env.PROD ? "https://hal-test-backend.onrender.com" : "http://localhost:2001";
              await fetch(`${apiBase}/api/actions/close_browser`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ browserId }),
              });
              console.log(`✓ Browser ${browserId} closed successfully`);
            } catch (cleanupError) {
              console.warn(
                `⚠ Failed to close browser ${browserId}:`,
                cleanupError,
              );
            }
          }
        }
      }

      globalStats.duration = Date.now() - startTime;
      setExecutionStats(globalStats);

      const allSuccess = globalStats.failed === 0;
      setApiStatus({
        state: allSuccess ? "success" : "warning",
        message: allSuccess
          ? `✓ ${connectedComponents.length} flujos completados en ${(globalStats.duration / 1000).toFixed(2)}s`
          : `⚠ Completado con errores (${globalStats.failed} fallidos)`,
        details: globalStats,
      });

      return { success: allSuccess, stats: globalStats };
    },
    [
      nodes,
      edges,
      topologicalSort,
      executionStats,
      executeStep,
      resetNodeStates,
      validateFlow,
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
    [saveToHistory],
  );

  // Exportar funciones y estados
  return {
    nodes,
    edges,
    selectedAction,
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
    }, [saveToHistory]),

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
    }, [clipboard, saveToHistory]),

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
    }, [saveToHistory]),

    NODE_STATES,
    PROFESSIONAL_COLORS,
  };
};
