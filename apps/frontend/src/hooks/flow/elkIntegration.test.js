/**
 * X7 — ELK INTEGRATION SPIKE (você plan §17): package reality, bundle cost,
 * license, API determinism, compound (composite-flow) support, incremental
 * hooks, edge routing, and worker-thread execution — measured, not assumed.
 *
 * Evidence goes to docs/research/spikes/data/X7/results.json and drives the
 * adopt-ELK recommendation from X3 past the "is it installable/usable"
 * gate. No production code is touched (RULE 1).
 */

import { describe, it, expect, afterAll } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import ELKMain from "elkjs/lib/elk.bundled.js";
import { datasetBranching } from "../../../test/fixtures/layout/export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "../../../node_modules/elkjs");
const require2 = createRequire(path.join(__dirname, "x.js"));
void require2;

const elkGraph = (fixture) => ({
  id: "root",
  layoutOptions: {
    "elk.algorithm": "layered",
    "elk.direction": "RIGHT",
    "elk.layered.spacing.nodeNodeBetweenLayers": "90",
    "elk.spacing.nodeNode": "60",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.separateConnectedComponents": "false",
  },
  children: fixture.nodes.map((n) => ({
    id: n.id,
    width: n.width || 220,
    height: n.height || 72,
  })),
  edges: fixture.edges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  })),
});

const positionsOf = (out) =>
  Object.fromEntries(
    (out.children || []).map((c) => [
      c.id,
      [Math.round(c.x * 1000) / 1000, Math.round(c.y * 1000) / 1000],
    ]),
  );

const results = {};

