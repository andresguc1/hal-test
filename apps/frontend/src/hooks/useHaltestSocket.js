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
  ]);

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
      if (onLogReceived) {
        onLogReceived(message, type, nodeId);
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
  }, [onLogReceived]);

  return socketRef.current;
};
