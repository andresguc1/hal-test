# PoC — Jev Decision Provider (aislado)

PoC mínimo para validar la hipótesis de incorporar **Jev (TypeSafe System One)** como
provider opcional de decisiones en HalTest. **No modifica `main` ni el backend.**

## Flujo validado

```text
Input state (selector original + candidatos + DOM subset)
      ↓
buildHealingContext()  ← sanitizer (Local-First / privacidad)
      ↓
DecisionGateway        ← política de HalTest (mode, allowedProviders, fallback)
      ↓
Jev / Mock / Deterministic
      ↓
Decision (value + confidence + probabilities)
      ↓
Policy (AUTO / SUGGEST / HUMAN_REVIEW)
      ↓
Acción (en producción: heal / retry / human review)
```

## Requisitos

- Node >= 20
- Para el modo real: `TYPESAFE_API_KEY` en el environment.

## Uso

```bash
# Tests (offline, sin API key)
npm test

# Benchmark con mock Jev (offline, simulación de laboratorio)
npm run benchmark

# Benchmark con Jev REAL (requiere API key)
TYPESAFE_API_KEY=sk-... npm run benchmark -- --real
```

## Qué valida

| Hipótesis | Método | Estado |
|-----------|--------|--------|
| La abstracción `DecisionProvider` encaja con la arquitectura de HalTest | Revisión de `AIService`/`LLMFactory` | ✅ Documentado en `docs/research/jev-architecture.md` |
| Fallback a determinístico si Jev cae | Gateway con `fallbackChain` + test | ✅ |
| Policy con umbrales de confidence (AUTO/SUGGEST/REVIEW) | `applyPolicy()` + test | ✅ |
| Sanitizer evita fugas de secretos/cookies/PII | `buildHealingContext()` + `auditNoSensitiveData()` | ✅ |
| Jev puede mejorar accuracy vs baseline | Benchmark con ground truth | 🔄 (resultados en `docs/research/jev-poc-results.md`) |
| Latencia/coste salen del PoC | Benchmark mide latencia | 🔄 |

## Estructura

```
src/
  decisionGateway.js         # Orquestador de providers + política
  deterministicProvider.js   # Baseline (heurísticas determinísticas)
  jevProvider.js             # Provider real (fetch a api.typesafe.ai)
  mockJevProvider.js         # Simulación offline para dev/CI
  sanitizer.js               # Minimización/limpieza de contexto
  policy.js                  # Umbrales de confidence + calibración
  benchmark.js               # Comparativa baseline vs Jev
fixtures/
  healing_cases.js           # Casos de auto-healing con ground truth
tests/
  run.js                     # Tests offline
```

## Nota importante

`mock-jev` es una **simulación de laboratorio** (puede ver el ground truth). Sus
métricas NO representan el rendimiento real de Jev; sirven para validar el
contrato, la política, el sanitizer y el fallback. Las métricas con Jev real deben
obtenerse con `--real` y una API key legítima antes de cualquier decisión productiva.

## Resultado con Jev real (2026-09-20)

Se ejecutó `npm run benchmark -- --real` con `jev-latest` (n=50 por provider).
Conclusión para el caso **auto-healing**:

- `healSuccessRate` Jev = 100%, igual al determinístico. **Sin mejora funcional.**
- `labeledAccuracy` Jev = 40% = determinístico. **Empate.**
- `meanConfHeal` Jev = 0.57, MCE = 0.70. **Calibración pobre** → con la policy 0.90/0.75,
  30/50 decisiones irían a HUMAN_REVIEW, solo 5/50 a AUTO.
- Latencia real medida: ~370ms vs ~0.4ms del determinístico.
- Sanitizer: **0 fugas de datos sensibles** en el envío real.

→ **No conectar Jev al auto-healing hoy.** Detalles en
`docs/research/jev-poc-results.md` y `docs/research/jev-feasibility.md`.