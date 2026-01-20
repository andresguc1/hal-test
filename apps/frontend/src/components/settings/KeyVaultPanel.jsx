import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
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
import { useSettings } from "@/context/SettingsContext";
import providersData from "@/data/providers.json";
import { api } from "../../utils/api";

export function KeyVaultPanel() {
  const { vaultKeys, loadVaultKeys } = useSettings(); // Use context
  const toast = useToast();
  const keys = vaultKeys;
  const [isLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newKey, setNewKey] = useState({
    alias: "",
    provider: "openai",
    key: "",
    baseUrl: "",
  });

  const handleTestConnection = async (e) => {
    e.preventDefault(); // Prevent form submission if inside form
    if (!newKey.key) {
      toast.error("Enter an API Key to test");
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
        toast.success(res.message || "Connection Successful!");
      } else {
        toast.error(res.message || "Connection Failed");
      }
    } catch (error) {
      toast.error(error.message || "Validation Error");
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
        toast.success(res.message || "Connection Successful!");
      } else {
        toast.error((res && res.message) || "Connection Failed");
      }
    } catch (e) {
      toast.error(e.message || "Validation Error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.alias || !newKey.key) {
      toast.error("Alias and Key are required");
      return;
    }

    setIsSaving(true);
    try {
      const data = await api.post("/keys", newKey);

      if (data.success) {
        toast.success("Key saved to Vault");
        setNewKey({ alias: "", provider: "openai", key: "", baseUrl: "" });
        setIsAdding(false);
        loadVaultKeys(); // Refresh context
        window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
      } else {
        // Now using specific message from backend response
        toast.error(data.message || "Failed to save key");
      }
    } catch (error) {
      // Error is now an Error object with the message from backend
      toast.error(error.message || "Error saving key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await api.delete(`/keys/${id}`);
      toast.success("Key deleted");
      loadVaultKeys(); // Refresh context
      window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-green-500" size={20} />
          <h3 className="text-lg font-medium text-white">Secure Wallet</h3>
        </div>
        <Button
          size="sm"
          variant={isAdding ? "destructive" : "secondary"}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} className="mr-2" /> Add Key
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Provider</Label>
              <Select
                value={newKey.provider}
                onValueChange={(val) => setNewKey({ ...newKey, provider: val })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providersData.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">
                Alias (e.g. My Personal Key)
              </Label>
              <Input
                value={newKey.alias}
                onChange={(e) =>
                  setNewKey({ ...newKey, alias: e.target.value })
                }
                className="bg-slate-950 border-slate-800"
                placeholder="Work Account"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-400">
              API Key {newKey.provider === "ollama" && "(Optional for Ollama)"}
            </Label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-3 text-slate-500" />
              <Input
                type="password"
                autoComplete="new-password"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                className="bg-slate-950 border-slate-800 pl-9 font-mono text-sm"
                placeholder="sk-..."
              />
            </div>
          </div>

          {/* Optional BaseURL for Ollama/Custom */}
          {(newKey.provider === "ollama" || newKey.provider === "openai") && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">
                Base URL (Optional)
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
                  placeholder="http://localhost:11434/v1"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="flex-1 border-slate-700 hover:bg-slate-800"
            >
              {isTesting ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <CheckCircle2 className="mr-2 text-slate-400" size={16} />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleAddKey}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-500"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              {isSaving ? "Saving..." : "Save to Vault"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-slate-500" />
          </div>
        ) : keys.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">
            Wallet is empty. Add a key to start.
          </p>
        ) : (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800/50 rounded-md hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                    {k.provider.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {k.alias}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {k.maskedKey}
                      {k.baseUrl && (
                        <span className="text-blue-500/50 ml-1">
                          • Custom URL
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:text-green-400 hover:bg-green-900/8"
                    onClick={() => handleTestExisting(k)}
                    title="Test connection"
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
                    onClick={() => handleDelete(k.id)}
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
