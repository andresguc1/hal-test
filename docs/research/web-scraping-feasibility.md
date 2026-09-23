# HalTest — Web Scraping / Data Extraction Feasibility Research

> **Status**: Research complete (2026-09-23). No production code modified.
> **Branch**: `spike/web-scraping-feasibility` — do not merge to `main` without explicit approval.
> **Scope**: Determine whether HalTest's existing architecture can support Web Scraping / Data Extraction as a first-class capability, without a separate scraping engine and without compromising the existing Automation, Performance, Security, AI, execution-history and infrastructure architecture.
> **Companion documents**: `docs/research/web-scraping-architecture.md` (architecture), `docs/research/web-scraping-implementation-plan.md` (roadmap), `docs/research/web-scraping-benchmark-plan.md` (experiments).

---

## 1. Executive Summary

HalTest is a local-first browser automation platform built around a visual flow/canvas model, Playwright execution, SQLite persistence, and an optional AI layer. The repository forensics in this document trace the complete execution path from canvas to Playwright and back, and evaluate every subsystem the product spec asked about (frontend, backend, execution engine, node model, flow/composite model, persistence, history, artifacts, import/export, AI, auto-healing, API, local/npm/cloud distribution, concurrency, storage, security, scalability).

**Verdict: Web Scraping / Data Extraction is technically feasible with the current HalTest architecture, without a separate scraping engine.**

The extraction capability should be modeled as **a new "Data" node category built on the existing node-registry/plugin seams** (architecture Option A in `docs/research/web-scraping-architecture.md`):
- `extract` — extract a single element or repeated elements as structured records.
- `save_dataset` / `export_data` — persist an execution-scoped dataset to an artifact (JSON / CSV / NDJSON) and/or a variable.
- Reuse of existing `loop`, `conditional`, `wait_visible`, `click`, session and component primitives for pagination, infinite scroll and authenticated scraping.

Roughly **all of the execution machinery is reusable** (browser lifecycle, node dispatch, variable scoping, step/history persistence, sockets, artifact storage, retention, cancel/abort, batch and dataset-batch runners, auto-healing, AI). The **genuinely new pieces** are small and well-bounded: (1) an extraction handler that uses Playwright's `locator.all()` / `evaluateAll` for repeated elements and per-field extraction, (2) a dataset accumulator to append records across loop iterations (pagination / infinite scroll), (3) dataset persistence + export serialization (no backend CSV serializer exists today), and (4) security controls — most importantly an SSRF protection layer over URL navigation in cloud mode.

The report deliberately avoids inventing a numeric reuse percentage (there is no measurement harness for such a figure) and instead of faked numbers the resource/scalability section identifies the concrete bottlenecks and the benchmark protocol that must be run in `spike` form before implementation.

---

## 2. Core Research Question

> Can HalTest's current architecture support Web Scraping as a first-class capability without creating a separate scraping engine or significantly compromising the existing Automation, Performance, Security, AI, execution, history, and infrastructure architecture?

**Answer: Yes.**

- **No separate engine required.** Extraction is a node execution concern. Nodes are dispatched in-process through a plugin handler resolved by a `getHandlerName(nodeType)` mapping (`apps/backend/services/ExecutionService.js`). A new `extract` node type slots into the exact same seams every existing Playwright node uses.
- **Repeated-element / structured extraction uses Playwright itself**, not a new parser: `page.locator(css).all()` / `Locator.evaluateAll` are supported by the already-pinned Playwright dependency. No cheerio/parsing engine is needed (cheerio is already a transitive backend dep for download handling but is not required for the design).
- **Pagination and infinite scroll compose from existing nodes** (`loop`, `for_each`, `conditional`, `wait_visible`, `scroll`, `click`) plus one new primitive: a dataset accumulator/append node.
- **History, artifacts, retention, sockets, cancel, batch, dataset-batch, healing and AI all transfer without modification.**

The constraint to respect is the inverse: adding scraping must not weaken existing invariants. The invariants and the risks to them are documented in the Security and Resource sections below.

---

## 3. Repository Forensics

### 3.1 Monorepo layout

HalTest is a `pnpm` (9.15.4) + Turbo monorepo. Version 1.0.71.

