import {
  Pencil,
  Trash2,
  Copy,
  FolderPlus,
  Play,
  ArrowRight,
  GitBranch,
  Box,
  Repeat,
  ChevronRight,
} from "lucide-react";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  {
    value: "main",
    label: "Main Flow",
    icon: GitBranch,
    color: "text-indigo-400",
  },
  {
    value: "component",
    label: "Component",
    icon: Box,
    color: "text-emerald-400",
  },
  { value: "loop", label: "Loop", icon: Repeat, color: "text-amber-400" },
];

export default function ExplorerContextMenu({
  onRename: _onRename,
  onDelete,
  onDuplicate,
  onMoveFlowType,
  onNewFlow,
  onRun,
}) {
  const { contextMenu, hideContextMenu, startRenaming } = useExplorerStore();
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideContextMenu();
        setShowMoveSubmenu(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        hideContextMenu();
        setShowMoveSubmenu(false);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu, hideContextMenu]);

  // Reset submenu when context menu changes
  useEffect(() => {
    setShowMoveSubmenu(false);
  }, [contextMenu]);

  if (!contextMenu) return null;

  const { x, y, item } = contextMenu;
  const isFlow =
    item &&
    (item.type === "main" || item.type === "component" || item.type === "loop");

  const handleRename = () => {
    startRenaming(item.id);
    hideContextMenu();
  };

  const handleMoveTo = (newType) => {
    onMoveFlowType?.(item.id, newType);
    hideContextMenu();
  };

  const menuItems = isFlow
    ? [
        {
          icon: Play,
          label: "Run Flow",
          onClick: () => {
            onRun?.(item);
            hideContextMenu();
          },
          color: "text-emerald-400",
        },
        {
          icon: Pencil,
          label: "Rename",
          onClick: handleRename,
          shortcut: "F2",
        },
        {
          icon: Copy,
          label: "Duplicate",
          onClick: () => {
            onDuplicate?.(item);
            hideContextMenu();
          },
        },
        "separator",
        {
          icon: ArrowRight,
          label: "Move to...",
          onClick: () => setShowMoveSubmenu((p) => !p),
          hasSubmenu: true,
          active: showMoveSubmenu,
        },
        "separator",
        {
          icon: Trash2,
          label: "Delete",
          onClick: () => {
            onDelete?.(item);
            hideContextMenu();
          },
          color: "text-red-400",
          shortcut: "Del",
        },
      ]
    : [
        {
          icon: FolderPlus,
          label: "New Flow",
          onClick: () => {
            onNewFlow?.(item);
            hideContextMenu();
          },
        },
      ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[var(--z-modal)]"
      style={{ left: x, top: y }}
    >
      <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px]">
        {isFlow && (
          <div className="px-3 py-1.5 border-b border-white/5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {item.name}
            </span>
          </div>
        )}
        {menuItems.map((menuItem, idx) => {
          if (menuItem === "separator") {
            return (
              <div
                key={`sep-${idx}`}
                className="mx-2 my-0.5 border-t border-white/5"
              />
            );
          }
          return (
            <div key={menuItem.label} className="relative">
              <button
                onClick={menuItem.onClick}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                  "text-slate-300 hover:bg-white/5",
                  menuItem.color || "hover:text-white",
                  menuItem.active && "bg-white/5",
                )}
              >
                <menuItem.icon size={12} />
                <span className="flex-1 text-left">{menuItem.label}</span>
                {menuItem.shortcut && (
                  <span className="text-[10px] text-slate-600 font-mono">
                    {menuItem.shortcut}
                  </span>
                )}
                {menuItem.hasSubmenu && (
                  <ChevronRight
                    size={10}
                    className={cn(
                      "text-slate-500 transition-transform",
                      menuItem.active && "rotate-90",
                    )}
                  />
                )}
              </button>

              {/* Move to submenu */}
              {menuItem.label === "Move to..." && showMoveSubmenu && (
                <div className="absolute left-full top-0 ml-0.5">
                  <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px]">
                    <div className="px-3 py-1.5 border-b border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Move to
                      </span>
                    </div>
                    {TYPE_OPTIONS.map((opt) => {
                      const isCurrentType = item.type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() =>
                            !isCurrentType && handleMoveTo(opt.value)
                          }
                          disabled={isCurrentType}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                            isCurrentType
                              ? "text-slate-600 cursor-default"
                              : "text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer",
                          )}
                        >
                          <opt.icon size={12} className={opt.color} />
                          <span className="flex-1 text-left">{opt.label}</span>
                          {isCurrentType && (
                            <span className="text-[10px] text-indigo-400 font-mono">
                              current
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
