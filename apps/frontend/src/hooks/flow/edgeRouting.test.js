/**
 * X5 — Edge routing spike (plan §9):
 *   Evaluates routing candidates + cache effectiveness.
 *   Key question: how to avoid local reorganization re-rendering hundreds of edges differently?
 *   Approach: route keyed on topology (sourceId, targetId, port, laneIndex), not coordinates.
 * Production code untouched (RULE 1).
 */

import { describe, it, expect, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { getLayoutedElements } from "../../utils/layoutUtils";
import {
  datasetLinear,
  datasetBranching,
  datasetMergeHeavy,
  datasetDeepBranching,
} from "../../../test/fixtures/layout/export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const x5Results = { runs: [] };

// ============================================================
// Routing implementations (extracted from CustomEdge for testing)
// ============================================================

function buildOrthogonalBypassPath({
  sourceX, sourceY, targetX, targetY,
  parallelIndex = 0, borderRadius = 10,
}) {
  const laneOffset = 16 + (parallelIndex % 3) * 10;
  const r = borderRadius;
  const pivotX = sourceX + laneOffset;
  const clampedPivotX = Math.max(sourceX, Math.min(pivotX, (sourceX + targetX) / 2 - 10));
  const goingDown = targetY > sourceY;
  const yDir = goingDown ? 1 : -1;

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${clampedPivotX - r} ${sourceY}`,
    `Q ${clampedPivotX} ${sourceY} ${clampedPivotX} ${sourceY + yDir * r}`,
    `L ${clampedPivotX} ${targetY - yDir * r}`,
    `Q ${clampedPivotX} ${targetY} ${clampedPivotX + r} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ");
}

function smoothStepPath({
  sourceX, sourceY, targetX, targetY,
  sourcePosition = "right", targetPosition = "left",
  _borderRadius = 10,
}) {
  // Simplified from @xyflow/react getSmoothStepPath
  const cpOffset = 100;
  const sourceXOffset = sourcePosition === "right" ? cpOffset : -cpOffset;
  const targetXOffset = targetPosition === "left" ? -cpOffset : cpOffset;
  const cpx1 = sourceX + sourceXOffset;
  const cpx2 = targetX + targetXOffset;

  return `M ${sourceX} ${sourceY} C ${cpx1} ${sourceY} ${cpx2} ${targetY} ${targetX} ${targetY}`;
}

function routeEdge(edge, _nodes, isBypass, _parallelIndex) {
  const source = edge.sourceNode || { position: { x: edge.sourceX, y: edge.sourceY } };
  const target = edge.targetNode || { position: { x: edge.targetX, y: edge.targetY } };
  const sourceX = edge.sourceX ?? source.position.x;
  const sourceY = edge.sourceY ?? source.position.y;
  const targetX = edge.targetX ?? target.position.x;
  const targetY = edge.targetY ?? target.position.y;

  const distanceY = Math.abs(targetY - sourceY);
  const bypass = isBypass ?? (distanceY > 30);

  if (bypass) {
    return buildOrthogonalBypassPath({
      sourceX, sourceY, targetX, targetY,
      parallelIndex: edge.parallelIndex ?? 0,
    });
  }
  return smoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition: "right", targetPosition: "left",
  });
}

// ============================================================
// Cache implementation (topology-keyed)
// ============================================================

class RoutingCache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  // Key: topology only — sourceId, targetId, sourceHandle, targetHandle, laneIndex
  // NOT coordinates (which change on drag/layout)
  makeKey(edge) {
    return `${edge.source}|${edge.target}|${edge.sourceHandle || "default"}|${edge.targetHandle || "default"}|${edge.parallelIndex || 0}`;
  }

  get(edge, _nodes) {
    const key = this.makeKey(edge);
    const cached = this.cache.get(key);
    if (cached) {
      this.hits++;
      return cached;
    }
    this.misses++;
    const path = routeEdge(edge, null, true, edge.parallelIndex || 0);
    this.cache.set(key, path);
    return path;
  }

  invalidate(nodeIds) {
    // Invalidate paths where source or target is in nodeIds
    const toInvalidate = new Set(nodeIds);
    for (const [key] of this.cache) {
      const [src, tgt] = key.split("|");
      if (toInvalidate.has(src) || toInvalidate.has(tgt)) {
        this.cache.delete(key);
      }
    }
  }

  stats() {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, hitRate: total ? this.hits / total : 0, size: this.cache.size };
  }

  clear() { this.cache.clear(); this.hits = 0; this.misses = 0; }
}

