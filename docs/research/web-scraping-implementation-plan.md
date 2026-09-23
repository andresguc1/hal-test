# HalTest — Web Scraping / Data Extraction Architecture

> **Status**: Research (2026-09-23). No production code modified.
> **Branch**: `spike/web-scraping-feasibility`.
> **Depends on**: `docs/research/web-scraping-feasibility.md` (forensics, security, resources).

This document answers the architecture questions: what abstraction the extraction capability should take, what the extraction data model is, how repeated elements / pagination / infinite scroll / authentication map onto existing machinery, where extracted data lives, how it is exported, how AI and auto-healing integrate (phased), what the canvas UX should look like, the architecture options with trade-offs, the dependency analysis, the repository file map, and the decision matrix.

---

## 1. Recommended Architectural Abstraction

**Verdict: Option A — a new "Data" node category built on the existing node-registry/plugin seams, plus a thin extraction service module. Option C (separate scraping subsystem) and Option B (generic extraction attached to every existing DOM node) are rejected.**

### 1.1 Why Option A

- The node model, dispatch, schema, config-form, toolbox, execution, history and artifact machinery are **already node-centric**. A scraping capability that is *not* a set of nodes would fight the entire platform.
- HalTest's flow-first philosophy means extraction must compose with `loop`/`conditional`/`wait_visible`/`session` nodes the same way `assert` and `take_screenshot` compose today. Only a first-class node family achieves that.
- Frontend cost is near-zero for registration: unknown backend node types auto-render through generic `AbyssNode`; the property form is schema-driven from `NODE_INPUTS`; the toolbox merges backend `/nodes/definitions` via `updateNodeDefinitions`.
- Extraction remains **browser/DOM-based** — the strength (multi of the differentiated value is executing against the real authenticated, JS-rendered page) that HalTest already has and plain HTTP scraping lacks.

### 1.2 Rejected alternatives

| Option | Description | Rejection rationale |
|---|---|---|
| **A** | New "Data" node category (`extract`, `extract_list`, `save_dataset`, later `export_data`) on the existing seams + thin `ExtractionService` | **ADOPTED** |
| **B** | A generic "Data Extraction" capability attached to every existing DOM node (any node can capture fields) | Conflicts with the node-type taxonomy (`NODE_TYPE_MAP`/`NODE_INPUTS` are per-type); pollutes every config form; hard to expose in toolbox/history; high UI and validation complexity. Extraction is a distinct concern, not a property of click/type nodes. |
| **C** | A separate scraping subsystem/engine (own parser, own runner, own storage) | Unnecessary: Playwright already provides locators, `locator.all()`, frames, shadow DOM. A second engine duplicates browser lifecycle, history, retention, healing and cancel machinery, and breaks flow composition. Revisit only if benchmarks (see benchmark plan) prove Playwright can't handle the target scale — evidence does not exist today. |
| **D** | Streaming worker/data-pipeline subsystem (dedicated extraction workers + dataset store) | Premature. The current architecture has no queue runtime (only a fork perf-worker pool). Re-evaluate at Phase 7 when 100k-record/cloud concurrency is actually measured. |

### 1.3 Node family shape

Initial taxonomy (naming is provisional, must be locked during implementation):

```
Data
 ├── Extract           (extract)          — single element or repeated-element structured extraction
 ├── Extract List      (extract_list)     — repeated-element extraction returning records[] (alias/UX sugar over extract { repeated: true })
 ├── Save Dataset      (save_dataset)     — persist accumulated dataset to run-dir artifact (JSON/CSV/NDJSON) + variable
 └── Dataset          (dataset, later)   — explicit in-flow dataset accumulator/append primitive
```

Two nodes can be collapsed into one (`extract` with a `repeated` mode) — the roadmap starts with `extract` and adds a separate `dataset` accumulator because accumulation across loop iterations is a *storage* concern distinct from extraction.

---

## 2. Extraction Data Model

### 2.1 Node configuration (schema, stored in `Nodes.data.configuration`)

```jsonc
{
  "type": "extract",
  "target": "body .product-card",        // Playwright CSS selector (state: selector)
  "repeated": true,                      // false: single element; true: locator.all()
  "fields": {
    "name":  { "source": "text" },
    "price": { "source": "text" },
    "rating":{ "source": "text", "optional": true },
    "url":   { "source": "attribute", "attribute": "href" },
    "image": { "source": "attribute", "attribute": "src", "optional": true },
    "raw":   { "source": "html", "optional": true }
  },
  "scope": "parent",                     // sibling-locator scoping: fields resolved relative to each repeated row
  "outputVariable": "products",          // variable to receive records[] (or single record)
  "ifEmpty": "ok",                       // "ok" | "fail" | "softfail"
  "timeoutMs": 30000
}
```

Field `source` values for the **MVP**: `text` (innerText), `attribute`, `html` (outerHTML). Future: `url` (resolved href against base), `image` (resolved src + data URI option), `dataset` (data-*), `count`, `exists`.

### 2.2 Output

Single extraction:

```json
{ "name": "...", "price": "...", "url": "..." }
```

Repeated extraction:

```json
[ { "name": "...", "price": "...", "url": "..." }, ... ]
```

Execution result contract (returned by handler → persisted to `step_results.output_data` per existing convention):

```jsonc
{
  "success": true,
  "data": {
    "records": [...],               // full array for small results (MVP); truncated later
    "count": 1248,
    "truncatedTo": 1000,            // when a cap is applied
    "fields": ["name","price","url"],
    "missingFields": 7,             // records with ≥1 optional field absent
    "elapsedMs": 812
  },
  "variable": "products"
}
```

### 2.3 Semantics decision table

