# HalTest — Plan de implementación propio (aprendizajes de Jev sin Jev)

> Objetivo: incorporar a HalTest los aprendizajes del spike Jev usando **código propio,
> local, offline y sin dependencias externas**. Basado en las debilidades medidas en
> `docs/research/jev-poc-results.md`:
>
> 1. El determinístico está **sobre-confidente**: confidence 0.92 pero solo 40% de acierto "ideal".
> 2. No existe una **política de decisión** (AUTO/SUGGEST/HUMAN_REVIEW): hoy se aplica el repair
>    con una confidence sin calibrar.
> 3. **No hay harness de evaluación**: nadie mide `healSuccessRate`, `labeledAccuracy`,
>    `falseRepairRate` ni la calibración del healing actual.
> 4. `AIServiceParsing.js` es **parsing JSON frágil** resuelto con structured output del AI SDK.
>
> Todo se implementa sobre el pipeline existente registrado en
> `apps/backend/plugins/core-interaction/handlers/click.js` y `apps/backend/services/SelectorHealer.js`.
> Pertenece a la rama `spike/jev-decision-provider`; ningún merge a `main` sin aprobación explícita.

> **Estado: F0–F5 implementadas y verdes (2026-09-20).** Suites verdes: 968 tests, 7 skipped
> (suite backend completa). Lint de los archivos tocados: 0 errores.

---

## Fases

### Fase 0 — ✅ (implementada) Motor determinístico de candidatos y ranking semántico

**Problema**: `SelectorHealer.heal()` delega todo al LLM. El PoC demostró que una heurística
de señales en orden semántico iguala o supera al LLM en fixtures simples, con ~0.4ms.

**Cambio** — nuevo módulo `apps/backend/core/decisions/SelectorRanker.js`:

- **Entrada**: DOM comprimido (via `page.evaluate(selectorHealer.getCompressionScript())`),
  `originalSelector` fallido, `intent`.
- **Salida**: candidatos rankeados `[{ selector, confidence, signals, ambiguity, reason }]`.
- **Orden de preferencia semántica** (mejora del 40% "ideal"): `data-testid` → `[aria-label]`
  → `id` → `role` → `type/name` → `texto` (el actual elige la *primera* señal fuerte).
- **Ambigüedad**: si `querySelectorAll(candidate).length > 1` → marcar `ambiguity: true` y
  **bajar** confidence (en vez de aplicar igual).
- Reutiliza la puntuación existente de `SelectorPreValidator.js` (`score` con penalizaciones
  por IDs dinámicos).

**Tests** (`apps/backend/__tests__/selector_ranker.test.js`, Vitest como el resto):
- caso data-testid vs id → gana data-testid.
- multi-match → `ambiguity: true`, confidence reducida.
- selectores sensibles (`password/token/api_key`) → excluidos si el original no era sensible
  (portar reglas de `SelectorHealer.SENSITIVE_SELECTORS`).

**Criterio de salida**: 100% determinístico, 0 relies de IA, suite verde.

**Riesgo/rollback**: módulo nuevo, nada existente se toca. Rollback = no importar el módulo.

---

### Fase 1 — ✅ (implementada) Confidence calibrada (no inventar el 0.92)

**Problema**: la confidence hoy es `result.confidence || 0.9` (`SelectorHealer.js:333`), un
constante arbitraria. Con esa base no se puede gatear nada.

**Cambio** — nueva función `computeConfidence(candidate)` en `SelectorRanker`:

```
confidence = base_score × signal_strength × uniqueness × proximity_weight
  donde:
  - base_score      = score de SelectorPreValidator (1.0 data-testid … 0.3 ID dinámico)
  - signal_strength = peso de la señal ganadora
  - uniqueness      = 1.0 si única coincidencia, 0.6 si multi-match
  - proximity_weight= si hay originalSelector, 1.05 (radio de cercanía, del compression script)
```

