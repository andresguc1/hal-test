import { describe, it, expect } from "vitest";
import {
  getTimeoutCapability,
  canConfigureTimeout,
  timeoutCapableNodeTypes,
  timeoutFieldDefinition,
  TIMEOUT_SEMANTIC,
  TIMEOUT_CONSUMER,
} from "@/config/timeoutCapabilities";
import {
  NODE_INPUTS,
  cleanNodeConfiguration,
  validateNodeConfig,
} from "@/config/validationRules";
import { NODE_CATEGORIES } from "@/config/nodeConstants";

/**
 * The point of the registry is that it is complete. Most of these tests exist
 * to fail loudly when a node type is added or renamed without deciding whether
 * it can be given a timeout — the omission is otherwise invisible until
 * someone sets a value and watches it disappear on save.
 */

describe("timeoutCapabilities registry", () => {
  it("classifies exactly the node types that have something to wait for", () => {
    // The registry covers a subset of the node types, so the useful assertion
    // is about the size of that subset and its boundaries: adding a type by
    // accident, or dropping one that can be bounded, both show up here.
    expect(timeoutCapableNodeTypes().length).toBe(45);

    const categorised = Object.values(NODE_CATEGORIES).flatMap((category) =>
      category.nodes.map((id) => id.id ?? id),
    );
    const unknownToTheApp = timeoutCapableNodeTypes().filter(
      (type) => !categorised.includes(type),
    );
    expect(unknownToTheApp).toEqual([]);

    // Every navigation type is bounded, because a document load can hang.
    for (const nodeType of [
      "open_url",
      "go_back",
      "go_forward",
      "reload_page",
    ]) {
      expect(
        getTimeoutCapability(nodeType).semantic,
        nodeType,
      ).toBe(TIMEOUT_SEMANTIC.NAVIGATION);
    }
  });

  it("never advertises a timeout whose consumer cannot apply it", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      const capability = getTimeoutCapability(nodeType);
      expect(capability, `${nodeType} must resolve`).not.toBeNull();
      expect(capability.consumer, `${nodeType} consumer`).not.toBe(
        TIMEOUT_CONSUMER.NONE,
      );
    }
  });

  it("gives every semantic a min no greater than its default", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      const { semantic, min, default: fallback, max } =
        getTimeoutCapability(nodeType);
      expect(min, `${nodeType}/${semantic} min`).not.toBeNull();
      if (fallback !== null) {
        expect(fallback, `${nodeType}/${semantic} default >= min`).toBeGreaterThanOrEqual(min);
        if (max !== null) {
          expect(fallback, `${nodeType}/${semantic} default <= max`).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it("always exposes guardrail, so callers need no undefined check", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      expect(getTimeoutCapability(nodeType)).toHaveProperty("guardrail");
    }
  });

  it("keeps any guardrail inside the semantic's own max", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      const { guardrail, max } = getTimeoutCapability(nodeType);
      if (guardrail === null || max === null) continue;
      expect(guardrail, `${nodeType} guardrail <= max`).toBeLessThanOrEqual(max);
    }
  });

  it("uses the key 'timeout' so stored flows and existing i18n keep working", () => {
    const definition = timeoutFieldDefinition("click");
    expect(definition.key).toBe("timeout");
  });

  it("points labelKey at the node's own semantic", () => {
    expect(timeoutFieldDefinition("assert").labelKey).toBe(
      "nodes.fields.timeout.assertion",
    );
    expect(timeoutFieldDefinition("open_url").labelKey).toBe(
      "nodes.fields.timeout.navigation",
    );
  });

  it("treats an unknown type as having no timeout", () => {
    expect(getTimeoutCapability("no_such_node")).toBeNull();
    expect(canConfigureTimeout("no_such_node")).toBe(false);
    expect(timeoutFieldDefinition("no_such_node")).toBeNull();
  });

  it("does not offer a timeout on nodes with nothing to wait for", () => {
    for (const nodeType of [
      "sticky_note",
      "discussion",
      "audit_policy",
      "db_query",
      "write_file",
      "conditional",
      "mock_response",
      "call_llm",
      "pause",
    ]) {
      expect(canConfigureTimeout(nodeType), `${nodeType} must have none`).toBe(
        false,
      );
    }
  });

  it("caps the wait semantic, because an unsatisfiable wait is a hang", () => {
    const capability = getTimeoutCapability("wait_network");
    expect(capability.semantic).toBe(TIMEOUT_SEMANTIC.WAIT);
    expect(capability.guardrail).toBe(300000);
  });
});

