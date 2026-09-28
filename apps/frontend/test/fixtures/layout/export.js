import { createHash } from "node:crypto";

/**
 * Deterministic graph fixture generator for the Canvas Layout research.
 *
 * RULE 8 (reproducibility): the same seed must generate byte-identical input.
 * All randomness flows through `mulberry32(seed)`; every fixture carries a
 * SHA-256 hash of its exact serialized content so tests can assert stability
 * across runs and across position/array permutations.
 *
 * Datasets (X2): A linear, B branching, C merge-heavy, D deep-branching,
 * E diamond, F composite, G realistic workflow, H pathological.
 *
 * Graph shapes (X8): multiple-roots, cyclic, diamond, parallel-branches,
 * nested-branch, composite, nested-composite, loop, for_each, mixed.
 */

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashOf = (obj) =>
  createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);

const nodeTypes = [
  "launch_browser",
  "navigate",
  "click",
  "fill_input",
  "extract_text",
  "wait",
  "switch",
  "conditional",
  "loop",
  "for_each",
  "component",
  "http_request",
  "assert",
  "screenshot",
];

const pickType = (rand, allowBranch) => {
  const pool = allowBranch
    ? nodeTypes
    : nodeTypes.filter(
        (t) =>
          !["switch", "conditional", "loop", "for_each", "component"].includes(
            t,
          ),
      );
  return pool[Math.floor(rand() * pool.length)];
};

const makeNode = (id, type, x, y, label) => ({
  id,
  type,
  position: { x, y },
  width: 220,
  height: 72,
  data: { type, label: label || `${type} ${id}` },
});

/**
 * Standard X8 graph shape: two node groups. `nodes`/`edges` are the rendered
 * objects; shape helper functions below produce them with a fixed seed unless
 * overridden, so permutations are always done *in the test* on the same fixture.
 */
const sha256 = (obj) => hashOf(obj);

const analyze = (fixture) => {
  const { nodes, edges } = fixture;
  const adj = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
  });
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => {
    if (indeg.has(e.target)) indeg.set(e.target, indeg.get(e.target) + 1);
  });
  const roots = nodes.filter((n) => indeg.get(n.id) === 0);

  const maxDegree = Math.max(...nodes.map((n) => adj.get(n.id).length));
  const compositeCount = nodes.filter(
    (n) => n.type === "component" || n.data?.type === "component",
  ).length;
  const branchCount = nodes.filter((n) =>
    ["switch", "conditional"].includes(n.data?.type || n.type),
  ).length;

  const depth = (() => {
    const seen = {};
    const walk = (id, d) => {
      seen[id] = d;
      adj.get(id).forEach((t) => {
        if (seen[t] === undefined) walk(t, d + 1);
      });
    };
    if (roots.length) roots.forEach((r) => walk(r.id, 1));
    else nodes.forEach((n) => walk(n.id, 1));
    return Object.keys(seen).length ? Math.max(...Object.values(seen)) : 0;
  })();

  let cycleCount = 0;
  const color = new Map(nodes.map((n) => [n.id, 0]));
  const dfs = (id) => {
    color.set(id, 1);
    for (const t of adj.get(id)) {
      const c = color.get(t);
      if (c === 1) cycleCount += 1;
      if (c === 0) dfs(t);
    }
    color.set(id, 2);
  };
  nodes.forEach((n) => {
    if (color.get(n.id) === 0) dfs(n.id);
  });

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    maxDegree,
    roots: roots.map((r) => r.id),
    cycleCount,
    depth,
    compositeCount,
    branchCount,
  };
};

/** Wrap raw nodes/edges into a fixture with hash + metadata. */
const fixture = (nodes, edges, dataset, label, extra = {}) => {
  const meta = analyze({ nodes, edges });
  const obj = { id: `${dataset}-${label}`, nodes, edges };
  return {
    id: obj.id,
    dataset,
    label,
    hash: sha256({ nodes, edges }),
    meta,
    nodes,
    edges,
    ...extra,
  };
};

/**
 * DATASET A — linear chain (size nodes).
 */
