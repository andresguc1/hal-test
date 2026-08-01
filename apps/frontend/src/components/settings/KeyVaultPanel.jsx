import React, { useState } from "react";
import {
  Wallet,
  Plus,
  Key,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { useSettings } from "@/context/SettingsContext";
import { api } from "../../utils/api";

export function KeyVaultPanel() {
  const { t } = useTranslation();
  const { vaultKeys, loadVaultKeys, setVaultKeys } = useSettings(); // Use context
  const toast = useToast();
  const [isLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newKey, setNewKey] = useState({
    alias: "",
    provider: "ollama",
    key: "",
    baseUrl: "http://127.0.0.1:11434",
  });

  const handleTestConnection = async (e) => {
    e.preventDefault(); // Prevent form submission if inside form
    if (!newKey.key && newKey.provider !== "ollama") {
      toast.error(t("settings.vault.api_key_required"));
      return;
    }

    setIsTesting(true);
    try {
      // Use the generic validation endpoint
      const res = await api.post("/ai/validate", {
        provider: newKey.provider,
        apiKey: newKey.key,
        baseUrl: newKey.baseUrl,
      });

      if (res.success) {
        toast.success(t("settings.vault.test_success"));
      } else {
        toast.error(`${t("settings.vault.test_failed")}: ${res.error}`);
      }
    } catch (error) {
      toast.error(error.message || t("settings.vault.validation_error"));
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestExisting = async (k) => {
    // Test an existing saved key. Note: if the backend stores masked keys and
    // does not return the raw API key, this endpoint must support validating
    // by key id. Here we attempt to validate using the `k.key` value returned
    // by the vault (assumes backend provides a usable value or an id).
    setIsTesting(true);
    try {
      const res = await api.post("/ai/validate", {
        provider: k.provider,
        apiKey: k.key,
        baseUrl: k.baseUrl,
      });

      if (res && res.success) {
        toast.success(t("settings.vault.test_success"));
      } else {
        toast.error(`${t("settings.vault.test_failed")}: ${res.error}`);
      }
    } catch (e) {
      toast.error(e.message || t("settings.vault.validation_error"));
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.alias || (!newKey.key && newKey.provider !== "ollama")) {
      toast.error(t("settings.vault.alias_key_required"));
      return;
    }

    setIsSaving(true);
    try {
      const data = await api.post("/keys", newKey);

      if (data.success) {
        toast.success(t("settings.vault.key_saved"));
        setNewKey({
          alias: "",
          provider: "ollama",
          key: "",
          baseUrl: "http://127.0.0.1:11434",
        });
        setIsAdding(false);
        loadVaultKeys(); // Refresh context
        window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
      } else {
        // Now using specific message from backend response
        toast.error(data.message || t("settings.vault.failed_to_save_key"));
      }
    } catch (error) {
      // Error is now an Error object with the message from backend
      toast.error(error.message || t("settings.vault.error_saving_key"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm(t("settings.vault.delete_confirm"))) return;
    try {
      await api.delete(`/keys/${id}`);
      setVaultKeys(vaultKeys.filter((k) => k.id !== id));
      toast.success(t("settings.vault.key_deleted"));
      loadVaultKeys(); // Refresh context
      window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
    } catch (error) {
      toast.error(error.message || t("settings.vault.delete_failed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-indigo-400" size={20} />
          <h3 className="text-lg font-medium text-white">
            {t("settings.vault.title")}
          </h3>
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
          >
            <Plus size={16} className="mr-2" /> {t("settings.vault.add_key")}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">
                {t("settings.vault.provider")}
              </Label>
              <Select
                value={newKey.provider}
                onValueChange={(val) => {
                  let defaultUrl = "http://127.0.0.1:11434";
                  if (val === "openai")
                    defaultUrl = "https://api.openai.com/v1";
                  else if (val === "anthropic")
                    defaultUrl = "https://api.anthropic.com/v1";
                  else if (val === "google")
                    defaultUrl =
                      "https://generativelanguage.googleapis.com/v1beta";
                  else if (val === "openrouter")
                    defaultUrl = "https://openrouter.ai/api/v1";

                  setNewKey({ ...newKey, provider: val, baseUrl: defaultUrl });
                }}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="ollama">{t("settings.ai.providers.ollama", "Ollama (Local)")}</SelectItem>
                  <SelectItem value="openai">{t("settings.ai.providers.openai", "OpenAI")}</SelectItem>
                  <SelectItem value="anthropic">{t("settings.ai.providers.anthropic", "Claude / Anthropic")}</SelectItem>
                  <SelectItem value="google">{t("settings.ai.providers.google", "Gemini / Google")}</SelectItem>
                  <SelectItem value="openrouter">{t("settings.ai.providers.openrouter", "OpenRouter")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">
                {t("settings.vault.alias")}
              </Label>
              <Input
                value={newKey.alias}
                onChange={(e) =>
                  setNewKey({ ...newKey, alias: e.target.value })
                }
                placeholder={t("settings.vault.alias_placeholder")}
                className="bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-400">
              {t("settings.vault.api_key")}{" "}
              {newKey.provider === "ollama" &&
                t("settings.vault.optional_ollama")}
            </Label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-3 text-slate-500" />
              <Input
                type="password"
                autoComplete="new-password"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
                placeholder={t("settings.vault.key_placeholder", "sk-...")}
              />
            </div>
          </div>

          {/* Optional BaseURL for Ollama/Custom */}
          {(newKey.provider === "ollama" ||
            newKey.provider === "openai" ||
            newKey.provider === "anthropic" ||
            newKey.provider === "google" ||
            newKey.provider === "openrouter") && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">
                {t("settings.vault.base_url_optional")}
              </Label>
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-3 text-slate-500"
                />
                <Input
                  value={newKey.baseUrl}
                  onChange={(e) =>
                    setNewKey({ ...newKey, baseUrl: e.target.value })
                  }
                  className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
                  placeholder="http://127.0.0.1:11434/v1"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={
                isTesting || (!newKey.key && newKey.provider !== "ollama")
              }
              className="flex-1 border-slate-700 hover:bg-slate-800"
            >
              {isTesting ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Globe className="mr-2 text-slate-400" size={16} />
              )}
              {t("settings.vault.test_connection")}
            </Button>
            <Button
              onClick={handleAddKey}
              disabled={
                isSaving || (!newKey.key && newKey.provider !== "ollama")
              }
              className="flex-1 bg-indigo-600 hover:bg-indigo-500"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <CheckCircle2 className="mr-2" size={16} />
              )}
              {isSaving
                ? t("settings.vault.saving")
                : t("settings.vault.save_to_vault")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsAdding(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              {t("settings.vault.cancel")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-slate-500" />
          </div>
        ) : vaultKeys.length === 0 && !isAdding ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <p className="text-slate-500 text-sm tracking-tight">
              {t("settings.vault.empty_wallet")}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {vaultKeys.map((k) => (
              <div
                key={k.id}
                className="group flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {k.provider === "ollama" ? (
                      <Cpu size={16} />
                    ) : (
                      <Key size={16} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {k.alias}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {k.provider} • ****{k.key?.slice(-4) || "LOCAL"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-green-400 hover:bg-green-900/8"
                    onClick={() => handleTestExisting(k)}
                    title={t("settings.vault.test_connection")}
                  >
                    {isTesting ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-900/10"
                    onClick={() => handleDeleteKey(k.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
