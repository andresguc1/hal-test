# Plan de Implementación — Automatic AI Model Discovery

**Estado:** Listo para implementar (investigación arquitectónica completada — veredicto: YES WITH MODIFICATIONS).
**Regla de oro:** no romper compatibilidad. `selectedModel` sigue siendo un string; ninguna migración; `LLMFactory`, `selectBestModel`, `AITaskOptimizer`, `SelectorHealer`, `AIUsageLog` no se tocan.

---

## 1. Objetivo

Convertir el campo manual "Custom Model Identifier" (`AISettingsPanel.jsx:271-288`) en un **selector automático de modelos** soportado por un endpoint de descubrimiento, con fallback de escritura libre, para los 5 proveedores que soporta `LLMFactory` (ollama, openai, openrouter, anthropic, google) más endpoints OpenAI-compatibles custom. La base queda lista para un futuro AI Model Router (mismos IDs de proveedor + `ModelMetadata` + telemetría existente).

## 2. Alcance / No alcance

**Alcance**

- Nuevo servicio backend `ModelDiscoveryService` con registry de discoverers por proveedor.
- Nuevo endpoint `POST /api/ai/discover-models`.
- Guard SSRF scoped (`sanitizeDiscoveryBaseUrl`) con allowlist + estado `REJECTED`.
- Frontend: hook `useModelDiscovery` + Combobox en `AISettingsPanel` + 13 estados + i18n (4 idiomas) + cache.
- Tests unit + integración (backend) y componente/hook (frontend).

**No alcance (futuros, NO en este plan)**

- Homogeneizar SSRF en `/api/actions/*` (bebida runtime no sanitizada: `extract_dom_context.js:88`).
- Fix del "Test Connection" cloud (hoy desviado a loopback por `sanitizeBaseUrl`, `ai.routes.js:20-33`).
- AI Model Router (diseñado para reutilizar este registry, sección 12).

## 3. Arquitectura target

```
POST /api/ai/discover-models {provider, apiKey, baseUrl}
   └─ ai.routes.js → controller → AIService.discoverModels (passthrough)
        └─ ModelDiscoveryService.discoverModels({provider, apiKey, baseUrl})
             ├─ ollama    → reutiliza AIService.healthCheck → GET {base}/api/tags (m.name)
             ├─ openai    → GET {base}/v1/models   (Authorization: Bearer)
             ├─ openrouter→ GET {base}/v1/models   (Authorization: Bearer)
             ├─ anthropic → GET {base}/v1/models   (x-api-key + anthropic-version: 2023-06-01)
             ├─ google    → GET {base}/models?key=… (strip prefijo 'models/')
             └─ custom    → probe GET {base}/v1/models; si no → state NOT_SUPPORTED
                  └─ normalize → ModelMetadata[] → res.json(...)
```

Nada nuevo en `LLMFactory.js`; `AIService` solo gana un delegado delgado.

## 4. Fases

- **Fase A — Backend servicio + discoverers** (T1–T3): `ModelDiscoveryService`, 6 discoverers, normalización + estados. TDD unit.
- **Fase B — Ruta + SSRF + tests integración** (T4–T6): `POST /api/ai/discover-models`, `sanitizeDiscoveryBaseUrl`, `model-discovery.test.js`.
- **Fase C — Frontend** (T7–T8): hook, Combobox, estados, locales, cache.
- **Fase D — Verificación + commit** (T9–T10): lint, build, suite completa, smoke real con Ollama, docs swagger, commit convencional.

## 5. Tareas detalladas

### Tarea 1 — ModelDiscoveryService + registry

- **Objective:** servicio singleton con API `discoverModels()` y registro de discoverers.
- **Files (nuevos):** `apps/backend/services/ModelDiscoveryService.js`
- **Changes:**
  - Clase `ModelDiscoveryService` con `#discoverers = new Map()` y `register(discoverer)`.
  - `async discoverModels({ provider, apiKey, baseUrl })`:
    - `const discoverer = this.#discoverers.get(normalizeProvider(provider))`; desconocido → `{state: 'NOT_SUPPORTED'}`.
    - timeout por proveedor (8 s ollama/custom, 10 s cloud) usando `AbortController` (patrón `AIService.js:715-720`).
    - errors → `llmFactory.mapError()` + mapping a `DiscoveryState`.
    - limite de salida 500 modelos, orden alfabético por `id`.
  - Helper `toDiscoveryBase(baseUrl, provider)`: quita trailing `/v1` / `/v1beta`; normaliza `localhost`→`127.0.0.1` (mismo criterio `LLMFactory.js:145-147`).
  - `export const modelDiscoveryService = new ModelDiscoveryService();`
