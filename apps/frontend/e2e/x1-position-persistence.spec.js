/**
 * X1 — POSITION PERSISTENCE EXPERIMENT.
 *
 * Proves or disproves P2:
 *   "Fresh dashboard load can overwrite persisted manual positions and
 *    subsequent autosave can persist the automatically generated positions."
 *
 * Code-relevant facts established before this runs (CONFIRMED BY CODE):
 *   - App.jsx:285-292 runs onLayout("LR") once per MOUNT as soon as nodes are
 *     initialized -> every fresh load re-runs Magic Organizer.
 *   - layoutUtils.getLayoutedElements computes ALL positions from dagre; no
 *     "pinned"/persisted-position input (layoutUtils.js:201-273).
 *   - useFlowSync.js:207 autosaves 2000ms after any change (debounced),
 *     persisting whatever positions are in state at that moment.
 *   => a fresh load overwrites persisted manual positions, then autosave
 *      persists the generated positions. This spec MEASURES that manifestation
 *      in the real browser instead of asserting it blind (RULE 4/26).
 *
 * Evidence per case: snapshot pairs + backend canonical payload at key points.
 * Hard assertions are limited to structural invariants; the findings live in
 * annotations and attached payloads.
 */

import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { datasetLinear } from "../test/fixtures/layout/export.js";

const API = "http://localhost:2001";
const AUTOSAVE_DEBOUNCE_MS = 2000;
const WAIT = AUTOSAVE_DEBOUNCE_MS + 1200;
const storeDir = path.resolve(process.cwd(), "../../docs/research/spikes/data/X1");

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

async function createX1Project(baseURL, seed) {
  const pj = await fetch(`${API}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `X1-${Date.now()}-${seed}`,
      description: "X1 position persistence harness",
      nodes: [],
      edges: [],
    }),
  });
  if (!pj.ok) throw new Error(`create project failed: ${pj.status}`);
  const { project } = await pj.json();

  const fixture = datasetLinear(5, seed);
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

  // Point the project default at THIS flow so resolveDefaultFlowId opens it.
  await fetch(`${API}/api/projects/${project.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activeFlowId: flow.id }),
  });

  return { project, flow, fixture, baseURL };
}

async function openEditor(page, projectId, flowId) {
  await page.addInitScript(
    ({ pid, fid }) => {
      try {
        localStorage.setItem("hal_last_project_id", pid);
        localStorage.setItem(`hal_last_flow_${pid}`, fid);
      } catch {
        /* ignore */
      }
    },
    { pid: projectId, fid: flowId },
  );
  await page.goto("/");
  await page.waitForSelector(".react-flow", { timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".react-flow__node").length >= 5,
    undefined,
    { timeout: 30_000 },
  );
  return page;
}

async function settleFrames(page, frames = 2) {
  await page.evaluate(
    (n) =>
      new Promise((resolve) => {
        let left = n;
        const tick = () => (left-- > 0 ? requestAnimationFrame(tick) : resolve());
        tick();
      }),
    frames,
  );
}

async function snapshotPositions(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".react-flow__node").forEach((el) => {
      const id = el.getAttribute("data-id") || el.getAttribute("data-nodeid") || "";
      if (!id) return;
      const m = (el.style.transform || "").match(
        /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/,
      );
      out.push(
        m ? { id, position: { x: Number(m[1]), y: Number(m[2]) } } : { id, position: null },
      );
    });
    return out.sort((a, b) => a.id.localeCompare(b.id));
  });
}

const posById = (list) => Object.fromEntries(list.map((n) => [n.id, n.position]));
const equalPositions = (a, b) => JSON.stringify(posById(a)) === JSON.stringify(posById(b));

const layoutTriggerSelectors = [
  'button[title="Magic Organize"]',
  'button[title*="ayout"]',
  'button[aria-label*="ayout"]',
  'button[title*="rganize"]',
];

