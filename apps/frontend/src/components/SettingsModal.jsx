import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { api } from "@/utils/api";
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
  Cpu,
  Monitor,
  AlertTriangle,
  Database,
  Zap,
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
  currentProject,
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
    selectedModel: "gemma3:2b",
    baseUrl: "http://127.0.0.1:11434",
    keys: {},
    temperature: 0.7,
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

  const handleProjectUpdate = useCallback(
    async (updates) => {
      if (!currentProject) return;
      try {
        await api.put(`/projects/${currentProject.id}`, updates);
      } catch (err) {
        console.error("Failed to update project:", err);
        throw err;
      }
    },
    [currentProject],
  );

  // --- Vector Cache Configuration State ---
  const [vectorCacheConfig, setVectorCacheConfig] = useState({
    enabled: false,
    minConfidenceToStore: 0.7,
    ttlDays: 90,
    maxEntriesPerUrl: 50,
    similarityThreshold: 0.75,
    loading: false,
    saving: false,
  });

  // Load vector cache config
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("hal_vector_cache_config");
      if (stored) {
        try {
          setVectorCacheConfig((prev) => ({ ...prev, ...JSON.parse(stored) }));
        } catch (e) {
          console.error("Failed to parse vector cache config", e);
        }
      }
    }
  }, [isOpen]);

  const handleVectorCacheSave = async () => {
    setVectorCacheConfig((prev) => ({ ...prev, saving: true }));
    try {
      await api.put("/settings/vector-cache", vectorCacheConfig);
      localStorage.setItem("hal_vector_cache_config", JSON.stringify(vectorCacheConfig));
      setVectorCacheConfig((prev) => ({ ...prev, saved: true }));
      setTimeout(() => setVectorCacheConfig((p) => ({ ...p, saved: false })), 2000);
    } catch (err) {
      console.error("Failed to save vector cache config:", err);
    } finally {
      setVectorCacheConfig((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleVectorCacheToggle = (enabled) => {
    setVectorCacheConfig((prev) => ({ ...prev, enabled }));
  };

  const VectorCachePanel = () => {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="text-blue-400" size={20} />
            {t("settings.vectorCache.title")}
          </h3>
          <p className="text-slate-400 text-sm">
            {t("settings.vectorCache.subtitle")}
          </p>
        </div>

        {/* Enable Toggle */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <Label className="block text-base text-slate-300 mb-1">
                {t("settings.vectorCache.enable")}
              </Label>
              <p className="text-slate-500 text-sm">
                {t("settings.vectorCache.enableHelp")}
              </p>
            </div>
            <button
              onClick={() => handleVectorCacheToggle(!vectorCacheConfig.enabled)}
              className={cn(
                "relative w-14 h-8 rounded-full transition-all flex items-center p-1",
                vectorCacheConfig.enabled
                  ? "bg-blue-500"
                  : "bg-slate-700"
              )}
              aria-label={t("settings.vectorCache.enable")}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                  vectorCacheConfig.enabled ? "translate-x-full" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Settings (only show when enabled) */}
        {vectorCacheConfig.enabled && (
          <>
            <div className="bg-slate-800/50 h-px w-full" />

            {/* Min Confidence */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Label className="block text-base text-slate-300 mb-2">
                {t("settings.vectorCache.minConfidence")}
              </Label>
              <p className="text-slate-500 text-sm mb-3">
                {t("settings.vectorCache.minConfidenceHelp")}
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={vectorCacheConfig.minConfidenceToStore}
                  onChange={(e) => setVectorCacheConfig((prev) => ({ ...prev, minConfidenceToStore: parseFloat(e.target.value) }))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-slate-300 font-mono w-12 text-right">
                  {(vectorCacheConfig.minConfidenceToStore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Similarity Threshold */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Label className="block text-base text-slate-300 mb-2">
                {t("settings.vectorCache.similarityThreshold")}
              </Label>
              <p className="text-slate-500 text-sm mb-3">
                {t("settings.vectorCache.similarityThresholdHelp")}
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={vectorCacheConfig.similarityThreshold}
                  onChange={(e) => setVectorCacheConfig((prev) => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-slate-300 font-mono w-12 text-right">
                  {(vectorCacheConfig.similarityThreshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* TTL Days */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Label className="block text-base text-slate-300 mb-2">
                {t("settings.vectorCache.ttlDays")}
              </Label>
              <p className="text-slate-500 text-sm mb-3">
                {t("settings.vectorCache.ttlDaysHelp")}
              </p>
              <input
                type="number"
                min="1"
                max="365"
                value={vectorCacheConfig.ttlDays}
                onChange={(e) => setVectorCacheConfig((prev) => ({ ...prev, ttlDays: Number(e.target.value) }))}
                className="w-full max-w-xs bg-slate-900 border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Max Entries Per URL */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Label className="block text-base text-slate-300 mb-2">
                {t("settings.vectorCache.maxEntriesPerUrl")}
              </Label>
              <p className="text-slate-500 text-sm mb-3">
                {t("settings.vectorCache.maxEntriesPerUrlHelp")}
              </p>
              <input
                type="number"
                min="10"
                max="500"
                value={vectorCacheConfig.maxEntriesPerUrl}
                onChange={(e) => setVectorCacheConfig((prev) => ({ ...prev, maxEntriesPerUrl: Number(e.target.value) }))}
                className="w-full max-w-xs bg-slate-900 border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Save Button */}
            <Button
              variant="primary"
              onClick={handleVectorCacheSave}
              disabled={vectorCacheConfig.saving}
              className="w-full max-w-md"
            >
              {vectorCacheConfig.saving
                ? t("common.saving")
                : vectorCacheConfig.saved
                ? t("common.saved")
                : t("common.save")}
            </Button>

            {/* Stats */}
            <div className="bg-slate-800/50 h-px w-full my-4" />
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <Label className="block text-base text-slate-300 mb-2">
                {t("settings.vectorCache.stats")}
              </Label>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">—</div>
                  <div className="text-xs text-slate-500">{t("settings.vectorCache.domFingerprints")}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">—</div>
                  <div className="text-xs text-slate-500">{t("settings.vectorCache.flowNodes")}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-3 text-xs"
                onClick={() => {
                  // TODO: Fetch stats from backend
                }}
              >
                {t("settings.vectorCache.refreshStats")}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const ProjectSettingsPanel = ({ project, onUpdate }) => {
    const [timeoutMs, setTimeoutMs] = useState(
      project.defaultActionTimeoutMs ?? "",
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        const value = timeoutMs === "" ? null : Number(timeoutMs);
        await onUpdate({ defaultActionTimeoutMs: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error("Failed to save project timeout:", err);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <Label className="block text-base text-slate-300 mb-2">
            {t("settings.project.defaultTimeout")}
          </Label>
          <p className="text-slate-500 text-sm mb-3">
            {t("settings.project.defaultTimeoutHelp")}
          </p>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <input
                type="number"
                min="0"
                step="1000"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
                disabled={saving}
                className="w-full bg-slate-900 border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("settings.project.timeoutPlaceholder")}
              />
              {saving && (
                <span className="text-slate-500 text-sm animate-pulse">
                  {t("common.saving")}
                </span>
              )}
              {saved && !saving && (
                <span className="text-green-400 text-sm">
                  {t("common.saved")}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || timeoutMs === ""}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
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
          {currentProject && (
            <SidebarItem
              id="project"
              icon={AlertTriangle}
              label={t("settings.sidebar.project")}
            />
          )}
          <SidebarItem
            id="integrations"
            icon={Cpu}
            label={t("settings.sidebar.integrations")}
          />
          <SidebarItem
            id="vector-cache"
            icon={Database}
            label={t("settings.sidebar.vectorCache")}
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
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "en", label: "English", flag: "🇺🇸" },
                      { id: "es", label: "Español", flag: "🇪🇸" },
                      { id: "fr", label: "Français", flag: "🇫🇷" },
                      { id: "pt", label: "Português", flag: "🇧🇷" },
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

            {/* PROJECT TAB */}
            {currentProject && activeTab === "project" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {t("settings.project.title")}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {t("settings.project.subtitle")}
                  </p>
                </div>

                <ProjectSettingsPanel
                  project={currentProject}
                  onUpdate={handleProjectUpdate}
                />
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

            {/* VECTOR CACHE TAB */}
            {activeTab === "vector-cache" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <VectorCachePanel />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
