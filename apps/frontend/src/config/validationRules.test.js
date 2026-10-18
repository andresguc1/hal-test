import { describe, it, expect } from "vitest";
import {
  validateNodeConfig,
  cleanNodeConfiguration,
  getSmartLabel,
  NODE_INPUTS,
} from "./validationRules";

describe("validateNodeConfig", () => {
  it("should validate standard required fields", () => {
    // open_url requires 'url'
    expect(validateNodeConfig("open_url", { url: "" }).isValid).toBe(false);
    expect(
      validateNodeConfig("open_url", { url: "https://example.com" }).isValid,
    ).toBe(true);
  });

  it("should skip validation for required fields that are not visible", () => {
    // loop requires 'iterations' when loopType is 'for', but NOT when loopType is 'while'
    const forLoopInvalid = { loopType: "for", iterations: "" };
    expect(validateNodeConfig("loop", forLoopInvalid).isValid).toBe(false);

    const forLoopValid = { loopType: "for", iterations: "5" };
    expect(validateNodeConfig("loop", forLoopValid).isValid).toBe(true);

    const whileLoopValid = { loopType: "while", condition: "true" };
    expect(validateNodeConfig("loop", whileLoopValid).isValid).toBe(true);
  });

  it("should enforce required fields when they become visible", () => {
    // loop requires 'condition' when loopType is 'while'
    const whileLoopInvalid = { loopType: "while", condition: "" };
    expect(validateNodeConfig("loop", whileLoopInvalid).isValid).toBe(false);
  });

  it("should validate required fields for assert_page_text", () => {
    expect(validateNodeConfig("assert_page_text", {}).isValid).toBe(false);
    expect(
      validateNodeConfig("assert_page_text", { textToFind: "" }).isValid,
    ).toBe(false);
    expect(
      validateNodeConfig("assert_page_text", { textToFind: "Welcome" }).isValid,
    ).toBe(true);
  });

  it("should validate sticky_note and discussion nodes without selector requirement", () => {
    expect(validateNodeConfig("sticky_note", {}).isValid).toBe(true);
    expect(validateNodeConfig("sticky_note", { text: "Hello" }).isValid).toBe(
      true,
    );
    expect(validateNodeConfig("discussion", {}).isValid).toBe(true);
  });

  it("should require the set_checkbox selector outside multiple mode", () => {
    expect(
      validateNodeConfig("set_checkbox", { multiple: false, selector: "" }),
    ).toMatchObject({ isValid: false });
    expect(
      validateNodeConfig("set_checkbox", {
        multiple: false,
        selector: "#accept",
      }).isValid,
    ).toBe(true);
  });

  it("should not require a selector in set_checkbox multiple mode", () => {
    expect(
      validateNodeConfig("set_checkbox", {
        multiple: true,
        fields: [{ strategy: "css", target: "#a", action: "check" }],
      }).isValid,
    ).toBe(true);
  });
});

