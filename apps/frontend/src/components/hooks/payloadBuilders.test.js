import { describe, it, expect } from "vitest";
import {
  select_option,
  set_checkbox,
  set_radio,
  pick_list_option,
  click,
  browser_dialog,
  drag_drop,
} from "./payloadBuilders.js";

describe("click payload builder", () => {
  it("defaults to a single left click", () => {
    const payload = click({ selector: "#btn" });
    expect(payload).toMatchObject({
      selector: "#btn",
      button: "left",
      timeout: 0,
      takeScreenshot: true,
    });
    expect(payload.clickCount).toBeUndefined();
  });

  it("maps clickType right/middle to the mouse button", () => {
    expect(click({ selector: "#s", clickType: "right" }).button).toBe("right");
    expect(click({ selector: "#s", clickType: "middle" }).button).toBe(
      "middle",
    );
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

  it("passes context menu options for right-click nodes", () => {
    const payload = click({
      selector: "#item",
      clickType: "right",
      contextMenuItem: "Delete",
      clickOutside: true,
    });
    expect(payload).toMatchObject({
      button: "right",
      contextMenuItem: "Delete",
      clickOutside: true,
    });
  });

  it("omits context menu options when not configured", () => {
    const payload = click({ selector: "#btn" });
    expect(payload).toMatchObject({ contextMenuItem: "", clickOutside: false });
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
    const payload = browser_dialog({
      action: "dismiss",
      expectText: "internet",
    });
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
      timeout: 0,
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

describe("set_checkbox payload builder", () => {
  it("defaults to check action", () => {
    const payload = set_checkbox({ selector: "#accept", action: "uncheck" });
    expect(payload).toEqual({
      selector: "#accept",
      action: "uncheck",
      timeout: 0,
      verifyState: true,
      browserId: "",
    });
  });

  it("forwards verifyState false", () => {
    const payload = set_checkbox({ selector: "#accept", verifyState: false });
    expect(payload.verifyState).toBe(false);

    const multi = set_checkbox({
      multiple: true,
      fields: [{ target: "#a" }],
      verifyState: false,
    });
    expect(multi.verifyState).toBe(false);
  });

  it("normalizes invalid actions to check", () => {
    const payload = set_checkbox({ selector: "#accept", action: "banana" });
    expect(payload.action).toBe("check");
  });

  it("requires a selector", () => {
    expect(() => set_checkbox({ selector: "" })).toThrow(/selector/);
  });

  it("supports toggle action", () => {
    const payload = set_checkbox({ selector: "#accept", action: "toggle" });
    expect(payload.action).toBe("toggle");
  });

  it("emits fields for multiple mode", () => {
    const payload = set_checkbox({
      multiple: true,
      fields: [
        { strategy: "label", target: "I accept the terms", action: "check" },
        { strategy: "css", target: "#newsletter", action: "uncheck" },
        { strategy: "label", target: "Subscribe" },
      ],
      timeout: 5000,
    });
    expect(payload).toEqual({
      fields: [
        { strategy: "label", target: "I accept the terms", action: "check" },
        { strategy: "css", target: "#newsletter", action: "uncheck" },
        { strategy: "label", target: "Subscribe", action: "check" },
      ],
      selector: "",
      action: "check",
      timeout: 5000,
      verifyState: true,
      browserId: "",
    });
  });

  it("drops empty targets in multiple mode", () => {
    const payload = set_checkbox({
      multiple: true,
      fields: [
        { strategy: "css", target: "", action: "check" },
        { strategy: "label", target: "News" },
      ],
    });
    expect(payload.fields).toHaveLength(1);
    expect(payload.fields[0].action).toBe("check");
  });

  it("requires at least one valid field in multiple mode", () => {
    expect(() => set_checkbox({ multiple: true, fields: [] })).toThrow(
      /checkbox/,
    );
  });
});

describe("set_radio payload builder", () => {
  it("emits selector and defaults", () => {
    const payload = set_radio({ selector: 'input[name="plan"]' });
    expect(payload).toEqual({
      selector: 'input[name="plan"]',
      timeout: 0,
      browserId: "",
    });
  });

  it("requires a selector", () => {
    expect(() => set_radio({})).toThrow(/selector/);
  });
});

describe("pick_list_option payload builder", () => {
  it("sends optionText and expandMenu by default", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "Español",
    });
    expect(payload).toMatchObject({
      selector: "#lang",
      optionText: "Español",
      expandMenu: true,
    });
    expect(payload.optionIndex).toBeUndefined();
  });

  it("prefers optionText over optionIndex", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "Español",
      optionIndex: 2,
    });
    expect(payload.optionText).toBe("Español");
    expect(payload.optionIndex).toBeUndefined();
  });

  it("uses optionIndex when optionText is empty", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "",
      optionIndex: 3,
    });
    expect(payload.optionIndex).toBe(3);
    expect(payload.optionText).toBeUndefined();
  });

  it("honours expandMenu=false", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "EN",
      expandMenu: false,
    });
    expect(payload.expandMenu).toBe(false);
  });

  it("requires optionText or optionIndex", () => {
    expect(() => pick_list_option({ selector: "#lang" })).toThrow(
      /optionText|optionIndex/,
    );
  });

  it("passes menuSelector through", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "Español",
      menuSelector: "[role=listbox]",
    });
    expect(payload.menuSelector).toBe("[role=listbox]");
  });

  it("index mode uses optionIndex even when optionText is present", () => {
    const payload = pick_list_option({
      selector: "#lang",
      mode: "index",
      optionText: "Español",
      optionIndex: 2,
    });
    expect(payload.optionIndex).toBe(2);
    expect(payload.optionText).toBeUndefined();
  });

  it("index mode requires a valid optionIndex", () => {
    expect(() =>
      pick_list_option({ selector: "#lang", mode: "index", optionIndex: "" }),
    ).toThrow(/optionIndex/);
  });

  it("uses the platform default (0) when the timeout field is left blank", () => {
    const payload = pick_list_option({
      selector: "#lang",
      optionText: "Español",
      timeout: "",
    });
    expect(payload.timeout).toBe(0);
  });
});

describe("drag_drop payload builder", () => {
  it("emits source/target and keeps legacy flows flag-free", () => {
    const payload = drag_drop({ sourceSelector: "#a", targetSelector: "#b" });
    expect(payload.sourceSelector).toBe("#a");
    expect(payload.targetSelector).toBe("#b");
    expect(payload).not.toHaveProperty("visualAnimation");
  });

  it("passes visualAnimation when explicitly set", () => {
    const animated = drag_drop({
      sourceSelector: "#a",
      targetSelector: "#b",
      visualAnimation: true,
    });
    expect(animated.visualAnimation).toBe(true);

    const native = drag_drop({
      sourceSelector: "#a",
      targetSelector: "#b",
      visualAnimation: false,
    });
    expect(native.visualAnimation).toBe(false);
  });
});
