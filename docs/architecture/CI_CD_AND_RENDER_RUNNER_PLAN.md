# Plan de Implementación: Integración CI/CD + Corrección S1 del Runner en Render

> **Autor:** Arquitectura / DevOps / Automatización Playwright
> **Fecha:** 2026-09-25
> **Alcance:** Prioridad 1 (CI/CD nativo) y Prioridad 2 (defecto S1 del runner en la nube)
> **Método:** Inspección del código fuente + verificación de hipótesis contra los issues upstream de Playwright y la documentación de Render.

---

## 0. Resumen ejecutivo — tres hallazgos que corrigen el brief

Antes de planificar, es obligatorio corregir el diagnóstico de partida. Tres de los supuestos del briefturned se **no** sostienen tras la inspección:

| #      | Supuesto del brief                                                         | Veredicto                                               | Evidencia                                                              |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| **H1** | El defecto S1 es "falta del socket D-Bus"                                  | **❌ Falso — es ruido cosmético**                       | Ver abajo                                                              |
| **H2** | El defecto S1 es "ausencia de `--no-sandbox` / `--disable-setuid-sandbox`" | **❌ Falso — ya están inyectados**                      | `apps/backend/services/browser.service.js:384-401`                     |
| **H3** | HalTest no tiene integración CI/CD                                         | **⚠️ Parcialmente falso — existe ~40% y está roto**     | `apps/cli/` publicado en npm; `PlaywrightGenerator` ya emite workflows |
| **H4** | El Dockerfile es la vía de despliegue recomendada                          | **❌ No construye** — digest SHA256 inválido (65 chars) | `Dockerfile:38`                                                        |

### H1 — El error de D-Bus no es la causa

El mensaje citado en la auditoría:

```
[ERROR:bus.cc(407)] Failed to connect to the bus: Failed to connect to socket
/var/run/dbus/system_bus_socket: No such file or directory
```

aparece textualmente en **`mcr.microsoft.com/playwright:v1.40.0-focal`** — la imagen oficial de Playwright con _todas_ las dependencias ya instaladas — en ejecuciones **exitosas**:

- `microsoft/playwright#28452` — 45 tests, config oficial, el error D-Bus aparece y los tests pasan.
- `microsoft/playwright#13201`, `#15870`, `#16168`, `#15510` — mismo patrón, nivel `ERROR`, sin impacto.

Es una línea de log de Chromium en `ERROR` que se emite siempre que no haya un bus de sistema. Chromium **degrada con elegancia** y sigue operando. **No bloquea el arranque del navegador.** Arreglarla (instalar `dbus-daemon`) elimina el síntoma, no la causa. Tratar esto como S1 guarantee tiempo perdido.

### H2 — Los flags de sandbox ya están

`apps/backend/services/browser.service.js:384-401`:

```js
if (browserType === "chromium") {
  const stabilityArgs = [
    "--no-sandbox", // ✅ ya presente
    "--disable-dev-shm-usage", // ✅ ya presente
    "--disable-setuid-sandbox", // ✅ ya presente
    "--disable-blink-features=AutomationControlled",
    "--disable-extensions",
  ];
  if (headless) {
    stabilityArgs.push("--disable-gpu", "--disable-software-rasterizer");
  }
  launchArgs.push(...stabilityArgs);
}
```

Playwright **tampoco necesita** estos flags: los inyecta él mismo por defecto. Añadirlos es redundante pero inofensivo.

### H4 — La causa raíz real, y el Dockerfile no construye

**Causa raíz:** `render.yaml:5` declara `runtime: node`.

```yaml
- type: web
  name: hal-test-backend
  runtime: node # ← Render native runtime = Debian 12 bookworm
  buildCommand: pnpm install --frozen-lockfile && pnpm build:monolith && npx playwright install chromium
```

El runtime nativo de Render es un Debian 12 genérico **sin las librerías compartidas** que Chromium necesita. `npx playwright install chromium` descarga el _binario_ pero no las _librerías del SO_. Y la variante que sí instala librerías, `--with-deps`, **falla en Render** porque `install-deps` intenta escalar privilegios con `su`:

```
Playwright Host validation warning:
  Host system is missing dependencies to run browsers.
  Missing libraries:
    libgstgl-1.0.so.0          libenchant-2.so.2      libGLESv2.so.2
    libgstcodecparsers-1.0.so.0 libsecret-1.so.0      libmanette-0.2.so.0
Switching to root user to install dependencies...
su: Authentication failure
Error: Installation process exited with code: 1
```

(Referencia: `chartbrew/chartbrew#264`, con rutas de Render `/opt/render/project/src/server/node_modules/playwright-core/...`)

**Y el escape —usar el Dockerfile del repo— está roto.** `Dockerfile:38` pinnea el digest de la imagen de Playwright con una cadena **fabricada a mano**:

```
FROM mcr.microsoft.com/playwright:v1.62.1-jammy@sha256:0b3c2c5b3e7c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6
                                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 65 caracteres
```

Un SHA-256 tiene **exactamente 64 hex chars**. Esta línea tiene 65. Docker rechaza el build con `invalid reference format`. El digest es además visualmente fabricated (`0b3c2c5b3e7c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6` — digitos secuenciales). El digest del builder (`Dockerfile:4`, 64 chars) sí es plausible.

**Conclusión:** el runner en la nube nunca funcionó, y nunca funcionó por la razón _equivocada_. La corrección no es una bandera de Chromium: es **cambiar `runtime: node` → `runtime: docker`** y arreglar el digest.

---

## 1. Estado real de la integración CI/CD (H3)

Existe más de lo que sugiere el brief. Inventario verificado:

