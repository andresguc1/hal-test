# Jev — Implementation Plan (condicional)

> Plan de implementación **PRODUCTIVA** de la abstracción `DecisionProvider` + provider
> **Jev** opcional en HalTest. Debe ejecutarse SOLO si el PoC con Jev real confirma las
> hipótesis y la recomendación final es aprobada (ADOPT / ADOPT PARTIALLY).
> Mientras tanto, todo sigue en `spike/jev-decision-provider`. Nada de esto está en `main`.

## Resultado del gate (real, 2026-09-20)

El benchmark con Jev real se ejecutó. **La consulta para AUTO-HEALING NO PASA** (ver
`jev-poc-results.md`, n=50): identical healsSuccess (100%) y labeledAccuracy (40%), pero
calibración pobre (MCE 0.70 vs 0.30), latencia ~370ms, y la política mandaría 30/50 decisiones
a HUMAN_REVIEW. → **No implementar el provider Jev para healing hoy.**

**Estado del gate:**

- [x] `npm run benchmark -- --real` con `TYPESAFE_API_KEY` — **ejecutado** (fixtures actuales).
- [x] Auditoría de exfiltración: **0 fugas** de credenciales/cookies/PII en el envío real.
- [ ] Fixtures adversariales (DOM engañoso, multi-match, duplicados, PII oculta) — **pendiente**;
      sin ellos, la hipótesis de valor de Jev queda refutada solo para casos simples.
- [ ] Decisión de negocio aprobada sobre ADOPT vs ADOPT PARTIALLY vs KEEP EXPERIMENTAL.

**Si se reabre**: el plan P0–P7 aplica tal cual, con los casos de uso re-medibles:
retry/heal/human (Noul) y assertions semánticas (Score).

## Fases

### Phase 0 — Abstracción de arquitectura
- **Objetivo**: introducir el contrato sin cambiar comportamiento.
- **Archivos nuevos** (en `apps/backend/core/`):
  - `core/decisions/types.js` — `DecisionQuestion`, `Decision`, `DecisionContext` (JSDoc/TS).
  - `core/decisions/DecisionGateway.js` — orquestador (portado del PoC).
  - `core/decisions/DeterministicDecisionProvider.js` — portado del PoC, ajustado a
    `ExperienceVaultService.js` (usa el vault como señal + heurísticas).
  - `core/decisions/DecisionPolicy.js` — modos (`disabled|local-only|local-first|remote-allowed`)
    + umbrales configurables por caso de uso.
- **Tests**: unit (gateway, política, determinístico, sanitizer) — portados de `research/jev-decision-provider/tests`.
- **Riesgos**: bajo. Código nuevo, nada existente se toca.
- **Rollback**: borrar la carpeta `core/decisions/`.

### Phase 1 — Integrar `DecisionGateway` en el pipeline de auto-healing
- **Archivos afectados**:
  - `apps/backend/core/ActionExecutor.js` (hook en la ruta de fallo de selector).
  - `apps/backend/services/SelectorHealer.js:292` (sustituir/amplificar llamada a `aiService.healSelector`).
  - `apps/backend/services/ExperienceVaultService.js` (usado como señal determinística).
- **APIs**: ninguna nueva de red; solo refactor interno.
- **Cambios DB**: ninguno en esta fase.
- **Tests**: regresión (healing sin Jev sigue igual), unit del flujo fall-back-to-det.
- **Riesgos**: medio — tocar `SelectorHealer` afecta el auto-healing existente.
- **Rollback**: mantener el flag `DISABLE_DECISION_GATEWAY` para revertir a la ruta anterior.

### Phase 2 — Provider Jev real
- **Archivos nuevos**:
  - `apps/backend/core/decisions/JevDecisionProvider.js` — portado del PoC.
  - `apps/backend/services/KeyVault` entry para `TYPESAFE_API_KEY` (patrón existente en `LLMFactory.js`).
- **Dependencias**: `@typesafe-ai/sdk` o fetch directo (el PoC usa fetch; sin deps nuevas si se prefiere).
- **Config**: env `TYPESAFE_API_KEY`, `TYPESAFE_MODEL` (default `jev-latest`).
- **Tests**: integration con key real (opt-in, marcado `--real`), failure tests (timeout/401/rate-limit).
- **Riesgos**: medio-altos (dependencia externa). Mitigación: fallback chain obligatorio.

### Phase 3 — Auto-healing con Jev (opcional)
- **Comportamiento**: `DecisionGateway.decide(..., { preferredProvider: 'jev' })` SOLO
  cuando: (a) el usuario lo habilitó, (b) el healing determinístico no encontró señal
  inequívoca (`confidence < 0.75`), o (c) feature explícita.
