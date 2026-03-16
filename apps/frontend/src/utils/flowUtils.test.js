import { describe, it, expect } from "vitest";
import { getConnectedComponents, resolveVariables } from "./flowUtils";

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

describe("resolveVariables", () => {
  const context = {
    node_1: { result: "Hello World" },
    extract_text: { result: "Extracted Content" },
    custom_node: { custom_prop: "Custom Value" },
  };

  it("should resolve variables by node ID", () => {
    const config = { prompt: "Say {{node_1}}" };
    expect(resolveVariables(config, context)).toEqual({
      prompt: "Say Hello World",
    });
  });

  it("should resolve variables by slugified label", () => {
    const config = { prompt: "Analyze {{Extract Text}}" };
    expect(resolveVariables(config, context)).toEqual({
      prompt: "Analyze Extracted Content",
    });
  });

  it("should resolve specific properties", () => {
    const config = { prompt: "Value: {{custom_node.custom_prop}}" };
    expect(resolveVariables(config, context)).toEqual({
      prompt: "Value: Custom Value",
    });
  });

  it("should resolve using fallback properties like 'value' or 'output'", () => {
    const flexContext = {
      api_node: { value: "Resolved Value" },
      data_node: { output: "Data Output" },
    };
    expect(resolveVariables({ a: "{{api_node}}" }, flexContext)).toEqual({
      a: "Resolved Value",
    });
    expect(resolveVariables({ a: "{{data_node}}" }, flexContext)).toEqual({
      a: "Data Output",
    });
  });

  it("should handle objects by stringifying them", () => {
    const complexContext = {
      data: { result: { a: 1, b: 2 } },
    };
    const config = { payload: "{{data}}" };
    expect(resolveVariables(config, complexContext)).toEqual({
      payload: '{"a":1,"b":2}',
    });
  });

  it("should return original if variable not found", () => {
    const config = { prompt: "Hi {{missing}}" };
    expect(resolveVariables(config, context)).toEqual({
      prompt: "Hi {{missing}}",
    });
  });

  it("should resolve recursively in nested objects and arrays", () => {
    const config = {
      a: { b: "{{node_1}}" },
      c: ["{{Extract Text}}", 123],
    };
    expect(resolveVariables(config, context)).toEqual({
      a: { b: "Hello World" },
      c: ["Extracted Content", 123],
    });
  });
});
