# HALTEST — AGENTIC QUALITY ENGINEERING ARCHITECTURE & IMPLEMENTATION PLAN

**Version:** 1.0
**Date:** 2026-09-13
**Status:** Strategic Architecture Document

---

## 1. Executive Summary

### Thesis

HalTest must evolve from a **Visual Browser Automation Platform** into an **Agentic Quality Engineering Platform** — not by replacing what exists, but by layering intelligence on top of its proven deterministic foundation.

**Core philosophy:** AI may _propose_. The deterministic engine must _verify_. Every healing action requires evidence. No AI decision is authoritative without human approval.

### Strategic Position

HalTest's moat is the convergence of capabilities no competitor has simultaneously:

```
Visual Canvas + Intent-based + Deterministic + Agentic + Self-healing
+ Framework-agnostic + Self-hosted + Quality Intelligence
```

Most competitors are one-dimensional:

- Playwright: Deterministic but not visual, not agentic
- Cypress: Deterministic but not visual, not self-healing
- AI test generators: AI-first but not deterministic, not self-hosted
- Self-healing platforms: Single domain, not multi-quality
- Visual testing: Only screenshots, no semantic flow

HalTest can be the **only platform** where a non-technical human expresses intent visually, AI proposes a test flow, a deterministic engine executes it, produces verifiable evidence, AI diagnoses failures and proposes repairs, and every repair goes through deterministic verification before human approval.

### Current State Summary

HalTest v1.0.x is a working monorepo with:

- 84+ node types across 13 plugin categories
- React Flow canvas with collaboration (Yjs)
- Playwright execution engine with topological sort
- Self-healing with ExperienceVault + AI SelectorHealer
- AssertionEngine with 9 strategies
- Code generation (Playwright/Cypress/Selenium, 5 languages, 6 patterns)
- SafetyGate (structural + policy + golden dataset)
- Performance testing (virtual users, load profiles)
- Security compliance (OWASP ASVS L2)
- MCP server (partial, mostly stubs)
- CLI published to npm

### Critical Technical Debt Before Intelligence

Before adding agentic capabilities, these foundation issues must be resolved:

1. **Database migration/model alignment** — Migration 2 cannot run on fresh DB; StepResult/Run model column mismatches cause runtime failures
2. **AIUsageLog dual schema** — Model creates `ai_usage_log`, migration creates `AIUsageLogs` — two separate tables
3. **Frontend node definition sync** — Frontend hardcodes node definitions; backend has plugin manifests — no single source of truth
4. **App.jsx monolith** — 2,945 lines containing dashboard, settings, dialogs, all inline
5. **MCP stubs** — `get_canvas_flow` returns hardcoded mock data; `update_canvas_nodes` ignores input
6. **Execution evidence gaps** — StepResult missing `screenshot_path`, `memory_hit`, `video_timestamp`, `ai_diagnosis` columns in DB

---

## 2. Current Architecture

### 2.1 Monorepo Structure

```
halt-test-monorepo (pnpm workspaces + Turbo)
├── apps/
│   ├── backend/        — Node.js/Express, ESM, Socket.IO, Yjs, Playwright
│   ├── frontend/       — React 19, React Flow v12, Zustand, TanStack Query
│   ├── cli/            — Published npm package (bundles entire monolith)
│   └── web/            — Marketing/landing site (Vite)
├── tests/              — Generated Playwright tests
├── storage/            — Local storage (~/.haltest at runtime)
└── scripts/            — Setup, SBOM, security audit
```

### 2.2 Execution Flow

```
UI (React Flow Canvas)
  ↓ drag-n-drop / configure nodes
Frontend State (useFlowState — React refs)
  ↓ POST /api/runs/start
Backend Run Controller
  ↓ executionLogger.startRun → Run.create()
  ↓ ExecutionLock.acquire()
  ↓ ExecutionService.executeFlow()
    ↓ Flow.load() → topologicalSortNodes()
    ↓ for each node in order:
        ↓ schemas[nodeType].validate(config)
        ↓ ActionExecutor.executePlaywrightAction()
          ↓ VariableManager.resolveRecursive()
          ↓ handler(page, opts, browserId, context)
          ↓ pluginHandler → Playwright API call
          ↓ result → captureLiveState()
          ↓ ExecutionLogger.logStep() → StepResult.create()
          ↓ (on error) → Self-healing pipeline
      ↓ ExecutionLogger.endRun()
  ↓ Socket.IO events → UI real-time feedback
```

### 2.3 Data Model (15 tables, SQLite/Postgres)

```
User
 └── Project (userId, collaborationEnabled)
      ├── Canvas (projectId, order)
      │    └── Flow (canvasId, parentId, type, viewport, hasInput, hasOutput)
      │         ├── Node (flowId, type, data JSONB, position JSONB, order)
      │         └── Edge (flowId, source, target, sourceHandle, targetHandle)
      └── Flow (legacy projectId FK)

Run (flow_id, batch_id, project_id, status, flow_snapshot, trigger)
 └── StepResult (run_id, node_id, node_type, status, input_data, output_data,
                 screenshot_path, memory_hit, video_timestamp, ai_diagnosis)

HealingLog (run_id, node_id, original_selector, healed_selector, strategy, success)
ExperienceVault (nodeId, selector, pageUrl, context JSONB, successCount, failureCount)
CollaboratorRole (projectId, userId, role)
ExecutionLock (flowId, userId, runId, expiresAt)
SecurityComplianceRun → SecurityComplianceResult
AIUsageLog (task_type, provider, model, tokens, latency, success)
```

### 2.4 Plugin Architecture

```
apps/backend/plugins/
├── core-ai/          — call_llm, generate_data, validate_semantic,
│                       extract_dom_context, chain_of_thought, smart_selector
├── core-assertion/   — assert (9-strategy AssertionEngine), assert_page_text
├── core-browser/     — launch_browser, close_browser, manage_tabs,
│                       resize_viewport, browser_dialog
├── core-capture/     — take_screenshot, save_dom, log_errors, listen_events
├── core-data/        — read_file, write_file, download_file
├── core-flow-control/— variable, conditional, switch, loop, for_each,
│                       component, pause, backend_js, fail_flow,
│                       wait_conditional, input, output, transform,
│                       flow_control
├── core-interaction/ — click, type_text, fill_form, select_option,
│                       set_checkbox, set_radio, pick_list_option,
│                       scroll, drag_drop, hover, upload_file
├── core-navigation/  — open_url, go_back, go_forward, reload_page
├── core-network/     — configure_route, mock_response, intercept_request,
│                       set_network_conditions, clear_all_mocks,
│                       wait_network_match, block_resource, modify_headers,
│                       manage_cookies
├── core-security/    — audit_policy, sensitive_data_monitor,
│                       csp_validator, header_auditor, dom_sanitizer
├── core-session/     — manage_session, persist_session, create_context,
│                       cleanup_state, close_context, inject_tokens
├── core-testing/     — run_tests, cli_params, return_code, integrate_ci
└── core-wait/        — wait_for_element, wait_visible, wait_navigation,
                        wait_network, wait_conditional, wait_for_request,
                        wait_for_response, pause
```

Each plugin has:

- `manifest.json` — node type, category, label, schema reference, handler reference
- `handlers/<node_type>.js` — Express controller wrapping `executePlaywrightAction()`
- `schemas/<node_type>.js` — Joi validation schema

Registration: `core/pluginBootstrap.js` → `bootstrapBuiltinPlugins()` → `NodeRegistry.register()`

Third-party plugins: `STORAGE_DIR/plugins/` loaded by `core/PluginManager.js`

### 2.5 Handler Interface

```javascript
// Every node handler follows this contract:
const handler = (req, res) =>
  executePlaywrightAction(req, res, "node_type_name", async (page, opts) => {
    // page: Playwright Page instance
    // opts: validated + variable-resolved config
    // return: { success, data, message, ... }
  });
```

---

## 3. Current Capability Matrix

| Capability                      | State      | Reusable | Gap                                                                                              | Priority |
| ------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------ | -------- |
| Visual canvas (React Flow)      | ✅ Working | High     | Decompose App.jsx monolith                                                                       | P0       |
| Node-based flow editor          | ✅ Working | High     | Sync definitions backend↔frontend                                                                | P0       |
| Plugin system                   | ✅ Working | High     | Add lifecycle hooks for agents                                                                   | P1       |
| Playwright execution engine     | ✅ Working | High     | Add evidence collection hooks                                                                    | P0       |
| Topological sort                | ✅ Working | High     | —                                                                                                | —        |
| Variable manager                | ✅ Working | High     | —                                                                                                | —        |
| Expression engine               | ✅ Working | High     | —                                                                                                | —        |
| Self-healing (selector)         | ⚠️ Partial | High     | Add human approval, deterministic verification, confidence thresholds                            | P2       |
| Assertion engine (9 strategies) | ✅ Working | High     | Add accessibility, visual, network, performance, security assertions                             | P1       |
| AI integration                  | ⚠️ Partial | Medium   | Add planner agent, explorer, diagnosis; current AI only heals selectors + generates simple flows | P1       |
| Code generation                 | ✅ Working | High     | Good abstraction via generator registry                                                          | P1       |
| SafetyGate                      | ✅ Working | High     | Extensible for agentic validation                                                                | P2       |
| Batch execution                 | ✅ Working | Medium   | Workers, queue architecture for scale                                                            | P4       |
| Performance testing             | ✅ Working | Medium   | WorkerPool + virtual users exist                                                                 | P3       |
| Security compliance             | ⚠️ Partial | Medium   | Limited to header/CSP/DOM analysis                                                               | P3       |
| MCP server                      | ❌ Stubs   | Low      | Complete rewrite needed                                                                          | P2       |
| Application Explorer            | ❌ Missing | Low      | AccessibilityTreePlanner is starting point                                                       | P2       |
| Failure Diagnosis Agent         | ❌ Missing | Low      | SelectorHealer is starting point                                                                 | P2       |
| Coverage Analysis               | ❌ Missing | Low      | —                                                                                                | P3       |
| Intelligent Test Selection      | ❌ Missing | Low      | —                                                                                                | P3       |
| Knowledge Graph                 | ❌ Missing | Low      | StepResult + HealingLog provide data foundation                                                  | P3       |
| Observability / Evidence        | ⚠️ Partial | Medium   | Missing AI reasoning audit trail, structured evidence model                                      | P1       |
| Framework abstraction           | ❌ Missing | Low      | Code generation already abstracts — runtime abstraction needed                                   | P4       |
| Multi-user scaling              | ❌ Missing | Low      | Single-user design, SQLite                                                                       | P5       |
| AI Governance                   | ❌ Missing | Low      | SSRF guards exist, no data classification/redaction                                              | P4       |
| Collaboration (Yjs)             | ✅ Working | High     | —                                                                                                | —        |
| Project management              | ✅ Working | High     | —                                                                                                | —        |
| Subflow/composition             | ✅ Working | High     | FlowResolver + ComponentRegistry                                                                 | —        |
| CLI                             | ✅ Working | High     | Published to npm                                                                                 | —        |