- **Regla dura**: el selector propuesto por Jev se **valida con Playwright real** antes de
  aplicarse (guardia determinística). Nunca se aplica ciegamente por confidence.
- **Tests**: E2E de healing con Jev disabled (regresión) y enabled.

### Phase 4 — Observabilidad en History
- **Cambios DB**:
  - `StepResult` + columna `decision` JSON (nullable) o tabla `DecisionLog`.
  - Migración Sequelize compatible con la existente (`20260912...initial-schema`).
- **Contenido**: `{ kind, providerId, confidence, candidate, policy, latencyMs, validated }`.
- **Frontend**: render del registro de decisión en el panel de Step.
- **Tests**: unit (persistencia), E2E (log visible tras healing).
- **Riesgos**: migración DB — rollback vía `logging` de migraciones + backup SQLite.

### Phase 5 — Configuración UI
- **Frontend**: settings "AI Decision Assistance" con modos
  `Disabled / Local Only / Local First / Remote Allowed` + thresholds por caso de uso.
- **Backend**: endpoint `GET/PUT /api/settings/ai-decisions` (storage en tabla `Setting`/JSON).
- **Tests**: unit (validación), E2E (toggle persiste y afecta headers).
- **Riesgos**: bajo.

### Phase 6 — Controles de seguridad/privacidad
- **Objetivo**: garantizar que NUNCA salen credenciales/cookies/PII.
- **Implementación**:
  - Sanitizer obligatorio antes de cualquier provider externo (portado del PoC).
  - Test "privacy red team": inyectar secretos en DOM y verificar 0 fugas en payload.
  - Denylist de proyectos: config para bloquear Jev en proyectos con datos sensibles.
- **Tests**: dedicados de seguridad (Caso de uso de la sección 15 del spike).

### Phase 7 — Métricas y evaluación continua
- Registro de decisiones → tabla de métricas (accuracy, false repair, latencia, calibración).
- Reporte: dashboard o script exportable.
- **Tests**: benchmark como CI job opt-in (`--real` separado).

## Decisiones dentro de la arquitectura

| Pregunta | Propuesta | Justificación |
|----------|-----------|---------------|
| ¿Jev en cada paso? | **NO** | Solo on-failure/on-ambiguity/on-feature (`docs/research/jev-architecture.md` §9) |
| ¿Provider default? | **Determinístico** | Local-First, sin red, reproducible |
| ¿Quién manda? | **HalTest policy** | Confidence solo enruta; validación Playwright decide |
| ¿Ollama vs Jev? | Coexisten bajo `DecisionProvider` | `local` y `jev` son providers; fallback en cadena |
| ¿UI nueva? | Extensión de la config AI existente | No crear pantalla separada |

## Riesgos globales y mitigaciones

| Riesgo | Mitigación | Fase |
|--------|-----------|------|
| Jev caído/rate-limit | Fallback chain → determinístico; timeout corto (2.5s) | 2 |
| Exfiltración de secretos | Sanitizer obligatorio + test red-team | 6 |
| False repairs | Validación Playwright REAL post-decisión | 3 |
| Confidence mal calibrada | Thresholds por caso de uso; MCE monitoreado | 7 |
| Migración DB rompe historial | Migración additive; backup; rollback runbook | 4 |
| Modelo Jev cambia versión | Registrar `model` usado en decisión; pin alias | 2 |

## Costes estimados de implementación (sin Jev real)

| Fase | Esfuerzo relativo | Dependencias |
|------|-------------------|--------------|
| P0 abstracción | S | — |
| P1 gateway en healing | M | P0 |
| P2 provider Jev | M | P0 |
| P3 auto-healing Jev | M | P2 |
| P4 History | M | P1 |
| P5 UI config | M | P4 |
| P6 seguridad | S | P2 |
| P7 métricas | S | P4 |

## ¿Cómo terminamos?

Con el gate real medido (2026-09-20), la elección para **auto-healing** es:

- **DO NOT ADOPT el provider Jev en healing** (evidencia medida: sin mejora funcional,
  peor calibración, política inusable). La rama documenta el resultado; el contrato
  `DecisionProvider` queda como base reutilizable si se reabre con fixtures adversariales
  o para casos de uso no medidos (retry/heal/human con Noul, assertions semánticas con Score).

Decisión formal sobre la rama:
- **DO NOT ADOPT (healing)** → documentar y descartar la rama, o
- **KEEP EXPERIMENTAL (abstracción)** → mantener `spike/jev-decision-provider` sin merge.
- Si un futuro gate pasa (casos duros + MCE ≤ 0.3) → **ADOPT PARTIALLY** (P0–P3).

Ningún merge a `main` sin aprobación explícita (Sección 20 del spike).