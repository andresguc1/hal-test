import { describe, it, expect } from "vitest";
import { deriveFlowData } from "./flowDerivation";

const compNode = (flowId, label) => ({
  type: "component",
  data: { flowId, label },
});

describe("deriveFlowData", () => {
  it("returns DB flows as-is when there are no live nodes", () => {
    const { flows } = deriveFlowData({
      dbFlows: [
        { id: "f1", name: "Main", type: "main" },
        { id: "f2", name: "Comp", type: "component" },
      ],
    });
    expect(flows.map((f) => f.id)).toEqual(["f1", "f2"]);
  });

  it("overlays live canvas component names onto DB component flows", () => {
    const { flows } = deriveFlowData({
      dbFlows: [{ id: "f2", name: "Old", type: "component" }],
      nodes: [compNode("f2", "Renamed Live")],
    });
    const comp = flows.find((f) => f.id === "f2");
    expect(comp.name).toBe("Renamed Live");
    expect(comp.isLive).toBe(true);
  });

  it("appends live canvas components that are not yet persisted", () => {
    const { flows } = deriveFlowData({
      dbFlows: [{ id: "f1", name: "Main", type: "main" }],
      nodes: [compNode("new-comp", "Fresh")],
    });
    const fresh = flows.find((f) => f.id === "new-comp");
    expect(fresh).toBeTruthy();
    expect(fresh.isLive).toBe(true);
    expect(fresh.name).toBe("Fresh");
  });

  it("does not resurrect a deleted flow that still has a live canvas node", () => {
    const { flows } = deriveFlowData({
      dbFlows: [{ id: "f2", name: "Comp", type: "component" }],
      nodes: [compNode("f2", "Comp")],
      deletedFlowIds: new Set(["f2"]),
    });
    expect(flows.find((f) => f.id === "f2")).toBeUndefined();
  });

  it("does not resurrect a deleted live-only component (not in DB)", () => {
    const { flows } = deriveFlowData({
      dbFlows: [],
      nodes: [compNode("gone", "Gone")],
      deletedFlowIds: new Set(["gone"]),
    });
    expect(flows).toEqual([]);
  });

  it("parses stringified flow nodes when scanning for component names", () => {
    const { flowName } = deriveFlowData({
      dbFlows: [
        {
          id: "f1",
          name: "Main",
          type: "main",
          nodes: JSON.stringify([compNode("c1", "Embedded Name")]),
        },
      ],
      currentFlowId: "c1",
    });
    expect(flowName).toBe("Embedded Name");
  });

  it("resolves the current flow name from DB when no override exists", () => {
    const { flowName } = deriveFlowData({
      dbFlows: [{ id: "f1", name: "Main Flow", type: "main" }],
      currentFlowId: "f1",
    });
    expect(flowName).toBe("Main Flow");
  });

  it("returns 'No Flow Selected' when nothing matches", () => {
    const { flowName } = deriveFlowData({ dbFlows: [], currentFlowId: null });
    expect(flowName).toBe("No Flow Selected");
  });

  it("ignores malformed stringified nodes without throwing", () => {
    const { flows } = deriveFlowData({
      dbFlows: [{ id: "f1", name: "Main", type: "main", nodes: "{not-json" }],
    });
    expect(flows.map((f) => f.id)).toEqual(["f1"]);
  });
});
