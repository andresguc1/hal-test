# Jev Feasibility Research for HalTest

## Phase 0 — Repository Discovery (Complete)

### Architecture Overview
HalTest is a monorepo browser automation platform built around Playwright with a Local-First architecture. Key components:

- **Backend** (`apps/backend/`): Node.js/Express API with Playwright automation, SQLite database via Sequelize
- **Frontend** (`apps/frontend/`): React visual flow canvas for defining automations
- **CLI** (`apps/cli/`): Command-line tool
- **AI Integration**: Vercel AI SDK supporting multiple providers (Ollama local, OpenAI, Anthropic, Google, OpenRouter)

### AI Service Flow
```
UI
 ↓
AI API Routes (ai.routes.js)
 ↓
Controller (action.controller.js)
 ↓
ExecutionService.executeFlow()
 ↓
ExecutionManager → Runner (E2ERunner/PerformanceRunner/SecurityRunner)
 ↓
ActionExecutor → Plugin handlers (browser actions)
 ↓
Playwright Browser
```

### Current AI Providers
| Provider | Models | Characteristics |
|----------|--------|-----------------|
| **Ollama** (default) | Local models (gemma3:2b, phi4:mini) | Local, no API key required, variable latency |
| **OpenAI** | gpt-4o, gpt-4o-mini | Cloud, API key required, ~$0.03/1K tokens |
| **Anthropic** | claude-3-5-sonnet | Cloud, API key required |
| **Google/Gemini** | gemini-2.0-flash | Cloud, API key required |
| **OpenRouter** | Various | Cloud aggregator, API key required |

### Data Flow Analysis

#### What stays local:
- Browser state (DOM, screenshots, videos)
- Execution metadata (step results, variables, timing)
- Flow definitions (nodes, edges in DB)
- Credentials (stored encrypted in SQLite)
- Local model weights (Ollama models stored on disk)

#### What could potentially be sent externally:
- DOM snapshots for selector healing
- Screenshot data
- Execution logs and error messages
- Flow configuration
- Variable values

### Local-First Requirements Mapping

| Requirement | Status | Notes |
|------------|--------|-------|
| HalTest functions without connection | ✅ Yes | Ollama local models; all execution is local |
| Jev not required to run a test | ✅ Yes | Can disable AI features entirely |
| User can disable remote AI | ✅ Yes | Headers: `x-hal-auto-healing-enabled`, `x-hal-experience-vault` |
| No automatic PII/secret sending | ✅ Yes | Must sanitize before sending |
| Context minimization possible | ✅ Yes | DOM sanitization already exists |

## Phase 1 — Local-First Architecture Analysis (Complete)

### Data Matrix

| Data Type | Currently Local | Could Send to Jev | Risk |
|-----------|----------------|-------------------|------|
| Locator | ✅ Yes (Playwright) | ⚠️ Only relevant subset | Low - can be sanitized |
| DOM | ✅ Yes (HTML tree) | ⚠️ Relevant subset only | Medium - contains page content |
| Page URL | ✅ Yes | ✅ Safe | Minimal |
| Screenshot | ✅ Yes (file/binary) | ⚠️ Base64 encoded | Medium - visual data |
| Credentials | ✅ Yes (encrypted) | ❌ MUST NOT send | Critical |
| Cookies | ✅ Yes (session) | ⚠️ Session cookies only | Medium - session state |
| Test data | ✅ Yes (variables) | ⚠️ Relevant data only | Low-Medium |
| Execution metadata | ✅ Yes | ✅ Safe | Minimal |
| Error messages | ✅ Yes | ⚠️ May contain PII | Low-Medium |
| DOM snapshots | ✅ Yes | ⚠️ Full DOM can be large | Medium |
| Cookies/session state | ✅ Yes | ⚠️ May contain auth tokens | Medium |
| Credentials/PII | ✅ Yes (encrypted) | ❌ MUST NOT send | **Critical** |

### Key Observations

1. **Ollama already provides local AI**: The system already runs local models via Ollama, satisfying the "Local-First" requirement.

2. **Auto-healing already exists**: `AIService.healSelector()` uses Ollama locally for selector repair. Adding Jev would be an alternative/augmentation.

3. **ExperienceVault**: Stores baseline selectors for auto-healing reuse - this is a deterministic complement to any AI-based healing.

4. **Composite nodes**: Sub-flows within flows have their own context that must be preserved.

5. **Security concerns**: DOM content from web pages could contain malicious content, user data, or PII that must not be sent to external providers.

