# HALTEST CANVAS — LAYOUT & GRAPH VISUALIZATION
## Technical Feasibility & Experimental Plan

> Branch: `spike/canvas-layout-research` (created from `spike/jev-decision-provider`, which itself tracks the released `main` line).
> Status: **research + experiment design only — no production implementation.**
> Companion evidence: `docs/research/canvas-layout-current-state.md` (forensic report, earlier session).
> Classification legend (used everywhere below):
> - **CONFIRMED BY CODE** — behavior proven from a file:line reference in this working tree.
> - **OBSERVED RUNTIME** — reproduced live (trace / browser run / existing test).
> - **HYPOTHESIS** — reasonable inference, not yet measured.
> - **UNKNOWN** — no evidence yet; the experiment matrix must resolve it.

---

# 1. Executive Summary

HalTest's canvas is a React Flow (v12) workflow editor whose "Magic Organizer" runs a single, synchronous, full-graph **dagre 0.8.5 LR** pass (`apps/frontend/src/utils/layoutUtils.js`) with hand-written branch/merge post-processing, plus a custom edge component (`CustomEdge.jsx`) that draws a dagre-gap-based orthogonal bypass. Positions are persisted per node (JSON), but an **auto-layout fires on every fresh Dashboard load** (`App.jsx:285-292`) and can overwrite saved arrangements — the top position-integrity risk.

This plan's **Phase 0** (code validation, this branch) already produced one critical, previously under-documented finding beyond the forensic report:

> **Visual position DOES influence execution semantics in three, partially intentional, partially hidden ways**
> (see §13.2):
> 1. Entry-point ordering of root nodes uses `position.y` then `position.x` (`useFlowExecution.js:39-55`) — **intentionally documented** ("top→bottom, left→right").
> 2. For graphs with no topological roots (cycles), execution starts at `graphNodes[0]` (`useFlowExecution.js:832-834`), i.e. the *array order* — which Magic Organizer silently changes because its output is **id-sorted nodes and lane-sorted edges** (`layoutUtils.js:462-473`).
> 3. Parallel-branch enqueue order follows the *edges array order* (`useFlowExecution.js:1237,1315-1318`) — also changed by the layout's lane-sort.

Therefore **swapping dagre→ELK (or any engine) will NOT fix the execution-coupling problem**; it is an independent architectural issue that must be solved (or explicitly accepted and tested) before any layout engine is finalized. This is a hard blocker for the "layout must not alter semantics" guarantee.

Everything else in this plan is an experiment-driven roadmap: datasets (10→1000 nodes), layout-algorithm comparison, edge-routing and local-layout feasibility, worker cost, CRDT interactions, benchmark harness, and a decision matrix that stays **conditional** until spike results.

---

# 2. Current Architecture (Phase 0 validation results)

Validated against this working tree on branch `spike/canvas-layout-research`. Each finding: file:line, behavior, impact, confidence.