---

## 4. Target Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HalTest Agentic QE Platform                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Visual       │  │  Agent        │  │  API / MCP    │  │  CLI       │  │
│  │  Canvas       │  │  Interface    │  │  Interface    │  │  Interface │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                  │                  │                 │          │
│  ┌──────┴──────────────────┴──────────────────┴─────────────────┴──────┐  │
│  │                    Orchestration Layer                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐               │  │
│  │  │ Run Manager  │  │ Agent       │  │ Evidence     │               │  │
│  │  │ (deterministic)│ │ Orchestrator│  │ Collector    │               │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘               │  │
│  └─────────┼────────────────┼────────────────┼────────────────────────┘  │
│            │                │                │                            │
│  ┌─────────┴────────────────┴────────────────┴────────────────────────┐  │
│  │                    Intelligence Layer                               │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │  │
│  │  │ Planner    │ │ Explorer   │ │ Diagnoser  │ │ Selection      │  │  │
│  │  │ Agent      │ │ Agent      │ │ Agent      │ │ Agent          │  │  │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───────┬────────┘  │  │
│  │        │              │              │                 │            │  │
│  │  ┌─────┴──────────────┴──────────────┴─────────────────┴────────┐  │  │
│  │  │              AI Service (LLM Providers)                       │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Execution Layer                                  │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │  │
│  │  │ Plugin       │ │ Execution    │ │ Assertion    │               │  │
│  │  │ System       │ │ Service      │ │ Engine       │               │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘               │  │
│  │         │                │                │                        │  │
│  │  ┌──────┴────────────────┴────────────────┴────────────────────┐  │  │
│  │  │              Execution Adapter (new)                         │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │  │  │
│  │  │  │Playwright│  │ Selenium │  │ (future) │                  │  │  │
│  │  │  │ Adapter  │  │ Adapter  │  │          │                  │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘                  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Data Layer                                       │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐    │  │
│  │  │ Database   │ │ Evidence   │ │ Knowledge  │ │ AI Governance│    │  │
│  │  │ (Sequelize)│ │ Store      │ │ Graph      │ │ Audit Log    │    │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Agentic Quality Engineering Flow

```
Human Intent (natural language)
       ↓
  ┌────────────────┐
  │ Planner Agent   │ ← reads Application Map (if exists)
  │ (AI propose)    │ ← reads existing flows (dedup)
  └────────┬───────┘
           ↓
  Proposed Flow (nodes + edges)
           ↓
  ┌────────────────┐
  │ SafetyGate      │ ← structural validation
  │ (deterministic) │ ← policy validation
  └────────┬───────┘
           ↓
  Validated Flow
           ↓
  ┌────────────────┐
  │ Execution       │ ← Playwright
  │ Engine          │ ← topological sort
  └────────┬───────┘
           ↓
  Evidence (screenshots, traces, DOM snapshots, network logs)
           ↓
  ┌────────────────┐
  │ Quality         │ ← results analysis
  │ Intelligence    │ ← coverage impact
  └────────┬───────┘
           ↓
  Results (pass/fail/healed)
           ↓
  ┌────────────────┐  [on failure]
  │ Failure         │ ← classify error type
  │ Diagnoser Agent │ ← read evidence
  │ (AI propose)    │
  └────────┬───────┘
           ↓
  Proposed Repair (new selector, config change, or flow modification)
           ↓
  ┌────────────────┐
  │ Deterministic   │ ← re-execute with proposed fix
  │ Verification    │ ← compare before/after evidence
  └────────┬───────┘
           ↓
  Confidence Score (0.0 - 1.0)
           ↓
  ┌────────────────┐
  │ Human Approval  │ ← show evidence + reasoning
  │ (UI / MCP)      │ ← approve/reject/modify
  └────────┬───────┘
           ↓
  Persist Repair (ExperienceVault + HealingLog + Node update)
           ↓
  Knowledge Graph updated
```

---

## 5. Proposed Domain Model

### 5.1 Current Node Model vs Proposed Intent Model

**Current (action-oriented):**

```
Node {
  type: "click"
  data: { configuration: { selector: "#submit-btn" } }
}
```

**Proposed (intent-oriented, backward-compatible):**

```
Node {
  type: "click"                    // preserved for backward compatibility
  intent: "Submit checkout form"   // NEW — human-readable purpose
  target: {                        // NEW — target description
    selector: "#submit-btn"
    description: "Checkout submit button"
    semanticRole: "submit"         // NEW — accessibility role
  }
  expected: {                      // NEW — expected outcome
    type: "navigation"
    urlContains: "/order-confirmation"
  }
  metadata: {                      // NEW — provenance
    source: "human" | "ai_proposed" | "healed"
    confidence: 1.0
    reasoning: "..."
    evidence: []
  }
  // ... existing config preserved
}
```

**Migration strategy:** The new fields are optional. Existing flows continue to work. New fields are populated when flows are created by agents or when healing occurs.

### 5.2 Evidence Model

```
ExecutionEvidence {
  runId: string
  nodeId: string
  stepIndex: number
  timestamp: Date
  duration_ms: number

  // Visual evidence
  screenshot?: string (path to PNG)
  videoSegment?: { path, startTime, endTime }

  // DOM evidence
  domSnapshot?: string (HTML)
  domSelector?: string (selector used)

  // Network evidence
  networkRequests?: [{ url, method, status, duration }]
  consoleLogs?: [{ level, message, timestamp }]

  // AI evidence
  aiReasoning?: string
  aiConfidence?: number
  healingHistory?: HealingRecord[]

  // State evidence
  variables?: Record<string, any>
  url?: string
  pageTitle?: string
}
```

### 5.3 Knowledge Graph (Relational, no new DB)

```
Requirement ←→ TestIntent ←→ Flow ←→ Node ←→ ApplicationElement
                                                      ↓
                                              Execution ←→ Evidence
                                                      ↓
                                                  Defect
```

**Implementation:** Relational FKs + junction tables in existing Sequelize/SQLite/Postgres. No graph database needed initially — relationships can be modeled with:

```
FlowTag (flowId, tag, category)         — links flows to requirements/features
FlowDependency (flowId, dependsOnFlowId) — cross-flow relationships
ElementMapping (nodeId, applicationElementId) — links nodes to app elements
DefectRecord (runId, nodeId, defectType, evidence) — failure root causes
```

---

## 6. Agent Architecture

### 6.1 Specialized Agent Design

No monolithic agent. Each agent has defined responsibilities, tools, permissions, and output contracts.

```
┌──────────────────────────────────────────────────────────────────┐
│                     Agent Orchestrator                            │
│  (manages agent lifecycle, context sharing, token budgets)        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  Responsibility:                            │
│  │ Planner Agent    │  Natural language → flow proposal           │
│  │                  │  Tools: AIService.generateFlow              │
│  │                  │  Input: intent + context + constraints      │
│  │                  │  Output: ProposedFlow[]                     │
│  ├─────────────────┤  Responsibility:                            │
│  │ Explorer Agent   │  URL → application structure discovery      │
│  │                  │  Tools: Playwright page exploration         │
│  │                  │  Input: baseURL + auth context              │
│  │                  │  Output: ApplicationMap                     │
│  ├─────────────────┤  Responsibility:                            │
│  │ Generator Agent  │  ApplicationMap + intent → optimized flows  │
│  │                  │  Tools: AIService, SafetyGate               │
│  │                  │  Input: ApplicationMap + TestPlan           │
│  │                  │  Output: Flows (validated by SafetyGate)    │
│  ├─────────────────┤  Responsibility:                            │
│  │ Diagnoser Agent  │  Failed execution → root cause analysis     │
│  │                  │  Tools: Evidence reader, AI reasoning       │
│  │                  │  Input: ExecutionEvidence + ErrorContext     │
│  │                  │  Output: DiagnosisReport                    │
│  ├─────────────────┤  Responsibility:                            │
│  │ Healing Agent    │  Diagnosis → repair proposal                │
│  │                  │  Tools: SelectorHealer, AIService           │
│  │                  │  Input: DiagnosisReport                     │
│  │                  │  Output: RepairProposal (with confidence)   │
│  ├─────────────────┤  Responsibility:                            │
│  │ Selection Agent  │  Code change → relevant test selection      │
│  │                  │  Tools: KnowledgeGraph, HistoryAnalyzer     │
│  │                  │  Input: CodeChangeSet                       │
│  │                  │  Output: SelectedTestSuite (ranked)         │
│  ├─────────────────┤  Responsibility:                            │
│  │ Coverage Agent   │  ApplicationMap → coverage gaps             │
│  │                  │  Tools: KnowledgeGraph, FlowAnalyzer        │
│  │                  │  Input: ApplicationMap                      │
│  │                  │  Output: CoverageReport                     │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Agent Output Contracts

```json
// Planner Agent Output
{
  "intent": "Login to the application with valid credentials",
  "context": { "existingFlows": [...], "applicationMap": {...} },
  "constraints": ["must use existing login page", "2FA required"],
  "proposedFlow": {
    "name": "Login Flow",
    "nodes": [...],
    "edges": [...],
    "reasoning": "Based on application structure, login requires..."
  },
  "confidence": 0.85,
  "alternatives": [...]
}

