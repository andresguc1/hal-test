// Matches a getBy* locator, whether bare (`getByText('x')`) or namespaced /
// chained (`page.getByRole(...)`, `page.locator('#x').getByText('y')`).
const PLAYWRIGHT_LOCATOR_RE =
  /(?:^|\.)\s*getBy(?:Role|Text|Label|TestId|Placeholder|AltText|Title)\s*\(/i;

export function isPlaywrightLocator(selector) {
  return (
    typeof selector === "string" && PLAYWRIGHT_LOCATOR_RE.test(selector.trim())
  );
}

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

  // The in-page inspector resolves ambiguity before emitting (unique exact-text
  // variant, a context chain, a cardinality locator, or a safe CSS/XPath
  // fallback) and stores that decision in `sources.selector`. When it flagged
  // the pick as ambiguous, that backend choice is authoritative: re-ranking
  // here would overwrite it with the naive "first getBy* wins" rule and can
  // emit a strict-mode-violating locator (e.g. an ambiguous getByText that the
  // backend deliberately replaced with cssPath). Trust the backend's choice.
  const backendBest =
    typeof sources.selector === "string" ? sources.selector.trim() : "";
  const backendFlaggedAmbiguous =
    sources.ambiguous === true || candidates.ambiguous === true;
  if (backendBest && backendFlaggedAmbiguous) {
    return {
      selector: backendBest,
      type: sources.selectorType || sources.strategy || "unknown",
    };
  }

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
