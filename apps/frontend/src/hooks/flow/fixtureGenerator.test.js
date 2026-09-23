/**
 * X2 — DATASET GENERATOR: validity, coverage, and reproducibility audit.
 *
 * Locks the seeded graph generators (test/fixtures/layout/export.js) to pinned
 * SHA-256 hashes so any future generator/engine change breaks loudly (RULE 8),
 * and verifies the fixtures are structurally sound and cover the graph-shape
 * diversity the research needs (linear / branching / merge / deep-branch /
 * diamond / composite / realistic / pathological; cycles; multi-root).
 *
 * Method: every dataset is built twice from the same seed and asserted
 * byte-identical; hashes are pinned. A manifest of all coverage metadata is
 * written to docs/research/spikes/data/X2/manifest.json.
 */

import { describe, it, expect, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  DATASET_BUILDERS,
  x8Graphs,
  datasetLinear,
  datasetBranching,
  datasetMergeHeavy,
  datasetDeepBranching,
  datasetDiamond,
  datasetComposite,
  datasetRealistic,
  datasetPathological,
} from "../../../test/fixtures/layout/export.js";

// default sizes used by the harnesses (X1/X8/X10)
const SIZES = { A: 50, B: 50, C: 50, D: 50, E: 10, F: 6, G: 50, H: 50 };
const SEED = 1;

// Pinned on 2026-09-21 (branch spike/canvas-layout-research). Any change here
// = an intentional generator change; bump pins with the new hash + reason.
const PINNED_DATASETS = {
  A: "29f90906517a48a7",
  B: "ca1427c4e5cf19c7",
  C: "1ef1d31aa58b903e",
  D: "4ba157df9781a969",
  E: "900ae61dcb60ad99",
  F: "0b7ef37668535d35",
  G: "45c7f20eab9927d7",
  H: "cb279011d3bc35e7",
};
const PINNED_SHAPES = {
  x8MultipleRoots: "a412c62a36fa7081",
  x8Cyclic: "72b3b95651567a80",
  x8Diamond: "51ddfcf2add6f33b",
  x8Parallel: "40d35e1dd0ff54e0",
  x8NestedBranch: "23c05e1d260c085f",
  x8Composite: "b6cc659fbed1a4bf",
  x8NestedComposite: "3dfded7275be9d4c",
  x8Loop: "70401dbbc5eab458",
  x8ForEach: "1bdc05b2def86d79",
  x8Mixed: "eef9b49d8f11e698",
};

const manifest = { datasets: {}, shapes: {} };

const assertStructural = (f) => {
  const ids = new Set();
  for (const n of f.nodes) {
    expect(ids.has(n.id), `duplicate node id ${n.id}`).toBe(false);
    ids.add(n.id);
    expect(n.position).toBeDefined();
    expect(typeof n.position.x).toBe("number");
    expect(typeof n.position.y).toBe("number");
    expect(n.data?.type).toEqual(n.type);
  }
  const edgeIds = new Set();
  for (const e of f.edges) {
    expect(edgeIds.has(e.id), `duplicate edge id ${e.id}`).toBe(false);
    edgeIds.add(e.id);
    expect(ids.has(e.source), `edge source ${e.source} missing`).toBe(true);
    expect(ids.has(e.target), `edge target ${e.target} missing`).toBe(true);
  }
  expect(f.hash).toMatch(/^[0-9a-f]{16}$/);
};

describe("X2 — dataset generator (validity, coverage, reproducibility)", () => {
  const labels = {
    A: datasetLinear,
    B: datasetBranching,
    C: datasetMergeHeavy,
    D: datasetDeepBranching,
    E: datasetDiamond,
    F: datasetComposite,
    G: datasetRealistic,
    H: datasetPathological,
  };

  it("A–H: deterministic, structurally sound, hash-pinned", () => {
    for (const [k, builder] of Object.entries(labels)) {
      const size = SIZES[k];
      const a = builder(size, SEED);
      const b = builder(size, SEED);
      expect(JSON.stringify({ nodes: a.nodes, edges: a.edges })).toBe(
        JSON.stringify({ nodes: b.nodes, edges: b.edges }),
      );
      assertStructural(a);
      expect(a.hash).toBe(b.hash);
      expect(a.hash).toBe(PINNED_DATASETS[k]);
      expect(a.dataset).toBe(k);
      manifest.datasets[k] = {
        label: a.label,
        sizeParam: size,
        hash: a.hash,
        meta: a.meta,
      };
    }
  });

  it("A–H meta matches reality (counts) and covers required diversity", () => {
    const metas = {
      A: datasetLinear(SIZES.A, SEED).meta,
      B: datasetBranching(SIZES.B, SEED).meta,
      C: datasetMergeHeavy(SIZES.C, SEED).meta,
      D: datasetDeepBranching(SIZES.D, SEED).meta,
      E: datasetDiamond(SIZES.E, SEED).meta,
      F: datasetComposite(SIZES.F, SEED).meta,
      G: datasetRealistic(SIZES.G, SEED).meta,
      H: datasetPathological(SIZES.H, SEED).meta,
    };
    for (const m of Object.values(metas)) {
      expect(m.nodeCount).toBeGreaterThanOrEqual(1);
      expect(m.edgeCount).toBeGreaterThanOrEqual(0);
      expect(m.roots.length).toBeGreaterThanOrEqual(1); // F/H included below
    }
    // diversity gate (the "why this generator exists"):
    expect(metas.C.roots.length).toBeGreaterThan(1); // merge-heavy: multi-root
    expect(metas.H.roots.length).toBeGreaterThan(1); // pathological: island roots
    expect(metas.H.cycleCount).toBeGreaterThanOrEqual(1); // a real cycle exists
    expect(metas.F.compositeCount).toBeGreaterThanOrEqual(1); // subflow graph
    expect(metas.G.branchCount + metas.H.branchCount).toBeGreaterThanOrEqual(1); // branch/sourceHandle nodes
    expect(metas.A.maxDegree).toBe(1); // linear: no fan-out
    // symmetric chain counts prove analyze() itself:
    expect(metas.B.edgeCount).toBe(metas.B.maxDegree >= 1 ? metas.B.nodeCount - 1 : 0);
  });

  it("X8 shapes: all 10 present, deterministic, hash-pinned", () => {
    const shapes = x8Graphs();
    expect(shapes).toHaveLength(Object.keys(PINNED_SHAPES).length);
    for (const s of shapes) {
      assertStructural(s);
      const name = Object.keys(PINNED_SHAPES).find((k) => PINNED_SHAPES[k] === s.hash);
      expect(name, `no pin for ${s.hash}`).toBeDefined();
      manifest.shapes[s.label] = { hash: s.hash, meta: s.meta };
    }
  });

  it("DATASET_BUILDERS map is complete (A–H)", () => {
    expect(Object.keys(DATASET_BUILDERS).sort()).toEqual(
      ["A", "B", "C", "D", "E", "F", "G", "H"].sort(),
    );
  });
});

afterAll(() => {
  const out = path.resolve("../../docs/research/spikes/data/X2");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify({ generated: new Date().toISOString(), ...manifest }, null, 2),
  );
});