| # | Discovery | Evidence | Behavior | Impact | Confidence |
|---|---|---|---|---|---|
| 1 | Layout entry points | `App.jsx:281-292` (auto), `:2406-2411` (Magic Organize button), `:2508` + `ContextMenu.jsx:692` (Clean Layout) | 3 triggers, all `onLayout("LR",…)`; auto-layout guarded by `initialLayoutApplied` ref + `useNodesInitialized()` | Position override on every fresh load | **CONFIRMED BY CODE** |
| 2 | Full layout cycle | `useFlowState.js:1222-1246` → `getLayoutedElements` (`layoutUtils.js:201-476`) | dagre LR, `align UL`, `ranker tight-tree`, `nodesep 60/ranksep 90`, margin 50; branch/merge post-passes; id/lane static pre-sort; lane weights `100-lane*10`; cycle edges removed from layout graph | Deterministic but LR-only, full-graph, sync | **CONFIRMED BY CODE** |
| 3 | Node sizes | `layoutUtils.js:160-180` `getLayoutSize` | Uses `node.measured` when present; fallbacks 172×60; conditional/switch height `max(100, branches*45)`; loop/for_each 200×100; +40/+60 padding | Approximate for culled nodes | **CONFIRMED BY CODE** |
| 4 | Undo before layout | `useFlowState.js:1224` | `saveToHistory()` runs before layout; cap 20 (`:329-337` slice(-19)) | Layout is undoable once, then it re-snaps | **CONFIRMED BY CODE** |
| 5 | Edge routing | `CustomEdge.jsx:22-121` | smoothstep if `|Δy|≤30`; bypass otherwise; lane pivot `16+(hash%3)*10`; single vertical drop in rank gap; `memo`-ized; particle CPU-disabled | Works only because dagre leaves ~90px gaps | **CONFIRMED BY CODE** |
| 6 | Position persistence | `Node.js` model `position JSON {x,y}`; `project.router.js:36` mapFlowData; PUT flow `:1419` recreates rows | Positions survive save/reload/import/export | Persisted source of truth is manual position | **CONFIRMED BY CODE** |
| 7 | Autosave | `useFlowSync.js:207` `debounce(()=>saveFlow(true), 2000)` gated by `hasUnsavedChanges` | First user edit after auto-layout persists the *layout* positions | Compound with #1 → manual arrangements clobbered | **CONFIRMED BY CODE** (runtime persist-chain = HYPOTHESIS) |
| 8 | CRDT positions | `useCRDTNodes.js:41-45,125-137` | Positions in Y.Map-of-Y.Maps `{x,y}`, optimistic local writes | Layout is not collaborative-by-design | **CONFIRMED BY CODE** |
| 9 | Execution start order | `useFlowExecution.js:31-55` + `orderStartNodes.test.js:33-39` | launch_browser first; roots by **y then x** then id | Layout/rearrange changes entry order | **CONFIRMED BY CODE** (intentional) |
| 10 | Execution fallback for cycles | `useFlowExecution.js:832-834` | No roots → start at `graphNodes[0]` (array order) | Layout re-sorts array → changes entry | **CONFIRMED BY CODE** |
| 11 | Parallel enqueue order | `useFlowExecution.js:1237,1315-1318` | Winners pushed in edges-array order | Layout lane-sort changes branch order | **CONFIRMED BY CODE** |
| 12 | Branch path selection | `useFlowExecution.js:1262-1293` (`matchesBranchPath(e.sourceHandle, path)`) | TRUE/FALSE/case decided by sourceHandle, never position | Layout is neutral to branch choice | **CONFIRMED BY CODE** |
| 13 | Composite expansion | `useFlowExecution.js:857-1055` | component/loop recurse via `executeGraph` on the subflow, depth ≤15, its own `orderStartNodes` | Subflow entry order is also position-based | **CONFIRMED BY CODE** |
| 14 | Measurements | `@xyflow/react 12.10.0` `useNodesInitialized` (measured render), `onlyRenderVisibleElements:true` (`App.jsx:1860`) | Layout runs after first paint with measured sizes for visible nodes | Culled nodes use fallback sizes | **CONFIRMED BY CODE** |
| 15 | Import/export | `ProjectImportService.js:263,283` keeps viewport+position; export serializes stored data | Round-trips positions | Compatible with manual-first policy | **CONFIRMED BY CODE** |

**Old-assumption corrections found during Phase 0 (format §28):**

1. OLD ASSUMPTION: "layout-node sizes are hardcoded 172×60." ACTUAL CODE: `getLayoutSize` prefers `node.measured` and only falls back. EXPERIMENT: none needed, code is decisive. RESULT: measured sizes are used for rendered nodes. CONCLUSION: keep the "real sizes" work scoped to *culled* nodes only.
2. OLD ASSUMPTION: "edge bypass exits with a horizontal run through the gap." ACTUAL CODE: single vertical drop at pivotX then straight into the target (`CustomEdge.jsx:48-61`). RESULT/CONCLUSION: routing is simpler than thought — good baseline for routing experiments.
3. OLD ASSUMPTION: "cycle edges removed → nodes un-laid." ACTUAL CODE: only the edge is dropped from the *layout graph*; the edge is still drawn (`layoutUtils.js:264-269`). CONCLUSION: no silent node loss.
4. OLD ASSUMPTION: "execution is layout-independent (only one tie-break)." ACTUAL CODE: **three** couplings (§13.2). This is the single most important correction.

---

# 3. Confirmed Problems

1. **P1 — Position/semantics coupling (CRITICAL, §13.2):** layout and manual rearrange can change execution order (entry roots, cyclic fallback, parallel enqueue).
2. **P2 — Auto-layout on load silently overrides persisted positions** and the next autosave persists that override (`App.jsx:285-292` + `useFlowSync.js:207`).
3. **P3 — Magic Organizer is LR-only and full-graph; user cannot request selective/local arrangement.** No "arrange selection", no direction choice, no compaction.
4. **P4 — Edge routing is a fixed heuristic** (single vertical drop, ≤3 lanes, relies on dagre gap) — not real obstacle-aware routing; no cache.
5. **P5 — No node-grouping / visual container model** (loops/components are flat reference boxes, not groups).
6. **P6 — CRDT + layout concurrency is undefined** (layout is one big op written into Yjs).
7. **P7 — No browser-level perf harness**; only one unit perf test (107 nodes < 2 s, `layoutUtils.test.js:181-230`).
8. **P8 — Layout arrays are re-sorted** (id nodes, lane edges) which is the mechanism behind the hidden semantic couplings.

