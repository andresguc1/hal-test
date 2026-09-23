/**
 * X6 — Worker crossover spike (plan §16):
 *   Measures serialization cost vs in-thread compute to find crossover.
 *   Decision rule: use worker only above size where serTime + computeTime < inThreadTime (p50/p95).
 *   Worker-threads measurement deferred; this test provides the cost model.
 * Production code untouched (RULE 1).
 */

import { describe, it, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { getLayoutedElements } from "../../utils/layoutUtils";
import {
  datasetLinear,
  datasetBranching,
} from "../../../test/fixtures/layout/export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const results = { runs: [] };

function measureSerialization(obj, iterations = 3) {
  const times = [];
  const sizes = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    structuredClone(obj);
    const dt = performance.now() - t0;
    times.push(dt);
    sizes.push(new Blob([JSON.stringify(obj)]).size);
  }
  times.sort((a, b) => a - b);
  sizes.sort((a, b) => a - b);
  return {
    timeMedianMs: times[Math.floor(times.length / 2)],
    timeP95Ms: times[Math.floor(times.length * 0.95)],
    sizeMedianBytes: sizes[Math.floor(sizes.length / 2)],
  };
}

function measureInThread(nodes, edges, direction, iterations = 3) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    getLayoutedElements(nodes, edges, direction);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return {
    medianMs: times[Math.floor(times.length / 2)],
    p95Ms: times[Math.floor(times.length * 0.95)],
    all: times,
  };
}

const datasets = [
  ["linear", datasetLinear],
  ["branching", datasetBranching],
];

const sizes = [100, 250, 500, 1000];

describe("X6 — Worker crossover cost model", { timeout: 60_000 }, () => {
  for (const [name, builder] of datasets) {
    for (const size of sizes) {
      it(`${name} @ ${size} nodes`, () => {
        const fixture = builder(size, 42);
        const nodes = fixture.nodes;
        const edges = fixture.edges;

        const inThread = measureInThread(nodes, edges, "LR", 3);

        const serNodes = measureSerialization(nodes);
        const serEdges = measureSerialization(edges);
        const serTotalTimeMedian = serNodes.timeMedianMs + serEdges.timeMedianMs;
        const serTotalTimeP95 = serNodes.timeP95Ms + serEdges.timeP95Ms;
        const serTotalSizeKB = (serNodes.sizeMedianBytes + serEdges.sizeMedianBytes) / 1024;

        const workerModelMedian = serTotalTimeMedian * 2 + inThread.medianMs;
        const workerModelP95 = serTotalTimeP95 * 2 + inThread.p95Ms;

        const crossoverMedian = workerModelMedian < inThread.medianMs;
        const crossoverP95 = workerModelP95 < inThread.p95Ms;

        results.runs.push({
          dataset: name,
          size,
          inThreadMedianMs: Math.round(inThread.medianMs * 10) / 10,
          inThreadP95Ms: Math.round(inThread.p95Ms * 10) / 10,
          serTimeMedianMs: Math.round(serTotalTimeMedian * 10) / 10,
          serTimeP95Ms: Math.round(serTotalTimeP95 * 10) / 10,
          serSizeKB: Math.round(serTotalSizeKB * 10) / 10,
          workerModelMedianMs: Math.round(workerModelMedian * 10) / 10,
          workerModelP95Ms: Math.round(workerModelP95 * 10) / 10,
          crossoverMedian,
          crossoverP95,
        });

        console.log(
          `[X6] ${name}@${size}: inThread=${inThread.medianMs.toFixed(1)}ms ser=${serTotalTimeMedian.toFixed(1)}ms*2 workerModel=${workerModelMedian.toFixed(1)}ms size=${serTotalSizeKB.toFixed(1)}KB crossover=${crossoverMedian}`,
        );
      });
    }
  }
});

afterAll(() => {
  const out = path.resolve(__dirname, "../../docs/research/spikes/data/X6");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ generated: new Date().toISOString(), ...results }, null, 2),
  );
});