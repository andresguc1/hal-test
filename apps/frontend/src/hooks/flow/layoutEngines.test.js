/**
 * X3 — LAYOUT ENGINE COMPARISON: dagre (production config) vs ELK layered vs
 * a hand-rolled layered prototype, over the pinned dataset corpus (X2).
 *
 * Question (plan §8): does replacing dagre with ELK (or a small layered pass)
 * actually improve readability/cost, and is it worth the migration?
 *
 * Metrics computed on the raw engine output (centers + sizes):
 *   crossings, total/max/mean edge length, bbox width/height/area/aspect,
 *   determinism (identical output across two runs), wall time (median of 5).
 * Honesty: the dagre arm reproduces the production pre-pass (lane-weighted
 * edges, cycle removal, stable id-sorted input, align UL / tight-tree,
 * nodesep 60 / ranksep 90) but WITHOUT the branch-spacing post-pass, so all
 * engines are compared on their raw geometric output. Production output is
 * that + spacing diffusion.
 *
 * Artifacts: docs/research/spikes/data/X3/results.json.
 */

import { describe, it, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import dagre from "dagre";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  datasetLinear,
  datasetBranching,
  datasetMergeHeavy,
  datasetDeepBranching,
  datasetDiamond,
  datasetComposite,
  datasetRealistic,
  datasetPathological,
} from "../../../test/fixtures/layout/export.js";

const NODE_W = 220;
const NODE_H = 72;
const gap = { nodesep: 60, ranksep: 90 };

const sourceDataSet = (id) => {
  const [k, size] = id.split("@");
  const builders = {
    A: datasetLinear,
    B: datasetBranching,
    C: datasetMergeHeavy,
    D: datasetDeepBranching,
    E: datasetDiamond,
    F: datasetComposite,
    G: datasetRealistic,
    H: datasetPathological,
  };
  return builders[k](Number(size), 1);
};

const FIXTURES = [
  "A@250",
  "A@500",
  "B@100",
  "B@250",
  "C@50",
  "D@100",
  "E@10",
  "F@6",
  "G@52",
  "H@50",
];

/* --------------------------- dagre (prod pre-pass) --------------------------- */

const dagreLayout = (fixture) => {
  const sortedNodes = [...fixture.nodes].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const nodeById = new Map(fixture.nodes.map((n) => [n.id, n]));
  const lane = (e) => {
    const src = nodeById.get(e.source)?.data?.type;
    if (e.sourceHandle === "true" || src === "conditional") return 0;
    if (e.sourceHandle === "false") return 1;
    if (src === "loop" || src === "for_each") return 2;
    return -1;
  };
  const sortedEdges = [...fixture.edges].sort((a, b) => {
    const d = lane(a) - lane(b);
    if (d) return d;
    const s = a.source.localeCompare(b.source);
    return s || a.target.localeCompare(b.target);
  });
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    align: "UL",
    ranker: "tight-tree",
    nodesep: gap.nodesep,
    ranksep: gap.ranksep,
    marginx: 50,
    marginy: 50,
  });
  sortedNodes.forEach((n) => {
    g.setNode(n.id, { width: n.width || NODE_W, height: n.height || NODE_H });
  });
  sortedEdges.forEach((e) => {
    const edge = { weight: lane(e) < 0 ? 1 : 100 - lane(e) * 10 };
    g.setEdge(e.source, e.target, edge);
    if (!dagre.graphlib.alg.isAcyclic(g)) g.removeEdge(e.source, e.target);
  });
  dagre.layout(g);
  return Object.fromEntries(
    sortedNodes.map((n) => {
      const p = g.node(n.id);
      return [n.id, { x: p.x, y: p.y, w: p.width, h: p.height }];
    }),
  );
};

/* ------------------------------- ELK layered ------------------------------- */