---

# 4. Unknowns (need experiments)

| UNKNOWN | Why it matters | How to resolve |
|---|---|---|
| U1. Does auto-layout actually *persist* (edit→autosave chaining) in practice? | Determines severity of P2 | Browser repro (§12) + cy test |
| U2. dagre vs ELK visual/aesthetic gap on LR pipelines of 300-1000 nodes | Load-bearing for engine choice | Dataset A-G runs (§8+§17) |
| U3. Is a web worker actually faster when you serialize 500-1000 nodes? | Worker feasibility (§16) | §16 spike with transferable/delta encodings |
| U4. What is HalTest's real node-count distribution? | Justifies which targets matter (50 vs 1000) | Telemetry/usage query (UNKNOWN today) |
| U5. User artifact: do real flows rely on multi-root entry ordering? | Defines severity of coupling P1 | Code search in stored flows + §13 tests |
| U6. ELK browser/worker bundle cost & API determinism | Migration economics (§17) | §17 spike |
| U7. Local layout stability: can reorganizing 20 selected nodes leave 480 untouched? | Core feasibility of §10 | §10 spike |
| U8. Yjs transaction cost of a 500-node layout write | Collaboration UX (§15) | §15 instrumented run |
| U9. What exactly `Flow.viewport` JSON is used for / round-tripped to? | Position persistence truth (§13) | Trace all readers (UNKNOWN) |

---

# 5. Hypotheses (to be falsified or confirmed)

- **H1:** For LR automation workflows, dagre's `tight-tree`/`UL` produces wider, more crossing-heavy ranks than ELK's layered compacter; ELK (or a hand-rolled layered pass) yields lower max-edge-length and fewer crossings on Dataset A–E.
- **H2:** `onlyRenderVisibleElements` keeps node render cost flat, but the MiniMap re-render during pan/zoom is the dominant jank source at 500+ nodes.
- **H3:** A worker only pays off above ~250-500 nodes because postMessage + Yjs/position serialization dominates below that.
- **H4:** Local layout is viable only if it operates on a subgraph and *reconciles against frozen neighbors* with a seam pass; otherwise it reorders arrays and triggers P1/P8.
- **H5:** Array-order fallbacks (`graphNodes[0]`, edges-array enqueue) were never meant to be stable, so decoupling them from coordinates is low-risk for correct flows but changes current behavior on cycles/parallel branches.
- **H6:** `orderStartNodes` position tie-breaking is used by real flows as an *intended* feature ("run the top entry first"), so removing it needs a config/flag path, not a silent fix.

---

# 6. Experimental Matrix

Every experiment: reversible spike on this branch or a child branch, no `main` changes, results recorded as Markdown in `docs/research/spikes/`.

| ID | Name | Answers | Branch | Exit signal |
|---|---|---|---|---|
| X1 | Position-persist repro | U1, P2 severity | `spike/canvas-layout-lab` | Height-1 test + browser trace confirming/closing the edit→autosave chain |
| X2 | Datasets A-H builder | (common) | same | Reproducible node[]/edge[] JSON in `test/fixtures/layout/synthetic/` |
| X3 | dagre→ELK comparison | U2, H1, §8 | `spike/layout-engine-compare` | Metric table over A-H |
| X4 | Local layout spike | U7, H4, §10 | `spike/layout-local` | Working "arrange selection" that leaves frozen neighbors' arrays/positions byte-identical |
| X5 | Edge routing spike | §9 | `spike/edge-routing` | Route-quality + perf comparison (incl. cache) |
| X6 | Worker cost spike | U3, H3, §16 | `spike/layout-worker` | Serialization vs compute curve |
| X7 | ELK integration spike | U6, §17 | `spike/elk` | Isolated harness, visual diff vs dagre |
| X8 | Execution-semantics tests | P1, H5/H6, §13 | `spike/exec-semantics-tests` | Test suite proving/rejecting coupling cases + proposed rule |
| X9 | CRDT layout-concurrency spike | §15 | `spike/crdt-layout` | Conflict outcome + op-count measurement |
| X10 | Benchmark harness | §16, P7 | `spike/perf-harness` | Playwright FPS/latency/memory numbers on A-H at 50/100/250/500/1000 |

---

# 7. Dataset Design

