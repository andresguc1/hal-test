/**
 * X7 — ELK worker harness (served by the vite dev server).
 *
 * Imports elkjs through vite's transform so Playwright can spawn a module
 * Worker (same-origin /e2e/elkWorker.js) and run the layout OFF the main
 * thread. Used by e2e/x7-elk-worker.spec.js to prove: (a) ELK runs in a real
 * browser Worker, (b) output is byte-identical to the Node-side reference,
 * (c) zero main-thread longtasks during the worker layout.
 */
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

self.onmessage = async ({ data }) => {
  const { id, graph } = data;
  try {
    const out = await elk.layout(graph);
    self.postMessage({
      id,
      positions: (out.children || []).map((c) => [
        c.id,
        Math.round(c.x * 1000) / 1000,
        Math.round(c.y * 1000) / 1000,
        c.width,
        c.height,
      ]),
    });
  } catch (err) {
    self.postMessage({ id, error: String(err?.stack || err) });
  }
};