| Pieza                                       | Estado                                           | Ubicación                                                                     |
| ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Paquete npm `haltest` publicado             | ✅ Funciona                                      | `apps/cli/package.json`, pipeline en `release.yml` (12 jobs, OIDC provenance) |
| `haltest run <flowId>` con exit code 0/1    | ⚠️Funcional pero **solo local**                  | `apps/cli/src/index.js:77-211`                                                |
| Streaming de logs vía socket.io             | ⚠️ Requiere WebSocket abierto                    | `apps/cli/src/index.js:96`                                                    |
| Token de autenticación                      | ❌ **Ausente** — la CLI no envía `Authorization` | `apps/cli/src/index.js` no lo referencia                                      |
| Descarga de artefactos (HTML + screenshots) | ❌ Ausente                                       | —                                                                             |
| Salida JUnit XML                            | ❌ Ausente (schema-accepted, handler stub)       | `plugins/core-testing/handlers/run_tests.js` (23 líneas, simula)              |
| Fallback por polling HTTP                   | ❌ Ausente                                       | —                                                                             |
| `haltest export` a Playwright nativo        | ⚠️ Solo vía API/UI, no CLI                       | `routes/export.router.js:45`                                                  |
| Generador de workflows GHA/GitLab           | ⚠️ **Emite config rota**                         | `PlaywrightGenerator.js:254-298`                                              |
| `playwright.config.js` generado             | ❌ **`headless: false`** → CI cuelga             | `PlaywrightGenerator.js:232`                                                  |
| E2E de HalTest en su propio CI              | ❌ **Workflow muerto**                           | `apps/backend/.github/workflows/playwright.yml`                               |

Sobre ese último punto: GitHub Actions **solo lee `.github/workflows` en la raíz del repo**. Ese archivo está commiteado dentro de `apps/backend/` y **nunca se ha ejecutado**. Es una trampa latente: el equipo cree que hay E2E en CI y no lo hay.

### Los tres bloqueos reales de CI

1. **Autenticación.** `apps/backend/middlewares/auth.middleware.js:7-35` acepta `Bearer <JWT Supabase>`. Pero `apps/cli/src/index.js` nunca envía ese header. Contra la nube (`AUTH_ENABLED=true` en `render.yaml:20`) la CLI operates como `guest-user`.
2. **Autorización.** `run.controller.js:66-95`: si `project.collaborationEnabled`, solo el `owner` puede ejecutar. Un `guest-user` recibe **403**. Aunque se corrigiera (1), el CI seguiría bloqueado por (2).
3. **Transporte.** El único mecanismo de espera es WebSocket (`socket.on('flow-finished')`). Detrás de proxies corporativos, en runners de GitLab, o con `GITLAB_CI` egress restringido, el socket se cae y el job **queda colgado hasta el timeout**, sin escribir resultados.

---

## 2. Análisis de viabilidad

### Prioridad 2 — S1 Runner (bloqueante, bajo effort)

| Ítem                                                     | Esfuerzo | Impacto               | Riesgo                               |
| -------------------------------------------------------- | -------- | --------------------- | ------------------------------------ |
| P2.1 Corregir digest inválido del `Dockerfile`           | 15 min   | **Bloqueante**        | Bajo                                 |
| P2.2 `render.yaml`: `runtime: node` → `docker`           | 30 min   | **Bloqueante**        | Medio — cambia el servicio en Render |
| P2.3 `PLAYWRIGHT_BROWSERS_PATH` incorrecto para Docker   | 10 min   | Alto                  | Bajo                                 |
| P2.4 `dbus-x11` + hardening (tini, healthcheck, no-root) | 2 h      | Medio                 | Bajo                                 |
| P2.5 Subir de plan `free` (512 MB)                       | 5 min    | **Bloqueante**        | Coste                                |
| P2.6 Pre-flight `/api/doctor` en el healthcheck          | 1 h      | Alto (observabilidad) | Bajo                                 |
| P2.7 Silenciar el log D-Bus (cosmético)                  | 30 min   | Bajo                  | Bajo                                 |

**Veredicto: viable, ~1 día de trabajo. P2.1–P2.3 + P2.5 son suficientes para desbloquear.**

> ⚠️ **P2.5 es crítico y subestimado.** `plan: free` en Render = **0.1 CPU / 512 MB RAM**. Un único Chromium headless consume típicamente **250–400 MB RSS**. Aunque las librerías se instalen correctamente, el proceso será OOM-killed. El plan mínimo viable es `starter` (`1c-1g`); recomendado `1c-2g` para concurrencia de navegador + API en el mismo proceso.

### Prioridad 1 — CI/CD (alta valore, effort medio)

| Ítem                                                            | Esfuerzo | Impacto        | Riesgo |
| --------------------------------------------------------------- | -------- | -------------- | ------ |
| P1.1 Auth en la CLI (`--token`, `HALTEST_TOKEN`)                | 1 h      | **Bloqueante** | Bajo   |
| P1.2 Cliente HTTP puro (eliminar dependencia de WebSocket)      | 4 h      | **Bloqueante** | Bajo   |
| P1.3 Descarga de artefactos (HTML + screenshots)                | 3 h      | Alto           | Bajo   |
| P1.4 Emisor JUnit XML                                           | 2 h      | Alto           | Bajo   |
| P1.5 GitHub Actions annotations + `::group::`                   | 2 h      | Medio          | Bajo   |
| P1.6 `haltest exec` (self-contained, para imágenes Docker CI)   | 4 h      | Alto           | Medio  |
| P1.7 `haltest export` a spec Playwright nativo                  | 2 h      | Alto           | Bajo   |
| P1.8 Arreglar config Playwright generado (`headless: false`)    | 15 min   | **Bloqueante** | Bajo   |
| P1.9 `haltest init-ci` (scaffolding de workflow)                | 2 h      | Medio          | Bajo   |
| P1.10 GitLab CI / action oficial                                | 4 h      | Medio          | Bajo   |
| P1.11 Token de service-account (`CI` role) en backend           | 6 h      | needed         | Medio  |
| P1.12 E2E de HalTest en su propio CI (arreglar workflow muerto) | 4 h      | Medio          | Bajo   |
| P1.13 GitHub Action oficial (`haltest-action`)                  | 6 h      | Medio          | Bajo   |

**Veredicto: viable, ~3 días para P1.1–P1.9 (el "walking skeleton" de CI). ~6 días para el set completo.**

---

## 3. Arquitectura propuesta — dos carriles

La clave del diseño es que **CI/CD no debe ejecutarse de una sola forma**. HalTest debe ofrecer dos carriles complementarios:

```
┌─────────────────────────────────────────────────────────────────┐
│  CARRIL A — "HalTest como servicio" (managed / cloud-first)      │
│  El flujo vive en HalTest (UI/DB). El CI es un cliente thin.    │
│                                                                  │
│  .github/workflows/  ──▶  npx haltest run <flowId>               │
│                               │  POST /api/runs/start            │
│                               │  GET  /api/runs/:id   (poll)      │
│                               │  GET  /api/runs/:id/report         │
│                               ▼                                  │
│                     ┌──────────────────┐                         │
│                     │  HalTest Cloud   │  ◀── Playwright runner  │
│                     │  (Render Docker) │      (corregido)         │
│                     └──────────────────┘                         │
│  Pros:零 infraestructura, centralizado, auto-healing, UI.       │
│  Contras: coste cloud, Multitenant, red.                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CARRIL B — "Playwright nativo" (self-hosted / code-owned)      │
│  El equipo es dueño del spec. Corre en el runner, en su red.    │
│                                                                  │
│  .github/workflows/  ──▶  npx haltest export <flowId>           │
│                               │  POST /api/export/code           │
│                               ▼                                  │
│                     tests/checkout.spec.ts   ◀── código         │
│                     playwright.config.ts        versionado       │
│                               │                                  │
│                               ▼  npx playwright test            │
│                     (en mcr.microsoft.com/playwright)           │
│  Pros: 0 coste, red interna,调试 nativo, PRs por teammate.      │
│  Contras: el flow se desincroniza del canvas, sin auto-healing. │
└─────────────────────────────────────────────────────────────────┘
```

El Carril A resuelve la **barrera de adopción** (feedback rápido, cero config). El Carril B resuelve el **requisito corporativo** (código en el repo, red, ownership). El brief pide explícitamente ambos ("empaquetar los flujos visuales para que se ejecuten como pruebas nativas de Playwright" **y** "comando CLI para integrar en `.github/workflows/ci.yml`").

---

## 4. Plan de implementación — Prioridad 2 (S1 Runner)

### Fase 0 — Desbloqueo (30 min, 3 ficheros)

**T0.1 — Corregir el digest inválido** · `Dockerfile:38`

```dockerfile
# ANTES (no construye: 65 hex chars)
FROM mcr.microsoft.com/playwright:v1.62.1-jammy@sha256:0b3c2c5b3e7c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6 AS runner

# DESPUÉS (fix temporal: tag浮动; se repinea en T0.3)
FROM mcr.microsoft.com/playwright:v1.62.1-jammy AS runner
```

Comando para obtener el digest real y repinear:

```bash
docker pull mcr.microsoft.com/playwright:v1.62.1-jammy
docker inspect mcr.microsoft.com/playwright:v1.62.1-jammy \
  --format='{{index .RepoDigests 0}}'
# -> mcr.microsoft.com/playwright@sha256:<64 hex chars REALES>
```

> **Proceso:** esto no es un one-off. Crear `scripts/pin-docker-digests.js` que verifique en cada build que todo `FROM ...@sha256:` tenga exactamente 64 chars hex, y falle el build si no. Sin eso, el mismo bug vuelve.

**T0.2 — Migrar Render al runtime Docker** · `render.yaml`

```yaml
services:
  - type: web
    name: hal-test-backend
    runtime: docker # ← era `node`
    dockerfilePath: ./Dockerfile # implícito, pero explícito es mejor
    dockerContext: .
    region: oregon
    plan: 1c-2g # ← era `free` (0.1 CPU / 512 MB): OOM
    healthCheckPath: /api/health
    maxShutdownDelaySeconds: 120 # drenar ejecuciones en vuelo
    envVars:
      - key: NODE_ENV
        value: production
      - key: HALTEST_MODE
        value: cloud
      - key: AUTH_ENABLED
        value: "true"
      # ELIMINAR: PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/.cache/playwright
      #   Esa ruta es la convención del runtime NATIVO. En la imagen oficial
      #   los navegadores viven en /ms-playwright y la var ya está horneada.
      #   Sobrescribirla apunta a un directorio inexistente → "Executable doesn't exist".
      - key: HAL_MAX_BROWSERS
        value: "2" # 512MB→2GB con 2 navegadores chromium
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: HALTEST_MASTER_ENCRYPTION_KEY
        sync: false
      - key: ALLOWED_ORIGINS
        value: "https://haltest.com"

  # staging: idéntico, con NODE_ENV=staging
```

> ⚠️ **Punto de fricción operativo:** cambiar `runtime` de `node` a `docker` en un servicio existente **requiere recrear el servicio en el dashboard de Render** (la doc de Render dice _"You can change a service's runtime after creation"_, pero en la práctica un web service `node`→`docker` exige recrear y puede **perder el historial de deploys**). Planificarlo como ventana de mantenimiento, no como un push a `main`.

**T0.3 — Verificar la imagen antes de tocar nada**

```bash
docker build -t haltest:probe -f Dockerfile .
docker run --rm --init haltest:probe \
  node -e "
    const { chromium } = require('playwright');
    (async () => {
      const b = await chromium.launch();
      const p = await b.newPage();
      await p.setContent('<h1>ok</h1>');
      console.log('LAUNCH OK:', await p.title() || '(sin title)');
      await b.close();
    })().catch(e => { console.error('LAUNCH FAIL:', e.message); process.exit(1); });
  "
```

Si esto pasa, el problema de librerías está resuelto por construcción.

### Fase 1 — Hardening del contenedor (2 h)

**T1.1 — `Dockerfile`: robustez de proceso y de artefactos**

```dockerfile
# --- STAGE 2: Runner ---
FROM mcr.microsoft.com/playwright:v1.62.1-jammy AS runner

# tini: reaping de zombies. Chromium genera procesos hijos; sin init,
# los zombies se acumulan y agotan la tabla de procesos del pod.
# Playwright lo recomienda explícitamente (equivale a `docker run --init`).
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# dbus-x11: SILENCIA el log `Failed to connect to the bus`.
# NO es el fix del defecto S1 (ese log es cosmético) — es higiene de logs
# para que el error real sea visible en `docker logs`.
# La imagen oficial ya trae xvfb; dbus-x11 cierra el hueco restante.
RUN apt-get update \
 && apt-get install -y --no-install-recommends dbus-x11 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2001
# La imagen oficial ya define PLAYWRIGHT_BROWSERS_PATH=/ms-playwright.
# NO sobrescribir.

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/node_modules ./node_modules

# browser.service.js:11-15 escribe en /var/tmp/hal_browser_tmp y setea TMPDIR.
# Crear en build-time con el owner correcto evita un mkdir en cada boot y
# garantiza que el path corto (<108 chars) que evita el SIGTRAP de UNIX
# sockets siga existiendo para el usuario del proceso.
RUN mkdir -p /app/apps/backend/storage /var/tmp/hal_browser_tmp

# El healthcheck NO debe hacer polling a la API: /api/health es trivial
# (uptime + memoria). La verificación real de que Playwright arranca es
# /api/doctor (T1.2), y debe ser un check separado, no bloqueante.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://localhost:2001/api/health || exit 1

EXPOSE 2001

# tini como PID 1 (no CMD directo) para reaping + señalización correcta.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "start"]
```