- Resultado a una columna, **calibrado empíricamente** en Fase 5 (harness mide MCE/Brier).
- Se reemplazan los `confidence: 0.9` / `MIN_CONFIDENCE 0.5` hardcodeados por valores
  derivados del cálculo.

**Criterio de salida**: el harness (Fase 5) reporta MCE del determinístico ≤ 0.30 (meta del PoC).

---

### Fase 2 — ✅ (implementada) Política de decisión AUTO / SUGGEST / HUMAN_REVIEW

**Cambio** — nuevo `apps/backend/core/decisions/DecisionPolicy.js`, portado del PoC
(`research/jev-decision-provider/src/policy.js`):

- Umbrales por caso de uso, configurables: `AUTO ≥ 0.90`, `SUGGEST ≥ 0.75`, else `HUMAN_REVIEW`.
- Modos: `disabled | local-only | apply-with-validation` (default `apply-with-validation`).
- Integración en `SelectorHealer.heal()`:
  1. **Vault primero** (ya existe, `ExperienceVaultService`, confidence 1.0).
  2. **Determinístico**: si `candidate.confidence ≥ AUTO → aplicar con validación Playwright`.
  3. **Solo si no hay candidate AUTO** → escalar a LLM (`_healSelectorRaw`).
  4. Los resultados HUMAN_REVIEW no se auto-aplican; se registran para consulta manual.

**Guarda principal**: toda aplicación pasa por `verifySelector(page, candidate)` (ya existente,
`SelectorHealer.js:211`) + `_sanitizeCandidate`. La política decide **cuál** candidato se valida,
nunca salta la validación.

**Tests**: portar los de policy del PoC + un test de integración en heal() donde el LLM
no se invoca si hay candidato determinístico AUTO.

**Riesgo**: cambiar el flujo principal de healing. Mitigación: flag `DISABLE_SELF_HEALING_POLICY`.

---

### Fase 3 — ✅ (implementada) Structured output en el camino LLM (matar el parsing frágil)

**Problema**: `AIService._healSelectorRaw()` pide JSON crudo con prompt y hace
`text.match(/\{[\s\S]*\}/)` + `JSON.parse` frágil (`AIService.js:932-953`), con fallbacks en
`AIServiceParsing.js` a base de regex.

**Cambio** — en el path Ollama y el resto (grep `healSelector` en `AIService.js`):

- Usar **structured output del Vercel AI SDK** (ya es dependencia) con esquema Zod:
  `{ correctedSelector: string, confidence: number(0..1), reasoning: string }`.
- Si el provider no soporta structured output → mantener fallback al parsing actual (con
  warning), nunca romper el heal.

