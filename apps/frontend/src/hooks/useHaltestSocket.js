import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.PROD
  ? "https://hal-test-backend.onrender.com"
  : "http://127.0.0.1:2001";

export const useHaltestSocket = (setNodes, onElementPicked) => {
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

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log("Haltest Socket: Cleaning up connection");
        socket.disconnect();
      }
    };
  }, [setNodes]); // Removed onElementPicked from dependencies to avoid reconnections

  return socketRef.current;
};