| Path | Responsibility |
|---|---|
| `apps/backend/` | Express API, Playwright execution engine, SQLite persistence, AI, sockets, plugins. Port `PORT \|\| 2001`. |
| `apps/frontend/` | React 19 + `@xyflow/react` (React Flow v12) visual studio. Zustand + TanStack Query. |
| `apps/web/` | Landing/marketing SPA (built separately; not execution-relevant). |
| `apps/cli/` | Publishes npm package **`haltest`**; bundles the whole backend via esbuild into `dist/backend/app.js`; `npx haltest` boots the full server locally. |
| `apps/blog/` | Marketing blog (Astro). Not execution-relevant. |
| `research/`, `docs/research/` | Prior spikes and research (Jev healing, assertion engine, canvas layout). |
| `storage/` | Repo-root dir with only stray test files — **not** the runtime store. |

Runtime storage root: `${STORAGE_DIR}` = `$HALTEST_HOME` else `~/.haltest` (`apps/backend/config/paths.js`). Observed contents: `database.sqlite`, `backups/`, `datasets/`, `golden-datasets/`, `logs/`, `models/`, `plugins/`, `projects/`, `runs/`, `yjs-docs/`, `secure_keys.json`.

### 3.2 The real execution path (traced)

```
Canvas (React Flow, apps/frontend/src/App.jsx)
  ↓ nodes/edges + configuration (data.configuration)
Flow state  (hooks/flow/useFlowState.js; Yjs bridge useCRDTNodes/useCRDTEdges in collaboration mode)
  ↓ execution request
useFlowExecution.js → POST /runs/start  (routes/run.router.js → controllers/run.controller.js)
  ↓
ExecutionService.executeFlow(flowId, projectId, {nodes, edges snapshot or flowId})
  (apps/backend/services/ExecutionService.js:39)
  ↓ validateGraph, topological runSequence, propagateSkip
executionManager.execute(mode, ...)   (services/ExecutionManager.js: mode = e2e|performance|security)
  ↓ per node
executeNode(node, allNodes, allEdges, state)   (ExecutionService.js:1044)
  ↓ handlerName = getHandlerName(nodeType)      (ExecutionService.js:2399)
handler = actions[handlerName]                   (in-process dispatch; mock req/res wrapper)
  ↓ shared wrapper
executePlaywrightAction(req, res, actionName, fn)  (core/ActionExecutor.js)
  ⇒ auto-healing, selector healing, tracing, screenshots, variable seeding
  ↓
browser/session
  BrowserManager (services/browser.service.js, HAL_MAX_BROWSERS=5, session registry, context pool)
  core/browser-utils.js (validateBrowser, getOrCreateContext, getActivePage, createIsolatedContext)
  ↓
Playwright page (page.goto / page.locator / page.$eval / ...)
  ↓ result
res.json({ success, status, message, nodeId, ...data })  → withSocketStatus wrapper (routes/api.router.js)
  ↓
VariableManager.storeNodeResult(nodeId, names, result, runId)   (services/VariableManager.js)
  → run-scoped in-memory scope (runs[runId]), ${nodeId}.result + label aliases
  ↓
ExecutionLogger.logStep(...)   (services/ExecutionLogger.js)
  → step_results row (input_data/output_data JSON, error, screenshot_path, duration, video_timestamp, ai_diagnosis)
  → screenshots/video under ${STORAGE_RUNS_DIR}/{runId}/
  ↓
socket.js emitters: execution-status, edge-status, execution-log, flow-finished, variable-change, step_screenshot_ready
  ↓
Frontend: step results streamed live; RunHistoryPanel/ReportDashboard replay afterwards
```

Node dispatch is **in-process**, not HTTP (the mock `req`/`res` in `executeNode` capture `res.json` into `resultData`). Loops/`for_each` run isolated child scopes `${runId}_loop_${nodeId}_${i}`; composite `component` nodes are resolved by `core/FlowResolver.js` and run in a child `childRunId` scope.

### 3.3 Node registry and registration surfaces

Registering a node type touches **four backend surfaces** plus the frontend. This is the single most important mechanic for the scraping feature:

1. `apps/backend/core/pluginBootstrap.js` — `BUILTIN_PLUGINS` array of **84 node types** across 13 plugin categories (`core-ai, core-assertion, core-browser, core-capture, core-data, core-flow-control, core-interaction, core-navigation, core-network, core-security, core-session, core-testing, core-wait`). Static `import()` calls are bundled for the npm CLI package (esbuild literal constraint).
2. `apps/backend/controllers/action.controller.js` — barrel re-export of every plugin handler as `${camelCase}Action` (lines ~196–303). The name must match the `getHandlerName` mapping.
3. `apps/backend/routes/api.router.js` — `ROUTE_REGISTRY` (~110 entries) + `ACTION_NAME_OVERRIDES` + `toActionName()`; dynamic `router.post('/actions/<type>', validate(schema), withSocketStatus(actionHandler))`.
4. `apps/backend/schemas/index.js` — Joi schema barrel, one `schemas/<type>/body.js` per node.