describe("assert node validation", () => {
  it("accepts a fully configured assert node with a nested target and checks", () => {
    const config = {
      target: {
        selector: "#showOverview",
        scope: "element",
        candidates: { id: "#showOverview" },
        selectorType: "id",
      },
      assertions: [
        { type: "text", operator: "contains", expected: "Overview" },
      ],
      softFail: false,
    };
    // Regression: the generic required-field loop used to re-check the flat
    // key "target.selector" (never present in a nested config) and fail every
    // configured assert node with "Element to check".
    expect(validateNodeConfig("assert", config).isValid).toBe(true);
  });

  it("requires an element selector for element scope", () => {
    const result = validateNodeConfig("assert", {
      assertions: [{ type: "existence", operator: "exists" }],
    });
    expect(result.isValid).toBe(false);
    expect(result.missingField).toBe("Element to check");
  });

  it("does not require an element selector for page scope", () => {
    const result = validateNodeConfig("assert", {
      target: { scope: "page" },
      assertions: [
        { type: "page", operator: "title_contains", expected: "Home" },
      ],
    });
    expect(result.isValid).toBe(true);
  });

  it("requires at least one check", () => {
    const result = validateNodeConfig("assert", {
      target: { selector: "#a", scope: "element" },
      assertions: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.missingField).toBe("At least one check");
  });

  it("requires an expected value for value-bearing operators", () => {
    const result = validateNodeConfig("assert", {
      target: { selector: "#a", scope: "element" },
      assertions: [{ type: "text", operator: "contains", expected: "" }],
    });
    expect(result.isValid).toBe(false);
    expect(result.missingField).toBe("Expected Value");
  });

  it("still enforces the timeout range for assert", () => {
    const result = validateNodeConfig("assert", {
      target: { selector: "#a", scope: "element" },
      assertions: [{ type: "existence", operator: "exists" }],
      timeout: -5,
    });
    expect(result.isValid).toBe(false);
    expect(result.fieldKey).toBe("timeout");
  });
});

describe("assert node round-trip", () => {
  it("stays valid after cleanNodeConfiguration preserves the nested shape", () => {
    const config = {
      target: {
        selector: "#showOverview",
        scope: "element",
        candidates: { id: "#showOverview" },
      },
      assertions: [{ type: "existence", operator: "exists" }],
    };
    const cleaned = cleanNodeConfiguration(config, "assert");
    expect(cleaned.assertions).toEqual([
      { type: "existence", operator: "exists" },
    ]);
    expect(validateNodeConfig("assert", cleaned).isValid).toBe(true);
  });
});

describe("set_checkbox NODE_INPUTS wiring", () => {
  const inputs = NODE_INPUTS.set_checkbox;

  it("declares the advanced fields and optgroups for the action select", () => {
    const advancedKeys = inputs.filter((f) => f.advanced).map((f) => f.key);
    expect(advancedKeys).toEqual(
      expect.arrayContaining(["multiple", "fields", "verifyState", "timeout"]),
    );

    const action = inputs.find((f) => f.key === "action");
    expect(action.optgroups).toEqual([
      { label: "Basic", values: ["check", "uncheck"] },
      { label: "Advanced", values: ["toggle"] },
    ]);
  });

  it("keeps takeScreenshot and continueOnError outside the advanced block", () => {
    const visibleAdvanced = inputs.filter((f) => f.advanced).map((f) => f.key);
    expect(visibleAdvanced).not.toContain("takeScreenshot");
    expect(visibleAdvanced).not.toContain("continueOnError");
  });
});

describe("cleanNodeConfiguration", () => {
  it("preserves the nested target object for the assert node (regression)", () => {
    const config = {
      target: { selector: "#submit", scope: "element" },
      assertions: [{ type: "text", operator: "contains", expected: "Hi" }],
      timeout: "",
      softFail: true,
    };
    const cleaned = cleanNodeConfiguration(config, "assert");
    expect(cleaned.target).toEqual({ selector: "#submit", scope: "element" });
    expect(cleaned.assertions).toHaveLength(1);
    expect(cleaned.softFail).toBe(true);
  });

  it("strips keys that do not belong to the node type", () => {
    const config = {
      target: { selector: "#a", scope: "element" },
      assertions: [],
      totallyUnknownKey: "should be removed",
    };
    const cleaned = cleanNodeConfiguration(config, "assert");
    expect(cleaned).not.toHaveProperty("totallyUnknownKey");
    expect(cleaned).toHaveProperty("target");
  });

  it("mirrors legacy continueOnFailure into continueOnError", () => {
    const cleaned = cleanNodeConfiguration(
      { selector: "#a", continueOnFailure: true },
      "click",
    );
    expect(cleaned.continueOnError).toBe(true);
  });

  it("handles null/undefined config gracefully", () => {
    expect(cleanNodeConfiguration(null, "assert")).toEqual({});
    expect(cleanNodeConfiguration(undefined, "assert")).toEqual({});
  });
});

describe("Data extraction node configs", () => {
  it("extract requires an item selector", () => {
    expect(validateNodeConfig("extract", { selector: "" }).isValid).toBe(false);
    expect(
      validateNodeConfig("extract", { selector: "li.product" }).isValid,
    ).toBe(true);
  });

  it("cleanNodeConfiguration preserves extraction fields", () => {
    const cleaned = cleanNodeConfiguration(
      {
        selector: "li.product",
        repeated: true,
        fields: [{ name: "title", source: "text", selector: ".title" }],
        outputVariable: "products",
        accumulateInto: "all",
        dedupeKey: "id",
        ifEmpty: "fail",
        timeoutMs: 5000,
        totallyUnknownKey: "drop me",
      },
      "extract",
    );
    expect(cleaned).not.toHaveProperty("totallyUnknownKey");
    expect(cleaned.fields).toEqual([
      { name: "title", source: "text", selector: ".title" },
    ]);
    expect(cleaned.outputVariable).toBe("products");
    expect(cleaned.accumulateInto).toBe("all");
    expect(cleaned.dedupeKey).toBe("id");
    expect(cleaned.ifEmpty).toBe("fail");
  });

  it("save_dataset requires the source variable", () => {
    expect(validateNodeConfig("save_dataset", { source: "" }).isValid).toBe(
      false,
    );
    expect(
      validateNodeConfig("save_dataset", { source: "products" }).isValid,
    ).toBe(true);
  });

  it("smart labels summarize the extraction", () => {
    expect(
      getSmartLabel("extract", {
        selector: "li.product",
        fields: [{ name: "a" }],
      }),
    ).toContain("li.product");
    expect(
      getSmartLabel("save_dataset", { source: "products", format: "csv" }),
    ).toContain("CSV");
  });
});

describe("timeout defaults", () => {
  it("does not bake a hardcoded timeout default into node schemas", () => {
    // A hardcoded numeric default triggers the policy enforcer's
    // "hardcoded_timeout" warning on freshly created nodes.
    const nodesWithHardcodedTimeout = Object.entries(NODE_INPUTS)
      .filter(([, fields]) => Array.isArray(fields))
      .flatMap(([nodeType, fields]) =>
        fields
          .filter(
            (f) => f && f.key === "timeout" && f.defaultValue !== undefined,
          )
          .map((f) => `${nodeType}.timeout=${f.defaultValue}`),
      );
    expect(nodesWithHardcodedTimeout).toEqual([]);
  });
});
