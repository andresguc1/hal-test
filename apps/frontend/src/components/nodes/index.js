import AbyssNode from "./AbyssNode";
import ComponentNode from "./ComponentNode";
import InputNode from "./InputNode";
import OutputNode from "./OutputNode";
import LoopNode from "./LoopNode";
import ForEachNode from "./ForEachNode";
import StickyNoteNode from "./StickyNoteNode";
import DiscussionNode from "./DiscussionNode";
import { NODE_TYPE_MAP } from "@/config/nodeConstants";

// DYNAMIC REGISTRY
// Automatically map every node type defined in our configuration to the AbyssNode component.
// This ensures that as soon as we add a node to nodeConstants.js, it works in the canvas.

const dynamicNodeTypes = Object.keys(NODE_TYPE_MAP).reduce((acc, type) => {
  if (type === "component") {
    acc[type] = ComponentNode;
  } else if (type === "input") {
    acc[type] = InputNode;
  } else if (type === "output") {
    acc[type] = OutputNode;
  } else if (type === "loop") {
    acc[type] = LoopNode;
  } else if (type === "for_each") {
    acc[type] = ForEachNode;
  } else if (type === "sticky_note") {
    acc[type] = StickyNoteNode;
  } else if (type === "discussion") {
    acc[type] = DiscussionNode;
  } else {
    acc[type] = AbyssNode;
  }
  return acc;
}, {});

export const nodeTypes = {
  ...dynamicNodeTypes,
  // Fallbacks
  default: AbyssNode,
  custom: AbyssNode, // MAP LEGACY 'custom' NODES TO ABYSSNODE TOO!
};