**Tests**: `ai_service_parsing.test.js` existente sigue verde; nuevos casos con output
markdown/envuelto en ```json → esquema válido.

---

### Fase 4 — ✅ (implementada) Telemetría y auditoría del healing

**Problema**: `HealingLog` guarda `confidence` pero nadie sabe *por qué*. Sin registros no se
puede calibrar ni auditar.

**Cambio** — nuevas columnas en `apps/backend/database/models/HealingLog.js`:

| columna | tipo | contenido |
|---------|------|-----------|
| `provider` | STRING | `vault \| deterministic \| llm` |
| `policy_action` | STRING | `AUTO \| SUGGEST \| HUMAN_REVIEW` |
| `ambiguity` | BOOLEAN | multi-match del candidato |
| `signals_matched` | JSON | señales que activaron el candidato |
| `calibrated_confidence` | FLOAT | confidence final tras Fase 1 |
| `verified` | BOOLEAN | (ya existe) validación Playwright |

- Migración: ver cómo se sincronizan modelos (`database/init.js`) y añadir el `ALTER`/default.
- Feeding a `ExperienceVaultService.saveMemory` con la confidence calibrada (para que el vault
  no aprenda repairs de baja calidad).

---

### Fase 5 — ✅ (implementada) Harness de evaluación (el mayor valor del PoC)

**Cambio** — convertir `research/jev-decision-provider/src/benchmark.js` en **test de
regresión** del healing real, sin Jev:

- `apps/backend/test-harness/healing-benchmark.js` + fixtures con ground truth:
  - fixtures actuales del PoC (básicas).
  - **casos adversariales** nuevos (el faltante): DOM engañoso, multi-match, elementos
    duplicados, PII oculta, IDs dinámicos.
- Métricas: `healSuccessRate`, `labeledAccuracy`, `falseRepairRate`, `avgLatencyMs`,
  `MCE`, `Brier` — exactamente las del PoC.
- Comando: `pnpm --filter @hal/backend vitest run test-harness` o script npm `test:healing`.
- **CI**: se corre en cada PR que toque `SelectorHealer*.js`, `SelectorRanker.js`,
  `AIService.js`, `ExperienceVaultService.js`.

**Entorno**: sin red, 100% local (usa el determinístico / vault; el LLM puede mockearse).

> 📌 **Ya se crearon los fixtures adversariales de partida**: ver
> `research/jev-decision-provider/fixtures/adversarial_cases.js` (adv-01..adv-06: multi-match,
> texto engañoso, duplicados, PII oculta, ID dinámico, sibling-steal). **Benchmark de partida**
> sobre el determinístico (los valores de referencia que el plan busca mover):

| dataset | healSuccessRate | labeledAccuracy | falseRepairRate |
|---------|-----------------|-----------------|-----------------|
| básico (PoC, det) | 1.00 | 0.40 | 0.00 |
| **adversarial (det)** | **0.83** | **0.33** | **0.17** |

Conclusión preliminar: en casos fáciles el determinístico es imbatible (100/0); en casos
adversariales baja a 83% de reparación funcional con **17% de false repairs** — exactamente
donde la política (F2), la confidence calibrada (F1) y la verificación de unicidad (F0:
`ambigüedad → bajar confidence / descartar`) tienen retorno medible.

---

### Fase 6 — UI/telemetría de decisiones (opcional, después)

Si las fases 0–5 se sostienen:
- historia por nodo: ver `provider/policy_action/ambiguity` en el frontend del healing.
- dashboard de calibración (MCE/Brier por provider) con los datos de `HealingLog`.

---

## Orden y dependencias

| Fase | Depende de | Esfuerzo |
|------|------------|----------|
| F0 ranker + ranking | — | M |
| F1 confidence calibrada | F0 | S |
| F2 policy | F1 | S |
| F3 structured output | — | M |
| F4 telemetría | F1 (confidence) | S |
| F5 harness eval | F0/F1 | M |
| F6 UI | F4/F5 | L |

F0→F1→F2 forman la columna vertebral; F3 es independiente; F5 se puede empezar en paralelo
(jamás se midió el healing actual).

---

## Gates

- **G0 (previo)**: suite actual verde (`pnpm test` en `apps/backend`).
- **G1 tras F0–F2**: harness de F5 reporta `falseRepairRate = 0` y MCE determinístico ≤ 0.30.
- **G2 tras F3**: 0 parsings JSON frágiles en el path de heal (structured output activo).
- **G3 (deploy)**: ningún cambio en `main` sin aprobación; se trabaja en
  `spike/jev-decision-provider`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Cambiar el flujo de healing rompe HA | flag rollback `DISABLE_SELF_HEALING_POLICY` |
| Confidence mal calibrada → repairs malos | Fase 5 mide MCE antes de permitir AUTO |
| Structured output no soportado por provider | fallback al parsing actual con warning |
| Harness con fixtures sintéticas no representa prod | invitar fixtures de casos reales del `ExperienceVault` |

## Mientras tanto / fuera de scope

- **NO** se toca `main`.
- **NO** hay dependencia de Jev, red ni API keys en ninguna fase.
- El ramp de fixtures del harness es iterativo: empieza con lo del PoC, se enriquece con
  fallos reales de producción.

---

## Referencias del flujo a modificar

- `apps/backend/services/SelectorHealer.js` — `heal()`, `_sanitizeCandidate()`, `verifySelector()`,
  `MIN_CONFIDENCE`, `compressDOM()`.
- `apps/backend/services/AIService.js` — `healSelector()` / `_healSelectorRaw()` (parsing `{}`).
- `apps/backend/services/AIServiceParsing.js` — fallback de parsing (se mantiene).
- `apps/backend/services/SelectorPreValidator.js` — scoring existente (se reutiliza).
- `apps/backend/services/ExperienceVaultService.js` + `apps/backend/core/ActionExecutor.js`
  (líneas ~590-700) — cadena vault→heal→persist.
- `apps/backend/database/models/HealingLog.js` — columnas de telemetría.
- `apps/backend/__tests__/*.test.js` — convención Vitest del repo.

---

## Medición del harness real (2026-09-20)

Benchmark sobre **el motor real de HalTest** (`SelectorRanker` + `DecisionPolicy`, sin Jev)
contra `apps/backend/test-harness/healing-fixtures.js`. Comando:
`pnpm --filter @hal/backend exec node test-harness/run-benchmark.js`.

### Resultados

| fixture | mutación | elegido | conf | acción | evaluador |
|---|---|---|---|---|---|
| bas-01 | id-shift | `[data-testid="login-btn"]` | 0.90 | AUTO | HEAL OK |
| bas-02 | attribute-shift | `[data-testid="email-field"]` | 0.90 | AUTO | HEAL OK |
| bas-03 | role-shift | `[data-testid="submit-order"]` | 0.90 | AUTO | HEAL OK |
| adv-01 | multi-match | `[data-testid="submit"]` | 0.81 | SUGGEST | DEFER OK (ambiguo) |
| adv-02 | deceptive-text | `[data-testid="delete-confirm"]` | 0.90 | AUTO | HEAL OK |
| adv-03 | duplicate-elements | `[data-testid="checkout-email"]` | 0.90 | AUTO | HEAL OK |
| adv-04 | dynamic-id | `[data-testid="order-again"]` | 0.90 | AUTO | HEAL OK |
| adv-05 | sibling-steal | `[data-testid="username-input"]` | 0.90 | AUTO | HEAL OK |

| métrica | valor | gate |
|---|---|---|
| healSuccessRate | **1.000** (8/8) | ✓ |
| labeledAccuracy | 0.750 (6/8) | — |
| falseRepairRate | **0.000** | ✓ G1 |
| MCE | **0.100** | ✓ G1 (≤0.30) |
| Brier | 0.010 | ✓ |
| casos AUTO / SUGGEST | 7 / 1 | — |

### Lectura honesta

- `healSuccessRate` 1.0 y `falseRepairRate` 0: el motor **nunca aplica algo no funcional**, y
  repara funcionalmente todos los casos decidibles. La ambigüedad del caso adv-01 **defera**
  (SUGGEST), nunca `AUTO` — es exactamente el comportamiento que el PoC Jev no tenía.
- `labeledAccuracy` 0.75 < 1.0 es **deseado**, no un bug: en `bas-01` elige `[data-testid]`
  (funcional y estable) en vez del `#login` "ideal". Repite la lección del PoC: *funcional ≠
  ideal*, y para un error de healing casi siempre preferimos funcional+estable.
- MCE 0.10 (contra 0.30 del determinístico del PoC): la confidence de F1 quedó emparejada porque
  los casos no funcionales se marcan `ambiguity` (baja a 0.81 → SUGGEST) o se puntúan bajo.

### Regression conocida que el harness agarró

Durante F5 el harness expuso un bug real de `normalizeDom`: cuando `testId:` era el último campo
de una línea pipe, `[^|]*` capturaba el `\n` y producía `[data-testid="checkout\nref:2"]`
(false repair). Corregido con `[^|\n]` — el test `test_harness.test.js` lo fija como regresión.