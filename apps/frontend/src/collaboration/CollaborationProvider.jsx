/* eslint-disable react-refresh/only-export-components */
/**
 * CollaborationProvider — React context for Yjs document synchronization.
 *
 * Manages the lifecycle of Y.Doc instances, WebSocket providers, and
 * awareness state for real-time collaboration. Provides hooks for
 * child components to access CRDT-backed state.
 *
 * Usage:
 *   <CollaborationProvider flowId={currentFlowId} user={currentUser}>
 *     <Dashboard />
 *   </CollaborationProvider>
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as Y from "yjs";
import { useAuth } from "../context/AuthContext";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

// ── Context ────────────────────────────────────────────────────────────

const CollaborationContext = createContext(null);

/**
 * @typedef {Object} CollaborationState
 * @property {Y.Doc | null} ydoc - The shared Yjs document
 * @property {WebsocketProvider | null} provider - WebSocket sync provider
 * @property {import('y-protocols/awareness').Awareness | null} awareness
 * @property {boolean} isConnected - WebSocket connection status
 * @property {boolean} isSynced - Initial sync completed
 * @property {boolean} isCollaborative - Whether collaboration is active
 * @property {Object[]} peers - Connected remote users
 * @property {Function} updateCursor - Update local cursor position
 * @property {Function} updateSelection - Update local selection state
 */

// ── Helpers ────────────────────────────────────────────────────────────

const getCollabServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Replace /api with empty to get base URL, then use ws:// protocol
    const baseUrl = apiUrl.replace(/\/api$/, "");
    return baseUrl.replace(/^http/, "ws");
  }

  if (import.meta.env.DEV) {
    return "ws://127.0.0.1:2001";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};

const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F0B27A",
  "#82E0AA",
];

const getColorForUser = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

// ── Provider Component ────────────────────────────────────────────────