One builder (`test/fixtures/layout/generators/`) emitting deterministic `{ nodes, edges }` via seeded PRNG so all metrics are reproducible. Node types reflect HalTest reality: `launch_browser`, `click`, `assert`, `open_url`, `conditional`, `switch`, `loop`, `for_each`, `component`, `input`, `output`.

- **A Linear:** chains of 10 / 50 / 100 / 250 / 500 / 1000 with a single `launch_browser` head.
- **B Branching:** conditional/switch with 2 / 3 / 5 / 10 branches (each branch a short action).
- **C Merge-heavy:** many 2-way branches converging to shared merge nodes (stress merge post-pass and edge fan-in).
- **D Deep branching:** branch→branch→branch→merge→branch nesting ≥5 levels.
- **E Diamond:** single diamond plus variants (multi-diamond ladders, nested diamonds).
- **F Composite:** main (chain) → component / loop / for_each / component with real sub-flow rows.
- **G Mixed real-world:** combination of navigation, assertions, fills, conditions, loops, composites, branches, merges (target ≈ 250 nodes for the "realistic" profile).
- **H Pathological:** deliberately crafted to produce: crossing-heavy wide ranks, very deep ranks, many simultaneous merges, long edges, a cyclic component (legit DAG with one isolated cycle), dense local clusters (K_{n,m} bipartite), duplicate labels, near-constant 1px layering.

Every dataset records: node count, edge count, max in/out degree, number of roots, number of cycles, total depth, and a stable hash of the input (used by determinism tests).

---

# 8. Layout Algorithm Comparison

Benchmark configs (all deterministic, same datasets A–H, LR):

- **Current:** `getLayoutedElements` + dagre 0.8.5 (baseline).
- **ELK layered** (spike harness only, §17).
- **Hand-rolled layered pass prototype** (longest-path ranking + barayit ordering + coordinate assignment) — built only to answer "can we outperform dagre without ELK" (license/bundle-freedom).

Independent metrics (auto-computed by the harness):
- execution time (ms, 5 runs, median+p95)
- node overlap count (exact boxes, using `getLayoutSize`)
- edge crossing count (segments in layout space)
- total canvas width / height
- average & maximum edge length (manhattan)
- branch separation (min vertical gap between sibling lanes)
- merge readability (converging fan-in angle / gap at merge targets)
- whitespace ratio (bounding-box area vs union-of-node area)
- rank consistency (variation of node center-y within a rank)
- determinism (byte-equal output across runs)
- stability (re-run on slightly perturbed input → measure delta positions)

UX criteria (qualitative, judged on rendered canvas, recorded as screenshot + notes):
- pipeline readability of Dataset A at 250/500;
- branch/merge legibility in C/D;
- "does any node float far from its semantic group".

Exit: one of two minimal positions must hold — (a) current dagre is within tolerance on all chosen targets and the plan focuses on UX/control instead; or (b) ELK/prototype is clearly better on ≥2 of (width, crossings, max-edge-length, readability) at 250/500 with equal determinism.

---

# 9. Edge Routing Investigation

Candidates: (1) React Flow smoothstep (baseline), (2) current CustomEdge bypass, (3) ELK routing, (4) hand-rolled orthogonal router, (5) grid/A* with obstacle avoidance, (6) simplified deterministic fan-out heuristic, (7) cached hybrids.

Evaluation axes: complexity (lines/impl), cost per edge (median ms at 100/500/1000/5000 edges), visual stability (path delta when one node moves), crossings, behavior during drag, cacheability (memo/LRU on geometric key), worker necessity.

Key question to answer with data (§P4):
> How to avoid a local reorganization re-rendering hundreds of edges differently?

Proposed approach to test: **routing keyed on topology, not coordinates** — cache the path for `(sourceId, targetId, port, laneIndex)` and invalidate only when a node in a swept rect moves. The current CustomEdge recomputes on every render; X5 will measure how much cache reduces path recomputation during drag.

---

# 10. Local Layout Investigation ("Arrange Selection" etc.)

Feasibility matrix of the requested operations:

| Op | Tech viability | Consistency risk | Notes |
|---|---|---|---|
| Arrange Selection (20/50 nodes) | High | Medium | Subgraph lay-*out must keep frozen neighbors + their edges; seam = keep edge endpoints on same handles. |
| Arrange Branch | High | Medium | Root at the branch source; scope = reachable set until merge/exit. |
| Arrange Region | Medium | High | Region → layout only nodes whose bbox ⊂ region; edges crossing region boundary can't be re-routed portion-wise — must keep global edges. |
| Arrange Subflow (component/loop) | High | Low | Sub-flow is a separate graph; just layout *inside* that flow. |
| Arrange Downstream/Upstream from node | High | Medium | Same subgraph scope mechanics as branch, seed = selected node. |
| Compact Selection | Medium | Low | Squeeze bbox greedily; must respect adjacency/handles. |
| Route Selected Edges | High | Low | Edge-only view; no node moves. |

