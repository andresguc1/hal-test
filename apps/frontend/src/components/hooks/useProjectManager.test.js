import { describe, it, expect, beforeEach } from "vitest";
import { resolveDefaultFlowId } from "./useProjectManager";

describe("resolveDefaultFlowId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return null for empty project or flows", () => {
    expect(resolveDefaultFlowId(null)).toBeNull();
    expect(resolveDefaultFlowId({ flows: [] })).toBeNull();
  });

  it("should return the last edited flow from localStorage if it exists in the project", () => {
    const project = {
      id: "proj-1",
      flows: [
        { id: "flow-1", name: "Main Flow", type: "main" },
        { id: "flow-2", name: "User Auth Component", type: "component" },
        { id: "flow-3", name: "Checkout Flow", type: "main" },
      ],
    };

    localStorage.setItem("hal_last_flow_proj-1", "flow-2");

    expect(resolveDefaultFlowId(project)).toBe("flow-2");
  });

  it("should ignore localStorage flow if it is no longer in the project", () => {
    const project = {
      id: "proj-1",
      flows: [
        { id: "flow-1", name: "Main Flow", type: "main" },
        { id: "flow-3", name: "Checkout Flow", type: "main" },
      ],
    };

    localStorage.setItem("hal_last_flow_proj-1", "deleted-flow-id");

    expect(resolveDefaultFlowId(project)).toBe("flow-1");
  });

  it("should fallback to project activeFlowId if present and no localStorage entry", () => {
    const project = {
      id: "proj-2",
      activeFlowId: "flow-3",
      flows: [
        { id: "flow-1", name: "Main Flow", type: "main" },
        { id: "flow-3", name: "Checkout Flow", type: "main" },
      ],
    };

    expect(resolveDefaultFlowId(project)).toBe("flow-3");
  });

  it("should fallback to Main Flow if no last edited flow or activeFlowId exists", () => {
    const project = {
      id: "proj-3",
      flows: [
        { id: "flow-a", name: "Random Flow", type: "sub" },
        { id: "flow-b", name: "Main Flow", type: "main" },
      ],
    };

    expect(resolveDefaultFlowId(project)).toBe("flow-b");
  });

  it("should fallback to the flow with type='main' if named differently", () => {
    const project = {
      id: "proj-4",
      flows: [
        { id: "flow-comp", name: "Login Component", type: "component" },
        { id: "flow-primary", name: "Flujo Principal", type: "main" },
      ],
    };

    expect(resolveDefaultFlowId(project)).toBe("flow-primary");
  });

  it("should fallback to the first flow if neither Main Flow nor type='main' exists", () => {
    const project = {
      id: "proj-5",
      flows: [
        { id: "flow-first", name: "Custom Flow 1", type: "custom" },
        { id: "flow-second", name: "Custom Flow 2", type: "custom" },
      ],
    };

    expect(resolveDefaultFlowId(project)).toBe("flow-first");
  });
});
