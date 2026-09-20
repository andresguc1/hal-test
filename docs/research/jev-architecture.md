# Jev — Technical Architecture Proposal for HalTest

> Documento de arquitectura candidata. Nada de esto está implementado en `main`.
> Todo el trabajo experimental vive en `spike/jev-decision-provider`.

## 1. Contexto

HalTest ya posee una capa de IA (Vercel AI SDK) con múltiples providers: Ollama (local, default),
OpenAI, Anthropic, Gemini, OpenRouter. La resolución de modelos es centralizada en `LLMFactory.js`
y `AIService.js` (`selectBestModel`, `resolveOllamaModel`, `_trackUsage`).

Sin embargo, **no existe una abstracción de "decisión estructurada"**: todo pasa por
`generateText` + parsing JSON frágil (`AIServiceParsing.js`), o `generateObject` con zod.

Jev (System One) ofrece decisiones estructuradas y rápidas (70-500ms) con confidence calibrada,
sin generación de texto. La integración natural es añadir **una abstracción `DecisionProvider`**
que coexista con el `AIService` existente, sin reemplazarlo.

## 2. DecisionProvider — Abstracción candidata

```typescript
// types.ts
export type DecisionType = 'choice' | 'score' | 'noul';

export interface DecisionQuestion<T = string> {
  id: string;
  type: DecisionType;
  instructions: string;          // pregunta bien acotada
  criteria?: Record<string, string | null>; // choice options
  levels?: Array<{ legend: string; description?: string }>; // score levels
  yesDesc?: string;              // noul criteria.true
  noDesc?: string;               // noul criteria.false
  statePath?: string;            // ruta dentro del state
}

export interface Decision<T = string> {
  value: T | number | number;    // choice | score | noul(0-1)
  confidence: number;            // 0..1 (noul: igual al valor)
  probabilities?: Record<string, number>;
  providerId: string;            // 'deterministic' | 'local' | 'jev'
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface DecisionContext {
  state: unknown;                // ya sanitizado para el provider externo
  originalState?: unknown;       // versión íntegra local (nunca externa)
  node?: { nodeId: string; type: string; label?: string };
  runId?: string;
  flowId?: string;
  signal?: AbortSignal;
}

export interface DecisionProvider {
  readonly id: string;
  readonly requiresNetwork: boolean;
  isAvailable(): boolean;
  decide<T>(ctx: DecisionContext, q: DecisionQuestion<T>): Promise<Decision<T>>;
}
```

### Árbol de providers

```mermaid
graph TD
    DP[DecisionGateway] --> DET[DeterministicDecisionProvider]
    DP --> LOC[LocalDecisionProvider<br/>(Ollama, opcional)]
    DP --> JEV[JevDecisionProvider<br/>(TypeSafe)]
    DET --> H[Heurísticas<br/>DOM / ARIA / atributos]
    DET --> EV[ExperienceVault<br/>selectores históricos]
    LOC --> AIS[AIService.healSelector<br/>existente]
    JEV --> SDK[typesafe-ai/sdk<br/>systemOne]
```

### Gateway y orden de resolución

```typescript
// decisionGateway.ts
export interface DecisionPolicy {
  allowedProviders: DecisionProviderId[]; // ['deterministic', 'local' | 'jev']
  mode: 'disabled' | 'local-only' | 'local-first' | 'remote-allowed';
  minConfidenceAuto: number;   // sugerido: 0.90
  minConfidenceSuggest: number; // sugerido: 0.75
  timeoutMs?: number;
  fallbackChain: DecisionProviderId[];
}
```

Regla base: **la decisión final pertenece a HalTest (policy), nunca al modelo.**
`decide()`:

1. Si `mode === 'disabled'` → determinístico directo.
2. Si el provider principal falla/tarda/excede → fallback en cadena.
3. `confidence` se usa solo para enrutar; HalTest aplica su propia política
   (auto / sugerir / human review).

## 3. Sanitización de contexto (Local-First)

Antes de cualquier llamada a un provider **externo** (Jev), el contexto pasa por `sanitizer`:

```text
Raw DOM
   ↓
Local sanitizer (research/jev-decision-provider/src/sanitizer.js)
   ↓
Relevant DOM subset (sin input values, sin cookies, sin headers auth)
   ↓
Decision context
   ↓
Jev
```

Reglas mínimas de sanitización:

| Regla | Implementación |
|-------|----------------|
| Quitar valores de `input[type=password]`, `input[name*=user]`, etc. | DOM strip |
| Quitar `name=`, `value=`, `data-*` que match secretos/tokens | regex list |
| Limitar tamaño del DOM (p.ej. primeros N caracteres / selectores relevantes) | truncate |
| No enviar cookies, headers, localStorage | fuera de scope |
| Quitar `textContent` de nodos `script`/`style` | tag strip |
| Only send selectors candidatos + breves descriptores | Zona permitida |

La zona "segura de enviar" para auto-healing es: **selectores candidatos + rol ARIA +
atributos no sensibles + texto visible limitado**. Nunca: valores, credenciales, cookies, PII.