export function CollaborationProvider({
  flowId,
  user,
  enabled = false,
  role = "owner",
  children,
}) {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [peers, setPeers] = useState([]);

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const indexeddbRef = useRef(null);
  const previousFlowIdRef = useRef(null);

  // Cleanup previous collaboration session
  const cleanup = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (indexeddbRef.current) {
      indexeddbRef.current.destroy();
      indexeddbRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    setIsConnected(false);
    setIsSynced(false);
    setPeers([]);
  }, []);

  // Initialize collaboration when flowId changes and collab is enabled
  useEffect(() => {
    if (!enabled || !flowId || !user) {
      cleanup();
      return;
    }

    // Skip if same flow
    if (previousFlowIdRef.current === flowId && ydocRef.current) {
      return;
    }

    // Clean up previous session
    cleanup();
    previousFlowIdRef.current = flowId;

    // Create new Y.Doc for this flow
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Set up IndexedDB persistence for local-first offline support
    const idbPersistence = new IndexeddbPersistence(
      `haltest-flow-${flowId}`,
      ydoc,
    );
    indexeddbRef.current = idbPersistence;

    idbPersistence.on("synced", () => {
      console.log(`[Collaboration] 💾 IndexedDB synced for flow: ${flowId}`);
    });

    // Set up WebSocket provider for real-time sync
    const serverUrl = getCollabServerUrl();
    const roomName = `flow-${flowId}`;

    const wsProvider = new WebsocketProvider(
      serverUrl + "/collab",
      roomName,
      ydoc,
      {
        connect: true,
        resyncInterval: 5000, // Re-sync every 5 seconds as a safety net
        maxBackoffTime: 5000,
        params: {
          token: session?.access_token || "local-dev-token",
          userId: user.id || "anonymous",
        },
      },
    );
    providerRef.current = wsProvider;

    // Set local user awareness state
    wsProvider.awareness.setLocalStateField("user", {
      id: user.id || user.email || "anonymous",
      name: user.name || user.email || "Anonymous",
      color: getColorForUser(user.id || user.email || "anonymous"),
      avatar: user.avatar || null,
      role: role,
    });
    wsProvider.awareness.setLocalStateField("editingNodeId", null);

    // Track connection status
    wsProvider.on("status", ({ status }) => {
      const connected = status === "connected";
      setIsConnected(connected);
      console.log(
        `[Collaboration] 📡 Status: ${status} for room "${roomName}"`,
      );
    });

    wsProvider.on("sync", (synced) => {
      setIsSynced(synced);
      if (synced) {
        console.log(
          `[Collaboration] ✅ Initial sync complete for room "${roomName}"`,
        );
      }
    });

    // Track peer awareness changes
    const awarenessChangeHandler = () => {
      const states = [];
      wsProvider.awareness.getStates().forEach((state, clientId) => {
        if (clientId !== ydoc.clientID && state.user) {
          states.push({
            clientId,
            user: state.user,
            cursor: state.cursor || null,
            selection: state.selection || [],
            editingNodeId: state.editingNodeId || null,
            executionState: state.executionState || null,
          });
        }
      });

      // ONLY update if it actually changed meaningfully to prevent mouse-move lag
      setPeers((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(states)) {
          return prev;
        }
        return states;
      });
    };

    wsProvider.awareness.on("change", awarenessChangeHandler);

    return () => {
      wsProvider.awareness.off("change", awarenessChangeHandler);
      cleanup();
    };
  }, [flowId, user, enabled, role, session, cleanup]);

  // Cursor update (throttled via requestAnimationFrame)
  const cursorRafRef = useRef(null);
  const updateCursor = useCallback(
    (position) => {
      if (!providerRef.current || !enabled) return;
      if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
      cursorRafRef.current = requestAnimationFrame(() => {
        providerRef.current.awareness.setLocalStateField("cursor", position);
      });
    },
    [enabled],
  );

  // Selection update
  const updateSelection = useCallback(
    (nodeIds) => {
      if (!providerRef.current || !enabled) return;
      providerRef.current.awareness.setLocalStateField("selection", nodeIds);
    },
    [enabled],
  );

  // Lock/Unlock editing node for advisory soft-locks
  const lockNode = useCallback(
    (nodeId) => {
      if (!providerRef.current || !enabled) return;
      providerRef.current.awareness.setLocalStateField("editingNodeId", nodeId);
    },
    [enabled],
  );

  const unlockNode = useCallback(() => {
    if (!providerRef.current || !enabled) return;
    providerRef.current.awareness.setLocalStateField("editingNodeId", null);
  }, [enabled]);

  // Execution state update (e.g. running: true/false, user details, etc.)
  const setExecutionState = useCallback(
    (execState) => {
      if (!providerRef.current || !enabled) return;
      providerRef.current.awareness.setLocalStateField(
        "executionState",
        execState,
      );
    },
    [enabled],
  );

  const contextValue = useMemo(
    () => ({
      ydoc: ydocRef.current,
      provider: providerRef.current,
      awareness: providerRef.current?.awareness || null,
      isConnected,
      isSynced,
      isCollaborative: enabled && !!flowId,
      peers,
      role,
      updateCursor,
      updateSelection,
      lockNode,
      unlockNode,
      setExecutionState,
    }),
    [
      isConnected,
      isSynced,
      enabled,
      flowId,
      peers,
      role,
      updateCursor,
      updateSelection,
      lockNode,
      unlockNode,
      setExecutionState,
    ],
  );

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * Access the collaboration context.
 * Returns null-safe defaults when collaboration is disabled.
 * @returns {CollaborationState}
 */
export function useCollaboration() {
  const ctx = useContext(CollaborationContext);

  // Return safe defaults when not inside a provider or collab is disabled
  if (!ctx) {
    return {
      ydoc: null,
      provider: null,
      awareness: null,
      isConnected: false,
      isSynced: false,
      isCollaborative: false,
      peers: [],
      role: "owner",
      updateCursor: () => {},
      updateSelection: () => {},
      lockNode: () => {},
      unlockNode: () => {},
      setExecutionState: () => {},
    };
  }

  return ctx;
}

export default CollaborationProvider;
