# X8 — Execution semantics vs. visual position (HARD GATE)

> Status: **EXECUTED (GREEN) — HARD GATE: position ABANDONED, array-coupling CONFIRMED**
> Evidence class: **OBSERVED RUNTIME (simulator) + CONFIRMED BY CODE**
> Date: 2026-09-20/21 · Branch: `spike/canvas-layout-research` · HEAD: `0553d26+`

## Question

> Does the agent's *execution* semantics depend on *visual* position order, node
> array order, or edge array order? (Correctness gate that any layout engine
> change must not break.)

## Method (RULE 8)

- Faithful order-only simulator of `executeGraph` (orderStartNodes, guard ONCE,
  matchesBranchPath, queue, winner enqueue) with a per-line site-map to the real
  implementation. Deterministic seeding (mulberry32); same frozen fixtures,
  permuted at runtime.
- Fixed/permanent graphs: multiple-roots, cyclic, diamond, parallel,
  nested-branch (branch winner probed on `true`/`false` paths).
- 10 frozen graph *shapes* + 8 dataset graphs → 23 trace records in
  `docs/research/spikes/data/X8/traces.json`.
- Suite: `apps/frontend/src/hooks/flow/executionSemantics.test.js` (9 tests).
- Command: `pnpm vitest run src/hooks/flow/executionSemantics.test.js --reporter=verbose`

## Results (traces keyed in `traces.json`)

| Perturbation | multiple-roots | cyclic | diamond | parallel | nested-branch |
|---|---|---|---|---|---|
| base | top,bottom,tail | a,b,c | root,left,right,sink | root,p1..p3,aggr | root,cond,t1,t2,sink |
| flip/reorder **positions** | **bottom,top,tail** | (n/a) | (n/a) | (n/a) | **unchanged** |
| reorder **nodes array** | (n/a) | **c,a,b** | (n/a) | (n/a) | **unchanged** |
| reverse **edges array** | (n/a) | (n/a) | **root,right,left,sink** | **root,p3,p2,p1,aggr** | **unchanged** |

- Full suite **9/9 passed**; whole frontend suite **200/200 passed** (18 files).
- Determinism: all 10 shapes produce bit-identical traces across 3 runs
  (`hash … identical: true`).
- Dataset sweep (`positionSensitivity` / `arraySensitivity`):
  - position-sensitive: **merge-heavy** (4-root tie), **pathological** (foldback
    cycle: `base=[j7,…,j6]` vs permuted `[j7,j6,j4,…]`).
  - array-sensitive: branching, deepBranching, diamond (tie between
    lo/hi branches in edges order).
  - neutral (no permutation changed output): linear, realistic, composite,
    branching/merge with single winner.

## Interpretation (RULE 2 — do not move what is not semantically neutral)

1. **E1 POSITION COUPLING CONFIRMED** — `orderStartNodes`
   (`useFlowExecution.js:39-55`) seeds the queue ordered by `position.y → x → id`.
   Multiple roots with independent y (e.g. two nested composites) will execute
   in a *visual* order. Any layout engine that moves a start root's y changes
   execution order of a multi-root graph. → must be eliminated/replaced by an
   explicit, intent-preserving order.
2. **E2/E3 ARRAY COUPLING CONFIRMED** — the node array order (cyclic fallback
   `graphNodes[0]`, `:831-834`) and edge-array order (winner enqueue
   `:1237,1315-1318`) change outcomes independent of position. → deterministic
   only if these arrays are deterministically ordered (currently: layout sort
   `layoutUtils.js:210-221` + CRDT id-sort `useCRDTNodes.js:100`).
3. **Branch selection is robust (E4)** — `matchesBranchPath(sourceHandle)`
   (`flowUtils.js:507`) picks the correct branch under position AND array
   permutation; **branch bodies then run in sourceHandle order (intentional)**.

## Verdict

```
HARD GATE: PASSED for branch correctness — FAILED for order determinism under
layout changes (position order E1 confirmed; array order E2/E3 confirmed).
Any layout-modernization must bake in an explicit execution order (e.g. a
topological+sibling-index key) BEFORE changing positions, then re-run this suite.
```

## Evidence artifacts

- `docs/research/spikes/data/X8/traces.json` (23 records, reproducible, seeded).
- `apps/frontend/src/hooks/flow/executionSemantics.test.js` (site-mapped simulator).

## Relationship to gates

- Feeds **GATE 1** (position semantics preserved — answer: NO today, E1) and
  **GATE 8** (collaboration/semantics — CRDT id-sort reintroduces array order
  on remote events, P7).