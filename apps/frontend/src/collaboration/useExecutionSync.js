/**
 * useExecutionSync — Syncs ephemeral execution states of nodes/edges via Y.Map.
 *
 * Ephemeral execution states (like EXECUTING, SUCCESS, ERROR) are kept in a
 * dedicated, non-persisted Y.Map('executionState') to avoid polluting the DB.
 */

import { useEffect, useState, useCallback } from "react";
import { useCollaboration } from "./CollaborationProvider";

export function useExecutionSync() {
  const { ydoc, isCollaborative, isConnected } = useCollaboration();
  const [executionStates, setExecutionStates] = useState({});
  const isActive = isCollaborative && isConnected && ydoc;

  useEffect(() => {
    if (!isActive) {
      setExecutionStates({});
      return;
    }

    const yExecMap = ydoc.getMap("executionState");

    const syncFromYjs = () => {
      const states = {};
      yExecMap.forEach((val, key) => {
        states[key] = val;
      });
      setExecutionStates(states);
    };

    yExecMap.observe(syncFromYjs);
    syncFromYjs(); // Initial sync

    return () => {
      yExecMap.unobserve(syncFromYjs);
    };
  }, [ydoc, isActive]);

  /**
   * Broadcast state update for a node or edge.
   * @param {string} id - Node or Edge ID
   * @param {'node' | 'edge' | 'edge_by_source'} type
   * @param {string} state - Execution state (EXECUTING, SUCCESS, ERROR)
   * @param {Object} [data] - Additional metadata (error details, message, etc.)
   */
  const broadcastElementState = useCallback(
    (id, type, state, data = {}) => {
      if (!isActive) return;
      const yExecMap = ydoc.getMap("executionState");
      yExecMap.set(id, {
        type,
        state,
        ts: Date.now(),
        data,
      });
    },
    [ydoc, isActive],
  );

  /**
   * Clear all ephemeral execution states.
   */
  const clearExecutionStates = useCallback(() => {
    if (!isActive) return;
    const yExecMap = ydoc.getMap("executionState");
    ydoc.transact(() => {
      yExecMap.clear();
    });
  }, [ydoc, isActive]);

  return {
    executionStates,
    broadcastElementState,
    clearExecutionStates,
  };
}

export default useExecutionSync;
