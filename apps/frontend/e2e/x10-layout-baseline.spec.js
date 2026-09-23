/**
 * X10 — PERFORMANCE BASELINE of the CURRENT Magic Organizer (dagre, LR).
 *
 * Measures, in the real browser, what a layout pass costs today across seeded
 * dataset sizes/shapes BEFORE any engine work (X4/X6). Provides GATE 1/GATE 3
 * inputs and the numbers that any alternative engine must beat.
 *
 * What is measured (MEASURED EXPERIMENTALLY, OBSERVED RUNTIME):
 *   loadMs   — page nav → first layout+render settle (includes the automatic
 *              onLayout("LR") that runs on every mount, App.jsx:285-292).
 *   layoutMs — a manual Magic Organize click (toolbar) after load settled,
 *              timed from click until positions stop changing.
 *   longtasks— main-thread blocking >50ms (PerformanceObserver) in each phase.
 *   visibleNodes — DOM node count (onlyRenderVisibleElements culls the rest).
 *
 * Runs use the frozen seeded generators (test/fixtures/layout/export.js), so
 * every trial is reproducible; results go to
 * docs/research/spikes/data/X10/results.json.
 */

import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { datasetLinear, datasetBranching } from "../test/fixtures/layout/export.js";

const API = "http://localhost:2001";
const storeDir = path.resolve(process.cwd(), "../../docs/research/spikes/data/X10");

function storeResults(caseName, measurements) {
  mkdirSync(storeDir, { recursive: true });
  const file = path.join(storeDir, "results.json");
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { cases: {} };
  prev.cases[caseName] = { ...measurements, at: new Date().toISOString() };
  writeFileSync(file, JSON.stringify(prev, null, 2));
}

const nodeToPayload = (n) => ({
  id: n.id,
  nodeId: n.id,
  type: n.type,
  position: n.position,
  data: n.data,
  width: n.width,
  height: n.height,
});
const edgeToPayload = (e) => ({
  id: e.id,
  edgeId: e.id,
  source: e.source,
  target: e.target,
  sourceHandle: e.sourceHandle,
});

