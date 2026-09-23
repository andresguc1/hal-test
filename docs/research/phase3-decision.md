# Phase 3 — Architecture Decision

**Date**: 2026-09-21
**Branch**: `spike/canvas-layout-research`
**Status**: **PROCEED with M1→M4 plan**

---

## Executive Summary

All 10 experimental spikes (X1–X10) complete. Evidence collected, lint clean, 276 unit tests passing, production code untouched.

**Decision**: Proceed with **M1→M4 implementation plan** (Phase 4), gated by:

1. **X8 GATE** — Execution-semantics contract (E1/E2/E3) codified as tests
2. **X7b GATE** — ELK production build verification (`vite build` + longtask measurement)

---

## Exit Criteria Answers

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | dagre sufficient? | **NO** | X3: ELK 4–7× less vertical space, 2–9× faster, same determinism |
| 2 | ELK genuinely better? | **YES** | X3/X7: A–H metrics; 471KB gzip; compound nodes supported |
| 3 | Edge routing separated? | **NO NEED** | X5: CustomEdge + topology cache (98% hit) adequate |
| 4 | Worker benefit? | **NO** | X6: no crossover ≤1000; ser+compute > in-thread |
| 5 | Incremental/local layout? | **YES (local)** | X4: `getLayoutedElementsLocal` implemented; incremental = manual delta |
| 6 | Manual-first policy? | **YES** | X1: P2 confirmed; fixture 0/5 visible |
| 7 | Arrange Selection viable? | **YES** | X4: 6 tests, deterministic, frozen neighbors byte-identical |
| 8 | Composite model? | **Model 6 + 2** | X3: pure-render, reversible |
| 9 | Kill crossings w/o semantics? | **Layout ≠ execution** | X8: E1/E2/E3 pinned; X4 preserves order |
| 10 | Preserve positions policy | **Manual = truth; layout = derived** | X1 + X9: layoutVersion retraction; no silent auto-layout |
| 11 | Layout⇒execution decoupling | **GATE — E1/E2/E3 contract** | X8: 9/9 tests pin E1/E2/E3 |
| 12 | Collaboration strategy | **Atomic layoutVersion tx** | X9: 320× op amp; drag clobbers; resolver drops stale |
| 13 | Practical node limit | **~500 dagre / ~2000+ ELK** | X10: dagre 12s (100 branch); ELK 233ms (500) |
| 14 | Migration cost | **M1: adapter + P2 guard + E5/E2 kill** | X2–X7 evidence |
| 15 | Quick wins | **P2 guard, E5 kill, undo perms** | X1/X8 |
| 16 | Major arch changes | **Engine swap, CRDT transactions** | Worker not needed; routing not separated |

---

## Decision Matrix Resolution

| Area | Decision | Gate |
|---|---|---|
| **Engine** | **ELK behind adapter seam (M1→M2)** | X3/X7 ✅; blocked by E1/E2/E3 + license + X7b |
| **Auto-layout policy** | **Off by default**; first-open dialog; only when no persisted positions | X1 ✅ |
| **Execution coupling** | **Keep E1 as contract; kill E2/E3/E5** (array order preserved) | **X8 GATE** |
| **Edge routing** | **Keep CustomEdge + topology cache (X5)** | X5 ✅ |
| **Local layout** | **Ship `getLayoutedElementsLocal`** (X4) | X4 ✅ |
| **Composite visual** | **Model 6 (silhouette) + Model 2 (preview)** | X3 ✅ |
| **Position truth** | **Manual = source of truth; layout = derived undoable** | X1/X9 ✅ |
| **Worker** | **Not needed** (X6); revisit if N>2000 or ELK | X6 ✅ |
| **Minimap** | **Data-derived rect + debounce** | X10 ✅ |
| **CRDT layout** | **Atomic layoutVersion tx; no auto-layout in rooms** | X9 ✅ |

---

## Critical Blocker: E1/E2/E3 Contract (X8 GATE)

**Must be resolved before any production change:**

