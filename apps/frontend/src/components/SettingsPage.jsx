import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Upload,
  Key,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui-custom/Button";
import { Label } from "@/components/ui-custom/Label";
import { Select, SelectItem } from "@/components/ui-custom/Select";
import { Input } from "@/components/ui-custom/Input";

// Simple Avatar replacement for Zero-Dependency
const CustomAvatar = ({ src, fallback, className }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full shrink-0",
        className,
      )}
    >
      {src ? (
        <img src={src} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-hal-neutral-800 text-hal-neutral-500">
          {fallback}
        </div>
      )}
    </div>
  );
};

/**
 * Reusable PasswordInput Component with deep black styling
 */
const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <Input
        type={show ? "text" : "password"}
        ref={ref}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-hal-neutral-500 hover:text-hal-neutral-300 transition-colors duration-200 focus:outline-none"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export default function SettingsPage({ onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    localStorage.getItem("hal_user_avatar") || "",
  );

  const defaultValues = {
    selectedModel: localStorage.getItem("hal_selected_model") || "gpt-4o-mini",
    openaiKey: localStorage.getItem("hal_openai_key") || "",
    googleKey: localStorage.getItem("hal_google_key") || "",
    anthropicKey: localStorage.getItem("hal_anthropic_key") || "",
  };

  const { control, handleSubmit, register, watch } = useForm({
    defaultValues,
  });

  const selectedModel = watch("selectedModel");

  const getProvider = (model) => {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gemini")) return "google";
    return "openai";
  };

  const activeProvider = getProvider(selectedModel);

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    localStorage.setItem("hal_selected_model", data.selectedModel);
    localStorage.setItem("hal_openai_key", data.openaiKey);
    localStorage.setItem("hal_google_key", data.googleKey);
    localStorage.setItem("hal_anthropic_key", data.anthropicKey);
    if (avatarPreview) localStorage.setItem("hal_user_avatar", avatarPreview);

    window.dispatchEvent(new Event("storage"));

    setIsLoading(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onBack) onBack();
    }, 800);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const modelOptions = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ];

  return (
    // Full-screen overlay on top of everything
    <div className="fixed inset-0 z-50 bg-hal-neutral-950/95 backdrop-blur-md flex flex-col">
      {/* Header - Fixed Top */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-hal-neutral-800 shrink-0 bg-hal-neutral-950/50 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-hal-neutral-400 hover:text-hal-neutral-100 transition-colors duration-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-hal-neutral-100">
          Settings
        </span>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-2xl mx-auto">
          {/* Card: Profile Picture - FULLY CENTERED */}
          <div className="border border-hal-neutral-800 rounded-lg bg-hal-neutral-900/40 backdrop-blur-sm hover:border-hal-neutral-700 transition-colors duration-200">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-xs font-bold text-hal-neutral-500 uppercase tracking-widest text-center mb-4">
                Profile Picture
              </div>
              <div className="relative mb-4">
                <CustomAvatar
                  src={avatarPreview}
                  className="h-24 w-24 border-2 border-hal-neutral-700 hover:border-hal-primary-500 transition-colors duration-200"
                  fallback={<User size={32} />}
                />
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-[10px] text-hal-neutral-500 mb-3">
                JPG, PNG • 1MB Max
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-hal-neutral-700 text-hal-neutral-300 hover:text-white hover:bg-hal-neutral-800 hover:border-hal-primary-500 bg-transparent relative transition-all duration-200"
              >
                <Upload size={14} className="mr-2" />
                Upload New
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Button>
            </div>
          </div>

          {/* Card: AI Configuration */}
          <div className="border border-hal-neutral-800 rounded-lg p-4 bg-hal-neutral-900/40 backdrop-blur-sm hover:border-hal-neutral-700 transition-colors duration-200">
            <div className="text-[10px] font-extrabold text-hal-neutral-600 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
              <Bot className="h-3 w-3" />
              <span>AI Configuration</span>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-hal-neutral-500 font-medium">
                Default Model
              </Label>
              <Controller
                name="selectedModel"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    {modelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
              <p className="text-[10px] text-hal-neutral-500 italic">
                Used for all AI operations.
              </p>
            </div>
          </div>

          {/* Card: Access Credentials */}
          <div className="border border-hal-neutral-800 rounded-lg p-4 bg-hal-neutral-900/40 backdrop-blur-sm hover:border-hal-neutral-700 transition-colors duration-200">
            <div className="text-[10px] font-extrabold text-hal-neutral-600 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
              <Key className="h-3 w-3" />
              <span>Access Credentials</span>
            </div>
            <div className="space-y-3">
              <div className="min-h-[40px]">
                {activeProvider === "openai" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-hal-neutral-500 font-medium">
                      OpenAI Key
                    </Label>
                    <PasswordInput
                      placeholder="sk-..."
                      {...register("openaiKey")}
                    />
                  </div>
                )}

                {activeProvider === "google" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-hal-neutral-500 font-medium">
                      Google Key
                    </Label>
                    <PasswordInput
                      placeholder="AIza..."
                      {...register("googleKey")}
                    />
                  </div>
                )}

                {activeProvider === "anthropic" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-hal-neutral-500 font-medium">
                      Anthropic Key
                    </Label>
                    <PasswordInput
                      placeholder="sk-ant-..."
                      {...register("anthropicKey")}
                    />
                  </div>
                )}
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-2.5 rounded bg-hal-neutral-950/50 border border-hal-neutral-900">
                <ShieldAlert
                  size={13}
                  className="text-hal-neutral-600 mt-0.5 shrink-0"
                />
                <p className="text-[10px] text-hal-neutral-500 leading-relaxed">
                  Keys stored locally. Never transmitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Sticky Bottom */}
      <footer className="flex justify-center items-center gap-6 p-4 border-t border-hal-neutral-800 bg-hal-neutral-950 shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="h-10 px-6 text-hal-neutral-400 hover:text-hal-neutral-100 hover:bg-hal-neutral-900 transition-all duration-200"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className={cn(
            "h-10 px-6 shadow-md font-medium transition-all duration-200",
            isSuccess
              ? "bg-hal-success-600 hover:bg-hal-success-700 text-white"
              : "bg-hal-primary-500 text-white hover:bg-hal-primary-600",
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : isSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </footer>
    </div>
  );
}