- **Dependencies:** `llmFactory` (`services/LLMFactory.js`); `modelDiscoveryService ` no debe importar `AIService` de forma circular → el discoverer Ollama recibe `AIService.healthCheck` por inyección/registro posterior.
- **Risks:** importación circular con `AIService` (AIService importerá el singleton del servicio) → registrar el discoverer Ollama con una factory lazy de `healthCheck`.
- **Validation:** unit tests de `toDiscoveryBase` y de estados FAILED/TIMEOUT con `vi.stubGlobal('fetch')`.

### Tarea 2 — Discoverers por proveedor (6)

- **Objective:** listar modelos con fetch raw.
- **Files (nuevos):** `apps/backend/services/discovery/_index.js` (registro), `ollama.discoverer.js`, `openai.discoverer.js`, `openrouter.discoverer.js`, `anthropic.discoverer.js`, `google.discoverer.js`, `genericOpenAI.discoverer.js`.
- **Changes:**
  - Contrato de `Discoverer`: `{ provider, async listModels({ key, baseUrl, signal }) → ModelMetadata[] }`.
  - `ollama`: usa `healthCheck({baseUrl})` → `health.models` (`AIService.js:730`) → `{id: name, label: name, source:'native'}`.
  - `openai`/`openrouter`: `GET {base}/v1/models`, header `Authorization: Bearer ${key}` → `data[].id`.
  - `anthropic`: headers `x-api-key` + `anthropic-version: '2023-06-01'` → `data[].id` + `display_name`.
  - `google`: `GET {base}?key=${key}` (base ya incluye `/v1beta`) → `models[].name` con strip `models/`; `displayName` como label.
  - `genericOpenAI` (custom): probe `GET {base}/v1/models`; respuesta Ok → mapear, 404/501 → lanzar sentinel → `NOT_SUPPORTED`.
- **Dependencies:** T1.
- **Risks:** respuestas malformadas/lanza JSON distinto → try/catch + estado `FAILED`; API Anthropic exige `anthropic-version`.
- **Validation:** unit por proveedor (happy + 401 + timeout + malformed).

### Tarea 3 — Normalización + enum estados

- **Objective:** tipo `ModelMetadata` + `DiscoveryState` + cap de salida.
- **Files:** `apps/backend/services/discovery/types.js` (nuevos).
- **Changes:**

  ```js
  // ModelMetadata
  { id: string, label?: string, ownedBy?: string, contextWindow?: number, source: string }

  // DiscoveryState (13)
  'IDLE'|'LOADING'|'SUCCESS'|'FAILED'|'TIMEOUT'|'UNAUTHORIZED'|'CONNECTION_REFUSED'|
  'NOT_SUPPORTED'|'NO_MODELS_FOUND'|'PARTIAL'|'OFFLINE'|'CUSTOM'|'REJECTED'
  ```

  - `id` siempre 1:1 con lo que hoy acepta `x-ai-model` (identificadores guardados previos siguen válidos).

- **Dependencies:** T2.
- **Risks:** IDs con `/` (OpenRouter) u otros chars no soportados por el SDK → solo informativo.
- **Validation:** test de mapeos por proveedor.

### Tarea 4 — Ruta + controller

- **Objective:** exponer `POST /api/ai/discover-models`.
- **Files:** `routes/ai.routes.js` (editar), `controllers/aiDiscovery.controller.js` (nuevo).
- **Changes:**
  - Controller: valida `provider` en set conocido y `apiKey` requerida si cloud; llama `aiService.discoverModels`; responde:
    ```js
    // 200
    { success: true, provider, baseUrl, state: 'SUCCESS', models: ModelMetadata[] }
    // 400 (body inválido) / 200 con estado no exitoso
    { success: true, provider, baseUrl, state: 'NOT_SUPPORTED'|'REJECTED'|..., models: [], error?: string }
    ```
  - Bloque `@swagger` en `ai.routes.js` (patrón `:37-42`).
- **Dependencies:** T1–T3.
- **Risks:** sobre-uso → `apiLimiter` ya global (`app.js:143`).
- **Validation:** supertest.

### Tarea 5 — Guard SSRF scoped

- **Objective:** `sanitizeDiscoveryBaseUrl` sin alterar rutas existentes.
- **Files:** `routes/ai.routes.js` (nuevo helper junto a `sanitizeBaseUrl`, `:20-33`).
- **Changes:**
  ```js
  const DISCOVERY_ALLOWED_HOSTS = new Set([
    "127.0.0.1",
    "::1",
    "localhost",
    "[::1]", // local
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
    "openrouter.ai",
  ]);
  // + process.env.HALTEST_ALLOWED_AI_BASE_URLS (csv hosts) para gateways propietarios
  ```

  - Host no permitido → **NO swap silencioso**: devuelve señal para responder `state:'REJECTED'` (error explícito).
  - Solo `http:`/`https:`, `redirect:'error'`.
