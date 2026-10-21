import { describe, it, expect } from 'vitest';
import { PLAYWRIGHT_SELECTOR_PRIORITY, pickBestSelector, isPlaywrightLocator } from './selectorPriority';

describe('PLAYWRIGHT_SELECTOR_PRIORITY', () => {
  // The priority order follows Playwright's recommended strategies for reliable
  // element identification. The order prioritizes semantic selectors (getByRole,
  // getByLabel, etc.) over CSS/XPath fallbacks.
  it('has the correct priority order', () => {
    // Priority 1-5: Playwright semantic selectors (recommended strategies)
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[0]).toBe('playwrightRole');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[1]).toBe('playwrightLabel');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[2]).toBe('playwrightPlaceholder');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[3]).toBe('playwrightText');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[4]).toBe('playwrightTestId');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[5]).toBe('testId');
    // Priority 6-13: Additional identifiers and fallbacks
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[6]).toBe('id');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[7]).toBe('name');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[8]).toBe('aria');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[10]).toBe('text');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[11]).toBe('cssPath');
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[11]).toBe('xpath');
    // Note: playwrightAltText and playwrightTitle are no longer in the main
    // priority list but can be used as additional fallbacks if needed.
  });
});

describe('isPlaywrightLocator', () => {
  it('recognises bare getBy* locators', () => {
    expect(isPlaywrightLocator("getByText('Submit')")).toBe(true);
    expect(isPlaywrightLocator("getByRole('button', { name: 'Save' })")).toBe(
      true,
    );
    expect(isPlaywrightLocator("getByTestId('foo')")).toBe(true);
  });

  it("recognises namespaced and chained getBy* locators", () => {
    expect(isPlaywrightLocator("page.getByRole('link')")).toBe(true);
    expect(
      isPlaywrightLocator("page.locator('#form').getByLabel('Email')"),
    ).toBe(true);
  });

  it("rejects CSS, XPath and non-string values", () => {
    expect(isPlaywrightLocator("#showOverview")).toBe(false);
    expect(isPlaywrightLocator("div > button")).toBe(false);
    expect(isPlaywrightLocator('//div[@id="showOverview"]')).toBe(false);
    expect(isPlaywrightLocator("")).toBe(false);
    expect(isPlaywrightLocator(null)).toBe(false);
    expect(isPlaywrightLocator(undefined)).toBe(false);
  });
});

describe('pickBestSelector', () => {
  it('returns the best semantic selector when candidates are available', () => {
    const result = pickBestSelector({
      candidates: {
        playwrightRole: 'getByRole("button")',
        playwrightLabel: undefined,
      },
    });
    // The selector should be the playwrightRole candidate
    expect(result.selector).toBe("getByRole("button")");
    expect(result.type).toBe("playwrightRole");
  });

  it("falls back to CSS when no semantic selector is found", () => {
    const result = pickBestSelector({
      candidates: {
        css: "button.submit",
      },
    });
    expect(result.selector).toBe("button.submit");
    expect(result.type).toBe("fallback");
  });

  it("returns empty when no candidates are available", () => {
    const result = pickBestSelector({});
    expect(result.selector).toBe("");
    expect(result.type).toBe("unknown");
  });

  it("handles ambiguous backend choice gracefully", () => {
    const result = pickBestSelector({
      selector: "getByText('Submit')",
      ambiguous: true,
    });
    // When backend flags ambiguous, it's authoritative
    expect(result.selector).toBe("getByText('Submit')");
  });
});
