# HalTest Canvas — Layout & Graph Technology: Current State (Forensic Report)

> Status: research / codebase-forensics. No implementation has been done.
> Source context: HalTest monorepo (`/home/andres/Documents/Proyects/hal-test`), working branch `spike/jev-decision-provider`.
> This document is a foundation for a future "Canvas Layout & Visualization Improvement Plan". It does NOT prescribe a final answer; it documents what exists, with evidence (path:line), and separates **Confirmed by code** / **Observed behavior** / **Hypothesis**.

---

## 1. Purpose & Scope

Map in detail how the HalTest visual flow canvas currently works, specifically the "Magic Organizer" layout feature, edge routing, position persistence, the multi-flow/composite-node graph model, and known perf/correctness constraints. The report intentionally does **not** modify production behavior or `main`.

### Methodology
- Static code reading of `apps/frontend` (canvas) and `apps/backend` (persistence / API).
- Dependency check (package.json + pnpm store) for graph-specific libraries.
- Tests inspected: `apps/frontend/src/utils/layoutUtils.test.js` (branch semantics, overlap-freedom, determinism, and a 107-node perf ceiling < 2 s), `apps/frontend/src/hooks/flow/orderStartNodes.test.js`, `apps/frontend/src/hooks/flow/flowUtils.test.js`.
- No **browser-level** runtime profiling was performed (the repo has no FPS/interaction-latency harness; the only graph-perf assertion is the layout unit perf ceiling). Runtime/perf claims beyond that are labeled **Hypothesis**.

---

## 2. Frontend Stack (canvas-relevant)

Confirmed via `apps/frontend/package.json` and the pnpm store:

- `@xyflow/react` **12.10.0** (React Flow v12; `@xyflow/system@0.0.74`). Source: `node_modules/.pnpm/@xyflow+react@12.10.0_*/node_modules/@xyflow/react/package.json`.
- `dagre` **0.8.5** (sole graph-layout library in the store; no ELK, no graphology). Source: pnpm store `dagre@0.8.5`.
- `zustand` — canvas state, plus React state; `useFlowState.js` (1885 lines) is the central flow store.
- `yjs` + `y-websocket` + `y-indexeddb` — optional collaborative CRDT sync (positions are part of the CRDT document).
- `@supabase/supabase-js`, `@tanstack/react-query`, `react-i18next`, `@dnd-kit/*` (panel/tab DnD, not canvas).
- UI: `lucide-react` icons, Tailwind CSS. Node visuals, colors and node type registry live in `apps/frontend/src/config/nodeConstants.js` (`NODE_TYPE_MAP`).

---

## 3. Current Architecture

### 3.1 The single canvas
`apps/frontend/src/App.jsx` (`/dashboard` view) renders **one** `<ReactFlow>` for whichever flow is active. The active flow is called the **current canvas**; switching flows swaps the same ReactFlow's `nodes`/`edges` (see `useFlowManager.js`, `useFlowSync.js`). There is a second read-only ReactFlow in `apps/frontend/src/components/reporting/ReportDashboard.jsx:843`.

Main canvas `<ReactFlow {...flowConfig}>` at `App.jsx:2376`. Its config is built in `flowConfig` (`App.jsx:1969`) from `staticFlowProps` (`App.jsx:1820`) + `figmaConfig` (`apps/frontend/src/hooks/useFigmaInteraction.js:73`).

Key props (all confirmed):
- `defaultViewport {x:0,y:0,zoom:0.6}`, `minZoom:0.1`, `maxZoom:2` (`App.jsx:1843,1872-1873`)
- `onlyRenderVisibleElements: true` — viewport culling enabled; **you still need to know the viewport** (see caveat in §9).
- Dynamic `translateExtent` computed from all node positions + 5000px margin (`App.jsx:1820-1866`), so pan never leaves nodes unreachable.
- `snapToGrid` from settings (`enableSnapping`), `snapGrid [15,15]` (`App.jsx:1972,1845`).
- `connectionMode: ConnectionMode.Strict` (target-handle-only snapping) (`App.jsx:1859`)
- `defaultEdgeOptions { type: "custom" }`; every edge is force-typed `"custom"` in `flowConfig` (`App.jsx:1974`).
- `nodesDraggable`, `nodesConnectable` gated by read-only/collaborator-viewer role (`App.jsx:2016-2017`).
- Interaction via `figmaConfig`: scroll=zoom, space+drag=pan, middle/right drag=pan, partial marquee selection (`useFigmaInteraction.js:73-112`).

`edgeTypes` map is built in `apps/frontend/src/components/edges/index.js` (default entry `"custom" -> CustomEdge`). `nodeTypes` map is generated dynamically from `NODE_TYPE_MAP` in `apps/frontend/src/components/nodes/index.js:15`.

