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
  const [settingsTab, setSettingsTab] = useState("general");

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

  const openSettings = (tab = "general") => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleGrid = () => setShowGrid((prev) => !prev);
  const toggleSnapping = () => setEnableSnapping((prev) => !prev);
  const toggleMinimap = () => setShowMinimap((prev) => !prev);

  const toggleQuality = () => setHighQualityRendering((prev) => !prev);

  // API Keys Modal State
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const openApiKeys = () => setIsApiKeysOpen(true);
  const closeApiKeys = () => setIsApiKeysOpen(false);

  // AI Config State
  const [aiConfig, setAiConfig] = useState(null);

  // Persist settings (optional, simple implementation)
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem("hal_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setShowGrid(parsed.showGrid ?? true);
          setEnableSnapping(parsed.enableSnapping ?? true);
          setShowMinimap(parsed.showMinimap ?? true);
          setHighQualityRendering(parsed.highQualityRendering ?? true);
          setAutoSaveEnabled(parsed.autoSaveEnabled ?? true);
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }

      // Load AI Config
      const savedAi = localStorage.getItem("hal_ai_config");
      if (savedAi) {
        try {
          setAiConfig(JSON.parse(savedAi));
        } catch (e) {
          console.error("Failed to parse AI config", e);
        }
      }
    };

    loadSettings();

    // Listen for external updates (e.g. from SettingsModal)
    window.addEventListener("storage", loadSettings);
    // Custom event for same-window updates
    window.addEventListener("hal_ai_config_updated", loadSettings);

    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("hal_ai_config_updated", loadSettings);
    };
  }, []);

  // Auto Save
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem(
      "hal_settings",
      JSON.stringify({
        showGrid,
        enableSnapping,
        showMinimap,
        highQualityRendering,
        autoSaveEnabled,
      }),
    );
  }, [
    showGrid,
    enableSnapping,
    showMinimap,
    highQualityRendering,
    autoSaveEnabled,
  ]);

  return (
    <SettingsContext.Provider
      value={{
        isSettingsOpen,
        settingsTab,
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
        aiConfig,
        autoSaveEnabled,
        setAutoSaveEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
