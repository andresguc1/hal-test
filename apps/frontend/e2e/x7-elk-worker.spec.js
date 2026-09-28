/**
 * X7 — ELK in the browser under the actual harness (vite dev). Measures, not
 * assumes, WHERE the layout runs:
 *   (a) geometry must be byte-identical to a Node-side reference run, and
 *   (b) main-thread longtasks during the layout are measured and recorded —
 *       under vite dev ELK resolves to in-thread compute (longtasks ≈ full
 *       layout duration); off-threading via the app's own worker is proven
 *       separately in elkIntegration.test.js (worker_threads) and is gated on
 *       the production build (vite build) before it can be trusted.
 */

import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  datasetBranching,
  datasetLinear,
} from "../test/fixtures/layout/export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const round = (o) =>
  Object.fromEntries(
    (o.children || []).map((c) => [
      c.id,
      [Math.round(c.x * 1000) / 1000, Math.round(c.y * 1000) / 1000],
    ]),
  );

const results = { runs: [] };

for (const [label, fixture] of [
  ["branching-100", datasetBranching(100, 1)],
  ["linear-500", datasetLinear(500, 2)],
]) {
  test(`elkjs geometry in browser (${label}) is identical to Node reference`, async ({
    page,
  }) => {
    const graph = elkGraph(fixture);
    const reference = round(await new ELK().layout(graph));

    await page.goto("http://localhost:5173/e2e/empty.html");
    const {
      importWallMs,
      layoutWallMs,
      importLongtasks,
      layoutLongtasks,
      typeofWorker,
      positions,
    } = await page.evaluate(async (g) => {
      self.__lt = [];
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) self.__lt.push(e.duration);
      });
      obs.observe({ entryTypes: ["longtask"] });
      // Phase A — one-time bundle load + GWT module init on the main thread.
      const tImport = performance.now();
      const m = await import("/e2e/elk-inpage.js");
      const importWallMs = performance.now() - tImport;
      const importLongtasks = self.__lt.slice();
      self.__lt.length = 0;
      // Phase B — layout itself: must be fully off the main thread.
      const tLayout = performance.now();
      const out = await m.layout(g);
      const layoutWallMs = performance.now() - tLayout;
      await new Promise((r) => setTimeout(r, 400)); // capture any straggler longtask
      const layoutLongtasks = self.__lt.slice();
      obs.disconnect();
      return {
        importWallMs,
        layoutWallMs,
        importLongtasks: importLongtasks.map((d) => Math.round(d)),
        layoutLongtasks: layoutLongtasks.map((d, i) => ({
          i,
          dur: Math.round(d),
        })),
        typeofWorker: typeof globalThis.Worker,
        positions: (out.children || []).map((c) => [
          c.id,
          Math.round(c.x * 1000) / 1000,
          Math.round(c.y * 1000) / 1000,
        ]),
      };
    }, graph);

    const got = Object.fromEntries(positions.map(([id, x, y]) => [id, [x, y]]));
    expect(got).toEqual(reference); // byte-identical geometry vs Node reference
    console.log(
      `[X7] ${label}: importMs=${importWallMs.toFixed(1)} layoutMs=${layoutWallMs.toFixed(1)} importLongtasks=${importLongtasks.length} layoutLongtasks=${JSON.stringify(layoutLongtasks)} typeofWorker=${typeofWorker}`,
    );
    results.runs.push({
      dataset: label,
      importMs: Math.round(importWallMs * 10) / 10,
      layoutMs: Math.round(layoutWallMs * 10) / 10,
      importMainThreadLongtasks: importLongtasks.length,
      layoutMainThreadLongtasks: layoutLongtasks,
      typeofWorker,
      identicalToNodeReference: true,
    });
  });
}

test.afterAll(() => {
  const dir = path.resolve(process.cwd(), "../../docs/research/spikes/data/X7");
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "browser-worker.json");
  writeFileSync(out, JSON.stringify(results, null, 2), "utf8");
});
