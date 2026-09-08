import { create } from "zustand";

export const useExplorerStore = create((set) => ({
  isOpen: true,
  width: 280,

  expandedFolders: new Set(["_main"]),
  selectedFlowId: null,
  renamingFlowId: null,

  searchQuery: "",
  filterType: "all",
  filterStatus: "all",

  contextMenu: null,

  // Bulk project selection state
  selectionMode: false,
  selectedProjectIds: new Set(),

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  setWidth: (w) => set({ width: w }),

  toggleFolder: (folderId) =>
    set((s) => {
      const next = new Set(s.expandedFolders);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return { expandedFolders: next };
    }),

  expandAll: (folderIds) => set({ expandedFolders: new Set(folderIds) }),
  collapseAll: () => set({ expandedFolders: new Set() }),

  selectFlow: (flowId) => set({ selectedFlowId: flowId }),
  startRenaming: (flowId) => set({ renamingFlowId: flowId }),
  stopRenaming: () => set({ renamingFlowId: null }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterType: (t) => set({ filterType: t }),
  setFilterStatus: (s) => set({ filterStatus: s }),

  showContextMenu: (x, y, item) => set({ contextMenu: { x, y, item } }),
  hideContextMenu: () => set({ contextMenu: null }),

  // ---- Bulk selection ----
  enterSelectionMode: () =>
    set({ selectionMode: true, selectedProjectIds: new Set() }),
  exitSelectionMode: () =>
    set({ selectionMode: false, selectedProjectIds: new Set() }),
  toggleProjectSelected: (projectId) =>
    set((s) => {
      const next = new Set(s.selectedProjectIds);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return { selectedProjectIds: next };
    }),
  selectAllProjects: (projectIds) =>
    set({ selectedProjectIds: new Set(projectIds) }),
  clearSelectedProjects: () => set({ selectedProjectIds: new Set() }),
  setSelectionMode: (active) => set({ selectionMode: active }),
}));