export const datasetLinear = (size = 50, seed = 42) => {
  const rand = mulberry32(seed);
  const nodes = [];
  const edges = [];
  for (let i = 0; i < size; i++) {
    nodes.push(
      makeNode(
        `n${i}`,
        pickType(rand, false),
        Math.floor(rand() * 400),
        i * 90,
      ),
    );
    if (i > 0)
      edges.push({ id: `e${i - 1}`, source: `n${i - 1}`, target: `n${i}` });
  }
  return fixture(nodes, edges, "A", "linear", { seed });
};

/**
 * DATASET B — balanced branching (full binary tree of `size` nodes, then merge).
 * Every internal node fans out to two children; leaves merge into one sink.
 */
export const datasetBranching = (size = 50, seed = 7) => {
  const rand = mulberry32(seed);
  const nodes = [];
  const edges = [];
  for (let i = 0; i < size; i++) {
    nodes.push(
      makeNode(
        `n${i}`,
        pickType(rand, false),
        (i % 8) * 80,
        Math.floor(i / 8) * 160,
      ),
    );
  }
  for (let i = 0; i < size; i += 2) {
    const left = i + 1;
    const right = i + 2;
    if (left < size)
      edges.push({
        id: `e${i}-${left}`,
        source: `n${i}`,
        target: `n${left}`,
        sourceHandle: `l${i}`,
      });
    if (right < size)
      edges.push({
        id: `e${i}-${right}`,
        source: `n${i}`,
        target: `n${right}`,
        sourceHandle: `r${i}`,
      });
  }
  return fixture(nodes, edges, "B", "branching", { seed });
};

/**
 * DATASET C — merge-heavy: N parallel chains that all merge into a single lag
 * node, then fan out again against the lag.
 */
export const datasetMergeHeavy = (size = 50, seed = 13) => {
  const rand = mulberry32(seed);
  const nodes = [];
  const edges = [];
  const chains = 4;
  const perChain = Math.max(1, Math.floor(size / chains));
  for (let c = 0; c < chains; c++) {
    for (let i = 0; i < perChain; i++) {
      const id = `c${c}_${i}`;
      nodes.push(
        makeNode(
          id,
          pickType(rand, false),
          Math.floor(rand() * 200),
          (c * perChain + i) * 90,
        ),
      );
      if (i > 0)
        edges.push({ id: `e_${id}`, source: `c${c}_${i - 1}`, target: id });
    }
  }
  nodes.push(makeNode("lag", "wait", 220, ((chains * perChain) / 2) * 90));
  for (let c = 0; c < chains; c++) {
    const last = `c${c}_${perChain - 1}`;
    if (nodes.some((n) => n.id === last)) {
      edges.push({ id: `e_${c}_lag`, source: last, target: "lag" });
    }
  }
  const sink = makeNode("sink", "assert", 220, 500);
  nodes.push(sink);
  edges.push({ id: "e_lag_sink", source: "lag", target: "sink" });
  return fixture(nodes, edges, "C", "merge-heavy", { seed });
};

/**
 * DATASET D — deep branching: a single long spine where every depth level
 * spawns an extra leaf (depth grows linearly, degree stays small).
 */
export const datasetDeepBranching = (size = 50, seed = 23) => {
  const rand = mulberry32(seed);
  const nodes = [];
  const edges = [];
  for (let i = 0; i < size; i++) {
    nodes.push(
      makeNode(
        `n${i}`,
        pickType(rand, false),
        Math.floor(rand() * 300),
        i * 80,
      ),
    );
    if (i > 0)
      edges.push({ id: `e_spine_${i}`, source: `n${i - 1}`, target: `n${i}` });
  }
  for (let i = 0; i < size; i++) {
    const leafId = `leaf_${i}`;
    nodes.push(
      makeNode(leafId, "screenshot", Math.floor(rand() * 300) + 320, i * 80),
    );
    edges.push({
      id: `e_leaf_${i}`,
      source: `n${i}`,
      target: leafId,
      sourceHandle: `f${i}`,
    });
  }
  return fixture(nodes, edges, "D", "deep-branching", { seed });
};

/**
 * DATASET E — diamond chain: `count` diamonds joined end-to-end (branch +
 * merge pairs). Each diamond adds 3 nodes and 4 edges.
 */
