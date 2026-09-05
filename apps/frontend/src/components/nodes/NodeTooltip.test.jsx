import { describe, it, expect } from "vitest";
import { buildNodeMetaRows } from "@/utils/nodeMetaRows";

describe("buildNodeMetaRows", () => {
  it("returns empty rows when no configuration", () => {
    expect(buildNodeMetaRows("click", {}, {})).toEqual([]);
  });

  it("shows selector from configuration", () => {
    const rows = buildNodeMetaRows("click", { selector: "#submit-btn" }, {});
    expect(rows.some((r) => r.text === "#submit-btn")).toBe(true);
  });

  it("shows url for open_url nodes", () => {
    const rows = buildNodeMetaRows(
      "open_url",
      { url: "https://example.com/dashboard" },
      {},
    );
    expect(rows.some((r) => r.text === "https://example.com/dashboard")).toBe(
      true,
    );
  });

  it("shows text value for type_text nodes", () => {
    const rows = buildNodeMetaRows(
      "type_text",
      { selector: "#username", text: "hello" },
      {},
    );
    expect(rows.some((r) => r.text === "hello")).toBe(true);
  });

  it("shows branch labels for conditional nodes", () => {
    const rows = buildNodeMetaRows(
      "conditional",
      { branches: [{ id: "true", label: "Yes" }, { id: "false" }] },
      {},
    );
    expect(rows.some((r) => r.text === "branches: Yes · false")).toBe(true);
  });

  it("shows node count for composite nodes", () => {
    const rows = buildNodeMetaRows("component", {}, { nodeCount: 5 });
    expect(rows.some((r) => r.text === "5 node(s) inside")).toBe(true);
  });

  it("does not add node count for non-composite nodes", () => {
    const rows = buildNodeMetaRows("click", {}, { nodeCount: 5 });
    expect(rows.some((r) => r.text.includes("node(s) inside"))).toBe(false);
  });

  it("shows flowId for component nodes", () => {
    const rows = buildNodeMetaRows("component", {}, { flowId: "flow-abc" });
    expect(rows.some((r) => r.text === "flow-abc")).toBe(true);
  });

  it("shows mode for loop nodes", () => {
    const rows = buildNodeMetaRows("loop", { mode: "while" }, {});
    expect(rows.some((r) => r.text === "mode: while")).toBe(true);
  });
});