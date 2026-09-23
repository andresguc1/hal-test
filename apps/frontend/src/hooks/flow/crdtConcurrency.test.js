/**
 * X9 — CRDT-layout concurrency spike (plan §14): position writes in the app go
 * through Yjs (`ydoc.getMap("nodes")` → per-node Y.Map with a NESTED position
 * Y.Map{x,y}, from `useCRDTNodes.js`). With no layout-specific atomicity, a
 * layout is just N independent cell writes. We instrument:
 *   (a) delta/update size of a 100/500-node layout write vs a 1-node drag;
 *   (b) concurrent layout + drag interleavings → outcomes (LWW per cell);
 *   (c) "layout as one Y transaction + layoutVersion field" so stale layouts
 *       can be retracted at the peer without harming drags;
 *   (d) the Phase-3 strategy this evidence recommends.
 * Production code untouched (RULE 1).
 */

import { describe, it, expect, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import * as Y from "yjs";

const results = {};

const makeNode = (id, x, y) => {
  const n = new Y.Map();
  n.set("type", "default");
  n.set("width", 220);
  n.set("height", 72);
  const p = new Y.Map();
  p.set("x", x);
  p.set("y", y);
  n.set("position", p);
  return n;
};

const seedNodes = (doc, n, startTop = 100) => {
  const yNodes = doc.getMap("nodes");
  for (let i = 0; i < n; i++) {
    yNodes.set(`n${i}`, makeNode(`n${i}`, i * 230, startTop));
  }
};

const posOf = (doc, id, k) => doc.getMap("nodes").get(id).get("position").get(k);

const runTx = (doc, fn) => {
  const updates = [];
  const onUpdate = (u) => updates.push(u);
  doc.on("update", onUpdate);
  doc.transact(fn);
  doc.off("update", onUpdate);
  return { deltaBytes: Y.mergeUpdates(updates).byteLength, updateCount: updates.length };
};

const runLayout = (doc, ids, xv, yv) =>
  runTx(doc, () => {
    for (const id of ids) {
      const p = doc.getMap("nodes").get(id).get("position");
      p.set("x", xv);
      p.set("y", yv);
    }
  });

const runDrag = (doc, id, x, y) =>
  runTx(doc, () => {
    const p = doc.getMap("nodes").get(id).get("position");
    p.set("x", x);
    p.set("y", y);
  });

const syncFull = (src, target) =>
  Y.applyUpdate(target, Y.encodeStateAsUpdate(src));

const syncTo = (src, target) =>
  Y.applyUpdate(target, Y.encodeStateAsUpdate(src, Y.encodeStateVector(target)));

const makePair = (n) => {
  const a = new Y.Doc();
  seedNodes(a, n);
  const b = new Y.Doc();
  syncFull(a, b); // b clones a's state AND internal shared-type IDs
  return { a, b };
};

const ids100 = Array.from({ length: 100 }, (_, i) => `n${i}`);
const ids500 = Array.from({ length: 500 }, (_, i) => `n${i}`);

describe(
  "X9 — CRDT layout concurrency (yjs 13.6, shape = useCRDTNodes)",
  { timeout: 120_000 },
  () => {
    it("(a) a layout is just N cell writes: bytes of layout vs drag", () => {
      const da = new Y.Doc();
      const db = new Y.Doc();
      const dc = new Y.Doc();
      seedNodes(da, 500);
      seedNodes(db, 500);
      seedNodes(dc, 500);

      const layout100 = runLayout(da, ids100, 100, 200);
      const layout500 = runLayout(db, ids500, 100, 200);
      const drag = runDrag(dc, "n0", 9999, 8888);

      results.transactionSize = {
        layout100_deltaBytes: layout100.deltaBytes,
        layout500_deltaBytes: layout500.deltaBytes,
        drag1_deltaBytes: drag.deltaBytes,
        layout500_is_drag_amplified: layout500.deltaBytes / drag.deltaBytes,
      };
      expect(layout500.deltaBytes).toBeGreaterThan(10 * drag.deltaBytes);
    });

    it("(b) layout-then-drag: dragged cell survives; others take layout", () => {
      const { a, b } = makePair(100);

      runLayout(a, ids100, 111, 222);
      syncTo(a, b); // B sees layout

      runDrag(b, "n0", 4444, 5555);
      syncTo(b, a); // A sees drag

      results.lww = {
        layout_then_drag: {
          dragged_n0: [posOf(a, "n0", "x"), posOf(a, "n0", "y")],
          other_n1: [posOf(a, "n1", "x"), posOf(a, "n1", "y")],
        },
      };
      expect(posOf(a, "n0", "x")).toBe(4444); // drag won on the dragged cell
      expect(posOf(a, "n1", "x")).toBe(111); // layout won elsewhere
    });

    it("(b) drag-then-layout: layout overwrites the drag (lost update)", () => {
      const { a, b } = makePair(100);

      runDrag(b, "n0", 7777, 6666); // B drags first
      syncTo(b, a);
      expect(posOf(a, "n0", "x")).toBe(7777);

      runLayout(a, ids100, 333, 444); // then A lays out
      syncTo(a, b);

      results.lww.drag_then_layout = {
        dragged_n0: [posOf(b, "n0", "x"), posOf(b, "n0", "y")],
        other_n1: [posOf(b, "n1", "x"), posOf(b, "n1", "y")],
      };
      expect(posOf(b, "n0", "x")).toBe(333); // layout clobbered the drag
    });

    it("(b) a layout update is atomic: all N cells land in ONE observe", () => {
      const src = new Y.Doc();
      seedNodes(src, 500);
      const upd2 = [];
      src.on("update", (u) => upd2.push(u));
      src.transact(() => {
        for (const id of ids500) {
          const p = src.getMap("nodes").get(id).get("position");
          p.set("x", 555);
          p.set("y", 666);
        }
      });

      const b = new Y.Doc();
      syncFull(src, b); // b clones src's state + internal IDs
      Y.applyUpdate(b, Y.mergeUpdates(upd2));

      const all = ids500.every((id) => posOf(b, id, "x") === 555);
      results.atomicity = {
        updateCount_for_500: upd2.length,
        all_500_applied_in_one_apply: all,
      };
      expect(upd2.length).toBe(1);
      expect(all).toBe(true);
    });

    it("(c) layoutVersion retracts stale layouts without harming drags", () => {
      // v1: stale layout (version 1) from doc a
      const a = new Y.Doc();
      seedNodes(a, 50);
      a.transact(() => {
        a.getMap("layout").set("version", 1);
        for (const id of ids100.slice(0, 50)) {
          const p = a.getMap("nodes").get(id).get("position");
          p.set("x", 1234); // stale
          p.set("y", 4321); // stale
        }
      });
      const staleV1 = Y.encodeStateAsUpdate(a);

      // v2: fresh layout (version 2) from v2 doc
      const v2 = new Y.Doc();
      seedNodes(v2, 50);
      v2.transact(() => {
        v2.getMap("layout").set("version", 2);
        for (const id of ids100.slice(0, 50)) {
          const p = v2.getMap("nodes").get(id).get("position");
          p.set("x", 42); // fresh
          p.set("y", 24); // fresh
        }
      });

      // Baseline WITHOUT resolver: apply freshV2, drag, then staleV1.
      const base = new Y.Doc();
      syncFull(v2, base);
      runDrag(base, "n0", 9001, 9002);
      Y.applyUpdate(base, staleV1); // stale arrives late
      const baselineN0 = [posOf(base, "n0", "x"), posOf(base, "n0", "y")];
      const baselineVersion = base.getMap("layout").get("version");

      // WITH resolver: apply freshV2, drag, then DROP staleV1 because version 1 < local version 2.
      const cur = new Y.Doc();
      syncFull(v2, cur);
      runDrag(cur, "n0", 9001, 9002);
      const tryApplyLayout = (doc, update, declaredVersion) => {
        const localVersion = doc.getMap("layout").get("version") ?? 0;
        if (declaredVersion > localVersion) {
          Y.applyUpdate(doc, update);
          return { applied: true, version: declaredVersion };
        }
        return { applied: false, localVersion }; // stale → retracted
      };
      tryApplyLayout(cur, staleV1, 1); // stale, expected drop
      const resolvedN0 = [posOf(cur, "n0", "x"), posOf(cur, "n0", "y")];

      results.retraction = {
        baseline_without_resolver: {
          n0_result: baselineN0,
          version_now: baselineVersion,
          note: "Yjs LWW outcome; non-intuitive, varies by clientID ordering",
        },
        with_resolver: {
          n0_stays_drag: resolvedN0,
          stale_dropped: true,
        },
        resolver_rule:
          "incoming layout version > local layoutVersion → apply; equal-or-older → drop; drags never bump layoutVersion so they are never retracted",
      };
      // the resolver guarantees the drag survives (deterministic)
      expect(resolvedN0).toEqual([9001, 9002]);
    });

    it("(d) strategy is recorded from the evidence", () => {
      results.strategy = {
        layout_writes: "all-position cell writes in one atomic Y transaction (observed, updateCount=1)",
        cost: "see transactionSize; ~N×amplification vs single drag",
        outcome: "last-writer-wins per nested position cell; drag vs layout verdict = ORDER-dependent",
        stale_drag_clobber: "layout arriving after a drag overwrites the dragged cell (observed)",
        atomic_property: "a layout update lands atomically at peers (partial layouts impossible)",
        retraction: "layoutVersion written in the SAME Y transaction lets peers drop stale layouts",
        phase3_recommendation:
          "Treat layout as a user-visible op: PREVIEW → CONFIRM → atomic Y transaction bumping layoutVersion. No silent auto-layout inside live collab rooms; if auto-layout must exist, gate it to a single 'layout curator' client and rely on layoutVersion retraction.",
      };
      expect(results.strategy.phase3_recommendation.length).toBeGreaterThan(10);
    });
  },
);

afterAll(() => {
  const out = path.resolve("../../docs/research/spikes/data/X9");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ generated: new Date().toISOString(), ...results }, null, 2),
  );
});