import { describe, it, expect } from "vitest";
import {
  canonicalizeConfig,
  collectInputDefaults,
  normalizeFormConfig,
  resolveSyncAction,
  SYNC_SYNCED,
  SYNC_KEEP_PENDING,
  SYNC_RESCHEDULE,
} from "./nodeConfigSync";

const assertPageTextInputs = [
  { key: "textToFind" },
  { key: "matchType", defaultValue: "contains" },
  { key: "caseSensitive", defaultValue: false },
  { key: "continueOnError", defaultValue: false },
];

describe("normalizeFormConfig", () => {
  it("fills schema defaults for a node stored without configuration", () => {
    expect(normalizeFormConfig(undefined, assertPageTextInputs)).toEqual({
      matchType: "contains",
      caseSensitive: false,
      continueOnError: false,
    });
  });

  it("keeps stored values over schema defaults", () => {
    expect(
      normalizeFormConfig(
        { matchType: "exact", caseSensitive: true },
        assertPageTextInputs,
      ),
    ).toEqual({
      matchType: "exact",
      caseSensitive: true,
      continueOnError: false,
    });
  });

  it("preserves keys that are not part of the schema defaults", () => {
    expect(
      normalizeFormConfig({ textToFind: "hi" }, assertPageTextInputs),
    ).toEqual({
      textToFind: "hi",
      matchType: "contains",
      caseSensitive: false,
      continueOnError: false,
    });
  });
});

describe("collectInputDefaults", () => {
  it("collects only inputs declaring a default", () => {
    expect(collectInputDefaults(assertPageTextInputs)).toEqual({
      matchType: "contains",
      caseSensitive: false,
      continueOnError: false,
    });
  });
});

describe("canonicalizeConfig", () => {
  it("is insensitive to object key order", () => {
    expect(canonicalizeConfig({ b: 1, a: 2 })).toBe(
      canonicalizeConfig({ a: 2, b: 1 }),
    );
  });

  it("keeps array order meaningful", () => {
    expect(canonicalizeConfig({ list: [1, 2] })).not.toBe(
      canonicalizeConfig({ list: [2, 1] }),
    );
  });

  it("sorts object keys inside nested objects and arrays", () => {
    expect(canonicalizeConfig({ items: [{ b: 1, a: 2 }] })).toBe(
      canonicalizeConfig({ items: [{ a: 2, b: 1 }] }),
    );
  });
});

describe("resolveSyncAction", () => {
  const baselineFor = (stored) =>
    normalizeFormConfig(stored, assertPageTextInputs);

  it("treats schema defaults as already held by an empty graph config", () => {
    // Root cause: comparing the registered defaults against `{}` read as
    // permanently dirty, which re-armed the debounce on every render.
    expect(
      resolveSyncAction({
        formValues: {
          matchType: "contains",
          caseSensitive: false,
          continueOnError: false,
        },
        baseline: {},
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_SYNCED);
  });

  it("reads as synced once the baseline carries the same normalised values", () => {
    const values = { textToFind: "Alpha", matchType: "contains" };
    expect(
      resolveSyncAction({
        formValues: values,
        baseline: baselineFor(values),
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_SYNCED);
  });

  it("reads as synced regardless of stored key order", () => {
    expect(
      resolveSyncAction({
        formValues: { caseSensitive: false, matchType: "contains" },
        baseline: { matchType: "contains", caseSensitive: false },
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_SYNCED);
  });

  it("reschedules when the user actually changed a value", () => {
    expect(
      resolveSyncAction({
        formValues: { matchType: "exact" },
        baseline: baselineFor({ matchType: "contains" }),
        scheduledValues: null,
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_RESCHEDULE);
  });

  it("keeps a queued write instead of re-arming it when values are unchanged", () => {
    const queued = { matchType: "exact" };
    expect(
      resolveSyncAction({
        formValues: { matchType: "exact" },
        baseline: baselineFor({ matchType: "contains" }),
        scheduledValues: queued,
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_KEEP_PENDING);
  });
});

describe("resolveSyncAction anti-starvation (root cause)", () => {
  it("a write scheduled against an empty configuration survives repeated renders", () => {
    // Regression: a node stored without `configuration` made every render look
    // dirty, so each render re-armed the 200 ms debounce and, while the panel
    // rendered faster than that, the write never landed (lost on save/reload/run).
    const stored = {}; // what the graph holds
    const formValues = {
      textToFind: "ALPHA1",
      matchType: "contains",
      caseSensitive: false,
      continueOnError: false,
    };

    let baseline = stored;
    let scheduledValues = null;
    let armed = false;

    const render = () => {
      const action = resolveSyncAction({
        formValues,
        baseline: normalizeFormConfig(baseline, assertPageTextInputs),
        scheduledValues,
        inputs: assertPageTextInputs,
      });
      if (action === SYNC_RESCHEDULE) {
        armed = true; // (re)arms the debounce timer
        scheduledValues = { ...formValues };
      }
      return action;
    };

    expect(render()).toBe(SYNC_RESCHEDULE);
    // The panel re-renders ~13 times a second while a node is hovered or a
    // tooltip is open; none of those renders may cancel the queued write.
    for (let i = 0; i < 100; i += 1) {
      expect(render()).toBe(SYNC_KEEP_PENDING);
    }
    expect(armed).toBe(true);

    // The debounce fires: the graph now holds the form values.
    baseline = scheduledValues;
    scheduledValues = null;
    expect(render()).toBe(SYNC_SYNCED);
  });

  it("re-arms the write when a newer value arrives while one is queued", () => {
    const baseline = normalizeFormConfig({}, assertPageTextInputs);
    const queued = { textToFind: "first", matchType: "contains" };

    expect(
      resolveSyncAction({
        formValues: { textToFind: "second", matchType: "contains" },
        baseline,
        scheduledValues: queued,
        inputs: assertPageTextInputs,
      }),
    ).toBe(SYNC_RESCHEDULE);
  });
});