Design rule to enforce: **any local layout must leave the `nodes`/`edges` array order unchanged for non-participating nodes/edges** so it cannot trigger P1/P8 (the array-sort couplings). X4 will verify with byte-identical array assertions on the non-selected part.

---

# 11. Composite Flow Investigation

Models (not pre-selected):
1. Simple box (current).
2. Preview of subflow inside the box (SVG minigraph).
3. Internal mini-map.
4. Expandable node (detail pane / expand in place).
5. Nested canvas (RF subflows — heavier, risks infinite-graph feel).
6. Visual silhouette (A→B→C thumbnail inside the box).

Evaluation per model: main-canvas comprehension vs information density, RF compatibility (node = component renders custom SVG), persistence (data.flowId + cached subgraph), execution (unchanged — subflows already recurse), scalability (thumbnail cost at 100 composite nodes).

Recommended spike: prototype **Model 6 (silhouette)** + **Model 2 (preview)** in X3's harness because both are pure-render and reversible; keep Model 5 out of scope unless user asks.

---

# 12. Position Persistence Investigation

Experiments (X1):
1. Open flow → move nodes → save → reload → compare positions.
2. Open flow → **do nothing** → save/reload → confirm unchanged.
3. Open flow → fresh Dashboard → auto-layout fires → positions now layout-derived → make any edit → wait 2.5 s → backend PUT → reload → positions = layout-derived (falsify/confirm P2 chain).
4. Switch flows mid-session → does the guard ref prevent re-layout? (Expected yes per code; verify rut.)
5. Import → positions preserved (expected per code; verify).
6. CRDT: two editors + layout (→ X9).
7. Undo after layout → does position restore? (Expected yes — history snapshot before layout.)

Source-of-truth question: determine/shall follow of **"manual position vs layout vs CRDT vs server"**. Hypothesis (H-recommendation): manual position stays the source of truth; layout is a derived, undoable transform; CRDT is the transport; server is the durable copy. X1 + X9 produce the evidence, then this plan recommends the policy in Phase 3.

---

# 13. Execution Semantics Investigation ⚠️ (CRITICAL)

### 13.1 The requirement
> "Changing only the visual position of nodes must never change the intended execution semantics."

### 13.2 Phase 0 findings (all CONFIRMED BY CODE)

| # | Rule | Code | Intentional? |
|---|---|---|---|
| E1 | Roots (no incoming) ordered: launch_browser → **y** → **x** → id | `useFlowExecution.js:39-55` (+ docstring `:31-38`; test `orderStartNodes.test.js:33-39`) | **YES** — documented "canvas order top→bottom, left→right" |
| E2 | No roots (cycle) → start at `graphNodes[0]` (array order) | `useFlowExecution.js:832-834` | **NO** — silent array dependence |
| E3 | Parallel winners enqueued in edges-array order | `useFlowExecution.js:1237,1315-1318` | **NO** — silent array dependence |
| E4 | Branch choice by `sourceHandle`↔path, never position | `useFlowExecution.js:1262-1293` | YES — position-neutral ✓ |
| E5 | Layout outputs id-sorted nodes, lane-sorted edges → mutates arrays used by E2/E3 | `layoutUtils.js:462-473` + `setNodes/setEdges` (`useFlowState.js:1236-1237`) | **NO** — unintended side channel |
| E6 | Composite subflows recursively use their **own** `orderStartNodes` | `useFlowExecution.js:883,1020` | inherits E1 |

### 13.3 Consequence
- **E1 is an intended feature** (visual order defines entry order). It means "positions must not change semantics" is **already violated by design** for multi-root flows. The plan must decide: (a) make entry order explicit via an `isEntry`/`startOrder` field (positions still the tie-break default), (b) keep-as-is but lock the contract with tests, or (c) gate behind a flag.
- **E2/E3/E5 are accidental** couplings: Magic Organizer re-sorting arrays changes entry (cycles) and parallel branch order. These should be killed by construction (never re-sort array order in output; derive order from ids kept stable; enqueue winners by explicit edge order field, not array).

### 13.4 Tests to add (spike X8)
- Unit: layout output preserves `nodes` array input order for equal topology (pin E5).
- Unit: `orderStartNodes` semantics pinned for multi-root (document E1).
- Unit: cyclic graph — entry == expected before AND after layout (fail today → documents E2).
- Integration (frontend exec): diamonds + parallel branches execute same sequence after layout iff E3 removed.
- The final contract test: **same semantics for any arrangement of the same DAG** (future).

