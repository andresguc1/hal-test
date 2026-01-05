import React, { useState, useEffect } from "react";
import { Key, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsDialog({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [keys, setKeys] = useState({ openai: "", google: "", anthropic: "" });

  useEffect(() => {
    if (isOpen) {
      setKeys({
        openai: localStorage.getItem("hal_openai_key") || "",
        google: localStorage.getItem("hal_google_key") || "",
        anthropic: localStorage.getItem("hal_anthropic_key") || "",
      });
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("hal_openai_key", keys.openai.trim());
    localStorage.setItem("hal_google_key", keys.google.trim());
    localStorage.setItem("hal_anthropic_key", keys.anthropic.trim());

    // Use sonner toast if available, otherwise fallback or just close
    if (toast) {
      toast.success(t("common.saved", "Settings saved successfully"));
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#1d2024] text-gray-100 border-[#2c2f33]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Key className="w-5 h-5 text-primary" />
            {t("settings.title", "Settings")}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Internal configurations for AI providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="openai" className="text-gray-300">OpenAI API Key</Label>
            <Input
              id="openai"
              type="password"
              placeholder="sk-..."
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              className="bg-[#0b0c10] border-[#2c2f33] text-white focus-visible:ring-primary"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="google" className="text-gray-300">Google Gemini API Key</Label>
            <Input
              id="google"
              type="password"
              placeholder="AIza..."
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              className="bg-[#0b0c10] border-[#2c2f33] text-white focus-visible:ring-primary"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="anthropic" className="text-gray-300">Anthropic API Key</Label>
            <Input
              id="anthropic"
              type="password"
              placeholder="sk-ant-..."
              value={keys.anthropic}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              className="bg-[#0b0c10] border-[#2c2f33] text-white focus-visible:ring-primary"
            />
          </div>

          <p className="text-xs text-gray-500">
            Keys are stored locally in your browser.
          </p>
        </div>

        <DialogFooter className="flex-row justify-end space-x-2">
          <Button variant="outline" onClick={onClose} className="border-[#2c2f33] text-gray-300 hover:bg-[#2c2f33] hover:text-white">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
