import { describe, it, expect } from "vitest";
import { getLayoutedElements } from "./layoutUtils";

function branchNode(id, type, config = {}) {
  return {
    id,
    type,
    data: { type, configuration: config },
  };
}

function checkOverlaps(nodes) {
  const overlaps = [];
  const sizeOf = (n) => {
    if (n.type === "conditional" || n.type === "switch") return [212, 120];
    if (n.type === "loop" || n.type === "for_each") return [240, 160];
    return [212, 120];
  };
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const [aw, ah] = sizeOf(a);
      const [bw, bh] = sizeOf(b);
      const noOverlap =
        a.position.x + aw <= b.position.x ||
        b.position.x + bw <= a.position.x ||
        a.position.y + ah <= b.position.y ||
        b.position.y + bh <= a.position.y;
      if (!noOverlap) overlaps.push([a.id, b.id]);
    }
  }
  return overlaps;
}

describe("getLayoutedElements - branch semantics (LR)", () => {
  it("places the TRUE branch above the FALSE branch", () => {
    const nodes = [
      branchNode("cond", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A", data: { type: "click" } },
      { id: "B", data: { type: "click" } },
    ];
    const edges = [
      { source: "cond", target: "A", sourceHandle: "true" },
      { source: "cond", target: "B", sourceHandle: "false" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    const a = layouted.find((n) => n.id === "A");
    const b = layouted.find((n) => n.id === "B");
    expect(a.position.y).toBeLessThan(b.position.y);
  });

  it("places switch cases in declaration order (default last)", () => {
    const nodes = [
      branchNode("sw", "switch", {
        cases: [{ id: "caseA" }, { id: "caseB" }, { id: "caseC" }],
      }),
      { id: "s1", data: { type: "click" } },
      { id: "s2", data: { type: "click" } },
      { id: "s3", data: { type: "click" } },
      { id: "s4", data: { type: "click" } },
    ];
    const edges = [
      { source: "sw", target: "s1", sourceHandle: "caseA" },
      { source: "sw", target: "s2", sourceHandle: "caseB" },
      { source: "sw", target: "s3", sourceHandle: "caseC" },
      { source: "sw", target: "s4", sourceHandle: "default" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    const y = {};
    layouted.forEach((n) => (y[n.id] = n.position.y));
    expect(y.s1).toBeLessThan(y.s2);
    expect(y.s2).toBeLessThan(y.s3);
    expect(y.s3).toBeLessThan(y.s4);
  });

  it("produces zero node overlaps for a converging conditional workflow", () => {
    const nodes = [
      { id: "start", data: { type: "findElement" } },
      branchNode("cond", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A", data: { type: "click" } },
      { id: "B", data: { type: "click" } },
      { id: "next", data: { type: "goBack" } },
    ];
    const edges = [
      { source: "start", target: "cond" },
      { source: "cond", target: "A", sourceHandle: "true" },
      { source: "cond", target: "B", sourceHandle: "false" },
      { source: "A", target: "next" },
      { source: "B", target: "next" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    expect(checkOverlaps(layouted)).toEqual([]);
  });

  it("produces zero overlaps for nested conditionals and a switch merge", () => {
    const nodes = [
      { id: "start", data: { type: "findElement" } },
      branchNode("cond1", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A", data: { type: "click" } },
      branchNode("cond2", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A1", data: { type: "click" } },
      { id: "A2", data: { type: "click" } },
      { id: "B", data: { type: "loop" } },
      branchNode("sw", "switch", { cases: [{ id: "caseA" }, { id: "caseB" }] }),
      { id: "S1", data: { type: "click" } },
      { id: "S2", data: { type: "click" } },
      { id: "next", data: { type: "goBack" } },
    ];
    const edges = [
      { source: "start", target: "cond1" },
      { source: "cond1", target: "A", sourceHandle: "true" },
      { source: "cond1", target: "B", sourceHandle: "false" },
      { source: "A", target: "cond2" },
      { source: "cond2", target: "A1", sourceHandle: "true" },
      { source: "cond2", target: "A2", sourceHandle: "false" },
      { source: "A1", target: "next" },
      { source: "A2", target: "next" },
      { source: "B", target: "sw" },
      { source: "sw", target: "S1", sourceHandle: "caseA" },
      { source: "sw", target: "S2", sourceHandle: "caseB" },
      { source: "S1", target: "next" },
      { source: "S2", target: "next" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    expect(checkOverlaps(layouted)).toEqual([]);
  });

  it("is deterministic across repeated runs", () => {
    const nodes = [
      branchNode("cond", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A", data: { type: "click" } },
      { id: "B", data: { type: "click" } },
      { id: "next", data: { type: "goBack" } },
    ];
    const edges = [
      { source: "cond", target: "A", sourceHandle: "true" },
      { source: "cond", target: "B", sourceHandle: "false" },
      { source: "A", target: "next" },
      { source: "B", target: "next" },
    ];
    const [run1] = getLayoutedElements(nodes, edges, "LR");
    const [run2] = getLayoutedElements(nodes, edges, "LR");
    run1.forEach((n) => {
      const m = run2.find((x) => x.id === n.id);
      expect(m.position.x).toBeCloseTo(n.position.x, 5);
      expect(m.position.y).toBeCloseTo(n.position.y, 5);
    });
  });

  it("handles a simple linear chain", () => {
    const nodes = [
      { id: "a", data: { type: "x" } },
      { id: "b", data: { type: "x" } },
      { id: "c", data: { type: "x" } },
      { id: "d", data: { type: "x" } },
    ];
    const edges = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "c", target: "d" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    expect(checkOverlaps(layouted)).toEqual([]);
    // Linear chain should be strictly left-to-right.
    const a = layouted.find((n) => n.id === "a");
    const d = layouted.find((n) => n.id === "d");
    expect(a.position.x).toBeLessThan(d.position.x);
  });

  it("scales to a large workflow (100+ nodes) without overlaps or regression", () => {
    // Build 6 chained conditional/switch blocks, each branching into 2 cases,
    // every branch converging into a shared next node. ~107 nodes total.
    const nodes = [];
    const edges = [];
    nodes.push({ id: "start", data: { type: "findElement" } });
    let prev = "start";
    for (let b = 0; b < 27; b += 1) {
      const condId = `cond${b}`;
      nodes.push(
        branchNode(condId, "conditional", {
          branches: [{ id: "true" }, { id: "false" }],
        }),
      );
      edges.push({ source: prev, target: condId });
      const branchA = `a${b}`;
      const branchB = `b${b}`;
      nodes.push({ id: branchA, data: { type: "click" } });
      nodes.push({ id: branchB, data: { type: "click" } });
      edges.push({ source: condId, target: branchA, sourceHandle: "true" });
      edges.push({ source: condId, target: branchB, sourceHandle: "false" });
      prev = `merge${b}`;
      nodes.push({ id: prev, data: { type: "goBack" } });
      edges.push({ source: branchA, target: prev });
      edges.push({ source: branchB, target: prev });
    }
    nodes.push({ id: "end", data: { type: "goBack" } });
    edges.push({ source: prev, target: "end" });

    expect(nodes.length).toBeGreaterThan(100);

    const start = performance.now();
    const [layouted] = getLayoutedElements(nodes, edges, "LR");
    const elapsed = performance.now() - start;

    expect(checkOverlaps(layouted)).toEqual([]);
    // Keep layout cost reasonable even at this scale. The ceiling is generous
    // on purpose so it does not flake under CI CPU contention, while still
    // catching an algorithmic-complexity regression (a polynomial blow-up on
    // the merge/branch post-passes would massively exceed it).
    expect(elapsed).toBeLessThan(2000);

    // Re-run to confirm determinism at scale.
    const [layouted2] = getLayoutedElements(nodes, edges, "LR");
    layouted.forEach((n) => {
      const m = layouted2.find((x) => x.id === n.id);
      expect(m.position.x).toBeCloseTo(n.position.x, 5);
      expect(m.position.y).toBeCloseTo(n.position.y, 5);
    });
  });

  it("accepts per-call spacing overrides while remaining collision-free", () => {
    const nodes = [
      branchNode("cond", "conditional", {
        branches: [{ id: "true" }, { id: "false" }],
      }),
      { id: "A", data: { type: "click" } },
      { id: "B", data: { type: "click" } },
      { id: "next", data: { type: "goBack" } },
    ];
    const edges = [
      { source: "cond", target: "A", sourceHandle: "true" },
      { source: "cond", target: "B", sourceHandle: "false" },
      { source: "A", target: "next" },
      { source: "B", target: "next" },
    ];
    const [layouted] = getLayoutedElements(nodes, edges, {
      direction: "LR",
      branchSpacing: 0,
      mergeSpacing: 0,
    });
    expect(checkOverlaps(layouted)).toEqual([]);
    const a = layouted.find((n) => n.id === "A");
    const b = layouted.find((n) => n.id === "B");
    expect(a.position.y).toBeLessThan(b.position.y);
  });
});