| Case | Behavior |
|---|---|
| 0 elements, `ifEmpty: ok` | `success: true`, `records: []`, `count: 0`, step status success |
| 0 elements, `ifEmpty: fail` | step fail with clear message (`EXTRACTION_NO_MATCH`) |
| 1 element | single record; consistent shape with repeated (wraps in array when `repeated: true`) |
| 100 / 10,000 elements | full array in MVP; capped array + artifact pointer once benchmark sets the ceiling |
| element missing an optional field | field value `null`, record kept, `missingFields` incremented |
| element missing a required field | record kept with `null`; extraction error count surfaced in step message; failure only if configured (`strict: true`) |
| field selector matches multiple child nodes | `text`/`html` → first-match (Playwright `locator.first()`); `count` source later |
| DOM changes between iteration steps | `wait_visible`/re-query; extraction is always *read-fresh* at execution time |
| dynamic attributes | selector healing path (Post-MVP, §11); until then the standard `wait_visible` + retry wrappers apply |

### 2.4 Where the data lives during execution

- **During the node**: a JS array in the handler.
- **After the node**: `VariableManager.storeNodeResult(nodeId, ..., result, runId)` → run-scoped variable (`products.result`, aliases by label). Run-scoped variables are **in-memory only** (globals persist; run state does not).
- **After the run**: for reproducibility, the dataset is persisted as a **run-dir artifact** (`${STORAGE_RUNS_DIR}/{runId}/dataset-{index}.json/.csv`) and referenced from the step (`output_data.datasetPath`); `step_results.output_data` holds bounded output (count + first-N sample + path), **not** the full payload, once scale requires it.

---

## 3. Repeated Elements

Playwright-based, no new parsing dependency:

```js
const rows = page.locator(config.target).all();                    // n handles
const records = await Promise.all(rows.map(async (row, i) => {
  const fields = {};
  for (const [name, spec] of Object.entries(config.fields)) {
    const query = spec.source === 'attribute'
      ? await row.locator(spec.selector || ':scope').getAttribute(spec.attribute)
      : spec.source === 'html'
        ? await row.locator(spec.selector || ':scope').evaluate(el => el.outerHTML)
        : await row.locator(spec.selector || ':scope').innerText();
    fields[name] = (query === null || query === undefined) ? null : normalize(query);
  }
  return fields;
}));
```

Two Playwright mechanisms to evaluate in the spike:
1. **`locator.all()` + per-row field queries** — simple, intuitive, N field lookups per row. Likely fine to 1k; measure to 10k.
2. **single `evaluateAll`** returning all fields in one page-function — drastically fewer round-trips for 10k+ rows:

```js
const records = await page.locator(config.target).evaluateAll((els) =>
  els.map((el) => {
    const q = (el, s) => s ? el.querySelector(s) : el;
    return Object.fromEntries(Object.entries(config.fields).map(([name, spec]) => {
      const target = q(el, spec.selector);
      if (!target) return [name, null];
      return [name, spec.source === 'attribute' ? target.getAttribute(spec.attribute) :
                     spec.source === 'html' ? target.outerHTML : target.innerText];
    }));
  })
);
```

Behavior matrix per §2.3. The benchmark plan measures both mechanisms and the 0/1/100/10k/100k cases, missing-field cost, and dynamic-DOM refresh cost.

---

## 4. Pagination

**Reuse existing primitives. No `ScrapePages` node needed.**

```text
Page 1 state (open_url)
   ↓
Loop (for_each / loop with max)
 ├── Extract (repeated list → appends to dataset)
 ├── wait_visible("a[next]")   (belt-and-braces guard)
 ├── Click Next   (click on pagination control)
 ├── wait_navigation / wait_network idle
 └── conditional: "no next link" → break
```

Loop containers already give: isolated child scopes, `loop.index/item/total`, `break`/`continue`/`return` (`ExecutionService.executeLoopContainer`/`executeForEachContainer`). What's missing is the **accumulator** that makes "appends to dataset" true across iterations — that is the `dataset` node / `save_dataset` semantics (§1.3, §5, §12.2).

Stop-condition patterns available today: `conditional` on extracted link count (`locator.all() == 0`), `wait_visible` timeout → softfail → break, `loop` max-iteration cap (safety), flow-wide run timeout.

---

## 5. Infinite Scroll

**Composable from existing nodes + the accumulator; no new engine.**

```text
Loop (max N)
 ├── scroll to bottom         (scroll node, element: body / container)
 ├── wait / wait_network idle (wait_visible / pause, e.g. 800ms or network idle)
 ├── Extract (repeated)       → append → dedupe on a key field
 ├── conditional: "no new rows since last iteration" → break
 └── (optional) virtualized-list caution notes below
```

What exists: `scroll`, `wait_visible`, `wait_network`, `loop`, `conditional`, `pause`, `extract`.
What's missing: (a) a dataset append-with-dedupe primitive; (b) a per-iteration "change detection" for virtualized/JS-driven feeds (implementable via `conditional` on `count` from the previous extraction result — same accumulator makes this possible); (c) a scroll-end detection helper (can be a `wait_visible` on a sentinel element or `scroll` + count compare).

**Virtualized lists** (React/Vue windowing): extraction must read *visible* rows per scroll, then accumulate+dedupe; the `evaluateAll` mechanism (§3) matches this naturally. Documented as a supported-but-benchmarked pattern, not a special node.

---

## 6. Authentication

**Fully supported by existing machinery.** This is a major differentiator vs HTTP scraping and requires **no new code**:

- `open_url` → `click`/`type_text`/`fill_form`/`submit`-style login (standard nodes).
- `persist_session` (core-session) — save browser storage state.
- Browser context already reuses cookies/storage per context (`core/browser-utils.js#getOrCreateContext`), device/viewport/U-A overrides, and HTTP-credential options.
- `manage_cookies`, `inject_tokens`, `create_context`, `cleanup_state`, `manage_storage` (core-session/network) cover session-reuse between runs.
- Composite `component` lets the login sequence be reused across many scrape flows (subflow).

