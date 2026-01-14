import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Tabs removed - using custom Sidebar state
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Layout,
  Cpu,
  Save,
  Globe,
  Monitor,
  Key,
  HardDrive,
  Eye,
  EyeOff,
  CheckCircle2,
  Play,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import providersData from "@/data/providers.json";

/**
 * SettingsModal (Unified Hub)
 * Centralizes all application settings: General, Canvas, Integrations (API Keys), System.
 */
export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "general",
}) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab when opening or when initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // --- AI Configuration State ---
  const [aiConfig, setAiConfig] = useState({
    activeProvider: "openai",
    selectedModel: "gpt-4o",
    keys: {
      openai: "",
      anthropic: "",
    },
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
  });

  // Load configuration on open
  useEffect(() => {
    if (isOpen) {
      // Try load new config first
      const storedConfig = localStorage.getItem("hal_ai_config");
      if (storedConfig) {
        try {
          setAiConfig(JSON.parse(storedConfig));
          return;
        } catch (e) {
          console.error("Failed to parse AI Config", e);
        }
      }

      // Fallback: Migration from old haltest_api_keys
      const legacyKeys = localStorage.getItem("haltest_api_keys");
      if (legacyKeys) {
        try {
          const keys = JSON.parse(legacyKeys);
          setAiConfig((prev) => ({
            ...prev,
            keys: { ...prev.keys, ...keys },
          }));
        } catch (e) {
          console.error("Failed to parse legacy API keys", e);
        }
      }
    }
  }, [isOpen]);

  const handleSaveConfig = () => {
    // 1. Save new unified config
    localStorage.setItem("hal_ai_config", JSON.stringify(aiConfig));

    // 2. Sync legacy key for backward compatibility (optional but safe)
    localStorage.setItem("haltest_api_keys", JSON.stringify(aiConfig.keys));

    // Notify/Toast
    toast.success("AI Configuration Saved - Settings are now active");

    // Notify other components (like SettingsContext/Toolbox) immediately
    window.dispatchEvent(new Event("hal_ai_config_updated"));
  };

  const updateKey = (provider, value) => {
    setAiConfig((prev) => ({
      ...prev,
      keys: { ...prev.keys, [provider]: value },
    }));
  };

  // --- Connection Test Logic ---
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState("idle"); // idle, success, error

  // Reset status when inputs change
  useEffect(() => {
    setTestStatus("idle");
  }, [aiConfig]);

  const handleTestConnection = async () => {
    setTestStatus("idle");
    const provider = aiConfig.activeProvider;
    const key = aiConfig.keys[provider];
    const baseUrl = aiConfig.keys[`${provider}_baseurl`];

    // Validation
    const activeProv = providersData.find((p) => p.id === provider);
    if (activeProv?.requiresKey && !key) {
      toast.error(`Please enter an API Key for ${activeProv.name}`);
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/ai/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: key,
          model: aiConfig.selectedModel,
          baseUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestStatus("success");
        toast.success(
          `System Online: Successfully connected to ${activeProv?.name || provider}.`,
        );
      } else {
        setTestStatus("error");
        // Parse common errors
        let errorMsg = data.message || "Unknown error";
        if (
          data.message?.includes("Incorrect API key") ||
          data.message?.includes("401")
        ) {
          errorMsg = "Invalid API Key. Please check your credentials.";
        } else if (
          data.message?.includes("429") ||
          data.message?.toLowerCase().includes("quota exceeded")
        ) {
          errorMsg =
            "Quota exceeded. Your API Key is valid, but you hit the plan limits.";
        } else if (data.message?.includes("not found")) {
          errorMsg =
            "Model not found. Try a different model or check provider settings.";
        }

        throw new Error(errorMsg);
      }
    } catch (error) {
      setTestStatus("error");
      // Clean up error message if it's an object or raw error
      const msg = error.message || "Connection failed";
      toast.error(`Auth Failed: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearKey = (keyName) => {
    updateKey(keyName, "");
    toast.info("Key cleared");
  };

  const toggleShowKey = (provider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Helper to get models for active provider
  const getActiveModels = () => {
    return (
      providersData.find((p) => p.id === aiConfig.activeProvider)?.models || []
    );
  };

  // --- Render Helpers ---
  const SidebarItem = ({ id, icon, label }) => {
    const Icon = icon;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium",
          activeTab === id
            ? "bg-blue-500/10 text-blue-400"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
        )}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#0F0F10] border-slate-800 text-slate-100 flex h-[600px] shadow-2xl">
        <DialogTitle className="sr-only">Settings Hub</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your application settings, AI providers, and preferences.
        </DialogDescription>
        {/* Sidebar */}
        <div className="w-[240px] border-r border-slate-800 p-4 bg-[#141415] flex flex-col gap-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
            Settings
          </h2>
          <SidebarItem id="general" icon={Settings} label="General" />
          <SidebarItem id="canvas" icon={Layout} label="Canvas & Editor" />
          <SidebarItem id="integrations" icon={Cpu} label="AI & Integrations" />
          <SidebarItem id="system" icon={HardDrive} label="System" />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F0F10]">
          <div className="flex-1 overflow-y-auto p-8">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    General Settings
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Customize your HAL-TEST experience.
                  </p>
                </div>

                {/* Theme */}
                <div className="space-y-4">
                  <Label className="text-base text-slate-300">Appearance</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all gap-2 bg-slate-900/50",
                          theme === mode
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-slate-800 hover:border-slate-700",
                        )}
                      >
                        <Monitor
                          size={20}
                          className={
                            theme === mode ? "text-blue-400" : "text-slate-500"
                          }
                        />
                        <span className="text-xs font-medium capitalize text-slate-300">
                          {mode}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 h-px w-full" />

                {/* Language */}
                <div className="space-y-4">
                  <Label className="text-base text-slate-300">Language</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={
                        i18n.language.startsWith("en") ? "default" : "outline"
                      }
                      onClick={() => i18n.changeLanguage("en")}
                      className="w-32"
                    >
                      English
                    </Button>
                    <Button
                      variant={
                        i18n.language.startsWith("es") ? "default" : "outline"
                      }
                      onClick={() => i18n.changeLanguage("es")}
                      className="w-32"
                    >
                      Español
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === "integrations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    AI & Integrations
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Configure the intelligence engine and external services.
                  </p>
                </div>

                {/* 1. Provider Selection (Drop-down) */}
                <div className="space-y-4">
                  <Label className="text-slate-300">Active AI Provider</Label>
                  <Select
                    value={aiConfig.activeProvider}
                    onValueChange={(val) => {
                      const firstModel = providersData.find((p) => p.id === val)
                        ?.models[0].id;
                      setAiConfig((prev) => ({
                        ...prev,
                        activeProvider: val,
                        selectedModel: firstModel,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 text-slate-200">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providersData.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Model Selection */}
                <div className="space-y-4">
                  <Label className="text-slate-300">Default Model</Label>
                  <Select
                    value={aiConfig.selectedModel}
                    onValueChange={(val) =>
                      setAiConfig((prev) => ({ ...prev, selectedModel: val }))
                    }
                  >
                    <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 text-slate-200">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getActiveModels().map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-slate-800/50 h-px w-full my-4" />

                {/* 3. Provider Configuration (Dynamic) */}
                {(() => {
                  const activeProv = providersData.find(
                    (p) => p.id === aiConfig.activeProvider,
                  );
                  if (!activeProv) return null;

                  return (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      {/* API Key Input */}
                      {activeProv.requiresKey && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-300 flex items-center gap-2">
                              <Key size={14} className="text-yellow-500" />
                              API Key for {activeProv.name}
                            </Label>
                            <div className="flex gap-1">
                              {aiConfig.keys[aiConfig.activeProvider] && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  onClick={() =>
                                    clearKey(aiConfig.activeProvider)
                                  }
                                  title="Clear Key"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-500"
                                onClick={() =>
                                  toggleShowKey(aiConfig.activeProvider)
                                }
                              >
                                {showKeys[aiConfig.activeProvider] ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </Button>
                            </div>
                          </div>
                          <Input
                            type={
                              showKeys[aiConfig.activeProvider]
                                ? "text"
                                : "password"
                            }
                            autoComplete="off"
                            name={`apikey-${aiConfig.activeProvider}`}
                            placeholder={`sk-...`}
                            value={aiConfig.keys[aiConfig.activeProvider] || ""}
                            onChange={(e) =>
                              updateKey(aiConfig.activeProvider, e.target.value)
                            }
                            className="bg-black/40 border-slate-800 font-mono text-sm"
                          />
                        </div>
                      )}

                      {/* Base URL Input (Ollama / Local) */}
                      {activeProv.requiresBaseUrl && (
                        <div className="space-y-2">
                          <Label className="text-slate-300 flex items-center gap-2">
                            <Globe size={14} className="text-blue-500" />
                            Base URL
                          </Label>
                          <Input
                            type="text"
                            name="baseurl"
                            placeholder={
                              activeProv.defaultBaseUrl ||
                              "http://localhost:11434"
                            }
                            value={
                              aiConfig.keys[
                                `${aiConfig.activeProvider}_baseurl`
                              ] || activeProv.defaultBaseUrl
                            }
                            onChange={(e) =>
                              updateKey(
                                `${aiConfig.activeProvider}_baseurl`,
                                e.target.value,
                              )
                            }
                            className="bg-black/40 border-slate-800 font-mono text-sm"
                          />
                          <p className="text-[12px] text-slate-500">
                            For local models like Ollama, ensure CORS is enabled
                            if needed.
                          </p>
                        </div>
                      )}

                      <div className="pt-4 flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={isTesting}
                          className={cn(
                            "border-slate-700 hover:bg-slate-800 text-slate-300 gap-2 transition-all duration-300",
                            testStatus === "success" &&
                              "border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20",
                            testStatus === "error" &&
                              "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20",
                          )}
                        >
                          {isTesting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : testStatus === "success" ? (
                            <Check size={16} />
                          ) : testStatus === "error" ? (
                            <X size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                          {testStatus === "success"
                            ? "Connected"
                            : testStatus === "error"
                              ? "Failed"
                              : "Test Connection"}
                        </Button>

                        <Button
                          onClick={handleSaveConfig}
                          className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-6"
                        >
                          <Save size={16} /> Save Configuration
                        </Button>
                      </div>
                    </form>
                  );
                })()}

                {/* Save button moved inside form */}
              </div>
            )}

            {/* CANVAS TAB (Placeholder) */}
            {activeTab === "canvas" && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Layout size={48} className="mb-4 opacity-20" />
                <p>Canvas settings (Grid, Snap, Minimap) coming next.</p>
              </div>
            )}

            {/* SYSTEM TAB (Placeholder) */}
            {activeTab === "system" && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <HardDrive size={48} className="mb-4 opacity-20" />
                <p>System configurations coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
