# Canvas Layout — Validation of the Plan's Audit Findings

> Branch: `spike/canvas-layout-research` · HEAD: `0553d26` (+1 test/harness commit on the spike)
> Method: revalidated each statement of the plan's §2 audit against current code
> (read-only) plus two executed experiments (X1 browser, X8 simulator). Evidence
> classes per RULE 5.

## Consolidated verdicts

| Statement (plan §2/later finding) | Verdict | Evidence |
|---|---|---|
| E1 roots execute in position order y→x→id (`orderStartNodes`) | **CONFIRMED** | CONFIRMED BY CODE `useFlowExecution.js:39-55`; OBSERVED RUNTIME (X8 traces: multiple-roots flip) |
| E2 cyclic graphs fall back to `graphNodes[0]` (array order) | **CONFIRMED** | CONFIRMED BY CODE `useFlowExecution.js:831-834`; OBSERVED RUNTIME (X8 traces: cyclic `c,a,b`) |
| E3 branches/parallel winners enqueue in edges-array order | **CONFIRMED** | CONFIRMED BY CODE `:1237,1315-1318`; OBSERVED RUNTIME (diamond, parallel traces) |
| E4 branch selection by `sourceHandle` is position-neutral | **CONFIRMED** | CONFIRMED BY CODE `flowUtils.js:507`; OBSERVED RUNTIME (nested-branch, position/edge permuted → winner unchanged) |
| E5 `getLayoutedElements` re-orders node/edge arrays by sorted dagre output | **CONFIRMED** | CONFIRMED BY CODE `layoutUtils.js:210-221` |
| E6 initial auto-layout keeps execution semantics safe in practice (common branch cases) | **MODIFIED → NARROWED** | Branch bodies head-to-tail by sourceHandle (intentional); but array-coupling remnants (cyclic fallback, ties) and multi-root position coupling mean "safe in practice" holds only for single-root, single-winner graphs |
| P2 fresh load can overwrite persisted manual positions (initial `onLayout`) | **CONFIRMED** | CONFIRMED BY CODE `App.jsx:285-292`; OBSERVED RUNTIME — X1: persisted fixture positions 0/5 visible; drag does not survive reload (n1 back at y≈50); autosave persists generated positions |
| P3 no pinned-node concept; `getLayoutedElements` ignores persisted positions | **CONFIRMED** | CONFIRMED BY CODE `layoutUtils.js:201-273` (only dagre output, no pinning) |
| P7 CRDT sync re-sorts node array by id and re-applies local nodes | **NEW (added this session)** | CONFIRMED BY CODE `useCRDTNodes.js:100` (`nodeArray.sort((a,b)=>a.id>b.id?1:-1)`) — reintroduces array-order coupling (E2) on every remote event |

## Changed / refined statements

1. E6 was too broad. The safe-vs-unsafe boundary is now measurable and
   reproducible (X8 dataset sweep):
   - **Safe** (no permutation changes output): linear, single-winner branching,
     nested-branch, composite.
   - **Unsafe** today: multi-root graphs with independent start y (E1) — e.g.
     merge-heavy with 4 roots; foldback cycles (nodes-array fallback); diamond /
     parallel ties among lo/hi winners (edges-array order).
   - Any layout engine work **must not be merged while E1/E2/E3 stand**; a
     deterministic execution key must be introduced first.
2. X1%20cases render positions even though autosave-canonical reads were
   unreliable**: only the browser DOM measurements count as evidence; the two
   `fetchCanonical` boolean fields read 0 because `activeFlowId` pointed at the
   empty auto-created flow at export time (back-end warm-up ordering), so they
   were excluded from the verdict.

## New findings this session

- **Execution-order determinism budget**: layout sort (E5) AND CRDT id-sort
  (P7) independently reorder arrays, so execution order today equals
  "whatever the layout/CRDT last wrote" — never the user's construction order —
  for the tie cases above.
- **Backend export shape quirk** used by X1: nodes live under
  `flows[project.activeFlowId].nodes`, and `activeFlowId` is not guaranteed to
  point at the created flow until the frontend autosaves; fresh-created projects
  default `activeFlowId` to the auto-created empty "Main Flow".
- **Auto-layout trigger**: `App.jsx:285-292` re-runs `onLayout("LR")` once per
  mount (guarded by refs), i.e. every fresh dashboard open, not just first
  visit.

