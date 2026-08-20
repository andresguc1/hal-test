import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ConfirmDialog = ({
  isOpen,
  title = "Confirm action",
  description = "Are you sure you want to proceed?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      }

      if (e.key === "Tab") {
        const modal = dialogRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll(
          'button, input, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyles = {
    destructive:
      "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30",
    warning:
      "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30",
    primary:
      "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-indigo-500/30",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={cn(
          "relative z-10 w-full max-w-sm mx-4",
          "bg-[#0f172a]/95 backdrop-blur-xl",
          "border border-white/10 rounded-2xl shadow-2xl",
          "p-5",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex-shrink-0 p-2 rounded-full",
              variant === "destructive" && "bg-red-500/10",
              variant === "warning" && "bg-amber-500/10",
              variant === "primary" && "bg-indigo-500/10",
            )}
          >
            <AlertTriangle
              size={18}
              className={cn(
                variant === "destructive" && "text-red-400",
                variant === "warning" && "text-amber-400",
                variant === "primary" && "text-indigo-400",
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-sm font-semibold text-white mb-1"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-description"
              className="text-xs text-slate-400 leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg",
              "text-slate-400 hover:text-white",
              "bg-white/5 hover:bg-white/10",
              "transition-colors",
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg",
              "border transition-colors",
              confirmStyles[variant] || confirmStyles.destructive,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialog;
