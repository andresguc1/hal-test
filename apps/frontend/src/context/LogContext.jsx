import React, { createContext, useContext, useState, useCallback } from "react";

const LogContext = createContext();

export const LogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const addLog = useCallback((message, type = "info", nodeId = null) => {
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'info', 'error', 'success', 'warning'
      nodeId,
    };

    setLogs((prev) => {
      // Keep only last 100 logs
      const updated = [...prev, newLog];
      if (updated.length > 100) return updated.slice(-100);
      return updated;
    });

    if (type === "error" || type === "warning") {
      setIsPanelVisible(true);
      // Note: We don't trigger toast here because App already has a socket listener
      // or we can use a simpler event emitter if needed.
      // But actually, the most direct way is to have the socket listener in App or
      // useHaltestSocket trigger a toast directly.
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelVisible((v) => !v);
  }, []);

  return (
    <LogContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        isPanelVisible,
        setIsPanelVisible,
        togglePanel,
      }}
    >
      {children}
    </LogContext.Provider>
  );
};

// Hook must be in a separate export to comply with react-refresh/only-export-components
// eslint-disable-next-line react-refresh/only-export-components
export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
};