// Diagnoser Agent Output
{
  "runId": "abc-123",
  "failedNodeId": "n5",
  "failureType": "selector_stale",
  "evidence": {
    "screenshot": "...",
    "domSnapshot": "...",
    "networkRequests": [...],
    "consoleErrors": [...]
  },
  "rootCause": "Button text changed from 'Submit' to 'Place Order'",
  "affectedNodes": ["n5", "n8"],
  "recommendedAction": "Update selector strategy",
  "confidence": 0.92
}

// Healing Agent Output
{
  "original": { "selector": "#submit-btn", "nodeId": "n5" },
  "candidate": {
    "newSelector": "button:has-text('Place Order')",
    "strategy": "text-based locator",
    "reasoning": "Button text changed; text-based locator is more resilient"
  },
  "confidence": 0.88,
  "evidence": ["DOM snapshot confirms text change", "Aria role matches"],
  "verificationRequired": true,
  "isBreakingChange": true,
  "requiresHumanApproval": true
}
```

### 6.3 Token/Cost Control

```javascript
AgentConfig = {
  maxTokensPerRequest: 4096,
  maxCostPerRun: 0.1, // USD
  modelPolicy: {
    planning: { provider: "openai", model: "gpt-4o" },
    healing: { provider: "ollama", model: "local" }, // default local
    diagnosis: { provider: "openai", model: "gpt-4o-mini" },
  },
  retryPolicy: { maxRetries: 2, backoff: "exponential" },
  fallbackModel: { provider: "ollama", model: "llama3.1" },
};
```

---

## 7. AI Governance

### 7.1 Data Classification Pipeline

```
AI Request
       ↓
┌─────────────────┐
│ Data Classifier  │
│                  │
│ 1. Scan for PII  │ — email, phone, SSN, credit card patterns
│ 2. Scan secrets  │ — API keys, tokens, passwords
│ 3. Classify risk  │ — NONE / LOW / MEDIUM / HIGH / CRITICAL
└────────┬────────┘
         ↓
┌─────────────────┐
│ Redaction Engine │
│                  │
│ Replace PII/secrets
│ with placeholders
│ [REDACTED_EMAIL]
│ [REDACTED_TOKEN]
└────────┬────────┘
         ↓
┌─────────────────┐
│ Model Provider   │
│                  │
│ Send redacted
│ content only
└────────┬────────┘
         ↓
┌─────────────────┐
│ Response         │
│ Validation       │
│                  │
│ Validate AI output
│ doesn't leak PII
│ back from model
└────────┬────────┘
         ↓
┌─────────────────┐
│ Audit Log        │
│                  │
│ Full request/response
│ stored encrypted
│ retention: 30 days
└─────────────────┘
```

### 7.2 Self-Hosted / Air-Gapped Considerations

- All AI calls go through `AIService` which abstracts providers
- Ollama (local) is the default provider — no data leaves the machine
- `HALTEST_ALLOWED_AI_BASE_URLS` env controls SSRF protection
- AI config is per-project, stored locally
- No external analytics, no telemetry (by default)

---

## 8. Application Explorer

### 8.1 Exploration Pipeline

```
URL (baseURL)
       ↓
┌─────────────────┐
│ Browser Session  │
│ (Playwright)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Accessibility    │ ← page.accessibility.snapshot()
│ Tree Snapshot    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Page Structure   │ ← links, forms, buttons, inputs, modals
│ Analysis         │ ← navigation patterns, state changes
└────────┬────────┘
         ↓
┌─────────────────┐
│ Interactive      │ ← all clickable, fillable, submittable elements
│ Element Catalog  │ ← selectors (CSS, Aria, text, XPath)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Navigation       │ ← page graph (which pages link to which)
│ Graph            │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Workflow         │ ← login flow, checkout flow, CRUD patterns
│ Discovery        │
└────────┬────────┘
         ↓
Application Map {
  pages: [
    { url, title, elements: [...], role: "authentication" },
    { url, title, elements: [...], role: "product-listing" },
    ...
  ],
  workflows: [
    { name: "login", steps: ["enter-email", "enter-password", "click-submit"] },
    { name: "checkout", steps: ["add-to-cart", "go-to-cart", "fill-form", "submit"] }
  ],
  coverageGaps: [...]
}
```

### 8.2 Reusable Components

- `AccessibilityTreePlanner.js` — already parses accessibility trees
- `SelectorHealer.getCompressionScript()` — DOM compression for context
- `extract_dom_context` node — extracts DOM context for AI
- `PlaywrightMCPServer` — `inspect_page` tool for DOM inspection
- Playwright `page.accessibility.snapshot()` — raw accessibility data

---

## 9. Assertion Architecture

### 9.1 Current Assertion Engine

The existing `AssertionEngine` with strategy pattern is solid and extensible:

```javascript
// Currently implemented (9 strategies):
assertionEngine.evaluate({
  page,
  locator,
  assertions: [
    { type: "existence", operator: "exists" },
    { type: "visibility", operator: "visible" },
    { type: "text", operator: "contains", expected: "Welcome" },
    { type: "count", operator: "equals", expected: 5 },
    {
      type: "attribute",
      operator: "equals",
      attribute: "href",
      expected: "/login",
    },
    { type: "value", operator: "equals", expected: "text content" },
    { type: "state", operator: "enabled" },
    {
      type: "css_property",
      operator: "equals",
      property: "color",
      expected: "rgb(0,0,0)",
    },
    { type: "page", operator: "url_contains", expected: "/dashboard" },
  ],
});
```

### 9.2 Proposed Expansion

```javascript
// NEW strategies to add:
assertionEngine.evaluate({
  page,
  locator,
  assertions: [
    // DOM structure
    { type: "dom", operator: "has_child", expected: "button" },
    { type: "dom", operator: "has_attribute", attribute: "aria-label" },

    // Accessibility
    { type: "accessibility", operator: "has_role", expected: "button" },
    { type: "accessibility", operator: "has_name", expected: "Submit" },
    { type: "accessibility", operator: "is_accessible", level: "AA" },

    // Network
    { type: "network", operator: "request_made", urlContains: "/api/" },
    { type: "network", operator: "no_console_errors" },

    // Performance
    { type: "performance", operator: "load_time_under", expected: 3000 },
    {
      type: "performance",
      operator: "largest_contentful_paint_under",
      expected: 2500,
    },

    // Custom expression
    {
      type: "expression",
      operator: "evaluate",
      expression: 'document.querySelectorAll(".error").length === 0',
    },
  ],
});
```

### 9.3 Universal Assertion Schema (Target)

```
Assertion {
  target: {
    selector: string | { role, name, text }
    scope: 'element' | 'collection' | 'page' | 'network' | 'performance'
  }
  type: string (strategy key)
  operator: string (strategy-specific)
  expected: any
  timeout?: number
  softFail?: boolean
  options?: {
    caseSensitive?: boolean
    regex?: boolean
    attribute?: string
    property?: string
    ...
  }
}
```

---

## 10. Self-Healing Architecture

### 10.1 Current Self-Healing Pipeline

```javascript
// ActionExecutor.js — full healing pipeline (verified)

1. FAILURE DETECTION
   - isSelectorError pattern matching (Timeout, waiting for selector,
     element is not visible, no element found, etc.)
   - Requires: selector present, runId or debugMode, not continueOnError,
     healing enabled, not CI mode

2. EXPERIENCE VAULT LOOKUP (if enabled)
   - First tries exact nodeId match → memory_node source
   - Then tries selector + context match
   - Then tries selector-only fallback
   - If found: uses stored solution (source='memory')

3. AI ESCALATION (if no vault match)
   - SelectorHealer.heal() with tiered prompts
   - DOM compression (pipe-delimited, 500 char cap)
   - AI generates candidate selectors
   - Each candidate verified with page.locator().count()
   - Confidence scoring (MIN_CONFIDENCE = 0.5)
   - Sanitization (length, JS injection, sensitive selectors)

4. DETERMINISTIC VERIFICATION
   - Candidate selector → page.locator(candidate).count()
   - If exactly 1 match → verified
   - Proximity sorting for multiple candidates

5. PERSISTENCE
   - Node.data.configuration updated with healed selector
   - HealingLog created (original, healed, strategy, success)
   - ExperienceVault memory saved (for future vault lookups)
   - Flow document updated (data.nodes[...].configuration)
   - Socket.IO event emitted for UI update

6. RETRY
   - actionLogic retried with corrected selector
   - If retry succeeds → status: 'healed'
   - If retry fails → error propagated

7. HARD CAP
   - 60 second timeout on entire healing process
