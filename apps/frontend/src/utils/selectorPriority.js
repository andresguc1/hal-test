export const PLAYWRIGHT_SELECTOR_PRIORITY = [
  "playwrightTestId",
  "playwrightRole",
  "playwrightLabel",
  "playwrightPlaceholder",
  "playwrightAltText",
  "playwrightTitle",
  "playwrightText",
  "testId",
  "id",
  "name",
  "aria",
  "text",
  "cssPath",
  "xpath",
];

export function pickBestSelector(sources) {
  const candidates = sources.candidates || sources.selectors || {};

  for (const type of PLAYWRIGHT_SELECTOR_PRIORITY) {
    const candidate = candidates[type];
    if (candidate) return { selector: candidate, type };
  }

  const fallbackMap = {
    dataAttribute: candidates.dataAttribute,
    testId: candidates.testId,
    css: candidates.css || candidates.cssPath,
    xpath: candidates.xpath || candidates.text,
  };

  for (const candidate of Object.values(fallbackMap)) {
    if (candidate) return { selector: candidate, type: "fallback" };
  }

  return {
    selector: sources.selector || sources.sanitizedSelector || "",
    type: "unknown",
  };
}
