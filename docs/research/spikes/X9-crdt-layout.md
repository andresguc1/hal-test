# X9 — CRDT-layout concurrency spike

Status: **COMPLETE** — 6 tests in `crdtConcurrency.test.js`, whole unit suite **22 files / 226 tests** green, lint clean. Evidence in `data/X9/results.json`. Production code untouched (RULE 1).

**Tested against:** Yjs 13.6.31, shape grounded in production `useCRDTNodes.js` (`ydoc.getMap("nodes")` → per-node `Y.Map` with nested `position: Y.Map{x,y}`).

## Claims measured

| Claim | Verdict | Evidence |
|---|---|---|
| Layout is N cell writes (no atomicity wrapper) | **CONFIRMED** | 500-node layout = 13,464 B delta; 1-node drag = 42 B; **320× amplification**. No layout-level atomicity beyond the Yjs transaction itself. |
| Layout update is atomic | **PASS** | 500-node layout → **exactly 1 Yjs update**; `applyUpdate` on a cloned doc applies all 500 positions in one shot (`updateCount=1`, all 500 applied). |
| LWW per nested cell | **CONFIRMED** | `layout-then-drag`: dragged cell wins (4444/5555); others keep layout (111/222). `drag-then-layout`: layout wins on dragged cell (333/444) → **drag LOST**. |
| Stale layout clobbers drag | **OBSERVED** (order-dependent) | `drag-then-layout` shows layout arriving after drag overwrites the user's dragged cell — the exact "silent layout during drag" corruption vector. |
| Stale layout retraction via `layoutVersion` | **WORKS** | Resolver: `incomingVersion > localVersion → apply; else drop`. Drag never bumps version, so preserved; stale v1 dropped when v2 already present. Baseline without resolver: outcome is Yjs LWW (non-intuitive, clientID-dependent). |
| Layout vs drag op cost | **MEASURED** | layout100 = 2,663 B; layout500 = 13,464 B; drag1 = 42 B. A 500-node layout ≈ **320 single-node drags** in update traffic. |

## Honesty (RULE 26)

- The "layout clobbers drag" outcome in `drag-then-layout` is deterministic **in this harness** because the layout client (a) wrote later in the causal chain (after seeing the drag). In a real network with out-of-order delivery, a *stale* layout could also arrive late and win depending on Yjs's clientID tie-break — which is precisely why the resolver is needed.
- The baseline `drag-then-layout` scenario already proves layout after drag clobbers the drag; the "stale layout" baseline in (c) happened to preserve the drag here (Yjs LWW favored the drag's clientID), but that's not guaranteed across client pairs — the resolver makes it **guaranteed**.
- Yjs update sizes include internal struct overhead; actual network traffic depends on provider (y-websocket, WebRTC, etc.). The amplification ratio (~320×) is the core finding: a layout is NOT a single op.
- Test shape matches `useCRDTNodes.js` exactly (nested `position` Y.Map per node); if the app changes to a flat position object, amplification and conflict granularity change.

## Phase-3 strategy this evidence supports

1. **Layout = user-visible op**: PREVIEW → CONFIRM → atomic Y transaction that bumps `layoutVersion`.
2. **No silent auto-layout in live collab rooms** — a layout landing during an active drag will clobber the user's intent (observed).
3. **If auto-layout must exist**, gate it to a single "layout curator" client and enforce `layoutVersion` retraction on all peers.
4. **Drag operations never bump `layoutVersion`** → they are never retracted by the resolver.
5. **Op-count awareness**: a 500-node layout generates ~13 KB of CRDT traffic; at scale this impacts sync latency and provider costs.

## Artifacts

- `src/hooks/flow/crdtConcurrency.test.js` — 6 tests (22nd test file; 226 total unit tests).
- `data/X9/results.json` — all numbers above.
- Report: `docs/research/spikes/X9-crdt-layout.md` (this file).