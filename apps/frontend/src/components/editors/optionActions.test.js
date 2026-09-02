import { describe, it, expect } from "vitest";
import {
  ACTION_CHECK,
  ACTION_NO_CHANGE,
  ACTION_UNCHECK,
  normalizeAction,
  getActionFor,
  setActionFor,
  selectAllFor,
  countActions,
} from "./optionActions.js";

const optA = { label: "Admin", value: "admin" };
const optB = { label: "Editor", value: "editor" };

describe("normalizeAction", () => {
  it("defaults missing/empty/invalid to CHECK", () => {
    expect(normalizeAction()).toBe(ACTION_CHECK);
    expect(normalizeAction("")).toBe(ACTION_CHECK);
    expect(normalizeAction("nonsense")).toBe(ACTION_CHECK);
    expect(normalizeAction("CHECKK")).toBe(ACTION_CHECK);
  });
  it("is case-insensitive", () => {
    expect(normalizeAction("no_change")).toBe(ACTION_NO_CHANGE);
    expect(normalizeAction("Check")).toBe(ACTION_CHECK);
    expect(normalizeAction("uncheck ")).toBe(ACTION_UNCHECK);
  });
});

describe("getActionFor", () => {
  it("defaults to NO_CHANGE when the option is unlisted (no seeding)", () => {
    expect(getActionFor([{ ...optA, action: ACTION_CHECK }], optB)).toBe(
      ACTION_NO_CHANGE,
    );
  });
  it("returns the configured action matching by label or value", () => {
    expect(getActionFor([{ ...optA, action: ACTION_UNCHECK }], optA)).toBe(
      ACTION_UNCHECK,
    );
    expect(
      getActionFor([{ label: "Admin", action: ACTION_CHECK }], { ...optA, value: "" }),
    ).toBe(ACTION_CHECK);
  });
});

describe("setActionFor", () => {
  it("adds an entry for CHECK without touching other options", () => {
    const base = [{ ...optB, action: ACTION_CHECK }];
    const next = setActionFor(base, optA, ACTION_CHECK);
    expect(next).toEqual([
      { ...optB, action: ACTION_CHECK },
      { ...optA, action: ACTION_CHECK },
    ]);
  });
  it("removes the entry when set to NO_CHANGE", () => {
    const base = [
      { ...optA, action: ACTION_CHECK },
      { ...optB, action: ACTION_UNCHECK },
    ];
    const next = setActionFor(base, optA, ACTION_NO_CHANGE);
    expect(next).toEqual([{ ...optB, action: ACTION_UNCHECK }]);
  });
  it("updates an existing option in place", () => {
    const base = [{ ...optA, action: ACTION_CHECK }];
    const next = setActionFor(base, optA, ACTION_UNCHECK);
    expect(next).toEqual([{ ...optA, action: ACTION_UNCHECK }]);
    expect(next).toHaveLength(1);
  });
  it("records numeric values as strings", () => {
    const next = setActionFor([], { label: "X", value: 5 }, ACTION_CHECK);
    expect(next).toEqual([{ label: "X", value: "5", action: ACTION_CHECK }]);
  });
});

describe("selectAllFor", () => {
  it("flags every enabled option as CHECK", () => {
    const next = selectAllFor([optA, { ...optB, enabled: false }]);
    expect(next).toEqual([{ ...optA, action: ACTION_CHECK }]);
  });
});

describe("countActions", () => {
  it("counts only non-NO_CHANGE entries", () => {
    expect(
      countActions([
        { ...optA, action: ACTION_CHECK },
        { ...optB, action: ACTION_NO_CHANGE },
      ]),
    ).toBe(1);
  });
});