- **Dependencies:** T4.
- **Risks:** gateways propietarios → documentar el env override en el swagger.
- **Validation:** tests REJECTED / permitido / loopback.

### Tarea 6 — Tests backend

- **Objective:** cobertura unit + integración del discovery.
- **Files (nuevos):** `apps/backend/__tests__/model-discovery.test.js`, `__tests__/model-discovery-routes.test.js`.
- **Changes:** casos por proveedor, estados de error, SSRF (REJECTED), 400 sin key, body inválido; patrón `ai-usage.test.js` (supertest + app) y `vi.stubGlobal('fetch')`.
- **Dependencies:** T1–T5.
- **Risks:** ninguno relevante.
- **Validation:** `npx vitest run __tests__/model-discovery.test.js __tests__/model-discovery-routes.test.js`

### Tarea 7 — Frontend combobox + hook

- **Objective:** selector real en caliente, reemplaza el Input `:271-288`.
- **Files:** `apps/frontend/src/components/settings/AISettingsPanel.jsx` (editar), nuevos: `apps/frontend/src/hooks/useModelDiscovery.js`, `apps/frontend/src/components/settings/ModelDiscoveryCombobox.jsx`.
- **Changes:**
  - `useModelDiscovery(provider, baseUrl, apiKey)`: llama `/ai/discover-models`, maneja los 13 estados, merge con cache `hal_ai_models_cache` (clave `provider|baseUrl`).
  - Combobox (Popover+Command, ya presentes en el proyecto): trigger = `selectedModel`, lista buscable, y **siempre** permite escribir custom (estado `CUSTOM`).
  - Botón "Discover Models" junto a "Test Connection" (`:350-354`); auto-llenar tras Test Connection exitoso.
  - `onSelect(id)` → `updateConfig({selectedModel: id})` (guarda idéntico a hoy, `:122`).
  - Mantener `getDefaultModel()` como placeholder inicial.
- **Dependencies:** T4 (endpoint).
- **Risks:** regresión del guardado → `selectedModel` string intacto; estado de carga sin dobles fetch.
- **Validation:** render + interacción con jsdom; lint.

### Tarea 8 — Locales + cache

- **Objective:** i18n y cache funcional.
- **Files:** `apps/frontend/src/locales/en.json`, `es.json`, `fr.json`, `pt.json`; `useModelDiscovery.js`.
- **Changes:** claves `settings.ai.model_discovery.*` (`md_title`, `md_discover`, `md_loading`, `md_success`, `md_failed`, `md_rejected`, `md_not_supported`, `md_none_found`, `md_custom_hint`); fr/pt → fallback `en`. Cache: `localStorage`, invalida al cambiar provider/baseUrl, sin TTL forzado (clave = identidad).
- **Dependencies:** T7.
- **Risks:** keys faltantes en fr/pt → fallbackLng `en` ya configurado.
- **Validation:** revisión de los 4 JSON (grep de claves).

### Tarea 9 — Tests frontend + regresión

- **Objective:** verde en todo el repo.
- **Files (nuevos):** `apps/frontend/src/hooks/useModelDiscovery.test.js` (o según runner del proyecto), test de componente con los 13 estados.
- **Changes:** mock de `api.post`.
- **Dependencies:** T7–T8.
- **Risks:** flaky pre-existente `security_routes.test.js` (30 s, pasa aislado) → no relacionado.
- **Validation:** `npm run lint` (backend+frontend), `npx turbo run build` / `vite build`, suite vitest completa.

### Tarea 10 — Docs endpoint (swagger)

- **Objective:** documentación `POST /api/ai/discover-models` in-code.
- **Files:** `routes/ai.routes.js` (bloque `@swagger`, patrón `:37-42`).
- **Dependencies:** T4.
- **Risks:** ninguno.
- **Validation:** revisión manual del bloque.

## 6. Contrato del endpoint

**`POST /api/ai/discover-models`**

```jsonc
// Request
{ "provider": "ollama|openai|openrouter|anthropic|google|(custom compatible)",
  "apiKey": "sk-...",           // requerida si cloud; opcional/local ollama
  "baseUrl": "http://127.0.0.1:11434/v1" }   // se normaliza internamente

// 200 OK
{ "success": true, "provider": "ollama", "baseUrl": "http://127.0.0.1:11434",
  "state": "SUCCESS",
  "models": [ { "id": "gemma3:2b", "label": "gemma3:2b", "source": "native" } ] }

// 200 OK con estado no exitoso (NO usar 400 salvo body inválido)
{ "success": true, "provider": "openai", "state": "REJECTED",
  "models": [], "error": "Base URL host is not allowed (discovery policy)" }

// 400
{ "success": false, "message": "apiKey is required for provider openai" }
```