## 4. Casos de uso (Fase 4)

### A. Selector Auto-Healing

- **Hoy**: `AIService.healSelector()` → Ollama local con tiers (fast/self-correction/fuzzy).
  Sin confidence calibrada. Parsing JSON frágil.
- **Con Jev**: Choice sobre candidatos generados por heurísticas determinísticas
  (los mismos que usa el DFT hoy). Jev elige cuál representa mejor la intención + confidence.
- **Contexto**: selectores candidatos + breve DOM subset + intent.
- **Privacidad**: zona segura descrita arriba.
- **Riesgos**: false repair (aplicar selector incorrecto). Mitigación: threshold + validar
  el selector propuesto con Playwright ANTES de aplicarlo (la validación es determinística y
  es la guardia real).
- **Determinismo**: la generación de candidatos sigue siendo determinística (heurísticas).
  Jev solo **rankea**.

### B. Control Classification

- **Hoy**: heurísticas DOM/ARIA/atributos ≈ 95% para HTML estándar.
- **Con Jev**: solo para elementos ambiguos o componentes custom.
- **Recomendación**: NO usar Jev aquí por defecto; una regla determinística es suficiente y
  gratis. Jev es un *segundo opinador* opcional en alta incertidumbre.

### C. Retry / Heal / Human Review

- **Hoy**: política determinística por tipo de error.
- **Con Jev**: Noul/Choice sobre `{tipo de error, nro de retries, contexto}` → RETRY/HEAL/ABORT/HUMAN_REVIEW.
- **Combinación**: `Jev.confidence + señales determinísticas + HalTest policy`.
- **Regla dura**: la decisión final la toma la policy de HalTest. Jev solo aporta una señal.

### D. Semantic Assertions

- No sustituir assertions determinísticas (URL equals, status code, numeric, etc.).
- Jev solo cuando hay necesidad semántica real (p.ej., "¿la página confirma el checkout?").

### E. Clasificación de findings

- Choice para categorizar fallos (perf/accessibility/visual/security/functional).

## 5. Integración con el pipeline existente

Dónde insertar sin romper nada:

| Flux | Hook point |
|------|-----------|
| E2E execution | `ActionExecutor.js` alrededor del manejo de fallo de selector |
| Auto-healing | `SelectorHealer.js:292` reemplaza/amplifica la llamada a `aiService.healSelector` |
| ExperienceVault | `ExperienceVaultService.js` como provider determinístico de fallback |
| Composite/subflows | El context de decisión viaja por `state.compositeNodeId` / `state.callerId` (ya propagado en `ExecutionService.js:1147`) |
| History | `StepResult` + nueva columna/JSON de decisión (`decision` con provider/confidence) — FASE SEPARADA |
| Config UI | settings de AI (componente existente de auto-healing) — FASE SEPARADA |

> Importante: NADA de esto se implementa en esta fase. Es la propuesta de arquitectura.

## 6. Observabilidad y Auditoría

Una decisión debería registrarse (eventualmente) como:

```text
Step 14 · Click Login
Original locator: button[data-testid="login"]
Decision: HEAL | Provider: jev | Confidence: 0.94
Candidate: #login | Policy: auto-heal | Result: success
```

Almacenado en `StepResult` vía `decision` JSON:

```json
{
  "kind": "HEAL",
  "providerId": "jev",
  "confidence": 0.94,
  "candidate": "#login",
  "policy": "auto-heal",
  "latencyMs": 180,
  "sanitizedContextBytes": 2048,
  "validated": true
}
```

## 7. Modos de configuración candidatos

```text
AI Decision Assistance
- Disabled
- Local Only (Ollama)
- Local First (intenta local, fallback local)
- Remote Allowed (Jev permitido, sanitización obligatoria)
```

El determinístico **siempre** actúa como base, aunque `Disabled` significa "sin IA, solo
heurísticas + ExperienceVault".

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Prompt injection desde DOM | sanitizer + instrucciones aisladas + nunca confiar en data del DOM como instrucción |
| Exfiltración de secretos | sanitizer; nunca enviar credenciales/cookies/PII |
| Decisiones incorrectas | validación determinística post-decisión (Playwright real) |
| Confidence mal calibrada | PoC mide calibración; thresholds por caso de uso, no globales |
| Jev caído / timeout / rate-limit | fallback chain → determinístico; HalTest sigue funcionando |
| Dependencia externa | Jev es opcional; default local/determinístico |
| Modelo cambia versión | pin `jev-latest` → verificar por alias; registrar modelo usado en `metadata` |

## 9. Cuándo NO usar Jev

- Nunca con credenciales/cookies/PII en el contexto.
- No en cada paso (solo on-failure / on-ambiguity / on-heal / feature explícita).
- No para assertions determinísticas.
- No para control classification estándar (heurísticas bastan).
- No cuando `mode === 'disabled'` o el usuario no lo habilitó.
- No cuando el contexto no puede sanitizarse suficientemente.