6. **Configuration controls**: Headers `x-hal-auto-healing-enabled`, `x-hal-experience-vault` already control AI behavior.

## Phase 2 — Jev Technical Research (In Progress)

### What is Jev?

From the TypeSafe AI documentation:

**Jev** is TypeSafe's flagship "System One" model - the first model built for fast, structured decisions that software can consume directly, without text generation or parsing.

**Core Primitives** (3 question types):
1. **Choice** - Choose one option from a defined list
   - Returns: `choice`, `probabilities`, `confidence` (0-1)
   
2. **Score** - Rate state on an ordered rubric
   - Returns: `score`, `legend`, `probabilities`, `confidence` (0-1)
   
3. **Noul** - Yes/no probability question
   - Returns: `noul` (0-1, probability answer is yes)

**Key Characteristics**:
- **No text generation**: Returns typed structured data, not prose
- **Calibrated confidence**: Every answer includes confidence derived from probability distribution
- **Parallel evaluation**: Multiple questions in one request, evaluated independently
- **Millisecond latency**: 70-500ms range
- **Cost economics**: $0.000081 per decision vs $0.013880 for LLM tasks (193.6x cheaper)
- **Type-safe output**: Schema-strict decisions fit TypeScript/Python out of the box
- **Zero hallucinations**: Every decision comes with confidence estimate

### JavaScript SDK Usage
```javascript
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
const client = new TypeSafeClient();
const response = await client.systemOne({
    state: { document: "I was charged twice. Please fix this ASAP." },
    questions: {
        category: choice("What is this ticket about?", {
            billing: null,
            technical: null,
            other: null,
        }),
    },
});
// response.answers.category.choice → "technical"
// response.answers.category.confidence → 0.94
```

### API Endpoint
```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
Content-Type: application/json

{
    "state": "...",
    "model": "jev-latest",
    "questions": {
        "question_id": { ... }
    }
}
```

### Response Structure
```json
{
    "answers": {
        "question_id": {
            "type": "noul" | "choice" | "score",
            "noul": 0.92,           // for Noul type
            "choice": "option_name", // for Choice type
            "score": 2,              // for Score type
            "probabilities": {...},  // distribution
            "confidence": 0.94       // derived from probabilities
        }
    },
    "usage": {
        "input_tokens": 312,
        "output_tokens": 48
    },
    "model": "jev-latest"
}
```

### Models & Aliases
- `jev-latest` - Flagship System One model
- `jev-1` - Specific versioned model
- Model aliases can be registered

### SDK Providers (ai-sdk integration)
```javascript
import { typeSafeAi } from "@ai-sdk/typesafe-ai";
const result = await experimental_evaluate({
    model: typeSafeAi("jev-latest"),
    state: { message: "..." },
    questions: {
        department: choice("Which team?", { billing: null, technical: null, other: null }),
    },
});
```

### Confidence Policy (from docs)
```
>= 0.90    → automatic action
0.75 - 0.89 → suggestion / user confirmation
< 0.75     → human review
```

These are hypotheses - actual thresholds should be determined empirically.

### Critical Limitations

1. **Requires API key + internet**: Jev is a remote service; cannot work offline without connection
2. **Rate limits**: Unknown but typical for AI APIs
3. **Privacy**: DOM/content must be sanitized before sending
4. **No offline fallback**: If API is down, decisions cannot be made
5. **API key management**: Must store `TYPESAFE_API_KEY` securely

### Quick Start (from docs)
```bash
pip install typesafe-sdk    # or: npm install @typesafe-ai/sdk
# Set TYPESAFE_API_KEY env variable
# Then:
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
const client = new TypeSafeClient();
const response = await client.systemOne({ ... });
```

## Phase 3 — Candidate Architecture Abstraction (Pending)

### Proposed DecisionProvider Interface
```typescript
interface Decision<T> {
    choice?: T;
    score?: number;
    noul?: number;
    confidence: number; // 0-1, derived from probability distribution
    probabilities?: Record<string, number>;
    reason?: string;
}

interface DecisionQuestion<T> {
    id: string;
    type: 'choice' | 'score' | 'noul';
    instructions: string;
    criteria?: Record<string, any> | Array<{ legend: string, description?: string }>;
    statePath?: string; // JSON path within state to evaluate
}

interface DecisionProvider {
    decide<T>(
        state: unknown,
        question: DecisionQuestion<T>
    ): Promise<Decision<T>>;
}
```

