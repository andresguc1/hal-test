import { describe, it, expect } from "vitest";
import { select_option } from "./payloadBuilders.js";

describe("select_option payload builder", () => {
  it("emits auto-detected mode when containerSelector is present", () => {
    const payload = select_option({
      containerSelector: "#opts",
      selectedOptions: [
        { label: "Admin", value: "admin" },
        { label: "Editor" },
      ],
      expandMenu: true,
      timeout: "5000",
      browserId: "b-1",
    });
    expect(payload).toEqual({
      containerSelector: "#opts",
      selectedOptions: [
        { label: "Admin", value: "admin", action: "CHECK" },
        { label: "Editor", value: "", action: "CHECK" },
      ],
      expandMenu: true,
      timeout: 5000,
      browserId: "b-1",
    });
  });

  it("defaults action to CHECK for legacy items without action", () => {
    const payload = select_option({
      containerSelector: "#opts",
      selectedOptions: [{ label: "A", value: "a" }],
    });
    expect(payload.selectedOptions[0].action).toBe("CHECK");
  });

  it("preserves explicit NO_CHANGE / UNCHECK actions", () => {
    const payload = select_option({
      containerSelector: "#opts",
      selectedOptions: [
        { label: "A", value: "a", action: "NO_CHANGE" },
        { label: "B", value: "b", action: "UNCHECK" },
        { label: "C", value: "c", action: "nonsense" },
      ],
    });
    expect(payload.selectedOptions[0]).toEqual({
      label: "A",
      value: "a",
      action: "NO_CHANGE",
    });
    expect(payload.selectedOptions[1].action).toBe("UNCHECK");
    // invalid action normalized to CHECK
    expect(payload.selectedOptions[2].action).toBe("CHECK");
  });

  it("parses a JSON-string selectedOptions", () => {
    const payload = select_option({
      containerSelector: "#opts",
      selectedOptions: '[{"label":"A","value":"a"},{"label":"B","value":"b"}]',
    });
    expect(payload.selectedOptions).toHaveLength(2);
    expect(payload.selectedOptions[1]).toEqual({
      label: "B",
      value: "b",
      action: "CHECK",
    });
  });

  it("emits legacy mode when only a selector is given", () => {
    const payload = select_option({
      selector: "#dd",
      selectionCriteria: "label",
      selectionValue: "Spain",
    });
    expect(payload).toEqual({
      selector: "#dd",
      selectionCriteria: "label",
      selectionValue: "Spain",
      timeout: 30000,
      browserId: "",
    });
  });

  it("falls back to importer value/label fields", () => {
    const valuePayload = select_option({ selector: "#dd", value: "ES" });
    expect(valuePayload.selectionCriteria).toBe("value");
    expect(valuePayload.selectionValue).toBe("ES");

    const labelPayload = select_option({ selector: "#dd", label: "Spain" });
    expect(labelPayload.selectionCriteria).toBe("label");
    expect(labelPayload.selectionValue).toBe("Spain");
  });
});