let elk;
const elkLayout = async (fixture) => {
  const children = fixture.nodes.map((n) => ({
    id: n.id,
    width: n.width || NODE_W,
    height: n.height || NODE_H,
  }));
  const edges = fixture.edges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));
  const out = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(gap.ranksep),
      "elk.spacing.nodeNode": String(gap.nodesep),
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.separateConnectedComponents": "false",
    },
    children,
    edges,
  });
  return Object.fromEntries(
    (out.children || []).map((c) => [
      c.id,
      { x: c.x + c.width / 2, y: c.y + c.height / 2, w: c.width, h: c.height },
    ]),
  );
};

/* -------------------- hand-rolled layered prototype -------------------- */

const customLayout = (fixture) => {
  const forward = new Map(fixture.nodes.map((n) => [n.id, []]));
  const back = new Map(fixture.nodes.map((n) => [n.id, []]));
  fixture.edges.forEach((e) => {
    forward.get(e.source).push(e.target);
    back.get(e.target).push(e.source);
  });
  const rank = new Map(fixture.nodes.map((n) => [n.id, 0]));
  // longest-path ranking with fixed-point relaxation (tolerates cycles)
  for (let pass = 0; pass < fixture.nodes.length; pass++) {
    let changed = false;
    for (const n of fixture.nodes) {
      for (const p of back.get(n.id)) {
        if (rank.get(p.id) + 1 > rank.get(n.id)) {
          rank.set(n.id, rank.get(p.id) + 1);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  const maxRank = Math.max(...rank.values());
  const layers = Array.from({ length: maxRank + 1 }, () => []);
  fixture.nodes.forEach((n) => layers[rank.get(n.id)].push(n.id));
  // barycenter crossing reduction (3 sweeps)
  for (let s = 0; s < 3; s++) {
    for (let r = 1; r < layers.length; r++) {
      layers[r].sort((a, b) => {
        const bary = (id) => {
          const ps = back.get(id);
          if (!ps.length) return pos(ps[0] ?? id);
          return ps.reduce((sum, p) => sum + pos(p), 0) / ps.length;
        };
        return bary(a) - bary(b);
      });
    }
    const pos = (id) => layers[rank.get(id)].indexOf(id);
    void pos;
    for (let r = layers.length - 2; r >= 0; r--) {
      layers[r].sort((a, b) => {
        const mid = (id) => {
          const cs = forward.get(id).filter((c) => rank.get(c) === r + 1);
          if (!cs.length) return 0;
          return (
            cs.reduce((sum, c) => sum + layers[r + 1].indexOf(c), 0) / cs.length
          );
        };
        return mid(a) - mid(b);
      });
    }
  }
  const out = {};
  const spanW = NODE_W + gap.nodesep;
  const spanH = NODE_H + gap.nodesep;
  layers.forEach((layer, r) => {
    layer.forEach((id, i) => {
      out[id] = {
        x: r * spanW + NODE_W / 2,
        y: i * spanH + NODE_H / 2,
        w: NODE_W,
        h: NODE_H,
      };
    });
  });
  return out;
};

/* -------------------------------- metrics -------------------------------- */

function edgeCrossings(fixture, nodes) {
  const byId = new Map(
    Object.entries(nodes).map(([id, p]) => [id, [p.x, p.y]]),
  );
  const E = fixture.edges.map((e) => [byId.get(e.source), byId.get(e.target)]);
  let count = 0;
  const cross = (a1, a2, b1, b2) => {
    const d = (p, q, r) =>
      (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const s1 = Math.sign(d(a1, a2, b1)) * Math.sign(d(a1, a2, b2));
    const s2 = Math.sign(d(b1, b2, a1)) * Math.sign(d(b1, b2, a2));
    return s1 < 0 && s2 < 0;
  };
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 1; j < E.length; j++) {
      if (cross(E[i][0], E[i][1], E[j][0], E[j][1])) count++;
    }
  }
  return count;
}

const edgeLengths = (fixture, nodes) => {
  const byId = byMap(nodes);
  return fixture.edges.map((e) => {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    return Math.hypot(a.x - b.x, a.y - b.y);
  });
};

// Number of (edge, node) pairs where the straight source→target segment passes
// through the bounding box of a third node. Long LR edges that cross over
// intermediate ranks are the main readability killer in pipelines.
function edgeNodePassthrough(fixture, nodes) {
  const byId = byMap(nodes);
  const rects = new Map(
    Object.entries(nodes).map(([id, p]) => [
      id,
      {
        x0: p.x - p.w / 2,
        x1: p.x + p.w / 2,
        y0: p.y - p.h / 2,
        y1: p.y + p.h / 2,
      },
    ]),
  );
  let count = 0;
  for (const e of fixture.edges) {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    for (const node of fixture.nodes) {
      if (node.id === e.source || node.id === e.target) continue;
      const r = rects.get(node.id);
      if (len2 === 0) continue;
      // closest point on infinite line to rect center, reject if inside rect
      const t =
        ((r.x0 + (r.x1 - r.x0) / 2 - a.x) * dx +
          (r.y0 + (r.y1 - r.y0) / 2 - a.y) * dy) /
        len2;
      const tClamped = Math.max(0, Math.min(1, t));
      const cx = a.x + tClamped * dx;
      const cy = a.y + tClamped * dy;
      if (cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1) count++;
    }
  }
  return count;
}

function byMap(nodes) {
  return new Map(Object.entries(nodes).map(([id, p]) => [id, p]));
}

const metrics = (fixture, nodes) => {
  const xs = Object.values(nodes).map((p) => p.x);
  const ys = Object.values(nodes).map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX + NODE_W;
  const height = maxY - minY + NODE_H;
  const lens = edgeLengths(fixture, nodes);
  const total = lens.reduce((a, b) => a + b, 0);
  return {
    crossings: edgeCrossings(fixture, nodes),
    passthrough: edgeNodePassthrough(fixture, nodes),
    edgeLenTotal: Math.round(total),
    edgeLenMax: Math.round(Math.max(...lens)),
    edgeLenMean: Math.round(total / Math.max(1, lens.length)),
    bboxWidth: Math.round(width),
    bboxHeight: Math.round(height),
    area: Math.round(width * height),
    aspect: Math.round((width / Math.max(1, height)) * 100) / 100,
  };
};

const runMedian = async (fn, fixture, N = 5) => {
  const times = [];
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    await fn(fixture);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return Math.round(times[Math.floor(N / 2)]);
};

const results = { engineSoftware: {}, fixtures: {} };

describe("X3 — layout engine comparison (dagre / elk / layered-custom)", () => {
  beforeAll(async () => {
    elk = new ELK();
    results.engineSoftware = {
      dagre: "0.8.5 (prod pre-pass config)",
      elk: "elkjs bundled (layered, ORTHOGONAL)",
      custom: "hand-rolled layered (longest-path + barycenter)",
    };
  });

  for (const fid of FIXTURES) {
    it(
      `metrics + determinism + perf: ${fid}`,
      { timeout: 180_000 },
      async () => {
        const fixture = sourceDataSet(fid);
        const entry = { dagre: {}, elk: {}, custom: {} };
        for (const [engine, fn] of [
          ["dagre", dagreLayout],
          ["elk", elkLayout],
          ["custom", customLayout],
        ]) {
          const one = await fn(fixture);
          const two = await fn(fixture);
          const equal = JSON.stringify(one) === JSON.stringify(two);
          entry[engine] = {
            ...metrics(fixture, one),
            deterministic: equal,
            ms:
              engine === "elk"
                ? await runMedian(fn, fixture, 3)
                : await runMedian(fn, fixture, 5),
          };
          entry[engine].positionHash = hashOf(one);
          if (engine === "dagre")
            entry[engine].deterministic = equal && hashOf(one) === hashOf(two);
        }
        results.fixtures[fid] = { fixtureHash: fixture.hash, engines: entry };
      },
    );
  }

  afterAll(() => {
    const out = path.resolve("../../docs/research/spikes/data/X3");
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
});

const hashOf = (obj) => {
  const s = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};