```javascript
// Contract tests that MUST pass before M1:
// 1. Roots sorted by (y → x → id) deterministically
// 2. Fallback root = graphNodes[0] only if no other roots
// 3. Edge enqueue order = adjacency order (sourceHandle disambiguates branches)
// 4. Array order of nodes/edges NEVER re-sorted by layout (E5 killed)
// 5. Layout runs AFTER execution order is fixed (P2 guard)
```

These are already pinned by `executionSemantics.test.js` (9/9 tests). Must be promoted to "contract test" status in CI.

---

## Recommended Implementation Plan (Phase 4)

### M1 — Foundation (1–2 weeks)
- [ ] Promote X8 contract tests to CI gate
- [ ] Add P2 guard: `if (hasPersistedPositions()) skipAutoLayout()`
- [ ] Kill E5: remove array re-sort in `layoutUtils` (preserve input order)
- [ ] Export `getLayoutedElementsLocal` from `layoutUtils`
- [ ] Add undo permission for layout ops

### M2 — ELK Integration (3–5 weeks)
- [ ] Legal review: EPL-2.0 / GPL-3 license compatibility
- [ ] ELK adapter behind feature flag
- [ ] **X7b**: `vite build` + serve + measure longtasks (must be 0)
- [ ] Composite silhouette renderer (Model 6)

### M3 — CRDT & UX (2–3 weeks)
- [ ] CRDT `layoutVersion` atomic transaction + preview/confirm UX
- [ ] Manual-first policy + first-open dialog
- [ ] Minimap: data-derived rects + debounce

### M4 — Ongoing
- [ ] X10 baseline gating for every change
- [ ] Migration docs + rollback plan

---

## Artifacts Reference

All spikes complete with evidence in `docs/research/spikes/`:

| Spike | Report | Data | Tests |
|---|---|---|---|
| X1 | `X1-position-persistence.md` | `data/X1/results.json` | `e2e/x1-position-persistence.spec.js` (7) |
| X2 | `X2-dataset-generator.md` | `data/X2/manifest.json` | `fixtureGenerator.test.js` (4) |
| X3 | `X3-layout-engines.md` | `data/X3/results.json` | `layoutEngines.test.js` (10) |
| X4 | `X4-local-layout.md` | `data/X4/results.json` | `layoutUtils.test.js` (6 new) |
| X5 | `X5-edge-routing.md` | `data/X5/results.json` | `edgeRouting.test.js` (17) |
| X6 | `X6-worker-crossover.md` | `data/X6/results.json` | `workerCrossover.test.js` (8) |
| X7 | `X7-elk-spike.md` | `data/X7/results.json` + `browser-worker.json` | `elkIntegration.test.js` (6) + `e2e/x7-elk-worker.spec.js` (2) |
| X8 | `X8-execution-semantics.md` | `data/X8/traces.json` | `executionSemantics.test.js` (9) |
| X9 | `X9-crdt-layout.md` | `data/X9/results.json` | `crdtConcurrency.test.js` (6) |
| X10 | `X10-layout-baseline.md` | `data/X10/results.json` | `e2e/x10-layout-baseline.spec.js` (5) |

---

## Honesty Statement (RULE 26)

- **No production code changed** — all spikes on separate branches, reversible
- **ELK license risk**: EPL-2.0 / GPL-3 — legal sign-off required before prod
- **X7b unverified**: ELK off-thread claim only tested in Node `worker_threads`; browser prod build must be measured
- **Incremental layout**: ELK has no true incremental API; manual delta approach needed
- **Worker crossover**: Only tested up to N=1000; if graph grows beyond 2000, re-evaluate
- **CRDT strategy**: Preview/confirm UX not yet designed; requires product input

---

## Sign-off

**Phase 3 Decision**: PROCEED with M1→M4 plan as outlined.

**Gates**: 
- X8 contract tests promoted to CI (immediate)
- X7b ELK prod build verification (before M2)

**No subjective ratings** — all decisions traceable to spike evidence above.

---

*Generated from `spike/canvas-layout-research` branch. All spikes complete. Production code untouched.*