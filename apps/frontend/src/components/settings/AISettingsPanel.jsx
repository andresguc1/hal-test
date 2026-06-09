import React, { useState } from "react";
import {
  Globe,
  Thermometer,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  AlertTriangle,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api";

/**
 * AISettingsPanel
 * Configures the LLM provider connection: Base URL, Model Name, Temperature.
 * Supports Ollama (Local) and OpenRouter (Cloud).
 */
export function AISettingsPanel({ aiConfig, setAiConfig }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState(null);

  const activeProvider = aiConfig.activeProvider || "ollama";
  const isOllama = activeProvider === "ollama";

  // Resolve default base URL depending on provider
  const getDefaultBaseUrl = (provider) => {
    switch (provider) {
      case "openai":
        return "https://api.openai.com/v1";
      case "anthropic":
        return "https://api.anthropic.com/v1";
      case "google":
        return "https://generativelanguage.googleapis.com/v1beta";
      case "openrouter":
        return "https://openrouter.ai/api/v1";
      case "ollama":
      default:
        return "http://127.0.0.1:11434";
    }
  };

  // Resolve default model depending on provider
  const getDefaultModel = (provider) => {
    switch (provider) {
      case "openai":
        return "gpt-4o-mini";
      case "anthropic":
        return "claude-3-5-sonnet-latest";
      case "google":
        return "gemini-2.0-flash";
      case "openrouter":
        return "google/gemini-2.0-flash-001";
      case "ollama":
      default:
        return "gemma3:2b";
    }
  };

  const baseUrl = aiConfig.baseUrl || getDefaultBaseUrl(activeProvider);
  const model = aiConfig.selectedModel || getDefaultModel(activeProvider);
  const temperature = aiConfig.temperature ?? 0.7;
  const apiKey = aiConfig.keys?.[activeProvider] || "";

  const updateConfig = (updates) => {
    setAiConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveConfig = () => {
    const configToSave = {
      ...aiConfig,
      activeProvider,
      baseUrl,
      selectedModel: model,
      temperature,
      keys: {
        ...(aiConfig.keys || {}),
        [activeProvider]: apiKey,
      },
    };
    localStorage.setItem("hal_ai_config", JSON.stringify(configToSave));
    window.dispatchEvent(new Event("hal_ai_config_updated"));
    toast.success(t("settings.ai.settings_saved"));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setHealthResult(null);

    try {
      // Use the generic validation endpoint (POST) for all providers
      const res = await api.post("/ai/validate", {
        provider: activeProvider,
        apiKey,
        baseUrl,
        model,
      });

      // Map response to healthResult format
      setHealthResult({
        success: res.success,
        error: res.error,
        ollamaRunning: res.ollamaRunning,
        modelLoaded: res.modelLoaded,
        models: res.models || [],
        warning: res.warning,
      });

      if (res.success) {
        toast.success(
          t("settings.ai.connection_success", {
            provider: activeProvider,
            model,
          }),
        );
      } else {
        toast.error(
          res.error ||
            t("settings.ai.connect_error", { provider: activeProvider }),
        );
      }
    } catch (error) {
      setHealthResult({ success: false, error: error.message });
      toast.error(error.message || "Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Server className="text-indigo-400" size={20} />
        <h3 className="text-lg font-medium text-white">
          {t("settings.ai.title")}
        </h3>
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">
          {t("settings.ai.active_provider")}
        </Label>
        <Select
          value={activeProvider}
          onValueChange={(val) => {
            const updates = {
              activeProvider: val,
              baseUrl: getDefaultBaseUrl(val),
              selectedModel: getDefaultModel(val),
            };

            updateConfig(updates);
          }}
        >
          <SelectTrigger className="bg-slate-950 border-slate-800">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
            <SelectItem value="openai">OpenAI (Cloud)</SelectItem>
            <SelectItem value="anthropic">
              Claude / Anthropic (Cloud)
            </SelectItem>
            <SelectItem value="google">Gemini / Google (Cloud)</SelectItem>
            <SelectItem value="openrouter">OpenRouter (Cloud)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Key (for Cloud Providers) */}
      {!isOllama && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400 flex items-center gap-2">
            <Key size={12} />
            {t("settings.vault.api_key")}
          </Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) =>
              updateConfig({
                keys: {
                  ...(aiConfig.keys || {}),
                  [activeProvider]: e.target.value,
                },
              })
            }
            className="bg-slate-950 border-slate-800 font-mono text-sm"
            placeholder="sk-or-..."
          />
          <p className="text-[10px] text-slate-500">
            {t("settings.vault.legacy_warning")}
          </p>
        </div>
      )}

      {/* Base URL */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">
          {t("settings.ai.base_url")}
        </Label>
        <div className="relative">
          <Globe size={14} className="absolute left-3 top-3 text-slate-500" />
          <Input
            value={baseUrl}
            onChange={(e) => updateConfig({ baseUrl: e.target.value })}
            className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
            placeholder={getDefaultBaseUrl(activeProvider)}
          />
        </div>
      </div>

      {/* Model Name */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">
          {t("settings.ai.custom_model_identifier")}
        </Label>
        <div className="relative">
          <Cpu size={14} className="absolute left-3 top-3 text-slate-500" />
          <Input
            value={model}
            onChange={(e) => updateConfig({ selectedModel: e.target.value })}
            className={`bg-slate-950 border-slate-800 pl-9 font-mono text-sm ${model ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : ""}`}
            placeholder={getDefaultModel(activeProvider)}
          />
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          {t("settings.ai.custom_model_desc")}
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400 flex items-center gap-2">
          <Thermometer size={12} />
          {t("settings.ai.temperature")}: {temperature.toFixed(2)}
        </Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={temperature}
          onChange={(e) =>
            updateConfig({ temperature: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{t("settings.ai.precise")} (0.0)</span>
          <span>{t("settings.ai.creative")} (1.0)</span>
        </div>
      </div>

      {/* Health / Connection Result Badge (Close to Test Button) */}
      {healthResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
            healthResult.success
              ? "border-green-500/20 bg-green-500/5 text-green-300"
              : "border-amber-500/20 bg-amber-500/5 text-amber-300"
          }`}
        >
          {healthResult.success ? (
            <CheckCircle2 size={14} className="text-green-400" />
          ) : healthResult.ollamaRunning || activeProvider !== "ollama" ? (
            <AlertTriangle size={14} className="text-amber-400" />
          ) : (
            <XCircle size={14} className="text-red-400" />
          )}
          <div className="flex-1">
            {healthResult.success ? (
              <span>
                {t("settings.vault.test_success")} ({model})
              </span>
            ) : (
              <span>
                {healthResult.error || t("settings.ai.connect_error")}
              </span>
            )}
          </div>
        </div>
      )}

      {healthResult && healthResult.warning && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{healthResult.warning}</div>
        </div>
      )}

      {/* Actions (Primary Config) */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex-1 border-slate-700 hover:bg-slate-800"
        >
          {isTesting ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <CheckCircle2 className="mr-2 text-slate-400" size={16} />
          )}
          {isTesting
            ? t("settings.ai.testing")
            : t("settings.ai.test_connection")}
        </Button>
        <Button
          onClick={handleSaveConfig}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500"
        >
          {t("settings.ai.save_settings")}
        </Button>
      </div>

      <div className="border-t border-slate-800/60 pt-6 mt-2 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Cpu size={14} className="text-slate-500" />
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            HalTest Advanced Behaviors
          </Label>
        </div>

        {/* HalTest Experience Vault (Clean Version) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                <Server size={18} />
              </div>
              <div>
                <Label className="text-sm font-semibold text-white">
                  {t("settings.ai.experience_vault")}
                </Label>
                <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed mt-1">
                  {t("settings.ai.experience_vault_desc")}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aiConfig.useExperienceVault ?? true}
                onChange={(e) =>
                  updateConfig({ useExperienceVault: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
