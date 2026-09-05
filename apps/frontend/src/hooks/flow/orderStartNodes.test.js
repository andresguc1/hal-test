import { describe, it, expect, beforeAll } from "vitest";

let orderStartNodes;

beforeAll(async () => {
  // useFlowExecution imports ScreenshotManager at module load, which opens
  // IndexedDB (not available in the node test env). Provide a dangling shim
  // BEFORE the dynamic import so no unhandled rejection is produced.
  if (!globalThis.indexedDB) {
    globalThis.indexedDB = {
      open: () => ({}),
      deleteDatabase: () => ({}),
    };
  }
  const mod = await import("./useFlowExecution");
  orderStartNodes = mod.orderStartNodes;
});

describe("orderStartNodes — deterministic run start", () => {
  it("puts launch_browser first regardless of array order", () => {
    const nodes = [
      { id: "gallery-click", type: "click" },
      { id: "launch", type: "launch_browser" },
      { id: "open-url", type: "open_url" },
    ];
    expect(orderStartNodes(nodes).map((n) => n.id)).toEqual([
      "launch",
      "gallery-click",
      "open-url",
    ]);
  });

  it("breaks entry ties in canvas order (top→bottom, left→right)", () => {
    const nodes = [
      { id: "bottom", type: "click", position: { x: 10, y: 100 } },
      { id: "top", type: "click", position: { x: 10, y: 20 } },
    ];
    expect(orderStartNodes(nodes).map((n) => n.id)).toEqual(["top", "bottom"]);
  });

  it("is stable when positions tie", () => {
    const nodes = [
      { id: "b-node", type: "click", position: { x: 0, y: 0 } },
      { id: "a-node", type: "click", position: { x: 0, y: 0 } },
    ];
    expect(orderStartNodes(nodes).map((n) => n.id)).toEqual([
      "a-node",
      "b-node",
    ]);
  });

  it("returns non-arrays unchanged", () => {
    expect(orderStartNodes(null)).toBeNull();
  });
});