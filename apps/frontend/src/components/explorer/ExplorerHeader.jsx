import {
  FolderGit2,
  Plus,
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
import ConfirmDialog from "@/components/ui-custom/ConfirmDialog";
import ProjectSelectorDropdown from "@/components/ProjectSelectorDropdown";
import BulkDeleteConfirm from "@/components/BulkDeleteConfirm";

export default function ExplorerHeader({
  projects = [],
  currentProject,
  onSwitchProject,
  onRenameProject,
  onDeleteProject,
  onNewProject,
  onNewFlow,
  onBulkDeleteProjects,
  onExportProject,
  onExportProjects,
  onImportProjectFile,
}) {
  const { isOpen, toggleExplorer } = useExplorerStore();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [projectCtxMenu, setProjectCtxMenu] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
  const menuRef = useRef(null);
  const renameInputRef = useRef(null);
  const ctxMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
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

  // Bulk operations
  const handleBulkDelete = useCallback(async (projectIds) => {
    setBulkDeleteIds(projectIds || []);
    setBulkDeleteOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (bulkDeleteIds.length > 0) {
      try {
        await onBulkDeleteProjects?.(bulkDeleteIds);
        toast.success(`${bulkDeleteIds.length} project(s) deleted`);
      } catch (error) {
        toast.error(error?.message || "Failed to delete projects");
      }
    }
    setBulkDeleteOpen(false);
    setBulkDeleteIds([]);
  }, [bulkDeleteIds, onBulkDeleteProjects, toast]);

  const handleExportSelected = useCallback(
    async (projectIds) => {
      try {
        await onExportProjects?.(projectIds);
      } catch (error) {
        toast.error(error?.message || "Failed to export projects");
      }
    },
    [onExportProjects, toast],
  );

  const handleExportSingle = useCallback(
    async (projectId) => {
      try {
        await onExportProject?.(projectId);
      } catch (error) {
        toast.error(error?.message || "Failed to export project");
      }
    },
    [onExportProject, toast],
  );

  // Compute bulk impact stats for the confirmation
  const bulkFlowCount = projects
    .filter((p) => bulkDeleteIds.includes(p.id))
    .reduce((sum, p) => sum + (p.flows?.length || 0), 0);

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
        <div className="relative flex-1 min-w-0">
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
              <ProjectSelectorDropdown
                projects={projects}
                currentProject={currentProject}
                onSelectProject={onSwitchProject}
                onCreateProject={onNewProject}
                onBulkDelete={handleBulkDelete}
                onExportProject={handleExportSelected}
                onImportFile={onImportProjectFile}
                onRenameProject={(p) => {
                  setRenameValue(p.name);
                  setIsRenaming(true);
                }}
                onProjectContextMenu={(e, p) => handleProjectCtxMenu(e, p)}
              />
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

              <button
                onClick={() => {
                  const target = projectCtxMenu.project || currentProject;
                  setProjectCtxMenu(null);
                  if (target) handleExportSingle(target.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <FolderGit2 size={12} className="text-indigo-400" />
                <span>Export</span>
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

      {/* Bulk delete confirmation */}
      <BulkDeleteConfirm
        isOpen={bulkDeleteOpen}
        projectCount={bulkDeleteIds.length}
        flowCount={bulkFlowCount}
        requireTyping={bulkDeleteIds.length > 5}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => {
          setBulkDeleteOpen(false);
          setBulkDeleteIds([]);
        }}
      />
    </div>
  );
}
