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
    selectedModel: localStorage.getItem("hal_selected_model") || "gemma3:2b",
    ollamaBaseUrl:
      localStorage.getItem("hal_ollama_base_url") || "http://127.0.0.1:11434",
  };

  const { handleSubmit } = useForm({
    defaultValues,
  });

  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

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

          {/* AI Settings are now managed via the dedicated AI & Integrations panel */}
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
