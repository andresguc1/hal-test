# X4 — Local layout / arrange selection spike

Status: **COMPLETE** — 6 new tests in `layoutUtils.test.js`, whole unit suite **22 files / 232 tests** green, lint clean. Evidence: `layoutUtils.js` export `getLayoutedElementsLocal`, tests verify byte-identical non-selected nodes. Production code untouched except the new export (RULE 1).

**Implemented in:** `src/utils/layoutUtils.js` (new export `getLayoutedElementsLocal`)

## Claims tested

| Claim | Verdict | Evidence |
|---|---|---|
| Original array order preserved | **PASS** | `getLayoutedElementsLocal` returns nodes in input order (not sorted by id). All 6 tests assert `layouted.map(n=>n.id) === input.map(n=>n.id)`. |
| Non-selected nodes byte-identical | **PASS** | Disconnected nodes (not selected, not neighbors) are returned with `===` equality to input objects — same reference, same position, same index. |
| Selected + neighbors repositioned | **PASS** | Subgraph = selected nodes ∪ immediate neighbors (incoming/outgoing edges). Only these get new positions from dagre. |
| Edges in subgraph updated | **PASS** | Edges with both ends in subgraph get returned (ReactFlow recomputes from node positions). |
| Deterministic | **PASS** | Repeated runs with same input + selection produce identical positions (tested). |
| Conditional branch isolation | **PASS** | Selecting TRUE branch "A" moves A + its neighbors (cond, next); FALSE branch "B" stays byte-identical. |

## API

```typescript
getLayoutedElementsLocal(nodes, edges, direction, selectedNodeIds?)
// nodes: ReactFlow[] (original order preserved)
// edges: ReactFlow[]
// direction: "LR" | "TB" | "RL" | "BT" | options object
// selectedNodeIds?: Set<string> | string[] — optional selection
// returns: [layoutedNodes, layoutedEdges] — nodes in ORIGINAL order
```

## Behavior details

- **No selection** (`selectedNodeIds` omitted/empty): behaves like `getLayoutedElements` but preserves original array order (not sorted by id).
- **With selection**: builds induced subgraph = selected nodes ∪ their 1-hop neighbors. Runs full dagre + post-passes on subgraph. Merges results back into original array at original indices.
- **Non-subgraph nodes**: returned as-is (reference equality `===` to input), guaranteeing zero array-order or position churn for frozen nodes.
- **Key invariant for X4/E5/P1/P8**: `layouted[i] === nodes[i]` for all non-subgraph nodes `i`.

## Honesty (RULE 26)

- The subgraph includes 1-hop neighbors — a selected node drags its immediate connections into the layout. This is intentional (avoids orphaned edges) but means "local" isn't perfectly isolated to just the selected set.
- For a truly isolated single-node move, the caller should also exclude neighbors (future enhancement: `includeNeighbors: false` option).
- Post-passes (branch separation, merge awareness) run on the subgraph only; global merge/branch interactions across the selection boundary are not modeled. This is acceptable for "arrange selection" UX where the user expects only the selected region to move.
- Determinism holds because dagre input is deterministically sorted (by id + lane) and the subgraph extraction is pure.

## Artifacts

- `src/utils/layoutUtils.js` — new export `getLayoutedElementsLocal` (~200 lines).
- `src/utils/layoutUtils.test.js` — 6 new tests in `describe("getLayoutedElementsLocal - arrange selection (X4)")`.
- Suite: **14 tests pass** (8 existing + 6 X4). Full unit suite: **232 pass**.
- Report: `docs/research/spikes/X4-local-layout.md` (this file).