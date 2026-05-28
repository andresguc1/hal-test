import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Strip trailing /api for socket.io compatibility
    return apiUrl.replace(/\/api$/, "");
  }

  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:2001"
    : window.location.origin;
};

const SOCKET_URL = getSocketURL();

export const useHaltestSocket = ({
  setNodes,
  setEdges,
  onElementPicked,
  onLogReceived,
  onTerminalOutput,
  onCodegenAction,
  getCanvasState,
  onProposeNodes,
  onAddNode,
  onConnectNodes,
  onRemoveNode,
  onUpdateNode,
  toast,
}) => {
  const socketRef = useRef(null);
  const onElementPickedRef = useRef(onElementPicked);
  const setNodesRef = useRef(setNodes);
  const setEdgesRef = useRef(setEdges);
  const onTerminalOutputRef = useRef(onTerminalOutput);
  const onCodegenActionRef = useRef(onCodegenAction);
  const getCanvasStateRef = useRef(getCanvasState);
  const onProposeNodesRef = useRef(onProposeNodes);
  const onAddNodeRef = useRef(onAddNode);
  const onConnectNodesRef = useRef(onConnectNodes);
  const onRemoveNodeRef = useRef(onRemoveNode);
  const onUpdateNodeRef = useRef(onUpdateNode);
  const onLogReceivedRef = useRef(onLogReceived);
  const toastRef = useRef(toast);

  // Update refs when props change (always keep latest)
  useEffect(() => {
    onElementPickedRef.current = onElementPicked;
    setNodesRef.current = setNodes;
    setEdgesRef.current = setEdges;
    onTerminalOutputRef.current = onTerminalOutput;
    onCodegenActionRef.current = onCodegenAction;
    getCanvasStateRef.current = getCanvasState;
    onProposeNodesRef.current = onProposeNodes;
    onAddNodeRef.current = onAddNode;
    onConnectNodesRef.current = onConnectNodes;
    onRemoveNodeRef.current = onRemoveNode;
    onUpdateNodeRef.current = onUpdateNode;
    onLogReceivedRef.current = onLogReceived;
    toastRef.current = toast;
  }, [
    onElementPicked,
    setNodes,
    setEdges,
    onTerminalOutput,
    onCodegenAction,
    getCanvasState,
    onProposeNodes,
    onAddNode,
    onConnectNodes,
    onRemoveNode,
    onUpdateNode,
    onLogReceived,
    toast,
  ]);

  // Handle socket connection and listeners

  useEffect(() => {
    console.log("Haltest Socket: 🔄 Connecting to", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Haltest Socket: ✅ Connected (ID:", socket.id, ")");
      window.__HAL_SOCKET__ = socket; // Expose for VariablePanel real-time sync
    });

    socket.on("connect_error", (error) => {
      console.error("Haltest Socket: ❌ Connection error:", error.message);
    });

    socket.on("execution-status", (data) => {
      if (!data || !data.stepId) return;
      const { stepId, status, error, result } = data;
      console.log(`Haltest Socket: ⚡ Event [${stepId}] -> ${status}`);

      // Log structured error to console
      if (status === "failed" || status === "softfailed") {
        const errorMsg = error || "Unknown error";
        console.error(
          `%c[NodeError] NodeId=${stepId} Status=${status} Error="${errorMsg}"`,
          "color: #ef4444; font-weight: bold;",
        );

        // Record in Execution Log
        if (onLogReceivedRef.current) {
          onLogReceivedRef.current(
            `[NodeError] NodeId=${stepId} Status=${status} Error="${errorMsg}"`,
            status === "softfailed" ? "warning" : "error",
            stepId,
          );
        }
      }

      // 1. UPDATE NODES
      if (setNodesRef.current) {
        setNodesRef.current((nds) => {
          if (!Array.isArray(nds)) return nds;
          return nds.map((node) => {
            if (node.id === stepId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  state: status,
                  error: error || node.data.error,
                  result: result
                    ? { ...node.data.result, ...result }
                    : node.data.result,
                  formattedOutput: data.output || node.data.formattedOutput,
                },
              };
            }
            return node;
          });
        });
      }

      // 2. UPDATE EDGES FOR THIS NODE
      if (setEdgesRef.current) {
        setEdgesRef.current((eds) => {
          if (!Array.isArray(eds)) return eds;

          const isBranchingStatus =
            status === "success" || status === "softfailed";

          if (isBranchingStatus) {
            const winnerPath = String(
              result?.path ||
                result?.data?.path ||
                result?.targetPath ||
                result?.result?.path ||
                "",
            )
              .trim()
              .toLowerCase();

            console.log(
              `[HaltestSocket] 🎨 Painting edges for node "${stepId}". Winner path: "${winnerPath}"`,
            );

            const nextEdges = eds.filter((e) => e.source === stepId);
            const isBranchingNode = nextEdges.length > 1;

            return eds.map((edge) => {
              if (edge.source === stepId) {
                const handle = String(edge.sourceHandle || "").toLowerCase();
                let isWinner = false;

                if (
                  !winnerPath ||
                  winnerPath === "" ||
                  winnerPath === "undefined"
                ) {
                  // Only mark as winner if NOT a branching node (linear nodes don't have paths)
                  isWinner = !isBranchingNode;
                } else {
                  // Strict path matching
                  if (handle === winnerPath) isWinner = true;
                  else if (
                    (winnerPath === "true" || winnerPath === "success") &&
                    (handle === "true" || handle === "success")
                  )
                    isWinner = true;
                  else if (
                    (winnerPath === "false" ||
                      winnerPath === "else" ||
                      winnerPath === "default") &&
                    (handle === "false" ||
                      handle === "else" ||
                      handle === "default")
                  )
                    isWinner = true;
                }

                console.log(
                  `  -> Edge ${edge.id}: sourceHandle="${edge.sourceHandle}", isWinner=${isWinner}`,
                );
                return {
                  ...edge,
                  animated: isWinner,
                  data: {
                    ...edge.data,
                    executionState: isWinner ? "success" : "skipped",
                  },
                };
              }
              return edge;
            });
          } else if (
            status === "failed" ||
            status === "running" ||
            status === "executing"
          ) {
            // Reset edges to skipped if failed, or running state
            return eds.map((edge) => {
              if (edge.source === stepId) {
                return {
                  ...edge,
                  animated: status === "running" || status === "executing",
                  data: {
                    ...edge.data,
                    executionState:
                      status === "running" || status === "executing"
                        ? "running"
                        : "skipped",
                  },
                };
              }
              return edge;
            });
          }
          return eds;
        });
      }
    });

    socket.on("edge-status", (data) => {
      if (!data || !data.edgeId) return;
      const { edgeId, status } = data;
      console.log(`Haltest Socket: ⚡ Edge [${edgeId}] -> ${status}`);

      if (setEdgesRef.current) {
        setEdgesRef.current((eds) => {
          if (!Array.isArray(eds)) return eds;
          return eds.map((edge) => {
            // Match by id or custom edgeId property
            if (
              edge.id === edgeId ||
              (edge.data && edge.data.edgeId === edgeId)
            ) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  executionState: status,
                },
              };
            }
            return edge;
          });
        });
      }
    });

    socket.on("flow-finished", (data) => {
      console.log("Haltest Socket: 🏁 Flow finished", data);
      const { status, error, failedNodeId, divePath } = data;

      if (status === "failed" && error) {
        if (toastRef.current) {
          toastRef.current.error(`Execution Failed: ${error}`, {
            duration: 8000,
            style: { border: "1px solid #ef4444", color: "#ef4444" },
          });
        }

        // If the backend provided a specific node that failed (e.g. validation error)
        if (failedNodeId && onLogReceivedRef.current) {
          onLogReceivedRef.current(`[BackendError] ${error}`, "error", failedNodeId);
          // Trigger navigation/focus if possible via a global event or another callback
          window.dispatchEvent(
            new CustomEvent("hal:focus-node", {
              detail: { nodeId: failedNodeId, divePath },
            }),
          );
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("Haltest Socket: 🔌 Disconnected (Reason:", reason, ")");
    });

    console.log("[HaltestSocket] Registering 'element_picked' listener");
    socket.on("element_picked", (data) => {
      console.log("[HaltestSocket] 🎯 Element Picked Event Fired:", data);
      if (onElementPickedRef.current) {
        onElementPickedRef.current(data);
      } else {
        console.warn("[HaltestSocket] No callback ref found!");
      }
    });

    socket.on("step_screenshot_ready", (data) => {
      const { nodeId, screenshotPath } = data;
      if (setNodesRef.current) {
        setNodesRef.current((nds) => {
          if (!Array.isArray(nds)) return nds;
          return nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  result: {
                    ...(node.data.result || {}),
                    screenshot: screenshotPath,
                  },
                },
              };
            }
            return node;
          });
        });
      }
    });

    socket.on("execution-log", (data) => {
      const { message, type, nodeId } = data;
      if (onLogReceivedRef.current) {
        onLogReceivedRef.current(message, type, nodeId);
      }
    });

    socket.on("auto_healing_update", (data) => {
      const { nodeId, newSelector, source, reasoning } = data;
      console.log(`[HaltestSocket] 🩹 Auto-healing update for node: ${nodeId}`);

      // 1. UPDATE NODES (Real-time sync of the configuration)
      if (onUpdateNodeRef.current) {
        onUpdateNodeRef.current(nodeId, {
          selector: newSelector, // Important: update the actual selector so it works!
          healed: true,
          healedFrom: source,
          aiReasoning: reasoning,
          healedValue: newSelector,
          originalValue: data.originalSelector,
          healingConfidence: data.confidence || 1.0,
        });
      } else if (setNodesRef.current) {
        // Fallback to manual update if onUpdateNode is not provided
        setNodesRef.current((nds) => {
          if (!Array.isArray(nds)) return nds;
          return nds.map((node) => {
            if (node.id === nodeId) {
              const newConfig = {
                ...(node.data?.configuration || {}),
                selector: newSelector,
                healed: true,
                healedFrom: source,
                aiReasoning: reasoning,
                healedValue: newSelector,
                originalValue: data.originalSelector,
                healingConfidence: data.confidence || 1.0,
              };

              return {
                ...node,
                data: {
                  ...node.data,
                  configuration: newConfig,
                  healed: true,
                  healedFrom: source,
                  healingReasoning: reasoning,
                },
              };
            }
            return node;
          });
        });
      }

      // 2. TRIGGER NOTIFICATION
      if (toastRef.current) {
        toastRef.current.success(`Node repaired via ${source.toUpperCase()}`, {
          description: `New selector: ${newSelector}`,
          duration: 5000,
          icon: "🩹",
        });
      }
    });

    // ─── Interactive Terminal ───────────────────────────────────────────────────
    socket.on("terminal:output", (data) => {
      if (onTerminalOutputRef.current) {
        onTerminalOutputRef.current(data);
      }
    });

    // ─── Codegen Ghost Nodes (Phase 2) ─────────────────────────────────────────
    socket.on("codegen:action-detected", (data) => {
      if (onCodegenActionRef.current) {
        onCodegenActionRef.current(data);
      }
    });

    // ─── MCP Canvas Tools (Phase 3) ─────────────────────────────────────────
    socket.on("mcp:request_canvas_state", (data, callback) => {
      console.log("[HaltestSocket] 🧠 AI requested canvas state");
      if (getCanvasStateRef.current && typeof callback === "function") {
        const state = getCanvasStateRef.current();
        callback(state);
      } else if (typeof callback === "function") {
        callback({
          error: "Canvas state provider not configured on frontend.",
        });
      }
    });

    socket.on("mcp:propose_nodes", async (data, callback) => {
      console.log("[HaltestSocket] 💍 AI proposed nodes", data);
      if (onProposeNodesRef.current && typeof callback === "function") {
        try {
          const result = await onProposeNodesRef.current(data.nodes);
          callback(result);
        } catch (err) {
          callback({ error: err.message });
        }
      } else if (typeof callback === "function") {
        callback({
          error: "Node proposal handler not configured on frontend.",
        });
      }
    });

    socket.on("mcp:add_node", async (data, callback) => {
      console.log(
        "[HaltestSocket] ➕ AI requested granular node addition",
        data,
      );
      if (onAddNodeRef.current && typeof callback === "function") {
        try {
          const result = await onAddNodeRef.current(data);
          callback(result);
        } catch (err) {
          callback({ error: err.message });
        }
      } else if (typeof callback === "function") {
        callback({
          error: "Node addition handler not configured on frontend.",
        });
      }
    });

    socket.on("mcp:connect_nodes", async (data, callback) => {
      console.log("[HaltestSocket] 🔗 AI requested node connection", data);
      if (onConnectNodesRef.current && typeof callback === "function") {
        try {
          const result = await onConnectNodesRef.current(data);
          callback(result);
        } catch (err) {
          callback({ error: err.message });
        }
      } else if (typeof callback === "function") {
        callback({
          error: "Node connection handler not configured on frontend.",
        });
      }
    });

    socket.on("mcp:remove_node", async (data, callback) => {
      console.log("[HaltestSocket] 🗑️ AI requested node removal", data);
      if (onRemoveNodeRef.current && typeof callback === "function") {
        try {
          const id = data.id || data.nodeId;
          if (!id) throw new Error("Missing node ID for removal");
          const result = await onRemoveNodeRef.current(id);
          callback(result || { success: true });
        } catch (err) {
          callback({ error: err.message });
        }
      } else if (typeof callback === "function") {
        callback({
          error: "Node removal handler not configured on frontend.",
        });
      }
    });

    socket.on("mcp:update_node", async (data, callback) => {
      console.log("[HaltestSocket] ✏️ AI requested node update", data);
      if (onUpdateNodeRef.current && typeof callback === "function") {
        try {
          const id = data.id || data.nodeId;
          if (!id) throw new Error("Missing node ID for update");
          const result = await onUpdateNodeRef.current(id, data.data);
          callback(result || { success: true });
        } catch (err) {
          callback({ error: err.message });
        }
      } else if (typeof callback === "function") {
        callback({
          error: "Node update handler not configured on frontend.",
        });
      }
    });

    return () => {
      if (socket) {
        console.log("Haltest Socket: Cleaning up connection");
        socket.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};