Frontend: `NODE_TYPE_MAP`/`NODE_CATEGORIES` in `apps/frontend/src/config/nodeConstants.js` (auto-merged from backend `/nodes/definitions` via `useNodeDefinitions.js` → `updateNodeDefinitions`); unknown node types render automatically through the generic `AbyssNode`; config forms are declared in `NODE_INPUTS` (`src/config/validationRules.js`); outputs declared in `NODE_OUTPUTS`; labels in `src/locales/{en,es,fr,pt}.json`.

> **Known naming inconsistency to respect**: the core-data plugin registers `read_file / write_file / download_file` while the barrel/registry use `read_data / save_results / handle_downloads`. `ACTION_NAME_OVERRIDES` bridges the HTTP layer but `getHandlerName` does **not** include those overrides, so a node typed `read_file` executed through `executeNode` resolves `readFileAction` and throws. Any new scraping node must be consistent across all four surfaces.

### 3.4 Persistence and history model

Database: SQLite via Sequelize (driver `sqlite3`); Postgres possible via `DATABASE_URL`. Models registered in `apps/backend/database/init.js`, migrations in `database/migrations/`.

| Table | Relevance to scraping |
|---|---|
| `flows`, `nodes`, `edges`, `projects`, `canvases`, `users` | Flow topology; node config lives in `Nodes.data` JSON. |
| `execution_runs` | One row per run: status, `flow_snapshot` JSON, `video_path`/`video_status`, `total_healed`. |
| `step_results` | **Per-node outcome** with `input_data`/`output_data` JSON — the natural place for per-node extraction output and the model already handles loops/composites via `compositeNodeId`/`subflowId`/`parentNodeId`. |
| `healing_logs` | Per-run healing telemetry. |
| `experience_vault` | Selector memory (future extraction healing). |
| `ai_usage_log` | AI token/latency telemetry. |
| `security_compliance_*` | Security runs (DAST). |

Run-scoped variables are in-memory only (`VariableManager`, `MAX_CONCURRENT_SCOPES=200`, globals persist to `global_variables.json`); per-node results persist via `ExecutionLogger`. Run artifact directory: `${STORAGE_DIR}/runs/{runId}/` (screenshots, `execution.webm`, `report_*.html`). Retention: `StorageCleanupService` deletes oldest runs >72h or >100MB total.

### 3.5 Infrastructure

- **Docker**: multi-stage; runner stage `mcr.microsoft.com/playwright:v1.62.1-jammy`, `CMD pnpm start` → `node apps/backend/app.js`, `EXPOSE 2001`. `docker-compose.yml` mounts a named volume at `/app/apps/backend/storage`; **no ports mapping, no healthcheck, no resource limits** in the committed file.
- **npm distribution**: `npx haltest` bundles and boots the whole backend+frontend locally; `npx haltest cli run <flowId>` executes against a server (`HALTEST_API_URL`). Release via `.github/workflows/release.yml` (OIDC trusted publishing, clean-room test, Render staging/prod, auto-rollback).
- **Cloud**: Render (free-plan monoliths), `HALTEST_MODE=cloud`, Supabase JWT auth (`middlewares/auth.middleware.js`, with hardcoded guest bypasses), **no cloud object storage** (local disk/SQLite/volume), **no message queues** (only a fork-based perf-worker pool, concurrency 3).
- **Sockets**: Socket.io `origin: '*'`, plus a Yjs WebSocket collab server (`/collab/:flowId`) gated on `COLLAB_ENABLED`.
- **Env vars**: `PORT`, `NODE_ENV`, `DATABASE_URL`, `HALTEST_HOME`, `STORAGE_RUNS_DIR`, `HAL_MAX_BROWSERS` (default 5), `HAL_MAX_SCOPES` (200), `HALTEST_MODE`, `AUTH_ENABLED`, Supabase vars, `HALTEST_MASTER_ENCRYPTION_KEY`, `ALLOWED_ORIGINS`, `HALTEST_ALLOWED_AI_BASE_URLS`, AI provider keys, `PLAYWRIGHT_BROWSERS_PATH`, `LIGHTPANDA_ENDPOINT`, `HALTEST_SELF_HEALING_MODE`, etc.