describe("NODE_INPUTS timeout injection", () => {
  it("gives the timeout field to every capable node type", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      const inputs = NODE_INPUTS[nodeType];
      expect(Array.isArray(inputs), `${nodeType} needs an inputs array`).toBe(true);
      const matches = inputs.filter((f) => f.key === "timeout");
      expect(matches.length, `${nodeType} timeout declared once`).toBe(1);
    }
  });

  it("adds the field to types that previously had no declaration", () => {
    // These are the node types whose configured timeout used to be stripped on
    // save because nothing declared it.
    for (const nodeType of [
      "type_text",
      "hover",
      "select_option",
      "take_screenshot",
      "scroll",
      "drag_drop",
    ]) {
      expect(canConfigureTimeout(nodeType)).toBe(true);
      expect(NODE_INPUTS[nodeType].some((f) => f.key === "timeout")).toBe(true);
    }
  });

  it("materialises node types that had no NODE_INPUTS entry at all", () => {
    // wait_network is a real, creatable node type with no schema entry, so it
    // used to fall through to `default` and lose every value but `selector`.
    expect(canConfigureTimeout("wait_network")).toBe(true);
    expect(NODE_INPUTS.wait_network.some((f) => f.key === "timeout")).toBe(true);
  });

  it("keeps set_checkbox's timeout behind advanced, as it already was", () => {
    const field = NODE_INPUTS.set_checkbox.find((f) => f.key === "timeout");
    expect(field.advanced).toBe(true);
  });

  it("leaves no inline duplicate behind", () => {
    for (const nodeType of timeoutCapableNodeTypes()) {
      expect(
        NODE_INPUTS[nodeType].filter((f) => f.key === "timeout").length,
        nodeType,
      ).toBe(1);
    }
  });

  it("appends the field rather than reflowing the fields already there", () => {
    // click is the most-used node. The field used to sit between clickOutside
    // and takeScreenshot; it is now last. Every capable type has it in the
    // same relative position, which is worth more than preserving one type's
    // old position and leaving 44 others inconsistent.
    const keys = NODE_INPUTS.click.map((f) => f.key);
    expect(keys).toEqual([
      "selector",
      "clickType",
      "contextMenuItem",
      "clickOutside",
      "takeScreenshot",
      "continueOnError",
      "timeout",
    ]);
  });

  it("seeds a materialised type from `default` so it keeps its required selector", () => {
    // These 10 types had no NODE_INPUTS entry and resolved to `default`, whose
    // only field is a required selector. Giving them a timeout must not cost
    // them that validation.
    for (const nodeType of [
      "wait_network",
      "wait_network_match",
      "wait_navigation",
      "wait_visible",
      "manage_cookies",
      "upload_file",
      "download_file",
      "create_context",
      "close_context",
      "run_tests",
    ]) {
      const keys = NODE_INPUTS[nodeType].map((f) => f.key);
      expect(keys, `${nodeType} keeps selector`).toContain("selector");
      expect(keys, `${nodeType} has timeout`).toContain("timeout");
      expect(
        NODE_INPUTS[nodeType].find((f) => f.key === "selector").required,
        `${nodeType} selector still required`,
      ).toBe(true);
    }
  });
});

describe("cleanNodeConfiguration preserves a configured timeout", () => {
  const config = { timeout: "5000", selector: ".btn" };

  it.each([
    "type_text",
    "hover",
    "select_option",
    "take_screenshot",
    "click",
    "open_url",
    "assert",
    "wait_network",
    "set_checkbox",
    "mouse_move",
    "backend_js",
  ])("keeps it on %s", (nodeType) => {
    expect(cleanNodeConfiguration(config, nodeType).timeout).toBe("5000");
  });

  it.each(["sticky_note", "db_query", "conditional", "no_such_node"])(
    "still strips it on %s",
    (nodeType) => {
      expect(cleanNodeConfiguration(config, nodeType)).not.toHaveProperty("timeout");
    },
  );

  it("keeps a zero timeout rather than discarding it as falsy", () => {
    // "0" means "use the platform default", which is a decision the user made.
    // Dropping it would silently promote them to whatever the project default
    // later becomes.
    expect(cleanNodeConfiguration({ timeout: "0" }, "click").timeout).toBe("0");
  });

  it("keeps an empty timeout, so clearing the field is not a silent revert", () => {
    expect(cleanNodeConfiguration({ timeout: "" }, "click")).toHaveProperty("timeout");
  });

  it("keeps a value above the old 30s ceiling intact", () => {
    expect(cleanNodeConfiguration({ timeout: "120000" }, "click").timeout).toBe(
      "120000",
    );
  });

  it("still drops keys that are not declared anywhere", () => {
    const cleaned = cleanNodeConfiguration(
      { timeout: "5000", notAField: "x" },
      "click",
    );
    expect(cleaned.notAField).toBeUndefined();
  });
});

describe("validateNodeConfig still governs the fields the registry did not add", () => {
  it("requires the selector of a materialised type", () => {
    // Guards the seeding-from-`default` behaviour above: a type that gained a
    // timeout must not have lost the required field it resolved to before.
    const result = validateNodeConfig("wait_network", { timeout: "5000" });
    expect(result.isValid).toBe(false);
    expect(result.fieldKey).toBe("selector");
  });

  it("accepts a materialised type that carries both fields", () => {
    const result = validateNodeConfig("wait_network", {
      selector: ".loaded",
      timeout: "5000",
    });
    expect(result.isValid).toBe(true);
  });

  it("does not treat the added timeout as required", () => {
    // An empty timeout means "use the platform default", so it must never
    // block a save. Range checking of the value is a later phase's job;
    // this asserts only that leaving it blank is allowed.
    const result = validateNodeConfig("type_text", {
      selector: "#name",
      text: "hello",
    });
    expect(result.isValid).toBe(true);
  });
});