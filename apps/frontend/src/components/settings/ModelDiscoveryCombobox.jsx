import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Cpu, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModelDiscovery } from "@/hooks/useModelDiscovery";

const STATUS_META = {
  IDLE: "text-slate-400",
  LOADING: "text-slate-400",
  SUCCESS: "text-emerald-400",
  NO_MODELS_FOUND: "text-amber-400",
  FAILED: "text-red-400",
  TIMEOUT: "text-red-400",
  UNAUTHORIZED: "text-red-400",
  CONNECTION_REFUSED: "text-red-400",
  NOT_SUPPORTED: "text-amber-400",
  REJECTED: "text-red-400",
  PARTIAL: "text-amber-400",
  OFFLINE: "text-slate-400",
  CUSTOM: "text-slate-400",
};

// Mirror of LLMFactory conditions for fallback auto-selection when the server
// does not expose model sizes (OpenAI-compatible listings).
const RECOMMENDED_LOCAL_MODELS = ["gemma3:2b", "phi4:mini"];

const AUTO_DISCOVER_DEBOUNCE_MS = 600;

function formatModelSize(bytes) {
  const size = Number(bytes);
  if (!size || size <= 0) return null;
  const gb = size / 1024 / 1024 / 1024;
  return gb >= 1
    ? `${gb.toFixed(1)} GB`
    : `${Math.round(size / 1024 / 1024)} MB`;
}

function smallestModel(models) {
  const bySize = [...models]
    .filter((m) => Number(m.size) > 0)
    .sort((a, b) => Number(a.size) - Number(b.size));
  if (bySize.length > 0) return bySize[0];
  return (
    models.find((m) =>
      RECOMMENDED_LOCAL_MODELS.some(
        (r) =>
          m.id === r || m.id.startsWith(`${r}:`) || m.id.startsWith(`${r}-`),
      ),
    ) || models[0]
  );
}

function stateLabelKey(state) {
  switch (state) {
    case "LOADING":
      return "settings.ai.model_discovery.loading";
    case "SUCCESS":
      return "settings.ai.model_discovery.success";
    case "NO_MODELS_FOUND":
      return "settings.ai.model_discovery.none";
    case "TIMEOUT":
      return "settings.ai.model_discovery.timeout";
    case "UNAUTHORIZED":
      return "settings.ai.model_discovery.unauthorized";
    case "CONNECTION_REFUSED":
      return "settings.ai.model_discovery.connection";
    case "NOT_SUPPORTED":
      return "settings.ai.model_discovery.not_supported";
    case "REJECTED":
      return "settings.ai.model_discovery.rejected";
    default:
      return "settings.ai.model_discovery.failed";
  }
}

/**
 * Model Selector: editable model identifier (backwards compatible) plus
 * a discovery dropdown fed by POST /api/ai/discover-models.
 * For Ollama, the model list auto-populates (debounced) as soon as a Base URL
 * is configured; for cloud providers discovery stays manual.
 */
export const ModelDiscoveryCombobox = forwardRef(
  function ModelDiscoveryCombobox(
    { value, onChange, provider, baseUrl, apiKey, defaultModel },
    ref,
  ) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const autoDiscoverTimer = useRef(null);
    const { state, models, error, loading, discover } = useModelDiscovery({
      provider,
      baseUrl,
      apiKey,
    });

    useImperativeHandle(ref, () => ({ discover }));

    // Auto-discover for Ollama when the Base URL is configured/settles.
    useEffect(() => {
      if (provider !== "ollama") return undefined;
      if (!baseUrl || String(baseUrl).trim().length < 7) return undefined;

      clearTimeout(autoDiscoverTimer.current);
      autoDiscoverTimer.current = setTimeout(() => {
        autoDiscoverTimer.current = null;
        discover();
      }, AUTO_DISCOVER_DEBOUNCE_MS);

      return () => clearTimeout(autoDiscoverTimer.current);
    }, [provider, baseUrl, discover]);

    // Auto-select the smallest installed model once the Ollama list arrives,
    // but only when the user has not picked/typed a meaningful identifier yet.
    useEffect(() => {
      if (provider !== "ollama") return;
      if (state !== "SUCCESS" || models.length === 0) return;

      const current = String(value || "").trim();
      if (current && current !== String(defaultModel || "").trim()) return;

      const preferred = smallestModel(models);
      if (preferred && preferred.id !== current) {
        onChange(preferred.id);
      }
    }, [state, models, value, provider, defaultModel, onChange]);

    const tone = STATUS_META[state] || STATUS_META.IDLE;

    return (
      <div>
        <div className="relative">
          <Cpu
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("settings.ai.custom_model_identifier")}
            className={`bg-slate-950 border-slate-800 pl-9 pr-16 font-mono text-sm ${value ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : ""}`}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => discover()}
              disabled={loading}
              className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30"
              title={t("settings.ai.model_discovery.discover")}
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
            </Button>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                  title={t("settings.ai.model_discovery.title")}
                >
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400">
                  {t("settings.ai.model_discovery.title")}
                </DropdownMenuLabel>
                {state !== "IDLE" && (
                  <div className={`px-2 py-1 text-[10px] ${tone}`}>
                    {error || t(stateLabelKey(state))}
                    {state === "SUCCESS" && models.length > 0 && (
                      <span className="text-slate-500 ml-1">
                        •{" "}
                        {t("settings.ai.model_discovery.found_n", {
                          count: models.length,
                        })}
                      </span>
                    )}
                  </div>
                )}
                <DropdownMenuSeparator />
                {models.length > 0 ? (
                  <ScrollArea className="max-h-56">
                    {models.map((model) => {
                      const sizeLabel = formatModelSize(model.size);
                      return (
                        <DropdownMenuItem
                          key={model.id}
                          onSelect={() => onChange(model.id)}
                          className="flex items-center gap-2 text-xs font-mono"
                        >
                          <span className="flex-1 truncate">
                            {model.label || model.id}
                          </span>
                          {sizeLabel && (
                            <span className="text-[10px] text-slate-500">
                              {sizeLabel}
                            </span>
                          )}
                          {value === model.id && (
                            <Check size={12} className="text-emerald-400" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </ScrollArea>
                ) : (
                  <div className="px-2 py-2 text-[10px] text-slate-500">
                    {t("settings.ai.model_discovery.discover_hint")}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {state !== "IDLE" && (
          <p
            className={`text-[10px] mt-1 leading-tight flex items-center gap-1 ${tone}`}
          >
            {loading && <Loader2 size={10} className="animate-spin" />}
            <span>{error || t(stateLabelKey(state))}</span>
            {state === "SUCCESS" && models.length > 0 && (
              <span className="text-slate-500">
                •{" "}
                {t("settings.ai.model_discovery.found_n", {
                  count: models.length,
                })}
              </span>
            )}
          </p>
        )}
      </div>
    );
  },
);
