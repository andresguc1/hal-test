import { describe, it, expect } from "vitest";
import {
  buildStepRows,
  resolveStepLabel,
  replayOrder,
  playbackStartIndex,
  nextPlaybackIndex,
} from "./stepRows";

const step = (over) => ({
  node_id: "n",
  node_type: "click",
  status: "success",
  compositeNodeId: null,
  ...over,
});

describe("buildStepRows — plain steps", () => {
  it("keeps linear steps in order as top-level rows", () => {
    const rows = buildStepRows([
      step({ node_id: "n1", node_type: "launch_browser" }),
      step({ node_id: "n2", node_type: "open_url" }),
      step({ node_id: "n3", node_type: "close_browser" }),
    ]);
    expect(rows.map((r) => r.type)).toEqual(["step", "step", "step"]);
    expect(rows.map((r) => r.flatIdx)).toEqual([0, 1, 2]);
  });

  it("does NOT group a retried node into a container", () => {
    const rows = buildStepRows([
      step({ node_id: "n1", status: "failed" }),
      step({ node_id: "n1", status: "success" }),
    ]);
    expect(rows.map((r) => r.type)).toEqual(["step", "step"]);
    expect(rows.map((r) => r.flatIdx)).toEqual([0, 1]);
  });
});

describe("buildStepRows — composites", () => {
  const container = step({
    node_id: "comp",
    node_type: "component",
    compositeNodeId: null,
  });
  const childA = step({ node_id: "a", compositeNodeId: "comp" });
  const childB = step({ node_id: "b", compositeNodeId: "comp" });

  it("nests children under their container exactly once", () => {
    const rows = buildStepRows([container, childA, childB]);
    expect(rows.map((r) => r.type)).toEqual(["container", "child", "child"]);
    expect(rows[0].step.node_id).toBe("comp");
    expect(rows.slice(1).map((r) => r.step.node_id)).toEqual(["a", "b"]);
    expect(rows.slice(1).map((r) => r.childIndex)).toEqual([1, 2]);
    expect(rows.slice(1).every((r) => r.childTotal === 2)).toBe(true);
    expect(rows.every((r) => r.depth === 0 || r.depth === 1)).toBe(true);
  });

  it("synthesizes a container row when the container step is missing", () => {
    const snapshot = {
      comp: { nodeId: "comp", type: "component", data: { label: "Checkout" } },
    };
    const rows = buildStepRows([childA], snapshot);
    expect(rows.map((r) => r.type)).toEqual(["container", "child"]);
    expect(rows[0].step.label).toBe("Checkout");
    expect(rows[0].step.node_id).toBe("comp");
    expect(rows[1].step.node_id).toBe("a");
  });
});

describe("buildStepRows — nested composites", () => {
  const outer = step({ node_id: "comp", node_type: "component" });
  const inner = step({ node_id: "loop1", node_type: "loop", compositeNodeId: "comp" });
  const innerChildA = step({ node_id: "a", compositeNodeId: "loop1" });
  const innerChildB = step({ node_id: "b", compositeNodeId: "loop1" });

  it("recurses into containers nested inside other containers", () => {
    const rows = buildStepRows([outer, inner, innerChildA, innerChildB]);
    expect(rows.map((r) => r.type)).toEqual([
      "container",
      "container",
      "child",
      "child",
    ]);
    expect(rows.map((r) => r.step.node_id)).toEqual([
      "comp",
      "loop1",
      "a",
      "b",
    ]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 2]);
    expect(rows.slice(2).map((r) => r.childIndex)).toEqual([1, 2]);
    expect(rows.slice(2).every((r) => r.childTotal === 2)).toBe(true);
  });

  it("recurses when the outer container step is missing", () => {
    const snapshot = {
      comp: { nodeId: "comp", type: "component", data: { label: "Outer" } },
    };
    const rows = buildStepRows([inner, innerChildA, innerChildB], snapshot);
    expect(rows.map((r) => r.type)).toEqual(["container", "container", "child", "child"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 2]);
    expect(rows[0].step.label).toBe("Outer");
  });
});

describe("resolveStepLabel", () => {
  it("prefers the flow snapshot's human label over the persisted id", () => {
    const snapshot = { n1: { nodeId: "n1", data: { label: "Launch Browser" } } };
    expect(resolveStepLabel(step({ node_id: "n1", label: "n1" }), snapshot)).toBe(
      "Launch Browser",
    );
  });

  it("falls back to a meaningful persisted label", () => {
    expect(resolveStepLabel(step({ node_id: "n1", label: "My Step" }))).toBe(
      "My Step",
    );
  });

  it("falls back to node_type then node_id", () => {
    expect(resolveStepLabel(step({ node_id: "n1", label: "n1" }))).toBe("click");
    expect(resolveStepLabel(step({ node_id: "n1", label: "n1", node_type: null }))).toBe(
      "n1",
    );
  });
});

describe("replayOrder", () => {
  it("derives playback order from the visible rows", () => {
    const rows = [
      { type: "container", flatIdx: 0 },
      { type: "child", flatIdx: 2 },
      { type: "child", flatIdx: 1 },
      { type: "step", flatIdx: 3 },
    ];
    expect(replayOrder(rows)).toEqual([0, 2, 1, 3]);
    expect(replayOrder([])).toEqual([]);
  });
});

describe("playbackStartIndex — play from any point", () => {
  const order = [0, 2, 1, 3];

  it("resumes from a selected mid-run step", () => {
    expect(playbackStartIndex(order, 2)).toBe(2);
  });

  it("rewinds to the start when nothing is selected", () => {
    expect(playbackStartIndex(order, -1)).toBe(0);
  });

  it("rewinds when the selection is not part of the order", () => {
    expect(playbackStartIndex(order, 99)).toBe(0);
  });

  it("restarts from the top when already on the final step", () => {
    expect(playbackStartIndex(order, 3)).toBe(0);
  });

  it("handles empty timelines", () => {
    expect(playbackStartIndex([], 0)).toBe(-1);
  });
});

describe("nextPlaybackIndex — advance through visible order", () => {
  const order = [0, 2, 1, 3];

  it("returns the next flat index in view order", () => {
    expect(nextPlaybackIndex(order, 0)).toBe(2);
    expect(nextPlaybackIndex(order, 2)).toBe(1);
    expect(nextPlaybackIndex(order, 1)).toBe(3);
  });

  it("returns -1 at the end", () => {
    expect(nextPlaybackIndex(order, 3)).toBe(-1);
  });

  it("starts at the first entry when the current index is unknown", () => {
    expect(nextPlaybackIndex(order, -1)).toBe(0);
  });

  it("returns -1 for an empty order", () => {
    expect(nextPlaybackIndex([], 0)).toBe(-1);
  });
});
