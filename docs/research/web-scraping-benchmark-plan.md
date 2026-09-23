# HalTest — Web Scraping Benchmark Plan (v2)

> **Status**: Experiment design (2026-09-23). **Not run.** No numbers exist yet — this document defines the protocol, the metrics, the instrumentation model, and the decision gates so a future `spike/scraping-benchmark/` harness can execute it and produce evidence.
> **Branch**: `spike/web-scraping-feasibility`.
> **Depends on**: `docs/research/web-scraping-feasibility.md` (§7 bottleneck analysis, §9 open questions), `docs/research/web-scraping-architecture.md` (§3 repeated extraction, §4–5 pagination/infinite scroll, §13 dependencies), `docs/research/web-scraping-implementation-plan.md` (phases).
> **Rules of engagement** (from the phase brief):
> - No production HalTest code is modified during this benchmark phase.
> - No benchmark decision is taken on throughput alone.
> - No numbers are fabricated or anticipated — they come only from the harness.
> - No CAPTCHA / anti-bot / rate-limit bypass mechanisms are designed or built, at any point.

---

## 0. What This Phase Must Decide

This benchmark exists to answer one architectural question with evidence:

> **Given HalTest's current architecture (Playwright + browser pool `HAL_MAX_BROWSERS=5` + SQLite + `step_results.output_data` + run-dir artifacts + per-node socket events + ~30s node timeout + in-memory run variables + 72h/100MB retention), how far can Web Scraping go reusing it directly — and at what measured point do we need a separate workers/queue/data-pipeline architecture?**

Every experiment below terminates in a **decision record** (`Finding → But → Decision`), not a chart. The decisions feed the roadmap boundary in §12 (MVP vs future workers/queue) and the architecture options in `web-scraping-architecture.md` §14.

---

## 1. Decision Framework — Never Throughput Alone

The extraction-mechanism decision (and every other comparative decision in this plan) evaluates candidates along **15 dimensions**. A mechanism is *chosen per use-case*, not globally.

| # | Dimension | Why it matters | Instrument |
|---|---|---|---|
| 1 | Throughput (records/sec) | Raw speed of the extraction stage | harness counter |
| 2 | Wall-clock time (ms) | End-to-end including infra | `performance.now()` deltas |
| 3 | Peak RSS (MB) | Process isolation / worker-fit signal | `process.memoryUsage().rss` sampling |
| 4 | Heap used (MB) | GC pressure, array retention | `process.memoryUsage().heapUsed` |
| 5 | CPU (ms) | Event-loop contention | `process.cpuUsage()` deltas |
| 6 | Browser stability | Crash / OOM / context-leak / page count | browser events, watchdog |
| 7 | Error rate | % records failed / partial results | harness counter |
| 8 | Correctness | Field values match fixture ground truth (exact + regex) | ground-truth diff per run |
| 9 | Serialization time (ms) | `JSON.stringify` cost of the result | stage timing |
| 10 | Persistence time (ms) | `output_data` + SQLite/artifact writes | stage timing |
| 11 | Result size (bytes) | Payload growth vs retention/history policy | `JSON.stringify(x).length`, `fs.stat` |
| 12 | Optional-field handling | Missing optional fields → `null`, no record loss | fixture with partial-attribute rows |
| 13 | Per-field selector flexibility | Different selector per field; row-scoped selectors | fixture with heterogeneous cards |
| 14 | Per-record error isolation | A failing field/record must not abort the dataset | injected failure fixture |
| 15 | **Future auto-healing impact** | Traceability of *which selector produced each value* (raw selector captured per field), so `SelectorHealer` can recover per-field selectors later | harness records field→selector provenance |

**Dimension 15 is decisive for scope, not for speed.** A mechanism that is 2× faster but destroys per-field/record-level provenance and debugging traces may pass dimension 1 but fail dimensions 12–15; the decision engine records exactly that trade-off instead of collapsing everything into records/sec.

Decision-record template (used in every experiment):

