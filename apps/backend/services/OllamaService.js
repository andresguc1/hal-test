import aiService from './AIService.js';

/**
 * OllamaService - Specialized for Playwright Locator Generation
 *
 * Uses local Ollama to analyze fragile selectors and DOM context,
 * then generates the most robust Playwright locator possible.
 *
 * Locator priority:
 * 1. getByRole()
 * 2. getByLabel()
 * 3. getByPlaceholder()
 * 4. getByText()
 * 5. getByTestId()
 * 6. locator() with stable attributes
 * 7. CSS selector
 * 8. XPath (absolute last resort)
 */
class OllamaService {
    /**
     * Generates a robust Playwright locator using local AI.
     *
     * @param {string} selector - The raw selector picked by the inspector.
     * @param {string} htmlContext - A snippet of the surrounding DOM.
     * @returns {Promise<{
     *   locator: string,
     *   locatorType: string,
     *   confidence: number,
     *   isUnique: boolean,
     *   isStable: boolean,
     *   reasoning: string
     * }>}
     */
    async sanitizeSelector(selector, htmlContext) {
        try {
            console.log(`[OllamaService] Analyzing locator: ${selector}`);

            const prompt = `
You are a Senior Test Automation Engineer specialized in Playwright.

Your task is to analyze the provided raw selector and DOM context and generate the MOST ROBUST, STABLE, READABLE and MAINTAINABLE Playwright locator for the target element.

IMPORTANT:
The goal is NOT to clean or shorten the existing selector.

The goal is to REPLACE the raw selector with the best possible Playwright locator based on the DOM.

Raw Selector:
"${selector}"

DOM Context:
\`\`\`html
${htmlContext || 'No context available'}
\`\`\`

==================================================
PLAYWRIGHT LOCATOR PRIORITY
==================================================

You MUST evaluate locators in this exact order:

1. page.getByRole()
2. page.getByLabel()
3. page.getByPlaceholder()
4. page.getByText()
5. page.getByTestId()
6. page.locator() using stable attributes
7. Short CSS selectors
8. XPath ONLY as an absolute last resort

The existing selector must NOT influence the result if a better Playwright locator can be derived from the DOM.

==================================================
1. ROLE LOCATORS — HIGHEST PRIORITY
==================================================

Prefer:

page.getByRole()

Examples:

page.getByRole('button', { name: 'Login' })
page.getByRole('textbox', { name: 'Username' })
page.getByRole('link', { name: 'Products' })
page.getByRole('checkbox', { name: 'Remember me' })

Use accessible names whenever available.

For inputs, buttons, links, checkboxes, radio buttons, headings and other accessible elements, ALWAYS evaluate getByRole first.

==================================================
2. LABEL LOCATORS
==================================================

For form controls associated with a visible label:

page.getByLabel()

Example:

page.getByLabel('Username')

Prefer this over:

input[name="username"]
#username
CSS paths
XPath

==================================================
3. PLACEHOLDER LOCATORS
==================================================

If a meaningful and stable placeholder exists:

page.getByPlaceholder()

Example:

page.getByPlaceholder('Enter username')

==================================================
4. TEXT LOCATORS
==================================================

For elements whose visible text uniquely identifies them:

page.getByText()

Example:

page.getByText('Submit Order')

Do NOT use text if it is dynamic, duplicated or unstable.

==================================================
5. TEST ID LOCATORS
==================================================

If a stable test identifier exists:

page.getByTestId()

Examples:

page.getByTestId('login-button')
page.getByTestId('checkout-form')

Prefer test IDs over CSS classes, XPath or DOM hierarchy.

==================================================
6. STABLE ATTRIBUTE LOCATORS
==================================================

If semantic Playwright locators are not possible, use:

page.locator()

Prefer stable attributes such as:

[name]
[aria-label]
[data-testid]
[data-test]
[data-cy]
[data-qa]

Examples:

page.locator('[name="email"]')
page.locator('[aria-label="Search"]')

Only use attributes that appear stable and meaningful.

==================================================
7. CSS SELECTORS
==================================================

Use CSS ONLY when better Playwright locators are not available.

Prefer short selectors:

page.locator('#username')
page.locator('input[name="username"]')

Avoid:

- long CSS chains
- deeply nested selectors
- nth-child()
- nth-of-type()
- layout-dependent selectors
- unnecessary parent-child traversal

==================================================
8. XPATH — ABSOLUTE LAST RESORT
==================================================

XPath should ONLY be used when no robust Playwright locator or stable CSS locator can uniquely identify the element.

NEVER use XPath based on DOM hierarchy when a better locator exists.

BAD:

//div/div[2]/form/div[1]/input
/html/body/div[2]/div[1]/form/input

If XPath is unavoidable, prefer attribute-based XPath.

==================================================
FORBIDDEN / FRAGILE PATTERNS
==================================================

Avoid:

- long CSS paths
- deeply nested selectors
- XPath based on DOM hierarchy
- nth-child()
- nth-of-type()
- arbitrary numeric indexes
- generated/random IDs
- React/Vue/Angular generated classes
- dynamically generated class names
- styling-only classes
- selectors dependent on page layout
- unnecessary DOM traversal

BAD:

#app > div > div:nth-child(2) > form > div:nth-child(1) > input

BAD:

body > div:nth-child(3) > div > form > input

BAD:

//div[2]/form/div[1]/input

BAD:

input.css-1a2b3c

==================================================
DYNAMIC IDS
==================================================

Do NOT use IDs that appear dynamically generated.

Examples:

#input-849302
#react-select-5-input
#element-173829
#\\:r1\\:

Stable IDs are acceptable:

#username
#login-button
#search

Only use an ID when it appears intentionally defined and stable.

==================================================
UNIQUENESS
==================================================

The locator should identify exactly ONE intended element.

If multiple elements could match, improve the locator using:

1. accessible name
2. label
3. test ID
4. stable attribute
5. meaningful parent-child relationship

Do NOT blindly add:

.nth(0)
.nth(1)

Only use nth() when there is genuinely no stable alternative.

==================================================
IMPORTANT EXAMPLE
==================================================

Raw selector:

#loginPanel > form > div:nth-child(2) > input:nth-child(1)

DOM:

<input
    name="username"
    aria-label="Username"
    type="text"
/>

Expected locator:

page.getByRole('textbox', { name: 'Username' })

NOT:

page.locator('#loginPanel > form > div:nth-child(2) > input:nth-child(1)')

The purpose is to identify the element semantically, not to preserve the original selector.

==================================================
LOCATOR QUALITY
==================================================

Evaluate every candidate based on:

- Semantic meaning
- Uniqueness
- Stability
- Readability
- Maintainability
- Resistance to DOM changes
- Resistance to CSS changes
- Resistance to dynamic values

Choose the locator with the highest reliability.

==================================================
CONFIDENCE
==================================================

Return a value between 0 and 1.

1.0 = highly stable, semantic and unique locator
0.9-0.99 = very strong locator
0.75-0.89 = acceptable locator
0.50-0.74 = weak locator
<0.50 = unreliable or insufficient DOM information

==================================================
FINAL VALIDATION
==================================================

Before returning the result, verify:

1. Can getByRole() identify the element?
2. If not, can getByLabel() identify it?
3. If not, can getByPlaceholder() identify it?
4. If not, can getByText() identify it?
5. If not, can getByTestId() identify it?
6. If not, is there a stable attribute?
7. Only then use page.locator() with CSS.
8. Use XPath only as the final fallback.

NEVER prefer XPath or a long CSS selector when a Playwright semantic locator can be derived from the DOM.

==================================================
OUTPUT REQUIREMENTS
==================================================

Return ONLY valid JSON.

Do not return markdown.
Do not return code fences.
Do not return explanations outside the JSON.

Expected format:

{
    "locator": "page.getByRole('button', { name: 'Login' })",
    "locatorType": "getByRole",
    "confidence": 0.98,
    "isUnique": true,
    "isStable": true,
    "reasoning": "The button has a stable accessible name and can be identified using Playwright's semantic role locator."
}

The "locator" field MUST contain the complete Playwright expression.

DO NOT return:

"button[name='login']"

when the correct result is:

"page.getByRole('button', { name: 'Login' })"
`;

            // Local AI is intentionally used here because locator generation
            // should be deterministic and low-temperature.
            const response = await aiService.generateText({
                prompt,
                taskType: 'local',
                provider: 'ollama',
                temperature: 0.1,
            });

            const text = response?.text || '';

            // Remove markdown code fences if the model returns them
            const cleanedText = text
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                console.warn('[OllamaService] AI returned an invalid JSON response');

                return this.createFallback(selector, 'Failed to parse AI output');
            }

            let parsed;

            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.warn('[OllamaService] Failed to parse AI JSON:', parseError.message);

                return this.createFallback(selector, 'Invalid JSON returned by AI');
            }

