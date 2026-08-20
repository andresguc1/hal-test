import { useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { GitBranch, Box, Repeat, Plus } from "lucide-react";
import FlowTreeNode from "./FlowTreeNode";
import FolderTreeNode from "./FolderTreeNode";

function buildTreeItems(flows, expandedFolders, searchQuery, filterType) {
  const items = [];
  const lowerQ = searchQuery.toLowerCase().trim();

  const mainFlows = [];
  const componentFlows = [];
  const loopFlows = [];

  for (const f of flows) {
    if (f.type === "component") {
      componentFlows.push(f);
    } else if (f.type === "loop") {
      loopFlows.push(f);
    } else {
      mainFlows.push(f);
    }
  }

  const groups = [
    {
      id: "_main",
      label: "Main Flows",
      icon: GitBranch,
      flowType: "main",
      flows: mainFlows,
    },
    {
      id: "_components",
      label: "Components",
      icon: Box,
      flowType: "component",
      flows: componentFlows,
    },
    {
      id: "_loops",
      label: "Loops",
      icon: Repeat,
      flowType: "loop",
      flows: loopFlows,
    },
  ];

  for (const group of groups) {
    if (filterType !== "all" && group.flowType !== filterType) {
      continue;
    }

    let filtered = group.flows;
    if (lowerQ) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(lowerQ));
    }

    items.push({
      id: group.id,
      kind: "folder",
      label: group.label,
      icon: group.icon,
      count: filtered.length,
      depth: 0,
    });

    if (expandedFolders.has(group.id)) {
      for (const flow of filtered) {
        items.push({
          id: flow.id,
          kind: "flow",
          flow,
          depth: 1,
        });
      }
    }
  }

  return items;
}

export default function FlowTreeList({
  flows = [],
  currentFlowId,
  onSwitchFlow,
  onNewFlow,
  onRenameFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onMoveFlowType,
  onRunFlow,
}) {
  const {
    expandedFolders,
    searchQuery,
    filterType,
    toggleFolder,
    selectFlow,
    showContextMenu,
  } = useExplorerStore();

  const scrollRef = useRef(null);

  const treeItems = useMemo(
    () => buildTreeItems(flows, expandedFolders, searchQuery, filterType),
    [flows, expandedFolders, searchQuery, filterType],
  );

  const virtualizer = useVirtualizer({
    count: treeItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 30,
    overscan: 15,
  });

  const handleSelect = useCallback(
    (flowId) => {
      selectFlow(flowId);
      onSwitchFlow?.({ id: flowId });
    },
    [selectFlow, onSwitchFlow],
  );

  const handleContextMenu = useCallback(
    (e, item) => {
      showContextMenu(e.clientX, e.clientY, item);
    },
    [showContextMenu],
  );

  if (flows.length === 0 && !searchQuery) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
            <GitBranch size={20} className="text-slate-600" />
          </div>
          <p className="text-xs text-slate-500">No flows yet</p>
          <button
            onClick={() => onNewFlow?.()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 transition-colors"
          >
            <Plus size={12} />
            Create first flow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        role="tree"
        aria-label="Flow explorer"
      >
        {treeItems.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-500">No matching flows</p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = treeItems[virtualRow.index];
              const isHighlighted =
                searchQuery &&
                item.kind === "flow" &&
                item.flow.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());

              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                >
                  {item.kind === "folder" ? (
                    <FolderTreeNode
                      label={item.label}
                      icon={item.icon}
                      isExpanded={expandedFolders.has(item.id)}
                      onToggle={() => toggleFolder(item.id)}
                      depth={item.depth}
                      count={item.count}
                      groupId={item.id}
                      onDropFlow={(flowId, newType) =>
                        onMoveFlowType?.(flowId, newType)
                      }
                    />
                  ) : (
                    <FlowTreeNode
                      flow={item.flow}
                      isActive={item.flow.id === currentFlowId}
                      onSelect={() => handleSelect(item.flow.id)}
                      onContextMenu={(e) => handleContextMenu(e, item.flow)}
                      onRename={onRenameFlow}
                      onDelete={onDeleteFlow}
                      onDuplicate={onDuplicateFlow}
                      onRun={onRunFlow}
                      depth={item.depth}
                      isHighlighted={isHighlighted}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats footer with + button */}
      <div className="px-2 py-1.5 border-t border-white/5 flex items-center gap-1">
        <button
          onClick={() => onNewFlow?.()}
          className="p-1 rounded-md hover:bg-indigo-500/15 text-indigo-400 hover:text-indigo-300 transition-colors"
          title="New Flow"
          aria-label="Create new flow"
        >
          <Plus size={13} />
        </button>
        <span className="text-[10px] text-slate-600 font-mono flex-1">
          {flows.length} flow{flows.length !== 1 ? "s" : ""}
        </span>
        {searchQuery && (
          <span className="text-[10px] text-indigo-400/60 font-mono">
            {treeItems.filter((i) => i.kind === "flow").length} shown
          </span>
        )}
      </div>
    </div>
  );
}