```

### 10.2 Proposed Enhanced Pipeline

```
1. FAILURE DETECTION
   + Classify failure type (selector, timeout, assertion, network, auth, state)

2. EVIDENCE COLLECTION
   + DOM snapshot (full or compressed)
   + Screenshot at failure moment
   + Network request log at failure moment
   + Console log at failure moment
   + Current URL and page title
   + All variable values at failure moment

3. FAILURE CLASSIFICATION
   + selector_stale: element text/attributes changed
   + selector_missing: element removed from DOM
   + timing_issue: element appears later than expected
   + state_issue: wrong page/state
   + network_issue: API failure
   + auth_issue: session expired
   + assertion_failure: element found but condition not met

4. CANDIDATE GENERATION
   + ExperienceVault (existing)
   + SelectorHealer AI (existing)
   + NEW: DOM proximity analysis (nearby similar elements)
   + NEW: Accessibility tree matching (role + name)
   + NEW: Text-based locator (if text changed)
   + NEW: Position-based fallback (last resort)

5. AI REASONING (enhanced)
   + Read full evidence context
   + Propose repair with explicit reasoning
   + Classify confidence: high (>0.8) / medium (0.5-0.8) / low (<0.5)

6. DETERMINISTIC VERIFICATION
   + Verify candidate exists (existing)
   + NEW: Verify action succeeds with candidate
   + NEW: Verify no side effects (other elements not affected)
   + NEW: Compare before/after screenshots

7. CONFIDENCE SCORING
   + vault_hit: +0.3 (proven solution)
   + selector_verified: +0.3 (candidate found exactly 1 match)
   + action_verified: +0.2 (action succeeds)
   + no_side_effects: +0.1 (no regressions)
   + ai_reasoning_clear: +0.1 (clear rationale)

8. HUMAN APPROVAL GATE
   + confidence >= 0.8: auto-apply (configurable, default OFF)
   + confidence 0.5-0.8: show in UI with evidence, await approval
   + confidence < 0.5: show as suggestion, require manual action
   + ALWAYS: store HealingLog regardless of auto-apply

9. PERSISTENCE (enhanced)
   + All existing persistence
   + NEW: Evidence snapshot stored
   + NEW: AI reasoning metadata stored
   + NEW: Healing history timeline

10. VERIFICATION AFTER HEALING
    + Re-run the action
    + Compare step_results before/after
    + If regression → rollback to original selector
    + Log verification result
```

### 10.3 Locator Drift Detection

```
Scheduled checks (background):
- For each ExperienceVault entry with successCount > 5:
  - Re-verify selector still matches expected element
  - If drift detected → mark as potentially stale
  - Next healing will prefer fresh AI candidates

Drift types detected:
- selector_drift: element text/attributes changed
- dom_drift: DOM structure changed significantly
- layout_drift: element moved but selector still works
- state_drift: authentication state changed
```

---

## 11. Quality Knowledge Graph

### 11.1 Data Model (Relational, in Existing DB)

```sql
-- NEW TABLES (via migration)

-- Tags flow to requirements/features
CREATE TABLE FlowTags (
  id STRING PRIMARY KEY,
  flowId STRING NOT NULL REFERENCES Flows(id),
  tag STRING NOT NULL,
  category STRING NOT NULL, -- 'requirement', 'feature', 'module', 'risk'
  createdAt DATE NOT NULL
);

-- Dependencies between flows
CREATE TABLE FlowDependencies (
  id STRING PRIMARY KEY,
  flowId STRING NOT NULL REFERENCES Flows(id),
  dependsOnFlowId STRING NOT NULL REFERENCES Flows(id),
  type STRING NOT NULL, -- 'prerequisite', 'shared-element', 'data-dependency'
  createdAt DATE NOT NULL
);

-- Links nodes to application elements
CREATE TABLE ElementMappings (
  id STRING PRIMARY KEY,
  nodeId STRING NOT NULL,
  applicationElementId STRING NOT NULL, -- from ApplicationMap
  flowId STRING NOT NULL REFERENCES Flows(id),
  createdAt DATE NOT NULL
);

-- Failure root causes
CREATE TABLE DefectRecords (
  id STRING PRIMARY KEY,
  runId STRING NOT NULL REFERENCES execution_runs(id),
  nodeId STRING NOT NULL,
  defectType STRING NOT NULL, -- 'selector_stale', 'assertion_failure', etc.
  evidence JSONB,
  rootCause TEXT,
  healingAttempted BOOLEAN DEFAULT false,
  healingSuccessful BOOLEAN,
  createdAt DATE NOT NULL
);

-- Application maps (from Explorer)
CREATE TABLE ApplicationMaps (
  id STRING PRIMARY KEY,
  projectId STRING NOT NULL REFERENCES Projects(id),
  baseURL STRING NOT NULL,
  snapshot JSONB NOT NULL, -- full ApplicationMap structure
  version INTEGER NOT NULL DEFAULT 1,
  createdAt DATE NOT NULL
);
```

### 11.2 Queryable Questions

```sql
-- What requirements are uncovered?
SELECT f.id, f.name, ft.tag AS requirement
FROM Flows f
LEFT JOIN FlowTags ft ON ft.flowId = f.id AND ft.category = 'requirement'
WHERE ft.id IS NULL;

-- What flows are affected by changes to a specific element?
SELECT f.id, f.name, em.nodeId
FROM ElementMappings em
JOIN Flows f ON f.id = em.flowId
WHERE em.applicationElementId = :changedElementId;

-- What tests are flaky?
SELECT f.id, f.name,
  COUNT(CASE WHEN sr.status = 'healed' THEN 1 END) AS healed_count,
  COUNT(*) AS total_runs
FROM Flows f
JOIN execution_runs er ON er.flow_id = f.id
JOIN step_results sr ON sr.run_id = er.id
GROUP BY f.id
HAVING healed_count > total_runs * 0.1; -- >10% healed = flaky

-- What areas have highest risk?
SELECT ft.tag AS module,
  COUNT(DISTINCT er.id) AS total_runs,
  COUNT(CASE WHEN er.status = 'failed' THEN 1 END) AS failures,
  CAST(COUNT(CASE WHEN er.status = 'failed' THEN 1 END) AS FLOAT) / COUNT(*) AS fail_rate
FROM FlowTags ft
JOIN Flows f ON f.id = ft.flowId
JOIN execution_runs er ON er.flow_id = f.id
WHERE ft.category = 'module'
GROUP BY ft.tag
ORDER BY fail_rate DESC;
```

---

## 12. MCP / Agent API

### 12.1 Current MCP Implementation

```
HalTestMCPServer (apps/backend/services/HalTestMCPServer.js):
  - get_canvas_flow: STUB (returns hardcoded mock nodes)
  - update_canvas_nodes: STUB (accepts but ignores input)
  - plan_flow_from_accessibility: FUNCTIONAL (uses AccessibilityTreePlanner)
  - auto_heal_selector: FUNCTIONAL (uses SelectorHealer)
  - auto_heal_network_console: FUNCTIONAL (uses NetworkConsoleHealer)

PlaywrightMCPServer (apps/backend/services/PlaywrightMCPServer.js):
  - inspect_page: FUNCTIONAL (DOM inspection)
  - suggest_selector: FUNCTIONAL (selector suggestion)
  - highlight_element: FUNCTIONAL (visual highlight)

canvasTools (apps/backend/mcp/canvasTools.js):
  - read_canvas_state: FUNCTIONAL (via socket.io ack)
  - inject_nodes: FUNCTIONAL (with user approval via socket)
  - add_node_to_canvas: FUNCTIONAL (restricted to 8 node types)
  - connect_nodes: FUNCTIONAL
  - execute_playwright_cmd: FUNCTIONAL
  - remove_node: FUNCTIONAL
  - update_node: FUNCTIONAL
```

### 12.2 Proposed MCP Tools Contract

```json
{
  "tools": [
    {
      "name": "create_project",
      "description": "Create a new HalTest project",
      "input": {
        "name": "string",
        "description": "string?",
        "config": "object?"
      },
      "output": { "projectId": "string" }
    },
    {
      "name": "explore_application",
      "description": "Explore a web application and generate an ApplicationMap",
      "input": {
        "projectId": "string",
        "baseURL": "string",
        "auth": "object?"
      },
      "output": { "applicationMap": "ApplicationMap" }
    },
    {
      "name": "create_flow",
      "description": "Create a test flow from intent",
      "input": {
        "projectId": "string",
        "intent": "string",
        "applicationMapId": "string?",
        "constraints": "string[]?"
      },
      "output": {
        "flowId": "string",
        "proposedFlow": "Flow",
        "confidence": "number"
      }
    },
    {
      "name": "add_node",
      "description": "Add a node to an existing flow",
      "input": {
        "flowId": "string",
        "nodeType": "string",
        "config": "object",
        "position": "object?"
      },
      "output": { "nodeId": "string" }
    },
    {
      "name": "modify_flow",
      "description": "Modify nodes/edges in a flow",
      "input": {
        "flowId": "string",
        "nodes": "object[]?",
        "edges": "object[]?"
      },
      "output": { "success": "boolean" }
    },
    {
      "name": "run_test",
      "description": "Execute a flow",
      "input": {
        "flowId": "string",
        "projectId": "string",
        "options": "object?"
      },
      "output": { "runId": "string" }
    },
    {
      "name": "get_execution",
      "description": "Get execution results",
      "input": { "runId": "string" },
      "output": {
        "run": "Run",
        "steps": "StepResult[]",
        "evidence": "Evidence"
      }
    },
    {
      "name": "analyze_failure",
      "description": "Analyze a failed execution",
      "input": { "runId": "string", "nodeId": "string" },
      "output": { "diagnosis": "DiagnosisReport" }
    },
    {
      "name": "propose_healing",
      "description": "Propose a repair for a failed selector",
      "input": {
        "nodeId": "string",
        "originalSelector": "string",
        "errorMessage": "string"
      },
      "output": { "repair": "RepairProposal" }
    },
    {
      "name": "verify_healing",
      "description": "Verify a proposed repair",
      "input": {
        "flowId": "string",
        "nodeId": "string",
        "newSelector": "string"
      },
      "output": {
        "verified": "boolean",
        "confidence": "number",
        "evidence": "Evidence"
      }
    },
    {
      "name": "get_coverage",
      "description": "Get test coverage analysis",
      "input": { "projectId": "string" },
      "output": { "coverage": "CoverageReport" }
    },
    {
      "name": "select_tests",
      "description": "Select relevant tests for a code change",
      "input": { "projectId": "string", "changeDescription": "string" },
      "output": { "selectedFlows": "Flow[]", "reasoning": "string" }
    }
  ]
}
```

---

## 13. Framework Abstraction

### 13.1 Current Playwright Coupling

HalTest is heavily coupled to Playwright in:

- `ActionExecutor.js` — `playwright` type imports, Playwright-specific utils
- Plugin handlers — each calls Playwright API directly
- Selector utils — Playwright locator construction
- Browser service — Playwright browser lifecycle
- Code generation — Playwright-specific output
- Screenshot/video — Playwright capture

### 13.2 Proposed Abstraction Layer

```
HalTest Test Model (framework-agnostic)
       ↓
