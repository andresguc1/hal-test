import AbyssNode from "./AbyssNode";
import CustomNode from "./CustomNode";
import { NODE_TYPE_MAP } from "@/config/nodeConstants";

// DYNAMIC REGISTRY
// Automatically map every node type defined in our configuration to the AbyssNode component.
// This ensures that as soon as we add a node to nodeConstants.js, it works in the canvas.

const dynamicNodeTypes = Object.keys(NODE_TYPE_MAP).reduce((acc, type) => {
  acc[type] = AbyssNode;
  return acc;
}, {});

export const nodeTypes = {
  ...dynamicNodeTypes,
  // Fallbacks
  default: AbyssNode,
  custom: AbyssNode, // MAP LEGACY 'custom' NODES TO ABYSSNODE TOO!
};
