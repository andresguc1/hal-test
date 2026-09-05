import { describe, it, expect } from "vitest";
import { sanitizeEdges } from "./useFlowState";

describe("sanitizeEdges — grouping composite edges", () => {
  const componentNode = { id: "comp-1", type: "component" };
  const a = { id: "node-a", type: "click" };
  const b = { id: "node-b", type: "click" };
  const c = { id: "node-c", type: "click" };

  it("keeps parallel same-source incoming edges rewired onto a composite node", () => {
    // Two different selected nodes (a, b) each receive an edge from the same
    // source "src". After grouping both are rewired to the SAME component node
    // with targetHandle collapsed to null — they must NOT be deduped away.
    const edges = [
      {
        id: "e_src-comp_a",
        source: "src",
        target: "comp-1",
        targetHandle: null,
        data: { originalTarget: "node-a", originalTargetHandle: null },
      },
      {
        id: "e_src-comp_b",
        source: "src",
        target: "comp-1",
        targetHandle: null,
        data: { originalTarget: "node-b", originalTargetHandle: null },
      },
    ];

    const result = sanitizeEdges(edges, [componentNode, a, b, c, { id: "src" }]);
    expect(result.map((e) => e.id)).toEqual(["e_src-comp_a", "e_src-comp_b"]);
  });

  it("keeps parallel same-target outgoing edges rewired onto a composite node", () => {
    // Two different selected nodes (a, b) each feed the same target "dst".
    // After grouping both are rewired to originate from the component node.
    const edges = [
      {
        id: "e_comp-a-dst",
        source: "comp-1",
        target: "dst",
        sourceHandle: null,
        data: { originalSource: "node-a", originalSourceHandle: null },
      },
      {
        id: "e_comp-b-dst",
        source: "comp-1",
        target: "dst",
        sourceHandle: null,
        data: { originalSource: "node-b", originalSourceHandle: null },
      },
    ];

    const result = sanitizeEdges(edges, [componentNode, a, b, c, { id: "dst" }]);
    expect(result.map((e) => e.id)).toEqual(["e_comp-a-dst", "e_comp-b-dst"]);
  });

  it("still dedupes a TRUE duplicate connection", () => {
    const edges = [
      { id: "e1", source: "src", target: "dst", sourceHandle: "out", targetHandle: "in" },
      { id: "e2", source: "src", target: "dst", sourceHandle: "out", targetHandle: "in" },
    ];

    const result = sanitizeEdges(edges, [{ id: "src" }, { id: "dst" }]);
    expect(result.map((e) => e.id)).toEqual(["e1"]);
  });
});