// ============================================================
// Test harness
// ============================================================

function measureRoute(edges, nodes, iterations = 100) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    edges.forEach((e, i) => routeEdge(e, null, true, i % 3));
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return {
    medianMs: times[Math.floor(times.length / 2)],
    p95Ms: times[Math.floor(times.length * 0.95)],
  };
}

function measureCached(edges, nodes, iterations = 100) {
  const cache = new RoutingCache();
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    edges.forEach((e) => cache.get(e, null));
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return {
    medianMs: times[Math.floor(times.length / 2)],
    p95Ms: times[Math.floor(times.length * 0.95)],
    cache: cache.stats(),
  };
}

const datasets = [
  ["linear", datasetLinear],
  ["branching", datasetBranching],
  ["mergeHeavy", datasetMergeHeavy],
  ["deepBranching", datasetDeepBranching],
];

const sizes = [100, 250, 500, 1000];

describe("X5 — Edge routing cache + candidates", { timeout: 120_000 }, () => {
  for (const [name, builder] of datasets) {
    for (const size of sizes) {
      it(`${name} @ ${size}: uncached vs cached routing cost`, () => {
        const fixture = builder(size, 42);
        const [layoutedNodes, layoutedEdges] = getLayoutedElements(fixture.nodes, fixture.edges, "LR");

        // Build edge objects with positions
        const nodeById = new Map(layoutedNodes.map(n => [n.id, n]));
        const edgesWithPos = layoutedEdges.map(e => ({
          ...e,
          sourceX: nodeById.get(e.source)?.position.x,
          sourceY: nodeById.get(e.source)?.position.y,
          targetX: nodeById.get(e.target)?.position.x,
          targetY: nodeById.get(e.target)?.position.y,
          parallelIndex: String(e.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 3,
        }));

        const uncached = measureRoute(edgesWithPos, layoutedNodes, 50);
        const cached = measureCached(edgesWithPos, layoutedNodes, 50);

        const speedup = uncached.medianMs / cached.medianMs;

        x5Results.runs.push({
          dataset: name,
          size,
          edges: edgesWithPos.length,
          uncachedMedianMs: Math.round(uncached.medianMs * 10) / 10,
          uncachedP95Ms: Math.round(uncached.p95Ms * 10) / 10,
          cachedMedianMs: Math.round(cached.medianMs * 10) / 10,
          cachedP95Ms: Math.round(cached.p95Ms * 10) / 10,
          speedup: Math.round(speedup * 100) / 100,
          cacheHitRate: Math.round(cached.cache.hitRate * 10000) / 100,
          cacheSize: cached.cache.size,
        });

        console.log(
          `[X5] ${name}@${size}: edges=${edgesWithPos.length} uncached=${uncached.medianMs.toFixed(2)}ms cached=${cached.medianMs.toFixed(2)}ms speedup=${speedup.toFixed(2)}x hitRate=${cached.cache.hitRate.toFixed(2)}`
        );
      });
    }
  }

  it("cache invalidation on node move", () => {
    const fixture = datasetBranching(100, 42);
    const [nodes, edges] = getLayoutedElements(fixture.nodes, fixture.edges, "LR");
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const edgesWithPos = edges.map(e => ({
      ...e,
      sourceX: nodeById.get(e.source)?.position.x,
      sourceY: nodeById.get(e.source)?.position.y,
      targetX: nodeById.get(e.target)?.position.x,
      targetY: nodeById.get(e.target)?.position.y,
      parallelIndex: 0,
    }));

    const cache = new RoutingCache();
    edgesWithPos.forEach(e => cache.get(e, null));
    const before = cache.stats();

    // Move 10 nodes
    const movedIds = edgesWithPos.slice(0, 10).map(e => e.source);
    cache.invalidate(movedIds);
    edgesWithPos.forEach(e => cache.get(e, null));
    const after = cache.stats();

    // Some misses expected (invalidate worked)
    expect(after.misses).toBeGreaterThan(before.misses);
    x5Results.runs.push({
      dataset: "invalidation",
      size: 100,
      beforeHits: before.hits,
      afterHits: after.hits,
      beforeMisses: before.misses,
      afterMisses: after.misses,
      cacheSize: after.size,
    });
  });
});

afterAll(() => {
  const out = path.resolve(__dirname, "../../../../../docs/research/spikes/data/X5");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ generated: new Date().toISOString(), ...x5Results }, null, 2),
  );
});