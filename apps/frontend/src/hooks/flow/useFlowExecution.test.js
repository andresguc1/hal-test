import { describe, it, expect } from "vitest";
import { matchesBranchPath } from "../../utils/flowUtils";

describe("matchesBranchPath - short-circuit path matching", () => {
  it("matches exact handles case-insensitively", () => {
    expect(matchesBranchPath("true", "true")).toBe(true);
    expect(matchesBranchPath("TRUE", "true")).toBe(true);
    expect(matchesBranchPath("caseA", "casea")).toBe(true);
    expect(matchesBranchPath("caseA", "caseB")).toBe(false);
  });

  it("unifies false/else/default/fallback synonyms", () => {
    expect(matchesBranchPath("false", "else")).toBe(true);
    expect(matchesBranchPath("else", "false")).toBe(true);
    expect(matchesBranchPath("default", "false")).toBe(true);
    expect(matchesBranchPath("false", "default")).toBe(true);
    expect(matchesBranchPath("fallback", "else")).toBe(true);
    expect(matchesBranchPath("else", "default")).toBe(true);
  });

  it("unifies true/success/yes synonyms", () => {
    expect(matchesBranchPath("true", "success")).toBe(true);
    expect(matchesBranchPath("success", "true")).toBe(true);
    expect(matchesBranchPath("yes", "true")).toBe(true);
  });

  it("does not cross-positive with negative buckets", () => {
    expect(matchesBranchPath("true", "false")).toBe(false);
    expect(matchesBranchPath("false", "true")).toBe(false);
    expect(matchesBranchPath("caseA", "else")).toBe(false);
  });

  it("returns false for empty handle or path", () => {
    expect(matchesBranchPath("", "true")).toBe(false);
    expect(matchesBranchPath("true", "")).toBe(false);
    expect(matchesBranchPath(undefined, "true")).toBe(false);
    expect(matchesBranchPath("true", undefined)).toBe(false);
    expect(matchesBranchPath(null, "true")).toBe(false);
  });

  it("matches a concrete case id to its exact path even alongside synonyms", () => {
    expect(matchesBranchPath("admin_view", "admin_view")).toBe(true);
    expect(matchesBranchPath("guest_view", "admin_view")).toBe(false);
  });
});
