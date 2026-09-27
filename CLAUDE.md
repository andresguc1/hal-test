# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HAL-TEST is a visual browser automation platform built on Playwright. Users build test flows by connecting nodes on a React Flow canvas; the backend executes those flows via Playwright and streams results back over Socket.io. It also ships as a standalone npm CLI (`npx haltest`) that bundles the backend and the built frontend.

## Monorepo Structure

```
apps/
  backend/   — Express + Sequelize + Playwright execution engine (port 2001), ESM, plain JS
  frontend/  — React 19 + @xyflow/react + Tailwind v4 visual editor (port 5173 in dev)
  web/       — React 18 + Tailwind v3 marketing/landing site (separate Vite app)
  cli/       — `haltest` npm package: commander.js launcher, esbuild-bundles the backend
```

pnpm workspaces + Turborepo. Package names: `@halt-test/backend`, `@halt-test/frontend`, `@halt-test/web`, `haltest` (cli). `pnpm --filter backend` also works (pnpm matches the directory name).

Other notable top-level dirs: `docs/research/` and `research/jev-decision-provider/` (self-healing spike and plan), `scripts/` (release, SBOM, backups, smoke tests), `.agents/skills/` (vendored agent skills), `HALTEST_AGENTIC_QE_ARCHITECTURE.md`, `ROLLBACK_RUNBOOK.md`, `DOCKER.md`.

## Commands

### Development
```bash
pnpm install                      # postinstall in backend runs `playwright install chromium firefox webkit`
pnpm --filter backend db:init     # initialize SQLite database (first time)
pnpm run dev                      # all apps via turbo
pnpm run dev:backend              # node --watch on controllers/services/middlewares/routes/database/schemas
pnpm run dev:frontend
pnpm run stop                     # kills ports 2001 and 3000
```

**URLs**: editor → http://localhost:5173/app/ | API → http://localhost:2001 | Swagger → /api-docs | `GET /api/doctor` reports OS/Playwright/browser compatibility and the fix command.

### Testing
```bash
pnpm test                                   # turbo test (backend + frontend)
pnpm --filter @halt-test/backend test       # vitest run, only apps/backend/__tests__/**/*.test.js
pnpm --filter @halt-test/frontend test      # vitest + jsdom, src/**/*.test.{js,jsx} (config lives in vite.config.js)
pnpm --filter @halt-test/frontend test:watch

# Single file / single test
cd apps/backend && npx vitest run __tests__/variable-manager.test.js
cd apps/backend && npx vitest run __tests__/variable-manager.test.js -t "scope chain"
cd apps/frontend && npx vitest run src/hooks/flow/utils.test.js
```

- `apps/backend/vitest.setup.js` forces a non-CI environment (`CI=false`, etc.) because CI mode disables selector healing in `ActionExecutor`. Set `HALTEST_RUNNER_MODE=ci` explicitly if a test needs CI behavior.
- `apps/backend/__tests__/e2e/*.e2e.test.js` launch a real Chromium and are slow; run them selectively.
- `apps/backend/playwright.config.ts` is for tests *exported* by the platform into `tests/generated/`, not for the repo's own test suite.
- Healing benchmark (deterministic pipeline metrics): `cd apps/backend && node test-harness/run-benchmark.js [--json]`.

### Linting & Formatting
```bash
pnpm lint          # eslint per package
pnpm lint:fix
pnpm format        # prettier per package
pnpm exec prettier --check "**/*.{js,jsx,json,md}"   # what CI runs (blocking)
```
Git hooks (husky): pre-commit runs `lint-staged` (prettier on `apps/**`), pre-push runs `pnpm turbo run test --affected`.

### Build & Release
```bash
pnpm build                 # turbo build
pnpm run build:monolith    # web → apps/backend/public/web, frontend → apps/backend/public/app (base path /app/)
pnpm start                 # NODE_ENV=production node apps/backend/app.js (serves the monolith)
pnpm --filter haltest build   # scripts/build.js: builds monolith then esbuild-bundles backend into apps/cli/dist
pnpm release / release:patch  # triggers .github/workflows/release.yml via gh
```

### Database migrations (backend)
```bash
pnpm --filter backend db:migrate | db:migrate:status | db:migrate:create | db:rollback
pnpm --filter backend db:backup | db:backup:list | db:backup:restore
```
Migrations live in `apps/backend/database/migrations/` (timestamp-prefixed). CI has a dedicated `migration-test` job, so schema changes need a migration, not just a model edit.

## Environment Variables

Backend reads the repo-root `.env` via dotenv. Frontend picks up `VITE_*`.

