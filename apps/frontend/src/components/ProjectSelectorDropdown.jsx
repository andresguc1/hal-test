import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderGit2,
  ChevronDown,
  Search,
  Plus,
  Check,
  Upload,
  Download,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useExplorerStore } from "@/stores/useExplorerStore";

/**
 * PROJECT SELECTOR DROPDOWN
 * Searchable, virtualized project switcher with:
 * - Debounced search filter
 * - Virtualized list (handles 1000+ projects)
 * - Multi-select / bulk mode (Delete, Export)
 * - Create / Import project actions
 */

const ROW_HEIGHT = 34;
const LIST_CONTAINER_HEIGHT = 320;

export default function ProjectSelectorDropdown({
  projects = [],
  currentProject,
  onSelectProject,
  onCreateProject,
  onBulkDelete,
  onExportProject,
  onImportProject,
  onImportFile,
  onRenameProject,
  onProjectContextMenu,
}) {
  const { t } = useTranslation();
  const store = useExplorerStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const listRef = useRef(null);
  const containerRef = useRef(null);

  const selectionMode = store.selectionMode;
  const selectedProjectIds = store.selectedProjectIds;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset search when opened
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filteredProjects = useMemo(() => {
    if (!debouncedSearch.trim()) return projects;
    const q = debouncedSearch.toLowerCase().trim();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, debouncedSearch]);

  const virtualizer = useVirtualizer({
    count: filteredProjects.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const isAllSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((p) => selectedProjectIds.has(p.id));

  const handleToggleAll = () => {
    if (isAllSelected) {
      store.clearSelectedProjects();
    } else {
      store.selectAllProjects(filteredProjects.map((p) => p.id));
    }
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      store.exitSelectionMode();
    } else {
      store.enterSelectionMode();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjectIds.size === 0) return;
    try {
      await onBulkDelete?.([...selectedProjectIds]);
      store.exitSelectionMode();
      setOpen(false);
    } catch {
      // Error handled by caller
    }
  };

  const handleExportSelected = () => {
    if (selectedProjectIds.size === 0) return;
    onExportProject?.([...selectedProjectIds]);
  };

  const handleImportClick = () => {
    if (onImportFile) {
      onImportFile();
    } else {
      onImportProject?.();
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => {
          if (!selectionMode) setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs min-w-0 max-w-full",
          "hover:bg-white/5 transition-colors",
          open ? "bg-white/5 text-white" : "text-slate-300",
        )}
      >
        <FolderGit2 size={12} className="text-indigo-400 shrink-0" />
        <span className="truncate font-medium">
          {currentProject?.name || t("common.no_project", "No Project")}
        </span>
        {!selectionMode && (
          <ChevronDown
            size={10}
            className={cn(
              "shrink-0 text-slate-500 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && !selectionMode && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[var(--z-modal)] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
              <Search size={12} className="text-slate-500 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search_projects", "Search projects...")}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-500 hover:text-white"
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Selection mode toggle */}
          <div className="px-2 pt-1.5 pb-1 flex items-center justify-between">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Check size={11} />
              {t("common.select_mode", "Select mode")}
            </button>
            <span className="text-[10px] text-slate-600 font-mono">
              {filteredProjects.length}/{projects.length}
            </span>
          </div>

          {/* Virtualized list */}
          <div
            ref={listRef}
            className="overflow-auto"
            style={{ height: `${LIST_CONTAINER_HEIGHT}px` }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((vi) => {
                const p = filteredProjects[vi.index];
                if (!p) return null;
                const isActive = !selectionMode && p.id === currentProject?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setOpen(false);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (onRenameProject) {
                        onRenameProject(p);
                        setOpen(false);
                      }
                    }}
                    onContextMenu={(e) => {
                      if (onProjectContextMenu) {
                        e.preventDefault();
                        e.stopPropagation();
                        onProjectContextMenu(e, p);
                        setOpen(false);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${vi.size}px`,
                      transform: `translateY(${vi.start}px)`,
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 text-xs transition-colors text-left w-full",
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <FolderGit2 size={12} className="shrink-0 text-slate-500" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0">
                      {p.flows?.length || 0}
                    </span>
                  </button>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-slate-600">
                  {t("common.no_projects_found", "No projects found")}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-2 border-t border-white/5 flex items-center gap-1">
            <button
              onClick={() => {
                onCreateProject?.();
                setOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex-1 justify-center"
            >
              <Plus size={12} />
              {t("common.new_project", "New")}
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex-1 justify-center"
              title={t("common.import_project", "Import project")}
            >
              <Upload size={12} />
              {t("common.import", "Import")}
            </button>
          </div>
        </div>
      )}

      {/* Selection mode panel */}
      {selectionMode && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[var(--z-modal)] overflow-hidden">
          <div className="p-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check size={12} className="text-indigo-400" />
              <span className="text-xs font-medium text-white">
                {t("common.select_projects", "Select projects")}
              </span>
            </div>
            <button
              onClick={toggleSelectionMode}
              className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-white/5"
              title={t("common.cancel", "Cancel")}
            >
              <XIcon size={12} />
            </button>
          </div>

          {/* Select all / clear */}
          <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleAll}
                className="accent-indigo-500"
              />
              {t("common.select_all", "Select all")} ({filteredProjects.length})
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {selectedProjectIds.size} selected
            </span>
          </div>

          {/* Virtualized list with checkboxes */}
          <div
            ref={listRef}
            className="overflow-auto"
            style={{ height: `${LIST_CONTAINER_HEIGHT - 70}px` }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((vi) => {
                const p = filteredProjects[vi.index];
                if (!p) return null;
                const isActive = p.id === currentProject?.id;
                const isSelected = selectedProjectIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => store.toggleProjectSelected(p.id)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${vi.size}px`,
                      transform: `translateY(${vi.start}px)`,
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 text-xs cursor-pointer transition-colors",
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-slate-300 hover:bg-white/5",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-indigo-500 shrink-0"
                    />
                    <FolderGit2 size={12} className="shrink-0 text-slate-500" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0">
                      {p.flows?.length || 0}
                    </span>
                  </div>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-slate-600">
                  {t("common.no_projects_found", "No projects found")}
                </div>
              )}
            </div>
          </div>

          {/* Bulk actions */}
          <div className="p-2 border-t border-white/5 flex items-center gap-1">
            <button
              onClick={handleExportSelected}
              disabled={selectedProjectIds.size === 0}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("common.export_selected", "Export selected")}
            >
              <Download size={12} />
              {t("common.export", "Export")}
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={handleBulkDelete}
              disabled={selectedProjectIds.size === 0}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("common.delete_selected", "Delete selected")}
            >
              <Trash2 size={12} />
              {t("common.delete", "Delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