export const datasetDiamond = (count = 10, seed = 109) => {
  const rand = mulberry32(seed);
  const nodes = [makeNode("start", "launch_browser", 0, 0)];
  const edges = [];
  for (let d = 0; d < count; d++) {
    const mid = `m${d}`;
    const lo = `lo${d}`;
    const hi = `hi${d}`;
    nodes.push(makeNode(mid, pickType(rand, false), (d + 1) * 180, 0));
    nodes.push(makeNode(lo, pickType(rand, false), (d + 1) * 180, 120));
    nodes.push(makeNode(hi, pickType(rand, false), (d + 1) * 180, -120));
    if (d === 0)
      edges.push({ id: "e_start_mid", source: "start", target: mid });
    else edges.push({ id: `e_chain_${d}`, source: `m${d - 1}`, target: mid });
    edges.push({
      id: `e_${mid}_lo`,
      source: mid,
      target: lo,
      sourceHandle: `s_${d}_lo`,
    });
    edges.push({
      id: `e_${mid}_hi`,
      source: mid,
      target: hi,
      sourceHandle: `s_${d}_hi`,
    });
  }
  const sink = makeNode("end", "assert", count * 180, 0);
  nodes.push(sink);
  edges.push({ id: `e_last_lo`, source: `lo${count - 1}`, target: "end" });
  edges.push({ id: `e_last_hi`, source: `hi${count - 1}`, target: "end" });
  return fixture(nodes, edges, "E", "diamond", { seed });
};

/**
 * DATASET F — composite: a root flow whose bodies reference subflows, plus
 * the subflow graphs themselves (each subflow is internally branching).
 */
export const datasetComposite = (count = 6, seed = 58) => {
  const rand = mulberry32(seed);
  const rootNodes = [makeNode("r_start", "launch_browser", 0, 0)];
  const rootEdges = [];
  const subflows = [];
  let prev = "r_start";
  for (let s = 0; s < count; s++) {
    const cid = `comp_${s}`;
    const subId = `sub_${s}`;
    // attach container flow id via extra field (persisted separately in app)
    rootNodes.push(
      makeNode(cid, "component", (s + 1) * 200, 0, `Subflow ${s}`),
    );
    rootNodes[rootNodes.length - 1].data.flowId = subId;
    rootEdges.push({ id: `e_root_${s}`, source: prev, target: cid });
    prev = cid;
    const sn = [];
    const se = [];
    sn.push(makeNode(`${subId}_in`, "navigate", 0, 0));
    for (let i = 1; i <= 3; i++) {
      const nid = `${subId}_${i}`;
      sn.push(
        makeNode(nid, pickType(rand, i % 2 === 0), i * 160, (i % 2) * 140),
      );
      if (i === 1)
        se.push({ id: `e_${subId}_head`, source: `${subId}_in`, target: nid });
      else
        se.push({
          id: `e_${subId}_${i}`,
          source: `${subId}_${i - 1}`,
          target: nid,
          sourceHandle: `b${i}`,
        });
    }
    subflows.push(
      fixture(sn, se, "F", `subflow-${s}`, { seed, subflowId: subId }),
    );
  }
  return fixture(rootNodes, rootEdges, "F", "composite", {
    seed,
    subflows,
    subflowIds: subflows.map((f) => f.meta?.subflowId || f.label),
  });
};

/**
 * DATASET G — realistic HalTest-ish workflow: launch_browser → navigate →
 * conditional branch (tabs/cards) → loops + for_each → assertions → screenshot.
 */
