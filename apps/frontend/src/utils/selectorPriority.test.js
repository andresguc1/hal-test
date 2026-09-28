import { describe, it, expect } from "vitest";
import {
  pickBestSelector,
  PLAYWRIGHT_SELECTOR_PRIORITY,
} from "./selectorPriority.js";

describe("Selector Priority - Playwright locators first", () => {
  it("should pick playwrightTestId over all other selectors", () => {
    const sources = {
      candidates: {
        playwrightTestId: "getByTestId('submit-btn')",
        playwrightRole: "getByRole('button', { name: 'Submit' })",
        cssPath: "div > button",
        xpath: "//div/button",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByTestId('submit-btn')");
    expect(result.type).toBe("playwrightTestId");
  });

  it("should pick playwrightRole over CSS and XPath", () => {
    const sources = {
      candidates: {
        playwrightRole: "getByRole('button', { name: 'Login' })",
        playwrightLabel: "getByLabel('Username')",
        cssPath: "form > button",
        xpath: "//form/button",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByRole('button', { name: 'Login' })");
    expect(result.type).toBe("playwrightRole");
  });

  it("should pick playwrightLabel over testId and CSS", () => {
    const sources = {
      candidates: {
        testId: '[data-testid="login"]',
        playwrightLabel: "getByLabel('Email')",
        cssPath: 'input[type="email"]',
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByLabel('Email')");
    expect(result.type).toBe("playwrightLabel");
  });

  it("should pick playwrightPlaceholder over id and CSS", () => {
    const sources = {
      candidates: {
        id: "#email",
        playwrightPlaceholder: "getByPlaceholder('Enter email')",
        cssPath: "input.email",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByPlaceholder('Enter email')");
    expect(result.type).toBe("playwrightPlaceholder");
  });

  it("should pick playwrightAltText over name and CSS", () => {
    const sources = {
      candidates: {
        name: 'input[name="search"]',
        playwrightAltText: "getByAltText('Search icon')",
        cssPath: "img.search",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByAltText('Search icon')");
    expect(result.type).toBe("playwrightAltText");
  });

  it("should pick playwrightTitle over aria and CSS", () => {
    const sources = {
      candidates: {
        aria: '[aria-label="Close"]',
        playwrightTitle: "getByTitle('Close dialog')",
        cssPath: "button.close",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByTitle('Close dialog')");
    expect(result.type).toBe("playwrightTitle");
  });

  it("should pick playwrightText over CSS and XPath", () => {
    const sources = {
      candidates: {
        playwrightText: "getByText('Submit')",
        cssPath: "button.submit",
        xpath: '//button[@class="submit"]',
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByText('Submit')");
    expect(result.type).toBe("playwrightText");
  });

  it("should pick testId (CSS) over id when no Playwright locator available", () => {
    const sources = {
      candidates: {
        testId: '[data-testid="footer"]',
        id: "#footer",
        cssPath: "footer",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe('[data-testid="footer"]');
    expect(result.type).toBe("testId");
  });

  it("should pick id over name and CSS path", () => {
    const sources = {
      candidates: {
        id: "#main-content",
        name: "main",
        cssPath: "main.content",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("#main-content");
    expect(result.type).toBe("id");
  });

  it("should pick name over aria and text", () => {
    const sources = {
      candidates: {
        name: 'input[name="username"]',
        aria: '[aria-label="Username"]',
        text: '//input[contains(text(), "Username")]',
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe('input[name="username"]');
    expect(result.type).toBe("name");
  });

  it("should pick aria over text and CSS path", () => {
    const sources = {
      candidates: {
        aria: '[aria-label="Search"]',
        text: '//button[contains(text(), "Search")]',
        cssPath: "button.search",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe('[aria-label="Search"]');
    expect(result.type).toBe("aria");
  });

  it("should pick text (XPath) over cssPath and xpath", () => {
    const sources = {
      candidates: {
        text: '//span[contains(text(), "Hello")]',
        cssPath: "span.greeting",
        xpath: "//div/span",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe('//span[contains(text(), "Hello")]');
    expect(result.type).toBe("text");
  });

  it("should pick cssPath over xpath as last resort", () => {
    const sources = {
      candidates: {
        cssPath: "div.container > button",
        xpath: '//div[@class="container"]/button',
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("div.container > button");
    expect(result.type).toBe("cssPath");
  });

  it("should pick xpath as absolute last resort", () => {
    const sources = {
      candidates: {
        xpath: "//div/div[2]/button",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("//div/div[2]/button");
    expect(result.type).toBe("xpath");
  });

  it("should handle mixed case: prefer Playwright even when CSS appears first in object", () => {
    const sources = {
      candidates: {
        cssPath: "div > button",
        xpath: "//div/button",
        playwrightTestId: "getByTestId('btn')",
      },
    };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("getByTestId('btn')");
    expect(result.type).toBe("playwrightTestId");
  });

  it("should return empty string for empty candidates", () => {
    const sources = { candidates: {} };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("");
    expect(result.type).toBe("unknown");
  });

  it("should fallback to sources.selector when no candidates", () => {
    const sources = { selector: "#fallback-selector" };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe("#fallback-selector");
    expect(result.type).toBe("unknown");
  });

  it("should fallback to sources.sanitizedSelector when no candidates and no selector", () => {
    const sources = { sanitizedSelector: 'getByRole("button")' };
    const result = pickBestSelector(sources);
    expect(result.selector).toBe('getByRole("button")');
    expect(result.type).toBe("unknown");
  });

  it("PLAYWRIGHT_SELECTOR_PRIORITY should have correct order", () => {
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[0]).toBe("playwrightTestId");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[1]).toBe("playwrightRole");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[2]).toBe("playwrightLabel");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[3]).toBe("playwrightPlaceholder");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[4]).toBe("playwrightAltText");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[5]).toBe("playwrightTitle");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[6]).toBe("playwrightText");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[7]).toBe("testId");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[8]).toBe("id");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[9]).toBe("name");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[10]).toBe("aria");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[11]).toBe("text");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[12]).toBe("cssPath");
    expect(PLAYWRIGHT_SELECTOR_PRIORITY[13]).toBe("xpath");
  });
});