```text
Finding:
  <what the data shows, e.g. "evaluateAll is 2.4x faster at 10k records">
But:
  <what the data also shows, e.g. "RSS +38%, error isolation worse,
   per-field selector flexibility worse, provenance weaker">
Decision:
  <action, e.g. "Do not replace locator-based extraction globally.
   Use evaluateAll only for simple, homogeneous, repeated-field extraction;
   keep locator-based extraction as the default path.">
```

---

## 2. Pipeline Instrumentation — Separate Extraction From Persistence

The central measurement model. We never measure a single `DOM → records` number; we measure **eight stages** independently so we can attribute the bottleneck to the browser or to HalTest's own infrastructure.

```text
S1  Browser / DOM extraction     (Playwright locator work)
S2  Object construction          (field map → record objects)
S3  JSON serialization           (JSON.stringify of result)
S4  output_data persistence      (StepResult output_data payload build + sequelize)
S5  SQLite write                 (INSERT / journal / wal flushes)
S6  Artifact serialization       (JSON/CSV/NDJSON dataset file encode)
S7  Filesystem write             (fs write + flush + stat)
S8  Socket / history events      (emitExecutionStatus / step event emit + history reads)
```

For **every stage** capture at least:

| Per-stage metric | Instrument |
|---|---|
| Duration (ms) | perf hooks around each stage boundary |
| Memory delta (MB) | `memoryUsage` before/after stage |
| Data size (bytes) | payload/byte length entering and leaving the stage |
| Errors | count + classification (first 25 logged with detail) |

### Instrumentation rule

- The harness uses the **real production modules** (same `ExecutionService`/plugin-handler seam the MVP will use) with timing hooks injected via a benchmark-only adapter — never fork-mirrored reimplementations of the pipeline. If a stage cannot be isolated (e.g. SQLite flush internals), bracket it (before/after) and label the interval precisely.
- Stops the moment a stage boundary is not measurable; the label of that gap goes into the raw `JSONL` as `uncategorizedMs`.
- **Extraction-only mode** (E2/E3-A) toggles stages S4–S8 off so we can measure S1–S3 (browser/DOM/object/serialize) in isolation.

Expected output shape (illustrative, never fabricated here):

```text
DOM extraction (S1):        420 ms
Object construction (S2):    80 ms
JSON.stringify (S3):        310 ms
output_data + SQLite (S4+S5):1400 ms
Artifact write (S6+S7):      220 ms
Socket/history (S8):          90 ms
Total:                      2520 ms (≠ 2430 ⇒ 90ms uncategorized)
```

---

## 3. Experiment Catalog

### 3.1 E0 — `output_data` size sweep (empirical crossing point, no preset limit)

Replaces any assumption about "the right cap is 256 KB". We discover where full `output_data` stops being reasonable.

**Sizes:** 100, 250, 500, 1,000, 2,500, 5,000, 10,000, 25,000, 50,000, 100,000 records (`extract` repeated mode, `evaluateAll` default; mechanism held constant for attribution).

**Per tier capture:**

- execution time (wall, engine, per-node)
- peak RSS
- heap used (peak + delta)
- JSON serialization time (S3)
- output_data size (bytes)
- SQLite write time (S4+S5)
- SQLite database file growth (bytes, before/after)
- artifact + run-dir disk footprint
- run completion (`completed` vs `failed`)
- failure detail (if any) with classification
- process stability (survives; no OOM; watchdog clean)

**Decision gate E0** → the crossing point where full `output_data` becomes unreasonable is chosen *on the data* (e.g. payload size vs budget ratio, SQLite insert time growth curve, RSS growth). Only afterwards may the design adopt:

```json
{ "count": 10000, "sample": [...], "datasetPath": "..." }
```

The decision record must state the measured justification (which tier, which metric, which threshold).

### 3.2 E1 — Extraction mechanism comparison (15-dimension matrix)

Candidates:

- **M1** `page.locator(target).all()` + per-row field queries (`row.locator(fieldSelector).innerText()/getAttribute()/evaluate()`)
- **M2** single `evaluateAll` returning all fields in one page-function
- **M3** hybrid: `evaluateAll` for simple homogeneous fields, fallback to M1 for complex/per-field-selector/optional-heavy rows (implemented only as a harness prototype to measure; MVP adoption is a benchmark output, not an assumption)