            const locator = parsed.locator || parsed.sanitizedSelector;

            if (!locator || typeof locator !== 'string') {
                return this.createFallback(
                    selector,
                    'AI did not return a valid Playwright locator',
                );
            }

            const confidence =
                typeof parsed.confidence === 'number'
                    ? Math.max(0, Math.min(1, parsed.confidence))
                    : 0.5;

            console.log(
                `[OllamaService] Generated locator: ${locator} ` +
                    `(type: ${parsed.locatorType || 'unknown'}, confidence: ${confidence})`,
            );

            return {
                // New preferred property
                locator,

                // Keep backward compatibility with existing consumers
                sanitizedSelector: locator,

                locatorType: parsed.locatorType || this.detectLocatorType(locator),
                confidence,
                isUnique: parsed.isUnique !== false,
                isStable: parsed.isStable !== false,
                reasoning: parsed.reasoning || 'AI generated Playwright locator',
            };
        } catch (error) {
            console.warn(
                '[OllamaService] Locator generation failed, falling back to raw selector:',
                error.message,
            );

            return this.createFallback(selector, error.message);
        }
    }

    /**
     * Detects the Playwright locator type from the generated expression.
     *
     * @param {string} locator
     * @returns {string}
     */
    detectLocatorType(locator) {
        if (locator.includes('.getByRole(')) return 'getByRole';
        if (locator.includes('.getByLabel(')) return 'getByLabel';
        if (locator.includes('.getByPlaceholder(')) return 'getByPlaceholder';
        if (locator.includes('.getByText(')) return 'getByText';
        if (locator.includes('.getByTestId(')) return 'getByTestId';
        if (locator.includes('.getByAltText(')) return 'getByAltText';
        if (locator.includes('.getByTitle(')) return 'getByTitle';
        if (locator.includes('.locator(')) return 'locator';
        if (locator.includes('xpath=')) return 'xpath';

        return 'unknown';
    }

    /**
     * Fallback response when AI cannot generate a locator.
     *
     * @param {string} selector
     * @param {string} reasoning
     * @returns {object}
     */
    createFallback(selector, reasoning) {
        return {
            locator: selector,
            sanitizedSelector: selector,
            locatorType: 'fallback',
            confidence: 0,
            isUnique: false,
            isStable: false,
            reasoning,
        };
    }
}

export default new OllamaService();