### Candidate Architecture Diagram

```
DecisionProvider
├── DeterministicDecisionProvider
│   ├── Heuristic-based (regex, DOM inspection, Playwright locators)
│   ├── ExperienceVault lookup (historical successful selectors)
│   ├── Rule-based classification
│   └── Current HalTest baseline
├── LocalDecisionProvider
│   └── Ollama-based (existing AIService.healSelector)
├── JevDecisionProvider
│   └── TypeSafe Jev remote API
└── Future providers (OpenAI, Anthropic, etc.)
```

### Abstraction Goals

1. **Provider-agnostic**: HalTest shouldn't care which provider makes the decision
2. **Configurable**: User chooses which provider to use per-flow/node
3. **Fallback chain**: If Jev fails → fall back to deterministic → fall back to human review
4. **No breaking changes**: HalTest works fully without any DecisionProvider
5. **Observability**: All decisions logged with provider, confidence, and outcome

### Integration Points

| HalTest Component | Integration Point |
|------------------|-------------------|
| Auto-healing | `decide({ state: domSnapshot, question: "Which selector matches?" })` |
| Control classification | `decide({ state: domMetadata, question: "Is this a button?" })` |
| Retry/Heal/Human Review | `decide({ state: errorContext, question: "RETRY/HEAL/ABORT/HUMAN_REVIEW" })` |
| Semantic assertions | `decide({ state: assertionContext, question: "Does this match semantically?" })` |
| History observability | Log decision with provider/confidence |
| Composite nodes | Propagate decision context down the flow |

## Phase 4 — Identify Cases of Use (Pending)

### A. Selector Auto-Healing

**Current implementation**: `AIService.healSelector()` uses Ollama locally with tiered prompts.

**Jev alternative**: Could use Jev's Choice or Noul primitives to select the best selector.

**Question example**:
```json
{
    "selector": choice(
        "Which candidate best represents the intended element?",
        { "#login": "CSS id", "[aria-label='Login']": "ARIA label", "button:has-text('Login')": "Text content", "button.primary": "CSS class" }
    )
}
```

**Information needed**:
- Original failing selector
- DOM context (relevant subset only)
- Element intent/description
- Previous failed selectors (to avoid)

**Privacy**: Only send relevant DOM subset, not full page HTML.

**Threshold considerations**:
- Confidence >= 0.9: Auto-apply repaired selector
- Confidence 0.75-0.89: Show suggestion in UI, user confirms
- Confidence < 0.75: Revert to ExperienceVault or original selector

**False positive/negative analysis**:
- False repair: Applying wrong selector → test fails → user must fix
- False negative: Not repairing → test fails → manual intervention needed
- Current Ollama-based healing has known patterns; Jev needs comparable or better metrics

### B. Control Classification

**Goal**: Classify DOM elements into HTML types.

**Question example** (Choice):
```json
{
    "element_type": choice(
        "What type of DOM element is this?",
        { "button": null, "input": null, "link": null, "checkbox": null, "radio": null, "dropdown": null, "listbox": null, "combobox": null, "textarea": null }
    )
}
```

**Comparison against deterministic approaches**:
- DOM inspection + attribute analysis: Fast, no API cost, no privacy concerns
- Accessibility tree: Built into Playwright, deterministic
- HTML heuristics: `role`, `type` attributes, tag name

**When Jev adds value**:
- Ambiguous elements with complex semantics
- Custom components without clear HTML mapping
- When classification impacts downstream decisions

**Baseline comparison**: Deterministic classification achieves ~95% accuracy for standard HTML elements. Jev would need to significantly outperform this to justify the cost and privacy trade-offs.

### C. Retry / Heal / Human Review

**Decision question** (Choice):
```json
{
    "action": choice(
        "What should HalTest do after this step failed?",
        { "RETRY": "Retry the same action", "HEAL": "Attempt auto-heal", "ABORT": "Stop execution", "HUMAN_REVIEW": "Pause and wait for user" }
    )
}
```

**Inputs to decision**:
- Error type/message
- Previous retry count
- Element state before failure
- Selector confidence
- User configuration (max retries, auto-heal enabled)

**Combining signals**:
```
Jev confidence + deterministic signals + HalTest policy
```

**Policy example**:
```
if Jev.confidence >= 0.9 AND error is transient:
    → automatic retry
elif Jev.confidence >= 0.75:
    → suggest heal, wait for user confirmation
elif Jev.confidence < 0.75:
    → abort and flag for human review
```

