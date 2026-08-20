import {
  FolderGit2,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  GitBranch,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
} from "lucide-react";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { useToast } from "@/hooks/useToast";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ui-custom/ConfirmDialog";

export default function ExplorerHeader({
  projects = [],
  currentProject,
  onSwitchProject,
  onRenameProject,
  onDeleteProject,
  onNewProject,
  onNewFlow,
}) {
  const { isOpen, toggleExplorer } = useExplorerStore();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [projectCtxMenu, setProjectCtxMenu] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const renameInputRef = useRef(null);
  const ctxMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setProjectDropdownOpen(false);
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target))
        setProjectCtxMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleStartRename = useCallback(() => {
    setRenameValue(currentProject?.name || "");
    setIsRenaming(true);
    setProjectDropdownOpen(false);
    setProjectCtxMenu(null);
  }, [currentProject]);

  const handleSaveRename = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== currentProject?.name) {
      try {
        await onRenameProject?.(currentProject.id, trimmed);
        toast.success("Project renamed");
      } catch (error) {
        toast.error(error?.message || "Failed to rename project");
      }
    }
    setIsRenaming(false);
  }, [renameValue, currentProject, onRenameProject, toast]);

  const handleProjectCtxMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDeleteClick = useCallback((project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
    setProjectCtxMenu(null);
    setProjectDropdownOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (projectToDelete) {
      try {
        await onDeleteProject?.(projectToDelete.id);
        toast.success("Project deleted");
      } catch (error) {
        toast.error(error?.message || "Failed to delete project");
      }
    }
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  }, [projectToDelete, onDeleteProject, toast]);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-2 gap-2 border-b border-white/5">
        <button
          onClick={toggleExplorer}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Open Explorer"
        >
          <FolderGit2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-b border-white/5">
      {/* Top row: Project switcher + actions */}
      <div className="flex items-center justify-between px-2 py-1.5">
        {/* Project Switcher / Name */}
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          {isRenaming ? (
            <div className="flex items-center gap-1 px-1">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                onBlur={handleSaveRename}
                className="flex-1 bg-slate-900/80 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 min-w-0"
              />
              <button
                onClick={handleSaveRename}
                className="p-0.5 text-emerald-400 hover:text-emerald-300"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                className="p-0.5 text-red-400 hover:text-red-300"
              >
                <XIcon size={11} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setProjectDropdownOpen((p) => !p)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartRename();
                }}
                onContextMenu={handleProjectCtxMenu}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs w-full min-w-0 group",
                  "hover:bg-white/5 transition-colors",
                  projectDropdownOpen
                    ? "bg-white/5 text-white"
                    : "text-slate-300",
                )}
              >
                <FolderGit2 size={12} className="text-indigo-400 shrink-0" />
                <span className="truncate font-medium">
                  {currentProject?.name || "No Project"}
                </span>
                <Pencil
                  size={9}
                  className="shrink-0 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <ChevronDown
                  size={10}
                  className={cn(
                    "shrink-0 text-slate-500 transition-transform",
                    projectDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {projectDropdownOpen && (
                  <Motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[var(--z-modal)]"
                  >
                    <div className="px-3 py-1.5 border-b border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Projects
                      </span>
                    </div>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSwitchProject?.(p);
                          setProjectDropdownOpen(false);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setRenameValue(p.name);
                          setIsRenaming(true);
                          setProjectDropdownOpen(false);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectCtxMenu({
                            x: e.clientX,
                            y: e.clientY,
                            project: p,
                          });
                          setProjectDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors group/item",
                          p.id === currentProject?.id
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "text-slate-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <FolderGit2 size={12} />
                        <span className="flex-1 text-left truncate">
                          {p.name}
                        </span>
                        {p.id === currentProject?.id && (
                          <span className="text-[10px] text-indigo-400 font-mono">
                            active
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 font-mono">
                          {p.flows?.length || 0}
                        </span>
                      </button>
                    ))}
                    <div className="mx-2 my-0.5 border-t border-white/5" />
                    <button
                      onClick={() => {
                        onNewProject?.();
                        setProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Plus size={12} />
                      <span>New Project</span>
                    </button>
                  </Motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Create"
            >
              <Plus size={14} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <Motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[var(--z-modal)]"
                >
                  <button
                    onClick={() => {
                      onNewProject?.();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <FolderPlus size={12} className="text-indigo-400" />
                    <span>New Project</span>
                  </button>
                  <div className="mx-2 my-0.5 border-t border-white/5" />
                  <button
                    onClick={() => {
                      onNewFlow?.();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <GitBranch size={12} className="text-emerald-400" />
                    <span>New Flow</span>
                  </button>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={toggleExplorer}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Collapse"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Project context menu (right-click on project name) */}
      <AnimatePresence>
        {projectCtxMenu && (
          <Motion.div
            ref={ctxMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[var(--z-modal)]"
            style={{ left: projectCtxMenu.x, top: projectCtxMenu.y }}
          >
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px]">
              {projectCtxMenu.project && (
                <div className="px-3 py-1.5 border-b border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {projectCtxMenu.project.name}
                  </span>
                </div>
              )}

              {/* New actions */}
              <button
                onClick={() => {
                  onNewProject?.();
                  setProjectCtxMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <FolderPlus size={12} className="text-indigo-400" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => {
                  onNewFlow?.();
                  setProjectCtxMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <GitBranch size={12} className="text-emerald-400" />
                <span>New Flow</span>
              </button>

              <div className="mx-2 my-0.5 border-t border-white/5" />

              {/* Edit actions */}
              <button
                onClick={() => {
                  if (projectCtxMenu.project) {
                    setRenameValue(projectCtxMenu.project.name);
                  }
                  setIsRenaming(true);
                  setProjectCtxMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Pencil size={12} />
                <span>Rename</span>
              </button>

              <div className="mx-2 my-0.5 border-t border-white/5" />

              {/* Delete action */}
              <button
                onClick={() => {
                  const target = projectCtxMenu.project || currentProject;
                  handleDeleteClick(target);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This will permanently delete all flows, nodes, and connections. This action cannot be undone.`}
        confirmLabel="Delete project"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setProjectToDelete(null);
        }}
      />
    </div>
  );
}
