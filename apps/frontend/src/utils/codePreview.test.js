import { describe, it, expect } from "vitest";
import {
  buildBreadcrumb,
  computeFoldedRanges,
  buildFoldedLineInfo,
} from "./codePreview";

function entry(overrides) {
  return {
    nodeId: "n",
    flowId: null,
    instanceKey: null,
    label: "",
    type: "component",
    depth: 0,
    startLine: 1,
    endLine: 1,
    kind: "simple",
    children: [],
    status: "resolved",
    reason: null,
    ...overrides,
  };
}

const mapping = [
  entry({
    nodeId: "comp-1",
    label: "Checkboxes",
    type: "component",
    kind: "composite",
    startLine: 10,
    endLine: 24,
    children: [{}, {}],
  }),
  entry({
    nodeId: "inner-1",
    instanceKey: "comp-1",
    label: "Checkbox Input 1",
    kind: "simple",
    startLine: 12,
    endLine: 14,
  }),
  entry({
    nodeId: "inner-2",
    instanceKey: "comp-1",
    label: "Checkbox Input 2",
    kind: "simple",
    startLine: 15,
    endLine: 17,
  }),
  entry({
    nodeId: "comp-2",
    label: "Try Again",
    type: "component",
    kind: "composite",
    startLine: 26,
    endLine: 34,
    children: [{}, {}, {}, {}],
  }),
];

describe("buildBreadcrumb", () => {
  it("devuelve la ruta raíz > hijo para un entry interno", () => {
    const chain = buildBreadcrumb(mapping, "inner-1");
    expect(chain).not.toBeNull();
    expect(chain.map((e) => e.nodeId)).toEqual(["comp-1", "inner-1"]);
    expect(chain.map((e) => e.label)).toEqual([
      "Checkboxes",
      "Checkbox Input 1",
    ]);
  });

  it("devuelve [nodo] solo para un top-level", () => {
    const chain = buildBreadcrumb(mapping, "comp-2");
    expect(chain.map((e) => e.nodeId)).toEqual(["comp-2"]);
  });

  it("prefiere la ocurrencia top-level (instanceKey === null) si ambas existen", () => {
    const mixed = [
      ...mapping,
      entry({ nodeId: "inner-1", label: "reuse", startLine: 40, endLine: 42 }),
    ];
    const chain = buildBreadcrumb(mixed, "inner-1");
    expect(chain.map((e) => e.nodeId)).toEqual(["inner-1"]);
    expect(chain[0].startLine).toBe(40);
  });

  it("devuelve null con target desconocido o mapping vacío", () => {
    expect(buildBreadcrumb([], "comp-1")).toBeNull();
    expect(buildBreadcrumb(mapping, "ghost")).toBeNull();
  });

  it("ancla la cadena cuando instanceKey no resuelve (padre ausente)", () => {
    const pending = entry({
      nodeId: "orphan",
      instanceKey: "not-in-mapping",
      startLine: 50,
      endLine: 52,
    });
    const chain = buildBreadcrumb([...mapping, pending], "orphan");
    expect(chain.map((e) => e.nodeId)).toEqual(["orphan"]);
  });
});

describe("computeFoldedRanges", () => {
  const keyFor = (fileKey) => (e) => `${fileKey}:${e.nodeId}`;

  it("no colapsa rangos no marcados como folded", () => {
    const folded = new Set(["main:ghost"]);
    expect(computeFoldedRanges(mapping, folded, keyFor("main"))).toEqual([]);
  });

  it("colapsa un composite y reporta header + hidden (0-based)", () => {
    const folded = new Set(["main:comp-1"]);
    const ranges = computeFoldedRanges(mapping, folded, keyFor("main"));
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBe(9);
    expect(ranges[0].end).toBe(23);
    expect(ranges[0].hidden).toBe(13);
  });

  it("descarta rangos anidados dentro de otro colapsado (outmost only)", () => {
    const nested = entry({
      nodeId: "inner-parent",
      kind: "container",
      startLine: 13,
      endLine: 16,
    });
    const withNested = [...mapping, nested];
    const folded = new Set(["main:comp-1", "main:inner-parent"]);
    const ranges = computeFoldedRanges(withNested, folded, keyFor("main"));
    expect(ranges.map((r) => r.nodeId)).toEqual(["comp-1"]);
  });

  it("mantiene dos rangos de reuso (misma nodeId, distinta ocurrencia) como claves distintas", () => {
    const folder = [
      entry({ nodeId: "comp-x", kind: "composite", startLine: 5, endLine: 9 }),
      entry({
        nodeId: "comp-x",
        kind: "composite",
        startLine: 20,
        endLine: 24,
      }),
    ];
    const getKey = (e) => `${e.nodeId}@${e.startLine}`;
    const folded = new Set(["comp-x@5", "comp-x@20"]);
    const ranges = computeFoldedRanges(folder, folded, getKey);
    expect(ranges).toHaveLength(2);
  });

  it("gemelos con misma clave colapsan juntos (una sola entrada plegada)", () => {
    const folder = [
      entry({ nodeId: "comp-x", kind: "composite", startLine: 5, endLine: 9 }),
      entry({
        nodeId: "comp-x",
        kind: "composite",
        startLine: 20,
        endLine: 24,
      }),
    ];
    const getKey = (e) => `main:${e.nodeId}`;
    const folded = new Set(["main:comp-x"]);
    const ranges = computeFoldedRanges(folder, folded, getKey);
    expect(ranges).toHaveLength(2);
  });
});

describe("buildFoldedLineInfo", () => {
  it("oculta líneas interiores, conserva header y marca el indicador", () => {
    const folded = new Set(["main:comp-2"]);
    const { hidden, headers } = buildFoldedLineInfo(
      mapping,
      folded,
      (e) => `main:${e.nodeId}`,
    );
    expect(hidden.has(25)).toBe(false); // header (0-based start = 25)
    expect(hidden.has(33)).toBe(true); // closing line
    expect([...hidden].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 8 }, (_, i) => i + 26),
    );
    expect(headers.has(25)).toBe(true);
    expect(headers.get(25).childrenCount).toBe(4);
  });
});
