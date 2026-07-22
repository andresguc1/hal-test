import { create } from "zustand";
import { useExecutionStore } from "../stores/useExecutionStore";

// eslint-disable-next-line react-refresh/only-export-components
export const useLogStore = create((set) => ({
  logs: [],
  isPanelVisible: false,

  addLog: (message, type = "info", nodeId = null, mode = null) => {
    const activeMode = mode || useExecutionStore.getState().mode || "calidad";
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'info', 'error', 'success', 'warning'
      nodeId,
      mode: activeMode,
    };

    set((state) => {
      const updated = [...state.logs, newLog];
      const nextLogs = updated.length > 100 ? updated.slice(-100) : updated;

      const shouldShowPanel = type === "error" || type === "warning";

      return {
        logs: nextLogs,
        ...(shouldShowPanel ? { isPanelVisible: true } : {}),
      };
    });
  },

  clearLogs: (mode = null) => set((state) => {
    if (mode) {
      return { logs: state.logs.filter((log) => (log.mode || "calidad") !== mode) };
    }
    return { logs: [] };
  }),

  setIsPanelVisible: (isVisible) => set({ isPanelVisible: isVisible }),

  togglePanel: () =>
    set((state) => ({ isPanelVisible: !state.isPanelVisible })),
}));

// Backward compatibility for components still using useLogs() without selectors.
// NOTE: This will still trigger re-renders if logs change. Components should migrate to useLogStore(selector).
// eslint-disable-next-line react-refresh/only-export-components
export const useLogs = () => useLogStore();

export const LogProvider = ({ children }) => {
  // No-op provider to avoid breaking existing trees.
  return children;
};
