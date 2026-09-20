# Jev — PoC Evaluation Results

> Resultados del PoC `research/jev-decision-provider/`.
> El benchmark se ejecutó con **Jev real** (`--real`, `TYPESAFE_API_KEY`) y con mock offline.
> Las métricas de Jev real mandan sobre las del mock al evaluar el caso de uso de auto-healing.

## Contexto medido

- **Tarea**: auto-healing de selectores — dado un selector original fallido, un conjunto de
  candidatos y un fragmento DOM, elegir el candidato que repara el test.
- **Datos**: 5 fixtures sintéticos × 3 rondas = 15 decisiones por provider.
- **Métricas**:
  - `healSuccessRate`: el selector elegido **sí localiza el elemento real** (measure honesta de "¿repara el test?").
  - `labeledAccuracy`: el selector elegido es el **ideal etiquetado** (ground truth).
  - `falseRepairRate`: eligió un selector NO funcional con confidence ≥ 0.9.
  - `calibration`: MCE / Brier de la confidence vs acierto real.
- **Entorno**: Node v24. Benchmark real con `jev-latest` vía `POST api.typesafe.ai/v1/systemone`.

## RESULTADOS DEFINITIVOS (Jev real)

Ejecución: `--real`, `model=jev-latest`, 2026-09-20.

### n=15 (primera pasada)

| Provider | healSuccessRate | labeledAccuracy | falseRepairRate | avgLatencyMs | meanConfHeal | MCE | Brier |
|----------|-----------------|-----------------|-----------------|--------------|--------------|-----|-------|
| Det (baseline) | **1.00** | **0.40** | 0.00 | **0.9** | **0.92** | **0.30** | **0.020** |
| **Jev real** | **1.00** | 0.27 | 0.00 | 460.3 | 0.58 | 0.70 | 0.229 |
| gateway+fallback (Jev caído) | 1.00 | 0.40 | 0.00 | 0.4 | 0.92 | 0.30 | 0.020 |

### n=50 (pasada robusta, calibración de confidence)

Ejecución: `BENCH_ROUNDS=10 node src/benchmark.js --real`, 2026-09-20. **Esta pasada manda.**

| Provider | healSuccessRate | labeledAccuracy | falseRepairRate | avgLatencyMs | meanConfHeal | MCE | Brier |
|----------|-----------------|-----------------|-----------------|--------------|--------------|-----|-------|
| Det (baseline) | **1.00** | **0.40** | 0.00 | **0.4** | **0.92** | **0.30** | **0.020** |
| **Jev real** | **1.00** | **0.40** | 0.00 | 370.3 | 0.57 | 0.70 | 0.238 |
| gateway+fallback (Jev caído) | 1.00 | 0.40 | 0.00 | 0.2 | 0.92 | 0.30 | 0.020 |

Conclusión de la pasada robusta:
- **`labeledAccuracy` EMPATA en 40%** — la diferencia del n=15 (27%) era ruido de muestra.
  Jev no elige el selector "ideal" más frecuentemente que la heurística.
- **`meanConfHeal` 0.57 sigue bajo**: cuando Jev acierta, declara confidence media ~0.57.
- **Calibración estable y mala**: MCE 0.70 / Brier 0.238 en las dos pasadas.
- **Policy resultante**: con umbrales 0.90/0.75 → **HUMAN_REVIEW 30/50, SUGGEST 15/50, AUTO 5/50**.
  El 90% de las decisiones de Jev no pasan la barra de AUTO.
- **Latencia** ~370–460ms; determinístico ~0.4–0.9ms.

### Reporte JSON reproducible (n=50)

```json
{
  "mode": "real",
  "generatedAt": "2026-09-20T20:55:07.911Z",
  "det":   { "healSuccessRate": 1.00, "labeledAccuracy": 0.40, "falseRepairRate": 0.00, "avgLatencyMs": 0.4, "meanConfHeal": 0.92, "mce": 0.30, "brier": 0.020 },
  "jev":   { "healSuccessRate": 1.00, "labeledAccuracy": 0.40, "falseRepairRate": 0.00, "avgLatencyMs": 370.3, "meanConfHeal": 0.57, "mce": 0.70, "brier": 0.238,
             "policyDistribution": { "HUMAN_REVIEW": 30, "SUGGEST": 15, "AUTO": 5 } },
  "gateway": { "healSuccessRate": 1.00, "labeledAccuracy": 0.40, "avgLatencyMs": 0.2 },
  "privacyAudit": { "leaks": 0 }
}
```

### Distribución de política (umbrales 0.90 / 0.75)

| Provider | AUTO | SUGGEST | HUMAN_REVIEW |
|----------|------|---------|--------------|
| Det (baseline) | 12/15 | 0 | 3/15 |
| **Jev real** | 1/15 | 5/15 | **9/15** |

### Decisión por caso (una pasada representative)

| Caso | Jev real eligió | Confidence | ¿Ideal? | ¿Funciona? |
|------|-----------------|------------|---------|------------|
| case-01 | `button[data-testid="login-btn"]` | 0.40 | ❌ (ideal `#login`) | ✅ |
| case-02 | `#user-email` | 0.78 | ❌ (ideal `input[type="email"]`) | ✅ |
| case-03 | `button[role="button"][data-testid="submit-order"]` | 0.93 | ✅ | ✅ |
| case-04 | `a:has-text("Create account")` | **0.35** | ✅ | ✅ |
| case-05 | `nav a:has-text("Settings")` | **0.32** | ✅ | ✅ |