**Contexts** (the decision is context-dependent, so measure each):

- C1 homogeneous cards, all fields present, single `:scope`-relative selector
- C2 per-field selectors (each field has its own row-scoped selector; heterogeneous DOM)
- C3 optional fields present on a subset of rows
- C4 error injection: some rows intentionally break one field
- C5 large DOM (10k rows) — the volume case

For every (mechanism × context) record the **15 dimensions** of §1. Outcome is a **usage matrix**, not a single winner:

| Context | Recomment suggested mechanism | Evidence anchor |
|---|---|---|
| C1 homogeneous | depends on E1 data | … |
| C2 per-field selectors | depends on E1 data | … |
| C3 optional-heavy | depends on E1 data | … |
| C4 error isolation required | depends on E1 data | … |
| C5 volume | depends on E1 data | … |

### 3.3 E2 — Pipeline segmentation / bottleneck attribution

For each tier in E0 (subset: 1k, 10k, 100k records) run the same extraction **twice**:

- **Full mode**: all eight stages active (production-shaped flow).
- **Extraction-only mode**: S1–S3 only (browser + DOM + object + serialize; no SQLite/history/artifacts/sockets).

Compare stage durations to determine, at each tier, whether the dominant cost is **Playwright/DOM** (S1–S3) or **HalTest infra** (S4–S8). This directly settles the "is it Playwright or our infrastructure?" question and, together with E3, decides whether workers/queue are warranted.

### 3.4 E3 — Concurrency, two levels (browser vs infra)

Parallel runs at **1, 3, 5, 8** — each level executed in both modes:

- **E3-A Extraction-only concurrency** — only browser + Playwright + DOM extraction share the process (no SQLite, history, artifacts, socket events). Objective: the *real* browser-pool ceiling.
- **E3-B Full HalTest concurrency** — everything (browser + extraction + SQLite + `output_data` + artifacts + history + socket events). Objective: the *HalTest infra* ceiling.

**Per level capture:** time-to-first-slot, slot queue wait, per-run completion spread, total wall time, success rate, first-failure cause, RSS total, CPU, browser stability, SQLite contention signals, socket event volume.

**Decision gate E3** — the delta (E3-B minus E3-A) quantifies the infrastructure overhead at each concurrency level. If degradation appears in both at the same level → browser cap. If only in E3-B → infra cap → lays the evidence for the worker/queue/data-pipeline architecture (and the point at which it becomes necessary).

### 3.5 E4 — Dataset accumulation across pages (real scraping shape)

Fixture: **100 pages × 1,000 records = 100,000 total**, `loop { extract → click next → wait }`.

Strategies compared:

| Strategy | Model | Expected risk to measure |
|---|---|---|
| **A** | Accumulate everything in memory: `records = [...records, ...newRecords]` | linear RSS growth; final array size |
| **B** | Progressive artifact write: `page → artifact` append per iteration | many small writes; partial-result durability; artifact reopen cost |
| **C** | Bounded buffer + flush: memory buffer → threshold → artifact → clear | buffer-size tuning; flush boundary cost; crash window |

