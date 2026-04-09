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
  const baseUrl =
    aiConfig.baseUrl ||
    (isOllama ? "http://127.0.0.1:11434" : "https://openrouter.ai/api/v1");
  const model =
    aiConfig.selectedModel ||
    (isOllama ? "gemma3" : "google/gemini-2.0-flash-001");
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
      });

      if (res.success) {
        toast.success(t("settings.ai.connection_success", { model }));
      } else {
        toast.error(res.error || t("settings.ai.connect_error"));
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
            const updates = { activeProvider: val };

            // Logic to switch defaults if they hasn't been significantly changed
            // or to just help the user by providing the right base URL
            if (val === "openrouter") {
              updates.baseUrl = "https://openrouter.ai/api/v1";
              updates.selectedModel = "google/gemini-2.0-flash-001";
            } else if (val === "ollama") {
              updates.baseUrl = "http://127.0.0.1:11434";
              updates.selectedModel = "gemma3";
            }

            updateConfig(updates);
          }}
        >
          <SelectTrigger className="bg-slate-950 border-slate-800">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
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
            placeholder={
              isOllama
                ? "http://127.0.0.1:11434"
                : "https://openrouter.ai/api/v1"
            }
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
            placeholder={isOllama ? "gemma3" : "google/gemini-2.0-flash-001"}
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

      {/* Health / Connection Result Badge */}
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

      {/* Actions */}
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
    </div>
  );
}
