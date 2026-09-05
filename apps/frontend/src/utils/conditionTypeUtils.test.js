import { describe, it, expect } from "vitest";
import {
  buildVariableTypeLookup,
  resolveVariableType,
  BOOLEAN_LIKE_PROPERTIES,
} from "./conditionTypeUtils";

const suggestions = [
  {
    nodeLabel: "Find Element",
    items: [
      { label: "found", path: "{{Find Element.found}}", type: "boolean" },
      { label: "visible", path: "{{Find Element.visible}}", type: "boolean" },
      { label: "count", path: "{{Find Element.count}}", type: "number" },
      { label: "state", path: "{{Find Element.state}}", type: "string" },
    ],
  },
  {
    nodeLabel: "Set Username",
    items: [
      { label: "result", path: "{{Set Username.result}}", type: "string" },
    ],
  },
];

describe("buildVariableTypeLookup", () => {
  it("maps template paths to their declared type", () => {
    const lookup = buildVariableTypeLookup(suggestions);
    expect(lookup["{{Find Element.found}}"]).toEqual({
      type: "boolean",
      label: "found",
    });
    expect(lookup["{{Find Element.count}}"].type).toBe("number");
  });

  it("skips items without a template path", () => {
    const lookup = buildVariableTypeLookup([
      { nodeLabel: "X", items: [{ label: "a", path: "no-template", type: "string" }] },
    ]);
    expect(Object.keys(lookup)).toHaveLength(0);
  });

  it("handles a flat suggestion (non-grouped) array", () => {
    const lookup = buildVariableTypeLookup([
      { label: "found", path: "{{Flat.found}}", type: "boolean" },
    ]);
    expect(lookup["{{Flat.found}}"].type).toBe("boolean");
  });
});

describe("resolveVariableType", () => {
  it("returns the declared type from the lookup", () => {
    const lookup = buildVariableTypeLookup(suggestions);
    expect(resolveVariableType("{{Find Element.found}}", lookup)).toBe(
      "boolean",
    );
    expect(resolveVariableType("{{Find Element.count}}", lookup)).toBe(
      "number",
    );
    expect(resolveVariableType("{{Set Username.result}}", lookup)).toBe(
      "string",
    );
  });

  it("falls back to boolean heuristics for known properties", () => {
    const lookup = buildVariableTypeLookup([]);
    expect(resolveVariableType("{{Find Element.found}}", lookup)).toBe(
      "boolean",
    );
    expect(resolveVariableType("{{Node.success}}", lookup)).toBe("boolean");
    expect(resolveVariableType("{{Node.matched}}", lookup)).toBe("boolean");
  });

  it("returns null for unresolved or malformed references", () => {
    const lookup = buildVariableTypeLookup([]);
    expect(resolveVariableType("", lookup)).toBeNull();
    expect(resolveVariableType("plain text", lookup)).toBeNull();
    expect(resolveVariableType("{{Node.unknownProp}}", lookup)).toBeNull();
  });

  it("lists well-known boolean-like properties", () => {
    expect(BOOLEAN_LIKE_PROPERTIES.has("found")).toBe(true);
    expect(BOOLEAN_LIKE_PROPERTIES.has("success")).toBe(true);
    expect(BOOLEAN_LIKE_PROPERTIES.has("count")).toBe(false);
  });
});