**Important**: Final decision MUST remain under HalTest control, not Jev.

### D. Semantic Assertions

**Goal**: Determine if an assertion has semantic meaning beyond deterministic checks.

**Current deterministic assertions** (should NOT be replaced):
- URL equals/regex
- Text equals/regex
- Status code
- Numeric comparison
- Element visible/enabled

**When Jev could help**:
- Natural language assertions: "The page should show a confirmation message"
- Complex semantic checks: "The checkout process completed successfully"
- When the assertion depends on context that's hard to encode deterministically

**Rule**: "AI only when there's a real semantic need, not for simple equality checks."

### E. Classification of Results/Finding

**Goal**: Classify test findings/reports.

**Question example** (Choice):
```json
{
    "finding_type": choice(
        "What type of finding is this?",
        { "performance": null, "accessibility": null, "visual": null, "security": null, "functional": null }
    )
}
```

**Inputs**: Error messages, DOM snapshots, execution metadata.

**Use case**: Automatically categorize failures for reporting and triage.

## Phase 5 — Design the PoC (Pending)

### PoC Objectives

1. **Minimal Jev integration**: Send a simple question and receive a structured answer
2. **Provider abstraction**: Demonstrate the DecisionProvider interface
3. **Fallback chain**: Jev failure → deterministic → no AI
4. **Context sanitization**: Show DOM subset filtering
5. **Confidence-based routing**: Demonstrate confidence thresholds

### PoC Scope (deliberately limited)

- ✅ Send state + question to Jev API
- ✅ Receive and parse structured decision
- ✅ Display confidence value
- ✅ Fallback when API unavailable
- ✅ Demonstrate DOM sanitization
- ❌ Do NOT modify main execution flow
- ❌ Do NOT add Jev to every step
- ❌ Do NOT make Jev required
- ❌ Do NOT modify History or database schemas

### PoC Structure

```
research/jev-decision-provider/
├── poc/
│   ├── index.ts          # Main PoC entry point
│   ├── decisionProvider.ts # DecisionProvider interface
│   ├── jevProvider.ts    # Jev implementation
│   └── deterministicProvider.ts # Deterministic fallback
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    └── poc-results.md
```

### PoC Minimal Example

```typescript
import { TypeSafeClient } from "@typesafe-ai/sdk";

// 1. Initialize client
const client = new TypeSafeClient();

// 2. Define state (DOM snapshot subset)
const state = {
    originalSelector: "button[data-testid='login']",
    domSnippet: '<button data-testid="login">Login</button>', // sanitized subset
    intent: "click the login button"
};

// 3. Ask Jev a Choice question
const response = await client.systemOne({
    state,
    questions: {
        bestSelector: choice(
            "Which candidate best represents the intended element?",
            {
                "#login": "CSS id selector",
                "[aria-label='Login']": "ARIA label selector",
                "button:has-text('Login')": "Text-based selector",
                "button.primary": "CSS class selector"
            }
        )
    }
});

// 4. Parse result
const best = response.answers.bestSelector;
console.log(`Selected: ${best.choice}, Confidence: ${best.confidence}`);

// 5. Route based on confidence
if (best.confidence >= 0.9) {
    // Auto-apply
} else if (best.confidence >= 0.75) {
    // Show suggestion
} else {
    // Revert to deterministic
}
```

## Phase 6 — Comparison Against Baseline (Pending)

### Baseline: Current HalTest Behavior

| Metric | Current Behavior |
|--------|-----------------|
| Selector healing | Ollama local via AIService.healSelector() |
| Control classification | DOM inspection + heuristics |
| Retry/heal/human | Deterministic policy based on error type |
| Assertions | All deterministic (URL, text, status, etc.) |
| Latency per decision | 2-8s (Ollama model loading) |
| Cost per decision | $0.001-0.01 (Ollama token usage) |
| Offline capability | ✅ Yes (local models) |
| Privacy | ✅ No external data sent |
| Reproducibility | ✅ Same inputs → same outputs |
| False positive rate | ~15-25% (empirical, varies) |

### With Jev

| Metric | With Jev (hypothesized) |
|--------|------------------------|
| Selector healing | Jev Choice + probabilities |
| Control classification | Jev Noul/Score |
| Retry/heal/human | Jev confidence gating |
| Assertions | Some may use Jev for semantic checks |
| Latency per decision | 70-500ms (System One) |
| Cost per decision | $0.000081 (193.6x cheaper!) |
| Offline capability | ❌ No (requires API) |
| Privacy | ⚠️ Must sanitize DOM |
| Reproducibility | ⚠️ Depends on model determinism |
| False positive rate | Unknown - needs empirical study |