Execution Adapter Interface
       ↓
┌──────┴──────┐
│ Playwright   │  ← current, fully functional
│ Adapter      │
├──────────────┤
│ Selenium     │  ← future, via WebDriver
│ Adapter      │
├──────────────┤
│ Cypress      │  ← future, via cy.* API
│ Adapter      │
└──────────────┘
```

**Abstraction boundary:**

```javascript
// ExecutionAdapter interface
class ExecutionAdapter {
  async launchBrowser(config) {}
  async getContext(browserId) {}
  async getPage(contextId) {}
  async navigate(page, url, options) {}
  async click(page, selector, options) {}
  async type(page, selector, text, options) {}
  async screenshot(page, options) {}
  async evaluate(page, code) {}
  async locator(page, selector) {}
  async waitForSelector(page, selector, options) {}
  // ... etc
}
```

**Implementation strategy:** Do NOT build multiple adapters now. Build the interface. Wrap the existing Playwright calls behind it. Future adapters can implement the interface without rewriting the plugin system.

---

## 14. Scalability Architecture

### 14.1 Current Limitations

| Area         | Current                             | Limitation                                  |
| ------------ | ----------------------------------- | ------------------------------------------- |
| DB           | SQLite (local) / Postgres (prod)    | SQLite: single writer, no concurrent writes |
| Browser pool | MAX 5 browsers                      | Memory-limited, no distributed pool         |
| Execution    | Sequential node execution           | Single flow at a time per user              |
| Batch        | TestRunnerService with worker queue | In-memory queue, no persistence             |
| Storage      | File-based (STORAGE_DIR)            | No object storage, no CDN                   |
| AI requests  | Synchronous per-call                | No queuing, rate limited by provider        |
| Logs         | In-memory + SQLite                  | No structured log aggregation               |

### 14.2 Proposed Scaling Path

```
Phase 1 (P5): Local multi-user
  - Postgres required (not optional)
  - ExecutionLock → distributed lock (Redis/DB advisory)
  - Browser pool → per-user isolation
  - Storage → S3-compatible object storage

Phase 2 (P5): Distributed execution
  - Worker nodes register with backend
  - Queue: BullMQ / Redis
  - Workers: headless browser containers
  - Artifact storage: S3

Phase 3 (P5): Multi-tenant SaaS
  - Tenant isolation at DB level
  - Per-tenant AI provider config
  - Rate limiting per tenant
  - RBAC: owner/admin/editor/viewer
```

---

## 15. Security Architecture

### 15.1 Current Security

- SSRF guards on AI base URLs (sanitizeBaseUrl)
- CORS origin allow-list + private IP detection
- Helmet CSP headers
- JWT auth via Supabase
- ExecutionLock for flow-level concurrency
- SafetyGate for flow validation
- `isSafePath` for file operations
- HALTEST_MASTER_ENCRYPTION_KEY for API key vault

### 15.2 Proposed Security Enhancements

```
1. AI Data Pipeline
   - PII scanner (regex + entropy + Luhn) — exists in SensitiveDataScanner
   - Request sanitization before AI calls
   - Response validation (no PII leaked back)
   - Audit log of all AI interactions
   - Configurable data retention (default 30 days)

2. Secrets Management
   - Environment variable injection (not stored in flow JSON)
   - KeyVault already exists — extend for flow-level secrets
   - Never log secrets (redact in logs)
   - Never send secrets to AI providers

3. Execution Security
   - Sandboxed browser contexts per user
   - Network isolation for execution browsers
   - File upload restrictions (allowed types, size limits)
   - CSP enforcement in execution browsers

4. API Security
   - Rate limiting per endpoint (already exists for /api)
   - RBAC (owner/admin/editor/viewer) — already partially exists
   - Audit trail for all mutations
   - Input validation on all endpoints (Joi/Zod)
```

---

## 16. Migration Strategy

### 16.1 Database Migration Priority

**CRITICAL — Must be fixed immediately:**

1. **Replace migration 2** (`20260913000000-fix-schema-mismatch.js`) with a single migration that:
   - Checks if migration 1 has run
   - If migration 1 ran with old schema: drops ALL 15 tables, recreates with correct schema
   - If migration 1 ran with correct schema: no-op (idempotent)
   - Aligns all columns between models and migrations

2. **Fix AIUsageLog dual schema** — Pick one: either the model's `ai_usage_log` table or the migration's `AIUsageLogs`. Prefer the model's (richer schema). Remove the other.

3. **Add missing StepResult columns** — `screenshot_path`, `memory_hit`, `video_timestamp`, `ai_diagnosis`, `updatedAt`

4. **Fix Run model** — Add `finished_at`, `video_path`, `browser_version`; rename `error` column reference

### 16.2 Feature Flag Strategy

For agentic features, use environment variables as feature flags:

```bash
# Agentic features
HALTEST_AGENTS_ENABLED=false        # Master switch
HALTEST_AGENT_PLANNER=false         # Planner agent
HALTEST_AGENT_EXPLORER=false        # Application explorer
HALTEST_AGENT_HEALING_AUTO=false    # Auto-apply healing
HALTEST_AGENT_SELECTION=false       # Intelligent test selection
HALTEST_AGENT_COVERAGE=false        # Coverage analysis

# MCP
HALTEST_MCP_ENABLED=true            # MCP server
HALTEST_MCP_TOOLS=all               # or: canvas,healing,planning