The expected composite pattern for authenticated scraping:

```text
Component: "Authenticate" (open_url → login → persist_session)
   ↓
Flow: Navigate → Extract ... → Save Dataset
```

Caveats to document: cloud SSRF + credential hygiene (§feasibility-6); never write passwords/tokens into `step_results.output_data` (field redaction; data-leak engine already exists).

---

## 7. Dynamic Websites

| Technology | Playwright/HalTest support today | Needed? |
|---|---|---|
| React / Vue / Angular / SPA / client-render | Full — real browser executes the app | None |
| Delayed content | `wait_visible`, `wait_navigation`, `wait_network` | None (author correct wait). |
| AJAX/fetch | `wait_for_response` / `wait_for_request` / `wait_network_match` | None |
| Infinite scroll / virtualized | §5 pattern | Accumulator + dedupe node |
| Dynamically generated DOM | Re-query per iteration; healing Post-MVP | None for MVP |
| **Shadow DOM** | Playwright pierces open shadow roots with CSS via `document.querySelector`? — **No**: Playwright locators do not automatically pierce *open* shadow roots except with `:light` semantics historically; evaluate per-site. Playwright supports pierce for *open* shadow DOM via CSS selectors in most cases; closed roots are not accessible. | **Benchmark/spike**: verify extraction selector resolution inside shadow roots; document limitation; do not promise closed shadow DOM. |
| **iframes** | Playwright `frameLocator()`; locator chaining | Add `iframe`/frame-querying to the `extract` field resolution (`frame` option per field or node) in a later phase; MVP documents iframe support as: fields can target a frame via the page-level target frame config. |

Note (fact, not claim of access): Playwright's selector engine traverses frames and, for the `css` engine, matches elements in open shadow roots in current Chromium-based behavior — this must be empirically verified for the exact pinned version (`playwright:v1.62.1`) in the spike, and closed shadow roots remain out of scope.

---

## 8. Anti-Bot / CAPTCHA / Restrictions — Legitimate-Use Posture

The platform does **not** design bypass mechanisms (CAPTCHA solving, rate-limit evasion, bot-verification circumvention, TOS avoidance).

Instead the architecture defines **behavior when a site restricts access**:

| Restriction | HalTest behavior (deterministic) | Operator options |
|---|---|---|
| CAPTCHA / MFA / bot check | Extraction yields no expected data (softfail via `wait_visible` timeout or `conditional` no-match); the step fails softly with a clear `EXTRACTION_BLOCKED`-style message | Insert a `pause`/manual-intervention node; handle via the existing explicit-user-intervention UX; document that such flows aren't suitable for unattended cloud execution |
| Login required | Session nodes (`persist_session`, `manage_cookies`) reuse an operator-authenticated session obtained once | Authenticated extraction composite (§6) |
| Rate limiting / 429s | `wait_network_match`/`wait_visible`; existing `set_network_conditions`; throttling is the operator's design via `pause`/`loop` delays | Document; never auto-retry faster |
| Blocked browser sessions | Existing soft-fail + `continueOnFailure` semantics surface the blockage | Operator decides; healing never force-matches |

Technical limitations are documented as such; no circumvention features are specced.

---

## 9. Data Storage Architecture

Compare the options against the existing run/artifact model:

| Option | Fit | Verdict |
|---|---|---|
| **A — Execution memory only** | Run-scoped `VariableManager` scopes hold records during/after run | Baseline, but run state vanishes on restart and nothing survives for reproducible reports → not the sole store |
| **B — Execution artifacts** | Run-dir artifacts (`${STORAGE_DIR}/runs/{runId}/dataset-*.json|.csv`), evidence endpoints + `ReportExporter` reuse, `StorageCleanupService` retention, `deleteRun` removes the dir | **Primary durable store (MVP).** Matches screenshots/videos pattern exactly |
| **C — Database** | `step_results.output_data` (bounded summary) + (Phase 3+) an optional `Dataset` table for queryable datasets | Summary in DB; full datasets on disk. A `Dataset` table is an *extension*, not MVP |
| **D — Streaming dataset** | Write rows incrementally to the artifact while the flow runs (append per extraction node) | Required for 10k+ (avoid memory round-trip) — Phase 3/4 |
| **E — External storage (S3/db)** | No cloud object storage exists today | Phase 7 cloud consideration only |

**MVP**: accumulate in a run-scoped dataset (variable-backed accumulator), stream to a run-dir artifact, export to user (JSON/CSV download) on completion; `deleteRun`/`clearHistory` cleans artifacts; retention policy explicit (§benchmark-plan §2.3). Distinct datasets: `datasets/` and `golden-datasets/` dirs already exist in storage root and can host persistent extracted datasets.

---

## 10. Export Formats

| Format | MVP | Rationale |
|---|---|---|
| **JSON** | Yes | Native; existing `save_results` precedent; `exporter/generateJson` precedent |
| **CSV (RFC 4180)** | Yes | Industry-standard for downstream data tools; frontend already parses CSV (DatasetRunModal) — backend serializer is the missing piece (hand-rolled vs dependency decision in §13) |
| **NDJSON** | Yes (cheap) | Natural for streaming large datasets; future webhook feeds |
| Excel | Phase 5+ | Additive (sheetjs or table-format serializer); not MVP |
| Webhook / API push | Phase 5+ | `handle_hooks`/`request` mutation, server-side push service; not MVP |
| Direct-to-DB insert | Phase 5+ | `db_query` exists but is SQLite; cloud DB target later |

Deterministic first, LLM-free; serializers must be **pure functions** (unit-testable) living in a new `services/exporter/` sibling (e.g. `datasetExporter.js`) rather than inside plugins.