### 13.5 Classification for the plan
Issue type: **architectural, independent of the layout engine** — replacing dagre with ELK does NOT address it. Must be resolved (or explicitly accepted via documented contract) before Phase 4.

---

# 14. Collaboration Investigation

Questions: what happens when editor B runs layout while A drags and C reorders another branch; is layout atomic; cancelable; how undo works; notifications; 500-node cost; CRDT op count.

Phase 0 status: positions live in Y.Map-of-Y.Maps (`useCRDTNodes.js`), optimistic local writes; no layout-specific merge/atomicity (`UNKNOWN`, needs X9).

X9 spike: (a) instrument Yjs transaction size for a 500-node layout write; (b) concurrent layout+drag simulation → record outcomes (last-writer-wins per cell, interleavings); (c) evaluate "layout as a single Yjs transaction with a layoutVersion field" so old layouts can be retracted; (d) decide strategy for Phase 3 (likely: layout = user-visible op → preview → confirm → atomic Y transaction; no auto-layout in collab rooms, or layout only with permission).

---

# 15. Performance Benchmark Plan

Playwright + in-app instrumentation (`spike/perf-harness`). Metrics:

- **Layout:** time for A (10/50/100/250/500/1000), C, D, H at same engine configs.
- **Drag:** FPS while dragging single node / branch / dense region, measure via rAF sampler.
- **Edge routing:** path-compute ms at 100/500/1000/5000 edges (crossing, plus cache hit-rate after drag).
- **Minimap:** pan/zoom/drag FPS with 0/250/500/1000 nodes.
- **Memory:** heap snapshots at initial, after 10 and 50 layouts; undo-history growth; collab sessions.
- **Interaction latency:** time-to-`onNodeDragStop`, key-handler latency; record long-tasks via PerformanceObserver.

Targets are **research targets only** for now: <16 ms frame, <50 ms interaction, no > 250 ms main-thread block. Recommend *official* budgets only after data.

---

# 16. Worker Feasibility

Evaluate: serialization cost vs compute; transferable structures (transfer nodes as flat Float64Arrays of x/y/w/h to avoid structured-clone overhead); cancellation (AbortController); stale-result handling (version counter + apply-if-latest); React state sync; bundle size; build; local mode; browser support (all modern; worker in dev with `?worker`).

Key experiment (X6): curve = postMessage time for 100/250/500/1000/5000 nodes vs in-thread layout time at same sizes. Decision rule: use worker only above the crossover where postMessage + compute < in-thread compute for the *p50 and p95* of real layouts.

---

# 17. ELK Spike Plan

Isolated `spike/elk`. Investigate: npm package reality (ELK JS variants, browser build), worker compatibility, bundle size (gzip, separate vs inline), license (EPL-2.0 — legal review), API/determinism, compound support, incremental/de-incremental layout (ELK has `delete`/`move`/`incremental` hooks — verify), cycle handling, edge routing quality.

Deliverable: harness running datasets A–H, outputting §8 metrics + visual diffs beside dagre. No production install without this evidence.

---

# 18. UX Investigation

Tool inventory to evaluate (design-only): Organize (Magic Organize), Arrange Selection, Compact, Align (L/C/R/T/B), Distribute (H/V), Re-route selected edges, Layout modes (Auto/Manual/Hybrid), View (Fit Workflow / Fit Selection / Focus Node), Reset Layout, Lock Position.

Feasibility signals:
- Align/Distribute: trivial, low risk (x/y algebra on selection) — safe candidates.
- Compact: feasible with constraints → medium.
- Lock Position: needs `draggable:false` per node + undo + layout exclusion — medium, useful for manual-first.
- Reset Layout: clear positions → next layout — low.
- Fit Selection/Focus Node: RF supports via viewport; low.
- Modes: Auto vs Hybrid is the UX core of P2; drive from X1 evidence.

---

# 19. Test Strategy

- **Unit (vitest):** `getLayoutedElements` semantics (existing), determinism, branch/merge/cycle; plus new E1/E2/E3/E5 pins (§13.4); routing path geometry; local-layout array-stability assertions.
- **Integration:** save/load round-trip, undo/redo chains, `onLayout` effect + `hasUnsavedChanges` chain (X1), CRDT position merge (X9).
- **Browser (Playwright):** arrange, drag, zoom, minimap, 500-node render, layout run, persistence repro, and the E2/E3 semantic-order checks against real runs.
- **Visual regression:** snapshots of A–H outputs (dagre today / ELK spike / future) — regenerate deliberately when layout changes, never drift silently.
- **Perf regression:** thresholds in §15, asserted by harness CLI; store baselines as JSON artifacts.

