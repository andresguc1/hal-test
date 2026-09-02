import { describe, it, expect } from "vitest";
import { select_option, click, browser_dialog } from "./payloadBuilders.js";

describe("click payload builder", () => {
  it("defaults to a single left click", () => {
    const payload = click({ selector: "#btn" });
    expect(payload).toMatchObject({
      selector: "#btn",
      button: "left",
      timeout: 30000,
      takeScreenshot: true,
    });
    expect(payload.clickCount).toBeUndefined();
  });

  it("maps clickType right/middle to the mouse button", () => {
    expect(click({ selector: "#s", clickType: "right" }).button).toBe("right");
    expect(click({ selector: "#s", clickType: "middle" }).button).toBe("middle");
  });

  it("maps clickType double to a left double click", () => {
    const payload = click({ selector: "#s", clickType: "double" });
    expect(payload).toMatchObject({ button: "left", clickCount: 2 });
  });

  it("falls back to the legacy button key", () => {
    expect(click({ selector: "#s", button: "right" }).button).toBe("right");
  });

  it("normalizes an invalid clickType to left single", () => {
    const payload = click({ selector: "#s", clickType: "nonsense" });
    expect(payload).toMatchObject({ button: "left" });
    expect(payload.clickCount).toBeUndefined();
  });

  it("throws when selector is missing", () => {
    expect(() => click({})).toThrow(/selector/);
  });
});

describe("browser_dialog payload builder", () => {
  it("emits accept by default", () => {
    const payload = browser_dialog({});
    expect(payload.action).toBe("accept");
    expect(payload.matchType).toBe("contains");
    expect(payload.caseSensitive).toBe(false);
  });

  it("maps dismiss action and includes expectText", () => {
    const payload = browser_dialog({ action: "dismiss", expectText: "internet" });
    expect(payload.action).toBe("dismiss");
    expect(payload.expectText).toBe("internet");
  });

  it("omits expectText when empty", () => {
    const payload = browser_dialog({ action: "accept" });
    expect("expectText" in payload).toBe(false);
  });

  it("falls back to accept for invalid action", () => {
    const payload = browser_dialog({ action: "banana" });
    expect(payload.action).toBe("accept");
  });
});

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