---

## 11. AI Integration (phased; NOT required for MVP)

| Capability | Feasibility today | How |
|---|---|---|
| **AI-assisted field detection** (user: "extract name, price, rating" → candidate DOM) | Feasible now (spike): `AIService.generateStructured` + `fetchContext` DOM snapshot; candidate selectors verified with `page.locator(c).count()` before writing into `configuration.fields` | Phase 6 |
| **Schema / field-map generation** (NL → field map) | Feasible now: `generateStructured` with zod schema → returns proposed `fields` object; user confirms | Phase 6 |
| **Extraction healthy** (field selector broke → candidate) | Feasible with changes: field-level reuse of `SelectorHealer` (deterministic tier + AI tiers) — heal *field selectors*, not the repeated-element container; requires scope awareness (heal within row container) | Phase 6; risk chapter §feasibility-8 (no silent writes to datasets) |
| Smart "extract main content" | Exists today (`extract_dom_context` AI clean) — complementary, not the structured path | Phase 1 already possible |
| Autonomous crawl planning | Future research (ties to `explore_application` MCP proposal) | Phase 7+/research |

AI plumbing to reuse verbatim: `aiService.generateStructured`, `healSelector` (structured output with `{correctedSelector, confidence, reasoning, isBreakingChange}`), `AITaskOptimizer`, `AIUsageLog` telemetry, `KeyVaultService`, per-request provider headers.

**Guardrail**: AI never writes into a dataset silently — every AI-proposed selector/field is verified (count match), confidence-scored, and surfaced for confirmation (same philosophy as the healing confidence policy with HUMAN_REVIEW/MANUAL tiers).

---

## 12. Execution History and Canvas UX

### 12.1 History

Extraction steps appear in the existing step/history stream with no schema change needed for the MVP:

```text
Scraping Run
01 navigate    (open_url)
02 login       (component)
03 extract products      → 1248 records → dataset-1.json
04 next        (click)
05 extract products      → 1253 records (accumulated 2501) ...
...
Artifacts: dataset-{index}.*, screenshots, execution.webm, report.html
```

Mechanics:
- Per-node `step_results` already record `output_data` — put `{ count, sample[], datasetPath, missingFields, elapsedMs }`.
- `RunHistoryPanel` / `ReportDashboard` `data` evidence tab previews the record sample; full download via the existing artifact/evidence download plumbing (`api.download`, `getFileUrl`).
- Composite `component` child steps already flatten into the report (`compositeNodeId`/`subflowId`), so authenticating flows render correctly.
- A "Dataset" download button in `RunHistoryPanel` rows whose step contains `datasetPath` is a small frontend enhancement (Phase 3).

### 12.2 Canvas UX

- Toolbox category **`Data`** (icon + color already templated via `NODE_CATEGORIES`/`CATEGORY_STYLES`). Consistent with `Files & Data` and `Databases` — a new top-level group.
- `extract` config form = new editors in `src/components/editors/`: **FieldMapEditor** (rows: field name, source select `text|attribute|html`, selector/attribute inputs, optional toggle), and a **DatasetPreviewPanel** (react-hook-form + live socket or result sample).
- `selector`-typed inputs reuse the existing element-picker (`type: 'selector'` → picker button; also supports the sibling-scoping hint UX).
- `save_dataset` config: format `json|csv|ndjson`, filename, optional `outputVariable`.
- **No new node renderer required** — generic `AbyssNode` covers extraction nodes; only if fancier row rendering is desired later would a custom node component be justified.

Payload builders (`src/components/hooks/payloadBuilders.js`) + locale keys (en/es/fr/pt) + `NODE_OUTPUTS` declarations complete the frontend delta.

---

## 13. Dependency Analysis

| Category | Decision |
|---|---|
| **Reusable (already present)** | `playwright` (locators, frames, storage-state); everything in `apps/backend` runtime; `socket.io`; `cheerio` (transitive, used for download handling — **not required** by the extraction design); `joi` (schemas); zod/AI SDK for AI phases; `papaparse`/CSV **not present in backend**. |
| **May become necessary (evaluate, don't premise)** | A **CSV serializer**: hand-rolled RFC 4180 (pure function, zero deps) is the default; add a lib only if corpus escaping coverage demands it — decision gate in Phase 5 with fixture corpus. LevelDB already used (yjs) — not needed for datasets. |
| **Should NOT be introduced** | A scraping framework (Playwright already headlines), a separate crawler engine, a queue/worker broker (messaging) for MVP, ORM/dataframe libs, headless "cheerio-HTTP" scraping path (contradicts the browser-automation differentiator), CAPTCHA/bypass tooling. |

Dependency-bloat guardrail: the `haltest` npm package must stay self-contained (esbuild bundle; native deps only `better-sqlite3`/`sqlite3`/`playwright`).

---

## 14. Architecture Options and Trade-offs

### Option 1 — Minimal extension (RECOMMENDED for MVP)

Add `extract`, `save_dataset` (+ `dataset` accumulator) as leaf nodes on existing seams; dataset artifact = run-dir file; export via a small pure serializer; security guard added for navigation.

- Complexity: low. Code impact: one plugin (core-data extensions) + schema + frontend editor + serializer + guard.
- Infrastructure impact: none (no new daemons, no new storage backends).
- Scalability: MVP scale (single-digit thousands of records). Cloud: acceptable with SSRF guard + quotas.
- Local/npm: fully compatible (`npx haltest` unchanged).
- Security: extensible — guard is modular; PII redaction reused.
- Maintainability: high (few surfaces). Migration risk: near-zero (additive).

### Option 2 — Extraction subsystem

Dedicated extraction layer: `ExtractionService` + field-map engine + dataset store service, still node-dispatched, plus a `Dataset` SQLite table and streaming writer.

- Complexity: medium. Code impact: new `services/extraction/` module family + DB model/migration + history/API endpoints for dataset retrieval.
- Infrastructure: SQLite schema addition; retention policy for datasets.
- Scalability: supports 10k–100k with streaming; concurrent runs better isolated.
- Cloud: better story (dataset API + download dashboard). Local: still fine.
- Trade-off vs Option 1: more upfront surface; introduces the first "second-class citizen" service explicitly built for extraction; must keep leasing every existing seam (metadata in `step_results` must stay consistent).

### Option 3 — Worker/data pipeline

Extraction workers (extend `WorkerPool` fork pattern) + a dataset job queue + dedicated dataset storage, REST/WS channels for dataset streaming and progress.

- Complexity: high. Code impact: queue runtime, worker lifecycle, inter-process dataset handoff, resource quotas, monitoring.
- Infrastructure: real deployment footprint (multiple processes, possibly S3/Postgres).
- Scalability: the only option plausibly reaching 100k+ concurrent multi-user cloud scraping.
- Local: overkill for single-user; fork workers already exist though (perf-worker) so parts are proven.
- Security: strongest isolation (workers can be sandboxed/egress-restricted) but requires the SSRF/DLP guarantees *before* workers touch arbitrary URLs.
- Maintainability/migration risk: highest; premature given zero measured demand.

### When to move 1 → 2 → 3

Baseline rule: implement **Option 1** for MVP; adopt **Option 2's dataset service/table** when a single run exceeds the memory/`output_data` ceiling measured in the benchmark plan; adopt **Option 3** only when concurrent cloud scraping demand and measured pool saturation justify the queue+workers investment. Each migration is additive (Option 1's node handlers and schema survive untouched).

