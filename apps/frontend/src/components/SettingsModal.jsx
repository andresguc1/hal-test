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

import { Label } from "@/components/ui/label";
// Tabs removed - using custom Sidebar state

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
  HardDrive,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import providersData from "@/data/providers.json";
import { KeyVaultPanel } from "./settings/KeyVaultPanel";
import { AISettingsPanel } from "./settings/AISettingsPanel";

/**
 * SettingsModal (Unified Hub)
 * Centralizes all application settings: General, Canvas, Integrations (API Keys), System.
 */
export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "general",
}) {
  const { t, i18n } = useTranslation();

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
    activeProvider: "ollama",
    selectedModel: "gemma3",
    keys: {
      ollama: "",
    },
    baseUrl: "http://127.0.0.1:11434",
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

  // --- Connection Test Logic ---

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
            {t("settings.sidebar.title")}
          </h2>
          <SidebarItem
            id="general"
            icon={Settings}
            label={t("settings.sidebar.general")}
          />
          <SidebarItem
            id="canvas"
            icon={Layout}
            label={t("settings.sidebar.canvas")}
          />
          <SidebarItem
            id="integrations"
            icon={Cpu}
            label={t("settings.sidebar.integrations")}
          />
          <SidebarItem
            id="system"
            icon={HardDrive}
            label={t("settings.sidebar.system")}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F0F10]">
          <div className="flex-1 overflow-y-auto p-8">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {t("settings.general.title")}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {t("settings.general.subtitle")}
                  </p>
                </div>

                {/* Theme */}
                <div className="space-y-4">
                  <Label className="text-base text-slate-300">
                    {t("settings.general.appearance")}
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all gap-2 bg-slate-900/50",
                          theme === mode
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
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
                          {t(`settings.general.themes.${mode}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 h-px w-full" />

                {/* Language (Llamativo) */}
                <div className="space-y-4">
                  <Label className="text-base text-slate-300">
                    {t("settings.general.language")}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "en", label: "English", flag: "🇺🇸" },
                      { id: "es", label: "Español", flag: "🇪🇸" },
                    ].map((lang) => {
                      const isSelected = i18n.language.startsWith(lang.id);
                      return (
                        <button
                          key={lang.id}
                          onClick={() => i18n.changeLanguage(lang.id)}
                          className={cn(
                            "group relative flex items-center p-3 rounded-xl border-2 transition-all gap-3 overflow-hidden bg-slate-900/40",
                            isSelected
                              ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/40"
                              : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50",
                          )}
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                            {lang.flag}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold tracking-wide transition-colors",
                              isSelected
                                ? "text-blue-400"
                                : "text-slate-400 group-hover:text-slate-200",
                            )}
                          >
                            {lang.label}
                          </span>

                          {/* Glow effect for selection */}
                          {isSelected && (
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === "integrations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {t("settings.ai.title")}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {t("settings.ai.subtitle")}
                  </p>
                </div>

                {/* 1. Provider Selection (Drop-down) */}
                <div className="space-y-4">
                  <Label className="text-slate-300">
                    {t("settings.ai.active_provider")}
                  </Label>
                  <Select
                    value={aiConfig.activeProvider}
                    onValueChange={(val) => {
                      const firstModel = providersData.find((p) => p.id === val)
                        ?.models[0].id;
                      const updatedConfig = {
                        ...aiConfig,
                        activeProvider: val,
                        selectedModel: firstModel,
                      };
                      setAiConfig(updatedConfig);
                      localStorage.setItem(
                        "hal_ai_config",
                        JSON.stringify(updatedConfig),
                      );
                      window.dispatchEvent(new Event("hal_ai_config_updated"));
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
                  <Label className="text-slate-300">
                    {t("settings.ai.default_model")}
                  </Label>
                  <Select
                    value={aiConfig.selectedModel}
                    onValueChange={(val) => {
                      const updatedConfig = { ...aiConfig, selectedModel: val };
                      setAiConfig(updatedConfig);
                      localStorage.setItem(
                        "hal_ai_config",
                        JSON.stringify(updatedConfig),
                      );
                      window.dispatchEvent(new Event("hal_ai_config_updated"));
                    }}
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

                {/* 3. AI Provider Settings (Base URL, Model, Temperature) */}
                <AISettingsPanel
                  aiConfig={aiConfig}
                  setAiConfig={setAiConfig}
                />

                <div className="bg-slate-800/50 h-px w-full my-4" />

                {/* 3. Provider Configuration (Dynamic) */}
                {(() => {
                  const activeProv = providersData.find(
                    (p) => p.id === aiConfig.activeProvider,
                  );
                  if (!activeProv) return null;

                  return (
                    <div className="space-y-6">
                      {/* Secure Wallet Integration */}
                      <KeyVaultPanel />

                      {/* Legacy Key Warning (if local keys exist) */}
                      {aiConfig.keys[aiConfig.activeProvider] && (
                        <div className="p-3 border border-amber-500/20 bg-amber-500/5 rounded text-xs text-amber-300 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          <span>{t("settings.vault.legacy_warning")}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Save button moved inside form */}
              </div>
            )}

            {/* CANVAS TAB (Placeholder) */}
            {activeTab === "canvas" && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Layout size={48} className="mb-4 opacity-20" />
                <p>{t("settings.sidebar.canvas_coming_soon")}</p>
              </div>
            )}

            {/* SYSTEM TAB (Placeholder) */}
            {activeTab === "system" && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <HardDrive size={48} className="mb-4 opacity-20" />
                <p>{t("settings.sidebar.system_coming_soon")}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
