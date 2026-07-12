/**
 * useAwareness — Hook for cursor tracking and user presence.
 *
 * Provides:
 *   - `peers` — List of connected remote users with their cursor positions
 *   - `updateCursor` — Update local cursor position (throttled to ~30fps)
 *   - `updateSelection` — Broadcast which nodes the local user has selected
 *   - `peerCount` — Number of connected collaborators
 */

import { useCollaboration } from "./CollaborationProvider";

/**
 * @typedef {Object} Peer
 * @property {number} clientId
 * @property {Object} user - { id, name, color, avatar }
 * @property {{ x: number, y: number } | null} cursor
 * @property {string[]} selection - Selected node IDs
 */

export function useAwareness() {
  const { isCollaborative, peers, updateCursor, updateSelection } =
    useCollaboration();

  const peerCount = peers.length;

  // Get nodes that are selected by remote users (for highlighting)
  const remoteSelections = peers.reduce((acc, peer) => {
    if (peer.selection && peer.selection.length > 0) {
      peer.selection.forEach((nodeId) => {
        if (!acc[nodeId]) acc[nodeId] = [];
        acc[nodeId].push(peer.user);
      });
    }
    return acc;
  }, {});

  return {
    peers,
    peerCount,
    updateCursor,
    updateSelection,
    remoteSelections,
    isCollaborative,
  };
}

export default useAwareness;