---

## 15. Decision Matrix (trade-offs — no scores, no overall winner)

| Dimension | Current architecture | Option 1 (minimal ext.) | Option 2 (subsystem) | Option 3 (workers/pipeline) |
|---|---|---|---|---|
| Implementation complexity | — | Low | Medium | High |
| Reuse of current architecture | 100% (baseline) | Near-total; only additive seams | High (services layer added) | Moderate (new runtime) |
| Local execution | Yes | Yes, unchanged | Yes | Yes but heavier |
| Cloud execution | Yes (single monolith) | Yes w/ SSRF guard + quotas | Yes, better dataset API | Yes, most scalable |
| Scalability ceiling | Single event loop + 5-browser pool + SQLite | Same ceiling, streaming adds some | Handles 10k–100k per run | Highest (dedicated workers) |
| Security isolation | Monolith | Same, + navigation guard | Same, + dataset policy | Best (worker sandbox, egress) |
| Dataset handling | None today | Run-dir artifacts + serializer | Dataset table + streaming | Dedicated dataset store |
| Maintainability | — | High (few surfaces) | Medium (new services to steward) | Hardest |
| Compatibility with Automation | — | Preserved | Preserved (metadata contract kept) | Preserved (same flow model) |
| Compatibility with Performance/Security modes | — | Preserved | Preserved | Preserved (fork pattern reused) |
| AI integration | Hooks exist | Straightforward (Phase 6) | Straightforward | More plumbing |
| Auto-healing integration | Hooks exist | Field-level healing reuses `SelectorHealer` | Same | Same, plus worker-local healing state |

---

## 16. Repository File Map (files actually touched in implementation)

Backend:

| File | Current responsibility | Why scraping touches it | Expected change | Risk |
|---|---|---|---|---|
| `apps/backend/services/ExtractionService.js` (new) | — | Field-map → Playwright record extraction (single/repeated), truncation, missing-field accounting | New module | None (additive) |
| `apps/backend/services/exporters/datasetExporter.js` (new) | — | Serialize records → JSON/CSV/NDJSON (pure) | New module | None |
| `apps/backend/plugins/core-data/handlers/extract.js` (new) | — | `extract` node handler wrapping `ExecutionService` `executePlaywrightAction` pattern | New handler | Low |
| `apps/backend/plugins/core-data/handlers/save_dataset.js` (new) | — | Persist accumulated dataset to run-dir artifact + variable | New handler | Low |
| `apps/backend/plugins/core-data/handlers/dataset.js` (new) | — | Accumulator/append (+ dedupe) across loop iterations | New handler | Medium (scope/merge semantics) |
| `apps/backend/plugins/core-data/manifest.json` | Declares node manifest | Register the new types | Edit | Low |
| `apps/backend/plugins/core-data/schemas/extract.js` (new) | — | Joi schema for the field map | New file | Low |
| `apps/backend/controllers/action.controller.js` | Barrel re-export | Add `extractAction`, `saveDatasetAction`, `datasetAction` exports (naming must match `getHandlerName`) | Edit | Medium (dispatch contract, see feasibility §3.3) |
| `apps/backend/routes/api.router.js` | ROUTE_REGISTRY + overrides | Register the three actions | Edit | Medium (same contract) |
| `apps/backend/core/pluginBootstrap.js` | 84 built-in types | Add the new types to `BUILTIN_PLUGINS` (literal import) | Edit | Low |
| `apps/backend/schemas/index.js` | Joi barrel | Re-export new schemas | Edit | Low |
| `apps/backend/plugins/core-navigation/handlers/open_url.js` + schema | Navigation | SSRF guard call-site | Edit | Medium (must not break local interop) |
| `apps/backend/services/navigationGuard.js` (new) | — | Scheme/host/IP/port allow/deny (cloud-mode) | New module | Low |
| `apps/backend/services/ExecutionLogger.js` | Step persistence | (unchanged) bounded `output_data` for extraction steps — policy, not code | Minor | Low |
| `apps/backend/services/VariableManager.js` | Variables | (unchanged) dataset shape in run scope | None | — |
| `apps/backend/services/StorageCleanupService.js` | 72h/100MB retention | Dataset artifact policy distinct from screenshots | Edit (Phase 4+) | Low |
| `apps/backend/database/models/Dataset.js` (new, Phase 3+) | — | Optional queryable dataset table | New model + migration | Low |