### Key Comparison Points

1. **Latency**: Jev (~500ms max) vs Ollama (2-8s including model load)
2. **Cost**: Jev ($0.000081) vs Ollama (~$0.001-0.01 per decision)
3. **Offline**: Ollama wins - Jev requires internet
4. **Type safety**: Jev wins - structured output vs text parsing
5. **Hallucinations**: Jev claims "zero hallucinations" with confidence calibration
6. **Privacy**: Both require sanitization, but Jev sends data externally

### When Jev Wins

- **Cost-sensitive operations**: 193.6x cheaper per decision
- **Latency-sensitive**: 70-500ms vs 2-8s
- **Type-safe decisions**: No fragile JSON parsing
- **Confidence-calibrated**: Every answer has reliability metric

### When Current Baseline Wins

- **Offline requirement**: HalTest must work without internet
- **Maximum privacy**: No data leaves the team's environment
- **Deterministic guarantees**: Same inputs → same outputs always
- **No API dependencies**: No external service reliability concerns

## Phase 7 — Final Recommendation (revisada tras el PoC)

> **Esta sección queda OBSOLETA tras el PoC.** Ver la recomendación final en
> "Fuentes utilizadas" → **Recomendación final (basada en evidencia actual)**.
> Resumen ejecutivo:

### Evidence So Far

**Jev Advantages**:
- 193.6x cheaper per decision ($0.000081 vs $0.013880)
- 70-500ms latency vs 2-8s for comparable LLM tasks
- Structured, type-safe output (no JSON parsing)
- Calibrated confidence (0-1 probability distribution)
- Built for automation, not text generation
- Multiple question types in one request (Choice, Score, Noul)

**Jev Risks/Concerns**:
- Requires internet connection and API key
- Privacy: DOM/content must be sanitized before sending
- Dependency on external service availability
- Calibration of confidence thresholds needs empirical validation
- "Zero hallucinations" claim needs verification in practice

### Preliminary Recommendation (pre-PoC)

**KEEP EXPERIMENTAL** - Adopt as optional, configurable feature after PoC validation.

**Rationale**:
1. The cost and latency improvements are compelling
2. Type-safe output is a significant improvement over current text-parsing approach
3. Must remain optional - HalTest must work without Jev
4. Privacy requirements mandate strict sanitization
5. Need empirical data on false positive/negative rates
6. Current Ollama-based auto-healing already works well locally

### Required Next Steps

1. ✅ Complete Phase 0-3 research (DONE)
2. 🔄 Build PoC and measure actual metrics
3. 🔄 Test with real HalTest flows and selectors
4. 🔄 Compare Jev vs Ollama healing accuracy
5. 🔄 Validate confidence calibration
6. 🔄 Test offline behavior (Jev unavailable)
7. 🔄 Document privacy/sanitization requirements
8. 🔄 Final decision: adopt / adopt partially / keep experimental / do not adopt

### Files to Create

- `docs/research/jev-architecture.md` - Architecture diagrams and interface definitions
- `docs/research/jev-poc-results.md` - PoC measurement results
- `docs/research/jev-implementation-plan.md` - Implementation phases
- `research/jev-decision-provider/` - PoC code

### Branch Strategy

All work continues on `spike/jev-decision-provider`. No changes to `main` until:
1. PoC results are evaluated
2. Recommendation is approved
3. Implementation plan is documented

---

## Fuentes utilizadas

- TypeSafe AI — Introduction: https://docs.typesafe.ai/introduction
- Quick start (API + SDK): https://docs.typesafe.ai/introduction/quickstart
- API reference (endpoint `v1/systemone`): https://docs.typesafe.ai/api
- Primitives (Choice / Score / Noul): https://docs.typesafe.ai/primitives
- Confidence y confidence-gated routing: https://docs.typesafe.ai/confidence · https://docs.typesafe.ai/patterns/confidence-routing
- Use case map (harness engineering, guardrails): https://docs.typesafe.ai/concepts/use-case-map
- JavaScript SDK (`@typesafe-ai/sdk`): https://docs.typesafe.ai/sdk/javascript
- AI SDK provider (`@ai-sdk/typesafe-ai` / `experimental_evaluate`): https://ai-sdk.dev/providers/ai-sdk-providers/typesafe-ai
- JevAI community hub (características/benchmarks comunitarios, NO oficial): https://www.jevai.org/
- TypeSafe home (System One, RLCD, benchmarks publicados): https://typesafe.ai/

