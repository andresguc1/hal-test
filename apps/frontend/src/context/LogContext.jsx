import { create } from "zustand";
import { useExecutionStore } from "../stores/useExecutionStore";

/**
 * Normalizes execution modes to canonical mode strings:
 * - 'calidad' (Automatización)
 * - 'performance' (Performance)
 * - 'seguridad' (Seguridad)
 */
// eslint-disable-next-line react-refresh/only-export-components
export const normalizeMode = (mode) => {
  if (!mode) return "calidad";
  const m = String(mode).toLowerCase().trim();
  if (m === "performance" || m === "perf") return "performance";
  if (m === "seguridad" || m === "security" || m === "sec") return "seguridad";
  return "calidad"; // Default to automatización ('calidad')
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLogStore = create((set) => ({
  logsByMode: {
    calidad: [],
    performance: [],
    seguridad: [],
  },
  logs: [],
  isPanelVisible: false,

  addLog: (message, type = "info", nodeId = null, mode = null) => {
    const rawMode = mode || useExecutionStore.getState().mode || "calidad";
    const targetMode = normalizeMode(rawMode);

    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'info', 'error', 'success', 'warning'
      nodeId,
      mode: targetMode,
    };

    set((state) => {
      const currentStream = state.logsByMode[targetMode] || [];
      const updatedStream = [...currentStream, newLog];
      const cappedStream =
        updatedStream.length > 100 ? updatedStream.slice(-100) : updatedStream;

      const newLogsByMode = {
        ...state.logsByMode,
        [targetMode]: cappedStream,
      };

      const activeMode = normalizeMode(
        useExecutionStore.getState().mode || "calidad",
      );
      const activeLogs = newLogsByMode[activeMode] || [];
      const shouldShowPanel = type === "error" || type === "warning";

      return {
        logsByMode: newLogsByMode,
        logs: activeLogs,
        ...(shouldShowPanel ? { isPanelVisible: true } : {}),
      };
    });
  },

  syncActiveModeLogs: (activeMode) => {
    const norm = normalizeMode(activeMode);
    set((state) => ({
      logs: state.logsByMode[norm] || [],
    }));
  },

  clearLogs: (mode = null) =>
    set((state) => {
      if (mode) {
        const targetMode = normalizeMode(mode);
        const newLogsByMode = {
          ...state.logsByMode,
          [targetMode]: [],
        };
        const activeMode = normalizeMode(
          useExecutionStore.getState().mode || "calidad",
        );
        return {
          logsByMode: newLogsByMode,
          logs: newLogsByMode[activeMode] || [],
        };
      }
      return {
        logsByMode: { calidad: [], performance: [], seguridad: [] },
        logs: [],
      };
    }),

  setIsPanelVisible: (isVisible) => set({ isPanelVisible: isVisible }),

  togglePanel: () =>
    set((state) => ({ isPanelVisible: !state.isPanelVisible })),
}));

// Backward compatibility for components still using useLogs() without selectors.
// eslint-disable-next-line react-refresh/only-export-components
export const useLogs = () => useLogStore();

export const LogProvider = ({ children }) => {
  return children;
};