export const datasetRealistic = (size = 50, seed = 777) => {
  const nodes = [];
  const edges = [];
  const root = makeNode("browser", "launch_browser", 0, 0);
  nodes.push(root);
  const nav = makeNode("nav1", "navigate", 0, 90);
  nodes.push(nav);
  edges.push({ id: "e_browser_nav", source: "browser", target: "nav1" });

  const mainBranch = makeNode("branch_main", "conditional", 0, 200);
  nodes.push(mainBranch);
  edges.push({ id: "e_nav_branch", source: "nav1", target: "branch_main" });

  const yesTargets = [];
  const noTargets = [];
  const remaining = size - 3;
  for (let i = 0; i < remaining; i += 2) {
    const yes = makeNode(
      `tabs_${i}`,
      i % 3 === 0 ? "for_each" : "click",
      220,
      200 + (i / 2) * 90,
    );
    const no = makeNode(
      `cards_${i + 1}`,
      i % 4 === 0 ? "loop" : "extract_text",
      220,
      240 + (i / 2) * 90,
    );
    nodes.push(yes);
    nodes.push(no);
    yesTargets.push(yes);
    noTargets.push(no);
  }
  yesTargets.forEach((t, i) =>
    edges.push({
      id: `e_yes_${i}`,
      source: "branch_main",
      target: t.id,
      sourceHandle: "true",
    }),
  );
  noTargets.forEach((t, i) =>
    edges.push({
      id: `e_noh_${i}`,
      source: "branch_main",
      target: t.id,
      sourceHandle: "false",
    }),
  );

  const sink = makeNode("assert_final", "assert", 0, 700);
  nodes.push(sink);
  [...yesTargets, ...noTargets].forEach((t, i) => {
    edges.push({
      id: `e_merge_${i}`,
      source: t.id,
      target: "assert_final",
      sourceHandle: "flow",
    });
  });
  return fixture(nodes, edges, "G", "realistic", { seed });
};

/**
 * DATASET H — pathological: large disconnected islands + a hard cycle + many
 * entry points (no single root), designed to trip E2/E3 fallbacks.
 */
export const datasetPathological = (size = 50, seed = 7283) => {
  const rand = mulberry32(seed);
  const nodes = [];
  const edges = [];
  const half = Math.floor(size / 2);
  for (let i = 0; i < half; i++) {
    nodes.push(
      makeNode(
        `i${i}`,
        pickType(rand, false),
        Math.floor(rand() * 400),
        i * 80,
      ),
    );
    if (i > 0) {
      const src = `i${i - 1}`;
      const target = `i${i}`;
      edges.push({ id: `e_i${i}`, source: src, target });
    }
  }
  for (let i = 0; i < size - half; i++) {
    nodes.push(
      makeNode(
        `j${i}`,
        pickType(rand, i % 2 === 0),
        500 + Math.floor(rand() * 200),
        i * 60,
      ),
    );
  }
  // isolate cycle between the first two island nodes (no roots on that island)
  edges.push({ id: "e_cycle_i0i1", source: "i0", target: "i1" });
  edges.push({ id: "e_cycle_i1i0", source: "i1", target: "i0" });
  return fixture(nodes, edges, "H", "pathological", { seed });
};

const step = (nodes, edges, seed, label) =>
  fixture(nodes, edges, "X8", label, { seed });

/* ---------------------------------------------------------------------------
 * X8 shapes — each returns ONE fixture with a fixed seed. The permutation and
 * rearrangement screens happen in the test, never here (fixtures are frozen).
 * ------------------------------------------------------------------------- */

/**
 * 1 — multiple roots: two independent entry nodes that both fan into a shared
 * tail. E1 decides which root runs first via position.y (top→bottom).
 */
export const x8MultipleRoots = (seed = 11) => {
  const nodes = [
    makeNode("top", "launch_browser", 0, 0),
    makeNode("bottom", "launch_browser", 0, 200),
    makeNode("tail", "click", 500, 100),
  ];
  const edges = [
    { id: "e1", source: "top", target: "tail" },
    { id: "e2", source: "bottom", target: "tail" },
  ];
  return step(nodes, edges, seed, "multiple-roots");
};

/**
 * 2 — cyclic graph: A→B→C→A. No roots ⇒ E2 fallback to graphNodes[0].
 */
export const x8Cyclic = (seed = 22) => {
  const nodes = [
    makeNode("a", "wait", 0, 0),
    makeNode("b", "click", 200, 0),
    makeNode("c", "extract_text", 400, 0),
  ];
  const edges = [
    { id: "e_ab", source: "a", target: "b" },
    { id: "e_bc", source: "b", target: "c" },
    { id: "e_ca", source: "c", target: "a" },
  ];
  return step(nodes, edges, seed, "cyclic");
};

/**
 * 3 — diamond: root → left/right → sink.
 */
