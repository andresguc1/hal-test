# X7 — ELK integration spike

Status: **COMPLETE** — evidence in `data/X7/results.json` (Node suite, 6 tests, 6/6)
and `data/X7/browser-worker.json` (Playwright, 2/2).

**Freeze point:** all evidence gathered against **elkjs v0.12.0**
(license `EPL-2.0 OR GPL-3.0-or-later`), harness = vitest 4.1.0 + Playwright +
vite dev server. Production code untouched (RULE 1).

## Claims tested (each → evidence)

| Claim | Verdict | Evidence |
|---|---|---|
| Bundle cost is manageable | PASS with caveat | `elk.bundled.js` 1,609,707 B raw / **471,876 B gzip**; `elk-worker.min.js` 1,595,334 / 466,809 gzip. If loaded only inside a worker, the main bundle gains ~0. If loaded in main bundle: **+470 KB gzip**. |
| License is clear | **REQUIRES LEGAL REVIEW** | `EPL-2.0 OR GPL-3.0-or-later` — Eclipse Public License 2.0 (weak copyleft) or GPL-3. NOT an MIT/BSD-style library. Must be recorded in an ADR before production adoption. |
| Deterministic API | PASS | 3 identical runs identical; explicit-option run identical (hash `58aa8582`). |
| Compound (composite/subflow) nodes | PASS | Nested parent lays out as a cluster (children coords relative to parent box 424×64). |
| Edge routing (ORTHOGONAL) | PASS | All 39 edges in B@40 return `sections`; 19 with `bendPoints`. |
| **Incremental layout** | **NOT SUPPORTED — real finding** | `elk.layered.incremental=true` + feeding previous positions is ACCEPTED but output identical to base → positions IGNORED. No `move()` / `delete()` ops. X4 must implement manual delta (subgraph re-layout/restart-based), not rely on ELK. |
| Runs off main thread | **TOOLCHAIN-DEPENDENT — real finding** | Node `worker_threads`: median 1,232 ms B@100, byte-identical to main thread. **Browser via vite dev: layout ran INLINE on main thread** (longtasks 75+256 ms and 67+684 ms ≈ full duration; geometry still identical). ELK auto-spawn does NOT survive vite's dep pre-bundling; own worker verified only in Node so far. |

## Key finding: off-threading is not automatic under the toolchain

- `optimizeDeps` rewrites elk-api's worker spawn to
  `require2("./elk-worker.min.js").Worker`; that binding is `undefined` inside a
  nested module `Worker` → `_Worker is not a constructor` (observed). In the
  main-thread prebundled form the layout therefore runs **synchronously** on the
  context that calls it — 1–2.5 s longtasks, which is exactly the X10 problem
  dagre has. Under our tooling, adopting ELK without an own worker seam buys NO
  UI responsiveness.
- The reliable off-thread route is **the app's own worker (M2 seam)** importing
  the GWT build; already parity-proven in Node `worker_threads` (identical
  geometry) and it keeps the +470 KB gzip off the main bundle.

## Gate results for the adopt-ELK recommendation (from X3)

- Geometry/determinism/compound/router: **PASS** → ELK is the right engine
  behind M1/M2.
- Off-thread: **Do NOT ship ELK auto-spawn reliance.** Gate X7b (production
  build check): run `vite build`, serve the bundle, re-measure longtasks +
  geometry; if still inline, ship the own-worker seam (M2) and re-run the same
  browser assert on `browser-worker.json` inputs.
- Incremental: **no ELK incremental** → keep in the X4 delta plan as manual.
- License: legal review for EPL-2.0 / GPL-3 choice before production.

## Artifacts

- `src/hooks/flow/elkIntegration.test.js` — 6 Node tests (21st test file; whole
  unit suite **220 passed**).
- `e2e/x7-elk-worker.spec.js` + `e2e/elk-inpage.js` + `e2e/empty.html` — browser
  geometry + longtask measurement (2/2 green).
- `e2e/elkWorker.js` — nested-own-worker attempt; documents the
  `_Worker is not a constructor` failure. Kept as the negative result.
- `data/X7/results.json`, `data/X7/browser-worker.json`.

## Honesty (RULE 26)

- Browser numbers come from this machine/browser (Chromium) on vite dev; cache
  warm vs cold changes them (first run: layoutMs 1,018/2,447; re-run: 269/699
  after dep optimizer idle work) — treat magnitudes, not absolutes.
- Node `worker_threads` timing is median of 3 on the dev box.
- elkjs version pinned; newer ELK (0.13+) may add incremental primitives —
  re-run test 4 on upgrade.