---

# 20. Migration Architecture Options

Three options, all preserving the abstraction:

- **M1 — Adapter only (no engine change).** Wrap `getLayoutedElements` behind `layoutGraph(graph, options) → { nodes, edges, metadata, warnings, metrics }`. Fix P2/P8/E2/E3 immediately (low risk, high value).
- **M2 — M1 + replace engine (dagre→ELK/prototype) behind adapter + worker.** Riskiest visual change; go only if §8 says so.
- **M3 — M1 + composable layout system**: engines plus *local layout ops* (arrange selection/branch/region), routing module, and position policy — the target end-state, phased.

Proposed interface (not implemented):
```ts
layoutGraph(graph: { nodes, edges }, options: {
  engine: "dagre"|"elk"|"layered-custom",
  direction: "LR"|"TB",
  scope?: { nodes: string[] } | "selection" | "subgraph",
  frozen?: string[],
  padding?: Spacing,
  preserveArrayOrder?: boolean, // kill E5
}): Promise<LayoutResult>
  // LayoutResult = { nodes:{id,x,y}[], edges?, metadata, warnings, metricsMs }
```
Every migration step lands behind a feature flag and compares byte-level with the previous engine on datasets A–H before flip; visual/composite/perf regressions gate each step.

---

# 21. Risk Matrix

| Risk | L | I | Mitigation |
|---|---|---|---|
| Engine swap changes baseline visuals (fear of regression) | M | H | M1 first; flag-gated; A–H visual baselines |
| Execution semantics drift (E1-E3) | M | C | §13 team decision + contract tests before layout work |
| ELK not usable in browser/worker or license risk | M | M | Keep prototype path in §8 |
| Worker serialization net-negative | M | M | X6 crossover data gates it |
| CRDT+layout conflicts corrupt positions | M | M | X9 + atomic layoutVersion transaction |
| Auto-layout persistence bug ships silently | H | M | X1 gate + "no-op open must not save" invariant |
| Perf harness flakiness in CI | M | M | seeded PRNG, deterministic inputs, generous budgets initially |
| Local layout decomposes freezes neighbors | M | M | byte-identical non-scope assertions in tests |

---

# 22. Expected Implementation Complexity (rough, evidence-refined later)

| Work | Engine | Local | Routing | Policy | Perf | CRDT | Tests |
|---|---|---|---|---|---|---|---|
| Effort (dev-days) | 5-15 | 8-20 | 5-12 | 3-6 | 6-12 | 4-8 | 5-10 |
| Risk | H | M | M | L | L | M | L |

---

# 23. Recommended Experiments in Order

1. **X1** position-persist repro (cheap, decides P2 policy).
2. **X8** execution-semantics tests (cheap, decides the critical contract).
3. **X2** datasets (prerequisite for everything metric-based).
4. **X10** perf harness baseline on current engine (before touching anything).
5. **X3** dagre→ELK/prototype comparison.
6. **X7** ELK spike (only if §8 says "ELK looks better").
7. **X4** local layout spike (independent of engine choice).
8. **X6** worker crossover, then **X5** routing cache (orthogonal).
9. **X9** CRDT-layout concurrency (independent, can run in parallel).

---

# 24. Exit Criteria (answer each before Phase 3 closes)

1. dagre sufficient? (X3)
2. ELK genuinely better? on which metrics, at which N? (X3/X7)
3. Edge routing must be separated? (X5)
4. Worker shows measurable benefit? (X6)
5. Incremental/local layout required? and feasible at what cost? (X4)
6. Manual-first becomes policy? (X1 + UX)
7. Arrange Selection viable? (X4)
8. Composite flows: which model? (X3/UX)
9. How to kill crossings without touching semantics? (§8/§10 evidence)
10. How to preserve positions (policy)? (X1)
11. Layout⇒execution decoupling contract defined & tested? (X8) **— GATE**
12. Collaboration strategy defined? (X9)
13. Practical node limit? (X10)
14. Migration cost? (X2-X7 evidence → §20)
15. Low-risk quick wins list (M1 fixes: P2 guard, E5 array-order, undo perms)
16. Which changes need major architecture (worker, engine swap, CRDT transactions)

---

# 25. Decision Matrix

Rules: no subjective ratings — each row names the problem solved, the evidence needed, risk, effort, and the experiment that gates it. Status = pending until its gate closes.