describe("X7 — ELK integration spike", { timeout: 240_000 }, () => {
  it("package reality: version, license, main bundle cost (raw + gzip)", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(pkgRoot, "package.json"), "utf8"),
    );
    const bundled = readFileSync(path.join(pkgRoot, "lib/elk.bundled.js"));
    const min = readFileSync(path.join(pkgRoot, "lib/elk-worker.min.js"));
    results.package = {
      version: pkg.version,
      license: pkg.license,
      raw_bundled_bytes: bundled.length,
      gzip_bundled_bytes: gzipSync(bundled).length,
      raw_worker_min_bytes: min.length,
      gzip_worker_min_bytes: gzipSync(min).length,
    };
    // regulatory note: EPL-2.0/GPL-3 dual — NOT an MIT-style license.
    expect(pkg.license).toBe("EPL-2.0 OR GPL-3.0-or-later");
    expect(results.package.gzip_bundled_bytes).toBeLessThan(700 * 1024);
  });

  it(
    "API determinism: 3 identical-runs + explicit-option run identical",
    { timeout: 240_000 },
    async () => {
      const elk = new ELKMain();
      const fixture = datasetBranching(100, 1);
      const graph = elkGraph(fixture);
      const a = positionsOf(await elk.layout(graph));
      const b = positionsOf(await elk.layout(graph));
      const c = positionsOf(await elk.layout(graph));
      const explicit = { ...graph };
      explicit.layoutOptions = {
        ...graph.layoutOptions,
        "elk.layered.thoroughness": "7",
      };
      const d = positionsOf(await elk.layout(explicit));
      results.determinism = {
        repeat_identical:
          JSON.stringify(a) === JSON.stringify(b) &&
          JSON.stringify(b) === JSON.stringify(c),
        option_identical: JSON.stringify(a) === JSON.stringify(d),
        positionHash: sha1(a),
      };
      expect(results.determinism.repeat_identical).toBe(true);
    },
  );

  it(
    "compound support: a composite (subflow) node lays OUT as a cluster",
    { timeout: 120_000 },
    async () => {
      const elk = new ELKMain();
      const graph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": "RIGHT",
          "elk.padding.nodeNode": "10",
        },
        children: [
          {
            id: "parent",
            width: 400,
            height: 300,
            children: [
              { id: "b1", width: 120, height: 40 },
              { id: "b2", width: 120, height: 40 },
              { id: "b3", width: 120, height: 40 },
            ],
            edges: [
              { id: "eb1", sources: ["b1"], targets: ["b2"] },
              { id: "eb2", sources: ["b2"], targets: ["b3"] },
            ],
          },
          { id: "sink", width: 220, height: 72 },
        ],
        edges: [{ id: "e_p_s", sources: ["parent"], targets: ["sink"] }],
      };
      const out = await elk.layout(graph);
      const parent = out.children.find((c) => c.id === "parent");
      const kids = parent?.children || [];
      const inside = kids.every(
        (k) =>
          k.x >= 0 &&
          k.y >= 0 &&
          k.x + k.width <= parent.width &&
          k.y + k.height <= parent.height,
      );
      results.compound = {
        supported_with_children_nesting:
          kids.length === 3 && inside && parent.width > 0 && parent.height > 0,
        childCount: kids.length,
        parentBox: [parent?.x, parent?.y, parent?.width, parent?.height],
      };
      expect(results.compound.supported_with_children_nesting).toBe(true);
    },
  );

  it(
    "incremental hooks: probe ELK move/delete/restart support honestly",
    { timeout: 120_000 },
    async () => {
      const elk = new ELKMain();
      const fixture = datasetBranching(50, 1);
      const base = positionsOf(await elk.layout(elkGraph(fixture)));
      // attempt true incremental: feed previous positions + incremental option.
      const g = elkGraph(fixture);
      g.children = g.children.map((c) => ({
        ...c,
        x: base[c.id]?.[0],
        y: base[c.id]?.[1],
      }));
      g.layoutOptions["elk.layered.incremental"] = "true";
      try {
        const moved = positionsOf(await elk.layout(g));
        results.incremental = {
          accepted_initial_positions:
            JSON.stringify(moved) !== JSON.stringify({}),
          identical_to_base: JSON.stringify(moved) === JSON.stringify(base), // if false → positions feed-back changes result (de-incremental)
        };
      } catch (e) {
        results.incremental = { error: String(e) };
      }
      // incremental/delete/move ops: attempt sorry-not-supported path
      results.incremental.ops = {
        move: typeof elk?.move === "function",
        delete: typeof elk?.delete === "function",
      };
    },
  );

  it(
    "edge routing: ORTHOGONAL returns routed edge sections",
    { timeout: 120_000 },
    async () => {
      const elk = new ELKMain();
      const fixture = datasetBranching(40, 1);
      const g = elkGraph(fixture);
      g.edges = g.edges.map((e) => ({ ...e, sections: [] }));
      const out = await elk.layout(g);
      const routed = (out.edges || []).filter(
        (e) => Array.isArray(e.sections) && e.sections.length > 0,
      );
      const anySection = (out.edges || []).some((e) =>
        (e.sections || []).some((s) => (s.bendPoints || []).length > 0),
      );
      results.edgeRouting = {
        edges_returned_with_sections: routed.length,
        edges_with_bends: (out.edges || []).filter((e) =>
          (e.sections || []).some((s) => (s.bendPoints || []).length > 0),
        ).length,
        total_edges: (out.edges || []).length,
        any_bend: anySection,
      };
      expect(anySection).toBe(true);
    },
  );

  it(
    "worker-thread execution (node:worker_threads) == main-thread geometry",
    { timeout: 240_000 },
    async () => {
      const fixture = datasetBranching(100, 1);
      const graph = elkGraph(fixture);
      const mainElk = new ELKMain();
      const mainPos = positionsOf(await mainElk.layout(graph));
      const alp = path.join(pkgRoot, "lib/elk.bundled.js");
      const code = `
      const { parentPort, workerData } = require('node:worker_threads');
      const ELK = require(${JSON.stringify(alp)});
      (async () => {
        const elk = new ELK();
        const t0 = process.hrtime.bigint();
        const out = await elk.layout(workerData.graph);
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        parentPort.postMessage({ ok: true, ms,
          positions: (out.children||[]).map(c => [c.id, Math.round(c.x*1000)/1000, Math.round(c.y*1000)/1000]) });
      })().catch(e => parentPort.postMessage({ ok: false, error: String(e?.stack||e) }));
    `;
      const times = [];
      let workerPos = null;
      for (let i = 0; i < 3; i++) {
        const result = await new Promise((resolve, reject) => {
          const w = new Worker(code, { eval: true, workerData: { graph } });
          w.once("message", (m) => resolve(m));
          w.once("error", reject);
          setTimeout(() => w.terminate(), 60_000);
        });
        if (!result.ok) throw new Error(result.error);
        times.push(result.ms);
        const asMap = Object.fromEntries(
          result.positions.map(([id, x, y]) => [id, [x, y]]),
        );
        if (i === 0) workerPos = asMap;
      }
      times.sort((a, b) => a - b);
      results.workerThread = {
        runs: times.length,
        medianMs: Math.round(times[1] * 10) / 10,
        identical_to_main_thread:
          JSON.stringify(workerPos) === JSON.stringify(mainPos),
      };
      expect(results.workerThread.identical_to_main_thread).toBe(true);
    },
  );
});

afterAll(() => {
  const out = path.resolve("../../docs/research/spikes/data/X7");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(
      { generated: new Date().toISOString(), ...results },
      null,
      2,
    ),
  );
});

const sha1 = (o) => {
  const s = JSON.stringify(o);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};
