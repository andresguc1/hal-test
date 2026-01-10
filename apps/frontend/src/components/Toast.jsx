import React from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { ToastContext } from "./toastContext";
export { ToastContext };
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// 1. STYLE CONSTANTS (Titles removed to be handled by i18n)
const TOAST_STYLES = {
  success: {
    border: "border-l-emerald-500",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    iconColor: "text-emerald-500",
    icon: CheckCircle,
    titleKey: "common.success",
  },
  error: {
    border: "border-l-rose-500",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    iconColor: "text-rose-500",
    icon: XCircle,
    titleKey: "common.error",
  },
  info: {
    border: "border-l-blue-500",
    shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    iconColor: "text-blue-500",
    icon: Info,
    titleKey: "common.info",
  },
  loading: {
    border: "border-l-amber-500",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    iconColor: "text-amber-500",
    icon: Loader2,
    titleKey: "common.processing",
  },
};

// 2. CUSTOM TOAST COMPONENT
const HalToast = ({ type, message, id }) => {
  const { t } = useTranslation(); // Hook used here
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-4 p-4 pr-10 w-[350px] rounded-lg overflow-hidden transition-all",
        "bg-[#121212]/90 backdrop-blur-xl border border-white/5",
        "border-l-[3px]",
        style.border,
        style.shadow,
      )}
    >
      {/* ICON */}
      <div className={cn("mt-0.5 shrink-0", style.iconColor)}>
        <Icon size={20} className={type === "loading" ? "animate-spin" : ""} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold text-white leading-none tracking-wide">
          {t(style.titleKey, { defaultValue: type.toUpperCase() })}
        </h4>
        <p className="text-xs text-white/60 font-medium leading-relaxed">
          {message}
        </p>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={() => sonnerToast.dismiss(id)}
        className="absolute top-2 right-2 p-1 text-white/20 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>

      {/* PROGRESS BAR (Decorative) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <div
          className={cn(
            "h-full animate-[progress_4s_linear_forwards] origin-left",
            style.iconColor.replace("text-", "bg-"),
          )}
        />
      </div>
    </div>
  );
};

// 3. CONTEXT & PROVIDER
// We keep the Context API compatible with the old hook
export const ToastProvider = ({ children }) => {
  // Wrapper functions mapping to Sonner
  const showToast = (message, type = "info") => {
    sonnerToast.custom(
      (id) => <HalToast id={id} type={type} message={message} />,
      { duration: 4000 },
    );
  };

  const toastApi = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    info: (msg) => showToast(msg, "info"),
    loading: (msg) => showToast(msg, "loading"),
    custom: showToast,
    dismiss: (id) => sonnerToast.dismiss(id),
  };

  return (
    <ToastContext.Provider value={toastApi}>{children}</ToastContext.Provider>
  );
};

// Exporting the UI component to be used in App.jsx for layout control
export const HalToaster = ({ offsetRight = 0 }) => {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors
      theme="dark"
      style={{
        marginRight: offsetRight,
        transition: "margin-right 0.3s ease-in-out",
      }}
      toastOptions={{
        style: { background: "transparent", border: "none", boxShadow: "none" },
        className: "!bg-transparent !border-0 !shadow-none p-0",
      }}
    />
  );
};
