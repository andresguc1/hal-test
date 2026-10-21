// Matches a getBy* locator, whether bare (`getByText('x')`) or namespaced /
// chained (`page.getByRole(...)`, `page.locator('#x').getByText('y')`).
const PLAYWRIGHT_LOCATOR_RE =
  /(?:^|\.)\s*getBy(?:Role|Text|Label|TestId|Placeholder|AltText|Title)\s*\(/i;

export function isPlaywrightLocator(selector) {
  return (
    typeof selector === "string" && PLAYWRIGHT_LOCATOR_RE.test(selector.trim())
  );
}

/**
 * Priority order for Playwright semantic selectors, following Playwright's
 * recommended strategies for reliable element identification.
 *
 * Order (from most to least reliable):
 *  1. getByRole() with accessible role + accessible name
 *  2. getByLabel() for form fields associated with labels
 *  3. getByPlaceholder() when placeholder is meaningful and stable
 *  4. getByText() for elements identifiable by visible, stable text
 *  5. getByTestId() when the page has appropriate test ID attributes
 *  6. CSS selectors and other alternatives as a fallback
 *
 * This list is a guide, not a rigid hierarchy. The final strategy should consider
 * the element type, its semantics, stability, and ability to uniquely identify it.
 */
export const PLAYWRIGHT_SELECTOR_PRIORITY = [
  "playwrightRole",
  "playwrightLabel",
  "playwrightPlaceholder",
  "playwrightText",
  "playwrightTestId",
  "testId",
  "id",
  "name",
  "aria",
  "text",
  "cssPath",
  "xpath",
];

/**
 * Returns the best Playwright semantic selector from the provided sources.
 *
 * The function:
 * - Trusts the backend's ambiguity flag when present (the backend may have
 *     resolved uniqueness in ways the frontend cannot)
 * - Iterates through Playwright semantic selectors in the recommended priority
 * - Falls back to CSS/XPath when no semantic selector is found
 * - Returns useful type information so the UI can explain the recommendation
 *
 * @param sources - Object containing `candidates` (map of type->selector) and
 *     optionally `selector` (raw backend choice) and `ambiguous` flag
 * @returns {Object} { selector, type } - The best selector found and its type key
 */
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
    sources.ambiguous === true || candidates?.ambiguous === true;
  if (backendBest && backendFlaggedAmbiguous) {
    return {
      selector: backendBest,
      type: sources.selectorType || sources.strategy || "unknown",
    };
  }

  // Iterate through Playwright semantic selectors in the recommended priority.
  // Skip types that are not present in candidates.
  for (const type of PLAYWRIGHT_SELECTOR_PRIORITY) {
    const candidate = candidates[type];
    if (candidate) {
      // Normalize the candidate: trim whitespace and ensure it's a valid getBy* form.
      const normalized = candidate.trim();
      if (normalized) {
        return { selector: normalized, type };
      }
    }
  }

  // No semantic selector found. Collect fallback candidates (CSS, XPath, etc.)
  // and return the first available one marked as fallback.
  const fallbackMap = {
    css: candidates.css || candidates.cssPath,
    xpath: candidates.xpath || candidates.text,
    dataAttribute: candidates.dataAttribute,
    testId: candidates.testId,
  };

  for (const candidate of Object.values(fallbackMap)) {
    if (candidate && candidate.trim()) {
      return { selector: candidate.trim(), type: "fallback" };
    }
  }

  // No suitable selector found at all.
  return {
    selector: "",
    type: "unknown",
  };
}
