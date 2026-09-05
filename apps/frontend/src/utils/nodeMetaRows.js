import {
  Globe,
  MousePointer,
  Terminal,
  Box,
  Layers,
  Repeat2,
  GitBranch,
} from "lucide-react";

/**
 * Pure helper: builds the metadata rows shown in the node info tooltip.
 * Lives outside the component file so it is unit-testable and so the
 * component file only exports components (react-refresh rule).
 *
 * Each row: { icon?: LucideIcon, text: string }
 */
export function buildNodeMetaRows(nodeKey, cfg = {}, data = {}) {
  const rows = [];

  if (cfg?.url) {
    rows.push({ icon: Globe, text: String(cfg.url) });
  }
  if (cfg?.selector || data?.selector) {
    rows.push({ icon: MousePointer, text: String(cfg.selector || data.selector) });
  }
  if (cfg?.text) {
    rows.push({ icon: Terminal, text: String(cfg.text) });
  }
  if (cfg?.textToFind) {
    rows.push({ icon: Terminal, text: String(cfg.textToFind) });
  }
  if (cfg?.value) {
    rows.push({ icon: Terminal, text: `value: ${String(cfg.value)}` });
  }
  if (cfg?.flowId || data?.flowId) {
    rows.push({ icon: Layers, text: String(cfg.flowId || data.flowId) });
  }
  if (cfg?.source) {
    rows.push({ text: `source: ${String(cfg.source)}` });
  }
  if (cfg?.array) {
    rows.push({ text: `array: ${String(cfg.array)}` });
  }
  if (cfg?.mode) {
    rows.push({ icon: Repeat2, text: `mode: ${String(cfg.mode)}` });
  }
  if (cfg?.iterations) {
    rows.push({ text: `iterations: ${String(cfg.iterations)}` });
  }
  if (nodeKey === "conditional" && cfg?.branches?.length) {
    rows.push({
      icon: GitBranch,
      text: `branches: ${cfg.branches.map((b) => b.label || b.id).join(" · ")}`,
    });
  }
  if (nodeKey === "switch" && cfg?.cases?.length) {
    rows.push({
      icon: GitBranch,
      text: `cases: ${cfg.cases.map((c) => c.label || c.id).join(" · ")}`,
    });
  }

  // Composite nodes: node count inside
  const nodeCount =
    data.nodeCount ?? data.subNodes?.length ?? cfg?.subNodes?.length;
  if (nodeKey === "component" || nodeKey === "loop" || nodeKey === "for_each") {
    if (typeof nodeCount === "number" && nodeCount > 0) {
      rows.push({ icon: Box, text: `${nodeCount} node(s) inside` });
    }
  }

  return rows;
}