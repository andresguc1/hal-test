import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:2001"
    : window.location.origin;

export const useHaltestSocket = (setNodes, setEdges, onElementPicked) => {
  const socketRef = useRef(null);
  const onElementPickedRef = useRef(onElementPicked);
  const setNodesRef = useRef(setNodes);
  const setEdgesRef = useRef(setEdges);

  // Update refs when props change (always keep latest)
  useEffect(() => {
    onElementPickedRef.current = onElementPicked;
    setNodesRef.current = setNodes;
    setEdgesRef.current = setEdges;
  }, [onElementPicked, setNodes, setEdges]);

  useEffect(() => {
    console.log("Haltest Socket: 🔄 Connecting to", SOCKET_URL);

    // Initialize connection
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(
        "Haltest Socket: ✅ Connected successfully (ID:",
        socket.id,
        ")",
      );
    });

    socket.on("connect_error", (error) => {
      console.error("Haltest Socket: ❌ Connection error:", error.message);
    });

    socket.on("execution-status", (data) => {
      if (!data || !data.stepId) return;

      const { stepId, status, error } = data;
      console.log(`Haltest Socket: ⚡ Event [${stepId}] -> ${status}`);

      // 1. Update Node Status using REF
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
                  // Merge result/output if provided (Fixes missing screenshots/status)
                  result: data.result ? { ...node.data.result, ...data.result } : node.data.result,
                  formattedOutput: data.output || node.data.formattedOutput,
                },
              };
            }
            return node;
          });
        });
      }

      // 2. Update Outgoing Edges using REF
      if (setEdgesRef.current) {
        setEdgesRef.current((eds) => {
          return eds.map((edge) => {
            if (edge.source === stepId) {
              return {
                ...edge,
                animated: status === "running",
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

    // Listen for Element Picker events
    socket.on("element_picked", (data) => {
      console.log("Haltest Socket: 🎯 Element Picked:", data);
      if (onElementPickedRef.current) {
        onElementPickedRef.current(data);
      }
    });

    // Listen for Screenshot Ready events
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

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log("Haltest Socket: Cleaning up connection");
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array = connect ONCE

  return socketRef.current;
};
