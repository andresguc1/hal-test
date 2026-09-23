# X10 — Performance baseline: current Magic Organizer (dagre, rankdir LR)

> Status: **EXECUTED — baseline captured (5/5 trials, 2 headline cases repeated)**
> Evidence class: **MEASURED EXPERIMENTALLY + OBSERVED RUNTIME**
> Date: 2026-09-21 · Branch: `spike/canvas-layout-research` · Same stack (vite :5173, backend :2001)

## Question

> What does a layout pass cost today, end-to-end and engine-only, and what must
> any alternative engine (X4/X6) beat? Where does time actually go (main-thread
> blocking vs render)?

## Method (RULE 8)

- Seeded frozen fixtures (`test/fixtures/layout/export.js`): dataset A linear and
  dataset B branching at 100/250/500 nodes. Same seeds every run:
  linear `42_4242/…43/…44`, branching `777_001/…002`.
- Real app: project + flow created via backend API, browser opened onto it via
  Playwright chromium (1280×720 Desktop Chrome). Every load runs the automatic
  `onLayout("LR")` (mount effect; App.jsx:285-292) **and** the manual
  Magic-Organize button is clicked afterwards.
- Timings (page-local clock + `PerformanceObserver("longtask")`):
  - `loadMs`   — document start (`addInitScript`) → first 350 ms window where
    visible node transforms stop changing (includes bundle, render, autolayout).
  - `layoutMs` — Magic Organize click → same settle window (engine + state +
    DOM write; no fitView animation on manual click).
  - `visibleNodes` — `.react-flow__node` count (onlyRenderVisibleElements culls).
- Command: `pnpm exec playwright test e2e/x10-layout-baseline.spec.js --workers=1`
- Artifacts: `docs/research/spikes/data/X10/results.json`,
  `apps/frontend/e2e/x10-layout-baseline.spec.js`.

## Results

| Trial | nodes | run | loadMs | layoutMs | main-thread blocked (layout, MS) | longtasks during layout | visibleNodes (DOM) |
|---|---|---:|---:|---:|---:|---:|---:|
| linear-100 | 100 | 1 | 17 380 | **723** | 259 | 1 | 36 |
| linear-250 | 250 | 1 | 40 700 | **1 051** | 570 | 1 | 35 |
| linear-500 | 500 | 1 | 53 075 | **5 668** | 4 920 | 1 | 35 |
| linear-500 | 500 | 2 | 80 892 | **6 544** | 6 082 | 4 | — |
| branching-100 | 100 | 1 | 45 308 | **11 768** | 11 117 | 11 | 67 |
| branching-100 | 100 | 2 | 35 256 | **7 939** | 7 670 | 7 | — |
| branching-250 | 250 | 1 | 69 892 | **13 647** | 12 534 | 8 | 65 |

## Interpretation

1. **Layout clicks block the main thread for seconds.** A single Magic Organize
   on a 100-node branching graph produces **~8–12 s of longtasks** (up to a
   4.8 s single task on linear-500). This is the dominant cost: React + dagre +
   edge/path recomputation, all on the UI thread.
2. **Branching is ~10× worse than linear at the same size** (100 branching ≈
   12 s vs 100 linear ≈ 0.7 s; 250 branching ≈ 14 s). dagre's solver cost
   explodes with rank collisions / multi-sourceHandle trees (dataset B)).
3. **`loadMs` (bootstrap→settle) is large and dominated by culling + init**
   (17–80 s). Beyond the fixed app payload, this includes the un-avoided
   automatic layout on every mount and a debounced full autosave; not a pure
   engine number. Engine-only signal is `layoutMs`/longtasks.
4. **Culling limits what users ever see**: with `onlyRenderVisibleElements`
   the DOM holds only 35–67 of 100–500 nodes (LR strip in a 1280 viewport);
   "big" graphs are effectively invisible past ~50 visible nodes while paying
   full layout cost for all of them.

## Verdict / baseline to beat

```
GEOMETRY (matches question X8-adjacent): current engine is unusable beyond
~100 branching nodes / ~500 linear nodes for interactive layout.
Targets for X4/X6 proposals (must be proven, not assumed):
  - 500-node topologies: no longtask > 150 ms, wall layout < 300 ms.
  - 100-node branching: < 500 ms end-to-end layout (vs current ~8–12 s).
  - render: work within culling; layout cost must not scale with off-screen nodes.
```

## Caveats (RULE 26)

- Dev machine, warm chromium, both servers reused; `layoutMs` includes a ~350 ms
  settle guard; variance between runs is visible (linear-500 loadMs 53→81 s),
  so compare **orders of magnitude**, not exact ms. Repeat runs confirm the
  headline: branching-100 7.9–11.8 s, linear-500 5.7–6.5 s.
- `loadMs` is end-to-end app-surface latency, not a pure engine cost (includes
  bundle, autosave, app init).
- Single machine; results are relative, useful for gate decisions and as the
  target-baseline for the engine comparison experiment (X3).

## Feed into gates

- GATE 3 (performance feasibility of local vs cloud layout): local dagre is a
  main-thread blocker today for realistic intermediate graphs → supports the
  web-worker path (X6) and/or incremental layout (X4) with the targets above.
- Baseline numbers to be quoted in `docs/research/spikes/X3-layout-engines.md`
  when comparing dagre (current) vs alternatives.