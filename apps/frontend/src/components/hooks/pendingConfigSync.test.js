import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  registerPendingConfigFlush,
  flushPendingConfigSync,
  resetPendingConfigFlush,
  hasPendingConfigFlush,
} from "./pendingConfigSync";

beforeEach(() => resetPendingConfigFlush());
afterEach(() => vi.restoreAllMocks());

describe("pendingConfigSync registry", () => {
  it("returns false when nothing is registered (nothing to retry)", () => {
    expect(flushPendingConfigSync()).toBe(false);
    expect(hasPendingConfigFlush()).toBe(false);
  });

  it("reports whether a queued write was actually flushed", () => {
    // Models the panel: true while an edit is queued, false afterwards.
    let queued = true;
    registerPendingConfigFlush(() => {
      if (!queued) return false;
      queued = false;
      return true;
    });

    expect(flushPendingConfigSync()).toBe(true);
    // After the flush the panel has nothing queued: a second flush must not
    // ask callers to retry again (that would loop forever).
    expect(flushPendingConfigSync()).toBe(false);
  });

  it("does not signal a retry when the panel had no queued write", () => {
    registerPendingConfigFlush(() => false);
    expect(flushPendingConfigSync()).toBe(false);
  });

  it("drops the flusher through the returned unregister callback", () => {
    const unregister = registerPendingConfigFlush(() => true);
    unregister();
    expect(hasPendingConfigFlush()).toBe(false);
    expect(flushPendingConfigSync()).toBe(false);
  });

  it("keeps the newer flusher when one is replaced", () => {
    const oldFlush = vi.fn(() => true);
    const newFlush = vi.fn(() => true);
    const unregisterOld = registerPendingConfigFlush(oldFlush);
    registerPendingConfigFlush(newFlush);

    unregisterOld();
    expect(flushPendingConfigSync()).toBe(true);
    expect(oldFlush).not.toHaveBeenCalled();
    expect(newFlush).toHaveBeenCalledTimes(1);
  });

  it("swallows a throwing flusher and does not signal a retry", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerPendingConfigFlush(() => {
      throw new Error("boom");
    });
    expect(flushPendingConfigSync()).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("ignores non-function registrations", () => {
    registerPendingConfigFlush(null);
    expect(hasPendingConfigFlush()).toBe(false);
    expect(flushPendingConfigSync()).toBe(false);
  });
});
