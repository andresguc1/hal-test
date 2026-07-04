import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * Custom hook that manages the Socket.io connection and all performance-related events.
 * Centralizes the real-time telemetry pipeline for the Performance module.
 */
export function usePerformanceSocket(flowId) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [runConfig, setRunConfig] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [vuStatus, setVuStatus] = useState(null);
  const [resourceWarning, setResourceWarning] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Socket initialization
  useEffect(() => {
    const apiUrl =
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:2001"
        : window.location.origin);
    const socketUrl = apiUrl.replace(/\/api$/, "");
    const s = io(socketUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // Event listeners
  useEffect(() => {
    if (!socket) return;
    if (socket.connected) setStatus("waiting");

    const handleConnect = () => setStatus("waiting");
    socket.on("connect", handleConnect);

    socket.on("perf-run-started", (config) => {
      if (config.flowId === flowId) {
        setRunConfig(config);
        setStatus("running");
      }
    });

    socket.on("perf-metrics-update", (data) => {
      if (data.flowId === flowId) {
        setMetrics(data);
        if (data.runConfig) setRunConfig((prev) => prev || data.runConfig);
        setStatus((prev) => (prev === "completed" ? prev : "running"));
        setTimeline((prev) => {
          const next = [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              throughput: data.throughput,
              latency: data.latency?.p95 || 0,
            },
          ];
          return next.slice(-30);
        });
      }
    });

    socket.on("perf-vu-status", (data) => setVuStatus(data));
    socket.on("perf-resource-warning", (data) => setResourceWarning(data));

    socket.on("perf-run-finished", (summary) => {
      if (summary.data && summary.data.flowId === flowId) {
        setMetrics(summary.data);
        setStatus("completed");
      }
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("perf-run-started");
      socket.off("perf-metrics-update");
      socket.off("perf-vu-status");
      socket.off("perf-resource-warning");
      socket.off("perf-run-finished");
    };
  }, [flowId, socket]);

  const resetRun = useCallback(() => {
    setStatus("waiting");
    setMetrics(null);
    setRunConfig(null);
    setTimeline([]);
    setVuStatus(null);
    setResourceWarning(null);
  }, []);

  const duration = runConfig?.durationSec || 0;
  const elapsed = metrics?.elapsed ? metrics.elapsed / 1000 : 0;
  const progressPercent =
    duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return {
    socket,
    status,
    setStatus,
    runConfig,
    metrics,
    vuStatus,
    resourceWarning,
    timeline,
    progressPercent,
    resetRun,
  };
}
