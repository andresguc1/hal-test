import { describe, it, expect } from "vitest";
import { NODE_INPUTS, cleanNodeConfiguration } from "@/config/validationRules";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import pt from "@/locales/pt.json";

describe("mouse_move frontend config", () => {
  const fields = NODE_INPUTS.mouse_move;
  const key = (k) => fields.find((f) => f.key === k);

  it("declares the mode selector with a default", () => {
    expect(key("targetMode").type).toBe("select");
    expect(key("targetMode").defaultValue).toBe("viewport_absolute");
    expect(key("targetMode").options.map((o) => o.value)).toEqual([
      "viewport_absolute",
      "element_center",
      "element_offset",
      "away_from_element",
    ]);
  });

  it("shows x/y only for viewport mode", () => {
    expect(key("x").isVisible({ targetMode: "viewport_absolute" })).toBe(true);
    expect(key("x").isVisible({ targetMode: "element_center" })).toBe(false);
  });

  it("shows selector for all three element modes", () => {
    for (const m of ["element_center", "element_offset", "away_from_element"]) {
      expect(key("selector").isVisible({ targetMode: m })).toBe(true);
    }
    expect(key("selector").isVisible({ targetMode: "viewport_absolute" })).toBe(
      false,
    );
  });

  it("shows offsets and exit direction for the right modes", () => {
    expect(key("offsetX").isVisible({ targetMode: "element_offset" })).toBe(
      true,
    );
    expect(key("offsetX").isVisible({ targetMode: "element_center" })).toBe(
      false,
    );
    expect(
      key("exitDirection").isVisible({ targetMode: "away_from_element" }),
    ).toBe(true);
  });

  it("labels coordinates as viewport-relative, not page-relative", () => {
    // A user reading "X: 1200" must know the origin is the viewport.
    expect(key("x").label).toMatch(/viewport/i);
    expect(key("y").label).toMatch(/viewport/i);
  });

  // Playwright cannot pause between the internal steps of a single
  // mouse.move(), so a "delay between steps" field could only ever be a lie.
  it("offers no per-step delay field", () => {
    expect(fields.map((f) => f.key)).not.toContain("stepDelay");
    expect(fields.map((f) => f.key)).toContain("settleMs");
  });

  // The panel renders field help from nodes.fieldHelp, not the pre-existing
  // nodes.hints block. Six keys in that block collide with real field keys
  // (selector, force, timeout, path, fullPage, waitForNavigation), so reusing
  // it would dump unrelated copy under other nodes' fields.
  it("keeps field help out of the colliding nodes.hints namespace", () => {
    for (const [name, l] of Object.entries({ en, es, fr, pt })) {
      expect(l.nodes.fieldHelp, name).toBeTruthy();
      for (const k of [
        "selector",
        "force",
        "timeout",
        "path",
        "fullPage",
        "waitForNavigation",
      ]) {
        expect(l.nodes.fieldHelp[k], `${name}.${k}`).toBeUndefined();
      }
    }
  });

  it("has field help in every locale for each described field", () => {
    const described = fields.filter((f) => f.description).map((f) => f.key);
    expect(described.length).toBeGreaterThan(0);
    for (const [name, l] of Object.entries({ en, es, fr, pt })) {
      for (const k of described) {
        expect(l.nodes.fieldHelp[k], `${name}.${k}`).toBeTruthy();
      }
    }
  });

  it("warns that coordinates are viewport-relative, not page-relative", () => {
    // Report risk #1: users assume document coordinates. The help text has to
    // say "visible area", not just the label.
    expect(key("x").description).toMatch(/visible area/i);
    expect(key("y").description).toMatch(/visible area/i);
  });

  it("keeps every declared key through cleanNodeConfiguration", () => {
    // A key-based whitelist means anything not declared here is silently
    // dropped on save, which would break the node at runtime.
    const dirty = Object.fromEntries(fields.map((f) => [f.key, 1]));
    const cleaned = cleanNodeConfiguration(dirty, "mouse_move", fields);
    for (const f of fields) {
      expect(cleaned).toHaveProperty(f.key);
    }
  });

  it("preserves a stale x/y when the mode changes away from viewport", () => {
    const cleaned = cleanNodeConfiguration(
      { targetMode: "element_center", selector: "#a", x: 5, y: 9 },
      "mouse_move",
      fields,
    );
    expect(cleaned).toMatchObject({ targetMode: "element_center", x: 5, y: 9 });
  });

  it("has a toolbox label in every locale", () => {
    for (const [name, l] of Object.entries({ en, es, fr, pt })) {
      expect(l.nodes.labels.mouse_move, name).toBeTruthy();
    }
  });

  it("has a translated label for every field it declares", () => {
    const declared = fields.map((f) => f.key);
    for (const [name, l] of Object.entries({ en, es, fr, pt })) {
      for (const k of declared) {
        // takeScreenshot/continueOnError are untranslated app-wide.
        if (["takeScreenshot", "continueOnError"].includes(k)) continue;
        expect(l.nodes.fields[k], `${name}.${k}`).toBeTruthy();
      }
    }
  });

  it("has no leftover interpolation in any translated string", () => {
    const declared = fields.map((f) => f.key);
    for (const [name, l] of Object.entries({ en, es, fr, pt })) {
      for (const k of declared) {
        expect(String(l.nodes.fields[k] ?? ""), `${name}.${k}`).not.toMatch(
          /\{\{|\}\}/,
        );
      }
    }
  });
});