Nota metodológica: las métricas publicadas (193.6x más barato, 70–500ms) provienen de
material promocional/documentación. El PoC las trata como hipótesis, no como hechos medidos
por HalTest.

---

## Resumen de hallazgos

**¿Qué problema concreto resuelve Jev?**
Proporciona decisiones estructuradas (Choice/Score/Noul) rápidas y con confidence calibrada,
sin generación de texto. En HalTest aplicaría a: selección semántica de selectores,
clasificación de elementos ambiguos, ruteo retry/heal/human, y assertions semánticas.

**¿Lo resuelve mejor que las heurísticas actuales?**
- **Coste/latencia**: en tesis sí (70–500ms vs Ollama 2–8s; $0.000081/decisión según docs),
  pero medido con Jev real fue 370ms vs ~0.4ms del determinístico.
- **Type-safety**: sí, tipado nativo vs parsing JSON frágil de `AIServiceParsing.js`.
- **Calidad semántica del selector elegido**: **EMPATE en el benchmark real (n=50)** —
  Jev 40% vs det 40% (labeledAccuracy con ground truth).
- **Tasa de reparación funcional**: NO — el baseline determinístico ya repara el 100% en fixtures simples.

**¿Qué fue descartado por el PoC?**
- Que Jev sea necesario para reparar selectores simples → descartado (det = 100% heal).
- Los umbrales 0.90/0.75 como correctos → descartado, no validados.
- Confianza ≈ correctness → descartado como suposición (MCE 0.10–0.22 del mock; **0.70 con Jev real**).
- **Que Jev mejore el auto-healing en fixtures simples → REFUTADO por el benchmark con Jev real**
  (misma tasa de reparación y labeledAccuracy, peor calibración, ~370ms de latencia).

**¿Qué NO debería usar Jev nunca?**
- Datos con credenciales/cookies/PII (salvo sanitización probada).
- Cada paso de ejecución (solo on-failure/on-ambiguity/on-feature).
- Assertions determinísticas (URL equals, status code, numeric…).
- Clasificación estándar de controles (heurísticas DOM/ARIA bastan).

## Recomendación final (basada en evidencia del benchmark con Jev real)

> Estado del arte al 2026-09-20, tras ejecutar `npm run benchmark -- --real` con `jev-latest`
> (50 decisiones por provider, n=50). Métricas: ver `jev-poc-results.md`.

**Consulta medida para AUTO-HEALING: NO PASA.**

| Consulta | Resultado medido con Jev real (n=50) |
|----------|-------------------------------|
| ¿Repara más tests que el baseline? | **NO** — ambos @ 100% healsSuccess |
| ¿Elige el selector ideal más a menudo? | **NO** — empate 40% vs 40% |
| ¿Confianza bien calibrada? | **NO** — MCE 0.70 (det: 0.30); conf. media en aciertos 0.57 |
| ¿Latencia aceptable? | ⚠️ 370ms (det: ~0.4ms) |
| ¿Policy utilizable? | ⚠️ 30/50 decisiones a HUMAN_REVIEW, AUTO solo 5/50 |
| ¿0 fugas de datos al sanitar? | ✅ `leaks: 0` verificado en el envío real |

Consecuencia: **KEEP EXPERIMENTAL → DESCARTAR el caso de uso auto-healing con Jev.**
La abstracción `DecisionProvider` puede mantenerse como coste bajo de plataforma (permite
inyectar cualquier proveedor futuro), pero **no hay evidencia de que Jev deba conectarse
al healing hoy**.

Puertas para reabrir:
1. Nuevos fixtures **adversariales** (DOM engañoso, multi-match, duplicados, PII oculta) en los
   que el determinístico falle — si Jev los repara mejor, la hipótesis de valor renace.
2. Validación de calibración MCE ≤ 0.3 con Jev real sobre esos casos.
3. Casos de uso NO medidos (ruteo retry/heal/human con Noul, assertions semánticas con Score)
   que sí podrían justificar Jev — requieren otro PoC dirigido.

Si 1–3 dieran positivo → **ADOPT PARTIALLY** (P0–P3 del plan existente: abstracción + gateway +
provider Jev opcional + healing con validación Playwright). La UI/métricas (P4–P7) quedan después.