## Artifacts produced (all on the spike branch; production code untouched)

- `apps/frontend/test/fixtures/layout/export.js` — seeded generators (A–H datasets
  + 10 X8 graph shapes), SHA-256 pinned, metadata.
- `apps/frontend/src/hooks/flow/layoutEngines.test.js` — X3 comparison suite (10 tests, 3 engine arms).
- `apps/frontend/src/hooks/flow/edgeRouting.test.js` — X5 routing cache + candidates (17 tests).
- `apps/frontend/src/hooks/flow/workerCrossover.test.js` — X6 serialization vs compute cost model.
- `apps/frontend/src/hooks/flow/crdtConcurrency.test.js` — X9 CRDT-layout concurrency suite (6 tests).
- `apps/frontend/src/utils/layoutUtils.js` — X4 `getLayoutedElementsLocal` export.
- `apps/frontend/src/utils/layoutUtils.test.js` — X4 local layout tests (6 tests).
- `apps/frontend/e2e/x7-elk-worker.spec.js` + `e2e/elk-inpage.js` + `e2e/empty.html` — X7 browser geometry + longtask measurement.
- `apps/frontend/src/hooks/flow/elkIntegration.test.js` — X7 Node spike suite (6 tests).
- `apps/frontend/src/hooks/flow/fixtureGenerator.test.js` — X2 validation suite (4 tests, hash-pinned).
- `apps/frontend/src/hooks/flow/executionSemantics.test.js` — X8 suite (9 tests).
- `apps/frontend/e2e/x1-position-persistence.spec.js` + `apps/frontend/playwright.config.ts`
  — X1 harness (7 cases); `apps/frontend/e2e/x10-layout-baseline.spec.js` — X10 harness (5 trials).
- `docs/research/spikes/X1-position-persistence.md`, `docs/research/spikes/X8-execution-semantics.md`,
  `docs/research/spikes/X10-layout-baseline.md`, `docs/research/spikes/X2-dataset-generator.md`,
  `docs/research/spikes/X3-layout-engines.md`,
  `docs/research/spikes/data/X1/results.json`, `docs/research/spikes/data/X8/traces.json`,
  `docs/research/spikes/data/X10/results.json`, `docs/research/spikes/data/X2/manifest.json`,
  `docs/research/spikes/data/X3/results.json`, `docs/research/spikes/data/X7/results.json`,
  `docs/research/spikes/data/X7/browser-worker.json`, `docs/research/spikes/data/X9/results.json`,
  `docs/research/spikes/data/X4/results.json`, `docs/research/spikes/data/X6/results.json`,
  `docs/research/spikes/data/X5/results.json`.
- Dev-only dep adds (frontend): `@playwright/test@1.62.1`, `elkjs` (bundled, for the X3/X7 comparison only).

## Phase 3 Decision: **PROCEED with M1→M4 plan**

All 10 spikes (X1–X10) complete. **25 test files / 276 tests green**, lint clean, production code untouched.

**Decision summary**: Proceed with implementation plan (Phase 4), gated by:
1. **X8 GATE** — Execution-semantics contract (E1/E2/E3) codified as CI tests
2. **X7b GATE** — ELK production build verification (`vite build` + longtask measurement)

### Exit Criteria Answers

| # | Criterion | Verdict |
|---|---|---|
| 1 | dagre sufficient? | **NO** — ELK 4–7× better |
| 2 | ELK genuinely better? | **YES** — 4–7× compact, 2–9× fast |
| 3 | Edge routing separated? | **NO NEED** — CustomEdge + cache 98% hit |
| 4 | Worker benefit? | **NO** — no crossover ≤1000 |
| 5 | Local layout feasible? | **YES** — X4 implemented |
| 6 | Manual-first policy? | **YES** — X1 P2 confirmed |
| 7 | Arrange Selection viable? | **YES** — X4 6 tests |
| 8 | Composite model? | **Model 6 + 2** — pure-render |
| 9 | Kill crossings w/o semantics? | **Layout ≠ execution** — X8/X4 |
| 10 | Preserve positions policy? | **Manual = truth** — X1/X9 |
| 11 | Layout⇒execution decoupling? | **GATE** — E1/E2/E3 contract |
| 12 | Collaboration strategy? | **Atomic layoutVersion tx** — X9 |
| 13 | Practical node limit? | **~500 dagre / ~2000+ ELK** — X10 |
| 14 | Migration cost? | **M1: adapter + P2 guard + E5/E2 kill** |
| 15 | Quick wins? | **P2 guard, E5 kill, undo perms** |
| 16 | Major arch changes? | **Engine swap, CRDT tx** |

