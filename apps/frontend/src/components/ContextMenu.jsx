/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from "react";
import {
  Copy,
  Scissors,
  Trash2,
  PlusCircle,
  CopyPlus,
  Undo2,
  Redo2,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ContextMenu Component (Refactored to match Shadcn/UI style manually)
 */
const ContextMenu = ({ x, y, type, data, onClose, actions }) => {
  const menuRef = useRef(null);

  // Auto-focus and boundary detection
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      // Bound check
      if (x + rect.width > winWidth) {
        menu.style.left = `${x - rect.width}px`;
      } else {
        menu.style.left = `${x}px`;
      }

      if (y + rect.height > winHeight) {
        menu.style.top = `${y - rect.height}px`;
      } else {
        menu.style.top = `${y}px`;
      }

      // Accessibility: Focus the first button
      const firstButton = menu.querySelector("button");
      if (firstButton) firstButton.focus();
    }
  }, [x, y]);

  // Click outside and Esc close
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const renderItem = ({
    icon: Icon,
    label,
    shortcut,
    onClick,
    danger = false,
    disabled = false,
  }) => (
    <button
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-[#2c2f33] hover:text-white cursor-pointer focus:bg-[#2c2f33] focus:text-white",
        danger &&
          !disabled &&
          "text-red-500 hover:text-red-500 focus:text-red-500 hover:bg-red-900/20 focus:bg-red-900/20",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick();
          onClose();
        }
      }}
      disabled={disabled}
      role="menuitem"
    >
      <div className="mr-2 flex h-4 w-4 items-center justify-center">
        <Icon size={14} />
      </div>
      <span className="flex-1 text-left text-gray-200">{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs tracking-widest text-gray-500">
          {shortcut}
        </span>
      )}
    </button>
  );

  const renderDivider = () => (
    <div className="my-1 h-px bg-[#2c2f33]" role="separator" />
  );

  const renderHeader = (title) => (
    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </div>
  );

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[12rem] overflow-hidden rounded-md border border-[#2c2f33] bg-[#1d2024] p-1 shadow-md animate-in fade-in-80 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 slide-in-from-top-2",
      )}
      style={{ left: x, top: y }}
      role="menu"
      aria-label="Context Menu"
    >
      {type === "node" && (
        <>
          {renderHeader(data?.data?.label || "Nodo")}
          {renderDivider()}
          {renderItem({
            icon: Copy,
            label: "Copiar",
            shortcut: "Ctrl+C",
            onClick: actions.copy,
          })}
          {renderItem({
            icon: Scissors,
            label: "Cortar",
            shortcut: "Ctrl+X",
            onClick: actions.cut,
          })}
          {renderItem({
            icon: CopyPlus,
            label: "Duplicar",
            shortcut: "Ctrl+D",
            onClick: actions.duplicate,
          })}
          {renderDivider()}
          {renderItem({
            icon: Trash2,
            label: "Eliminar",
            shortcut: "Del",
            onClick: actions.delete,
            danger: true,
          })}
        </>
      )}

      {type === "selection" && (
        <>
          {renderHeader(`Selección (${data?.nodes?.length || 0})`)}
          {renderDivider()}
          {renderItem({
            icon: Copy,
            label: "Copiar",
            shortcut: "Ctrl+C",
            onClick: actions.copy,
          })}
          {renderItem({
            icon: Scissors,
            label: "Cortar",
            shortcut: "Ctrl+X",
            onClick: actions.cut,
          })}
          {renderItem({
            icon: CopyPlus,
            label: "Duplicar",
            shortcut: "Ctrl+D",
            onClick: actions.duplicate,
          })}
          {renderDivider()}
          {renderItem({
            icon: Trash2,
            label: "Eliminar Selección",
            shortcut: "Del",
            onClick: actions.delete,
            danger: true,
          })}
        </>
      )}

      {type === "edge" && (
        <>
          {renderHeader("Conexión")}
          {renderDivider()}
          {renderItem({
            icon: Trash2,
            label: "Eliminar",
            shortcut: "Del",
            onClick: actions.delete,
            danger: true,
          })}
        </>
      )}

      {type === "canvas" && (
        <>
          {renderHeader("Canvas")}
          {renderDivider()}
          {renderItem({
            icon: PlusCircle,
            label: "Agregar Nodo",
            onClick: actions.addNode,
          })}
          {renderItem({
            icon: MousePointer2,
            label: "Seleccionar Todo",
            shortcut: "Ctrl+A",
            onClick: actions.selectAll,
          })}
          {renderDivider()}
          {renderItem({
            icon: Copy,
            label: "Pegar",
            shortcut: "Ctrl+V",
            onClick: actions.paste,
            disabled: !actions.canPaste,
          })}
          {renderDivider()}
          {renderItem({
            icon: Undo2,
            label: "Deshacer",
            shortcut: "Ctrl+Z",
            onClick: actions.undo,
            disabled: !actions.canUndo,
          })}
          {renderItem({
            icon: Redo2,
            label: "Rehacer",
            shortcut: "Ctrl+Y",
            onClick: actions.redo,
            disabled: !actions.canRedo,
          })}
        </>
      )}
    </div>
  );
};

export default ContextMenu;