### 3.2 Canvas orchestration
- `apps/frontend/src/components/hooks/useFlowManager.js` — exposes `onLayout(dir, fitView)` etc. to the UI (line 119).
- `apps/frontend/src/hooks/flow/useFlowState.js` — owns `nodes`, `edges`, selection, add/update/delete, undo/redo, **`onLayout` (line 1222)**.
- `apps/frontend/src/hooks/flow/useFlowSync.js` — load/save/autosave (`hasUnsavedChanges` + ~2s debounce), navigation guard, flow switching; calls `ProjectManager` API.
- `apps/frontend/src/utils/ProjectManager.js` — HTTP persistence to backend.
- `apps/frontend/src/utils/subFlowCache.js` — 30s TTL cache of component/loop flow definitions for the `data.flowId` reference nodes.
- `apps/frontend/src/collaboration/` — `CollaborationProvider.jsx`, `useCRDTNodes.js`, `useCRDTEdges.js` (Yjs bridges).

### 3.3 Canvas entry points / triggers
- Layout entry points (all confirmed):
  1. **Auto layout on first load** of a fresh Dashboard instance: `App.jsx:281-292` (guard ref `initialLayoutApplied`), calling `onLayout("LR", reactFlowFitView)` when `useNodesInitialized()` returns true and `nodes.length > 0`.
  2. Toolbar **"Magic Organize"** ControlButton → `onLayout("LR")` (`App.jsx:2406-2411`).
  3. Context menu **"Clean Layout"** → `actions.cleanLayout` → `onLayout("LR")` (`App.jsx:2508`, `ContextMenu.jsx:692`).
- No keyboard shortcut bound to layout in `DEFAULT_SHORTCUTS` (`useKeyboardShortcuts.js:108-122`).
- Report dashboard renders positions as stored (no layout call).

---

## 4. The Magic Organizer

Implementation: `apps/frontend/src/utils/layoutUtils.js` → `getLayoutedElements(nodes, edges, third)` (line 201). Single layout engine today: **dagre 0.8.5**, LR (left→right, `inputs` on left, `outputs` on right).

### 4.1 Constants (confirmed, `layoutUtils.js:3-18`)
- `nodeWidth = 172`, `nodeHeight = 60` — used as **fallbacks only**. Real sizing is `getLayoutSize(node)` (lines 160-180): prefers `node.measured?.width/height` (set by React Flow after render), overrides `conditional`/`switch` height to `Math.max(100, branchCount*45)` (mirrors `AbyssNode.jsx` minHeight), overrides `loop`/`for_each` to 200×100, then adds +40 width / +60 height padding.
- `DEFAULT_SPACING = { branchSpacing: 60, mergeSpacing: 40, nodesep: 60, ranksep: 90 }`.

### 4.2 dagre call (`layoutUtils.js`)
- `rankdir` from `direction` (default `"LR"`)
- `align: "UL"` (upper-left union of crossing-min.) — suboptimal for LR aesthetics, see §12.
- `ranker: "tight-tree"` (minimizes height, longest-path ranking) — documented dagre tradeoff: narrow but with more edge crossings.
- `nodesep: 60`, `ranksep: 90`, `marginx/marginy 50`, `nodeWidth`, `nodeHeight`, `compound: true`.
- **Input determinism**: nodes are sorted by `id`, edges by `(lane, source, target)` before feeding dagre (`layoutUtils.js:210-221`).
- **Lane weighting**: each edge gets `weight = 100 - lane*10` (lane 0 = TRUE / first case, lane 1 = FALSE / next) so dagre tends to place lane 0 above lane 1 in the rank (`layoutUtils.js:251-260`).
- `node.parentNode` is respected when present (`dagreGraph.setParent`, `layoutUtils.js:246-248`) — a code path that today is inert because the canvas has no RF group nodes.

### 4.3 Custom post-processing (the "Magic" part)
After dagre returns coordinates, `getLayoutedElements` re-positions nodes (`layoutUtils.js:275-459`), LR-only:
- **Branch separation**: for every source with ≥2 semantic branches (`conditional`/`switch`), each lane's descendant set is computed; nodes reached by 2+ lanes (merge/convergence targets and everything downstream) are collected as `sharedSet`. Each lane's exclusive vertical span is pushed below the previous lane's cursor + `branchSpacing`, shifting the whole lane subtree down (`shiftSubtree`) — lanes are kept apart while shared merge targets remain untouched so converging lanes still meet (lines 307-372).
- **Merge positioning**: any node with ≥2 incoming edges is pushed **downard only** below the bottom of all its incoming sources + `mergeSpacing`, with same-column collision avoidance (columns grouped by center-x; `ranksep > max node width` guarantees different columns never overlap) iterated to a fixed point (`MAX_ITER`, lines 374-458).
- **Cycle handling**: cyclic edges are removed from the *layout graph* (a `console.warn` is logged, `layoutUtils.js:264-269`) but the edge is **still drawn** by React Flow; the remainder of the graph is laid out normally.
- **Output nodes**: layout also stamps `targetPosition: "left"`/`sourcePosition: "right"` (or top/bottom for TB/BT) on every node (lines 466-470).
- Runs are **deterministic** regardless of input order (id/lane pre-sort; `layoutUtils.test.js` asserts `run1 === run2`).