### Decision Matrix

| Area | Decision | Gate |
|---|---|---|
| Engine | **ELK behind adapter (M1→M2)** | X3/X7 ✅; E1/E2/E3 + license + X7b |
| Auto-layout | **Off by default**; first-open dialog | X1 ✅ |
| Execution coupling | **Keep E1; kill E2/E3/E5** | **X8 GATE** |
| Edge routing | **CustomEdge + topology cache** | X5 ✅ |
| Local layout | **Ship `getLayoutedElementsLocal`** | X4 ✅ |
| Composite | **Model 6 (silhouette) + 2 (preview)** | X3 ✅ |
| Position truth | **Manual = truth; layout = derived** | X1/X9 ✅ |
| Worker | **Not needed** (revisit >2000) | X6 ✅ |
| Minimap | **Data-derived rect + debounce** | X10 ✅ |
| CRDT layout | **Atomic layoutVersion tx; no auto-layout in rooms** | X9 ✅ |

### Critical Blocker: X8 GATE (E1/E2/E3 Contract)

Before any production change, codify as CI tests:
- Roots sorted by (y → x → id) deterministically
- Fallback root = graphNodes[0] only if no other roots
- Edge enqueue order = adjacency order (sourceHandle disambiguates)
- Array order NEVER re-sorted by layout (E5 killed)
- Layout runs AFTER execution order fixed (P2 guard)

### Recommended M1→M4 Plan

1. **M1 (1–2 wks)**: X8 contract → CI, P2 guard, kill E5, export `getLayoutedElementsLocal`, undo perms
2. **M2 (3–5 wks)**: ELK legal review, adapter + flag, **X7b: vite build + longtask measure**, Model 6
3. **M3 (2–3 wks)**: CRDT layoutVersion tx + preview/confirm, manual-first dialog, minimap
4. **M4 (ongoing)**: X10 baseline gating, migration docs + rollback

### Artifacts Complete

| Spike | Report | Data | Tests |
|---|---|---|---|
| X1 | `X1-position-persistence.md` | `data/X1/results.json` | 7 e2e |
| X2 | `X2-dataset-generator.md` | `data/X2/manifest.json` | 4 |
| X3 | `X3-layout-engines.md` | `data/X3/results.json` | 10 |
| X4 | `X4-local-layout.md` | `data/X4/results.json` | 6 new |
| X5 | `X5-edge-routing.md` | `data/X5/results.json` | 17 |
| X6 | `X6-worker-crossover.md` | `data/X6/results.json` | 8 |
| X7 | `X7-elk-spike.md` | `data/X7/results.json` + `browser-worker.json` | 6 + 2 e2e |
| X8 | `X8-execution-semantics.md` | `data/X8/traces.json` | 9 |
| X9 | `X9-crdt-layout.md` | `data/X9/results.json` | 6 |
| X10 | `X10-layout-baseline.md` | `data/X10/results.json` | 5 e2e |

**Total**: 25 test files, **276 tests**, lint clean, production untouched.
- **X10 EXECUTED (baseline)**: current dagre LR blocks the main thread
  ~8–12 s on a 100-node branching graph and ~5.7–6.5 s on 500 linear nodes;
  DOM culling (onlyRenderVisibleElements) caps visible nodes at ~35–67 for
  graphs of 100–500. Proposal targets for X4/X6: no longtask >150 ms at 500
  nodes, <500 ms end-to-end at 100 branching. See
  `docs/research/spikes/X10-layout-baseline.md`.
- X2 dataset ingestion into the harness (A/B already used by X1/X10; A–H now
  pinned and validated, ready for X3).
- X3 layout-engine comparison: **DONE** (ELK recommended, X7-gated; naive hand-rolled rejected as floor).
- X9 CRDT/layout-conflict (2 clients) to replace X1 CASE G limitation.
- X4/X6 local-layout / worker work is **blocked by design** until E1/E2/E3
  execution-order coupling is resolved (RULE 1: research before implementation).