Frontend:

| File | Responsibility | Why | Change | Risk |
|---|---|---|---|---|
| `apps/frontend/src/config/validationRules.js` | `NODE_INPUTS` config schema | `extract`, `save_dataset`, `dataset` forms | Add entries | Low |
| `apps/frontend/src/config/nodeConstants.js` | `NODE_CATEGORIES`/`NODE_OUTPUTS` | New `Data` category + output contracts | Add entries | Low |
| `apps/frontend/src/config/iconMap.js` | icon string → lucide | New node icons | Add | Low |
| `apps/frontend/src/components/editors/FieldMapEditor.jsx` (new) | — | Field map config UI | New component | Low |
| `apps/frontend/src/components/editors/index.js` | editor exports | Wire FieldMapEditor | Edit | Low |
| `apps/frontend/src/components/NodeConfigurationPanel.jsx` | renders `NODE_INPUTS` field types | New field type for field-map if needed (or reuse `complex` editor slot) | Edit | Low |
| `apps/frontend/src/components/hooks/payloadBuilders.js` | form → `/actions/:type` payload | Build extract/save_dataset payloads | Add builders | Medium (shape contract) |
| `apps/frontend/src/components/RunHistoryPanel.jsx` | run list | Dataset download button | Edit (Phase 3) | Low |
| `apps/frontend/src/locales/{en,es,fr,pt}.json` | i18n | New labels/fields/hints | Add | Low |
| `apps/frontend/src/utils/datasetUtils.js` (new) | — | Client-side preview/count/dedupe helpers | New | Low |

Tests / CI: backend `__tests__/extraction.test.js`, `__tests__/dataset_accumulator.test.js`, `__tests__/navigation_guard.test.js`, `__tests__/dataset_exporter.test.js`; frontend vitest for `fieldMap` helpers; e2e Playwright flow specs. CI additions are additive.

---

## 17. Architectural Risks (subset specific to architecture decisions)

| Risk | Decision impact |
|---|---|
| Field-map schema (Joi) gets too rigid for `dataset`/nested sources | Keep a per-field `source` enum extensible; `dataset` (data-*) and `count` open the enum without breaking stored configs. |
| Accumulator merge semantics under nested loops + softfail (`continueOnFailure`) | Spell out identity/dedupe key (`records[]` key field optional); test matrix; see implementation plan test section. |
| `output_data` unbounded growth breaks ReportExporter (bases the whole step/history HTML report) | Cap output in `output_data` (count + sample + path); full data only in artifact. ReportExporter must stay green. |
| Backend-to-frontend definitions merge surprises (`updateNodeDefinitions` maps `data → file_data`) | New category should be resolved explicitly via `BACKEND_TO_FRONTEND_CATEGORY`. |
| Shadow DOM / frame field scoping promise risk | Spike-verify before promising; document closed-shadow-DOM as unsupported. |
| SSRF guard vs local-first interop (localhost/Docker/debug Sites) | Guard is cloud-mode-gated (`HALTEST_MODE=cloud`) with allowlist escape hatch; local mode retains existing lenient behavior. |

Full risk + mitigation table: feasibility doc §8. Benchmark plan §2 covers measurement-driven decisions.</think>

<｜DSML｜tool_calls>
<｜DSML｜invoke name="write">
<｜DSML｜parameter name="content" string="true"># HalTest — Web Scraping Implementation Plan

> **Status**: Plan (2026-09-23). Not implemented.
> **Branch**: `spike/web-scraping-feasibility`.
> **Depends on**: `docs/research/web-scraping-feasibility.md` (forensics/security), `docs/research/web-scraping-architecture.md` (design), `docs/research/web-scraping-benchmark-plan.md` (experiments).

Roadmap that takes the recommended architecture (Option 1 — minimal extension, `docs/research/web-scraping-architecture.md` §14) and phases it so the MVP can ship before any AI, healing, streaming, or cloud-scale work is required, and so every phase is independently revertible.

---

## 1. MVP Definition

### 1.1 MVP capabilities

- **`extract` node** (single + repeated mode):
  - field map: field name → `{ source: text | attribute | html, selector (optional, row-scoped), attribute }`
  - repeated via `page.locator(target).all()`/`evaluateAll` (both mechanisms implemented behind a flag for the benchmark; `evaluateAll` default)
  - optional fields (missing → `null`), `ifEmpty: ok|fail|softfail`, per-node timeout, output to run-scoped variable
  - dataset streamed to run-dir artifact as it accumulates (JSON; later CSV/NDJSON) to avoid memory round-trip
- **`save_dataset` node**: persist the accumulated dataset to `${STORAGE_DIR}/runs/{runId}/dataset-{n}.{json|csv|ndjson}`, record `datasetPath` in `step_results.output_data`, expose a user download link in `RunHistoryPanel`
- **dataset accumulator** (`dataset` node / `save_dataset` gather semantics): append + optional dedupe by key field across loop iterations
- **Pagination + infinite scroll** composed from existing `loop`/`conditional`/`wait_visible`/`click`/`scroll` + the accumulator (patterns documented and covered by e2e tests)
- **Authenticated extraction** tested end-to-end against a local login fixture using existing session nodes (no new auth code)
- **JSON + CSV (RFC 4180) + NDJSON** export serializers (hand-rolled, pure, unit-tested)
- **SSRF navigation guard** existing navigation nodes in cloud mode (see §3)
- Deterministic only. No AI. No field-level auto-healing.

### 1.2 Explicitly excluded from MVP