| Area | Current | Option A | Option B | Evidence needed | Risk | Effort | Needs Spike | Status |
|---|---|---|---|---|---|---|---|---|
| Engine | dagre LR full-graph | ELK layered | Hand-rolled layered | §8 metrics: crossings/width/edge-length at 250/500 on A–H | H | 5-15dd | X3/X7 | pending |
| Auto-layout policy | force on load (P2) | Gate behind setting + first-open dialog; only layout when no meaningful positions | Never auto-layout; Magic Organize stays explicit | X1 repro; UX opinion | M | 1-2dd | X1 | pending |
| Execution coupling | E1/E5 hidden (P1) | Keep E1 as contract, kill E2/E3/E5 (array order preserved + explicit entry) | Full decouple: entry order stored, not visual | X8 pin tests + runtime traces | C | 3-6dd | X8 | **GATE** |
| Edge routing | CustomEdge heuristic | Separated router module + LRU cache | Obstacle-avoid grid/A* | X5 metric table + drag FPS | M | 5-12dd | X5 | pending |
| Local layout | none | Subgraph layout with frozen-seam pass | Skip (manual only) | X4 feasibility + array-stability tests | M | 8-20dd | X4 | pending |
| Composite visual | flat box | Silhouette (Model 6) | Inline preview (Model 2) | X3 renders + UX review | M | 3-8dd | X3 | pending |
| Position truth | manual (persisted) | Manual = source of truth; layout = derived undoable | CRDT-authoritative | X1/X9 | M | 2-4dd | X1/X9 | pending |
| Worker | none | Worker when above crossover N | Always main-thread under N | X6 serialization-vs-compute curve | M | 4-10dd | X6 | pending |
| Minimap | live node-components SVG | Data-derived rect map + debounce | ESK map service | X10 pan/zoom FPS 500/1000 | L | 2-5dd | X10 | pending |
| CRDT layout | none defined | Atomic layoutVersion transaction, no-auto-layout in rooms | Last-writer-wins (status quo) | X9 conflict runs + op counts | M | 4-8dd | X9 | pending |

---

# PHASE 0 — FACT FINDING
Complete. Binary result above (§2, §13). Only deliverable produced is this document (plus the prior forensic report); **no production code changed**.

# PHASE 1 — EXPERIMENTAL SPIKES
Run X1, X8, X2, X10, X3 (in order), then X4/X7/X5/X6/X9 in any order. Each spike lives on its own branch from `spike/canvas-layout-research`, is fully reversible, and records findings in `docs/research/spikes/`.

# PHASE 2 — BENCHMARKS
X10 harness output becomes the baseline and the gate for every subsequent change; §15 metrics recorded as JSON artifacts.

# PHASE 3 — ARCHITECTURE DECISION
Synthesize §25 matrix rows into a recommendation with data. The **critical blocker to resolve first**: the execution-semantics contract (§13), because it is independent of all layout engines and changes the shape of every downstream decision.

# PHASE 4 — IMPLEMENTATION PLAN (future proposal, NOT implemented here)
If Phase 3 closes positively: M1 (adapter + P2 guard + E5/E2 kill) → engine/kernel behind flags → routing + local layout → CRDT/worker → UX tools, each gated by X10 baselines.

---

# Appendix A — Git safety record

- Base branch verified before branching: `spike/jev-decision-provider` (contains released v1.0.71 `main` history).
- Created: `spike/canvas-layout-research`.
- Only artifact: this document (and the earlier `docs/research/canvas-layout-current-state.md`). No tracked production files modified.
- No merge, rebase, push, DB migration, or destructive git operation performed.

# Appendix B — Sources used for Phase 0
- `apps/frontend/src/utils/layoutUtils.js` (1-476)
- `apps/frontend/src/hooks/flow/useFlowState.js` (1222-1246, 329-337, 32-47)
- `apps/frontend/src/hooks/flow/useFlowExecution.js` (31-55, 798-835, 1237-1318)
- `apps/frontend/src/hooks/flow/useFlowSync.js` (203-214)
- `apps/frontend/src/App.jsx` (281-292, 1820-1875, 1969-2027, 2396-2411)
- `apps/frontend/src/components/edges/CustomEdge.jsx` (22-203)
- `apps/frontend/src/collaboration/useCRDTNodes.js` (41-45, 125-137)
- `apps/frontend/src/utils/layoutUtils.test.js`, `apps/frontend/src/hooks/flow/orderStartNodes.test.js`
- `apps/backend/routes/project.router.js`, `apps/backend/database/models/{Node,Edge,Flow}.js`, `apps/backend/services/ProjectImportService.js`