**T1.2 — Pre-flight de Playwright: hacer el fallo diagnosticable**

El `DoctorService` ya existe y detecta versión de Playwright, SO y binarios (`apps/backend/services/DoctorService.js`). Lo que **no** hace es _intentar lanzar un navegador_. Eso es precisamente lo que falla en la nube. Ampliarlo:

```js
// apps/backend/services/DoctorService.js — añadir a check()
async probeBrowserLaunch() {
    const result = {
        attempt: false, launched: false, error: null,
        missingLibraries: [], executableExists: false, durationMs: 0,
    };

    let chromium;
    try {
        ({ chromium } = await import('playwright'));
    } catch (e) {
        result.error = `playwright no resoluble: ${e.message}`;
        return result;
    }

    const execPath = chromium.executablePath();
    result.executableExists = fs.existsSync(execPath);
    if (!result.executableExists) {
        result.error =
            `Binario ausente en ${execPath}. ` +
            `Verificar PLAYWRIGHT_BROWSERS_PATH y que 'playwright install' corrió en build.`;
        return result;
    }

    // Chequeo de librerías compartidas — detecta la clase de fallo S1 real.
    // `ldd` lista los .so no resolubles sin lanzar nada.
    try {
        const { execFile } = await import('child_process');
        const { promisify } = await import('util');
        const { stdout } = await promisify(execFile)('ldd', [execPath]);
        result.missingLibraries = stdout
            .split('\n')
            .filter((l) => l.includes('not found'))
            .map((l) => l.trim());
    } catch { /* ldd no disponible: no bloqueante */ }

    if (result.missingLibraries.length) {
        result.error =
            `Librerías del SO ausentes: ${result.missingLibraries.join(', ')}. ` +
            `Usar la imagen oficial mcr.microsoft.com/playwright (runtime: docker), ` +
            `no el runtime nativo de Render.`;
        return result;
    }

    // Solo ahora gastar ~1s en un launch real.
    const started = Date.now();
    try {
        result.attempt = true;
        const browser = await chromium.launch({ headless: true });
        await browser.close();
        result.launched = true;
    } catch (e) {
        result.error = e.message;
    } finally {
        result.durationMs = Date.now() - started;
    }
    return result;
}
```

Cablear en `app.js:211` (hoy es síncrono; hacerlo `async` con el probe cacheado):

```js
app.get("/api/doctor", async (req, res) => {
  const report = doctorService.check();
  report.browser = await doctorService.probeBrowserLaunch();
  report.ok = report.ok && report.browser.launched;
  res.status(200).json(report);
});
```

Y en `doctorService.runStartupCheck()` (`app.js:383`), loguear una línea explícita:

```
[AUDIT] Browser probe: launched=true in 412ms (chromium 1.62.1, ubuntu22.04)
```

o

```
[AUDIT] Browser probe FAILED: Librerías del SO ausentes: libgstgl-1.0.so.0, libGLESv2.so.2.
       → cambiar render.yaml a runtime: docker
```

Esto convierte "falla en producción, discovered por el usuario" en "falla visible en el primer arranque tras el deploy".

### Fase 2 — Verificación en Render (1 h)

```bash
# 1. Tras el deploy, en el dashboard o por SSH:
curl -s https://haltest.com/api/doctor | jq '.browser, .ok'

# 2. Smoke end-to-end de un flujo real vía API autenticada:
TOKEN=<supabase-jwt>
curl -s -X POST https://haltest.com/api/runs/start \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"flowId":"<uuid>","projectId":"<uuid>","overrides":{"headless":true}}' | jq -r .runId

# 3. Poll hasta status terminal, luego descargar el reporte:
until [ "$(curl -s -H "Authorization: Bearer $TOKEN" \
    https://haltest.com/api/runs/$RUN_ID | jq -r .data.status)" != "running" ]; do sleep 5; done
curl -s -H "Authorization: Bearer $TOKEN" \
  https://haltest.com/api/runs/$RUN_ID/report -o report.html
```

Añadir `/api/doctor` como **step bloqueante** del job `deploy` en `.github/workflows/ci-cd.yml` (hoy solo hace health-poll y compara commits _sin fallar_).

---

## 5. Plan de implementación — Prioridad 1 (CI/CD)

### Fase 0 — Los dos fixes de 15 minutos

**T0.1 — Arreglar el config Playwright generado**

`apps/backend/services/exporter/generators/PlaywrightGenerator.js:216-236` emite `headless: false` incondicional. En CI eso significa que Chromium arranca con `headless=false` en un runner sin display → cuelga hasta el timeout. El propio `use` debería derivarlo de `CI`:

```js
// playwright.config.js GENERADO
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["list"],
        ["junit", { outputFile: "test-results/junit.xml" }],
        ["html", { open: "never" }],
        ["github"],
      ]
    : [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // ✅ FIX: headless en CI, headed en local.
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

Los `launchOptions.args` son necesarios porque los runners de GitLab usan la imagen oficial como **root**, y Chromium sin `--no-sandbox` se niega a arrancar (`crbug.com/638180`).

**T0.2 — Mover el workflow E2E muerto a la raíz**

```bash
git mv apps/backend/.github/workflows/playwright.yml .github/workflows/e2e.yml
# o, si se prefiere separarlo, añadir un job `e2e` a ci-cd.yml
```

Y añadir `test:e2e` a `apps/backend/package.json` (hoy no existe pese a que sí existe `playwright.config.ts`).

### Fase 1 — La CLI como cliente CI real

**T1.1 — Autenticación** · `apps/cli/src/`

El bloqueo #1. `apps/cli/src/index.js:18-21` hoy solo resuelve la URL:

```js
// apps/cli/src/config.js  — NUEVO, módulo de configuración centralizado
import "dotenv/config";

const strip = (s = "") => s.replace(/\/$/, "");