export const x8Diamond = (seed = 33) => {
  const nodes = [
    makeNode("root", "launch_browser", 0, 0),
    makeNode("left", "click", 200, -100),
    makeNode("right", "click", 200, 100),
    makeNode("sink", "assert", 400, 0),
  ];
  const edges = [
    { id: "e_root_left", source: "root", target: "left", sourceHandle: "tl" },
    { id: "e_root_right", source: "root", target: "right", sourceHandle: "tr" },
    { id: "e_left_sink", source: "left", target: "sink" },
    { id: "e_right_sink", source: "right", target: "sink" },
  ];
  return step(nodes, edges, seed, "diamond");
};

/**
 * 4 — parallel branches: root fans to 3 independent mid nodes that merge late.
 */
export const x8Parallel = (seed = 44) => {
  const nodes = [
    makeNode("root", "launch_browser", 0, 0),
    makeNode("p1", "http_request", 200, -200),
    makeNode("p2", "http_request", 200, 0),
    makeNode("p3", "http_request", 200, 200),
    makeNode("aggr", "assert", 500, 0),
  ];
  const edges = [
    { id: "e_r1", source: "root", target: "p1", sourceHandle: "t1" },
    { id: "e_r2", source: "root", target: "p2", sourceHandle: "t2" },
    { id: "e_r3", source: "root", target: "p3", sourceHandle: "t3" },
    { id: "e_1a", source: "p1", target: "aggr" },
    { id: "e_2a", source: "p2", target: "aggr" },
    { id: "e_3a", source: "p3", target: "aggr" },
  ];
  return step(nodes, edges, seed, "parallel");
};

/**
 * 5 — nested branch: root → conditional(true/false) → each branch has a sub
 * diamond; sink. Exercises matchesBranchPath(sourceHandle) winner selection.
 */
export const x8NestedBranch = (seed = 55) => {
  const nodes = [
    makeNode("root", "launch_browser", 0, 0),
    makeNode("cond", "conditional", 160, 0),
    makeNode("t1", "click", 400, -160),
    makeNode("t2", "click", 400, -80),
    makeNode("f1", "click", 400, 80),
    makeNode("f2", "click", 400, 160),
    makeNode("sink", "assert", 620, 0),
  ];
  const edges = [
    { id: "e_root_cond", source: "root", target: "cond" },
    { id: "e_cond_t1", source: "cond", target: "t1", sourceHandle: "true" },
    { id: "e_t1_t2", source: "t1", target: "t2" },
    { id: "e_cond_f1", source: "cond", target: "f1", sourceHandle: "false" },
    { id: "e_f1_f2", source: "f1", target: "f2" },
    { id: "e_t2_sink", source: "t2", target: "sink" },
    { id: "e_f2_sink", source: "f2", target: "sink" },
  ];
  return step(nodes, edges, seed, "nested-branch");
};

/**
 * 6 — composite: A → B(component) → C with B's subflow {b1 → b2 → b3}.
 */
export const x8Composite = (seed = 66) => {
  const nodes = [
    makeNode("a", "navigate", 0, 0),
    makeNode("b", "component", 200, 0),
    makeNode("c", "screenshot", 400, 0),
  ];
  const edges = [
    { id: "e_ab", source: "a", target: "b" },
    { id: "e_bc", source: "b", target: "c" },
  ];
  nodes[1].data.flowId = "x8composite_sub";
  fixture(
    [
      makeNode("b1", "click", 0, 0),
      makeNode("b2", "extract_text", 200, 0),
      makeNode("b3", "wait", 400, 0),
    ],
    [
      { id: "e_b1", source: "b1", target: "b2" },
      { id: "e_b2", source: "b2", target: "b3" },
    ],
    "X8",
    "composite-subflow",
    { seed, subflowId: "x8composite_sub" },
  );
  return step(nodes, edges, seed, "composite");
};

/**
 * 7 — nested composite: A → B(component containing its own inner component D).
 */
