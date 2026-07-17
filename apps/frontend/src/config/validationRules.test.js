import { describe, it, expect } from "vitest";
import { validateNodeConfig } from "./validationRules";

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
});