export function resolveConfig(overrides = {}) {
  const apiUrl = strip(
    overrides.apiUrl ??
      process.env.HALTEST_API_URL ??
      "http://localhost:2001/api",
  );

  // Orden de precedencia del token:
  //   1. --token (CI: ${{ secrets.HALTEST_TOKEN }})
  //   2. HALTEST_TOKEN / HALTEST_API_TOKEN (entorno / .env)
  //   3. token guardado por `haltest login`
  //   4. ninguno → servidor local en modo local (no auth)
  const token =
    overrides.token ??
    process.env.HALTEST_TOKEN ??
    process.env.HALTEST_API_TOKEN ??
    readStoredToken();

  return {
    apiUrl,
    socketUrl: apiUrl.replace(/\/api$/, ""),
    token,
    isRemote:
      /^https?:\/\//.test(apiUrl) && !/localhost|127\.0\.0\.1/.test(apiUrl),
    requestTimeoutMs: Number(process.env.HALTEST_TIMEOUT_MS ?? 30_000),
    pollIntervalMs: Number(process.env.HALTEST_POLL_INTERVAL_MS ?? 5_000),
  };
}
```

Y un cliente HTTP con auth inyectada, reintentos y timeouts:

```js
// apps/cli/src/http.js  — NUEVO
import axios from "axios";
import { resolveConfig } from "./config.js";

export function createClient(overrides = {}) {
  const cfg = resolveConfig(overrides);
  const http = axios.create({
    baseURL: cfg.apiUrl,
    timeout: cfg.requestTimeoutMs,
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
    // 5xx y 429 son transitorios en la nube: reintentar con backoff.
    // 4xx no: son fallos de configuración/auth y no deben enmascararse.
    validateStatus: (s) => s < 500,
  });

  http.interceptors.response.use(null, async (error) => {
    const { response, config } = error;
    const status = response?.status;
    if (status !== 429 && (status == null || status < 500)) throw error;
    config.__retries ??= 0;
    if (config.__retries >= 3) throw error;
    config.__retries += 1;
    const delay = 2 ** config.__retries * 1000 + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));
    return http(config);
  });

  return { http, cfg };
}
```

**T1.2 — Esperar por polling HTTP, no por WebSocket** (desbloqueo #3)

El WebSocket se mantiene como _opcional_ para streaming de logs bonito, pero **nunca** como mecanismo de terminación. Este es el corazón del cambio:

```js
// apps/cli/src/wait.js  — NUEVO
const TERMINAL = new Set(["completed", "failed", "cancelled"]);

/**
 * Espera a que un run llegue a estado terminal.
 *
 * Estrategia: polling HTTP como fuente de verdad (robusto: sobrevive a
 * proxies que bloquean WebSocket, y a runners de GitLab con egress
 * restringido). El socket es un acelerador opcional que solo emite logs.
 */
export async function waitForRun(http, runId, cfg, { onProgress } = {}) {
  const deadline = Date.now() + (cfg.runTimeoutMs ?? 15 * 60_000);
  let lastStatus = null;
  let consecutiveErrors = 0;

  for (;;) {
    if (Date.now() > deadline) {
      throw new CIError(
        `timeout_after_${Math.round((cfg.runTimeoutMs ?? 900_000) / 1000)}s`,
        `El run ${runId} no terminó dentro del presupuesto de tiempo.`,
        { runId, lastStatus },
      );
    }

    try {
      const { data } = await http.get(`/runs/${runId}`);
      const run = data.data;
      consecutiveErrors = 0;

      if (run.status !== lastStatus) {
        lastStatus = run.status;
        onProgress?.(run);
      }

      if (TERMINAL.has(run.status)) return run;
    } catch (e) {
      // Tolerar errores transitorios: el redeploy de Render reinicia el
      // socket y puede cortar el polling. Solo fallar si persiste.
      if (++consecutiveErrors >= 10) {
        throw new CIError("server_unreachable", e.message, { runId });
      }
    }

    await sleep(cfg.pollIntervalMs);
  }
}
```

**T1.3 — Recolectar artefactos**

Las primitivas ya existen en el backend:

- `GET /api/runs/:id/report` → HTML autocontenido con screenshots en base64 (`exportRunReportAction` → `ReportExporter.generateSingleFileReport`).
- `GET /api/storage/runs/<runId>/<nodeId>.png` → screenshots individuales (`app.js:143` sirve `STORAGE_DIR` estático).

```js
// apps/cli/src/artifacts.js  — NUEVO
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function collectArtifacts(http, runId, outDir, run) {
  const dir = path.resolve(outDir);
  await fs.mkdir(dir, { recursive: true });

  const written = [];

  // 1. Reporte HTML autocontenido (siempre; es pequeño y portable).
  try {
    const res = await http.get(`/runs/${runId}/report`, {
      responseType: "stream",
    });
    const dest = path.join(dir, "report.html");
    await pipeline(
      Readable.from(res.data),
      (await fs.open(dest, "w")).createWriteStream(),
    );
    written.push(dest);
  } catch (e) {
    console.error(`[haltest] no se pudo generar el reporte HTML: ${e.message}`);
  }

  // 2. JSON crudo — útil para diffs de regresión y post-mortem.
  const jsonPath = path.join(dir, "run.json");
  await fs.writeFile(jsonPath, JSON.stringify(run, null, 2));
  written.push(jsonPath);

  // 3. Screenshots — solo los de pasos fallidos, para no inflar el artefacto.
  const failed = (run.steps ?? []).filter(
    (s) => ["failed", "softfailed"].includes(s.status) && s.screenshot_path,
  );
  for (const step of failed) {
    try {
      const res = await http.get(`/storage/${step.screenshot_path}`, {
        responseType: "arraybuffer",
      });
      const dest = path.join(dir, `${step.node_id ?? "step"}.png`);
      await fs.writeFile(dest, Buffer.from(res.data));
      written.push(dest);
    } catch {
      /* screenshot no disponible: no es fatal */
    }
  }

  return written;
}
```

**T1.4 — Emisor JUnit XML**

`junit` está en el allowlist del schema (`schemas/run_tests/body.js:5`) pero el handler es un stub de 23 líneas. No hay que tocar el backend: la CLI emite JUnit desde el JSON que ya descarga. Esto es una decisión deliberada — **el reporter pertenece al cliente**, porque el mismo run puede publicarse en formatos distintos según el pipeline que lo consume.

```js
// apps/cli/src/junit.js  — NUEVO
import fs from "node:fs/promises";

const esc = (s = "") =>
  String(s).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c],
  );

/**
 * JUnit 1.x — consume `testsuites` en GitLab CI, Jenkins, Azure DevOps,
 * Datadog, y el resumen de checks de GitHub.
 */