### 3.6 Existing "extraction-adjacent" capabilities (inventory)

| Capability | Location | What exists today | Gap for scraping |
|---|---|---|---|
| DOM extraction | `plugins/core-ai/handlers/extract_dom_context.js` | selector-scoped `text` / `html` / `markdown`, optional AI clean, stores to variable | Single element only; no attribute/list/table |
| read data | `plugins/core-data/handlers/read_data.js` | `page.textContent` / `innerHTML` for one selector | Attribute branch unimplemented; single element |
| save results | `plugins/core-data/handlers/save_results.js` | Writes string/JSON to a path (path-guarded by `isSafePath`) | CSV/Excel *declared in schema, not implemented*; no dataset notion |
| downloads | `plugins/core-data/handlers/handle_downloads.js` | Download handling | — |
| save DOM | `plugins/core-capture/handlers/save_dom.js` | Full/element HTML to disk/variable | Raw HTML, not structured |
| LLM data gen | `plugins/core-ai/handlers/generate_data.js` | Zod-schema structured `json/csv/text` generation | Generation, not extraction |
| Dataset-batch runs | `services/TestRunnerService.js` `runDatasetBatch` + `controllers/run.controller.js` | CSV/JSON input → per-row flow execution (concurrency) | Reverse direction (extract → dataset) |
| Loops/forEach | `ExecutionService` `executeLoopContainer`/`executeForEachContainer` | Isolated scopes, break/continue/return | No dataset accumulator across iterations |
| Legacy `extract_text` | Frontend `components/hooks/constants.js` + locales | Legacy node label/config | Not registered in `NODE_CATEGORIES` — a candidate to revive |
| DB read | `core-data` `db_query` | SQLite query node | Unrelated to DOM extraction |

---

## 4. Reusable Infrastructure (verified)

The following subsystems transfer to scraping **without modification**:

1. **Node dispatch + plugin seams** — `ExecutionService`, `NodeRegistry`, `pluginBootstrap`, `ActionRouter`, `ActionExecutor`, barrel/schema/route registration.
2. **Browser lifecycle & session management** — `BrowserManager` (pool, session registry, idle GC, slot queue), `core/browser-utils.js` (`getOrCreateContext`, `createIsolatedContext`, `getActivePage`, network presets, dialog and security listeners, `fetchContext` for AI).
3. **Playwright itself** — pinned version supports `locator.all()`, `evaluateAll`, frames, shadow DOM querying, storage-state/cookie management.
4. **Flow/composite/loop machinery** — `loop`, `for_each`, `component`, `conditional`, `switch`, `variable`, `transform`, `input`/`output`; `FlowResolver`.
5. **Run lifecycle** — `ExecutionLogger` (start/logStep/end), `ActiveRunManager` (AbortController cancel), `ExecutionLock`, `TestRunnerService` batch/dataset-batch, `WorkerPool`.
6. **Step/history persistence** — `step_results` rows with `output_data` JSON; run-dir artifacts; socket streaming; `RunHistoryPanel`/`ReportDashboard` replay/evidence.
7. **Artifacts + retention** — screenshots/reports in run dir, evidence endpoints, `StorageCleanupService`, `ReportExporter`.
8. **Security primitives** — `isSafePath`, data-leak engine (core-security), DOM protection, terminal allowlist, rate limiter, Helmet.
9. **AI + auto-healing** — `SelectorHealer` (deterministic tier + 3 AI tiers + confidence policy), `SelectorRanker`, `AIService.generateStructured` (json/csv/text), `AITaskOptimizer`, `AIUsageLog`.
10. **Import/export of flows** — flow JSON, `.hal.zip` packages, code generators (Playwright/Cypress/Selenium) — extraction nodes will flow through these with no change.

---

## 5. Missing Capabilities (gap list)

