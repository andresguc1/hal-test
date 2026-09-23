# `spike/scraping-benchmark/` — Benchmark Harness (Design)

> **Status**: Design only (2026-09-23). No code exists yet. This describes the structure and responsibilities the harness will be built to in the benchmark phase. No production HalTest code is modified by this harness; it is additive and benchmark-only.
> **Plan of record**: `docs/research/web-scraping-benchmark-plan.md` (v2).
> **Branch**: `spike/web-scraping-feasibility`.

---

## Purpose

A deterministic, offline, commit-comparable benchmark that answers, with evidence, how far Web Scraping can go on the current HalTest architecture and at which measured point a workers/queue/data-pipeline architecture becomes necessary.

The harness measures the **real execution seam** (the same plugin-handler dispatch the MVP will use) with benchmark-only timing probes. It never re-implements the pipeline.

---

## Layout

```text
spike/scraping-benchmark/
├── README.md                     # this file
├── fixture-server/
│   ├── server.js                 # serves all fixtures; records request log
│   ├── generators/
│   │   ├── cards.js              # static product cards: 3–5 fields, optional-attr subset,
│   │   │                         #   heterogeneous per-field selectors, adversarial text
│   │   ├── pagination.js         # p pages × 1000 records, prev/next links
│   │   ├── infinite.js           # scroll-triggered append + dedupe scenario
│   │   ├── spa.js                # client-render loop w/ async delay; virtualized mode
│   │   ├── auth.js               # login form + storage-state probe
│   │   └── failure.js            # crash-at-k, field-absent-at-k, empty-at-k, throttle
│   └── manifest.json             # fixture registry: params, seeds, field schemas, ground truth
├── runner/
│   ├── run.js                    # one scenario = fixture server + mode + tier + outputs
│   ├── scenarios.js              # scenario definitions E0–E6 → params (tier, mechanism, mode)
│   └── cleanup.js                # run-dir + browser-process cleanup; guard vs leaked contexts
├── benchmarks/
│   ├── extraction.bench.js       # E1: mechanisms M1/M2/M3 × contexts C1–C5 × 15 dimensions
│   ├── serialization.bench.js    # E0/E2: S3 isolated measurement
│   ├── persistence.bench.js      # E0/E2: S4–S7 (output_data, SQLite, artifact, fs)
│   ├── concurrency.bench.js      # E3-A (extraction-only) and E3-B (full) at 1/3/5/8
│   ├── accumulation.bench.js     # E4: strategies A / B / C (100 pages × 1,000)
│   └── recovery.bench.js         # E5: crash, timeout, missing selector, empty page, retry
├── lib/
│   ├── stageTiming.js            # perf hooks around the 8 stage boundaries (S1–S8)
│   ├── metrics.js                # RSS/heap/CPU/disk/browser sampling + checkpoint timers
│   ├── probe.js                  # benchmark-only adapter at the real execution seam
│   │                             #   (plugin-handler dispatch); MUST not mutate production paths
│   └── verify.js                 # ground-truth diff (exact / regex / partial / failed)
├── collectors/
│   └── metricsCollector.js       # samples → per-run metrics object (raw + summary shape)
├── output/
│   ├── raw/                      # <runId>.jsonl + <runId>.summary.json per run
│   └── archive/                  # benchmark-results-<commit>.json, diff.md per commit pair
└── summary/
    └── generateSummary.js        # raw JSONL → tier×metric table + per-gate decision-record draft
```

---

## Component Responsibilities

| Component | Responsibility | Key constraints |
|---|---|---|
| `fixture-server/server.js` | Serves deterministic offline fixtures; logs requests | No external network; deterministic; manifest hash versioned |
| `generators/*` | Build fixtures with field richness, optionality, per-field selectors, adversarial text, pagination/infinite/auth/failure shapes | Ground truth derivable from generator params (for `verify.js`) |
| `lib/stageTiming.js` | Brackets the 8 stages (S1–S8 from the plan §2); labels any non-bracketed time `uncategorizedMs` | Must match the plan's stage definitions exactly |
| `lib/metrics.js` | Samples process/browser/disk at checkpoints; computes peaks and deltas | Same sampling policy across all runs |
| `lib/probe.js` | The single measurement seam into the real execution dispatch | Benchmark-only adapter; green backend suite proven before/after each session |
| `lib/verify.js` | Compares extracted records against generator ground truth; classifies `exact/regex/partial/failed` | Deterministic seeds |
| `collectors/metricsCollector.js` | Aggregates raw events into the summary JSON (plan §7.2) | Key names fixed (do not rename between commits) |
| `runner/run.js` | Orchestrates one scenario end-to-end; writes raw output | One run = one JSONL + one summary; clean title for cleanup guarantee |
| `runner/cleanup.js` | Guarantees no leaked browser processes/contexts/run-dirs after any outcome (incl. crash) | Used by E5 as the "next run starts clean" assertion base |
| `benchmarks/*` | Each experiment in the plan §3 | Emission point for decision-record inputs |
| `summary/generateSummary.js` | Produces tier×metric tables + per-commit archive + diff | Applies the noise band from plan §8.7; no cherry-picking |

---

## Measurement Models

### Stage boundaries instrumented (`lib/stageTiming.js`)

```text
S1 Browser/DOM extraction  → S2 object construction → S3 JSON serialization
S4 output_data persistence → S5 SQLite write
S6 artifact serialization  → S7 filesystem write
S8 socket/history events
```

`probe.js` toggles full mode vs extraction-only mode (S4–S8 disabled) for E2/E3-A.

### Per stage captured

- duration (ms)
- memory delta (MB)
- data size in/out (bytes)
- errors (count + first 25 classified)

---

## Data Flow

```text
runner/run.js
  → fixture-server (offline)
  → benchmark (e.g. extraction.bench.js)
    → lib/probe.js  → real execution seam
      → lib/stageTiming + lib/metrics sampling
  → collectors/metricsCollector → metrics object
  → output/raw/<runId>.jsonl + <runId>.summary.json
  → summary/generateSummary → output/archive/benchmark-results-<commit>.json
  → decision records appended to plan §10 per experiment
```

---

## Runbook (implemented in the benchmark phase)

1. Clean checkout at recorded commit; `cd apps/backend && pnpm test` green (proves probe period didn't perturb anything).
2. `node runner/run.js --scenario e0-10000 --mode full`
3. Run E0 → E2 → E1 → E3 → E4 → E5 → E6 (per plan §9).
4. `node summary/generateSummary.js --commit <sha>` → archive + diff.
5. Append per-gate decision records to `docs/research/web-scraping-benchmark-plan.md` §10.

---

## Hard Rules

1. **No production file under `apps/*` is modified by this harness.** Any needed instrumentation lives in `spike/scraping-benchmark/lib/` (benchmark-only adapter) or is documented as a requested, separately-approved production change.
2. No external network requests during benchmarks.
3. No CAPTCHA / anti-bot / rate-limit bypass scenarios, ever.
4. No fabricated results; every number traces to a `<runId>.jsonl`.
5. Scenario keys are stable (`e1-c1-m2`, `e0-10000`, `e3b-8`, …) so commits can be diffed.
6. Warm-ups are discarded; N≥3 runs per scenario; p50+noise-band decides.