export function toJUnit(run) {
  const steps = run.steps ?? [];
  const total = steps.length;
  const failures = steps.filter((s) => s.status === "failed").length;
  const skipped = steps.filter((s) => s.status === "skipped").length;
  const soft = steps.filter((s) => s.status === "softfailed").length;
  // Los softfailed son fallos que el flujo decidió continuar. Por defecto
  // NO cuentan como failure (el flujo pasó); --fail-on-soft-failure los cuenta.
  const effectiveFailures = failures + (run.__countSoftFailures ? soft : 0);
  const time = ((run.duration_ms ?? 0) / 1000).toFixed(3);

  const cases = steps
    .map((s) => {
      const name = s.label || s.node_type || s.node_id || "step";
      const cls = s.node_type || "flow";
      const body =
        s.status === "failed" ||
        (run.__countSoftFailures && s.status === "softfailed")
          ? `<failure message="${esc(s.error ?? "failed")}">${esc(
              JSON.stringify(s.output_data ?? {}, null, 2),
            )}${
              s.screenshot_path
                ? `\n${esc(`evidence: /api/storage/${s.screenshot_path}`)}`
                : ""
            }</failure>`
          : s.status === "skipped"
            ? "<skipped/>"
            : "";
      return `    <testcase classname="${esc(cls)}" name="${esc(name)}" time="0.000">${body}</testcase>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="haltest" tests="${total}" failures="${effectiveFailures}" errors="0" skipped="${skipped}" time="${time}">
  <testsuite name="${esc(run.flow_name ?? "flow")}" tests="${total}" failures="${effectiveFailures}" errors="0" skipped="${skipped}" time="${time}">
${cases}
  </testsuite>
</testsuites>
`;
}
```

**T1.5 — GitHub Actions annotations** (evita el "código rojo sin contexto")

```js
// apps/cli/src/annotations.js  — NUEVO
export const makeAnnotator = (enabled) => {
  if (!enabled)
    return {
      error: () => {},
      warning: () => {},
      group: () => {},
      endGroup: () => {},
    };
  const p = (s) => process.stdout.write(`${s}\n`);
  return {
    error: (m, f) => p(`::error title=${q(f ?? "HalTest")}::${oneLine(m)}`),
    warning: (m, f) => p(`::warning title=${q(f ?? "HalTest")}::${oneLine(m)}`),
    notice: (m, f) => p(`::notice title=${q(f ?? "HalTest")}::${oneLine(m)}`),
    group: (n) => p(`::group::${n}`),
    endGroup: () => p("::endgroup"),
  };
};
```

Los `oneLine` son obligatorios: un `\n` en un mensaje de annotation rompe el workflow.

**T1.6 — Modelo de errores y códigos de salida**

```js
// apps/cli/src/errors.js  — NUEVO
export class CIError extends Error {
  constructor(code, message, meta = {}) {
    super(message);
    this.name = "CIError";
    this.code = code;
    this.meta = meta;
  }
}

// Contrato de exit codes — estable, documentado, testeado.
// 0  success
// 1  test failure        (el flujo corrió y falló)
// 2  usage error         (args inválidos)
// 3  auth error          (401/403)
// 4  config error        (flow/project inexistente, 404)
// 5  connectivity        (no se pudo alcanzar el servidor)
// 6  timeout
// 7  internal error
export const EXIT = {
  SUCCESS: 0,
  TEST_FAILURE: 1,
  USAGE: 2,
  AUTH: 3,
  CONFIG: 4,
  CONNECTIVITY: 5,
  TIMEOUT: 6,
  INTERNAL: 7,
};
```

Escalar el exit code es lo que permite `if: failure()` y `allow_failure` diferenciando "el producto está roto" de "la infra cayó".

**T1.7 — Comandos resultantes**

```js
// apps/cli/src/index.js  — evolves
program
  .name("haltest")
  .description("HalTest — visual QA, now CI-native")
  .version(readVersion())

  // ── Config ──────────────────────────────────────────────
  .command("login")
  .description("Store a HalTest API token for subsequent commands")
  .argument("<token>", "Supabase access token (or use $SUPABASE_ACCESS_TOKEN)")
  .option("--api-url <url>", "HalTest base URL", "https://haltest.com/api")
  .action(storeCredentials)

  .command("doctor")
  .description("Verify connectivity, auth, and cloud browser readiness")
  .option("--api-url <url>")
  .action(async (o) => {
    const { http, cfg } = createClient(o);
    const [status, doctor] = await Promise.all([
      http
        .get("/status")
        .then((r) => r.data)
        .catch(() => null),
      http
        .get("/doctor")
        .then((r) => r.data)
        .catch(() => null),
    ]);
    /* render + exit no-cero si el probe del navegador falla */
  })

  // ── Ejecución ───────────────────────────────────────────
  .command("run <flowId>")
  .description("Execute a flow. CI-safe: exit code + artefactos + JUnit")
  .option("--api-url <url>", "HalTest API base URL", env("HALTEST_API_URL"))
  .option("--token <jwt>", "API token (Bearer)", env("HALTEST_TOKEN"))
  .option(
    "-p, --project <id>",
    "Project ID (omit to auto-resolve from the flow)",
  )
  .option("--headed", "Force headful (local debugging only)")
  .option(
    "--overrides <json>",
    "JSON merged into execution overrides",
    parseJson,
    {},
  )
  .option(
    "--timeout <ms>",
    "Total budget for the run",
    (v) => Number(v),
    900_000,
  )
  .option("--poll-interval <ms>", "Polling cadence", (v) => Number(v), 5_000)
  .option(
    "--retries <n>",
    "Retry the whole run on infra failure",
    (v) => Number(v),
    1,
  )
  .option("--output-dir <path>", "Write artifacts here", "haltest-artifacts")
  .option("--junit <path>", "Write JUnit XML here")
  .option("--reporter <r>", "list|github|silent", "list")
  .option("--fail-on <policy>", "failure|soft-failure", "failure")
  .option("--no-screenshots", "Skip failure screenshots")
  .action(runFlow)

  // ── Multi-flow ──────────────────────────────────────────
  .command("run-many")
  .description("Run several flows as a batch (server-side queue)")
  .argument("<flowIds...>")
  .option("-p, --project <id>")
  .option("--concurrency <n>", "Server-side concurrency", (v) => Number(v), 2)
  .option("--output-dir <path>", "default: haltest-artifacts")
  .option("--junit <path>")
  .action(runMany)

  // ── Modo self-contained (Carril B / self-hosted) ─────────
  .command("exec <flowId>")
  .description("Boot the bundled server, run headless, emit artifacts, exit")
  .option("-p, --project <id>")
  .option("--port <n>", "default: 2001", (v) => Number(v), 2001)
  .option("--output-dir <path>")
  .option("--junit <path>")
  .option("--timeout <ms>", "default: 600000", (v) => Number(v), 600_000)
  .action(execFlow) // spawn dist/backend/app.js, await readiness, delegate to runFlow, teardown

  // ── Export (Carril B) ───────────────────────────────────
  .command("export <flowId>")
  .description("Export a flow as a native Playwright spec + config")
  .option("--out <dir>", "Output directory", "haltest-e2e")
  .option("--framework <fw>", "playwright|cypress|selenium", "playwright")
  .option("--language <lang>", "js|ts|py|java|cs", "js")
  .option("--use-pom", "Page Object Model structure")
  .option("--pattern <p>", "POM|screenplay|keyword|data-driven")
  .option("--include-cicd", "Also emit .github/workflows + .gitlab-ci.yml")
  .option("--force", "Overwrite existing output")
  .action(exportFlow)

  // ── Scaffolding ─────────────────────────────────────────
  .command("init-ci")
  .description("Scaffold a CI workflow for this repo")
  .option("--platform <p>", "github|gitlab", "github")
  .option("--flow <id>", "Pre-fill the flow ID")
  .option("--out <path>", "default: .github/workflows/haltest.yml")
  .option("--force")
  .action(initCi);

// existentes: list, lint
```

### Fase 2 — Carril B: export a Playwright nativo

El endpoint ya existe (`POST /api/export/code`, `routes/export.router.js:45`) y el generador ya sabe emitir spec + config + package.json + CI. Falta la superficie CLI y una corrección de la config (T0.1). Con eso:

```bash
$ npx haltest export 8f3e... --framework playwright --language ts \
    --use-pom --include-cicd --out e2e
✔ 7 archivos escritos en e2e/
  e2e/playwright.config.ts
  e2e/package.json
  e2e/tests/checkout.spec.ts
  e2e/pages/CheckoutPage.ts
  e2e/.github/workflows/playwright.yml
  e2e/.gitlab-ci.yml
```

El equipo hace `git add e2e && git commit`. A partir de ahí el spec es código ordinario: PRs, code review, ownership, debugging local con `--debug`. **El flujo visual deja de ser un artefacto cerrado y pasa a ser código.**

Caveat a documentar: el spec es una **instantánea**. Si el canvas cambia en HalTest, hay que re-exportar. Mitigación: `generationKey` (SHA-256 del snapshot, `services/exporter/index.js:40-52`) commiteado en el spec, y un check CI que compare contra el `generationKey` remoto y falle si hay drift. Es opcional pero barato y evita divergencia silenciosa.

### Fase 3 — Scaffolding y empaquetado

**T3.1 — `haltest init-ci`** genera un workflow que funciona:

```yaml
# .github/workflows/haltest.yml  (generado por `npx haltest init-ci --platform github`)
name: HalTest E2E
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: haltest-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
    env:
      HALTEST_API_URL: ${{ vars.HALTEST_API_URL }}
      HALTEST_TOKEN: ${{ secrets.HALTEST_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install HalTest CLI
        run: npm install -g haltest@latest

      - name: Verify cloud runner is healthy
        run: npx haltest doctor --reporter github

      - name: Run visual flows
        id: run
        run: |
          npx haltest run-many ${{ vars.HALTEST_FLOWS }} \
            --project "${{ vars.HALTEST_PROJECT }}" \
            --output-dir haltest-artifacts \
            --junit haltest-artifacts/junit.xml \
            --reporter github

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: haltest-${{ github.run_id }}
          path: haltest-artifacts/
          retention-days: 14

      - name: Publish test report
        if: always()
        uses: dorny/test-reporter@v1
        with:
          name: HalTest
          path: haltest-artifacts/junit.xml
          fail-on-error: "true"
```

```yaml
# .gitlab-ci.yml
stages: [test]

haltest_e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.62.1-jammy
  variables:
    HALTEST_API_URL: $HALTEST_API_URL
    HALTEST_TOKEN: $HALTEST_TOKEN
  script:
    - npm install -g haltest@latest
    - npx haltest doctor
    - mkdir -p haltest-artifacts
    - npx haltest run-many "$HALTEST_FLOWS" --project "$HALTEST_PROJECT" \
      --output-dir haltest-artifacts \
      --junit haltest-artifacts/junit.xml
  artifacts:
    when: always
    reports:
      junit: haltest-artifacts/junit.xml
    paths:
      - haltest-artifacts/
    expire_in: 14 days
```

> El uso de `dorny/test-reporter` (y no el `reporter: 'github'` nativo) es deliberado: es la única vía que muestra el detalle por paso en la UI de GitHub **y** funciona cuando el job corre en un contenedor que no es un runner de GitHub (self-hosted, o el job de HalTest en su propio CI).

### Fase 4 — Cerrar el bloqueo de autorización (P1.11)

`run.controller.js:66-95` exige rol `owner` si `project.collaborationEnabled`. Un token de servicio de CI no es un usuario con `CollaboratorRole`. Opciones, de menos a más invasiva:

| Opción                                                                                     | Esfuerzo | Trade-off                                           |
| ------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------- |
| A. Documentar "el token de CI debe ser el del owner del proyecto"                          | 0        | Frágil: rota en rotación de personal                |
| B. Crear manualmente un `CollaboratorRole(userId=<service acct>, role='owner')` vía script | 2 h      | Suficiente; sin cambio de código                    |
| C. `CI` como rol nuevo en el enum, con política por proyecto                               | 6 h      | Limpio; requiere migración + guard en el controller |
| D. API key con scopes (`routes/keys` ya existe) que emita un token de servicio             | 1 día    | Correcto a largo plazo                              |

**Recomendación: B ahora, C en el roadmap.** B desbloquea la Fase 1 completa con 2 horas de trabajo; nomnt breeds deuda porque la tabla `CollaboratorRole` ya soporta el caso.

---

## 6. Secuenciación y effort total

```
Semana 1 ─────────────────────────────────────────────────────
  LUN  T0.1  Fix digest Dockerfile                        (15m)
       T0.2  render.yaml → runtime: docker, plan 1c-2g    (30m)
       T0.3  Verificar imagen localmente                   (30m)
  MAR  T1.1  dbus-x11 + tini + healthcheck en Dockerfile (2h)
       T1.2  Ampliar DoctorService con probe real         (1h)
       T1.3  Cablear /api/doctor en el job deploy        (30m)
       ──► DEPLOY EN RENDER (ventana de mantenimiento) ──
  JUE  T0.4  Fix headless:false en PlaywrightGenerator   (15m)
       T0.5  git mv del workflow E2E muerto              (15m)
       P1.1  config.js + http.js (auth + retry)          (1h)
  VIE  P1.2  wait.js — polling HTTP, sin WebSocket       (4h)

Semana 2 ─────────────────────────────────────────────────────
  LUN  P1.3  artifacts.js                                (3h)
       P1.4  junit.js                                    (2h)
  MAR  P1.5  annotations.js                              (2h)
       P1.6  errors.js + códigos de salida               (1h)
  JUE  P1.7  Cablear comandos en index.js                (4h)
  VIE  P1.8  exec.js (self-contained)                    (4h)

Semana 3 ─────────────────────────────────────────────────────
  LUN  P1.9  export.js (superficie CLI)                  (2h)
       P1.10 init-ci.js                                  (2h)
  MAR  P1.11 Test suite de la CLI (mock HTTP, golden JUnit) (4h)
  JUE  P1.12 Propagar CollaboratorRole service account   (2h)
  VIE  P1.13 Publicar v1.1.0 + docs + anuncio           (2h)
```

**Total: ~3 semanas / 40 h** hasta un CI/CD funcional en manos de usuarios.
**Desbloqueo de S1: 4 h** (T0.1–T0.3 + deploy).

---

## 7. Métricas de éxito

| Métrica                                     | Hoy             | Objetivo                                   |
| ------------------------------------------- | --------------- | ------------------------------------------ |
| Tiempo de setup para un flow nuevo en CI    | ∞ (imposible)   | < 15 min                                   |
| Líneas de YAML para integrar                | 0 (no existe)   | ~10 (`init-ci`)                            |
| Hooks de WebSocket requeridos               | 1 (frágil)      | 0                                          |
| Merge sin gate de E2E visual                | 100 % de merges | 0                                          |
| ¿El runner de la nube arranca un navegador? | ❌              | ✅ `/api/doctor.browser.launched === true` |
| Formatos de reporte                         | HTML (manual)   | HTML + JSON + JUnit                        |
| Tiempo de feedback                          | N/A             | < 5 min                                    |
| Drift entre código y spec exportado         | N/A             | 0 (con check de `generationKey`)           |

---

## 8. Riesgos

| Riesgo                                                           | Prob. | Impacto     | Mitigación                                                                                                   |
| ---------------------------------------------------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Recrear el servicio en Render pierde config/env                  | Media | Alto        | Inventariar env vars y backups ANTES; `render blueprints validate render.yaml` en CI                         |
| Cuota de Chromium → OOM en `starter`                             | Media | Alto        | `HAL_MAX_BROWSERS=1` en free/starter; instrumentar `/api/doctor` con RSS                                     |
| CLI publicada no incluye `dist/backend` en la instalación limpia | Baja  | Alto        | `clean-room-test.js` ya valida esto en `release.yml` — verificar que cubre el nuevo código                   |
| Usuario pega `HALTEST_TOKEN` en un repo público                  | Baja  | **Crítico** | Detección de secretos en el pipeline + docs: solo `secrets.*` de environments                                |
| `render.yaml` es la IaC de prod y un typo tumba prod             | Media | Alto        | Validar el blueprint en el job `validate` de `ci-cd.yml`                                                     |
| El servicio se duerme (free) y el CI da timeout                  | Media | Medio       | `doctor` con retry + mensaje explícito "el plan free hiberna; usar `starter`"                                |
| Clonar el motor de ejecución para CI diverge del de la UI        | Baja  | Alto        | **No hacerlo** — Carril A reutiliza `ExecutionService` sin modificar; solo se añade la superficie de cliente |

### Nota estratégica sobre la última fila

La tentación natural es "escribir un runner propio para CI". **Sería un error.** `ExecutionService` es un motor de flujo de datos activado por tokens, con orden topológico, composites vía `parentId`, timeouts por nodo, AbortSignal, auto-healing y logging forense (`ExecutionService.js:541-720`, `1044-1212`). Reimplementar eso para CI garantiza deriva de comportamiento entre la UI y el pipeline — exactamente la clase de problema que destruye la confianza en una herramienta de QA.

El CI debe ser un **cliente**, no un segundo motor. Toda la，Fase 1 respeta ese límite.

---

## Apéndice A — Verificación de los hallazgos

```bash
# H1/H2: los flags ya existen
sed -n '383,401p' apps/backend/services/browser.service.js

# H2: render.yaml usa runtime nativo (sin librerías de Playwright)
grep -n "runtime:" render.yaml

# H4: el digest tiene 65 chars (imposible para SHA-256)
awk '/sha256:/{split($0,a,"sha256:"); split(a[2],b,"@"); print length(b[1]), $0}' Dockerfile

# H3: la CLI no envía Authorization
grep -c "Authorization" apps/cli/src/index.js || echo "0 — ninguna referencia"

# H3: el único mecanismo de espera es WebSocket
grep -n "socket.on\|io(" apps/cli/src/index.js

# H3: el config Playwright generado rompe CI
grep -n "headless" apps/backend/services/exporter/generators/PlaywrightGenerator.js

# H3: el workflow E2E está en la ruta que GitHub no lee
ls apps/backend/.github/workflows/
```

## Apéndice B — Referencias upstream

- `microsoft/playwright#28452`, `#13201`, `#15870`, `#16168`, `#15510` — el log `Failed to connect to the bus` aparece en la imagen oficial con runs exitosas.
- `chartbrew/chartbrew#264` — `playwright install-deps` falla en Render (`su: Authentication failure`); lista concreta de librerías ausentes.
- `render.com/docs/native-runtimes` — el runtime nativo es Debian 12 bookworm con toolchain genérico; Docker es la vía recomendada cuando faltan librerías.
- `render.com/docs/blueprint-spec` — `runtime: docker`, `dockerfilePath`, `healthCheckPath`, `maxShutdownDelaySeconds` soportados en Blueprint.
- `playwright.dev/docs/ci#docker` — `--init` y el pinning por versión de la imagen.
