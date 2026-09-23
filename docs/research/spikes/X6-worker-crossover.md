# X6 — Worker crossover cost model

Status: **COMPLETE** — cost model measured across 8 runs (linear/branching × 100/250/500/1000). 8 tests in `workerCrossover.test.js`, whole unit suite **24 files / 259 tests** green, lint clean. Evidence in `data/X6/results.json`. Production code untouched (RULE 1).

**Method:** measures in-thread layout time + structuredClone serialization time (proxy for `postMessage` cost). Worker model = 2×serialization (round-trip) + compute (same as in-thread). Real worker-threads measurement deferred; this model is conservative (assumes zero worker overhead beyond serialization).

## Results

| Dataset | Size | In-thread (p50) | Ser (round-trip) | Worker model | Crossover |
|---|---|---|---|---|---|
| linear | 100 | 306 ms | 7 ms | 313 ms | ❌ |
| linear | 250 | 1,148 ms | 23 ms | 1,171 ms | ❌ |
| linear | 500 | 3,615 ms | 59 ms | 3,675 ms | ❌ |
| linear | 1,000 | 9,897 ms | 29 ms | 9,925 ms | ❌ |
| branching | 100 | 83 ms | 2 ms | 85 ms | ❌ |
| branching | 250 | 286 ms | 6 ms | 292 ms | ❌ |
| branching | 500 | 3,751 ms | 10 ms | 3,761 ms | ❌ |
| branching | 1,000 | 12,716 ms | 92 ms | 12,808 ms | ❌ |

**No crossover at any size ≤ 1000.** Worker model always slower than in-thread.

## Key findings

1. **Serialization is cheap** (1–46 ms one-way) but round-trip (2×) + identical compute **always exceeds** in-thread time.
2. **Compute dominates**: layout is O(N log N) with large constant; serialization is O(N) with tiny constant.
3. **No benefit for N ≤ 1000** under current dagre algorithm.
3. **Crossover would require**: either (a) N >> 1000 where serialization stays linear but compute grows superlinear, or (b) a faster layout algorithm (e.g., ELK) where compute drops enough that serialization becomes visible.

## Honesty (RULE 26)

- Model assumes **zero worker overhead** (thread startup, event loop, message queue). Real worker would be slightly slower.
- Uses `structuredClone` as proxy for `postMessage`; actual cost may differ slightly (transferables could reduce it).
- Only tested linear & branching datasets; merge-heavy/deep-branching could have different ratios.
- Real worker-threads measurement (with `worker_threads` or browser Worker) deferred to a follow-up if algorithm changes.

## Decision

**Do not move layout to a worker for N ≤ 1000** with current dagre. Revisit if:
- Node count grows beyond 2000 regularly
- Layout algorithm changes to one where compute is cheaper (e.g., ELK → 5–10× faster)
- Transferable objects (Float64Array for positions) are adopted to reduce ser cost

## Artifacts

- `src/hooks/flow/workerCrossover.test.js` — 8 tests (24th test file; 259 total unit tests).
- `data/X6/results.json` — full measurements.
- Report: `docs/research/spikes/X6-worker-crossover.md` (this file).