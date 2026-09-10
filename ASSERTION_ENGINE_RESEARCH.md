# HalTest Assertion Engine — Technical Research & Architecture Proposal

> **Status:** Research Complete — Ready for Review
> **Date:** 2026-09-10
> **Scope:** DOM Assertion Capabilities, ISTQB/ISO 29119 Alignment, Architecture Proposal

---

## Table of Contents

1. [A. Current Architecture](#a-current-architecture)
2. [B. Existing Assertions](#b-existing-assertions)
3. [C. Gaps Analysis](#c-gaps-analysis)
4. [D. UX Problems](#d-ux-problems)
5. [E. Architectural Alternatives](#e-architectural-alternatives)
6. [F. Recommended Architecture](#f-recommended-architecture)
7. [G. Data Model](#g-data-model)
8. [H. Execution Model](#h-execution-model)
9. [I. Playwright Mapping](#i-playwright-mapping)
10. [J. Auto-Healing Integration](#j-auto-healing-integration)
11. [K. Dynamic Content](#k-dynamic-content)
12. [L. UX Design](#l-ux-design)
13. [M. Backward Compatibility](#m-backward-compatibility)
14. [N. Performance](#n-performance)
15. [O. Testing Strategy](#o-testing-strategy)
16. [P. Implementation Plan](#p-implementation-plan)

---

## A. Current Architecture

### A.1 Monorepo Structure

HalTest is a Turborepo monorepo with 4 apps:

```
halt-test-monorepo/
├── apps/frontend/    → React Flow visual editor (Vite + React)
├── apps/backend/     → Node.js execution engine (Express + Playwright)
├── apps/web/         → Marketing site
└── apps/cli/         → CLI runner
```

### A.2 Node Architecture (5-Layer Model)

Every node in HalTest follows a 5-layer architecture:

```
Layer 1: Frontend Registration     → nodeConstants.js (NODE_CATEGORIES, NODE_TYPE_MAP)
Layer 2: Frontend Configuration    → validationRules.js (NODE_INPUTS schema per type)
Layer 3: Backend Plugin Bootstrap  → pluginBootstrap.js (handler + schema registration)
Layer 4: Backend Execution         → ActionExecutor.js (Playwright wrapper + lifecycle)
Layer 5: Code Generation           → exporter/nodes/*.js (mapper per node type)
```

**Key files:**

| Layer | File | Purpose |
|-------|------|---------|
| 1 | `apps/frontend/src/config/nodeConstants.js` | Categories, colors, icons, labels |
| 2 | `apps/frontend/src/config/validationRules.js` | INPUTS schema per node type |
| 3 | `apps/backend/core/pluginBootstrap.js` | Handler + schema registration |
| 4 | `apps/backend/core/ActionExecutor.js` | Playwright execution wrapper |
| 5 | `apps/backend/services/exporter/nodes/*.js` | Code generation mappers |

### A.3 Plugin System

Each node type lives in a plugin under `apps/backend/plugins/`:

```
plugins/
├── core-assertion/      → assert_page_text (THE ONLY assertion node)
├── core-interaction/    → click, type_text, find_element, get_set_content, etc.
├── core-browser/        → launch_browser, browser_dialog, manage_tabs, etc.
├── core-wait/           → wait_for_element, wait_visible, wait_conditional, etc.
├── core-ai/             → validate_semantic, call_llm, etc.
├── core-flow-control/   → conditional, switch, loop, etc.
├── core-capture/        → take_screenshot, save_dom, etc.
├── core-network/        → mock_response, intercept_request, etc.
├── core-security/       → audit_policy, sensitive_data_monitor, etc.
├── core-session/        → manage_session, create_context, etc.
├── core-data/           → read_file, write_file, etc.
├── core-testing/        → run_tests, cli_params, etc.
└── core-navigation/     → open_url, go_back, etc.
```

Each plugin has:
```
plugin-name/
├── manifest.json          → Node type definitions
├── handlers/*.js          → Playwright execution logic
└── schemas/*.js           → Joi validation schemas
```

### A.4 Execution Pipeline

```
Frontend (React Flow canvas)
    ↓ User clicks "Run"
    ↓ POST /api/execution/run
    ↓
ExecutionService.executeFlow()
    ↓ Load flow from SQLite/CRDT
    ↓ Validate graph (validateGraph)
    ↓ BFS traversal from root nodes
    ↓ For each node:
        ↓ ExecutionManager.execute()
        ↓ variableManager.resolve() → resolve {{variables}}
        ↓ selector-utils resolveSelectors()
        ↓ ActionExecutor.executePlaywrightAction()
            ↓ Get active Playwright page
            ↓ Capture DOM before (for auto-healing)
            ↓ Execute handler(page, opts)
            ↓ Log step (executionLogger)
            ↓ Capture screenshot (optional)
            ↓ Emit socket events (status, logs)
            ↓ Handle auto-healing on failure
    ↓
    ↓ emitFlowFinished()
```

### A.5 DOM Category — Current Nodes

The `dom_manipulation` category (color: `cyan`) currently contains:

| Node | Backend Category | Purpose |
|------|-----------------|---------|
| `find_element` | `element` | Find element by selector, returns `found`/`visible` |
| `get_set_content` | `element` | Get/set text, HTML, value, or attribute |
| `execute_js` | `code` | Execute arbitrary JavaScript in page context |
| `wait_for_element` | `wait_timing` | Wait for visible/hidden/attached/detached |
| `wait_visible` | `wait_timing` | Wait for element visibility |
| `assert_page_text` | `assertion` | Assert page contains specific text |

The `llm_ai` category also has assertion-like nodes:

| Node | Purpose |
|------|---------|
| `validate_semantic` | AI-powered content validation (boolean result) |
| `extract_dom_context` | Extract DOM content for AI processing |

The `browser_management` category has:

| Node | Purpose |
|------|---------|
| `browser_dialog` | Handle alert/confirm/prompt with optional text assertion |

---

## B. Existing Assertions — Complete Inventory

### B.1 Explicit Assertion Nodes

**Only 1 explicit assertion node exists: `assert_page_text`**

| Capability | Supported | Implementation |
|------------|-----------|----------------|
| Page text contains | ✅ | `page.waitForFunction()` on `document.body.innerText` |
| Page text exact match | ✅ | `matchType: 'exact'` |
| Page text regex | ✅ | `matchType: 'regex'` |
| Case sensitive option | ✅ | `caseSensitive: true/false` |
| Timeout | ✅ | Configurable (default 5000ms) |
| Soft fail | ✅ | `continueOnError` |

**Limitations:**
- Only checks `document.body.innerText` (full page text)
- No selector-based text assertion
- No element-level assertions
- No visibility/state/attribute assertions
- No collection/count assertions

### B.2 Implicit Assertion Capabilities (Existing Nodes)

| Node | Assertion Capability | How |
|------|---------------------|-----|
| `find_element` | Element existence | Returns `found: true/false`, `visible: true/false` |
| `find_element` | Element visibility | Returns `visible` state |
| `wait_for_element` | Wait + implicit assertion | Throws on timeout = assertion failure |
| `wait_visible` | Visibility assertion | Throws on timeout |
| `browser_dialog` | Dialog text matching | `expectText`, `matchType`, `caseSensitive` |
| `validate_semantic` | AI semantic validation | LLM-powered boolean validation |
| `get_set_content` | Content retrieval | Gets text/HTML/value/attribute (no assertion) |
| `execute_js` | Custom assertions | User writes JS that throws on failure |

### B.3 Flow-Level Conditional Logic

| Node | Capability |
|------|-----------|
| `conditional` | AND/OR conditions using `ConditionEvaluator` |
| `switch` | Case-based branching with operators: `===`, `contains`, `startsWith`, `endsWith`, `regex` |
| `fail_flow` | Explicit flow failure with custom message |

### B.4 ConditionEvaluator Operators

The `ConditionEvaluator` (core/ConditionEvaluator.js) supports:

| Operator | Type | Description |
|----------|------|-------------|
| `===` / `==` | Equality | Loose equality |
| `!==` / `!=` | Inequality | Loose inequality |
| `>` | Numeric | Greater than |
| `<` | Numeric | Less than |
| `>=` | Numeric | Greater or equal |
| `<=` | Numeric | Less or equal |
| `contains` | String | Substring match |
| `exists` | Variable | Variable exists check |

**Type coercion** (core/compare.js):
- Numeric strings → numbers
- Boolean-like strings (`"true"`, `"success"`) → booleans

### B.5 Code Generation — AssertionMapper

The `AssertionMapper` already supports these assertion types in code generation:

| Assertion Type | Playwright JS | Cypress | Selenium |
|---------------|---------------|---------|----------|
| `text_equals` | `toHaveText()` | `have.text` | `assertEquals(text)` |
| `text_contains` | `toContainText()` | `contain` | `assertIn(text)` |
| `visible` | `toBeVisible()` | `be.visible` | `isDisplayed()` |
| `hidden` | `toBeHidden()` | `not.be.visible` | `!isDisplayed()` |
| `enabled` | `toBeEnabled()` | `be.enabled` | `isEnabled()` |
| `disabled` | `toBeDisabled()` | `be.disabled` | `!isEnabled()` |
| `has_attribute` | `toHaveAttribute()` | `have.attr` | `getAttribute()` |
| `url_contains` | `toHaveURL()` | `url().include` | `current_url` |
| `title_contains` | `toHaveTitle()` | `title().include` | `getTitle()` |
| `assert_page_text` | `toContainText(body)` | `contains(text)` | `assertIn(text, page_source)` |

**Critical insight:** The `AssertionMapper` already knows how to generate Playwright code for many assertion types, but there is NO corresponding node or handler that allows users to configure these assertions through the UI. The code generation supports types like `visible`, `hidden`, `enabled`, `disabled`, `has_attribute`, `url_contains`, `title_contains` — but none of these are exposed as configurable nodes.

### B.6 ISTQB / ISO 29119 Assertion Coverage

Mapping HalTest capabilities to ISTQB certification assertion categories:

| ISTQB Category | HalTest Support | Status |
|---------------|----------------|--------|
| **Test Oracle Problem** | | |
| Explicit oracle (expected value) | `assert_page_text` | ⚠️ Partial |
| Implicit oracle (no crash) | `wait_for_element` timeout | ✅ |
| **Assertion Types per ISO 29119-4** | | |
| Existence assertion | `find_element` (found) | ⚠️ Not as assertion |
| State assertion | None | ❌ Missing |
| Value assertion | `assert_page_text` (text only) | ⚠️ Limited |
| Structural assertion | None | ❌ Missing |
| Behavioral assertion | `validate_semantic` (AI) | ⚠️ AI-dependent |
| **Verification Techniques** | | |
| Functional correctness | None | ❌ Missing |
| Boundary value analysis | None (manual JS) | ❌ Missing |
| Equivalence partitioning | None | ❌ Missing |
| **Test Types (ISTQB)** | | |
| Smoke test assertions | None | ❌ Missing |
| Regression assertions | None | ❌ Missing |
| Visual assertions | `take_screenshot` (manual) | ⚠️ No comparison |
| **Assertion Severity (ISO 29119)** | | |
| Hard assertion (abort) | Default behavior | ✅ |
| Soft assertion (collect) | `continueOnError` | ⚠️ Per-node only |
| **Dynamic Content** | | |
| Wait-and-assert pattern | `wait_for_element` → manual chain | ⚠️ Manual |
| Polling assertion | None | ❌ Missing |
| **Collection Assertions** | | |
| Count assertion | None | ❌ Missing |
| All-match assertion | None | ❌ Missing |
| Any-match assertion | None | ❌ Missing |
| None-match assertion | None | ❌ Missing |
| **Page-Level Assertions** | | |
| URL assertion | None | ❌ Missing |
| Title assertion | None | ❌ Missing |
| Cookie assertion | `manage_cookies` (no assertion) | ❌ Missing |
| Local storage assertion | `manage_storage` (no assertion) | ❌ Missing |

---

## C. Gaps Analysis

### C.1 Critical Gaps (No Workaround)

| Gap | Description | Impact |
|-----|-------------|--------|
| **Element-level assertions** | Cannot assert visibility, state, text, or attributes of a specific element | Core functionality missing |
| **Collection assertions** | Cannot count elements or assert conditions on collections | Cannot validate lists, tables, grids |
| **URL/Title assertions** | Cannot assert page URL or title | Basic navigation validation impossible |
| **State assertions** | Cannot assert enabled/disabled/checked/selected | Form validation impossible |
| **Attribute assertions** | Cannot assert attribute values | Data-driven validation impossible |
| **Value assertions** | Cannot assert input field values | Form verification impossible |
| **Soft assertions** | No mechanism to collect multiple failures before reporting | UX issue |

### C.2 Gaps with Workarounds

| Gap | Current Workaround | Problem |
|-----|-------------------|---------|
| Element existence | `find_element` + `conditional` | 2+ nodes needed |
| Element visibility | `wait_visible` + check result | Not a true assertion |
| Text content | `get_set_content` → `conditional` | Manual comparison |
| Count elements | `execute_js` → manual DOM query | Requires coding |
| Dynamic content | `wait_for_element` → manual chain | Timing issues |

### C.3 Gaps with No Path Forward

| Gap | Description |
|-----|-------------|
| Auto-suggested assertions | No UI mechanism to suggest assertions based on element type |
| Assertion templates | No reusable assertion sets |
| Grouped assertions | No way to batch multiple assertions in one node |
| Element-vs-element comparison | No cross-element assertion |
| Visual regression | No pixel comparison |
| Performance assertions | No load time / render time assertions |

---

## D. UX Problems

### D.1 Node Proliferation

To validate a simple form after filling it, the user needs:

```
[fill_form]
    ↓
[find_element] → "Element exists?"
    ↓
[conditional] → Branch on found
    ↓
[wait_visible] → "Element visible?"
    ↓
[get_set_content] → Get text
    ↓
[variable] → Store text
    ↓
[conditional] → Compare text
```

**6 nodes** for what should be **1 assertion node**.

### D.2 Dynamic Content Example

For the Dynamic Content page scenario:

```
[open_url] → Navigate
    ↓
[execute_js] → Count .row elements (manual JS)
    ↓
[variable] → Store count
    ↓
[conditional] → Assert count === 3
    ↓
[get_set_content] → Get first image src
    ↓
[variable] → Store src
    ↓
[conditional] → Assert src not empty
    ↓
[get_set_content] → Get text
    ↓
[variable] → Store text
    ↓
[conditional] → Assert text not empty
```

**9 nodes** for what should be **3-4 assertion nodes**.

### D.3 Developer Expectations

A user familiar with Playwright expects:

```javascript
await expect(page.locator('.row')).toHaveCount(3);
await expect(page.locator('.row img')).toBeVisible();
await expect(page.locator('.row p')).not.toHaveText('');
```

This maps to **3 assertions**. In HalTest, it requires **9+ nodes**.

---

## E. Architectural Alternatives

### E.1 Alternative A — Reuse Existing Nodes

**Strategy:** Chain `find_element` + `get_set_content` + `conditional` for every assertion.

**Advantages:**
- Zero new code
- No architecture changes

**Disadvantages:**
- 3-6x node count per assertion
- No structured assertion results
- No ISTQB-compliant reporting
- No auto-healing on assertion selectors
- No soft assertion support
- Poor UX

**Verdict:** ❌ Rejected — Does not solve the fundamental problem.

---

### E.2 Alternative B — Multiple Specialized Assertion Nodes

**Strategy:** Create one node per assertion type:

```
assert_exists
assert_visible
assert_text
assert_attribute
assert_value
assert_count
assert_enabled
assert_checked
assert_url
assert_title
```

**Advantages:**
- Each node is simple
- Clear purpose per node

**Disadvantages:**
- 10+ new nodes in the DOM category
- Each needs: registration, configuration UI, handler, schema, mapper, simulator
- Maintenance overhead scales linearly
- No compound assertions without chaining
- ISTQB coverage requires even more nodes (soft, grouped, conditional)
- Violates HalTest's philosophy of minimal, composable nodes

**Verdict:** ❌ Rejected — Creates node proliferation problem.

---

### E.3 Alternative C — Generic Configurable Assertion Node

**Strategy:** Single `assert_element` node with dynamic configuration:

```json
{
  "type": "assert_element",
  "config": {
    "target": ".row",
    "assertions": [
      { "type": "count", "operator": "equals", "expected": "3" },
      { "type": "visible", "expected": "true" }
    ]
  }
}
```

**Advantages:**
- Single node covers all assertion types
- Compound assertions in one node
- Clean UX

**Disadvantages:**
- Complex configuration UI
- All-or-nothing execution (one failure stops all)
- Hard to visualize which assertions passed/failed
- Dynamic form rendering complexity

**Verdict:** ⚠️ Partially — Good concept but needs refinement.

---

### E.4 Alternative D — Assertion Engine Pattern (Recommended)

**Strategy:** Single `assert` node with:

1. **Declarative data model** (configuration as data)
2. **Assertion Engine** (backend) that interprets the data model
3. **Dynamic UI** that renders based on assertion type
4. **Rich Playwright mapping** that translates to native assertions
5. **Structured results** for reporting
6. **Auto-healing integration** per assertion
7. **Soft assertion mode** for collecting multiple failures

```
[assert] → AssertionNode (React component)
    ↓ configuration data
AssertionEngine.evaluate(page, config)
    ↓
AssertionStrategy[config.type].execute(page, config)
    ↓
Playwright native assertion
    ↓
AssertionResult { success, actual, expected, message, screenshot }
```

**Advantages:**
- Single node with maximum flexibility
- Extensible via strategy pattern
- Clean separation: UI → Data → Engine → Playwright
- Supports compound assertions
- ISTQB-compliant reporting
- Auto-healing per assertion
- Soft assertion support
- Future-proof

**Disadvantages:**
- Higher initial implementation complexity
- Requires new frontend component for dynamic configuration

**Verdict:** ✅ **Recommended**

---

## F. Recommended Architecture

### F.1 Why Assertion Engine

The `AssertionMapper` already demonstrates that HalTest's code generation layer knows about 10+ assertion types. The problem is there is no corresponding **runtime node** that allows users to configure these assertions through the UI.

An Assertion Engine bridges this gap by:

1. Providing a single entry point (`assert` node)
2. Using a strategy pattern for assertion types
3. Keeping the data model declarative
4. Leveraging Playwright's native `expect()` API
5. Producing structured, ISTQB-compliant results

### F.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AssertNode.jsx                       │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  TargetSection                               │ │   │
│  │  │  - Selector input (with picker)             │ │   │
│  │  │  - Scope: element / collection / page       │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  AssertionSection (dynamic)                  │ │   │
│  │  │  - Type selector (dropdown)                 │ │   │
│  │  │  - Operator (depends on type)               │ │   │
│  │  │  - Expected value (depends on type)         │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  OptionsSection                              │ │   │
│  │  │  - Timeout                                   │ │   │
│  │  │  - Soft fail toggle                          │ │   │
│  │  │  - Screenshot on failure                     │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
                    POST /api/actions/assert
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Backend (Node.js)                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         assert.handler.js                         │   │
│  │  - Receives declarative config                    │   │
│  │  - Resolves variables                             │   │
│  │  - Delegates to AssertionEngine                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         AssertionEngine.js                        │   │
│  │  - Interprets assertion config                    │   │
│  │  - Resolves target (element / collection / page)  │   │
│  │  - Dispatches to appropriate strategy             │   │
│  │  - Collects results                               │   │
│  │  - Handles soft/hard assertion mode               │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         AssertionStrategies/                      │   │
│  │  - ExistenceStrategy  (exists / not exists)       │   │
│  │  - VisibilityStrategy (visible / hidden)          │   │
│  │  - TextStrategy       (equals / contains / regex) │   │
│  │  - AttributeStrategy  (exists / equals / contains)│   │
│  │  - ValueStrategy      (equals / contains / empty)  │   │
│  │  - StateStrategy      (enabled/checked/selected)  │   │
│  │  - CountStrategy      (equals / gt / lt / between) │   │
│  │  - CollectionStrategy (all / any / none match)     │   │
│  │  - PageStrategy       (URL / title)                │   │
│  │  - CSSPropertyStrategy (class / id / role)         │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         Playwright Native Assertions              │   │
│  │  expect(locator).toBeVisible()                    │   │
│  │  expect(locator).toHaveText(...)                  │   │
│  │  expect(locator).toHaveCount(n)                   │   │
│  │  expect(locator).toHaveAttribute(...)             │   │
│  │  expect(page).toHaveURL(...)                      │   │
│  │  expect(page).toHaveTitle(...)                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### F.3 Plugin Structure

```
plugins/
└── core-assertion/
    ├── manifest.json
    ├── handlers/
    │   └── assert.handler.js
    ├── schemas/
    │   └── assert.schema.js
    ├── engine/
    │   ├── AssertionEngine.js
    │   └── strategies/
    │       ├── ExistenceStrategy.js
    │       ├── VisibilityStrategy.js
    │       ├── TextStrategy.js
    │       ├── AttributeStrategy.js
    │       ├── ValueStrategy.js
    │       ├── StateStrategy.js
    │       ├── CountStrategy.js
    │       ├── CollectionStrategy.js
    │       ├── PageStrategy.js
    │       └── CSSPropertyStrategy.js
    └── constants.js
```

---

## G. Data Model

### G.1 Assertion Configuration Schema

```javascript
// Declarative assertion configuration — stored as node.data.configuration
{
  // Target specification
  "target": {
    "selector": ".row",           // CSS selector (required for element/collection)
    "scope": "collection",        // "element" | "collection" | "page"
    "selectorType": "css"         // "css" | "text" | "role" | "xpath"
  },

  // Single assertion (simple mode)
  "assertion": {
    "type": "count",              // Strategy key
    "operator": "equals",         // Operator within strategy
    "expected": "3",              // Expected value (always string, strategy parses)
    "attribute": null,            // For attribute assertions
    "caseSensitive": false,       // For text assertions
    "regex": false                // For text assertions
  },

  // OR: Multiple assertions (compound mode)
  "assertions": [
    {
      "type": "count",
      "operator": "equals",
      "expected": "3"
    },
    {
      "type": "visibility",
      "operator": "all",
      "expected": "visible"
    }
  ],

  // Options
  "timeout": 5000,
  "softFail": false,              // Continue on failure
  "takeScreenshotOnFailure": true
}
```

### G.2 Assertion Result Schema

```javascript
// Returned by AssertionEngine after execution
{
  "success": false,
  "assertions": [
    {
      "type": "count",
      "operator": "equals",
      "expected": 3,
      "actual": 2,
      "passed": false,
      "message": "Expected 3 elements but found 2",
      "locator": ".row"
    },
    {
      "type": "visibility",
      "operator": "all",
      "expected": "visible",
      "actual": "2 of 2 visible",
      "passed": true,
      "message": "All elements visible",
      "locator": ".row"
    }
  ],
  "summary": {
    "total": 2,
    "passed": 1,
    "failed": 1
  },
  "screenshot": "storage/runs/{runId}/{nodeId}.png"
}
```

### G.3 Node Output Schema (NODE_OUTPUTS)

```javascript
assert: {
  success: "boolean",
  passed: "number",
  failed: "number",
  total: "number",
  results: "array",       // Array of per-assertion results
  screenshot: "string",   // Screenshot path on failure
}
```

---

## H. Execution Model

### H.1 Handler Flow

```javascript
// assert.handler.js (simplified)
const assertAction = (req, res) =>
  executePlaywrightAction(req, res, 'assert', async (page, opts) => {
    const { target, assertion, assertions, timeout, softFail } = opts;

    // 1. Resolve target locator
    const locator = resolveTarget(page, target);

    // 2. Determine assertion mode
    const assertionList = assertions || [assertion];

    // 3. Execute assertions
    const engine = new AssertionEngine();
    const results = await engine.evaluate(locator, page, assertionList, {
      timeout,
      softFail
    });

    // 4. Handle results
    if (!results.success && !softFail) {
      throw new AssertionError(results);
    }

    return {
      message: formatMessage(results),
      data: results,
      traceDetails: {
        target: target.selector,
        assertions: assertionList.map(a => a.type),
        passed: results.summary.passed,
        failed: results.summary.failed,
      }
    };
  });
```

### H.2 Strategy Execution

```javascript
// AssertionEngine.js (simplified)
class AssertionEngine {
  async evaluate(locator, page, assertions, options) {
    const results = [];
    let allPassed = true;

    for (const assertion of assertions) {
      const strategy = this.getStrategy(assertion.type);
      const result = await strategy.execute(locator, page, assertion, options);
      results.push(result);

      if (!result.passed) {
        allPassed = false;
        if (!options.softFail) break; // Hard assertion: stop on first failure
      }
    }

    return {
      success: allPassed,
      assertions: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
      }
    };
  }

  getStrategy(type) {
    const strategies = {
      existence: ExistenceStrategy,
      visibility: VisibilityStrategy,
      text: TextStrategy,
      attribute: AttributeStrategy,
      value: ValueStrategy,
      state: StateStrategy,
      count: CountStrategy,
      collection: CollectionStrategy,
      page: PageStrategy,
      cssProperty: CSSPropertyStrategy,
    };
    return strategies[type];
  }
}
```

### H.3 Auto-Healing Integration

The `ActionExecutor` already captures `simplifiedDOMBefore` for auto-healing. The assertion handler integrates the same way:

```javascript
// In assert.handler.js, before execution:
const locator = buildPlaywrightLocator(page, resolvedTarget.selector);

// Auto-healing is handled by ActionExecutor's existing flow:
// 1. DOM captured before action
// 2. If selector fails, SelectorHealer queries AI for alternative
// 3. If healed, assertion re-executes with new selector
// 4. Healing event emitted via socket
```

---

## I. Playwright Mapping

### I.1 Strategy → Playwright API Mapping

| Strategy | Operator | Playwright API |
|----------|----------|----------------|
| `existence` | `exists` | `locator.waitFor({ state: 'attached' })` |
| `existence` | `not_exists` | `locator.waitFor({ state: 'detached', timeout: short })` |
| `visibility` | `visible` | `expect(locator).toBeVisible()` |
| `visibility` | `hidden` | `expect(locator).toBeHidden()` |
| `text` | `equals` | `expect(locator).toHaveText(expected)` |
| `text` | `contains` | `expect(locator).toContainText(expected)` |
| `text` | `not_empty` | `expect(locator).not.toHaveText('')` |
| `text` | `regex` | `expect(locator).toHaveText(new RegExp(expected))` |
| `attribute` | `exists` | `expect(locator).toHaveAttribute(name, /.+/)` |
| `attribute` | `equals` | `expect(locator).toHaveAttribute(name, expected)` |
| `attribute` | `contains` | `expect(locator).toHaveAttribute(name, new RegExp(expected))` |
| `value` | `equals` | `expect(locator).toHaveValue(expected)` |
| `value` | `contains` | `expect(locator).toHaveValue(new RegExp(expected))` |
| `value` | `empty` | `expect(locator).toHaveValue('')` |
| `state` | `enabled` | `expect(locator).toBeEnabled()` |
| `state` | `disabled` | `expect(locator).toBeDisabled()` |
| `state` | `checked` | `expect(locator).toBeChecked()` |
| `state` | `unchecked` | `expect(locator).not.toBeChecked()` |
| `state` | `selected` | `expect(locator).toHaveValues([expected])` |
| `count` | `equals` | `expect(locator).toHaveCount(n)` |
| `count` | `gt` | `expect(locator).toHaveCount(> n)` via ` locator.count()` |
| `count` | `lt` | `expect(locator).toHaveCount(< n)` via `locator.count()` |
| `count` | `between` | `expect(locator).toHaveCount(>= min && <= max)` via `locator.count()` |
| `collection` | `all_visible` | `expect(locator).toBeVisible()` (all) |
| `collection` | `any_visible` | `locator.first().isVisible()` (any) |
| `collection` | `none_empty` | Loop + `expect(el).not.toHaveText('')` |
| `page` | `url_equals` | `expect(page).toHaveURL(expected)` |
| `page` | `url_contains` | `expect(page).toHaveURL(new RegExp(expected))` |
| `page` | `title_equals` | `expect(page).toHaveTitle(expected)` |
| `page` | `title_contains` | `expect(page).toHaveTitle(new RegExp(expected))` |
| `cssProperty` | `has_class` | `expect(locator).toHaveClass(new RegExp(expected))` |
| `cssProperty` | `has_id` | `expect(locator).toHaveId(expected)` |
| `cssProperty` | `has_role` | `expect(locator).toHaveAttribute('role', expected)` |

### I.2 Code Generation

The assertion node should reuse the existing `AssertionMapper` pattern:

```javascript
// For assert_page_text (existing):
await expect(page.locator('body')).toContainText('Welcome');

// For new assert node:
await expect(page.locator('.row')).toHaveCount(3);
await expect(page.locator('.row img')).toBeVisible();
await expect(page.locator('.row p')).not.toHaveText('');
await expect(page).toHaveURL(/dynamic_content/);
await expect(page.locator('#checkbox')).toBeChecked();
```

---

## J. Auto-Healing Integration

### J.1 How It Works Today

1. `ActionExecutor` captures `simplifiedDOMBefore` via `SelectorHealer.getCompressionScript()`
2. If the action fails with a selector error, the healing pipeline is triggered
3. `SelectorHealer` queries AI with the compressed DOM to find an alternative selector
4. If a valid candidate is found (confidence ≥ 0.5), the action re-executes
5. An `emitAutoHealingUpdate` event is sent to the frontend

### J.2 Assertion Integration

The assertion handler uses the same `ActionExecutor.executePlaywrightAction()` wrapper, so auto-healing is **automatically available** for assertion selectors. No additional work needed.

However, assertions have a nuance: if a selector fails because the element doesn't exist (intentional negative assertion), auto-healing should NOT trigger. The handler must distinguish between:

- **Selector broken** → Auto-heal (element should exist but locator is stale)
- **Element intentionally absent** → Assertion result (not an error)

Solution: The `ExistenceStrategy` with `not_exists` operator should NOT throw on failure — it should return a structured result. Only strategies that expect element presence should trigger healing.

### J.3 Healing Reporting

```
Assertion failed: Count
Target: .row
Expected: 3, Actual: 2

Auto-healing triggered:
  Original selector: .row
  Healed selector: .content .row
  Confidence: 0.87

Re-evaluating assertion with healed selector...
  Actual: 3 → PASS
```

---

## K. Dynamic Content — Case Study

### K.1 The Scenario

```text
URL: https://the-internet.herokuapp.com/dynamic_content?with_content=static

Steps:
1. Navigate to page
2. Assert 3 content blocks exist
3. Assert images exist and are visible
4. Assert text is not empty
5. Click "Click here" to refresh
6. Assert structure is still valid
```

### K.2 Current HalTest Approach (Without Assertion Engine)

```
[open_url]
    ↓
[execute_js] → return document.querySelectorAll('.row').length
    ↓
[variable] → name: blockCount, value: {{execute_js.result}}
    ↓
[conditional] → {{blockCount}} === 3
    ↓ (true branch)
[wait_visible] → .row img
    ↓
[get_set_content] → Get .row p text
    ↓
[variable] → name: textContent, value: {{get_set_content.value}}
    ↓
[conditional] → {{textContent}} !== ""
    ↓
[click] → Click here
    ↓
[execute_js] → Count .row again
    ↓
[variable] → name: blockCountAfter, value: {{execute_js.result}}
    ↓
[conditional] → {{blockCountAfter}} === 3
```

**11 nodes** for a 6-step validation.

### K.3 With Assertion Engine

```
[open_url]
    ↓
[assert] → Target: .row, Type: count, Operator: equals, Expected: 3
    ↓
[assert] → Target: .row img, Type: visibility, Operator: visible
    ↓
[assert] → Target: .row p, Type: text, Operator: not_empty
    ↓
[click] → Click here
    ↓
[assert] → Target: .row, Type: count, Operator: equals, Expected: 3
```

**5 nodes** (1 action + 4 assertions) — **55% reduction**.

Or even more compact with compound assertions:

```
[open_url]
    ↓
[assert] → Compound:
    - .row count = 3
    - .row img visible
    - .row p text not empty
    ↓
[click]
    ↓
[assert] → .row count = 3
```

**4 nodes** — **64% reduction**.

---

## L. UX Design

### L.1 Assert Node Configuration Panel

```
┌──────────────────────────────────────────────────┐
│  🔍 Assert                                  DOM  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Target                                          │
│  ┌──────────────────────────────────────────┐    │
│  │ [Selector: .row                    🔎 ]  │    │
│  │                                          │    │
│  │ Scope: ◉ Element  ○ Collection  ○ Page  │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Check                                           │
│  ┌──────────────────────────────────────────┐    │
│  │ [Number of elements              ▾ ]     │    │
│  │                                          │    │
│  │ [Equals                        ▾ ]       │    │
│  │                                          │    │
│  │ [3                               ]       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ☐ Add another check...                          │
│                                                  │
│  Options                                         │
│  ┌──────────────────────────────────────────┐    │
│  │ ⏱ Timeout (ms): [5000]                   │    │
│  │ 🛡 Soft fail:   ☐                         │    │
│  │ 📸 Screenshot:  ☑ on failure              │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│          [ Run ]  [ Test ]                        │
└──────────────────────────────────────────────────┘
```

### L.2 Dynamic Field Rendering

The configuration panel renders different fields based on the assertion type:

| Assertion Type | Fields Shown |
|---------------|-------------|
| `existence` | Target only (no operator/expected) |
| `visibility` | Target only (scope determines behavior) |
| `text` | Operator (equals/contains/not_empty/regex), Expected, CaseSensitive |
| `attribute` | Attribute name, Operator, Expected |
| `value` | Operator, Expected |
| `state` | State type (enabled/checked/selected) |
| `count` | Operator (equals/gt/lt/between), Expected (number) |
| `page` | Assertion type (URL/title), Operator, Expected |
| `cssProperty` | Property (class/id/role), Operator, Expected |

### L.3 Collection Scope Modes

When scope = `collection`:

```
Assert .row

Scope: Collection

Mode: [All elements satisfy ▾]

Check:
  [Visible ▾]

// Or:
Mode: [Count ▾]
Expected: [3]

// Or:
Mode: [Any element satisfies ▾]
Check:
  [Text contains "User"]

// Or:
Mode: [None satisfy ▾]
Check:
  [Text is empty]
```

### L.4 Inline Results

After execution, the node shows a compact summary:

```
┌──────────────────────────────────────────┐
│  ✅ Assert (2/3 passed)             DOM  │
├──────────────────────────────────────────┤
│  ✅ .row count = 3                       │
│  ✅ .row img visible                     │
│  ❌ .row p text not empty                │
│     Expected: non-empty text             │
│     Actual: ""                           │
│  📸 [View Screenshot]                    │
└──────────────────────────────────────────┘
```

---

## M. Backward Compatibility

### M.1 Existing Flows

| Concern | Impact | Mitigation |
|---------|--------|------------|
| `assert_page_text` in existing flows | Must continue working | Keep as-is; assertion engine is additive |
| `find_element` used for existence checks | Must continue working | Not modified |
| `validate_semantic` used for AI checks | Must continue working | Not modified |
| `browser_dialog` text matching | Must continue working | Not modified |
| Policy enforcer validation nodes | Must recognize `assert` | Add to `isValidationNode()` |

### M.2 No Migration Required

- The new `assert` node is **additive** — it does not replace any existing node
- `assert_page_text` remains available (it's simpler for basic text checks)
- Existing flows continue to work unchanged
- The `AssertionMapper` already handles `assert_page_text` in code generation

### M.3 Versioning

- Plugin version: `core-assertion` bumps from `1.0.0` → `2.0.0`
- No schema versioning needed — the new node is a new type
- Frontend `NODE_CATEGORIES.dom_manipulation.nodes` gains `assert`

### M.4 Policy Enforcer Update

```javascript
// policyEnforcer.js — isValidationNode()
const isValidationNode = (node) => {
  const type = node.type || node.data?.type;
  return (
    type === "validate_semantic" ||
    type === "run_tests" ||
    type === "find_element" ||
    type === "wait_visible" ||
    type === "wait_for_element" ||
    type === "wait_network_match" ||
    type === "wait_conditional" ||
    type === "assert" ||          // NEW
    type === "assert_page_text"   // EXISTING
  );
};
```

---

## N. Performance

### N.1 Risks

| Risk | Mitigation |
|------|-----------|
| Large collections (ALL visible) | Use Playwright's built-in auto-waiting; avoid manual loops |
| Multiple assertions per node | Execute sequentially; first failure exits (unless soft mode) |
| DOM queries | Use Playwright locators (lazy evaluation) |
| Screenshots per assertion | Only capture on failure, not per-assertion |
| Auto-healing per assertion | Cache healed selectors; limit retry count |

### N.2 Performance Guidelines

1. **Lazy Locators:** Playwright locators are lazy — they don't query DOM until action
2. **Batch Count:** `locator.count()` is a single DOM call
3. **No Redundant Queries:** Each assertion strategy queries only what it needs
4. **Soft Assertion Batching:** In soft mode, collect all results before reporting
5. **Timeout Per Node:** Default 30s timeout per assert node (configurable)
6. **Screenshot:** Only on failure, single screenshot per node (not per-assertion)

### N.3 Expected Performance

| Scenario | Expected Time |
|----------|--------------|
| Single assertion (element exists) | < 100ms |
| Count assertion (3 elements) | < 200ms |
| All-visible assertion (10 elements) | < 500ms |
| Compound assertion (3 checks) | < 1s |
| Soft assertion (10 checks, all pass) | < 2s |

---

## O. Testing Strategy

### O.1 Unit Tests

| Test | File | Description |
|------|------|-------------|
| AssertionEngine.evaluate | `assertionEngine.test.js` | Core engine logic |
| Each strategy | `strategies/*.test.js` | Individual strategy execution |
| ConditionEvaluator | `conditionEvaluator.test.js` | Operator logic |
| Schema validation | `assert.schema.test.js` | Joi schema validation |

### O.2 Integration Tests

| Test | Description |
|------|-------------|
| Assert node execution | Full handler execution with mock page |
| Auto-healing + assertion | Verify healing triggers on broken selector |
| Soft assertion mode | Verify multiple failures collected |
| Variable resolution | Verify `{{variables}}` resolved in config |

### O.3 E2E Tests

| Test | Description |
|------|-------------|
| Dynamic Content scenario | Full flow with assertion engine |
| Form validation scenario | Fill form → assert values |
| Collection assertions | Assert count, all visible, text not empty |
| Negative assertions | Assert element not exists, text empty |

### O.4 Regression Tests

| Test | Description |
|------|-------------|
| `assert_page_text` backward compat | Existing flows still work |
| Code generation output | AssertionMapper produces correct Playwright code |
| Policy enforcer | `assert` recognized as validation node |

### O.5 Test Cases (ISTQB-Aligned)

#### Element

```text
✓ exists / does not exist
✓ visible / hidden
✓ enabled / disabled
✓ attached / detached
```

#### Text

```text
✓ equals / not equals
✓ contains / not contains
✓ empty / not empty
✓ regex match
✓ case sensitive / insensitive
```

#### Attribute

```text
✓ attribute exists
✓ attribute equals
✓ attribute contains
✓ attribute regex
```

#### Value (Input)

```text
✓ value equals
✓ value contains
✓ value empty / not empty
✓ value regex
```

#### State

```text
✓ checked / unchecked
✓ selected / unselected
✓ focused
```

#### Count

```text
✓ count equals
✓ count greater than
✓ count less than
✓ count between
✓ count in range
```

#### Collection

```text
✓ all elements satisfy condition
✓ any element satisfies condition
✓ no elements satisfy condition
✓ count matches
```

#### Page

```text
✓ URL equals / contains / regex
✓ title equals / contains / regex
```

#### CSS / DOM Properties

```text
✓ has class
✓ has id
✓ has role
✓ has data-* attribute
```

#### Dynamic Content

```text
✓ content changes (structure remains valid)
✓ elements remain present after interaction
✓ count remains stable after refresh
```

---

## P. Implementation Plan

### Phase 1: Core Engine (Backend)

**Duration:** 3-5 days
**Risk:** Low

1. Create `AssertionEngine.js` with strategy registry
2. Implement `ExistenceStrategy`
3. Implement `VisibilityStrategy`
4. Implement `TextStrategy`
5. Implement `CountStrategy`
6. Create `assert.handler.js` using `executePlaywrightAction()`
7. Create `assert.schema.js` (Joi validation)
8. Register in `pluginBootstrap.js`
9. Add unit tests for engine and strategies

### Phase 2: Extended Strategies (Backend)

**Duration:** 2-3 days
**Risk:** Low

1. Implement `AttributeStrategy`
2. Implement `ValueStrategy`
3. Implement `StateStrategy`
4. Implement `PageStrategy`
5. Implement `CSSPropertyStrategy`
6. Implement `CollectionStrategy`
7. Add unit tests for all strategies

### Phase 3: Frontend Registration

**Duration:** 1-2 days
**Risk:** Low

1. Add `assert` to `NODE_CATEGORIES.dom_manipulation.nodes`
2. Add `NODE_INPUTS.assert` configuration schema
3. Add `NODE_OUTPUTS.assert` output schema
4. Add `NODE_SIMULATORS.assert` simulator
5. Add label to `NODE_LABELS`

### Phase 4: Frontend Configuration Panel

**Duration:** 3-5 days
**Risk:** Medium

1. Create `AssertEditor.jsx` component
2. Implement dynamic form rendering based on assertion type
3. Implement scope selector (element/collection/page)
4. Implement compound assertion UI ("Add another check")
5. Implement inline result display
6. Integrate with existing `NodeConfigurationPanel`

### Phase 5: Code Generation

**Duration:** 1-2 days
**Risk:** Low

1. Update `AssertionMapper` to handle new `assert` type
2. Add Playwright code generation for all strategies
3. Add Cypress code generation for common assertions
4. Add Selenium code generation for common assertions

### Phase 6: Policy & Reporting

**Duration:** 1 day
**Risk:** Low

1. Update `policyEnforcer.js` — add `assert` to `isValidationNode()`
2. Update `ExecutionLogger` — structured assertion results
3. Update `PlaywrightGenerator.hasAssertions()` — include `assert`

### Phase 7: Testing & Polish

**Duration:** 2-3 days
**Risk:** Low

1. E2E test: Dynamic Content scenario
2. E2E test: Form validation scenario
3. E2E test: Collection assertions
4. Regression test: existing flows unaffected
5. Performance profiling
6. Documentation

---

### Total Estimated Duration: 13-21 days

### Phase Priority

```
Phase 1 (Core Engine)          → MVP — Unblocks all assertion use cases
Phase 2 (Extended Strategies)  → MVP — Complete ISTQB coverage
Phase 3 (Frontend Registration)→ MVP — Node visible in canvas
Phase 4 (Config Panel)         → MVP — User can configure assertions
Phase 5 (Code Generation)      → Important — Export to Playwright
Phase 6 (Policy & Reporting)   → Nice-to-have — Better UX
Phase 7 (Testing & Polish)     → Required — Quality assurance
```

### MVP Scope (Phases 1-4)

After MVP, users can:

```text
✅ Create an assert node in the DOM category
✅ Select target element with picker
✅ Choose assertion type from dropdown
✅ Configure operator and expected value
✅ Execute and see results
✅ Use soft fail mode
✅ Auto-healing works for assertion selectors
✅ Compound assertions in single node
✅ Collection scope with count/visible/text checks
✅ Page-level URL/title assertions
```

### Future Enhancements (Post-MVP)

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Auto-suggested assertions | Medium | Detect element type and suggest relevant assertions |
| Assertion templates | Low | Pre-built assertion sets for common patterns |
| Visual regression | Low | Screenshot comparison assertions |
| Performance assertions | Low | Page load time, render time |
| Variable-based expected values | Medium | `expected: "{{myVariable}}"` |
| Cross-element comparison | Low | Compare two elements' text/values |
| Soft assertion summary | Medium | Collect all failures, report at end |
| JSON response assertions | Future | Assert API response structure |

---

## Summary — Decision Matrix

| Question | Answer |
|----------|--------|
| What assertions does HalTest support today? | `assert_page_text` (text in body), `find_element` (existence), `validate_semantic` (AI), `browser_dialog` (dialog text) |
| What assertions are missing? | Element visibility, state, attribute, value, count, collection, URL, title, CSS properties |
| Can we solve with existing nodes? | No — requires 3-6x nodes per assertion, no structured results, no ISTQB compliance |
| Do we need a new node? | Yes — `assert` node in DOM category |
| Should there be an Assertion Engine? | Yes — Strategy pattern with declarative data model |
| How do we support multiple assertion types? | Single `assert` node + dynamic type selector + strategy pattern |
| How do we support collections? | Scope selector: element/collection/page + collection modes (all/any/none/count) |
| How do we support auto-suggested assertions? | Future — detect element type from picker, suggest relevant assertions |
| How do we support user-defined assertions? | Current design — user configures type, operator, expected value |
| How do they execute in Playwright? | Native `expect()` API — each strategy maps to specific Playwright matcher |
| How do we integrate auto-healing? | Inherited from `executePlaywrightAction()` — automatic |
| How do we maintain compatibility? | Additive — `assert_page_text` and all existing nodes unchanged |
| What are the performance risks? | Large collections — mitigated by lazy locators and Playwright auto-waiting |

---

## Appendix A: ISTQB/ISO 29119 Reference Mapping

| ISTQB Concept | HalTest Implementation |
|--------------|----------------------|
| **Test Oracle** (ISO 29119-4 §6.3) | `assert` node with explicit expected values |
| **Assertion** (ISTQB Foundation) | `assert` node → structured result with pass/fail |
| **Verification** (ISO 29119-1) | `assert` node validates expected vs actual |
| **Oracle types** | Hard (throws) / Soft (collects) via `softFail` flag |
| **Test verdict** | Per-assertion + aggregate summary |
| **Evidence** | Screenshot on failure, structured results in execution log |
| **Equivalence partitioning** | User asserts boundary values via count/range operators |
| **Boundary value analysis** | Count operators: equals/gt/lt/between |
| **State transition testing** | State assertions: enabled/disabled/checked/selected |
| **Structural testing** | DOM structure assertions: exists/visible/count |
| **Functional testing** | Text/value assertions: equals/contains/regex |

## Appendix B: Playwright expect() API Coverage

| Playwright API | HalTest Strategy | Status |
|---------------|-----------------|--------|
| `toBeVisible()` | `visibility` | ✅ Will implement |
| `toBeHidden()` | `visibility` | ✅ Will implement |
| `toBeEnabled()` | `state` | ✅ Will implement |
| `toBeDisabled()` | `state` | ✅ Will implement |
| `toBeChecked()` | `state` | ✅ Will implement |
| `toHaveText()` | `text` | ✅ Will implement |
| `toContainText()` | `text` | ✅ Will implement |
| `toHaveValue()` | `value` | ✅ Will implement |
| `toHaveAttribute()` | `attribute` | ✅ Will implement |
| `toHaveCount()` | `count` | ✅ Will implement |
| `toHaveClass()` | `cssProperty` | ✅ Will implement |
| `toHaveId()` | `cssProperty` | ✅ Will implement |
| `toHaveURL()` | `page` | ✅ Will implement |
| `toHaveTitle()` | `page` | ✅ Will implement |
| `toHaveValues()` | `state` (selected) | ✅ Will implement |
| `toHaveScreenshot()` | Future | 🔮 Post-MVP |
| `toHaveJSProperty()` | Future | 🔮 Post-MVP |
| `toMatchScreenshot()` | Future | 🔮 Post-MVP |