### 4.4 Layout application (`useFlowState.js:1222-1246`)
- dagre returns **center** coordinates; `getLayoutedElements` converts each to **top-left** via `x - width/2, y - height/2` (`layoutUtils.js:282-288`). `marginx/marginy: 50` on the dagre call provides a small leading margin, so coordinates land near (0,0) and stay positive in practice (nothing clamps them).
- Set node positions, reacts with `setNodes`; triggers **0.5s CSS transition** on the flow panes/edges; calls `reactFlowFitView({ duration: 800, padding: 0.2 })` when requested.
- **Calls `saveToHistory()` BEFORE layout runs** (`useFlowState.js:1223`), so the pre-layout arrangement is recoverable via undo (undo stack adds a `{nodes, edges}` snapshot at that point). This is the only "position undo" mechanism; there is no separate layout-undo.
- Layout only touches `nodes` (styles/sizes untouched); edge paths are NOT recomputed by layout — they regenerate via React Flow whenever node positions change.

### 4.5 What Magic Organizer does NOT do
- No edge routing; it relies on `CustomEdge`'s orthogonal bypass (§5).
- No nested/compound layout for composite flows: component/loop nodes are single boxes referencing other flows (§7). `compound: true` and the `setParent` path exist in code (`layoutUtils.js:246-248`), but today no React Flow node carries a `parentNode`, so no subgraphs are laid out.
- No per-type/per-subflow sub-layout or group layout; sticky notes & discussion nodes are laid out like regular nodes.
- No incremental layout, no minimization/minimap-aware layout, no arranging of selected nodes ("arrange selection").

---

## 5. Edge Routing (`CustomEdge.jsx`)

`apps/frontend/src/components/edges/CustomEdge.jsx` is the default edge type for the whole canvas.

Path generation (confirmed, `CustomEdge.jsx:22-121`):
1. **Dispatch**: if `|targetY − sourceY| > 30` → **bypass**; else (same-rank edge) → `getSmoothStepPath({ borderRadius: 10 })` (the "clean" short path; previously parallel same-rank edges jittered, comment at line 110-111).
2. **Bypass** `buildOrthogonalBypassPath` (lines 22-64): exits the source to the right by a lane pivot `laneOffset = 16 + (parallelIndex % 3) * 10` → 16 / 26 / 36 px (lines 32-36, clamped not to overshoot the edge midpoint on short edges), then drops **vertically at that x** to the target's row (corner radii `borderRadius: 10`), then runs right into the target. The vertical segment intentionally falls inside the inter-rank gap dagre reserved (`ranksep 90` ≈ 90px), so it never crosses an intermediate node. `parallelIndex = sum(charCodes(id)) % 3` (0..2) — deterministic per edge id, so up to 3 parallel fan-out lanes per row.
3. **No bypass fallback**: the bypass is always used when `distanceY > 30`; `smoothstep` is a *dispatch* choice, not a failure fallback.