| # | Gap | Where it must be built | Severity for MVP |
|---|---|---|---|
| G1 | Structured field + repeated-element extraction node (`extract` / `extract_list`) | New plugin handler in a new or existing plugin (`core-data`) + schema + frontend `NODE_INPUTS`/`NODE_OUTPUTS`/i18n | **Required** |
| G2 | Dataset accumulator: merge rows across repeated extractions (pagination/infinite scroll) | New execution primitive (`append`/accumulator) or `transform`-based merge on run-scope variables | **Required** |
| G3 | Dataset artifact persistence + JSON/CSV/NDJSON serialization | New persistence path under run dir + serializer (backend has no CSV serializer today) | **Required** (MVP: JSON + CSV) |
| G4 | Attribute extraction (`href`, `src`, `data-*`) on extraction fields | Part of the `extract` node handler | **Required** |
| G5 | Extraction UX: field mapping editor, dataset preview panel | Frontend `editors/*` + panel components | Required for UX completeness; can be minimal |
| G6 | SSRF/URL-safety layer for navigation in cloud mode | Backend middleware/service over `open_url` and any new nav node | **Required before cloud exposure** |
| G7 | Dataset size/retention policy for extraction artifacts (100k records) | Storage policy (separate from screenshot retention) or streaming | Post-MVP / Phase 7 |
| G8 | CSV parser/serializer dependency (or hand-rolled) | Backend dependency decision | Only needed after MVP(JSON) unless CSV in MVP |
| G9 | Healing/AI for extraction selectors (field-level) | Reuse `SelectorHealer` + `ExperienceVault` with field awareness | Post-MVP (Phase 6) |

---

## 6. Security Analysis

Security is treated as a **first-class architectural concern**, not an afterthought.

### 6.1 Current posture (verified)

| Area | Current state | Risk to scraping |
|---|---|---|
| **SSRF** | `open_url` schema only enforces `Joi.string().uri()` (`plugins/core-navigation/schemas/open_url.js`). No host/IP/port allowlist anywhere for browser navigation. SSRF guards exist **only** for AI base URLs (`routes/ai.routes.js` `sanitizeBaseUrl`, loopback + `HALTEST_ALLOWED_AI_BASE_URLS`). | **Critical.** In cloud mode an authenticated user can drive the hosted browser to cloud metadata endpoints, internal services, localhost, LAN hosts. |
| **CSP** | `connectSrc` allows `http:, https:, ws:, wss:`; `scriptSrc 'unsafe-inline'` (needed for the built Vite app). | Weak; scraping raises exfil surface. |
| **Socket.io** | `origin: '*'`. | Unauthenticated socket origin; server emits per-run data. |
| **CORS** | Allowlist via `origin.startsWith(allowed)` + private/LAN origin bypass. | Lookalike origins pass. |
| **Auth** | Supabase JWT; hardcoded guest bypasses (`local-guest-token`, etc.); absent-token falls through to guest. | Per-user isolation is weak in default local mode by design. |
| **Path traversal** | `isSafePath` used by `save_results`, evidence endpoints. | Reuse for dataset export paths. |
| **Rate limiting** | `apiLimiter` 2000/15min/IP on `/api`; `heavyTaskLimiter` (10/h) exported but **not mounted**. | Extraction jobs need their own throttle. |
| **PII** | Data-leak engine (`core-security`) scans extracted content; `TerminalService` strips secrets from child env. | PII may pass through `step_results.output_data`, run-dir artifacts, `global_variables.json`, yjs-docs. |
| **Script execution** | `execute_js` runs page-side JS (client-side to target), not server-side arbitrary code. `TerminalService` narrowed to Playwright commands. | Keep it that way. |

### 6.2 Protections required before scraping is exposed (esp. cloud)

1. **Navigation SSRF guard** (blocker for cloud): validate scheme/host/IP/port on any URL the browser navigates to; deny loopback, link-local, RFC1918 and cloud-metadata ranges unless the operator opts out via an allowlist (mirror the `HALTEST_ALLOWED_AI_BASE_URLS` pattern with e.g. `HALTEST_ALLOWED_NAVIGATION_HOSTS`, default-off in cloud). Applies to `open_url` and to any future follow-link concept.
2. **Dataset guards**: per-dataset record/size caps, stored dataset retention policy, and explicit "contains PII" acknowledgment in the export UX.
3. **Rate/quotas**: per-user extraction job throttling (reuse the unmounted `heavyTaskLimiter` or add a job-limit service) and a per-run record budget.
4. **Credential hygiene**: existing `KeyVaultService` + encrypted storage must remain the only place cookies/tokens for scraping sessions live; never persist raw auth headers/cookies into `step_results.output_data` or logs (add field-level redaction for extraction results).
5. **No bypass tooling**: CAPTCHA/MFA/bot-detection handling is documented as *limitations and operator responsibility* only — no bypass mechanisms are designed anywhere.
6. **Network-level posture** for cloud workers (documented in DOCKER.md recommendations, currently not enforced in the committed compose file): resource limits, network isolation, egress restriction.

