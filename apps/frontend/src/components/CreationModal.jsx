import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CreationModal = ({
  isOpen,
  title,
  onClose,
  onConfirm,
  placeholder = "Enter name...",
  descriptionPlaceholder = "Optional description...",
  isLoading = false,
}) => {
  const [mode, setMode] = useState("standard");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setPrompt("");
      setMode("standard");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
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
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (isLoading) return;

    if (mode === "standard") {
      if (name.trim()) {
        onConfirm(name.trim(), description.trim() || undefined);
        onClose();
      }
    } else {
      if (prompt.trim()) {
        onConfirm({ mode: "ai", prompt: prompt.trim() });
        onClose();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        id="creation-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="creation-modal-title"
        className={cn(
          "relative z-10 w-full max-w-md mx-4",
          "bg-[#0f172a]/95 backdrop-blur-xl",
          "border border-white/10 rounded-2xl shadow-2xl",
          "p-5",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <FolderPlus size={16} className="text-indigo-400" />
          </div>
          <h3
            id="creation-modal-title"
            className="text-sm font-semibold text-white"
          >
            {title}
          </h3>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("standard")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              mode === "standard"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent",
            )}
          >
            <FolderPlus size={12} />
            Standard
          </button>
          <button
            onClick={() => setMode("ai")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              mode === "ai"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent",
            )}
          >
            <Sparkles size={12} />
            Generate with AI
          </button>
        </div>

        {mode === "standard" ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="project-name"
                className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Name *
              </label>
              <input
                ref={inputRef}
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                className={cn(
                  "w-full px-3 py-2 text-sm text-white",
                  "bg-white/5 border border-white/10 rounded-lg",
                  "placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder={descriptionPlaceholder}
                disabled={isLoading}
                rows={2}
                className={cn(
                  "w-full px-3 py-2 text-sm text-white",
                  "bg-white/5 border border-white/10 rounded-lg",
                  "placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors resize-none",
                )}
              />
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="ai-prompt"
              className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Describe your flow *
            </label>
            <textarea
              ref={inputRef}
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 'Login to Facebook and post a status'..."
              disabled={isLoading}
              rows={3}
              className={cn(
                "w-full px-3 py-2 text-sm text-white",
                "bg-white/5 border border-white/10 rounded-lg",
                "placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors resize-none",
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg",
              "text-slate-400 hover:text-white",
              "bg-white/5 hover:bg-white/10",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors",
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isLoading || (mode === "standard" ? !name.trim() : !prompt.trim())
            }
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors",
              mode === "ai"
                ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Creating...
              </>
            ) : mode === "ai" ? (
              <>
                <Sparkles size={12} />
                Generate
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreationModal;