### Reporte JSON reproducible (real)

```json
{
  "mode": "real",
  "det":  { "healSuccessRate": 1.00, "labeledAccuracy": 0.40, "falseRepairRate": 0.00, "avgLatencyMs": 0.9, "mce": 0.30, "brier": 0.020 },
  "jev":  { "healSuccessRate": 1.00, "labeledAccuracy": 0.27, "falseRepairRate": 0.00, "avgLatencyMs": 460.3, "meanConfHeal": 0.58, "mce": 0.70, "brier": 0.229 },
  "gateway": { "healSuccessRate": 1.00, "labeledAccuracy": 0.40, "avgLatencyMs": 0.4 },
  "privacyAudit": { "leaks": 0 }
}
```

## Resultados previos (mock offline — solo validación de contrato)

El mock (que ve el ground truth) NO representa a Jev real; se mantiene para CI/offline.

| Provider | healSuccess | labeledAcc | falseRepair | avgLatency |
|----------|-------------|------------|-------------|------------|
| Det (baseline) | 1.00 | 0.40 | 0.00 | ~1ms |
| mock-jev | 1.00 | 1.00 | 0.00 | ~0.1ms* |

\* el mock no hace red real; latencia de Jev real medida: ~460ms.

### Auditoría de privacidad

- Payload con valores de `input[type=password]`, `name=token`, email → **después del
  sanitizer: 0 fugas detectadas** (`leaks: 0`). Los atributos sensibles quedan como `[REDACTED]`.
  Verificado tanto en modo mock como en el envío real a la API.

## Hallazgos clave (con Jev real, n=50)

### 1. En estos fixtures, Jev real NO supera al determinístico
- **`healSuccessRate` 100% en ambos.** Jev no repara más tests que el baseline.
- **`labeledAccuracy` EMPATA en 40%**: a n=50, Jev elige el selector "ideal" con la misma
  frecuencia que la heurística. La diferencia de 27% del n=15 era ruido de muestra.

### 2. Confianza de Jev real baja y mal calibrada
- `meanConfHeal` 0.57 (Jev) vs 0.92 (det): cuando Jev acierta, tiene MENOS confianza.
- MCE 0.70 / Brier 0.238: la confidence de Jev está **mal calibrada** y es estable en las
  dos pasadas (n=15 y n=50).
- Con la política propuesta (0.90 AUTO / 0.75 SUGGEST), **30/50 decisiones de Jev irían a
  HUMAN_REVIEW y solo 5/50 a AUTO** → fricción, sin auto-healing automático.

### 3. Latencia ~400–900× mayor
- ~370–460ms (Jev) vs ~0.4–1ms (det). En un hot-path de healing por cada fallo, Jev añade
  ~0.4s por paso, multiplicado por la cantidad de pasos fallidos. La diferencia es tan
  grande que el determinístico "es gratis".

### 4. False repair = 0 en ambos (n pequeño)
- fixtures muy simples; ningún provider produjo un "repair dañino", pero el n no permite
  concluir nada sobre casos adversos reales.

### 5. El fallback y la privacidad funcionan en producción
- Con Jev caído → determinístico sin degradar (healSuccess 100%).
- Envío real con datos sensibles → 0 fugas tras sanitizer.

## Comparación contra baseline (Fase 6, con Jev real, n=50)

| Eje | Baseline (det) | + Jev real (medido) | ¿Mejora? |
|-----|----------------|---------------------|----------|
| Tasa de reparación | 100% | 100% | **No** |
| Selector "ideal" | 40% | 40% | Empate |
| False repairs | 0 | 0 | Empate |
| Latencia | ~0.4ms | 370ms | **No (peor)** |
| Coste por decisión | 0 | ~0.000081 USD (docs) | **No (peor)** |
| Calibración (MCE) | 0.30 | 0.70 | **No (peor)** |
| Offline | ✅ | ❌ | **No** |
| Type-safety | parsing JSON | tipado nativo | **Sí** (no cuantificado) |
| Fugas de datos | 0 | 0 | Empate |

## Veredicto medido

> **Para el caso de uso de auto-healing de selectores, con Jev real y estos fixtures, Jev
> NO aporta mejora medible sobre el baseline determinístico.** Repara lo mismo (100%),
> elige el selector "ideal" con la misma frecuencia (40%), añade ~370ms y coste por
> decisión, y su confidence está mal calibrada (la política mandaría el 60% de sus decisiones
> a HUMAN_REVIEW y solo el 10% a AUTO).
>
> El contrato (abstracción `DecisionProvider`, política, sanitizer, fallback) quedó **validado
> en producción** (envío real a la API, 0 fugas). La hipótesis de valor quedó **refutada para
> este caso de uso** con la evidencia actual.

### Rigor / limitaciones
- n=50 por provider; fixtures sintéticos simples. Conclusión nula (sin beneficio medible),
  no "prueba de daño". Un dataset con casos adversariales podría cambiar el resultado.
- El uso de un *sexagesimal* de aciertos "ideal" favorece la heurística por construcción:
  los labels alinean con las firmas DOM. Jev podría lucir mejor en casos donde las firmas
  mienten (multi-match, elementos duplicados) — NO cubierto aquí.
- Los casos **retry/heal/human** y **assertions semánticas** NO se midieron: Jev podría tener
  valor ahí aunque no lo tenga en healing. Requiere otro PoC.