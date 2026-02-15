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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { api } from "../../utils/api";

/**
 * AISettingsPanel
 * Configures the LLM provider connection: Base URL, Model Name, Temperature.
 * Includes a health-check "Test Connection" button for Ollama.
 */
export function AISettingsPanel({ aiConfig, setAiConfig }) {
  const toast = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState(null);

  const isOllama = aiConfig.activeProvider === "ollama";

  const baseUrl = aiConfig.baseUrl || "http://localhost:11434";
  const model = aiConfig.selectedModel || "gemma3";
  const temperature = aiConfig.temperature ?? 0.7;

  const updateConfig = (updates) => {
    setAiConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveConfig = () => {
    const configToSave = {
      ...aiConfig,
      baseUrl,
      temperature,
    };
    localStorage.setItem("hal_ai_config", JSON.stringify(configToSave));
    window.dispatchEvent(new Event("hal_ai_config_updated"));
    toast.success("AI settings saved");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setHealthResult(null);

    try {
      const res = await api.get(
        `/ai/health?baseUrl=${encodeURIComponent(baseUrl)}&model=${encodeURIComponent(model)}`,
      );

      setHealthResult(res);

      if (res.success) {
        toast.success(`Connected! Ollama is running with ${model} available.`);
      } else if (res.ollamaRunning && !res.modelLoaded) {
        toast.error(
          `Ollama is running but model '${model}' is not loaded. Run: ollama pull ${model}`,
        );
      } else {
        toast.error(res.error || "Could not connect to Ollama");
      }
    } catch (error) {
      setHealthResult({ success: false, error: error.message });
      toast.error(error.message || "Health check failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Server className="text-indigo-400" size={20} />
        <h3 className="text-lg font-medium text-white">
          LLM Provider Settings
        </h3>
      </div>
      <p className="text-slate-500 text-xs -mt-3">
        Configure the connection to your AI model. For local models, use Ollama.
      </p>

      {/* Base URL */}
      {isOllama && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Base URL</Label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-3 text-slate-500" />
            <Input
              value={baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
              placeholder="http://localhost:11434"
            />
          </div>
        </div>
      )}

      {/* Model Name (Custom Override) */}
      {isOllama && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">
            Model Name (Override)
          </Label>
          <div className="relative">
            <Cpu size={14} className="absolute left-3 top-3 text-slate-500" />
            <Input
              value={model}
              onChange={(e) => updateConfig({ selectedModel: e.target.value })}
              className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
              placeholder="gemma3"
            />
          </div>
          <p className="text-[10px] text-slate-600">
            Enter any model name pulled on your Ollama instance
          </p>
        </div>
      )}

      {/* Temperature */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400 flex items-center gap-2">
          <Thermometer size={12} />
          Temperature: {temperature.toFixed(2)}
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
          <span>Precise (0.0)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* Health Result Badge */}
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
          ) : healthResult.ollamaRunning ? (
            <AlertTriangle size={14} className="text-amber-400" />
          ) : (
            <XCircle size={14} className="text-red-400" />
          )}
          <div className="flex-1">
            {healthResult.success ? (
              <span>
                Ollama connected • Model{" "}
                <code className="font-mono text-green-400">{model}</code> loaded
              </span>
            ) : healthResult.ollamaRunning ? (
              <span>
                Ollama running but{" "}
                <code className="font-mono text-amber-400">{model}</code> not
                found. <code className="font-mono">ollama pull {model}</code>
              </span>
            ) : (
              <span>{healthResult.error || "Ollama not reachable"}</span>
            )}
          </div>
          {healthResult.models?.length > 0 && (
            <span className="text-slate-500 text-[10px]">
              {healthResult.models.length} model
              {healthResult.models.length !== 1 ? "s" : ""} installed
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOllama && (
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
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
        )}
        <Button
          onClick={handleSaveConfig}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
