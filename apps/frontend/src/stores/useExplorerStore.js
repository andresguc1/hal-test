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

  showContextMenu: (x, y, item) =>
    set({ contextMenu: { x, y, item } }),
  hideContextMenu: () => set({ contextMenu: null }),
}));
