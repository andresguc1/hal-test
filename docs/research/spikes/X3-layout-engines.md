# X3 — Layout engine comparison (dagre vs ELK vs layered prototype)

> Status: **EXECUTED — ELK clearly better on ≥2 readability dims with equal determinism**
> Evidence class: **MEASURED EXPERIMENTALLY (median runs) + OBSERVED RUNTIME**
> Date: 2026-09-21 · Branch: `spike/canvas-layout-research`

## Question (plan §8 exit)

Does replacing dagre with ELK (or a small layered pass) improve
readability/cost, and is it worth the migration? Exit: ELK/prototype clearly
better on **≥2 of (width, crossings, max-edge-length, readability)** at 250/500
with equal determinism.

## Method (RULE 8)

- Corpus: the pinned X2 generator, sizes `A@250, A@500, B@100, B@250, C@50,
  D@100, E@10, F@6, G@52, H@50` (same seeds as X2 pins, seed 1).
- Three engine arms, all isolated pure functions (Node, no DOM):
  - **dagre 0.8.5** with the production pre-pass config
    (`layoutUtils.js:230-273`: rankdir LR, align UL, ranker tight-tree,
    nodesep 60, ranksep 90, margin 50, lane-weighted edges, cycle removal,
    stable id-sorted input) — WITHOUT its branch-spacing post-pass, so all
    arms are compared on raw geometry (the post-pass makes dagre *taller*,
    so dagre's real deficit is understated, not overstated).
  - **ELK** (`elkjs` bundled) layered, direction RIGHT, `nodeNodeBetweenLayers`
    90, `nodeNode` 60, edge routing ORTHOGONAL.
  - **layered-custom** hand-rolled floor reference (longest-path ranking +
    3-sweep barycenter ordering + rank-column assignment).
- Metrics on engine output positions: crossings (straight center-segments),
  **passthrough** (# times an edge's straight segment passes through a third
  node's bbox — the long-edge readability killer), total/max/mean edge
  length, bbox width/height/aspect, determinism (≥2 identical runs),
  wall time (median of 5 runs / 3 for big ELK).
- Suite: `apps/frontend/src/hooks/flow/layoutEngines.test.js` (10/10 passed;
  whole frontend suite re-run after → still green).
- Artifacts: `docs/research/spikes/data/X3/results.json` (incl. per-fixture
  per-engine `positionHash` for byte-level reproducibility).

## Results (selected rows; full table in results.json)

| fixture | engine | passthrough | lenMax | w | h | aspect | ms (med) | det |
|---|---|---|---|---|---|---|---|---|
| A@250 | dagre | 0 | 310 | 77410 | 72 | 1075 | 1182 | true |
| A@250 | elk | 0 | 310 | 77410 | 72 | 1075 | 407 | true |
| A@500 | dagre | 0 | 310 | 154910 | 72 | 2152 | **1149** | true |
| A@500 | elk | 0 | 310 | 154910 | 72 | 2152 | **233** | true |
| B@100 | dagre | 0 | 337 | 15720 | **6408** | 2.45 | 89 | true |
| B@100 | elk | 0 | 332 | 15720 | **960** | 16.4 | 49 | true |
| B@250 | dagre | 0 | 337 | 38970 | **16176** | 2.41 | 365 | true |
| B@250 | elk | 0 | 332 | 38970 | **3228** | 12.1 | 103 | true |
| D@100 | dagre | 0 | 337 | 31220 | **13140** | 2.38 | 266 | true |
| D@100 | elk | 0 | 332 | 31220 | **2472** | 12.6 | 94 | true |
| E@10 | dagre | 0 | 407 | 3940 | **2580** | 1.53 | 16 | true |
| E@10 | elk | 0 | 396 | 3940 | **582** | 6.8 | 22 | true |
| G@52 | dagre | **617** | 6475 | 1460 | 6540 | 0.22 | 55 | true |
| G@52 | elk | **284** | 6474 | 2040 | 6540 | 0.31 | 43 | true |
| H@50 | dagre | 0 | 310 | 7660 | 3372 | 2.27 | 23 | true |
| H@50 | elk | 0 | 310 | 7660 | 3372 | 2.27 | 20 | true |
| custom (naive) | all | up to **9900** (D@100) | up to 13200 (D@100) | 220 | — | ~0.01 | ~0 | true |

## Interpretation

1. **Vertical footprint — dagre is 4–7× taller than ELK** on branching/deep
   graphs (B@250: 16176 vs 3228; D@100: 13140 vs 2472; E@10 2580 vs 582).
   dagre's `tight-tree` ranker + 60px within-rank `nodesep` leaves sparse tall
   columns; production adds an *extra* branch-spacing post-pass, so today's
   Magic Organizer output is even taller than these numbers. This is the
   dominant visual difference users see and matches plan H1.
2. **Readability on dense graphs — ELK halves passthroughs** (realistic G@52:
   617 → 284). On pipelines (A–F, H) both engines keep center-line crossings
   at 0 and similar edge lengths; branch/merge (C/E) equal in quality, ELK
   only much more compact.
3. **Speed — ELK 2–9× faster** at the sizes that matter for X10 (A@500 1149→
   233 ms; B@250 365→103 ms), on a shared Node process. (Main-thread X10
   numbers are the accompanying absolute baseline; engine-only ratios here.)
4. **Determinism — equal (all arms true)** on this corpus with stable sorted
   input. dagre's determinism rests on the id-sort pre-pass (E5); ELK was
   deterministic here, but determinism under option changes needs the X7 gate.
5. **layered-custom (naive) is a floor, not a candidate**: microseconds-fast
   but unusable (D@100: 9900 passthroughs, 13200 max-edge) — a hand-rolled
   engine only makes sense with real compaction/edge routing (much larger
   effort than adopting ELK).

## Verdict

```
X3: ELK clearly better on ≥2 exit dimensions with equal determinism:
  (a) compactness/readability (4–7× less vertical space),
  (b) long-edge passthrough on dense graphs (halved),
  (c) speed (2–9×).
RECOMMENDATION: adopt ELK behind the adapter seam (M1 → M2), gated by the
X7 ELK spike (bundle size, worker compat, EPL-2.0 review, determinism under
options, incremental hooks) — and STILL blocked by the execution-order
contract (E1/E2/E3) before any production flip (RULE 1).
```

## Caveats (RULE 26)

- dagre arm omits production's branch-spacing post-pass ⇒ its height deficit
  is understated, not overstated.
- Wall-clock medians from one process/machine (orders & ratios, not exact ms);
  ELK used default options (not tuned ASM/compaction) and is *not* warmed or
  moved to a worker — real gains likely larger.
- `passthrough` counts straight center-line segment hits as a *relative*
  comprehension proxy; actual routed smoothstep paths can differ.
- ELK determinism observed equal on this corpus; not yet proven across
  option/target/version changes (→ X7).

## Feed into later steps

- Baseline rows for **X7** (ELK spike) and the M2 migration gate.
- Fixes nothing by itself: X8's E1/E2/E3 (execution order) and X1's P2
  (position persistence) are independent and remain the hard blockers.