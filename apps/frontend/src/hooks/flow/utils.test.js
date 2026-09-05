import { describe, it, expect } from "vitest";
import {
  applyConfigurationUpdate,
  getContainerFlowId,
} from "./utils";

describe("applyConfigurationUpdate", () => {
  const baseNode = {
    id: "node_1",
    type: "component",
    data: {
      type: "component",
      label: "Old Label",
      customLabel: "Old Label",
      flowId: "old_flow",
      nodeCount: 3,
      hasInput: true,
      hasOutput: true,
      configuration: {
        flowId: "old_flow",
        mode: "count",
      },
    },
  };

  it("merges newConfig into data.configuration", () => {
    const next = applyConfigurationUpdate(baseNode, {
      flowId: "new_flow",
      customLabel: "New Label",
    });

    expect(next.data.configuration.flowId).toBe("new_flow");
    expect(next.data.configuration.mode).toBe("count");
    expect(next.data.configuration.customLabel).toBe("New Label");
  });

  it("promotes flowId to top-level node.data so runtime resolvers see it", () => {
    const next = applyConfigurationUpdate(baseNode, { flowId: "new_flow" });

    expect(next.data.flowId).toBe("new_flow");
    expect(getContainerFlowId(next)).toBe("new_flow");
  });

  it("promotes nodeCount/hasInput/hasOutput metadata to top-level", () => {
    const next = applyConfigurationUpdate(baseNode, {
      nodeCount: 7,
      hasInput: false,
      hasOutput: false,
    });

    expect(next.data.nodeCount).toBe(7);
    expect(next.data.hasInput).toBe(false);
    expect(next.data.hasOutput).toBe(false);
  });

  it("preserves existing top-level container metadata when not overridden", () => {
    const next = applyConfigurationUpdate(baseNode, { mode: "once" });

    expect(next.data.flowId).toBe("old_flow");
    expect(next.data.nodeCount).toBe(3);
    expect(next.data.hasInput).toBe(true);
    expect(next.data.hasOutput).toBe(true);
  });

  it("does not pollute configuration with the whole node.data", () => {
    const next = applyConfigurationUpdate(baseNode, { flowId: "new_flow" });

    expect(next.data.configuration.nodeCount).toBeUndefined();
    expect(next.data.configuration.hasInput).toBeUndefined();
    expect(next.data.configuration.configuration).toBeUndefined();
  });

  it("updates label/customLabel/description only when provided by newConfig", () => {
    const next = applyConfigurationUpdate(baseNode, {
      customLabel: "Renamed",
      label: "Renamed",
    });

    expect(next.data.label).toBe("Renamed");
    expect(next.data.customLabel).toBe("Renamed");

    const untouched = applyConfigurationUpdate(baseNode, { flowId: "x" });
    expect(untouched.data.label).toBe("Old Label");
    expect(untouched.data.customLabel).toBe("Old Label");
  });

  it("falls back to the node type label when neither newConfig nor data provide one", () => {
    const bare = { id: "node_2", type: "launch_browser", data: {} };
    const next = applyConfigurationUpdate(bare, { flowId: "new_flow" });

    expect(next.data.flowId).toBe("new_flow");
    expect(next.data.label).toBeTruthy();
    expect(next.data.configuration.flowId).toBe("new_flow");
  });

  it("does not mutate the original node", () => {
    const snapshot = JSON.stringify(baseNode);
    applyConfigurationUpdate(baseNode, { flowId: "new_flow" });

    expect(JSON.stringify(baseNode)).toBe(snapshot);
  });
});

describe("getContainerFlowId", () => {
  it("prefers top-level data.flowId over configuration.flowId", () => {
    expect(
      getContainerFlowId({
        data: { flowId: "a", configuration: { flowId: "b" } },
      }),
    ).toBe("a");
  });

  it("falls back to configuration.flowId when top-level is missing", () => {
    expect(
      getContainerFlowId({
        data: { configuration: { flowId: "b" } },
      }),
    ).toBe("b");
  });

  it("returns null when no flowId is present", () => {
    expect(getContainerFlowId({ data: {} })).toBeNull();
    expect(getContainerFlowId(null)).toBeNull();
    expect(getContainerFlowId({})).toBeNull();
  });
});