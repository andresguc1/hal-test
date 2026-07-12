/**
 * useCRDTNodes — Bridge between Yjs Y.Map and ReactFlow nodes array.
 *
 * Observes CRDT mutations on the shared Y.Map('nodes') and produces
 * ReactFlow-compatible node arrays. Wraps ReactFlow change handlers
 * to write back into the CRDT document.
 *
 * This is the core data synchronization hook for collaborative editing.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { useCollaboration } from "./CollaborationProvider";

/**
 * Convert a Y.Map node entry to a plain ReactFlow node object.
 * @param {string} id
 * @param {Y.Map} yNode
 * @returns {Object}
 */
function yNodeToPlain(id, yNode) {
  const json = yNode instanceof Y.Map ? yNode.toJSON() : yNode;
  return { id, ...json };
}

/**
 * Convert a plain ReactFlow node to Y.Map entries.
 * @param {Object} node
 * @returns {Y.Map}
 */
function plainToYNode(node) {
  const yNode = new Y.Map();
  const { id: _id, ...rest } = node;

  // Set top-level primitive fields directly
  if (rest.type) yNode.set("type", rest.type);
  if (rest.parentId !== undefined) yNode.set("parentId", rest.parentId);

  // Position as a nested Y.Map for granular conflict resolution
  if (rest.position) {
    const yPos = new Y.Map();
    yPos.set("x", rest.position.x);
    yPos.set("y", rest.position.y);
    yNode.set("position", yPos);
  }

  // Width/height
  if (rest.width !== undefined) yNode.set("width", rest.width);
  if (rest.height !== undefined) yNode.set("height", rest.height);

  // Data is stored as a JSON blob (nested Y.Map would be too complex
  // for deeply nested config objects — we trade granular merge for simplicity)
  if (rest.data) {
    yNode.set("data", rest.data);
  }

  // Preserve other top-level fields
  if (rest.selected !== undefined) yNode.set("selected", rest.selected);
  if (rest.dragging !== undefined) yNode.set("dragging", rest.dragging);
  if (rest.hidden !== undefined) yNode.set("hidden", rest.hidden);

  return yNode;
}

/**
 * Hook that bridges Yjs Y.Map('nodes') with ReactFlow's node state.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether collaborative mode is active
 * @returns {{ nodes: Object[], onNodesChange: Function, setNodes: Function, addNode: Function, deleteNode: Function }}
 */
export function useCRDTNodes({ enabled = false } = {}) {
  const { ydoc, isCollaborative } = useCollaboration();
  const [nodes, setLocalNodes] = useState([]);
  const isActive = enabled && isCollaborative && ydoc;
  const suppressObserverRef = useRef(false);

  // Yjs → React: Observe CRDT changes and update local state
  useEffect(() => {
    if (!isActive) return;

    const yNodes = ydoc.getMap("nodes");

    const syncFromYjs = () => {
      if (suppressObserverRef.current) return;

      const nodeArray = [];
      yNodes.forEach((yNode, id) => {
        nodeArray.push(yNodeToPlain(id, yNode));
      });

      // Sort by creation order (or by ID for determinism)
      nodeArray.sort((a, b) => (a.id > b.id ? 1 : -1));
      setLocalNodes(nodeArray);
    };

    yNodes.observeDeep(syncFromYjs);
    syncFromYjs(); // Initial sync

    return () => {
      yNodes.unobserveDeep(syncFromYjs);
    };
  }, [ydoc, isActive]);

  // React → Yjs: Handle ReactFlow node changes
  const onNodesChange = useCallback(
    (changes) => {
      if (!isActive) return;

      const yNodes = ydoc.getMap("nodes");

      ydoc.transact(() => {
        for (const change of changes) {
          switch (change.type) {
            case "position": {
              if (change.position) {
                const yNode = yNodes.get(change.id);
                if (yNode && yNode instanceof Y.Map) {
                  let yPos = yNode.get("position");
                  if (yPos instanceof Y.Map) {
                    yPos.set("x", change.position.x);
                    yPos.set("y", change.position.y);
                  } else {
                    const newPos = new Y.Map();
                    newPos.set("x", change.position.x);
                    newPos.set("y", change.position.y);
                    yNode.set("position", newPos);
                  }
                }
              }
              break;
            }

            case "dimensions": {
              const yNode = yNodes.get(change.id);
              if (yNode && yNode instanceof Y.Map) {
                if (change.dimensions) {
                  if (change.dimensions.width !== undefined) {
                    yNode.set("width", change.dimensions.width);
                  }
                  if (change.dimensions.height !== undefined) {
                    yNode.set("height", change.dimensions.height);
                  }
                }
              }
              break;
            }

            case "select": {
              // Selection is LOCAL ONLY — not synced via CRDT
              // (Awareness protocol handles remote selection display)
              setLocalNodes((prev) =>
                prev.map((n) =>
                  n.id === change.id ? { ...n, selected: change.selected } : n,
                ),
              );
              break;
            }

            case "remove": {
              yNodes.delete(change.id);
              break;
            }

            case "add": {
              if (change.item) {
                const yNode = plainToYNode(change.item);
                yNodes.set(change.item.id, yNode);
              }
              break;
            }

            default:
              break;
          }
        }
      });
    },
    [ydoc, isActive],
  );

  // Direct setNodes for bulk operations (e.g., loading from DB, paste)
  const setNodes = useCallback(
    (updater) => {
      if (!isActive) return;

      const yNodes = ydoc.getMap("nodes");
      const currentNodes =
        typeof updater === "function" ? updater(nodes) : updater;

      suppressObserverRef.current = true;

      ydoc.transact(() => {
        // Clear existing
        yNodes.forEach((_, key) => {
          if (!currentNodes.find((n) => n.id === key)) {
            yNodes.delete(key);
          }
        });

        // Set all nodes
        for (const node of currentNodes) {
          const existing = yNodes.get(node.id);
          if (existing) {
            // Update existing node
            if (existing instanceof Y.Map) {
              if (node.type) existing.set("type", node.type);
              if (node.data) existing.set("data", node.data);
              if (node.position) {
                let yPos = existing.get("position");
                if (yPos instanceof Y.Map) {
                  yPos.set("x", node.position.x);
                  yPos.set("y", node.position.y);
                } else {
                  const newPos = new Y.Map();
                  newPos.set("x", node.position.x);
                  newPos.set("y", node.position.y);
                  existing.set("position", newPos);
                }
              }
            }
          } else {
            yNodes.set(node.id, plainToYNode(node));
          }
        }
      });

      suppressObserverRef.current = false;
      // Force local state update
      setLocalNodes(currentNodes);
    },
    [ydoc, isActive, nodes],
  );

  // Add a single node to the CRDT
  const addNode = useCallback(
    (node) => {
      if (!isActive) return;
      const yNodes = ydoc.getMap("nodes");
      ydoc.transact(() => {
        yNodes.set(node.id, plainToYNode(node));
      });
    },
    [ydoc, isActive],
  );

  // Delete a single node from the CRDT
  const deleteNode = useCallback(
    (nodeId) => {
      if (!isActive) return;
      const yNodes = ydoc.getMap("nodes");
      ydoc.transact(() => {
        yNodes.delete(nodeId);
      });
    },
    [ydoc, isActive],
  );

  return {
    nodes: isActive ? nodes : [],
    onNodesChange: isActive ? onNodesChange : null,
    setNodes: isActive ? setNodes : null,
    addNode: isActive ? addNode : null,
    deleteNode: isActive ? deleteNode : null,
  };
}

export default useCRDTNodes;
