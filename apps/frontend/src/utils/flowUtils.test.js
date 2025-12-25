import { describe, it, expect } from "vitest";
import { getConnectedComponents } from "./flowUtils";

describe("getConnectedComponents", () => {
  it("should return empty array for empty input", () => {
    expect(getConnectedComponents([], [])).toEqual([]);
  });

  it("should identify a single isolated node as one component", () => {
    const nodes = [{ id: "1" }];
    const edges = [];
    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0]).toHaveLength(1);
    expect(components[0][0].id).toBe("1");
  });

  it("should identify two disconnected nodes as two components", () => {
    const nodes = [{ id: "1" }, { id: "2" }];
    const edges = [];
    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(2);
  });

  it("should identify two connected nodes as one component", () => {
    const nodes = [{ id: "1" }, { id: "2" }];
    const edges = [{ source: "1", target: "2" }];
    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0]).toHaveLength(2);
  });

  it("should identify complex disconnected flows", () => {
    // Flow A: 1 -> 2
    // Flow B: 3 -> 4 -> 5
    const nodes = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
      { id: "5" },
    ];
    const edges = [
      { source: "1", target: "2" },
      { source: "3", target: "4" },
      { source: "4", target: "5" },
    ];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(2);

    // Sort components by size to make assertions deterministic
    components.sort((a, b) => a.length - b.length);

    expect(components[0]).toHaveLength(2); // Flow A
    expect(components[1]).toHaveLength(3); // Flow B
  });
});