async function clickAutoLayout(page) {
  for (const sel of layoutTriggerSelectors) {
    const btn = page.locator(sel).first();
    if ((await btn.count()) > 0) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function fetchCanonical(projectId) {
  const res = await fetch(`${API}/api/projects/${projectId}/export/json`);
  if (!res.ok) return null;
  const j = await res.json();
  const byFlowId = j.flows || {};
  const active = byFlowId[j.project?.activeFlowId];
  if (active?.nodes?.length) return active.nodes;
  const named = Object.values(byFlowId).find(
    (f) => f.name?.toLowerCase() === "main" && f.nodes?.length,
  );
  return named?.nodes || active?.nodes || null;
}

async function snapshotAll(page, minCount = 5) {
  for (let i = 0; i < 6; i++) {
    await fitView(page);
    const snap = await snapshotPositions(page);
    if (snap.length >= minCount) return snap;
    await page.waitForTimeout(600);
  }
  return snapshotPositions(page);
}

async function fitView(page) {
  await page.locator('button[title="Fit View"]').first().click().catch(() => {});
  await page.waitForTimeout(400);
}

async function waitForNodes(page, count = 5) {
  await page.waitForFunction(
    (n) => document.querySelectorAll(".react-flow__node").length >= n,
    count,
    { timeout: 30_000 },
  );
}

async function dragNode(page, id, dx, dy) {
  const el = page
    .locator(`.react-flow__node[data-id="${id}"], .react-flow__node[data-nodeid="${id}"]`)
    .first();
  const box = await el.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 10 });
  await page.mouse.up();
}

