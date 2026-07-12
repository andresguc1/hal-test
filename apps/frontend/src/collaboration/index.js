/**
 * Collaboration Module — Barrel Export
 *
 * Provides all collaboration primitives for the HalTest frontend.
 * Import from this file for clean paths:
 *
 *   import { CollaborationProvider, useCollaboration, useAwareness } from '../collaboration';
 */

export {
  CollaborationProvider,
  useCollaboration,
} from "./CollaborationProvider";
export { useAwareness } from "./useAwareness";
export { useCRDTNodes } from "./useCRDTNodes";
export { useCRDTEdges } from "./useCRDTEdges";
export { default as RemoteCursors } from "./RemoteCursors";
export { default as PresenceIndicator } from "./PresenceIndicator";