---

## 7. Resource and Scalability Analysis

### 7.1 Current execution capacity (facts, no invented numbers)

- **Synchronous, in-process node dispatch** — one JS event loop per run; memory is flat across a flow's variable scopes and `step_results` payloads.
- **Browser pool** capped at `HAL_MAX_BROWSERS = 5`, slot-acquire timeout 30s, idle GC 2 min.
- **SQLite single-writer**; `step_results.output_data` rows carry JSON payloads per node; run-scoped variables live in memory only.
- **Per-node timeout** `DEFAULT_NODE_TIMEOUT_MS = 30_000`.
- **Run-dir retention** 72h / 100MB (oldest-first). A 100k-record dataset as JSON can exceed multiple hundreds of MB — this cap interacts badly with large extraction runs.
- **Body limit** 50MB (import/upload); **no cloud object storage**; **no message queue**; fork-based perf-worker pool at concurrency 3.
- **Workers**: zero queueing for scraping today. Concurrent scraping = concurrent `executeFlow`, all hitting the same Node process, SQLite, and browser pool.

### 7.2 Why each surface constrains scraping

| Size | Dominant concern | Implication |
|---|---|---|
| 100 records | `step_results.output_data` JSON per node; run scope variable | Fine today. |
| 1,000 records | Memory per run scope; socket/`output_data` payloads | Likely fine; measure. |
| 10,000 records | `output_data` size + run-dir artifact + SQLite write path | Borderline; dataset must be **streamed to artifact**, not round-tripped through variables/`output_data`. |
| 100,000 records | Memory + disk + retention + single-event-loop CPU + browser stability | Exceeds current architecture; needs streaming dataset + dedicated worker path + retention policy adjustment (Phase 7). |

**Architectural bottlenecks to benchmark** (see `web-scraping-benchmark-plan.md`): per-record extraction latency (evaluateAll vs per-locator loop), `output_data` serialization cost, SQLite insert path, browser memory growth across iterations, memory growth of run-scoped variables, retention eviction, socket event volume (per-node events vs batched dataset events), and CPU under concurrent runs at pool saturation.

### 7.3 Concurrency

Concurrent jobs (`User A 5k`, `User B 20k`, `User C 1k`) today serialize against the 5-browser pool + single SQLite writer + single event loop. MVP at local scale is fine; cloud-scale scraping needs one of: browser-per-worker isolation (Phase 7), a real job queue, dataset artifact streaming, and per-user quotas. The fork-perf-worker pool (`WorkerPool.js`) is the closest existing building block and can be extended rather than discarded.

---

## 8. Risks and Mitigations (top architectural risks)

| Risk | Severity | Mitigation |
|---|---|---|
| SSRF / malicious navigation via extracted links | **Critical** | Navigation SSRF guard (§6.2.1) before cloud exposure; never auto-follow extracted URLs without an explicit user-built link node and validation. |
| Memory blow-up from large datasets (run scope + `output_data`) | High | Stream datasets to run-dir artifacts; cap per-node `output_data` size; separate dataset persistence from step payload. |
| Browser instability on long pagination/infinite-scroll runs | High | New-page/restart policies per N pages; existing session/cleanup primitives; timeout plumbing. |
| SQLite single-writer contention under concurrent extraction runs | Medium/High | Serialize dataset writes; document concurrency ceiling; evaluate Postgres (`DATABASE_URL`) for cloud. |
| Retention eviction of dataset artifacts (72h/100MB) | High for reproducibility | Dedicated dataset retention policy distinct from screenshot retention; export-to-user CSV/JSON is the durable contract. |
| Backward compatibility of registration seams (the `read_file`/`read_data` inconsistency) | Medium | New nodes must be consistent across all four surfaces; unit test the dispatch contract. |
| `step_results.output_data` schema bloat breaking history replay / report export | Medium | Keep `output_data` bounded (e.g. record count + first-N sample + artifact path), not the full dataset. |
| Auto-healing applied to extraction selectors causing silent mis-extraction | Medium | Field-level healing with confidence thresholds + user visibility; healing should not auto-write dataset fields without confirmation (mirrors existing HealingLog/`auto_healing_update` flow). |
| npm packaging weight if a CSV/data lib is added | Low | Evaluate hand-rolled CSV serializer (RFC 4180) first; keep `haltest` package self-contained. |
| Composite/subflow parameter explosion | Low | No new composite machinery needed; extraction is leaf nodes. |
| AI dependency creep | Low | MVP is deterministic-only; AI is additive (see `web-scraping-architecture.md` §10). |