export const x8NestedComposite = (seed = 77) => {
  const nodes = [
    makeNode("a", "navigate", 0, 0),
    makeNode("b", "component", 200, 0),
  ];
  nodes[1].data.flowId = "x8nested_sub";
  const edges = [{ id: "e_ab", source: "a", target: "b" }];
  const inner = fixture(
    [makeNode("d", "component", 0, 0), makeNode("leaf", "click", 200, 0)],
    [{ id: "e_d_leaf", source: "d", target: "leaf" }],
    "X8",
    "nested-inner",
    { seed, subflowId: "x8nested_innermost" },
  );
  inner.nodes[0].data.flowId = "x8nested_innermost";
  fixture(
    [
      makeNode("b1", "navigate", 0, 0),
      inner.nodes[0],
      makeNode("b3", "wait", 400, 0),
    ],
    [
      { id: "e_b1_d", source: "b1", target: "d" },
      { id: "e_d_b3", source: "d", target: "b3" },
    ],
    "X8",
    "nested-composite-subflow",
    { seed, subflowId: "x8nested_sub" },
  );
  return step(nodes, edges, seed, "nested-composite");
};

/**
 * 8 — loop: root(loop w/ subflow) → wire `iteration` path back so the loop can
 * re-enter; X8 only models ordering, the loop chosen only needs a shape.
 */
export const x8Loop = (seed = 88) => {
  const nodes = [
    makeNode("root", "loop", 0, 0),
    makeNode("body", "click", 200, 0),
    makeNode("end", "screenshot", 400, 100),
  ];
  const edges = [
    { id: "e_root_body", source: "root", target: "body", sourceHandle: "body" },
    {
      id: "e_body_end",
      source: "body",
      target: "end",
      sourceHandle: "complete",
    },
  ];
  return step(nodes, edges, seed, "loop");
};

/**
 * 9 — for_each: root(for_each w/ subflow) → per-item branch.
 */
export const x8ForEach = (seed = 99) => {
  const nodes = [
    makeNode("root", "for_each", 0, 0),
    makeNode("item", "extract_text", 220, 0),
    makeNode("next", "wait", 440, 0),
  ];
  const edges = [
    { id: "e_root_item", source: "root", target: "item", sourceHandle: "item" },
    { id: "e_item_next", source: "item", target: "next", sourceHandle: "next" },
  ];
  return step(nodes, edges, seed, "for_each");
};

/**
 * 10 — mixed: realistic-ish graph combining root, branch, parallel, loop body,
 * and a composite, so the whole ordering pipeline fires at once.
 */
export const x8Mixed = (seed = 123) => {
  const nodes = [
    makeNode("start", "launch_browser", 0, 0),
    makeNode("switch", "conditional", 160, 0),
    makeNode("acc", "click", 380, -140),
    makeNode("credit", "fill_input", 380, -60),
    makeNode("device", "http_request", 380, 60),
    makeNode("loopb", "loop", 380, 140),
    makeNode("comp", "component", 580, 0),
    makeNode("fin", "assert", 780, 0),
  ];
  const edges = [
    { id: "e0", source: "start", target: "switch" },
    { id: "e1", source: "switch", target: "acc", sourceHandle: "true" },
    { id: "e2", source: "acc", target: "credit" },
    { id: "e3", source: "switch", target: "device", sourceHandle: "false" },
    { id: "e4", source: "credit", target: "comp" },
    { id: "e5", source: "device", target: "comp" },
    { id: "e6", source: "loopb", target: "comp" },
    { id: "e7", source: "comp", target: "fin" },
  ];
  nodes[5].data.flowId = "x8mixed_loop";
  nodes[6].data.flowId = "x8mixed_comp";
  fixture(
    [makeNode("s1", "navigate", 0, 0), makeNode("s2", "click", 200, 0)],
    [{ id: "e_s1", source: "s1", target: "s2" }],
    "X8",
    "mixed-composite-sub",
    { seed, subflowId: "x8mixed_comp" },
  );
  return step(nodes, edges, seed, "mixed");
};

export const x8Graphs = () => [
  x8MultipleRoots(),
  x8Cyclic(),
  x8Diamond(),
  x8Parallel(),
  x8NestedBranch(),
  x8Composite(),
  x8NestedComposite(),
  x8Loop(),
  x8ForEach(),
  x8Mixed(),
];

export const DATASET_BUILDERS = {
  A: datasetLinear,
  B: datasetBranching,
  C: datasetMergeHeavy,
  D: datasetDeepBranching,
  E: datasetDiamond,
  F: datasetComposite,
  G: datasetRealistic,
  H: datasetPathological,
};
