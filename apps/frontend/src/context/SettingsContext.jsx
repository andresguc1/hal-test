import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Canvas Settings
  const [showGrid, setShowGrid] = useState(true);
  const [enableSnapping, setEnableSnapping] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  // Performance
  const [highQualityRendering, setHighQualityRendering] = useState(true);

  // Integrations / System Status (Mock Data for now, can be replaced with real checks)
  const [integrations] = useState({
    browser: { status: "connected", label: "Browser Service" },
    network: { status: "idle", label: "Network Interceptor" },
    ai: { status: "ready", label: "AI Copilot" },
  });

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleGrid = () => setShowGrid((prev) => !prev);
  const toggleSnapping = () => setEnableSnapping((prev) => !prev);
  const toggleMinimap = () => setShowMinimap((prev) => !prev);

  const toggleQuality = () => setHighQualityRendering((prev) => !prev);

  // API Keys Modal State
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const openApiKeys = () => setIsApiKeysOpen(true);
  const closeApiKeys = () => setIsApiKeysOpen(false);

  // Persist settings (optional, simple implementation)
  useEffect(() => {
    const saved = localStorage.getItem("hal_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShowGrid(parsed.showGrid ?? true);
        setEnableSnapping(parsed.enableSnapping ?? true);
        setShowMinimap(parsed.showMinimap ?? true);
        setHighQualityRendering(parsed.highQualityRendering ?? true);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "hal_settings",
      JSON.stringify({
        showGrid,
        enableSnapping,
        showMinimap,
        highQualityRendering,
      }),
    );
  }, [showGrid, enableSnapping, showMinimap, highQualityRendering]);

  return (
    <SettingsContext.Provider
      value={{
        isSettingsOpen,
        openSettings,
        closeSettings,
        showGrid,
        toggleGrid,
        enableSnapping,
        toggleSnapping,
        showMinimap,
        toggleMinimap,
        highQualityRendering,
        toggleQuality,
        integrations,
        isApiKeysOpen,
        openApiKeys,
        closeApiKeys,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
