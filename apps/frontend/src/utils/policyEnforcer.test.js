import { describe, it, expect } from "vitest";
import { runPolicyEnforcer } from "./policyEnforcer";

describe("Policy Enforcer - Static Analysis Engine", () => {
  // --- RULE 1: Hardcoded Wait / Timeout ---
  describe("Wait-Timeout Rule", () => {
    it("should flag a pause node with a hardcoded duration", () => {
      const nodes = [
        {
          id: "node-1",
          type: "pause",
          data: {
            configuration: { duration: 5000 }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      expect(warnings["node-1"]).toBeDefined();
      expect(warnings["node-1"][0].rule).toBe("hardcoded_wait");
      expect(warnings["node-1"][0].educationalGuide.title).toBe("Wait-Timeout Anti-Pattern");
    });

    it("should not flag a pause node with a variable duration", () => {
      const nodes = [
        {
          id: "node-1",
          type: "pause",
          data: {
            configuration: { duration: "{{variables.myTimeout}}" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      // Should not have hardcoded_wait warning (might have dead_end warnings depending on edges, but not hardcoded_wait)
      const nodeWarnings = warnings["node-1"] || [];
      const hasHardcodedWait = nodeWarnings.some(w => w.rule === "hardcoded_wait");
      expect(hasHardcodedWait).toBe(false);
    });

    it("should flag other nodes with a hardcoded timeout parameter", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "#submit", timeout: 30000 }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const hasHardcodedTimeout = nodeWarnings.some(w => w.rule === "hardcoded_timeout");
      expect(hasHardcodedTimeout).toBe(true);
    });

    it("should not flag nodes with a templated variable timeout", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "#submit", timeout: "{{variables.TIMEOUT}}" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const hasHardcodedTimeout = nodeWarnings.some(w => w.rule === "hardcoded_timeout");
      expect(hasHardcodedTimeout).toBe(false);
    });
  });

  // --- RULE 2: Brittle Selectors ---
  describe("Brittle Selector Rule", () => {
    it("should flag deeply nested tag selectors", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "div > div > div > button" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const brittle = nodeWarnings.find(w => w.rule === "brittle_selector");
      expect(brittle).toBeDefined();
      expect(brittle.message).toContain("nested tag divisions");
    });

    it("should flag selectors containing multiple nth-child tags", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "ul:nth-child(2) > li:nth-child(4)" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const brittle = nodeWarnings.find(w => w.rule === "brittle_selector");
      expect(brittle).toBeDefined();
      expect(brittle.message).toContain("nth-child");
    });

    it("should flag absolute XPath selectors", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "/html/body/div[2]/form/button" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const brittle = nodeWarnings.find(w => w.rule === "brittle_selector");
      expect(brittle).toBeDefined();
      expect(brittle.message).toContain("absolute XPath");
    });

    it("should flag auto-generated framework class/ID hashes", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "#ember1245" }
          }
        },
        {
          id: "node-2",
          type: "click",
          data: {
            configuration: { selector: ".button-react-a5b8f2c3" }
          }
        }
      ];
      const warnings1 = runPolicyEnforcer([nodes[0]], []);
      const warnings2 = runPolicyEnforcer([nodes[1]], []);
      expect(warnings1["node-1"].some(w => w.rule === "brittle_selector")).toBe(true);
      expect(warnings2["node-2"].some(w => w.rule === "brittle_selector")).toBe(true);
    });

    it("should allow clean attribute and semantic selectors", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "button[data-testid='login-btn']" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const brittle = nodeWarnings.find(w => w.rule === "brittle_selector");
      expect(brittle).toBeUndefined();
    });
  });

  // --- RULE 3: Strict Mode Violations (Broad Selectors) ---
  describe("Strict Mode Selector Rule", () => {
    it("should flag overly generic tag selectors", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "button" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const strictWarning = nodeWarnings.find(w => w.rule === "strict_mode_violation");
      expect(strictWarning).toBeDefined();
    });

    it("should flag overly generic class selectors", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: ".btn" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const strictWarning = nodeWarnings.find(w => w.rule === "strict_mode_violation");
      expect(strictWarning).toBeDefined();
    });
  });

  // --- RULE 4: Assertion Verification ---
  describe("Assertion Verification (Reachability & Dead Ends)", () => {
    it("should flag a terminal action node as a dead end", () => {
      const nodes = [
        {
          id: "node-1",
          type: "click",
          data: {
            configuration: { selector: "button[data-testid='submit']" }
          }
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const deadEnd = nodeWarnings.find(w => w.rule === "dead_end_path");
      expect(deadEnd).toBeDefined();
    });

    it("should not flag a terminal validation node as a dead end", () => {
      const nodes = [
        {
          id: "node-1",
          type: "validate_semantic",
          data: {}
        }
      ];
      const warnings = runPolicyEnforcer(nodes, []);
      const nodeWarnings = warnings["node-1"] || [];
      const deadEnd = nodeWarnings.find(w => w.rule === "dead_end_path");
      expect(deadEnd).toBeUndefined();
    });

    it("should flag a safe terminal node if the upstream path never reaches validation", () => {
      const nodes = [
        { id: "node-1", type: "click", data: { configuration: { selector: "a[href='/profile']" } } },
        { id: "node-2", type: "close_browser", data: {} }
      ];
      const edges = [
        { source: "node-1", target: "node-2" }
      ];
      const warnings = runPolicyEnforcer(nodes, edges);
      // node-1 is an intermediate node, so it has no warnings.
      expect(warnings["node-1"]).toBeUndefined();
      // node-2 is a safe terminal node, but it has no validation upstream, so it gets flagged as unasserted.
      const warnings2 = warnings["node-2"] || [];
      const unasserted = warnings2.find(w => w.rule === "unasserted_path");
      expect(unasserted).toBeDefined();
    });

    it("should not flag nodes that eventually connect to a validation node downstream", () => {
      const nodes = [
        { id: "node-1", type: "click", data: { configuration: { selector: "a[href='/profile']" } } },
        { id: "node-2", type: "validate_semantic", data: {} }
      ];
      const edges = [
        { source: "node-1", target: "node-2" }
      ];
      const warnings = runPolicyEnforcer(nodes, edges);
      const warnings1 = warnings["node-1"] || [];
      const unasserted = warnings1.find(w => w.rule === "unasserted_path");
      const deadEnd = warnings1.find(w => w.rule === "dead_end_path");
      expect(unasserted).toBeUndefined();
      expect(deadEnd).toBeUndefined();
    });
  });
});
