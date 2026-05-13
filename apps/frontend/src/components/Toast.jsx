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

// 1. STYLE CONSTANTS
const TOAST_STYLES = {
  success: {
    border: "border-l-emerald-500",
    iconColor: "text-emerald-500",
    icon: CheckCircle,
    titleKey: "common.success",
  },
  error: {
    border: "border-l-rose-500",
    iconColor: "text-rose-500",
    icon: XCircle,
    titleKey: "common.error",
  },
  info: {
    border: "border-l-blue-500",
    iconColor: "text-blue-500",
    icon: Info,
    titleKey: "common.info",
  },
  loading: {
    border: "border-l-amber-500",
    iconColor: "text-amber-500",
    icon: Loader2,
    titleKey: "common.processing",
  },
};

// 2. CUSTOM TOAST COMPONENT
const HalToast = ({ type, message, id }) => {
  const { t } = useTranslation();
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative flex items-start gap-4 p-4 pr-10 w-[350px] rounded-lg overflow-hidden transition-all duration-400",
        "bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border-ui)]",
        "border-l-[3px]",
        style.border,
        "shadow-2xl",
      )}
    >
      {/* ICON */}
      <div className={cn("mt-0.5 shrink-0", style.iconColor)}>
        <Icon size={20} className={type === "loading" ? "animate-spin" : ""} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold text-[var(--text-main)] leading-none tracking-wide">
          {t(style.titleKey, { defaultValue: type.toUpperCase() })}
        </h4>
        <div className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
          {message}
        </div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={() => sonnerToast.dismiss(id)}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
      >
        <X size={14} aria-hidden="true" />
      </button>

      {/* PROGRESS BAR (Decorative) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--border-ui)]">
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
export const ToastProvider = ({ children }) => {
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

export const HalToaster = ({ offsetRight = 0 }) => {
  return (
    <Toaster
      expand={true}
      richColors
      theme="system"
      position="top-center" // Force top-center for better visibility
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
