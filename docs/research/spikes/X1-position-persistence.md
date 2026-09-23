# X1 — Position Persistence (P2)

> Status: **EXECUTED — P2 CONFIRMED (browser, OBSERVED RUNTIME)**
> Evidence class: **OBSERVED RUNTIME + CONFIRMED BY CODE**
> Date: 2026-09-20 · Branch: `spike/canvas-layout-research` · HEAD: `0553d26+`

## Question

> "Fresh dashboard load can overwrite persisted manual positions and subsequent
> autosave can persist the automatically generated positions." (P2)

## Method (RULE 8)

- Real stack: vite `:5173` → backend `:2001` (both reused; auth disabled ⇒ guest).
- Every case creates an **isolated** project + `main` flow via the backend API
  seeded from `test/fixtures/layout/export.js` (dataset A linear, size 5,
  staggered fixture positions n0.y=0 … n4.y=360).
- Browser driven by Playwright chromium. Positions read from React Flow DOM
  (`.react-flow__node` style transforms); backend canonical read via
  `/projects/:id/export/json`.
- Exact command:
  `pnpm exec playwright test e2e/x1-position-persistence.spec.js --workers=1 --reporter=list --timeout=90000`
- Result surface: `docs/research/spikes/data/X1/results.json`
- Harness: `apps/frontend/e2e/x1-position-persistence.spec.js`
- Dev dep added to enable the harness: `@playwright/test@1.62.1` (already used
  by the backend at the same version; pnpm-lock touched at workspace root).

## Results (all cases pass structural invariants; measurements are the point)

| Case | Measurement | Result |
|---|---|---|
| CONTROL | persisted fixture positions visible after open | **0 / 5** |
| B no-op reload | persisted fixture positions after reload | **0 / 5** (`sameOutputAcrossTwoLoads=true`) |
| A drag → autosave → reload | dragged y survives reload | **false** (n1 back at y≈50; drag was y≈110) |
| C layout → edit → wait>debounce → reload | reload == layout state | **true** |
| D layout → undo → reload | reload == layout state | **true** (idempotent layout) |
| E open 2nd flow / return | no silent re-layout | positions deterministic across loads |
| G layout during drag | (single editor) | layout click during drag did not visibly change positions — **INCONCLUSIVE** for CRDT arbitration (needs 2 clients, X9) |

## Interpretation

- The 5-node fixture is stored with staggered y (0/90/180/270/360); the browser
  **never once shows them** — from the moment nodes mount they are at the Magic
  Organizer LR output (all y≈50). Cause (CONFIRMED BY CODE):
  `App.jsx:285-292` runs `onLayout("LR", fitView)` on **every mount** as soon
  as `useNodesInitialized()` is true, and `getLayoutedElements`
  (`layoutUtils.js:201-273`) computes every position from dagre — it does not
  read persisted positions (no pinned concept; par.§0 report P3/P2).
- `useFlowSync.js:207` debounced autosave (2000ms) then persists whatever is in
  state — which after that effect is the generated layout. Hence:
  1. fresh load replaces manual/db positions with layout output,
  2. autosave durably stores the generated positions.
- Manual drag (CASE A) autosaves correctly during the session, but the *next*
  load re-lays out and restores the generated position — the drag is **visibly
  undone** by any reload. This is P2 exactly.

## Verdict

```
P2 CONFIRMED
```

Persisted manual positions are not respected on load; every dashboard open
overwrites them via the initial `onLayout("LR")`; autosave then persists the
generated positions.

## Limitations

- Cases C/D read canonical JSON once; at that moment the project
  `activeFlowId` may still point at the auto-created empty "Main Flow", so the
  two `fetchCanonical` boolean fields (`persistedBeforeOpen`,
  `generatedPositionsPersistedByAutosave`) are unreliable (read 0). Not needed
  for the verdict — the browser DOM measurements are the evidence.
- CASE G uses one editor; true conflict arbitration requires two clients (→ X9).
- CASE E only confirms deterministic positions across loads; the switcher
  interaction itself is not exercised.

## Implications for gates

- **GATE 1 CLOSED (YES, CONFIRMED).** Autosave overwrites persisted positions on load.
- **GATE 11 (source of truth)**: manual position is currently *derived state*,
  replaced by the initial layout on every visit; architecture must treat manual
  position as user state and stop the mount-time layout from running
  unconditionally (feature-gate / one-shot session flag / explicit action).