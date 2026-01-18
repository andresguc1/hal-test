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

export function KeyVaultPanel() {
  const { vaultKeys, loadVaultKeys } = useSettings(); // Use context
  const [isLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Form State
  const [newKey, setNewKey] = useState({
    alias: "",
    provider: "openai",
    key: "",
    baseUrl: "",
  });

  // Sync with context keys
  const keys = vaultKeys;

  const handleAddKey = async () => {
    if (!newKey.alias || !newKey.key) {
      toast.error("Alias and Key are required");
      return;
    }

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKey),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Key saved to Vault");
        setNewKey({ alias: "", provider: "openai", key: "", baseUrl: "" });
        setIsAdding(false);
        loadVaultKeys(); // Refresh context
        window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
      } else {
        toast.error(data.message || "Failed to save key");
      }
    } catch {
      toast.error("Error saving key");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      toast.success("Key deleted");
      loadVaultKeys(); // Refresh context
      window.dispatchEvent(new Event("hal_keys_updated")); // Notify others
    } catch {
      toast.error("Failed to delete");
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

          <Button
            onClick={handleAddKey}
            className="w-full bg-green-600 hover:bg-green-500"
          >
            Save to Vault
          </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-900/10"
                  onClick={() => handleDelete(k.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