Estados devueltos: `SUCCESS | FAILED | TIMEOUT | UNAUTHORIZED | CONNECTION_REFUSED | NOT_SUPPORTED | NO_MODELS_FOUND | PARTIAL | REJECTED`.

## 7. Normalización de modelos

| Proveedor  | `id`                                  | `label`        | `source`            |
| ---------- | ------------------------------------- | -------------- | ------------------- |
| ollama     | `m.name`                              | `m.name`       | `native`            |
| openai     | `data[].id`                           | `data[].id`    | `openai-compatible` |
| openrouter | `data[].id`                           | `data[].id`    | `openai-compatible` |
| anthropic  | `data[].id`                           | `display_name` | `anthropic-native`  |
| google     | `models[].name` sin prefijo `models/` | `displayName`  | `google-native`     |
| custom     | `data[].id`                           | `data[].id`    | `openai-compatible` |

## 8. Seguridad

- Endpoint tras `authenticated` (`app.js:190`) y `apiLimiter` (`app.js:143`) de forma global.
- `sanitizeDiscoveryBaseUrl`: loopback + allowlist fija + `HALTEST_ALLOWED_AI_BASE_URLS`; host inválido → `REJECTED` explícito (nunca fallback calla a 127.0.0.1).
- `redirect:'error'`, timeouts 8–10 s, sin logueo de la key (solo preview enmascarada).
- No se amplía el manejo actual de `x-ai-api-key` (raw en localStorage, mismo flujo que `validateKey`).

## 9. Testing

- **Backend unit** (`__tests__/model-discovery.test.js`): `vi.stubGlobal('fetch', ...)` por proveedor + errores (401, timeout, refused, malformed) + `toDiscoveryBase`.
- **Backend integración** (`__tests__/model-discovery-routes.test.js`): supertest, auth guest, REJECTED, 400 sin key.
- **Frontend**: hook + componente con 13 estados (mock `api.post`).
- **Regresión**: suite completa + lint + build.

## 10. Criterios de aceptación

1. `POST /api/ai/discover-models` devuelve la lista de modelos reales de Ollama instalado (smoke con `ollama list`).
2. Con Ollama caído → `CONNECTION_REFUSED` amigable (no crash).
3. Cloud: `state:SUCCESS` con lista de IDs; key inválida → `UNAUTHORIZED`.
4. Host no permitido → `REJECTED` explícito (nunca swap a 127.0.0.1).
5. En la UI, al seleccionar modelo descubierto, `selectedModel` guardado es string idéntico → `x-ai-model` sin cambios → runner enfría al ejecutar acciones (extract_dom_context, smart_selector, etc.).
6. La suite completa pasa (68 archivos / ~689 tests + los nuevos); sin migraciones, sin cambios en `hal_ai_config`.

## 11. Riesgos y mitigaciones

| Riesgo                                                    | Mitigación                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| Volúmenes (OpenRouter cientos de modelos)                 | Cap 500 + combobox buscable                                           |
| SSRF relajado                                             | Allowlist + REJECTED + timeouts + redirect:'error'                    |
| Base Ollama con `/v1` rompe `/api/tags`                   | `toDiscoveryBase()` antes de healthCheck                              |
| Import circular AIService↔discovery                       | Inyección lazy del `healthCheck` al discoverer Ollama                 |
| Regresión UI/guardado                                     | `selectedModel` string, placeholder `getDefaultModel`, fallback libre |
| "Test Connection" cloud desviada a loopback (bug latente) | Documentado como Existing Issue; fuera de scope                       |

## 12. Futuro: AI Model Router

- Mismos provider-ids del registry → el Router selecciona con el catálogo.
- Telemetría ya existente (`AIUsageLog`: provider, model, taskType, latency, tokens, success) + `AITaskOptimizer` (políticas por taskType) alimentan el scorer.
- `ModelMetadata.contextWindow` habilita filtros de capacidad.
- El override manual (`CUSTOM`) debe mantenerse: routing siempre opt-in.

## 13. Commits sugeridos (estilo conventional, English)

1. `feat(ai): model discovery service and per-provider listing` → T1–T3 + T6 (unit)
2. `feat(ai): discover-models endpoint with scoped SSRF policy` → T4–T5 + T6 (routes) + T10
3. `feat(ai): model selector combobox in AI settings` → T7–T9

Husky ejecuta format + lint en cada commit (no modificarlo).