# Evidence
HALTEST_EVIDENCE_ENABLED=true       # Full evidence collection
HALTEST_EVIDENCE_RETENTION=30d      # Retention period
```

### 16.3 Backward Compatibility

- All existing flows must continue to work without modification
- New fields in node schema are optional
- New database tables are additive (no modifications to existing)
- New API endpoints are additive
- Plugin system is backward compatible (existing plugins work)
- CLI commands are backward compatible

---

## 17. Benchmark vs Ecosystem

### 17.1 Competitor Comparison

| Capability         | Playwright | Cypress | Selenium | AI Test Gen | Self-Heal | Visual Test | HalTest Target |
| ------------------ | ---------- | ------- | -------- | ----------- | --------- | ----------- | -------------- |
| Visual canvas      | ❌         | ❌      | ❌       | ❌          | ❌        | ❌          | ✅             |
| Deterministic      | ✅         | ✅      | ✅       | ❌          | ⚠️        | ✅          | ✅             |
| Self-healing       | ❌         | ❌      | ❌       | ⚠️          | ✅        | ❌          | ✅             |
| AI planning        | ❌         | ❌      | ❌       | ✅          | ❌        | ❌          | ✅             |
| Multi-domain       | ❌         | ❌      | ❌       | ❌          | ❌        | ❌          | ✅             |
| Self-hosted        | ✅         | ✅      | ✅       | ⚠️          | ⚠️        | ✅          | ✅             |
| Framework-agnostic | N/A        | N/A     | N/A      | ⚠️          | ❌        | ⚠️          | ✅             |
| MCP integration    | ✅         | ❌      | ❌       | ⚠️          | ❌        | ❌          | ✅             |
| No-code            | ❌         | ❌      | ❌       | ⚠️          | ⚠️        | ❌          | ✅             |
| Collaboration      | ❌         | ❌      | ❌       | ❌          | ❌        | ❌          | ✅             |

### 17.2 HalTest Differentiation

**Commodity** (everyone has these):

- Browser automation
- Selector-based interaction
- Screenshot capture
- CI/CD integration
- Code generation

**Important** (differentiates from basic tools):

- Visual flow editor
- Self-healing
- AI assistance
- Performance testing
- Security scanning
- Collaboration

**Distinguishing** (unique to HalTest):

- Intent-based flow creation with human approval
- Deterministic verification of AI-proposed repairs
- Unified quality domain (automation + performance + security + accessibility)
- Visual + code + API interfaces (not just one)
- Self-hosted with AI capabilities
- Knowledge graph connecting intent → test → element → defect

**Unnecessary** (don't build):

- Full application monitoring (use existing APM tools)
- CI/CD pipeline builder (wrap existing tools)
- Custom AI model training (use existing models)
- IDE plugin (MCP serves this)

---

## 18. Implementation Roadmap

### P0 — Foundation (Estimated: 2-3 weeks)

Fix critical technical debt before adding intelligence.

#### P0.1: Database Migration Fix

- **Why:** Migration 2 is un-runnable on fresh DB; StepResult/Run columns mismatched → runtime failures
- **Current:** `20260912000000-initial-schema.js` creates 15 tables; `20260913000000-fix-schema-mismatch.js` only drops 6, tries to create 9 existing tables
- **Files:** `apps/backend/database/migrations/20260913000000-fix-schema-mismatch.js`, `apps/backend/database/models/Run.js`, `apps/backend/database/models/StepResult.js`, `apps/backend/database/models/AIUsageLog.js`
- **Dependencies:** None
- **DB changes:** Single idempotent migration that handles both fresh DB and existing DB; align Run model (finished_at, video_path, browser_version); align StepResult model (INTEGER id, input_data/output_data, screenshot_path, memory_hit, video_timestamp, ai_diagnosis, updatedAt); consolidate AIUsageLog to single table
- **API changes:** None
- **Frontend changes:** None
- **Backend changes:** ExecutionLogger.endRun(), ExecutionLogger.logStep() must use correct column names
- **Risk:** Medium — must handle both fresh install and upgrade
- **Complexity:** Medium
- **Priority:** P0
- **Acceptance criteria:**
  - Fresh DB: all 15 tables created successfully
  - Existing DB: migration applies without data loss
  - ExecutionLogger.endRun() completes without column errors
  - ExecutionLogger.logStep() persists all fields
  - AIUsageLog writes to single table

#### P0.2: Execution Evidence Collection

- **Why:** Without evidence, no AI diagnosis or human approval is possible
- **Current:** StepResult captures status/error but not screenshots, DOM snapshots, network logs, or AI reasoning at step level
- **Files:** `apps/backend/core/ActionExecutor.js`, `apps/backend/services/ExecutionLogger.js`, `apps/backend/services/ExecutionService.js`
- **Dependencies:** P0.1
- **DB changes:** Ensure screenshot_path, memory_hit, video_timestamp, ai_diagnosis columns exist
- **API changes:** GET /api/runs/:runId/steps/:stepId/evidence — new endpoint
- **Frontend changes:** New ExecutionEvidencePanel component (display evidence for a step)
- **Backend changes:** ActionExecutor must capture DOM snapshot on failure, pass evidence to logStep
- **Risk:** Low — additive changes only
- **Complexity:** Medium
- **Priority:** P0
- **Acceptance criteria:**
  - Failed step includes screenshot path
  - Failed step includes DOM snapshot (compressed)
  - Failed step includes console errors array
  - Evidence retrievable via API
  - Evidence displayed in run detail view

#### P0.3: Frontend Node Definition Sync

- **Why:** Frontend hardcodes NODE_CATEGORIES/NODE_OUTPUTS/NODE_INPUTS; backend has plugin manifests — they drift
- **Current:** `apps/frontend/src/config/nodeConstants.js` (1127 lines), `apps/frontend/src/config/validationRules.js` (1792 lines) hardcoded; backend `GET /api/nodes/definitions` exists but frontend only loads once
- **Files:** `apps/frontend/src/config/nodeConstants.js`, `apps/frontend/src/config/validationRules.js`, `apps/backend/core/NodeRegistry.js`, `apps/frontend/src/hooks/useNodeDefinitions.js`
- **Dependencies:** None
- **DB changes:** None
- **API changes:** Enhance GET /api/nodes/definitions to include output schemas and validation rules
- **Frontend changes:** useNodeDefinitions hook fetches from backend and updates NODE_TYPE_MAP/NODE_OUTPUTS dynamically
- **Backend changes:** NodeRegistry.getFrontendDefinitions() includes output schemas from plugin manifests
- **Risk:** Medium — affects all node rendering
- **Complexity:** Medium
- **Priority:** P0
- **Acceptance criteria:**
  - Backend is single source of truth for node types, categories, inputs, outputs
  - Frontend dynamically loads definitions from backend
  - Adding a new node type in backend automatically appears in frontend
  - No hardcoded node type lists in frontend

#### P0.4: App.jsx Decomposition

- **Why:** 2,945-line monolith makes feature development slow and risky
- **Current:** `apps/frontend/src/App.jsx` contains Dashboard (2894 lines), all canvas logic, settings, modals, dialogs
- **Files:** `apps/frontend/src/App.jsx`, `apps/frontend/src/components/Dashboard.jsx` (to be created)
- **Dependencies:** None
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** Extract Dashboard component, extract ModalManager, extract CanvasWorkspace, extract SettingsManager
- **Backend changes:** None
- **Risk:** Low — pure refactor, no behavior change
- **Complexity:** High (many inline state dependencies)
- **Priority:** P0
- **Acceptance criteria:**
  - App.jsx < 200 lines
  - Dashboard extracted to separate file
  - All modals in separate ModalManager
  - All existing functionality works identically
  - No visual changes

#### P0.5: Dead Code & Cleanup

- **Why:** Dead code increases maintenance burden and confusion
- **Current:** `execution.controller.js` (0 bytes), `apps/web/legacy_backup/`, tracked 0-byte backups, `storage/` junk files, `sync_i18n.py`/`translate_constants.py`/`test-dagre.js` at root, version drift
- **Files:** Various
- **Dependencies:** None
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** Remove legacy IndexedDB usage (Dexie) if confirmed unused
- **Backend changes:** Delete `execution.controller.js`, clean `apps/backend/backups/`
- **Risk:** Very low
- **Complexity:** Low
- **Priority:** P0
- **Acceptance criteria:**
  - No 0-byte tracked files
  - No unused controller files
  - `apps/web/legacy_backup/` removed or gitignored
  - Version numbers synchronized across all packages
  - Root directory cleaned of orphan scripts

---

### P1 — Core Intelligence (Estimated: 3-4 weeks)

Build the foundation for agentic capabilities.

#### P1.1: Enhanced Assertion Engine

- **Why:** Assertions are the foundation of quality intelligence; current 9 strategies are DOM-only
- **Current:** 9 strategies (existence, visibility, text, count, attribute, value, state, css_property, page)
- **Files:** `apps/backend/plugins/core-assertion/engine/strategies/`, `apps/frontend/src/config/validationRules.js` (assert node config)
- **Dependencies:** P0.1
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** Assertion editor enhanced with new types in node config
- **Backend changes:** Add accessibility, network, console, performance assertion strategies
- **Risk:** Low — additive to existing strategy pattern
- **Complexity:** Medium
- **Priority:** P1
- **Acceptance criteria:**
  - Accessibility assertion strategy (has_role, has_name, is_accessible)
  - Network assertion strategy (request_made, no_errors)
  - Console assertion strategy (no_console_errors)
  - Performance assertion strategy (load_time_under)
  - All new strategies have unit tests
  - Frontend assertion editor shows new strategy options

#### P1.2: AI Service Enhancement

- **Why:** Current AI only heals selectors and generates simple flows; needs richer interaction
- **Current:** `apps/backend/services/AIService.js` with generateText, generateStructured, generateFlow, healSelector
- **Files:** `apps/backend/services/AIService.js`, `apps/backend/plugins/core-ai/handlers/call_llm.js`
- **Dependencies:** None
- **DB changes:** None
- **API changes:** POST /api/ai/analyze-flow — analyze flow for issues; POST /api/ai/suggest-assertions — suggest assertions for a flow
- **Frontend changes:** AI panel enhanced with flow analysis results
- **Backend changes:** Add analyzeFlow(), suggestAssertions(), diagnoseFailure() methods
- **Risk:** Low — additive methods
- **Complexity:** Medium
- **Priority:** P1
- **Acceptance criteria:**
  - AI can analyze a flow and suggest improvements
  - AI can suggest assertions based on flow actions
  - AI can diagnose failure from execution evidence
  - All methods respect token/cost limits

#### P1.3: Observability Layer

- **Why:** Cannot diagnose AI decisions without audit trail
- **Current:** Socket.IO events for execution; console.log for healing; AIUsageLog for token tracking
- **Files:** `apps/backend/services/ExecutionService.js`, `apps/backend/core/ActionExecutor.js`, `apps/backend/services/AIService.js`
- **Dependencies:** P0.2
- **DB changes:** New `AIDecisionLog` table (agent, action, input_summary, output_summary, reasoning, confidence, timestamp)
- **API changes:** GET /api/observations/decisions — list AI decisions; GET /api/observations/decisions/:id — detail
- **Frontend changes:** Observability panel in dashboard showing AI decision timeline
- **Backend changes:** Structured logging throughout execution and AI pipelines
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P1
- **Acceptance criteria:**
  - Every AI call logged with reasoning and confidence
  - Every healing attempt logged with before/after state
  - Decision timeline viewable in dashboard
  - Decisions filterable by agent type, confidence, outcome

#### P1.4: MCP Server Rewrite

- **Why:** Current MCP is mostly stubs; agents need real integration
- **Current:** `apps/backend/services/HalTestMCPServer.js` (5 tools, 2 stubs), `apps/backend/mcp/canvasTools.js` (8 tools, working)
- **Files:** `apps/backend/services/HalTestMCPServer.js`, `apps/backend/mcp/`
- **Dependencies:** P0.3
- **DB changes:** None
- **API changes:** MCP tools updated to real implementations
- **Frontend changes:** None (MCP is backend-only)
- **Backend changes:** Rewrite get_canvas_flow to return real data; rewrite update_canvas_nodes to persist changes
- **Risk:** Medium — MCP integration is used by external tools
- **Complexity:** Medium
- **Priority:** P1
- **Acceptance criteria:**
  - get_canvas_flow returns real flow data from database
  - update_canvas_nodes persists changes to database
  - All tools have proper error handling
  - MCP server passes integration tests

---

### P2 — Agentic Features (Estimated: 4-6 weeks)

Build the agent capabilities.

#### P2.1: Application Explorer Agent

- **Why:** AI needs to understand the application to generate meaningful tests
- **Current:** `AccessibilityTreePlanner.js` parses accessibility trees but doesn't explore/memorize
- **Files:** `apps/backend/services/agents/AccessibilityTreePlanner.js`, `apps/backend/services/agents/` (new files)
- **Dependencies:** P1.2
- **DB changes:** `ApplicationMaps` table (see Section 11.1)
- **API changes:** POST /api/projects/:id/explore — trigger exploration; GET /api/projects/:id/application-map — get map
- **Frontend changes:** Exploration status panel, application map visualization
- **Backend changes:** New ExplorerAgent class that navigates pages, discovers elements, builds ApplicationMap
- **Risk:** Medium — new capability, needs thorough testing
- **Complexity:** High
- **Priority:** P2
- **Acceptance criteria:**
  - Explorer can navigate a web application from a base URL
  - Explorer discovers pages, forms, buttons, links, modals
  - Explorer builds ApplicationMap with page structure
  - Explorer stores map in ApplicationMaps table
  - Explorer respects authentication (can log in first)
  - Explorer has depth limit (prevent infinite crawl)

#### P2.2: Planner Agent

- **Why:** Natural language → test flow creation with intelligence
- **Current:** `AIService.generateFlow()` generates simple flows with limited node types (7)
- **Files:** `apps/backend/services/AIService.js`, `apps/backend/services/agents/` (new PlannerAgent.js)
- **Dependencies:** P1.2, P2.1 (optional, uses ApplicationMap if available)
- **DB changes:** None
- **API changes:** POST /api/ai/plan-flow — enhanced intent-to-flow with context
- **Frontend changes:** Flow creation wizard with intent input
- **Backend changes:** PlannerAgent that uses ApplicationMap, existing flows, and AI to propose comprehensive flows
- **Risk:** Medium — AI-generated flows need SafetyGate validation
- **Complexity:** High
- **Priority:** P2
- **Acceptance criteria:**
  - Planner generates flows from natural language intent
  - Planner uses ApplicationMap when available for context
  - Planner respects SafetyGate validation
  - Generated flows include all necessary node types (not just 7)
  - Human can review and approve/reject before flow is created
  - Token usage logged

#### P2.3: Enhanced Self-Healing with Human Approval

- **Why:** Current healing auto-applies without human oversight
- **Current:** ActionExecutor healing pipeline (Section 10.1)
- **Files:** `apps/backend/core/ActionExecutor.js`, `apps/backend/services/SelectorHealer.js`, `apps/backend/services/ExperienceVaultService.js`
- **Dependencies:** P0.2, P1.3
- **DB changes:** Add `confidence` and `requiresApproval` to HealingLog
- **API changes:** POST /api/healing/:id/approve — approve healing; POST /api/healing/:id/reject — reject
- **Frontend changes:** Healing approval panel with evidence display
- **Backend changes:** Add approval gate based on confidence threshold; add rollback capability
- **Risk:** Medium — changes healing behavior
- **Complexity:** High
- **Priority:** P2
- **Acceptance criteria:**
  - Healing with confidence >= 0.8 can auto-apply (configurable)
  - Healing with confidence 0.5-0.8 shows approval panel
  - Healing with confidence < 0.5 requires manual action
  - All healing attempts logged with evidence
  - Healing can be rolled back
  - Healing verification runs after apply

#### P2.4: Failure Diagnosis Agent

- **Why:** Current healing only fixes selectors; doesn't diagnose root causes
- **Current:** SelectorHealer only; NetworkConsoleHealer for network errors
- **Files:** `apps/backend/services/agents/` (new DiagnoserAgent.js), `apps/backend/services/SelectorHealer.js`
- **Dependencies:** P0.2, P1.2
- **DB changes:** None
- **API changes:** POST /api/diagnose/:runId/:nodeId — get diagnosis
- **Frontend changes:** Failure diagnosis panel with evidence and reasoning
- **Backend changes:** DiagnoserAgent that classifies failures and proposes targeted repairs
- **Risk:** Low — additive
- **Complexity:** High
- **Priority:** P2
- **Acceptance criteria:**
  - Agent classifies failure type (selector, timing, state, network, auth, assertion)
  - Agent reads DOM snapshot, console logs, network requests
  - Agent provides root cause analysis with confidence
  - Agent recommends specific action (heal selector, add wait, fix auth, etc.)
  - Diagnosis results viewable in run detail

---

### P3 — Intelligence (Estimated: 3-4 weeks)

Build quality intelligence features.

#### P3.1: Quality Knowledge Graph

- **Why:** Cannot answer "what is affected?" without relationship data
- **Current:** FlowTags, FlowDependencies, ElementMappings don't exist
- **Files:** `apps/backend/database/migrations/` (new), `apps/backend/database/models/` (new)
- **Dependencies:** P0.1
- **DB changes:** FlowTags, FlowDependencies, ElementMappings, DefectRecords tables
- **API changes:** CRUD for tags, dependencies, mappings; query endpoints for impact analysis
- **Frontend changes:** Flow tagging UI, dependency visualization
- **Backend changes:** New services for graph queries
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P3
- **Acceptance criteria:**
  - Flows can be tagged with requirements/features
  - Flow dependencies tracked
  - Nodes mapped to application elements
  - Defect records linked to runs and nodes
  - Impact queries return correct results

#### P3.2: Coverage Analysis

- **Why:** Cannot identify gaps in test coverage
- **Current:** No coverage tracking exists
- **Files:** `apps/backend/services/agents/` (new CoverageAgent.js)
- **Dependencies:** P2.1, P3.1
- **DB changes:** None
- **API changes:** GET /api/coverage/:projectId — coverage report
- **Frontend changes:** Coverage dashboard
- **Backend changes:** CoverageAgent analyzes ApplicationMap vs existing flows
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P3
- **Acceptance criteria:**
  - Coverage report shows covered/uncovered application elements
  - Coverage report shows covered/uncovered workflows
  - Coverage trends tracked over time
  - Gaps identified and prioritized by risk

#### P3.3: Intelligent Test Selection

- **Why:** Running all tests on every change is wasteful
- **Current:** TestRunnerService runs batch of flows with concurrency
- **Files:** `apps/backend/services/TestRunnerService.js`, `apps/backend/services/agents/` (new SelectionAgent.js)
- **Dependencies:** P3.1
- **DB changes:** None
- **API changes:** POST /api/test-selection — select tests for change
- **Frontend changes:** Selection results panel
- **Backend changes:** SelectionAgent analyzes code change → affected features → relevant tests
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P3
- **Acceptance criteria:**
  - Selection agent identifies affected flows from change description
  - Selection agent ranks flows by relevance and risk
  - Selection considers historical failure rates
  - Selection results include reasoning

#### P3.4: Healing History Analytics

- **Why:** Need to understand healing patterns to improve
- **Current:** HealingLog exists but no analytics
- **Files:** `apps/backend/services/` (new HealingAnalyticsService.js)
- **Dependencies:** P2.3
- **DB changes:** None
- **API changes:** GET /api/analytics/healing — healing statistics
- **Frontend changes:** Healing analytics dashboard
- **Backend changes:** Analytics service aggregating healing patterns
- **Risk:** Low — additive
- **Complexity:** Low
- **Priority:** P3
- **Acceptance criteria:**
  - Healing success rate by failure type
  - Most common healed selectors
  - Healing confidence distribution
  - Flakiness heatmap (flows with most healing)

---

### P4 — Ecosystem (Estimated: 3-4 weeks)

Build external integrations.

#### P4.1: MCP Server Full Implementation

- **Why:** External agents need full access to HalTest capabilities
- **Current:** Partial MCP (Section 12.1)
- **Files:** `apps/backend/services/HalTestMCPServer.js`, `apps/backend/mcp/`
- **Dependencies:** P1.4, P2.2
- **DB changes:** None
- **API changes:** MCP tools per Section 12.2
- **Frontend changes:** None
- **Backend changes:** Implement all planned MCP tools
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P4
- **Acceptance criteria:**
  - All 12 MCP tools implemented
  - Tools have proper error handling
  - Tools respect authentication
  - MCP server passes integration tests

#### P4.2: Framework Abstraction Interface

- **Why:** Future-proof for Selenium/Cypress adapters
- **Current:** Tightly coupled to Playwright
- **Files:** `apps/backend/core/` (new ExecutionAdapter.js), `apps/backend/plugins/core-browser/handlers/`
- **Dependencies:** None
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** None
- **Backend changes:** Define ExecutionAdapter interface; wrap Playwright calls in PlaywrightAdapter
- **Risk:** Low — interface-only, no behavior change
- **Complexity:** Medium
- **Priority:** P4
- **Acceptance criteria:**
  - ExecutionAdapter interface defined
  - PlaywrightAdapter implements interface
  - All existing functionality works through adapter
  - Interface documented for future adapters

#### P4.3: CI/CD Integration Enhancement

- **Why:** CLI is published but integration with CI/CD is basic
- **Current:** CLI runs flows, GitHub Actions release workflow
- **Files:** `apps/cli/src/`, `.github/workflows/`
- **Dependencies:** None
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** None
- **Backend changes:** CLI enhanced with JSON output, exit codes, parallel execution
- **Risk:** Low
- **Complexity:** Low
- **Priority:** P4
- **Acceptance criteria:**
  - CLI outputs JSON for CI parsing
  - CLI exits with correct codes (0=pass, 1=fail, 2=error)
  - CLI supports --parallel flag
  - CLI supports --filter flag (select specific flows)

#### P4.4: AI Governance Implementation

- **Why:** Enterprise customers need data control
- **Current:** SSRF guards exist; no PII scanning or redaction
- **Files:** `apps/backend/services/` (new AIGovernanceService.js), `apps/backend/services/security/`
- **Dependencies:** P1.3
- **DB changes:** `AIAuditLog` table (request/response summaries, redacted)
- **API changes:** GET /api/ai/audit — audit log
- **Frontend changes:** AI governance dashboard
- **Backend changes:** PII scanner (uses existing SensitiveDataScanner), request redactor, response validator
- **Risk:** Low — additive
- **Complexity:** Medium
- **Priority:** P4
- **Acceptance criteria:**
  - PII detected and redacted before AI calls
  - Secrets never sent to AI providers
  - AI responses validated for PII leakage
  - Full audit trail of AI interactions
  - Configurable data retention

---

### P5 — Enterprise (Estimated: 4-6 weeks)

Build enterprise-grade features.

#### P5.1: Multi-User Architecture

- **Why:** Current design is single-user; collaboration is via Yjs but execution is per-user
- **Current:** Single-user SQLite, in-memory execution locks
- **Files:** `apps/backend/services/ExecutionService.js`, `apps/backend/services/collaboration/ExecutionLock.js`
- **Dependencies:** P0.1
- **DB changes:** Postgres required for concurrent writes
- **API changes:** User management endpoints
- **Frontend changes:** User switching, role display
- **Backend changes:** Postgres-first, distributed execution lock, per-user browser pool
- **Risk:** High — fundamental architecture change
- **Complexity:** High
- **Priority:** P5
- **Acceptance criteria:**
  - Multiple users can execute flows concurrently
  - Execution locks work across processes
  - User roles enforced (owner/admin/editor/viewer)
  - Per-user browser pool isolation

#### P5.2: Distributed Execution

- **Why:** Scaling beyond single machine
- **Current:** TestRunnerService with in-memory worker queue
- **Files:** `apps/backend/services/TestRunnerService.js`, `apps/backend/services/ExecutionManager.js`
- **Dependencies:** P5.1
- **DB changes:** Queue persistence table
- **API changes:** Worker registration endpoints
- **Frontend changes:** Worker status dashboard
- **Backend changes:** BullMQ/Redis queue, worker registration, artifact distribution
- **Risk:** High — distributed systems complexity
- **Complexity:** Very High
- **Priority:** P5
- **Acceptance criteria:**
  - Workers register with backend
  - Flows distributed to available workers
  - Artifacts stored in S3-compatible storage
  - Worker health monitoring
  - Automatic worker replacement

#### P5.3: RBAC & Audit

- **Why:** Enterprise compliance requirements
- **Current:** Basic CollaboratorRole (owner/editor), no audit trail
- **Files:** `apps/backend/middlewares/auth.middleware.js`, `apps/backend/database/models/`
- **Dependencies:** P5.1
- **DB changes:** AuditLog table
- **API changes:** RBAC middleware, audit query endpoints
- **Frontend changes:** Role management UI, audit log viewer
- **Backend changes:** Permission checking middleware, audit logging
- **Risk:** Medium
- **Complexity:** Medium
- **Priority:** P5
- **Acceptance criteria:**
  - Roles: owner, admin, editor, viewer
  - Permissions checked on all mutations
  - All mutations logged to audit trail
  - Audit trail queryable and exportable

#### P5.4: Self-Hosted Enterprise Package

- **Why:** Air-gapped enterprises need full offline capability
- **Current:** Docker compose exists but persistence is misconfigured
- **Files:** `Dockerfile`, `docker-compose.yml`, `DOCKER.md`
- **Dependencies:** P5.1
- **DB changes:** None
- **API changes:** None
- **Frontend changes:** None
- **Backend changes:** Fix Docker persistence (HALTEST_HOME env), add healthcheck, add backup automation
- **Risk:** Low — infrastructure only
- **Complexity:** Medium
- **Priority:** P5
- **Acceptance criteria:**
  - Docker compose persistence works correctly
  - Healthcheck endpoint returns status
  - Backup/restore works
  - All AI features work with local Ollama
  - No external network dependencies for core functionality

---

## Appendix A: Critical Files Reference

| Area      | File                                                                  | Lines | Purpose                                   |
| --------- | --------------------------------------------------------------------- | ----- | ----------------------------------------- |
| Entry     | `apps/backend/app.js`                                                 | 471   | Server setup, middleware, routes, startup |
| Execution | `apps/backend/services/ExecutionService.js`                           | 2500  | Flow execution orchestrator               |
| Execution | `apps/backend/core/ActionExecutor.js`                                 | 1027  | Node action executor with healing         |
| Healing   | `apps/backend/services/SelectorHealer.js`                             | ~500  | AI selector healing                       |
| Healing   | `apps/backend/services/ExperienceVaultService.js`                     | ~200  | Selector memory                           |
| Assertion | `apps/backend/plugins/core-assertion/engine/AssertionEngine.js`       | 120   | Assertion dispatcher                      |
| Assertion | `apps/backend/plugins/core-assertion/engine/AssertionBaseStrategy.js` | 129   | Strategy registry                         |
| AI        | `apps/backend/services/AIService.js`                                  | ~1200 | LLM integration                           |
| Plugin    | `apps/backend/core/pluginBootstrap.js`                                | ~200  | Plugin registration                       |
| Registry  | `apps/backend/core/NodeRegistry.js`                                   | ~200  | Node type registry                        |
| DB        | `apps/backend/database/init.js`                                       | 287   | DB initialization + seed                  |
| Migration | `apps/backend/database/migrations/20260912000000-initial-schema.js`   | 922   | Initial 15-table schema                   |
| Frontend  | `apps/frontend/src/App.jsx`                                           | 2945  | Monolithic app component                  |
| Config    | `apps/frontend/src/config/nodeConstants.js`                           | 1127  | Node definitions (hardcoded)              |
| Config    | `apps/frontend/src/config/validationRules.js`                         | 1792  | Node input validation (hardcoded)         |
| MCP       | `apps/backend/services/HalTestMCPServer.js`                           | 196   | MCP server (partial)                      |
| MCP       | `apps/backend/mcp/canvasTools.js`                                     | 340   | Canvas MCP tools                          |
| Export    | `apps/backend/services/exporter/index.js`                             | 148   | Code generation dispatcher                |
| Flow      | `apps/backend/core/FlowResolver.js`                                   | 279   | Subflow resolution                        |
| Routes    | `apps/backend/routes/project.router.js`                               | 1612  | Project/flow CRUD                         |
| Routes    | `apps/backend/routes/run.router.js`                                   | ~300  | Execution endpoints                       |

## Appendix B: Schema Drift Summary (Urgent)

| Table                           | Migration Says                | Model Says                      | Impact                          |
| ------------------------------- | ----------------------------- | ------------------------------- | ------------------------------- |
| `execution_runs.completed_at`   | `completed_at` DATE           | `finished_at` DATE              | endRun() writes to wrong column |
| `execution_runs.error`          | `error` TEXT                  | — (no column)                   | error data lost                 |
| `execution_runs.flow_snapshot`  | JSONB                         | TEXT                            | type mismatch                   |
| `execution_runs.status default` | `'pending'`                   | `'running'`                     | wrong initial state             |
| `step_results.id`               | STRING PK                     | INTEGER autoincrement           | ID type mismatch                |
| `step_results.input/output`     | `input`/`output` JSONB        | `input_data`/`output_data` JSON | column name mismatch            |
| `step_results.screenshot_path`  | — (missing)                   | STRING                          | screenshot data lost            |
| `step_results.memory_hit`       | — (missing)                   | BOOLEAN                         | memory hit data lost            |
| `step_results.video_timestamp`  | — (missing)                   | FLOAT                           | video timestamp lost            |
| `step_results.ai_diagnosis`     | — (missing)                   | TEXT                            | AI diagnosis lost               |
| `step_results.updatedAt`        | — (missing)                   | DATE (timestamps:true)          | Sequelize update fails          |
| `AIUsageLogs` vs `ai_usage_log` | STRING id, camelCase cols     | INTEGER id, snake_case cols     | Two different tables            |
| `CollaboratorRoles`             | non-unique [projectId,userId] | unique [projectId,userId]       | duplicate rows possible         |

## Appendix C: Glossary

| Term                           | Definition                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------- |
| **Agentic QE**                 | Quality Engineering powered by AI agents with deterministic verification        |
| **ExperienceVault**            | Persistent memory of successful selector repairs                                |
| **SafetyGate**                 | Multi-layer flow validation (structural, policy, golden dataset)                |
| **ExecutionAdapter**           | Framework-agnostic interface for browser automation                             |
| **ApplicationMap**             | Structured representation of a web application's pages, elements, and workflows |
| **Knowledge Graph**            | Relational model linking requirements → tests → elements → defects              |
| **Deterministic Verification** | Process of verifying AI-proposed changes through actual execution               |
| **Human Approval Gate**        | UI checkpoint requiring human confirmation before applying AI changes           |
| **Confidence Score**           | 0.0-1.0 score indicating certainty of AI-proposed repair                        |
| **Locator Drift**              | Gradual change in web application DOM causing selector failures                 |

---

_Document generated from comprehensive repository analysis of HalTest v1.0.x_
_Architecture assessment date: 2026-09-13_
_Target: Agentic Quality Engineering Platform_