```
NODE_ENV=development
PORT=2001
VITE_API_URL=http://localhost:2001/api
VITE_PORT=5173

AUTH_ENABLED=false            # both false → Guest Mode, no Supabase needed
VITE_AUTH_ENABLED=false
SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY   # only when AUTH_ENABLED=true
DATABASE_URL=postgresql://... # Postgres instead of SQLite (see Database)

HALTEST_HOME                  # storage dir, default ~/.haltest
HALTEST_RUNNER_MODE=ci        # CI mode: disables selector healing (also triggered by CI/GITHUB_ACTIONS/GITLAB_CI/JENKINS_URL)
HALTEST_SELF_HEALING_MODE     # 'disabled' skips the deterministic heal gate
HALTEST_MASTER_ENCRYPTION_KEY # Key Vault encryption
```

## Architecture

### Storage & Database
All runtime state lives **outside the repo** in `STORAGE_DIR` (`apps/backend/config/paths.js`): `~/.haltest/` by default, overridable with `HALTEST_HOME`. That holds `database.sqlite`, `global_variables.json`, `runs/`, `plugins/`, backups.

`apps/backend/database/index.js` uses SQLite unless `DATABASE_URL` is set (Postgres, also gated on `NODE_ENV=production || DATABASE_URL`).

Sequelize models (`database/models/`): `User → Project → Canvas → Flow → Node/Edge`; `Run → StepResult` for execution history; `HealingLog` (with telemetry columns), `ExperienceVault`, `AIUsageLog`, `CollaboratorRole`, `ExecutionLockModel`, `SecurityComplianceRun/Result`.

### Request → execution pipeline
1. `app.js` boots: `initDb()`, `bootstrapBuiltinPlugins()` (fills `NodeRegistry`), `PluginManager` (external plugins from `~/.haltest/plugins` or `<project>/plugins`), Socket.io (`socket.js`), Yjs collaboration server, Swagger, rate limiting, then mounts routers under `/api` behind `authenticated` middleware.
2. `POST /api/runs/start` (also `/batch`, `/performance`, `/security` in `routes/run.router.js`) → `controllers/run.controller.js` → `ExecutionService.executeFlow()` (`services/ExecutionService.js`, the largest file): loads the graph, validates via `GraphValidator`, resolves variables via `VariableManager` + `ExpressionEngine`, walks nodes.
3. `ExecutionManager` picks a runner: `E2ERunner`, `PerformanceRunner` (virtual users, circuit breaker, memory guard) or `SecurityRunner`.
4. For each node, `ExecutionService.getHandlerName(type)` converts `snake_type` → `camelTypeAction` and looks it up on the `action.controller.js` barrel. `loop` and `for_each` are executed inline as containers; `conditional`, `switch` and `branch` nodes are resolved when choosing which outgoing edges to follow.
5. Every Playwright handler runs through `core/ActionExecutor.executePlaywrightAction()`, which resolves the page, interpolates options, captures screenshots/DOM, persists `StepResult`, writes audit logs, stores results in `VariableManager`, and runs selector self-healing on failure.
6. Progress streams over Socket.io; `Run` + `StepResult` rows are the persisted history.

### Node system (backend) — adding or changing a node type
Handlers are **not** implemented in `action.controller.js`; that file is a barrel of re-exports. A node type touches all of these:

- `apps/backend/plugins/core-<category>/handlers/<type>.js` — the handler (uses `executePlaywrightAction`, `core/selector-utils.js`, `core/timeout-utils.js`, `req.t()` for i18n messages from `apps/backend/locales/`).
- `apps/backend/plugins/core-<category>/schemas/<type>.js` — Joi schema, and `manifest.json` entry in the same plugin dir.
- `apps/backend/core/pluginBootstrap.js` — add to `BUILTIN_PLUGINS` with **string-literal `import()` calls**. Dynamic paths break the esbuild-bundled CLI package, which does not ship the `plugins/` dir.
- `apps/backend/controllers/action.controller.js` — export as `<camelType>Action`. If the name can't follow the convention, add it to `ACTION_NAME_OVERRIDES` in `routes/api.router.js` **and** the mirrored `overrides` in `ExecutionService.getHandlerName()`.
- `apps/backend/routes/api.router.js` `ROUTE_REGISTRY` + `apps/backend/schemas/<type>/body.js` re-exported from `schemas/index.js`. The router throws at startup if a schema or action name is missing, which is the fastest way to find a mistyped name.
- `apps/backend/config/mockData.js` is the fallback category list served when the registry is empty; keep it in sync for the CLI/offline case.
- Exporters (`services/exporter/nodes/*Mapper.js`) if the node should be exportable to Playwright code.