**Per strategy capture:** peak memory, throughput (across strategy), disk writes (# + bytes), final artifact size, recovery from mid-run failure, execution time, and **partial-result preservation** (are records 1..N available if the run stops at page k?).

**Decision gate E4** → play-for-choice among A/B/C. Also feeds E5's "recovery" scenario and the accumulator design in the implementation plan (Phase 3).

### 3.6 E5 — Failure / recovery benchmark

Five scenarios, each with explicit pass/failure assertions (not just "it ran"):

1. **Browser crash at page 37** — assert: run status (`failed`/`cancelled`), partial dataset preserved (strategy-dependent), artifact contents correct up to crash page, browser processes cleaned up, no leaked contexts, next run starts clean.
2. **Timeout during a large extraction** (near the 30s node budget) — assert: partial result state, artifact presence, run state, memory released, cleanup complete.
3. **Missing selector mid-scrape** (one field disappears at page k) — assert: subsequent records keep the field as `null`, other fields continue, an error counter/classification is recorded per record, the dataset is not aborted, a summary error surfaces in the step message.
4. **Empty page** (0 records) — assert: accumulator stays consistent (`count` unchanged / dedupe correct), no spurious failures, next iteration works.
5. **Immediate retry after a failed scrape** — assert: fresh run inherits nothing from the failed run (no variable/session/artifacts contamination), browser pool slots freed, second run completes.

**Decision gate E5** → which recovery guarantees are attributable to the current run-lifecycle machinery (`ActiveRunManager`, `ExecutionLogger`, artifacts), and which require new accumulator/artifact robustness (crash-window, partial-flush guarantees).

### 3.7 E6 — Authenticated / session-reuse benchmark (later phase tie)

Login fixture + storage-state persistence. Measure: session-reuse cost (context restore vs fresh login), correctness of extraction after restore, and whether session primitives (`persist_session` / `manage_cookies`) hold under pagination length. This is only run once E0–E5 produce stable harness; it does not gate the MVP.

---

## 4. Fixtures (deterministic, offline)

- **Static page generator** — N product-card rows, configurable field richness (3–5 fields), optional missing-attribute subset, heterogeneous per-field selectors variant, adversarial text (commas/newlines/quotes/emoji/unicode) for CSV escaping, iframe-embedded and open-shadow-DOM card variants.
- **Dynamic/SPA page generator** — client-render loop with async delays; virtualized-list mode (only visible rows in DOM).
- **Pagination fixture** — p pages with prev/next links (used by E4/E5).
- **Infinite-scroll fixture** — scroll-triggered append + dedupe scenario.
- **Authenticated fixture** — local login form + storage-state probe.
- **Failure-injection fixtures** — crash hook (close browser at iteration k), field-absent-at-page-k, empty-page-at-page-k, network-throttle variant.

All fixtures are served by the harness's own fixture server; **no external network** is used by the benchmark (reproducibility + security).

---

## 5. Metrics Taxonomy (single source of truth)

| Metric key | Stage | Description |
|---|---|---|
| `extractionMs` | S1 | browser/DOM extraction duration |
| `objectConstructionMs` | S2 | record-object building duration |
| `serializationMs` | S3 | JSON serialization duration |
| `persistenceMs` | S4+S5 | `output_data` + SQLite duration |
| `artifactMs` | S6+S7 | artifact encode + filesystem write duration |
| `socketMs` | S8 | socket/history event emission duration |
| `uncategorizedMs` | — | measured wall minus stage sum (labelled gap) |
| `rssPeakMb` | process | peak resident set size |
| `heapPeakMb` | process | peak heap used |
| `cpuMs` | process | accumulated CPU time |
| `recordsPerSecond` | derived | records / total wall |
| `datasetBytes` | S7 | artifact byte size |
| `outputDataBytes` | S4 | `output_data` JSON byte size |
| `sqliteDbGrowthBytes` | S5 | DB file growth during run |
| `browserStable` | S1 | boolean; false on crash/OOM/disconnect |
| `errorRate` | derived | failed records / total records |
| `correctness` | S1 | ground-truth diff result (`exact`, `regex`, `partial`, `failed`) |
| `pageCount`, `contextCount` | browser | leak detection |
| `success` | run | run completed as expected |

---

## 6. Harness Structure — `spike/scraping-benchmark/`

Design (doc-only in this phase; implementation lands when the benchmark phase starts):

```text
spike/scraping-benchmark/
├── README.md                     # this harness design (structure, runbook, status)
├── fixture-server/               # offline deterministic fixtures
│   ├── server.js                 # serves /static, /spa, /pagination, /infinite, /auth, /fail
│   ├── generators/
│   │   ├── cards.js              # card fixtures incl. field-richness + optional + adversarial text
│   │   ├── pagination.js         # p × 1000
│   │   ├── infinite.js           # scroll-append + dedupe
│   │   └── failure.js            # crash-at-k / field-absent-at-k / empty-at-k
│   └── manifest.json             # fixture registry (query params + seeds)
├── runner/
│   ├── run.js                    # orchestrates a scenario: server + mode + tier + output
│   ├── scenarios.js              # scenario definitions (E0–E6) → params
│   └── cleanup.js                # run-dir + browser-process cleanup guarantees
├── benchmarks/
│   ├── extraction.bench.js       # E1: M1/M2/M3 × C1–C5, 15-dim matrix
│   ├── serialization.bench.js    # E0/E2: S3 measurement
│   ├── persistence.bench.js      # E0/E2: S4–S7 measurement (SQLite + artifact + fs)
│   ├── concurrency.bench.js      # E3-A / E3-B at 1/3/5/8
│   ├── accumulation.bench.js     # E4: strategies A/B/C
│   └── recovery.bench.js         # E5: the five scenarios
├── lib/
│   ├── stageTiming.js            # perf hooks around the 8 stage boundaries
│   ├── metrics.js                # RSS/heap/CPU/disk/browser sampling + checkpointing
│   ├── probe.js                  # injects measurement into the real execution seam (benchmark-only adapter, no production mutation)
│   └── verify.js                 # ground-truth diff + correctness classification
├── collectors/
│   └── metricsCollector.js       # aggregates samples → per-run metrics object
├── output/
│   ├── raw/                      # one JSONL file per run
│   └── archive/                  # benchmark-results-<commit>.json + summary per commit
└── summary/
    └── generateSummary.js        # raw JSONL → tier×metric table + decision-record draft
```

**Boundary rule**: `lib/probe.js` opens a *benchmark-only* measurement adapter at the same execution seam the MVP will use (plugin-handler dispatch). It must verify a green suite on the real backend (`apps/backend`) before and after any benchmark run — the harness is additive and must never perturb production code under test.

### Data flow

```text
runner → fixture-server (offline)
runner → benchmark → probe → real execution seam → stageTiming/metrics
  → metricsCollector → output/raw/<runId>.jsonl
  → generateSummary → output/archive/benchmark-results-<commit>.json
  → decision-records attached to each experiment section in the plan docs
```

---

## 7. Result Format and Cross-Commit Comparison

### 7.1 Raw per-run JSON (`output/raw/<runId>.jsonl`)

One object per measurable event: stage boundaries, metrics samples, errors, fixture state.

```json
{"ts":1234,"event":"stage:start","stage":"S1","records":10000}
{"ts":1654,"event":"stage:end","stage":"S1","durationMs":420}
{"ts":... ,"event":"sample","rssMb":512,"heapMb":280,"cpuMs":900}
{"ts":... ,"event":"error","type":"field_missing","record":37,"field":"price"}
{"ts":... ,"event":"run:end","status":"completed"}
```

### 7.2 Per-run summary (`output/raw/<runId>.summary.json`)

```json
{
  "commit": "abc1234",
  "scenario": "e1-c1-m2",
  "records": 10000,
  "mechanism": "evaluateAll",
  "stages": {
    "extractionMs": 1234,
    "objectConstructionMs": 80,
    "serializationMs": 310,
    "persistenceMs": 1400,
    "artifactMs": 220,
    "socketMs": 90,
    "uncategorizedMs": 26
  },
  "extractionMs": 1234,
  "serializationMs": 456,
  "persistenceMs": 789,
  "artifactMs": 123,
  "rssPeakMb": 512,
  "heapPeakMb": 280,
  "cpuMs": 3400,
  "recordsPerSecond": 8100,
  "datasetBytes": 1240000,
  "outputDataBytes": 1500000,
  "sqliteDbGrowthBytes": 4200000,
  "errorRate": 0.001,
  "correctness": "exact",
  "browserStable": true,
  "pageCount": 1,
  "contextCount": 1,
  "success": true
}
```

### 7.3 Commit comparison

- Every run records `commit`, `env` (Node, Playwright pin, CPU/arch/RAM/OS, container profile, env overrides), fixture `manifest` hash, and harness version.
- `output/archive/benchmark-results-<commit>.json` aggregates all scenarios for one commit.
- Comparisons across commits use identical scenario keys (`e1-c1-m2`, `e0-10000`, `e3b-8`, …). A `diff.md` titled per commit pair lists only metrics that moved beyond a noise band (defined in §8.3) — no cherry-picking of "nice" numbers.

---

## 8. Environment and Reproducibility

1. Node `>=20`, `pnpm@9.15.4`, Playwright pinned (`mcr.microsoft.com/playwright:v1.62.1`).
2. Profiles: (a) local workstation, (b) constrained container (~2 vCPU / 4 GB) approximating Render free-tier headroom. Every run records which profile.
3. `HAL_MAX_BROWSERS` default 5 for concurrency; all env overrides recorded per run.
4. SQLite default for all sweeps; `DATABASE_URL=postgres` variant is optional and explicitly labeled.
5. Deterministic fixtures; seeded RNG for virtualized-list behavior. Fixture manifest hash recorded.
6. Warm-up + stabilization: one discarded warm run per scenario before measured runs; each scenario run N≥3 times with median reported (p50/p90 also recorded).
7. **Noise band**: metrics below a defined per-metric noise band (e.g. timings ±5% after warm-up) are treated as equal; decisions only cite differences above the band.

---

## 9. Procedure (runbook)

1. `git` at a clean, recorded commit; green backend suite (`cd apps/backend && pnpm test`) before each session.
2. Start fixture server + runner (one command; logs to `output/raw/`).
3. E0 output_data sweep (tiers 100→100k), full mode.
4. E2 segmentation: rerun 1k/10k/100k in extraction-only mode.
5. E1 mechanism matrix (M1/M2/M3 × C1–C5).
6. E3 concurrency: E3-A then E3-B at 1/3/5/8.
7. E4 accumulation strategies A/B/C (100 × 1,000).
8. E5 recovery scenarios (5).
9. E6 authenticated (once E0–E5 harness is stable).
10. Generate summaries, write per-experiment decision records into the plan docs, archive per commit.

---

## 10. Decision Gates (each experiment produces a written decision record + roadmap action)

| Gate | Trigger evidence | Decision shape |
|---|---|---|
| **E0 — output_data cap** | tier where payload size / SQLite insert time / RSS growth crosses budget | adopt `{count, sample, datasetPath}`; state measured threshold in the decision record |
| **E1 — extraction mechanism** | 15-dim matrix per context | usage matrix: which mechanism in which context; no global winner |
| **E2 — bottleneck attribution** | stage-duration split per tier | "bottleneck is Playwright" vs "bottleneck is HalTest infra" → directs whether S4–S8 optimization precedes any engine concern |
| **E3 — concurrency limit** | E3-B − E3-A delta; degradation level | if both degrade → `HAL_MAX_BROWSERS` is the local ceiling; if only full mode degrades → **evidence for worker/queue isolation rather than merely raising concurrency** |
| **E4 — accumulation strategy** | peak memory / writes / recovery / partial durability | choose A/B/C; sets accumulator design for implementation Phase 3 |
| **E5 — recovery guarantees** | per-scenario pass/fail assertions | list of robustness gaps the MVP accumulator/artifact must close |
| **E6 — session reuse** | restore-vs-login cost | whether session primitives suffice for long authenticated scrapes |

Every gate leads to exactly one of: **(a)** reuse current architecture as-is, **(b)** additive change to current architecture (MVP phases, `naming → web-scraping-implementation-plan.md`), **(c)** new architecture (workers/queue/data-pipeline — architecture Option 3). The gate output is a short paragraph + the roadmap phase it feeds; no overall "winner" is ever produced.

---

## 11. Security as a Benchmark Concern

Even though cloud scraping is not implemented in this phase, the benchmark harness and its documentation carry the security posture forward:

**Documented risks the benchmark tracks (report-only in this phase):**
- SSRF via arbitrary navigation (feasibility doc §6.2 — the `open_url` node is scheme-only validated today)
- localhost / private-IP-range / link-local / internal-service access from a hosted browser
- cloud-metadata endpoints (`169.254.169.254`, etc.)
- credential exposure in session state / cookies / storage files
- PII and secrets appearing inside extracted records, `output_data`, artifacts, logs, and `global_variables.json`
- downloaded files from navigation
- arbitrary navigation and script execution paths

**Harness guardrails (enforced even offline):**
- All fixtures are local; no external URL is ever requested by the benchmark.
- The harness never writes credentials or real cookies into committed artifacts.
- Extracted fixtures avoid PII; adversarial variants remain synthetic.
- No CAPTCHA, anti-bot, rate-limit, or verification-bypass mechanisms are designed, implemented, or benchmarked — such behaviors are documented as legitimate-use limitations only.

**Benchmark security metrics (when cloud-adjacent scenarios exist later):** navigation guard hit-rate (blocked vs allowed URLs), redaction coverage on sample outputs, quota/limit enforcement under concurrent runs. These are future additions gated on Phase 7 (cloud security), not this phase.

---

## 12. Roadmap Boundary: MVP vs Future Architecture

The benchmark feeds the roadmap; it does not presuppose it. The proposed phases (to be confirmed/reshaped by benchmark decisions):

```text
Phase 0 — Benchmark (this plan + harness)
Phase 1 — Single Extract
Phase 2 — Repeated Extract
Phase 3 — Dataset Accumulator
Phase 4 — Dataset Artifacts / output_data policy   ← informed by E0/E4
Phase 5 — Pagination / Infinite Scroll               ← informed by E4/E5
Phase 6 — Authenticated Scraping                     ← informed by E6
Phase 7 — Cloud Security / Scalability               ← informed by E3
Phase 8 — AI-assisted Extraction                     ← informed by E1 dim 15 later
Phase 9 — Extraction Auto-Healing
```

**Explicitly NOT implemented during this phase** (decisions deferred until benchmark evidence exists):
- AI extraction / AI selector generation (requires E1 dimension-15 tracing model to be stable)
- scraping-specific auto-healing
- CAPTCHA / anti-bot bypass mechanisms (never, by policy)
- distributed scraping workers and queue infrastructure (only justified if E3-B / E2 show the infra ceiling — evidenced, not assumed)

---

## 13. Deliverables of This Phase

1. This updated benchmark plan (v2) — the protocol above.
2. `spike/scraping-benchmark/` harness **design** (`README.md` + structure defined; implementation is the next step, not this phase).
3. After execution: raw JSONL per run, per-commit aggregate, per-commit diff, and one decision record per experiment appended to this document's §10 table.

---

## 14. Open Risks / Remaining Unknowns

| Unknown | Where it will surface | Resolution |
|---|---|---|
| Shadow-DOM / iframe selector resolution on the pinned Playwright | E1 C2 + fixture "adversarial" | spike verification before any promise |
| True per-stage isolation points (SQLite flush internals) | E2 stage brackets | labeled `uncategorizedMs`, reviewed by engineer |
| Whether 100k records ever completes within the 30s node budget | E0 tier 100k | drives timeout budget decision (dedicated node timeout vs loops) |
| Socket event volume at accumulation scale | E3-B / E4 | batching policy decision if E3-B measurement shows it degrading |
| Ground-truth diff fragility with dynamic fixtures | `verify.js` | fixed seeds + regex classifiers; reviewed before decisions cite correctness |

---

## 15. Change Log (v1 → v2)

- Added §1 decision framework: 15 evaluation dimensions; throughput no longer decisive; decision-record template.
- Added §2 pipeline instrumentation: 8 stage boundaries, per-stage duration/memory/data-size/errors; extraction-only vs full-mode; bottleneck attribution.
- Replaced the 4-tier output_data sweep with **E0** (10 tiers 100→100,000) to find the empirical crossing point (no preset 256 KB).
- Split concurrency into **E3-A** (extraction-only) and **E3-B** (full HalTest) to separate browser ceiling from infra ceiling.
- Added **E4** dataset accumulation (100×1,000) with strategies A/B/C (memory / progressive artifact / bounded-buffer+flush) incl. partial-result preservation.
- Added **E5** failure/recovery benchmark (browser crash, timeout, missing selector, empty page, immediate retry) with explicit assertions.
- Added **E6** authenticated/session benchmark as a later-phase tie.
- Added §7 result schema and cross-commit comparison (noise band, scenario key stability, no cherry-picking).
- Added §11 security-as-a-benchmark-concern (risk register + harness guardrails; no bypass instrumentation).
- Added §12 roadmap boundary and §14 open risks.
- Harness structure formalized in `spike/scraping-benchmark/` (§6 + companion README).