- AI-assisted field detection / schema generation / extraction healing (Phase 6)
- Excel, webhook, API-push, direct-DB exports (Phase 5)
- Streaming dataset to a message queue or external cloud storage (Phase 7)
- 100k-record guarantees, concurrent multi-user cloud scaling, worker-pipeline isolation (Phase 7)
- Shadow-DOM/closed-root extraction promises (spike-gated, §architecture-7)
- Follow-link/auto-crawl; any "scrape this whole site" node
- CAPTCHA/MFA bypass — never in scope, by policy
- Changes to the `e2e`/`performance`/`security` mode architecture or the browser-pool model

### 1.3 Required infra

- Node/backend: ExtractionService, dataset exporter, 3 new handlers + schemas, registration in all 4 seams, navigation guard
- Storage: run-dir artifact path + optional `StorageCleanupService` extension for dataset policy; root `datasets/` dir reuse
- Frontend: `Data` toolbox category, `FieldMapEditor`, dataset preview panel, `save_dataset` form, locale keys
- Tests: unit (extraction/accumulator/exporter/guard), integration (Playwright + extraction), e2e (complete flows), regression, security, and the benchmark harness as a separate `spike/` (see benchmark plan)

---

## 2. Phased Roadmap

### Phase 0 — Architecture hardening (prerequisite, small)

- **Objective**: make the safe foundation changes with zero feature impact; close the two cheap seams the rest depends on.
- **Files**: `apps/backend/services/navigationGuard.js` (new), `apps/backend/plugins/core-navigation/handlers/open_url.js`, schema `plugins/core-navigation/schemas/open_url.js`, `apps/backend/config/` (env validation), `apps/backend/utils/security.js` (extend, keep `isSafePath` intact).
- **API changes**: none public; `open_url` internally validates via guard when `HALTEST_MODE=cloud`.
- **Tests**: `__tests__/navigation_guard.test.js` (scheme/IP/port/allowlist matrix incl. RFC1918, loopback, link-local, cloud metadata `169.254.169.254`), plus existing navigation tests must stay green.
- **Risks**: guard misclassification breaking legitimate local/Docker sites — mitigations: cloud-gated, allowlist env `HALTEST_ALLOWED_NAVIGATION_HOSTS`, exhaustive unit matrix, rollback = disable flag.
- **Rollback**: feature flag off; no schema changes.

### Phase 1 — Extraction primitive (deterministic, single element)

- **Objective**: `extract` with single-result mode; the seed of everything.
- **Files**: `services/ExtractionService.js` (new), `plugins/core-data/handlers/extract.js` (new), `plugins/core-data/schemas/extract.js` (new), `plugins/core-data/manifest.json`, `controllers/action.controller.js`, `routes/api.router.js`, `core/pluginBootstrap.js`, `schemas/index.js`, frontend `validationRules.js`, `nodeConstants.js`, `iconMap.js`, `payloadBuilders.js`, `locales/*`.
- **Changes**: registration in the 4 backend seams + frontend `NODE_INPUTS`/`NODE_OUTPUTS`/i18n; output `{ records, count, fields, missingFields, elapsedMs }` into run-scope + `step_results.output_data`.
- **Tests**: `__tests__/extraction.test.js` (0/1/many elements, missing/optional fields, ifEmpty matrix); integration test spins a local HTML fixture page and extracts.
- **Risks**: seam inconsistency → forced by a unit test that asserts `getHandlerName(type)` resolves to an exported handler. Rollback: unregister node type, remove exports.

### Phase 2 — Repeated element extraction

- **Objective**: repeated mode + both Playwright mechanisms (`all()`+per-row vs single `evaluateAll`) behind a runtime flag for benchmark; dedupe-free accumulate-into-variable.
- **Files**: `ExtractionService.js` (repeated path), `extract.js` handler, frontend field-map editor (`FieldMapEditor.jsx`), `validationRules.js` (repeated toggle + row-scoping fields).
- **Tests**: repeated fixtures (10, 1_000, 10_000 rows in the benchmark); dynamic-DOM refresh between extractions.
- **Risks**: memory from large in-memory arrays → cap + artifact spill (Phase 3 dependency; until then hard cap with warning).
- **Rollback**: keep server-side only; frontend editor non-breaking.

### Phase 3 — Dataset accumulator + artifact persistence

- **Objective**: the accumulator (`dataset`/gather semantics) + streaming JSON artifact in the run dir; bounded `output_data`.
- **Files**: `plugins/core-data/handlers/dataset.js` + `save_dataset.js` (new), `Exporters/datasetExporter.js` (new, JSON first), `ExecutionService.js` (no change; accumulation handled in handler via run-scope record), `VariableManager.js` (no change; append via expression), frontend `RunHistoryPanel.jsx` (+download button via existing `api.download`), nodeConstants/payloadBuilders/locales.
- **Changes**: `step_results.output_data` for extraction steps becomes `{ count, sample[], datasetPath }` (bounded); full data on disk.
- **Tests**: accumulator correctness (`__tests__/dataset_accumulator.test.js` — append, dedupe key, nested-loop identity, softfail), artifact persistence + cleanup (`__tests__/dataset_persistence.test.js`), history evidence endpoint for dataset files.
- **Risks**: `ReportExporter` (bases step output into HTML) must handle bounded output; test it. Rollback: artifact writing flag.

### Phase 4 — Pagination & composite patterns (no new engine)

- **Objective**: prove + document the composed flows (pagination, infinite scroll) with e2e tests against fixture sites; anything this phase reveals is fed back into Phases 2–3.
- **Files**: mostly tests + docs; possibly minor wait/scroll tweaks surfaced by the benchmarks.
- **Tests**: e2e pagination (loop + extract + click next + conditional break), infinite scroll (scroll + wait + extract + dedupe break), authenticated login fixture flows.

### Phase 5 — Export

