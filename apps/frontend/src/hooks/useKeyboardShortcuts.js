/**
 * Custom Hook for Keyboard Shortcuts
 * Provides keyboard shortcut functionality for the flow editor
 */

import { useEffect, useCallback } from "react";
import { logger } from "../utils/logger";

/**
 * Hook to register keyboard shortcuts
 *
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {boolean} [enabled=true] - Whether shortcuts are enabled
 *
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+s': handleSave,
 *   'ctrl+z': handleUndo,
 *   'delete': handleDelete,
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Verificar si el foco está en un elemento de entrada
      const target = event.target;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Si estamos en un campo de entrada, solo permitir atajos con modificadores
      if (isInputElement) {
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
        if (!hasModifier) {
          return; // Ignorar teclas simples en campos de entrada
        }
      }

      // Build key combination string
      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push("ctrl");
      if (event.shiftKey) keys.push("shift");
      if (event.altKey) keys.push("alt");

      // Add the actual key
      const key = event.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        keys.push(key);
      }

      const combination = keys.join("+");

      // Check if we have a handler for this combination
      const handler = shortcuts[combination];

      if (handler) {
        event.preventDefault();
        event.stopPropagation();

        logger.debug(
          "Keyboard shortcut triggered",
          { combination },
          "KeyboardShortcuts",
        );

        try {
          handler(event);
        } catch (error) {
          logger.error(
            "Keyboard shortcut handler failed",
            error,
            "KeyboardShortcuts",
          );
        }
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Default keyboard shortcuts configuration
 */
export const DEFAULT_SHORTCUTS = {
  "ctrl+s": "save",
  "ctrl+z": "undo",
  "ctrl+shift+z": "redo",
  "ctrl+y": "redo",
  "ctrl+e": "execute",
  delete: "delete",
  backspace: "delete",
  "ctrl+a": "selectAll",
  "ctrl+d": "duplicate",
  escape: "deselect",
  "ctrl+c": "copy",
  "ctrl+v": "paste",
  "ctrl+x": "cut",
};

/**
 * Hook to use default flow shortcuts
 *
 * @param {Object} handlers - Object with handler functions
 * @param {Function} [handlers.onSave] - Save handler
 * @param {Function} [handlers.onUndo] - Undo handler
 * @param {Function} [handlers.onRedo] - Redo handler
 * @param {Function} [handlers.onExecute] - Execute handler
 * @param {Function} [handlers.onDelete] - Delete handler
 * @param {Function} [handlers.onSelectAll] - Select all handler
 * @param {Function} [handlers.onDuplicate] - Duplicate handler
 * @param {Function} [handlers.onDeselect] - Deselect handler
 * @param {Function} [handlers.onCopy] - Copy handler
 * @param {Function} [handlers.onPaste] - Paste handler
 * @param {Function} [handlers.onCut] - Cut handler
 * @param {boolean} [enabled=true] - Whether shortcuts are enabled
 */
export function useFlowShortcuts(handlers = {}, enabled = true) {
  const shortcuts = {
    "ctrl+s": handlers.onSave,
    "ctrl+z": handlers.onUndo,
    "ctrl+shift+z": handlers.onRedo,
    "ctrl+y": handlers.onRedo,
    "ctrl+e": handlers.onExecute,
    delete: handlers.onDelete,
    backspace: handlers.onDelete,
    "ctrl+a": handlers.onSelectAll,
    "ctrl+d": handlers.onDuplicate,
    escape: handlers.onDeselect,
    "ctrl+c": handlers.onCopy,
    "ctrl+v": handlers.onPaste,
    "ctrl+x": handlers.onCut,
    // Zoom controls
    "+": handlers.onZoomIn,
    "=": handlers.onZoomIn,
    "ctrl++": handlers.onZoomIn,
    "ctrl+=": handlers.onZoomIn,
    "-": handlers.onZoomOut,
    _: handlers.onZoomOut,
    "ctrl+-": handlers.onZoomOut,
    "ctrl+_": handlers.onZoomOut,
    "shift+1": handlers.onFitView,
  };

  // Filter out undefined handlers
  const activeShortcuts = Object.entries(shortcuts)
    .filter(([, handler]) => typeof handler === "function")
    .reduce((acc, [key, handler]) => {
      acc[key] = handler;
      return acc;
    }, {});

  useKeyboardShortcuts(activeShortcuts, enabled);
}