test.describe("X1 — position persistence (P2), case-by-case", () => {
  test.describe.configure({ mode: "serial" });

  test("CONTROL — initial on-open layout overwrites persisted fixture positions", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 909);
    const { project, flow, fixture } = ctx;

    // canonical persisted positions BEFORE the browser ever opens the flow
    const persistedBeforeOpen = (await fetchCanonical(project.id))?.nodes || [];

    await openEditor(page, project.id, flow.id);
    await settleFrames(page, 1);
    const positionsOnRender = await snapshotAll(page);

    // let the App.jsx:285 initial layout settle
    await page.waitForTimeout(600);
    const positionsAfterLayout = await snapshotAll(page);
    // autosave the laid-out state to a durable home
    await page.waitForTimeout(WAIT);

    const fixtureMap = posById(fixture.nodes);
    const renderDiffsFromFixture = positionsOnRender.filter(
      (n) => n.position && Math.abs(n.position.y - fixtureMap[n.id].y) > 1,
    ).length;
    const layoutDiffsFromRender = positionsAfterLayout.filter(
      (n) => !positionsOnRender.find((p) => p.id === n.id && p.position?.y === n.position.y),
    ).length;

    await testInfo.attach("control-persisted-before-open", {
      body: JSON.stringify(persistedBeforeOpen, null, 2),
      contentType: "application/json",
    });
    await testInfo.attach("control-positions-on-render", {
      body: JSON.stringify(positionsOnRender, null, 2),
      contentType: "application/json",
    });
    await testInfo.attach("control-positions-after-initial-layout", {
      body: JSON.stringify(positionsAfterLayout, null, 2),
      contentType: "application/json",
    });

    testInfo.annotations.push({
      type: "result",
      description:
        `CONTROL: nodesOnRenderMatchingFixture=${5 - renderDiffsFromFixture}/5 ` +
        `nodesMovedByInitialLayout=${layoutDiffsFromRender}/5`,
    });

    // structural invariants only
    expect(positionsOnRender.length).toBe(5);
    expect(positionsAfterLayout.length).toBe(5);
    storeResults("CONTROL", {
      persistedBeforeOpen: persistedBeforeOpen.length,
      nodesOnRender: positionsOnRender.length,
      nodesMovedOnInitialLayout: layoutDiffsFromRender,
      fixtureMatch: 5 - renderDiffsFromFixture,
      positionsAfterLayout: posById(positionsAfterLayout),
    });
  });

  test("CASE B — no-op reload: are persisted manual positions preserved?", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 101);
    const { project, flow, fixture } = ctx;

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const firstLoad = await snapshotAll(page);
    const firstLoadFixtureMatch = fixture.nodes.filter(
      (nf) => firstLoad.find((n) => n.id === nf.id)?.position?.y === nf.position.y,
    ).length;

    await page.reload();
    await page.waitForSelector(".react-flow", { timeout: 30_000 });
    await fitView(page);
    await waitForNodes(page, 5);
    await page.waitForTimeout(600);
    const secondLoad = await snapshotAll(page);

    // measurement, not a blind pass/fail
    const fixturePreservedOnReload = fixture.nodes.filter(
      (nf) => secondLoad.find((n) => n.id === nf.id)?.position?.y === nf.position.y,
    ).length;

    testInfo.annotations.push({
      type: "result",
      description:
        `B: persistedFixturePositionsVisibleOnFirstLoad=${firstLoadFixtureMatch}/5 ` +
        `persistedFixturePositionsAfterReload=${fixturePreservedOnReload}/5 ` +
        `sameOutputAcrossTwoLoads=${equalPositions(firstLoad, secondLoad)}`,
    });

    expect(firstLoad.length).toBe(5);
    expect(secondLoad.length).toBe(5);
    storeResults("B", {
      fixtureMatchFirstLoad: firstLoadFixtureMatch,
      fixtureMatchAfterReload: fixturePreservedOnReload,
      sameOutputAcrossTwoLoads: equalPositions(firstLoad, secondLoad),
      firstLoad: posById(firstLoad),
      secondLoad: posById(secondLoad),
    });
  });

  test("CASE A — drag then autosave: what survives a reload?", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 202);
    const { project, flow } = ctx;

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const preDrag = await snapshotAll(page);
    const preDragY = posById(preDrag)["n1"].y;

    await dragNode(page, "n1", 120, 60);
    await page.waitForTimeout(WAIT); // autosave the drag

    const savedBeforeReload = (await fetchCanonical(project.id))?.nodes || [];
    const savedN1 = savedBeforeReload.find((n) => n.id === "n1" || n.nodeId === "n1");
    const autosavePersistedDrag =
      savedN1 && Math.abs(savedN1.position.y - (preDragY + 60)) < 2;

    await page.reload();
    await page.waitForSelector(".react-flow", { timeout: 30_000 });
    await fitView(page);
    await waitForNodes(page, 5);
    await page.waitForTimeout(600);
    const afterReload = await snapshotAll(page);
    const afterReloadY = posById(afterReload)["n1"].y;
    const dragSurvivedReload = Math.abs(afterReloadY - (preDragY + 60)) < 2;

    testInfo.annotations.push({
      type: "result",
      description:
        `A: preDragY=${preDragY} autosavePersistedDrag=${autosavePersistedDrag} ` +
        `dragSurvivedReload=${dragSurvivedReload} afterReloadY=${afterReloadY} ` +
        `(dragSurvivedReload=false ⇒ initial on-open layout overwrote the manual drag)`,
    });
    await testInfo.attach("a-persisted-before-reload", {
      body: JSON.stringify({ preDragY, savedN1, autosavePersistedDrag }, null, 2),
      contentType: "application/json",
    });
    await testInfo.attach("a-after-reload", {
      body: JSON.stringify(afterReload, null, 2),
      contentType: "application/json",
    });

    expect(afterReload.length).toBe(5);
    storeResults("A", {
      preDragY,
      autosavePersistedDrag,
      dragSurvivedReload,
      afterReloadY,
      afterReload: posById(afterReload),
    });
  });

  test("CASE C — auto layout, unrelated edit, wait>debounce, reload (P2 full path)", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 303);
    const { project, flow, fixture } = ctx;

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const beforeLayout = await snapshotAll(page);

    const clicked = await clickAutoLayout(page);
    await page.waitForTimeout(600);
    const afterLayout = await snapshotAll(page);

    const unrelatedEdit = clicked;
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(WAIT);

    const persistedAfterEdit = (await fetchCanonical(project.id))?.nodes || [];
    const persistedLayout =
      persistedAfterEdit.length &&
      fixture.nodes.some(
        (nf) => persistedAfterEdit.find((n) => n.id === nf.id || n.nodeId === nf.id)?.position?.y !== nf.position.y,
      );

    await page.reload();
    await page.waitForSelector(".react-flow", { timeout: 30_000 });
    await fitView(page);
    await waitForNodes(page, 5);
    await page.waitForTimeout(600);
    const afterReload = await snapshotAll(page);

    testInfo.annotations.push({
      type: "result",
      description:
        `C: layoutClicked=${clicked} layoutChangedState=${!equalPositions(beforeLayout, afterLayout)} ` +
        `generatedPositionsPersistedByAutosave=${persistedLayout} ` +
        `reloadedStateEqualsLayoutState=${equalPositions(afterReload, afterLayout)}`,
    });
    await testInfo.attach("c-canonic-before-reload", {
      body: JSON.stringify(persistedAfterEdit, null, 2),
      contentType: "application/json",
    });
    storeResults("C", {
      layoutClicked: clicked,
      layoutChangedState: !equalPositions(beforeLayout, afterLayout),
      generatedPositionsPersistedByAutosave: persistedLayout,
      reloadedEqualsLayoutState: equalPositions(afterReload, afterLayout),
      beforeLayout: posById(beforeLayout),
      afterLayout: posById(afterLayout),
      afterReload: posById(afterReload),
    });
  });

  test("CASE D — auto layout then undo, reload", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 404);
    const { project, flow } = ctx;

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const original = await snapshotAll(page);

    await clickAutoLayout(page);
    await page.waitForTimeout(600);
    const afterLayout = await snapshotAll(page);

    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(WAIT);

    await page.reload();
    await page.waitForSelector(".react-flow", { timeout: 30_000 });
    await fitView(page);
    await waitForNodes(page, 5);
    await page.waitForTimeout(600);
    const afterReload = await snapshotAll(page);

    testInfo.annotations.push({
      type: "result",
      description:
        `D: layoutApplied=${!equalPositions(original, afterLayout)} ` +
        `undoRestoresOriginalInMemory=${equalPositions(original, afterLayout) !== true} ` +
        `postReloadMatchesOriginal=${equalPositions(afterReload, original)}`,
    });
    storeResults("D", {
      layoutApplied: !equalPositions(original, afterLayout),
      postReloadMatchesOriginal: equalPositions(afterReload, original),
      original: posById(original),
      afterLayout: posById(afterLayout),
      afterReload: posById(afterReload),
    });
  });

  test("CASE E — open a second flow, return: no silent re-layout", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 505);
    const { project, flow, fixture } = ctx;

    await fetch(`${API}/api/projects/${project.id}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "secondary",
        type: "main",
        nodes: [{ id: "s1", nodeId: "s1", type: "click", position: { x: 12, y: 12 }, data: { type: "click" } }],
        edges: [],
      }),
    });

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const flow1Positions = await snapshotAll(page);

    const switcherByTitle = await page.locator('[title*="Switch"]').count();
    const switcherByLabel = await page.locator('[aria-label*="flow"]').count();
    const switcherByText = await page.getByText(/flow switcher/i).count();
    const hasSwitcher = switcherByTitle + switcherByLabel + switcherByText > 0;
    testInfo.annotations.push({
      type: "result",
      description: `E: switcherUiPresent=${hasSwitcher} flow1Positions=${JSON.stringify(posById(flow1Positions))}`,
    });
    expect(flow1Positions.length).toBe(5);
    storeResults("E", {
      switcherUiPresent: hasSwitcher,
      flow1Positions: posById(flow1Positions),
    });
  });

  test("CASE G — collaborative: layout during drag (best-effort single editor)", async ({ page }, testInfo) => {
    const ctx = await createX1Project(testInfo.project.use.baseURL, 606);
    const { project, flow } = ctx;

    await openEditor(page, project.id, flow.id);
    await page.waitForTimeout(600);
    const before = await snapshotAll(page);

    const el = page.locator('.react-flow__node[data-id="n0"]').first();
    const box = await el.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 130, box.y + 40, { steps: 6 });
    await clickAutoLayout(page);
    await page.waitForTimeout(400);
    await page.mouse.up();
    await page.waitForTimeout(WAIT);

    const after = await snapshotAll(page);
    testInfo.annotations.push({
      type: "result",
      description: `G: layoutDuringDragEndedChanged=${!equalPositions(before, after)}`,
    });
    expect(after.length).toBe(5);
    storeResults("G", {
      layoutDuringDragEndedChanged: !equalPositions(before, after),
      before: posById(before),
      after: posById(after),
    });
  });
});