- **Objective**: CSV (RFC 4180) + NDJSON serializers, unified `save_dataset` format select, CSV escaping fixture corpus.
- **Files**: `datasetExporter.js` (csv/ndjson), `save_dataset` handler + schema + frontend format select, locales.
- **Tests**: `__tests__/dataset_exporter.test.js` (quoting: commas/newlines/quotes/unicode/CRLF round-trip parse-in (frontend) / parse-out).
- **Decision gate**: hand-rolled CSV stays unless a defined escaping-corpus case fails (then evaluate a library — decision, not default).
- **Rollback**: format flag.

### Phase 6 — AI-assisted extraction + extraction healing

- **Objective**: NL → field-map proposal; field-detection; field-selector healing reusing `SelectorHealer` tiers with row-scope awareness; **no silent dataset writes** (verification + confidence + user confirmation).
- **Files**: `services/AIService.js` (add `suggestExtractionSchema`), `ExtractionService.js` (heal integration), `AITaskOptimizer` reuse, `ExperienceVault` field-aware keys, frontend AI proposal panel, locales.
- **Tests**: proposal→verification recall/precision harness (mirror the healing empirical harness), confirmation UX test, healing false-positive audit test.
- **Risks**: healing mis-extraction → confidence thresholds + HUMAN_REVIEW tier (reuse `DecisionPolicy` semantics), never auto-apply dataset-affecting heals.

### Phase 7 — Cloud scalability (post-benchmark)

- **Objective**: whatever the benchmark plan proves necessary — streaming, per-run record budgets, retention policy for datasets, optional `Dataset` DB table, per-user quotas; re-evaluate Option 3 (workers) only on measured demand.
- **Files**: `database/models/Dataset.js` + migration (optional), `StorageCleanupService` dataset policy, `run.controller.js` quotas, docs.

---

## 3. Security Controls (must precede cloud exposure)

Delivered in Phase 0/1, enforced before any hosted scraping is reachable:

1. Navigation SSRF guard: scheme/host/IP/port validation; deny loopback/RFC1918/link-local/metadata in `HALTEST_MODE=cloud`; allowlist `HALTEST_ALLOWED_NAVIGATION_HOSTS`; local-mode lenient.
2. Dataset guards: per-run record/size budget (defaulted, env-tunable); dataset artifact retention policy distinct from screenshots; PII acknowledgment copy in export.
3. Extraction output redaction: never store auth headers/cookies/passwords in `output_data`/logs; wire the existing data-leak engine where sensitive fields are configured.
4. Rate/quotas: mount a per-user extraction job limiter (existing unmounted `heavyTaskLimiter` is the seed).
5. Socket `origin` policy tightened (documented; out-of-scope for scraping but a precondition noted for cloud).
6. No bypass mechanisms ever introduced (§architecture-8 posture). Unattended flows into CAPTCHA/MFA sites are documented as unsupported, softly-failing, and operator-resolved.

---

## 4. Testing Strategy

| Layer | Scope | Files |
|---|---|---|
| Unit | ExtractionService (single/repeated, field semantics, ifEmpty, truncation), accumulator (append/dedupe/nested-loop), exporters (json/csv/ndjson escaping corpus), navigation guard matrix, Joi schemas | `apps/backend/__tests__/extraction.test.js`, `dataset_accumulator.test.js`, `dataset_exporter.test.js`, `navigation_guard.test.js` |
| Integration | Real Playwright chromium against local fixture pages (static, dynamic/JS-rendered, iframe, login form); verify locator mechanisms against fixture | `apps/backend/__tests__/e2e/extraction.e2e.test.js` |
| E2E | Full flows: login→navigate→extract repeated→pagination loop→save dataset→download; infinite scroll with dedupe; artifact + history evidence | `apps/frontend/playwright.config.ts` specs (new `e2e/scraping.spec.ts`) |
| Regression | All existing suites must stay green: backend `pnpm test` (92 files), frontend vitest, existing e2e specs; ReportExporter with bounded `output_data` | existing |
| Performance | The benchmark plan (separate spike repo/script) — extraction throughput, memory, CPU, browser stability, dataset size per record-count tier | `docs/research/web-scraping-benchmark-plan.md` |
| Security | SSRF matrix, path-traversal on dataset export (`isSafePath`), redaction of sensitive fields, quota enforcement | `__tests__/navigation_guard.test.js`, `dataset_security.test.js` |
| Failure | missing selector, empty results (`ifEmpty`), changed DOM, browser crash (abort → run cancels), timeout (per-node 30s), network failure, pagination next-missing → break; partial extraction with some null fields | unit + integration + e2e failure specs |

---

## 5. Migration and Rollback Considerations

- **No production code changes before Phase 0 groundbreaking**, and even then only additive + flag-gated.
- Every phase is a separate, revertible unit (feature flag or additive module); nothing existing is modified structurally.
- The four registration seams must be modified as a set with the dispatch-contract unit test guarding them (feasibility §3.3).
- Artifact/dataset files live inside run dirs already handled by `deleteRun`/`clearHistory`/`StorageCleanupService`; dataset retention policy changes are additive.
- If a schema migration is introduced later (Phase 7 optional `Dataset` table), follow the existing `database/migrations/` convention with a forward migration + documented rollback (existing `migrate.js` runner).

---

## 6. Exit Criteria (run after each phase)

- Backend suite green: `cd apps/backend && pnpm test`.
- Frontend suite green: `cd apps/frontend && pnpm test`; lint clean.
- E2E scraping specs green on CI (single worker, existing `forbidOnly`/retry config).
- Benchmark harness (Phase 1 start) records baseline numbers; no fabricated results anywhere.
- Dispatch-contract test green (each new type resolves + validates from all four seams).
- Navigation guard unit matrix green; local-mode behavior unchanged tests.