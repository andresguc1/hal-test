/**
 * useCRDTEdges — Bridge between Yjs Y.Map and ReactFlow edges array.
 *
 * Mirrors the pattern from useCRDTNodes but for edge data.
 * Edges are simpler (fewer fields, no deep nesting), so the CRDT
 * mapping is more straightforward.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { useCollaboration } from "./CollaborationProvider";

/**
 * Convert a Y.Map edge entry to a plain ReactFlow edge object.
 */
function yEdgeToPlain(id, yEdge) {
  const json = yEdge instanceof Y.Map ? yEdge.toJSON() : yEdge;
  return {
    id,
    ...json,
    // Sanitize falsy handles to "default" so React Flow v12 finds the explicit default handles
    sourceHandle: json.sourceHandle || "default",
    targetHandle: json.targetHandle || "default",
  };
}

/**
 * Convert a plain ReactFlow edge to Y.Map.
 */
function plainToYEdge(edge) {
  const yEdge = new Y.Map();
  const { id: _id, ...rest } = edge;

  if (rest.source) yEdge.set("source", rest.source);
  if (rest.target) yEdge.set("target", rest.target);
  if (rest.sourceHandle) yEdge.set("sourceHandle", rest.sourceHandle);
  if (rest.targetHandle) yEdge.set("targetHandle", rest.targetHandle);
  if (rest.type) yEdge.set("type", rest.type);
  if (rest.animated !== undefined) yEdge.set("animated", rest.animated);
  if (rest.data) yEdge.set("data", rest.data);
  if (rest.label) yEdge.set("label", rest.label);
  if (rest.style) yEdge.set("style", rest.style);
  if (rest.markerEnd) yEdge.set("markerEnd", rest.markerEnd);

  return yEdge;
}

/**
 * Hook that bridges Yjs Y.Map('edges') with ReactFlow's edge state.
 *
 * @param {Object} options
 * @param {boolean} options.enabled
 * @returns {{ edges: Object[], onEdgesChange: Function, setEdges: Function, addEdge: Function }}
 */
export function useCRDTEdges({ enabled = false } = {}) {
  const { ydoc, isCollaborative } = useCollaboration();
  const [edges, setLocalEdges] = useState([]);
  const isActive = enabled && isCollaborative && ydoc;
  const suppressObserverRef = useRef(false);

  // Yjs → React: Observe CRDT changes
  useEffect(() => {
    if (!isActive) return;

    const yEdges = ydoc.getMap("edges");

    const syncFromYjs = () => {
      if (suppressObserverRef.current) return;

      const edgeArray = [];
      yEdges.forEach((yEdge, id) => {
        edgeArray.push(yEdgeToPlain(id, yEdge));
      });
      setLocalEdges(edgeArray);
    };

    yEdges.observeDeep(syncFromYjs);
    syncFromYjs();

    return () => {
      yEdges.unobserveDeep(syncFromYjs);
    };
  }, [ydoc, isActive]);

  // React → Yjs: Handle ReactFlow edge changes
  const onEdgesChange = useCallback(
    (changes) => {
      if (!isActive) return;

      const yEdges = ydoc.getMap("edges");

      ydoc.transact(() => {
        for (const change of changes) {
          switch (change.type) {
            case "remove": {
              yEdges.delete(change.id);
              break;
            }

            case "select": {
              // Selection is local-only for edges too
              setLocalEdges((prev) =>
                prev.map((e) =>
                  e.id === change.id ? { ...e, selected: change.selected } : e,
                ),
              );
              break;
            }

            case "add": {
              if (change.item) {
                yEdges.set(change.item.id, plainToYEdge(change.item));
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

  // Direct setEdges for bulk operations
  const setEdges = useCallback(
    (updater) => {
      if (!isActive) return;

      const yEdges = ydoc.getMap("edges");
      const currentEdges =
        typeof updater === "function" ? updater(edges) : updater;

      suppressObserverRef.current = true;

      ydoc.transact(() => {
        // Remove edges that no longer exist
        yEdges.forEach((_, key) => {
          if (!currentEdges.find((e) => e.id === key)) {
            yEdges.delete(key);
          }
        });

        // Set all edges
        for (const edge of currentEdges) {
          const existing = yEdges.get(edge.id);
          if (existing && existing instanceof Y.Map) {
            // Update specific fields instead of replacing
            if (edge.source !== undefined) existing.set("source", edge.source);
            if (edge.target !== undefined) existing.set("target", edge.target);
            if (edge.data !== undefined) existing.set("data", edge.data);
            if (edge.animated !== undefined)
              existing.set("animated", edge.animated);
            if (edge.type !== undefined) existing.set("type", edge.type);
            if (edge.sourceHandle !== undefined)
              existing.set("sourceHandle", edge.sourceHandle);
            if (edge.targetHandle !== undefined)
              existing.set("targetHandle", edge.targetHandle);
            if (edge.style !== undefined) existing.set("style", edge.style);
            if (edge.markerEnd !== undefined)
              existing.set("markerEnd", edge.markerEnd);
            if (edge.label !== undefined) existing.set("label", edge.label);
          } else {
            yEdges.set(edge.id, plainToYEdge(edge));
          }
        }
      });

      suppressObserverRef.current = false;
      setLocalEdges(currentEdges);
    },
    [ydoc, isActive, edges],
  );

  // Add a connection (from ReactFlow's onConnect callback)
  const addEdge = useCallback(
    (edge) => {
      if (!isActive) return;
      const yEdges = ydoc.getMap("edges");
      ydoc.transact(() => {
        yEdges.set(edge.id, plainToYEdge(edge));
      });
    },
    [ydoc, isActive],
  );

  return {
    edges: isActive ? edges : [],
    onEdgesChange: isActive ? onEdgesChange : null,
    setEdges: isActive ? setEdges : null,
    addEdge: isActive ? addEdge : null,
  };
}

export default useCRDTEdges;