`GET /api/nodes/categories` and `/api/nodes/definitions` (`routes/mock.router.js`) expose the registry to the frontend. `core/ActionRouter.js` + `EngineHooks.js` provide hook phases (`NODE_BEFORE_EXECUTE`, etc.) around handlers.

### Node system (frontend)
- `src/config/nodeConstants.js` — `NODE_CATEGORIES`, `NODE_TYPE_MAP`, `NODE_OUTPUTS`, category styles; `updateNodeDefinitions()` merges the backend registry response fetched once by `hooks/useNodeDefinitions.js` (static values are the fallback).
- `src/components/hooks/constants.js` — `NODE_LABELS`, `NODE_FIELD_CONFIGS` (the config-panel field definitions, ~3k lines), `NODE_STATE_COLORS`, `NODE_TYPE_TO_CATEGORY`.
- Also per node type: `config/validationRules.js`, `config/nodeSimulators.js`, `components/nodes/nodeIcons.js`, `components/hooks/payloadBuilders.js`, `utils/policyEnforcer.js`.
- `components/nodes/index.js` maps every type in `NODE_TYPE_MAP` to `AbyssNode` automatically; only `component`, `input`, `output`, `loop`, `for_each`, `sticky_note`, `discussion` have dedicated components. New ordinary nodes need no new React component.

### Selector self-healing
On a failed selector, `ActionExecutor` calls `services/SelectorHealer.heal()`. Order: `SelectorPreValidator` → deterministic `core/decisions/SelectorRanker.bestSelector()` + `DecisionPolicy.applyPolicy()` (AUTO / SUGGEST / HUMAN_REVIEW) → DOM verification → only then an LLM call with Zod structured output. Decisions are logged to `HealingLog`. CI mode bypasses healing entirely. Design rationale and metrics are in `docs/research/haltest-self-healing-confidence-plan.md`.

### Variable System
`VariableManager` scope chain node → run → global. `global` persists to `~/.haltest/global_variables.json`; `runs` is per execution (evicted when too many are active); `legacy_flow` exists for old flows. `ExpressionEngine` is the sandboxed evaluator for `{{var}}` / `${var}` interpolation; `ConditionEvaluator` drives conditional nodes.

### Real-time
Socket.io server in `apps/backend/socket.js`; frontend client in `src/hooks/useHaltestSocket.js`. Event names are hyphenated: `execution-status`, `edge-status`, `execution-log`, `flow-finished`, `variable-change`, `auto_healing_update`, `perf-metrics-update`, `perf-run-finished`, `security-alert`, `terminal:output`, `element_picked`. Collaboration uses a Yjs server (`services/collaboration/`).

### AI / LLM
`services/LLMFactory.js` abstracts Anthropic, OpenAI, Google (Vercel AI SDK) and Ollama. Keys are stored encrypted via `KeyVaultService.js`. `AIService.js` handles node generation and semantic validation; `AIGenerationGuard` / `SafetyGate` gate generated code. An MCP server exposing canvas tools lives in `apps/backend/mcp/`.

### Frontend state
- React Flow: `hooks/flow/useFlowState.js` (nodes/edges), `useFlowSync.js` (persistence), `useFlowExecution.js` (run control).
- Project/flow management: `components/hooks/useFlowManager.js`, `useProjectManager.js`.
- Zustand stores in `src/stores/`; contexts `AuthContext`, `SettingsContext`, `LogContext`, `AIContext` in `src/context/`.
- `@/` alias → `apps/frontend/src`. Dev server proxies `/api` to the backend. Screenshots are cached client-side in IndexedDB (dexie).

### CLI packaging constraint
`apps/cli/scripts/build.js` builds the monolith and bundles `apps/backend` with esbuild into `apps/cli/dist`. Anything the backend loads at runtime must be statically importable or copied by that script; avoid `import(variable)` and `fs.readdir`-driven module loading in code paths the CLI needs.

## Code Conventions (from CLEAN_CODE.md / CONTRIBUTING.md)

- Atomic commits, one logical change each; never mix refactors with fixes.
- Self-documenting names; no commented-out code; comments only for a non-obvious *why*.
- Single responsibility per function/service; YAGNI.
- Backend code is 4-space indented with single quotes; frontend is 2-space with double quotes (prettier per package handles this).
- Backend log/comment strings are partly in Spanish; that is normal in this codebase.

## Translations

UI strings use i18next. Update `apps/frontend/src/locales/en.json` and `es.json` together for frontend text, and `apps/backend/locales/` for handler messages returned via `req.t()`.
