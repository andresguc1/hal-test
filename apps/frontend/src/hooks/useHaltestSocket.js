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

  // Update ref when callback changes
  useEffect(() => {
    onElementPickedRef.current = onElementPicked;
  }, [onElementPicked]);

  useEffect(() => {
    if (!setNodes || typeof setNodes !== "function") {
      console.error("Haltest Socket: setNodes is missing or invalid");
      return;
    }

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
      if (!data || !data.stepId) {
        console.warn(
          "Haltest Socket: Received malformed execution-status event",
          data,
        );
        return;
      }

      const { stepId, status, error } = data;
      console.log(`Haltest Socket: ⚡ Event [${stepId}] -> ${status}`);

      // 1. Update Node Status
      setNodes((nds) => {
        if (!Array.isArray(nds)) return nds;
        return nds.map((node) => {
          if (node.id === stepId) {
            return {
              ...node,
              data: {
                ...node.data,
                state: status,
                error: error || node.data.error,
              },
            };
          }
          return node;
        });
      });

      // 2. Update Outgoing Edges Status (Visual Feedback on Lines)
      if (setEdges) {
        setEdges((eds) => {
          return eds.map((edge) => {
            if (edge.source === stepId) {
              return {
                ...edge,
                animated: status === "running", // Native ReactFlow animation support
                data: {
                  ...edge.data,
                  executionState: status, // "running", "success", "error"
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

    // Listen for Screenshot Ready events (Flight Recorder)
    socket.on("step_screenshot_ready", (data) => {
      const { nodeId, screenshotPath } = data;

      setNodes((nds) => {
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
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log("Haltest Socket: Cleaning up connection");
        socket.disconnect();
      }
    };
  }, [setNodes, setEdges]); // Removed onElementPicked from dependencies to avoid reconnections

  return socketRef.current;
};
