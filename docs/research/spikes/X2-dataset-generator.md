# X2 — Dataset generator: validity, coverage, reproducibility audit

> Status: **EXECUTED — generator locked (hashes pinned), 4/4 validation tests green**
> Evidence class: **OBSERVED RUNTIME (own suite) + MEASURED (determinism ×2 builds)**
> Date: 2026-09-21 · Branch: `spike/canvas-layout-research`

## Question

> Is the seeded graph generator (`test/fixtures/layout/export.js`) a trustworthy,
> reproducible source of research fixtures — deterministic, structurally valid,
> and covering the graph diversity required by X1/X3/X8/X10?

## Method

- New suite `apps/frontend/src/hooks/flow/fixtureGenerator.test.js` (4 tests):
  1. **A–H determinism + structural validity + hash pins** — every dataset is
     built twice from the same seed and asserted byte-identical; every fixture
     checked (duplicate ids, dangling edges, position presence, type/data
     consistency, 16-hex hash); hash asserted against **pinned** values.
  2. **Meta correctness + diversity gate** — `analyze()` counts cross-checked
     (chain symmetry, edge/node invariants) and the coverage requirements
     asserted: multi-root (C, H), a real cycle (H), subflow/composite (F),
     branch/sourceHandle nodes (G), linear maxDegree 1 (A).
  3. **X8 shapes** — all 10 present, valid, hash-pinned.
  4. **`DATASET_BUILDERS` map complete** (A–H).
- Manifest: `docs/research/spikes/data/X2/manifest.json` (all 8 datasets × meta
  + all 10 shape hashes; regenerated on each run).
- Command: `pnpm vitest run src/hooks/flow/fixtureGenerator.test.js`
  · Whole frontend suite still **19 files / 204 tests passed** (lint clean).

## Pinned fixtures (default sizes, seed 1 for A–H)

| Dataset | label | size param | actual nodes | edges | hash |
|---|---|---|---|---|---|
| A | linear | 50 | 50 | 49 | `29f90906517a48a7` |
| B | branching | 50 | 50 | 49 | `ca1427c4e5cf19c7` |
| C | merge-heavy | 50 | 50 | 49 | `1ef1d31aa58b903e` |
| D | deep-branching | 50 | **100** | 99 | `4ba157df9781a969` |
| E | diamond | 10 | **32** | 32 | `900ae61dcb60ad99` |
| F | composite | 6 | 7 | 6 | `0b7ef37668535d35` |
| G | realistic | 50 | **52** | 98 | `45c7f20eab9927d7` |
| H | pathological | 50 | 50 | 26 | `cb279011d3bc35e7` |

X8 shapes (10): all pinned, e.g. multiple-roots `a412c62a36fa7081`, cyclic
`72b3b95651567a80`, nested-branch `23c05e1d260c085f`, mixed `eef9b49d8f11e698`
(see manifest for the full set).

## Findings (documented so harnesses don't mis-size)

1. **Deterministic** — same seed ⇒ byte-identical fixture in all 8 datasets and
   all 10 shapes (multi-build assertion in-suite; independent 3-seed sweep from
   the CLI also identical).
2. **`size` means different things per dataset.** D doubles (spine + leaf ⇒
   `2×`), E outputs `3·count+2` nodes, G outputs `size+2`. Harnesses must read
   `meta.nodeCount`, never the size param (X1/X10 already do).
3. **Coverage confirmed** — multi-root (C: 4, H: 25 island roots), a genuine
   foldback cycle (H: 1, cycleCount matches DFS), composite/subflows (F: 6
   component nodes + subflow graphs), branch/sourceHandle edges (G/H), pure
   chain (A). Enough diversity for the engine comparison (X3).
4. **Hash locks reproducibility** — the pinned table is the contract: any
   generator change must be intentional and bump pins (RULE 8).

## Verdict

```
X2 CONFIRMED as a trustworthy fixture factory. Determinism, structural validity,
diversity coverage, and hash-pinning are now enforced by tests. All subsequent
experiments (X1/X3/X8/X10, and later X4/X6/X9) can cite a fixture hash.
```

## Artifacts

- `apps/frontend/src/hooks/flow/fixtureGenerator.test.js` (4 tests, green + lint-clean)
- `apps/frontend/test/fixtures/layout/export.js` (the generator; unchanged this step)
- `docs/research/spikes/data/X2/manifest.json` (coverage + pins)