async function createProjectWithFlow(seed, fixture) {
  const pj = await fetch(`${API}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `X10-${Date.now()}-${seed}`, nodes: [], edges: [] }),
  });
  if (!pj.ok) throw new Error(`create project failed: ${pj.status}`);
  const { project } = await pj.json();
  const fl = await fetch(`${API}/api/projects/${project.id}/flows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "main",
      type: "main",
      nodes: fixture.nodes.map(nodeToPayload),
      edges: fixture.edges.map(edgeToPayload),
    }),
  });
  if (!fl.ok) throw new Error(`create flow failed: ${fl.status}`);
  const { flow } = await fl.json();
  await fetch(`${API}/api/projects/${project.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activeFlowId: flow.id }),
  });
  return { project, flow };
}

function installLongtaskObserver() {
  // runs before any page script via addInitScript
  window.__x10 = {
    lt: [],
    ltSum: 0,
    ltPhase: 0,
    layoutStart: 0,
    tNav: performance.now(),
  };
  try {
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__x10.lt.push({ phase: window.__x10.ltPhase, d: e.duration });
        window.__x10.ltSum += e.duration;
      }
    });
    obs.observe({ type: "longtask", buffered: true });
  } catch {
    /* PerformanceObserver unavailable */
  }
}

function settleDetector() {
  window.__frameLog = [];
  window.__frameStart = -1;
  window.__settleAt = 0;
  return new Promise((resolve) => {
    const sample = () => {
      const nodes = document.querySelectorAll(".react-flow__node");
      if (!nodes.length) {
        window.__frameLog = [];
        requestAnimationFrame(sample);
        return;
      }
      const sig = `${[...nodes].slice(0, 20).map((n) => n.style.transform).join("|")}:${nodes.length}`;
      const now = performance.now();
      if (window.__frameLog.length === 0) window.__frameStart = now;
      window.__frameLog.push(sig);
      if (window.__frameLog.length >= 3) {
        const recent = window.__frameLog.slice(-3);
        const span = now - window.__frameStart;
        if (span >= 350 && recent.every((s) => s === recent[0])) {
          window.__settleAt = now;
          resolve();
          return;
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const computePhase = (p, phase) =>
  p.evaluate((ph) => {
    const x = window.__x10;
    const lts = x.lt.filter((t) => t.phase === ph);
    return {
      phase: ph,
      longtaskCount: lts.length,
      longtaskSumMs: Math.round(lts.reduce((a, t) => a + t.d, 0) * 10) / 10,
      longtasks: lts.map((t) => Math.round(t.d)),
    };
  }, phase);

test.describe("X10 — layout engine baseline (current dagre LR)", () => {
  const TRIALS = [
    { id: "linear-100", builder: (s) => datasetLinear(100, s), seed: 424242 },
    { id: "linear-250", builder: (s) => datasetLinear(250, s), seed: 424243 },
    { id: "linear-500", builder: (s) => datasetLinear(500, s), seed: 424244 },
    { id: "branching-100", builder: (s) => datasetBranching(100, s), seed: 777001 },
    { id: "branching-250", builder: (s) => datasetBranching(250, s), seed: 777002 },
  ];

  for (const trial of TRIALS) {
    test(trial.id, async ({ page }) => {
      const fixture = trial.builder(trial.seed);
      const { project, flow } = await createProjectWithFlow(trial.seed, fixture);

      await page.addInitScript(
        ({ pid, fid }) => {
          try {
            localStorage.setItem("hal_last_project_id", pid);
            localStorage.setItem(`hal_last_flow_${pid}`, fid);
          } catch {
            /* ignore */
          }
        },
        { pid: project.id, fid: flow.id },
      );
      await page.addInitScript(installLongtaskObserver);

      await page.goto("/");
      await page.waitForSelector(".react-flow", { timeout: 60_000 });
      await page.waitForFunction(
        () => document.querySelectorAll(".react-flow__node").length >= 1,
        undefined,
        { timeout: 60_000 },
      );
      // initial layout runs automatically at mount; time until it settles
      await page.evaluate(() => {
        window.__frameLog = [];
        window.__frameStart = -1;
      });
      await page.waitForFunction(settleDetector, undefined, { timeout: 120_000 });
      const loadMs = await page.evaluate(() =>
        Math.round((window.__settleAt - window.__x10.tNav) * 10) / 10,
      );
      const loadPhase = await computePhase(page, 0);

      // manual Magic Organize click, timed in isolation
      await page.evaluate(() => {
        window.__x10.ltPhase += 1;
        window.__frameLog = [];
        window.__frameStart = -1;
        const btn = document.querySelector('button[title="Magic Organize"]');
        if (btn) {
          window.__x10.layoutStart = performance.now();
          btn.click();
        }
      });
      await page.waitForFunction(settleDetector, undefined, { timeout: 120_000 });
      const layoutMs = await page.evaluate(
        () => Math.round((window.__settleAt - window.__x10.layoutStart) * 10) / 10,
      );
      const layoutPhase = await computePhase(page, 1);
      const visibleNodes = await page.locator(".react-flow__node").count();

      const measurement = {
        trial: trial.id,
        seed: trial.seed,
        fixtureHash: fixture.hash,
        nodeCount: fixture.meta.nodeCount,
        edgeCount: fixture.meta.edgeCount,
        loadMs,
        layoutMs,
        loadPhase,
        layoutPhase,
        visibleNodes,
      };
      storeResults(trial.id, measurement);
      await test.info().attach(trial.id, {
        body: JSON.stringify(measurement, null, 2),
        contentType: "application/json",
      });

      // structural invariants only (numbers live in results.json)
      expect(visibleNodes).toBeGreaterThan(0);
      expect(loadMs).toBeGreaterThan(0);
    });
  }
});