Visual styling (confirmed):
- Actual rendered stroke is `var(--connection-line)` (light `hsl(215 16% 65%)`, dark `hsl(239 84% 67%)` from `index.css:28,61`), overridden to execution-state colors (running amber `#f59e0b`, success green `#22c55e`, error red `#ef4444`, healed yellow `#facc15`, skipped gray `#D1D5DB` at `CustomEdge.jsx:134-140`; selected → indigo `#6366f1`). Stroke width 2 (3 when selected/running); a glow `BaseEdge` underlay renders when selected/running/success/healed (`CustomEdge.jsx:144-156`). An animated signal particle was **disabled** for CPU reasons (commented out, lines 182-198).
- The `defaultEdgeOptions` stroke `#ff8c32` and `animated: !DEV` in `useFlowState.js:32-47` are effectively overridden by `CustomEdge` (the custom edge sets its own stroke/width; `animated` unused because `CustomEdge` doesn't render the RF animate machinery).
- Connection preview: `CustomConnectionLine.jsx` — smoothstep + glow, `var(--connection-line)`.

Known limits (code-level):
- The bypass is **a single vertical drop at a fixed x**; it does not do multi-segment obstacle avoidance — it relies entirely on dagre's rank-gap geometry.
- 3-lane cap (`% 3`) means 4+ parallel edges out of one source start overlapping.
- No per-edge path caching; path strings recompute on every re-render of the edge (component is `memo`-ized, so re-render = edge props actually changed).
- No `FLOW LOOP`/self-edge special-casing beyond `getSmoothStepPath` handling self-connections.

---

## 6. Minimap, Controls & Overlays

- `apps/frontend/src/components/StyledMiniMap.jsx`: standard React Flow `<MiniMap>` with `nodeColor` per `NODE_TYPE_MAP` category, `zoomable`, `pannable`. No edgeLayers toggle, no node-count/edge-count overlays, no "viewport silhouette" customization beyond defaults. Rendered only when `showMinimap` setting is on (`App.jsx:2396`).
- `Controls` (`App.jsx:2397-2412`): zoom in/out/fit + two extra `ControlButton`s — **Fit Workflow** (`fitView({duration:300, padding:0.2})`) and **Magic Organize** (`onLayout("LR")`).
- Background dots grid `gap 24` when `showGrid` (uses `var(--grid-dots)`) (`App.jsx:2414-2422`).
- Vignette + read-only pulse overlays (`App.jsx:2424-2437`).
- Settings (confirmed `SettingsContext.jsx:28-30`): `showGrid` (default true), `enableSnapping` (default true), `showMinimap` (default true) — all persisted in localStorage.

---

## 7. Position Persistence and Synchronization

### 7.1 Backend storage (confirmed)
- `apps/backend/database/models/Node.js`: `nodeId` STRING, `type` STRING, `data` JSON, **`position` DataTypes.JSON (default `{x:0,y:0}`)**, `parentId` STRING (hook/legacy, not the RF parent), `order` INT (insert order).
- `apps/backend/database/models/Edge.js`: `edgeId`, `source`, `target`, `sourceHandle`/`targetHandle` (nullable), `order`.
- `apps/backend/database/models/Flow.js`: `name`, `projectId`, `canvasId`, `type` (main/component/loop), `parentId`, `hasInput`, `hasOutput`, `viewport` JSON (stored but not round-tripped to the canvas by `mapFlowData`).
- API mapping `apps/backend/routes/project.router.js:36` `mapFlowData` → RF-compatible `id`, `edgeId` etc. GET flow returns nodes + edges (`project.router.js:1309`); PUT flow destroys-and-recreates the node/edge rows (`project.router.js:1419`).
- Backend also preserves positions on project **import**: `ProjectImportService.js:263` keeps `viewport`, `:283` keeps `position`. Export (`ProjectExportService.js`) serializes stored data including positions.

### 7.2 Frontend flow load/save
- `useFlowSync.js` `loadFlowData` → fills `nodes`/`edges` incl. stored `position`; autosave (2s debounce) whenever `hasUnsavedChanges`; `saveChanges` PUTs nodes+edges+viewport. CRDT-active sessions write into the Y.Doc instead, and local client eventually persists from the Yjs doc (see `CollaborationProvider.jsx`).
- `apps/frontend/src/utils/subFlowCache.js`: fetching a referenced (component/loop) flow's nodes/edges caches them 30s to reduce API chatter — this is the **only** cross-flow graph query cache.

### 7.3 ‼️ CRITICAL: persisted positions get overridden by the auto-layout
Sequence (all confirmed by code):
1. Fresh `Dashboard` mount loads a project; the active flow's nodes (with stored `position`) are set.
2. `useNodesInitialized()` flips true after first paint → the effect at `App.jsx:285-292` calls `onLayout("LR", fitView)` **and unconditionally** rewrites every node position with a dagre LR result.
3. `onLayout` does not set `hasUnsavedChanges`, so the layout result is *not* immediately saved — but the **first user edit** (drag, config change, new node, delete, connect…) pushes the whole canvas (including magic-layout positions) into the 2s autosave, permanently clobbering the user's saved manual arrangement.

Consequences (Observed-by-code, to be verified by runtime):
- Manually arranged flows only keep their arrangement if the flow is **never edited again** after a fresh open — or if switching flows in-session (guard ref prevents re-layout on switch).
- There is **no opt-out** for auto-layout, no "keep my positions" setting, and no dialog asking the user.
- Reports (execution replay) use the stored positions — so a report may show the un-magic layout for flows that were last saved before any auto-layout edit.

### 7.4 CRDT collaboration positions
`useCRDTNodes.js`/`useCRDTEdges.js` put positions in a Y.Map-of-Y.Maps (`{"x":…,"y":…}`); remote updates land immediately; during local drags an optimistic update is written and the position is re-applied. This is orthogonal to Magic Organizer, but note: **layout is not collaborative-by-design** — a viewer/editor invoking Magic Organize would push layout positions into the shared doc without a consensus/undo story; viewer role has UI disabled (`App.jsx:2016`), so practical risk is limited to editors.

---

## 8. Composite Nodes & the Multi-Flow Graph Model

- A "component" or "loop" (and `for_each`) on the canvas is a **regular React Flow node** whose `data.flowId` references a separate `Flow` row in the same project (`parentId` on the Flow marks hierarchy; e.g. `main` owns `component` flows). Confirmed in `App.jsx` double-click `enterComponent` (`App.jsx:1997-2012`), `addComponentRef` (drop from Explorer, `App.jsx:1741-1760`), and `subFlowCache`.
- `LoopNode`/`ForEachNode`/`ComponentNode` are self-contained boxes with input/output handles (e.g. `LoopNode.jsx:107-111`); they do **not** render the sub-flow; a run navigates in via execution and the UI via `switchFlow`.
- `ComponentRegistry.js` (backend) resolves a component reference to its sub-nodes/edges during execution; `useFlowExecution.js` flattens the composed graph at run time (`orderStartNodes`, topological order by leftmost position then id — `useFlowExecution.js:39`, test `orderStartNodes.test.js`).
- **No intra-flow nesting**: there is a single, flat node list per flow; there are no RF `parentId`/group nodes (only legacy `parentId` plumbing on Node rows). V3 auto-grouping of loops was removed (crash-fix history; `onNodeDragStop` compute is present but non-grouping — `App.jsx:1769`).

---

## 9. Large Graph Limitations

**Existing benchmark signal (confirmed):** the repo DOES contain a perf-ceiling test — `layoutUtils.test.js:181-230` builds a ~107-node worst-case (27 chained conditional/switch blocks, each branching into 2 lanes converging into a shared merge) and asserts `getLayoutedElements` completes in **< 2000 ms** (plus determinism recheck). This is a unit-level regression guard, not a browser/UX measurement. Notably the ceiling (2 s) is generous on purpose; it only catches polynomial blow-ups of the merge/branch post-passes, and 107 nodes is far below realistic max flow sizes. All other perf claims below are code-level analysis, labeled **Hypothesis** where runtime numbers would be required.

**Confirmed by code:**
- No browser/frame-level perf harness exists (no FPS, interaction-latency, or memory tests anywhere in the repo). The only graph-perf assertion is the 107-node layout unit test above.
- Every layout run rebuilds the **whole** dagre graph and re-positions **every** node (no incrementality) (`layoutUtils.js:201-270`).
- `CustomEdge` is `React.memo`-ized (`CustomEdge.jsx:203`), but its `buildOrthogonalBypassPath`/`getSmoothStepPath` run on **every re-render**, and a dragged node changes its adjacent edges' props → the whole set of incident edge paths recomputes each drag-stop; there is no string-level path cache.
- `enrichedNodes` (`App.jsx:1881`) and dynamic `translateExtent` (`App.jsx:1828-1838`) are O(all nodes) on every `nodes` change.
- `onlyRenderVisibleElements` is on, so hidden nodes are skipped by the renderer — **but** `translateExtent` and `enrichedNodes` still scan all nodes, and dagre reads every node on the next layout.
- `dagre@0.8.5` is synchronous, single-threaded; the ~107-node perf test costs < 2 s in CI but is not scaled to 300–600 nodes.
- Edge lane routing is O(E) with constant laneCount per node; no spatial index.

**Observed behavior (reported, not measured here):** large flows (hundreds of nodes) are sluggish when dragging/fit-viewing; magic layout occasionally stacks merge clusters and long LR chains unless manually nudged.

**Hypothesis (needs measurement):**
- A 500-node LR dagre run is ~O(V²) worst-case during crossing reduction on wide ranks; combined with the 0.5s CSS transition applied to all nodes and the full `setNodes`, expected UI block on the main thread for hundreds of ms.
- Edge path computation on drag-stop for 500+ edges can exceed one frame (16ms) — leading to visible jumps.

---

## 10. Performance Risks (explicit list)

1. **No virtualization beyond viewport culling** — hidden nodes still exist in state, translateExtent, enriched arrays, dagre, save payloads (all nodes serialized on every save).
2. **Full-graph re-layout with full `setNodes`** on every Magic Organize / auto-layout / Clean Layout call — no partial/delta update.
3. **Every node drag stop rewrites all nodes** (only the dragged one's position changes in `setNodes`/`saveToHistory`, but the arrays are shallow-copied and all incident edge paths recompute in `CustomEdge` on re-render).
4. **`onlyRenderVisibleElements: true` + mini map** — MiniMap renders an SVG representation of all nodes/edges each frame during pan/zoom; on multi-hundred graphs this is the classic MiniMap bottleneck (React Flow renders minimap nodes via the node render function).
5. **No web worker** for layout or pathfinding; dagre + bypass math run on the main thread.
6. **CRDT doc growth**: every position edit in a collab session writes {x,y} maps; history/undo flatten copies of all nodes/edges per undo entry (max 20 in `useFlowState.js` — `history.past` cap 20).
7. **`saveToHistory` before every layout** snapshots the full graph → high memory churn on repeated layout toggling in big graphs.
8. **No debounce on fit-view/render** during drag; `translateExtent` recompute is O(n) per update anyway.

---

## 11. Current Technical Debt

- Node sizing in `getLayoutSize` (`layoutUtils.js:160-180`) uses `measured` sizes when available, but falls back to the 172×60 constants for anything not yet rendered — and with `onlyRenderVisibleElements: true`, off-screen nodes are culled, so early/mid-graph nodes keep the 172×60 approximation and ranked gaps can be off.
- `compound: true` without subgraphs; branch-spacing and merge-spacing are ad-hoc post-passes that produce run-specific gaps, not a general layered-tree result.
- Auto-layout on load without user consent (see §7.3) — silently destroys manual arrangements.
- Dead/legacy config: `NODE_POSITION_CONFIG` (`constants.js:3193`) is exported but referenced nowhere.
- Two copies of canvas config (Dashboard `staticFlowProps` vs Report `figmaConfig` spread in `constants.js:3187`) — drift-prone.
- `.bak` files in the tree (`useFlowExecution.js.bak`) — stale code.
- `useFlowExecution`'s topological order is **layout-coupled** (`orderStartNodes` uses node position x to break ties) — layout changes can change run order of otherwise-order-independent roots.
- Duplicated/overriden edge styling: `useFlowState.js:32-47` defines `#ff8c32` + `animated: !DEV` in `defaultEdgeOptions`, but `CustomEdge` unconditionally overrides stroke/width and never animates — two sources of truth for edge look.
- Edge routing logic is in the component (visual), not in a pure geometry module — hard to unit-test / reuse for "avoid edge reprocessing" caching.
- No layout settings: direction always LR, no option to preserve positions, no mini-layout of selection, no compaction of huge gaps.
- Multiple table-of-contents-level strings ("Magic Organize", "Clean Layout", "separate label at fit") in three languages (en/es/fr/pt) — UI copy is i18n'd but layout behavior is not.

---

## 12. Candidate Architecture (requirements-shaped, not final)

Guiding principle for the future plan: **decouple graph model → ranking/geometry → edge routing → rendering → persistence**, keep manual positions as the source of truth by default, and make automatic layout an explicit, incremental, undoable action.

### 12.1 Replace dagre for LR with a deterministic layered engine (or ELK)
- Problem: dagre 0.8.5 LR (rightward ranks) cannot produce the clean linear "pipeline" HalTest runs want; `align:UL` + `tight-tree` cause cramped, overstructured ranks.
- Candidate: **ELK layered layout** (compaction + edge routing + proper LR), or a hand-rolled layered layout on the *directed segment* of the DAG.
- Why: LR pipelines with orthogonal edges = ELK's home turf; open-source (Eclipse license); works headless (web worker).
- What it does NOT solve: cycle handling, layout of composite sub-flow *insides*, edge-label collisions (HalTest has none), preservation of manual tweaks.
- Integration cost: `layoutUtils.js` becomes a thin adapter running in a worker (§12.4); node-size source switches from `getLayoutSize`'s mixed measured/fallback to measured-everywhere (incl. culled nodes via a measurement pass, §12.5).
- Risks: ELK worker lib adds ~1MB; API surface different from dagre (async), need cancellation.

### 12.2 Edge routing: orthogonal router separated from rendering
- Problem: bypass lanes limited to 3 and gap-based; no node-free guarantee.
- Candidate: precompute orthogonal routes per (sourceId,targetId,ports) with a **simple grid/A* on the layout tombstone**, cache per (node id hash + port) and invalidate only on movement of neighbors.
- Integration: `CustomEdge` becomes consumer of a `useEdgeRouter`; cache in a module-level Map with LRU; routes are stable unless a node in the swept region moves.
- Risk: A* on big graphs; mitigate with coarse grid + lane snapping; keep smoothstep fallback.

### 12.3 Position policy: manual by default, layout on demand
- Problem: auto-layout on first load overwrites stored positions and eventually autosaves them.
- Candidates: (a) gate the `App.jsx:285` effect behind a setting flag + first-open dialog; (b) make layout always undoable (already structurally possible); (c) only run auto-layout when a flow has **no** meaningful positions (all equal or `{0,0}`) or on import; (d) store a `layoutVersion` per flow so "silent" re-layouts don't repeatedly churn.
- Integration cost: tiny (one effect + settings toggle + optional flow flag).
- Risk: users who relied on the auto-arrange get blank layouts — mitigate by keeping the "Magic Organize" button and context-menu entry.

### 12.4 Web worker + incremental dirty-tracking
- Move dagre/ELK + bypass route computation to a worker; React Flow state updates via postMessage → `setNodes` batched; support `onLayout` with progress/cancel.
- Incremental: only re-layout columns whose membership changed since last run (pending tests needed).

### 12.5 Real node sizes everywhere
- `getLayoutSize` already prefers `measured` sizes, but branch/switch and loop/for_each sizes are hardcoded and measurement is skipped for culled (hidden) nodes. Improve by measuring a hidden-node "layout pass" (custom `useInternalNode` data or temporarily disabling `onlyRenderVisibleElements` during the layout measurement) so every node's true bounds feed the ranker and the 172×60 padding fallbacks never drive the result.

### 12.6 Minimap + large-graph rendering overhaul
- MiniMap: render a **data-derived** node-map (hv rects) rather than re-running node components; debounce updates during pan/zoom (§10.4).
- Large-graph: keep `onlyRenderVisibleElements` but also skip `enrichedNodes`, `translateExtent`, and edge-lane work for off-screen subsets; consider a flat spatial hash for hit-testing only if it becomes measurably slow.

### 12.7 Composite-flow availability
- Investigate rendering component/loop internals *inside* the box (nested layout via separate ELK runs) or at minimum show sub-flow node/edge silhouette in the minimap for the parent flow.
- Risk: nested-level zoom interaction with React Flow (no folders) — likely needs a "detail pane" rather than true nesting.

### 12.8 DevEx / observability
- Add a `perf` dev panel (today only `PerformanceDashboard.jsx` for metrics dashboard + `MetricsCollector.js` on backend — nothing canvas-specific, and the sole existing canvas-perf signal is the 107-node unit test in `layoutUtils.test.js`): measure layout ms, edge-path ms, drag FPS, undo/redo memory.

---

## 13. Recommended Areas for Further Investigation

1. **Runtime profile with realistic graphs** (300–600 nodes, 2–5 branches): the only perf data today is the unit-level 107-node <2s ceiling test (`layoutUtils.test.js:181-230`); we need browser-measured (a) initial dagre, (b) drag-stop path recompute, (c) minimap during pan/zoom, (d) `enrichedNodes`/extent recompute.
2. **Merge/branch post-pass behavior on deep LR pipelines** (many merges): verify whether gaps become visibly non-uniform across depths (dagre `ranksep 90` fixed + spacing post-passes).
3. **CRDT + layout interplay**: what happens if an editor runs Magic Organize while others are dragging; whether Yjs position maps produce concurrent-set conflicts that undo-only history can't express.
4. **Sub-flow reference nodes in parent layout**: whether `data.flowId` nodes should be sized from their true subgraph size, and how explorer drag-reuse (`App.jsx:1741`) positions them today.
5. **`viewport` JSON on Flow rows**: it's stored but `mapFlowData` doesn't round-trip it — verify no survivor path expects it (would affect "save and return to last position" UX).

---

## 14. Questions Still Unanswered

- Does the initial auto-layout actually persist (the edit-guard theory in §7.3) — needs a live repro/verification in a browser.
- Is dagre 0.8.5 actually invoked from anywhere else (custom edge test dead code)? Only `layoutUtils.js` imports it (grep confirms single import).
- Exact ELK-in-worker bundle overhead for HalTest's deploy target (local node binary? browser? both?).
- Whether "arrange selection only" is a real requirement (nothing in the codebase hints at it).
- Whether users' flows are predominantly LR pipelines or contain significant back-edges/loops (which dagre cannot rank without cycle-breaking).

---

## 15. Limitations & Honesty

- This is static analysis. No browser run, no measurements. All perf-related claims are code-path-analysis-based and clearly labeled **Hypothesis**.
- Line numbers are from the working tree at the time of writing; the repo is under active development.
- `.bak` files and the `Viewport` reopen mean some paths (viewport round-trip) may be superstitions — flagged rather than asserted.
- "Confirmed by code" means the file/line evidence exists; it does not mean the behavior is observed at runtime.

---

## 16. Files Referenced

| Area | File |
|---|---|
| Layout engine | `apps/frontend/src/utils/layoutUtils.js` (+ `layoutUtils.test.js`) |
| Canvas store / layout | `apps/frontend/src/hooks/flow/useFlowState.js` (onLayout 1222; undo 546/565; history 311) |
| Canvas component | `apps/frontend/src/App.jsx` (auto-layout effect 281-292; flowConfig 1969; staticFlowProps 1820; ReactFlow 2376; controls 2397; drop 1720; onNodeDragStop 1769; context menu 2508) |
| Edge rendering | `apps/frontend/src/components/edges/CustomEdge.jsx`; `CustomConnectionLine.jsx`; `edges/index.js` |
| Node rendering | `apps/frontend/src/components/nodes/` (`index.js`, `ComponentNode.jsx`, `LoopNode.jsx`, `ForEachNode.jsx`, `AbyssNode.jsx`, `InputNode.jsx`, `OutputNode.jsx`) |
| Minimap / overlays | `apps/frontend/src/components/StyledMiniMap.jsx` |
| Orchestration | `apps/frontend/src/components/hooks/useFlowManager.js` |
| Persistence/sync | `apps/frontend/src/hooks/flow/useFlowSync.js`; `apps/frontend/src/utils/ProjectManager.js`; `apps/frontend/src/utils/subFlowCache.js` |
| Collaboration | `apps/frontend/src/collaboration/CollaborationProvider.jsx`, `useCRDTNodes.js`, `useCRDTEdges.js`, `RemoteCursors.jsx` |
| Settings | `apps/frontend/src/context/SettingsContext.jsx` |
| Interaction config | `apps/frontend/src/hooks/useFigmaInteraction.js` |
| Execution order | `apps/frontend/src/hooks/flow/useFlowExecution.js` (`orderStartNodes` at 39), `useFlowExecution.js.bak` |
| Shortcuts | `apps/frontend/src/hooks/useKeyboardShortcuts.js` |
| Constants | `apps/frontend/src/components/hooks/constants.js` (`NODE_POSITION_CONFIG` 3193, report staticFlowProps 3179-3187) |
| Backend models | `apps/backend/database/models/Node.js`, `Edge.js`, `Flow.js` |
| Backend API | `apps/backend/routes/project.router.js` (mapFlowData 36; GET flow 1309; PUT flow 1419; POST flow 1216; import-subflow 813) |
| Backend import/export | `apps/backend/services/ProjectExportService.js`, `ProjectImportService.js` |
| Misc | `test-dagre.js` (repo root), `apps/frontend/src/utils/graphPropagation.js` (design-time context, NOT layout) |

---

## 17. Executive Technical Summary

### Current Architecture
Single React Flow v12 `<ReactFlow>` in `App.jsx` hosting whichever flow is active; central store `useFlowState.js`; orchestration via `useFlowManager`; persistence via `useFlowSync` → `ProjectManager` → backend REST; optional Yjs CRDT collaboration. Canvas config from `staticFlowProps` + `figmaConfig` with viewport culling, dynamic translateExtent, grid snapping, strict connection mode, custom node/edge types. Reports use a second, read-only ReactFlow.

### Magic Organizer
One layout engine: dagre 0.8.5, LR (`align UL`, `ranker tight-tree`, `nodesep 60`, `ranksep 90`; node sizes from `getLayoutSize` — measured when available, plus type overrides and padding), plus custom post-passes for branch/merge spacing, deterministic ordering, weighted TRUE-first lanes, and cycle-edge removal from layout. Invoked from auto-layout on first load, the "Magic Organize" control button, and the context menu "Clean Layout"; always snapshots history first (undoable), animates positions over 0.5s, then fits the view.

### Edge Routing
Every edge uses `memo`-iized `CustomEdge`: `getSmoothStepPath` for same-rank edges, or a dagre-gap-based orthogonal bypass for offsets > 30px (exit right at a 16/26/36px lane, single vertical drop inside the inter-rank gap, corner radii 10, max 3 fan-out lanes), with no fallback path. Color is theme-aware `var(--connection-line)` overridden by execution-state colors; animated particle was CPU-disabled.

### Position Persistence
Positions are persisted as JSON per node (`Node.position`) and exposed by the API via `mapFlowData`; CRDT sessions keep positions in the Yjs doc; import/export preserves them. **But** the auto-layout on every fresh Dashboard open overrides stored positions, and the first subsequent autosave persists that override — the single biggest position-integrity risk.

### Composite Nodes
Component/loop/for_each are flat React Flow nodes referencing other flows (`data.flowId`); no true nesting; subgraph resolved at execution (flattened) and cached 30s in `subFlowCache`; parent flow stores flow-level `parentId`/`type`; double-click drives `enterComponent`.

### Large Graph Limitations
No incremental layout, one synchronous dagre pass for everything, paths recomputed on drag-stop, `enrichedNodes`/translateExtent O(all nodes) on every update, MiniMap re-rendering every node during pan/zoom — all code-confirmed; the only measured signal is the 107-node unit perf ceiling, no browser-level harness.

### Performance Risks
Full-graph sync layout + full `setNodes`; unmonitored drag FPS; no worker; no edge-path caching; history snapshots whole graph per undo step (cap 20); MiniMap as full SVG per frame; large save payloads.

### Current Technical Debt
Mixed measured/fallback node sizing (`getLayoutSize`); compound flag without subgraphs; post-pass hack on dagre output; auto-layout without consent; dead `NODE_POSITION_CONFIG`; dual canvas configs (Dashboard vs Report) drifting; `.bak` files; layout-coupled execution order in `orderStartNodes`; edge routing trapped inside the visual component; duplicated edge-color definitions; no layout settings/minimap of sub-flows.

### Candidate Architecture
Layered LR engine replacing dagre (ELK or hand-rolled) in a web worker; true orthogonal edge router with LRU path cache; manual-by-default position policy with consent-based layout; real node sizes fed to the ranker; data-driven minimap; composite-flow silhouettes; incremental dirty-tracked re-layout; perf instrumentation panel.

### Recommended Areas for Further Investigation
Runtime profiling on 300–600 node graphs; branch/merge gap uniformity; CRDT-vs-layout concurrency; composite node sizing from true subgraph bounds; `Flow.viewport` round-trip semantics.

### Questions Still Unanswered
Does auto-layout actually persist in practice? Where else is dagre used? ELK worker bundle cost for HalTest's target runtime? Is selection-only arrangement a requirement? How prevalent are cycles vs LR pipelines in real user flows?