---

## 9. Open Questions Requiring Experiments

Enumerated here; protocol in `docs/research/web-scraping-benchmark-plan.md`.

1. **Per-record extraction cost**: `page.locator(sel).all()` + per-handle `evaluateAll` vs one `evaluateAll` returning all fields at once — does the latter hold for 10k+ nodes?
2. **`output_data` ceiling**: at what record count does persisting full extraction output into `step_results.output_data` break history/render/report export?
3. **Browser lifecycle for long runs**: does a single page hold up through 20–200 pagination iterations (memory growth, session loss)? When is restart-on-new-page needed?
4. **Concurrent scraping ceiling**: what degrades first at pool saturation — browser slots, SQLite writes, event-loop CPU, or socket event volume?
5. **Dataset append semantics**: correctness of the accumulator under `for_each` + nested loops + `continueOnFailure`.
6. **Precision of extraction auto-healing**: field-level healing recall/precision vs deterministic; require confidence calibration (reuse `hsa`/`SelectorRanker` empirical harness approach).
7. **CSV correctness**: quoting/escaping for real-world scraped text (commas, newlines, quotes) — verify hand-rolled serializer vs adding a dependency.
8. **SSRF guard parity**: does the navigation guard break any existing user flows (local dev on localhost, Docker volume of sites)? Test local mode bypass only.

---

## 10. Technical Feasibility Conclusion

1. **Feasible?** Yes — with the current architecture, as a new "Data" node family on the existing plugin/registry/execution seams. No separate scraping engine, no replacement of browser automation with HTTP scraping, no compromise to the existing mode architecture (e2e/performance/security all house extraction naturally).
2. **Reuse %?** No quantitative percentage is reported because no harness exists to measure it, and inventing one would be misleading. Qualitatively: **execution engine, browser lifecycle, node registry/dispatch, run lifecycle, history/step persistence, artifacts/retention, sockets, composite/loop machinery, import/export, AI and auto-healing are essentially 100% reusable.** The genuinely new code is bounded to: extraction handler(s), a dataset accumulator, dataset artifact serialization, extraction UX (schema editor + preview), and a navigation-SSRF guard. Measured-by-LOC estimates belong to the implementation phase, not this research.
3. **Architectural changes required**: an extraction service module + accumulator + dataset persistence path + security guard + UX panels. All additive; none refactor existing architecture.
4. **What should NOT change**: the in-process node dispatch contract, the plugin registration surfaces, the browser pool/session model, the run/step/artifact model, variable scoping, healing/AI pipelines, import/export formats.
5. **MVP** (see implementation plan): `extract` (field map: text/attribute/html + repeated elements via `locator.all()`), dataset accumulator, JSON + CSV export to run-dir artifact + variable, pagination via existing loop nodes, session reuse. No AI, no auto-healing for fields, no cloud hardening beyond baseline.
6. **Remaining hard problems**: 100k-record datasets (needs streaming + dedicated worker path), SSRF-first cloud exposure, dataset retention/reproducibility, field-level healing reliability.
7. **Safe sequence**: experimental spike (benchmark harness) → MVP extraction primitive (deterministic) → repeated elements → dataset/artifact → pagination/composite patterns → export → AI/healing → cloud hardening. See implementation plan.

---

## 11. Deliverable Checklist

- [x] Repository forensics and execution path trace (§3)
- [x] Reusable infrastructure inventory (§4)
- [x] Missing-capability gap list (§5)
- [x] Security analysis (§6)
- [x] Resource/scalability analysis (§7)
- [x] Risks and mitigations (§8)
- [x] Open questions / experiments (§9)
- [x] Architecture abstraction, extraction model, options + decision matrix → `docs/research/web-scraping-architecture.md`
- [x] MVP, phased roadmap, tests, migration/rollback → `docs/research/web-scraping-implementation-plan.md`
- [x] Benchmark protocol → `docs/research/web-scraping-benchmark-plan.md`