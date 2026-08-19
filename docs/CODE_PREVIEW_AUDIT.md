# Code Preview 2.0 — Auditoría Técnica y Plan de Implementación

---

## 1. Executive Summary

Haltest tiene un sistema de Code Preview **funcional pero incompleto**. La arquitectura de generación de código está bien diseñada (Template Method + Registry Pattern + Strategy Pattern), pero presenta una **desconexión arquitectónica fundamental**: el sistema de ejecución y el sistema de generación de código no comparten una fuente de verdad común.

**Hallazgo principal**: El problema con `fill_form` no es un bug aislado — es un síntoma de una deuda técnica estructural. De los 86 tipos de nodos en el sistema, **17 no tienen mapper de code generation**. El tipo más crítico (`fill_form`) tiene implementación completa en el backend (handler, schema, payload builder, frontend UI) pero **ningún mapper registrado** en `NodeMapperRegistry`.

**Decisión clave**: Conviene **reparar incrementalmente** el sistema actual. La arquitectura existente (BaseGenerator + NodeMapperRegistry) es sólida y extensible. No se necesita un refactor masivo — se necesita completar los mappers faltantes y construir las capas de sincronización sobre la base existente.

**MVP recomendado**: Fase 1-4 (completar mappers faltantes + sincronización Canvas↔Code + highlighting de ejecución). Esto resuelve el 80% de los problemas con el 20% del esfuerzo.

---

## 2. Current Architecture

### 2.1 Stack Tecnológico

```
Frontend (React 19 + Vite 7)
  ├── TerminalPanel.jsx          → Code Preview UI (real-time, debounced)
  ├── ExportDialog.jsx           → Code Export modal (POM, CI/CD)
  └── useFlowExecution.js        → BFS execution engine

Backend (Express + Playwright)
  ├── export.router.js           → POST /export/code
  ├── exportService              → Orchestrator
  ├── PlaywrightGenerator        → Code generator (JS/TS/Python/Java/C#)
  ├── NodeMapperRegistry         → Node type → code mapper
  ├── 14 Node Mappers            → Type-specific code generation
  ├── FlowResolver               → Sub-flow resolution
  ├── VariableManager            → {{variable}} resolution
  └── 79 Action Handlers         → Playwright execution (13 plugins)
```

### 2.2 Patrones Arquitectónicos

| Patrón | Implementación | Ubicación |
|--------|---------------|-----------|
| **Template Method** | `BaseGenerator` define esqueleto (header + steps + footer), subclases override | `BaseGenerator.js` |
| **Registry** | `NodeMapperRegistry` mapea tipo → mapper con O(1) lookup | `GeneratorRegistry.js` |
| **Strategy** | 3 generadores (Playwright, Cypress, Selenium) implementan misma interfaz | `generators/` |
| **Variable Resolution** | Pre-pase `variableManager.resolveRecursive()` antes de code gen | `VariableManager.js` |
| **AST Import** | Babel parser → AST traversal → HalTest flow actions | `importer/` |

### 2.3 Flujo Actual de Code Preview

```
Canvas (nodes + edges)
    │
    ├─► TerminalPanel (real-time, debounced)
    │     │
    │     └─► POST /export/code
    │           │
    │           ├─► FlowResolver.resolve() (sub-flows)
    │           ├─► exportService.generateCode()
    │           │     │
    │           │     ├─► PlaywrightGenerator.generate()
    │           │     │     ├─► generateHeader()
    │           │     │     ├─► generateSteps()
    │           │     │     │     └─► generateNodeCode(step)
    │           │     │     │           ├─► NodeMapperRegistry.getMapper(type)
    │           │     │     │           ├─► mapper.getCode(params, lang)
    │           │     │     │           └─► fallback: console.log("not implemented")
    │           │     │     └─► generateFooter()
    │           │     │
    │           │     └─► { code, warnings }
    │           │
    │           └─► code string → syntax highlight → display
    │
    └─► ExportDialog (modal, POM/CICD support)
```

---

## 3. Current Code Preview Flow — Componentes Detallados

### 3.1 Frontend

| Componente | Archivo | Función |
|-----------|---------|---------|
| **TerminalPanel** | `apps/frontend/src/components/TerminalPanel.jsx` | Panel principal con tabs Logs/Shell/Code. Real-time code gen con debounce. Syntax highlighting regex-based. Active line tracking. Copy/download. Edit mode con sync-back. |
| **ExportDialog** | `apps/frontend/src/components/ExportDialog.jsx` | Modal de export con framework/language selectors. POM toggle. CI/CD toggle. Multi-file ZIP output. |
| **ExportModal** | `apps/frontend/src/components/modals/ExportModal.jsx` | Modal simpler (legacy). Code export marked "Coming Soon". |

### 3.2 Backend — Generadores

| Generador | Archivo | Lenguajes | Frameworks |
|-----------|---------|-----------|------------|
| **PlaywrightGenerator** | `generators/PlaywrightGenerator.js` | JS, TS, Python, Java, C# | Playwright |
| **CypressGenerator** | `generators/CypressGenerator.js` | JS, TS | Cypress |
| **SeleniumGenerator** | `generators/SeleniumGenerator.js` | Python, Java | Selenium |
| **Legacy Generator** | `generators/playwright.generator.js` | JS, TS, Python, Java, C# | Playwright (deprecated) |

### 3.3 Backend — Node Mappers (14)

| Mapper | Tipos Soportados | Archivo |
|--------|-----------------|---------|
| OpenUrlMapper | `open_url`, `navigate` | `nodes/OpenUrlMapper.js` |
| BrowserActionMapper | `reload`, `reload_page`, `resize_viewport`, `close_browser`, `launch_browser` | `nodes/BrowserActionMapper.js` |
| InteractionMapper | `click`, `type_text`, `type`, `hover`, `scroll`, `press_key` | `nodes/InteractionMapper.js` |
| WaitMapper | `wait_fixed`, `wait_visible`, `wait_for_element`, `wait_network`, `wait_network_match` | `nodes/WaitMapper.js` |
| UtilityMapper | `take_screenshot`, `save_dom`, `log_errors`, `execute_js` | `nodes/UtilityMapper.js` |
| NavigationMapper | `go_back`, `go_forward`, `wait_navigation`, `manage_tabs` | `nodes/NavigationMapper.js` |
| FormMapper | `select_option`, `drag_drop` | `nodes/FormMapper.js` |
| AssertionMapper | `validate_semantic`, `assertion`, `assert_page_text` | `nodes/AssertionMapper.js` |
| NetworkMapper | 11 tipos de red | `nodes/NetworkMapper.js` |
| DOMMapper | `find_element`, `get_set_content` | `nodes/DOMMapper.js` |
| FileMapper | `upload_file`, `download_file`, `read_file`, `write_file` | `nodes/FileMapper.js` |
| SessionMapper | 5 tipos de sesión | `nodes/SessionMapper.js` |
| FlowControlMapper | 12 tipos de control de flujo | `nodes/FlowControlMapper.js` |
| CompositionMapper | `input`, `output` | `nodes/CompositionMapper.js` |

### 3.5 Backend — Servicios de Soporte

| Servicio | Archivo | Función |
|----------|---------|---------|
| **FlowResolver** | `core/FlowResolver.js` | Resuelve referencias a sub-flows recursivamente (DB, archivos, registry). Cycle detection. Max depth 10. |
| **VariableManager** | `services/VariableManager.js` | Resuelve `{{variable}}` placeholders en configs antes de code gen. |
| **escapeUtils** | `core/escapeUtils.js` | Escaping para template literals, double quotes, single quotes. Selector validation. |
| **PipelineCodeLinter** | `services/PipelineCodeLinter.js` | Análisis estático post-generación. Checks: selectors frágiles, sleeps hardcoded, secrets, async unhandled. (No wirado al pipeline principal.) |
| **ComponentRegistry** | `services/ComponentRegistry.js` | Gestiona sub-flow components stored as JSON. |

---

## 4. Current Execution Flow

### 4.1 Frontend-Orchestrated (Debug Mode)

```
UI "Run" Button
  → useFlowManager.executeFlow()
    → useFlowExecution.executeFlow()                    [line 612]
      → resetExecutionStates()                          [line 656]
      → validateFlowStructure()                         [line 661]
      → projectManager.createRun()                      [line 685]
      → executeGraph(nodes, edges)                      [line 723]
        → BFS loop:
          → queue.shift() → node
          → [component]  executeGraph(subflow)          [line 802] (recursive)
          → [loop]       executeStep() + loop subflow   [line 859]
          → [for_each]   executeStep()                  [line 951]
          → [other]      executeStep()                  [line 1020]
            → payloadBuilders[type](payload)            [line 358]
            → api.post("/actions/"+type, body)          [line 376]
              → Backend: ActionExecutor.executePlaywrightAction()
            → updateNodeState(SUCCESS/ERROR)
          → Path resolution + edge matching             [line 1081]
          → Enqueue successor nodes                     [line 1157]
```

### 4.2 Backend-Orchestrated (Remote/E2E Mode)

```
ExecutionService.executeFlow(flowId)
  → Load flow from DB or CRDT
  → validateGraph()
  → ExecutionManager.execute(mode)
    → E2ERunner → runSequence()
      → For each activated node:
        → executeNode()
          → [loop]       executeLoopContainer()
          → [for_each]   executeForEachContainer()
          → [other]      handler(req, res)
        → Dead Path Elimination (DPE)
        → propagateSkip() for dead edges
        → Recurse to next nodes
```

### 4.3 fill_form — Ejecución Real

El backend handler (`plugins/core-interaction/handlers/fill_form.js`) ejecuta:
1. Valida `formSelector` y `fields` array
2. Construye locator para el contenedor del form
3. Itera `fields` secuencialmente: text→fill, select→selectOption, checkbox→check/uncheck, file→setInputFiles
4. Opcionalmente submit (click submitSelector o form.requestSubmit())
5. Opcionalmente wait for navigation
6. Retorna `{ filledFields, submit }`

Todo es atómico desde la perspectiva del engine — un solo POST a `/actions/fill_form`.

---

## 5. Composite Node Problem

### 5.1 Root Cause

El problema con `fill_form` **no es un bug en la lógica de code generation** — es una **omisión en el registry**.

**Cadena causal**:

```
1. FormMapper.register() solo lista: ['select_option', 'drag_drop']
2. InteractionMapper.register() solo lista: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key']
3. fill_form NO está en ningún mapper
4. NodeMapperRegistry.getMapper('fill_form') retorna undefined
5. PlaywrightGenerator.generateNodeCode() entra al fallback (line 398):
   console.log('⚠️ Action not implemented or pending: fill_form')
```

### 5.2 Por Qué Execution Funciona Pero Code Generation No

| Capa | fill_form funciona? | Por qué |
|------|---------------------|---------|
| **Frontend UI** | ✅ | `NODE_CATEGORIES` lo define en `user_simulation` |
| **Frontend Config** | ✅ | `NODE_INPUTS.fill_form` tiene 9 campos definidos en `validationRules.js` |
| **Frontend Payload** | ✅ | `payloadBuilders.js` línea 374 normaliza el form data |
| **Backend Handler** | ✅ | `fill_form.js` ejecuta Playwright secuencialmente |
| **Backend Schema** | ✅ | `fill_form/body.js` valida con Joi |
| **Code Generation** | ❌ | `FormMapper` solo cubre `select_option` y `drag_drop` |

La ejecución funciona porque `executeStep()` envía un POST directo a `/actions/fill_form` — no necesita un mapper. La code generation falla porque `generateNodeCode()` busca en `NodeMapperRegistry` y no encuentra nada.

### 5.3 Otros Tipos Sin Mapper

| Tipo | Categoría | Prioridad | Notas |
|------|-----------|-----------|-------|
| **`fill_form`** | user_simulation | **CRÍTICO** | Formulario completo, 9 campos |
| **`component`** | composition | **ALTO** | Parcialmente manejado inline en PlaywrightGenerator (line 347) |
| **`run_tests`** | execution_interface | MEDIO | CLI/testing |
| **`cli_params`** | execution_interface | MEDIO | CLI/testing |
| **`return_code`** | execution_interface | MEDIO | CLI/testing |
| **`integrate_ci`** | execution_interface | MEDIO | CI/CD |
| **`db_connect`** | database_ops | BAJO | Frontend-only, sin backend |
| **`db_query`** | database_ops | BAJO | Frontend-only, sin backend |
| **`db_assert_record`** | database_ops | BAJO | Frontend-only, sin backend |
| **`call_llm`** | llm_ai | BAJO | AI-specific |
| **`generate_data`** | llm_ai | BAJO | AI-specific |
| **`extract_dom_context`** | llm_ai | BAJO | AI-specific |
| **`chain_of_thought`** | llm_ai | BAJO | AI-specific |
| **`smart_selector`** | llm_ai | BAJO | AI-specific |
| **`sticky_note`** | collaboration | N/A | UI annotation, no necesita mapper |
| **`discussion`** | collaboration | N/A | UI annotation, no necesita mapper |

### 5.4 Nodos Compuestos — Arquitectura

Los nodos compuestos (`component`, `loop`, `for_each`) **sí están parcialmente soportados** en code generation:

**PlaywrightGenerator.generateNodeCode()** (line 347):
```javascript
if (type === 'component' || subNodes.length > 0) {
    // Recursive code generation for sub-nodes
    nodeCode = this.generateSteps(subNodes, depth + 1);
    // Wraps in test.step() for JS/TS
    return `await test.step(\`📦 ${label}\`, async () => {\n${nodeCode}\n});`;
}
```

El problema es que `component` no tiene mapper en `NodeMapperRegistry`, pero `generateNodeCode` lo maneja **antes** de buscar el mapper (línea 347 vs línea 373). Entonces el código se genera correctamente para componentes con `subNodes` inline.

**El gap real**: Cuando un `component` referencia un `flowId` (sub-flow guardado en DB), el code generator necesita resolver esa referencia — y eso depende de `FlowResolver` que solo se invoca en el endpoint `/export/code`, no en el real-time preview de TerminalPanel.

---

## 6. Source of Truth Analysis

### Opción A: Canvas = Source of Truth

```
Canvas (nodes + edges)
  ↓
Generated Code
```

**Ventajas**:
- Implementación actual (parcial)
- Canvas es WYSIWYG
- Cambios en Canvas se reflejan en código

**Desventajas**:
- Code generation depende de que Canvas tenga toda la info
- Los nodos compuestos con sub-flows en DB no se resuelven en real-time
- No permite import de código
- editing de código no puede back-propagarse fácilmente

**Complejidad**: Baja (es lo que existe)
**Riesgo**: Alto — limita funcionalidades futuras

### Opción B: Code = Source of Truth

```
Code (Playwright)
  ↓
Canvas (visual)
```

**Ventajas**:
- Permite import de código existente
- El código es el "artifact" final
- Atrae usuarios técnicos

**Desventajas**:
- Parsing de código arbitrario es extremadamente complejo
- Loss of semantic information (loops, conditions se pierden)
- No es realista para un producto visual-first

**Complejidad**: Muy alta
**Riesgo**: Muy alto — cualquier código Playwright arbitrario es imposible de parsear completamente

### Opción C: Flow AST = Source of Truth ✅ RECOMENDADA

```
           Flow AST / Model
           ↙              ↘
      Canvas              Code
   (visual)           (generated)
```

**Ventajas**:
- Separación de concerns: presentación vs lógica vs output
- Permite múltiples outputs (code, Canvas, docs, AI)
- Permite import (code → AST → Canvas)
- Execución y code generation consumen la misma representación
- Extensible para nuevos frameworks/lenguajes
- Los nodos compuestos se representan como parte del AST

**Desventajas**:
- Requiere definir un schema formal del AST
- Impacto en la arquitectura actual (pero incremental)
- Necesita migración de la representación actual

**Complejidad**: Media
**Riesgo**: Medio — es incremental sobre lo existente

### Recomendación

**Flow AST como Source of Truth**, pero de forma incremental:

1. **Fase actual**: Mantener Canvas como truth para code gen (completar mappers)
2. **Fase intermedia**: Formalizar la representación actual de nodos como "Flow AST" informal
3. **Fase futura**: Schema formal del AST que permita import bidireccional

La razón es práctica: el sistema actual YA tiene una representación intermedia — los `steps` que se pasan a `exportService.generateCode()` son esencialmente un AST informal. La key es formalizarlo sin romper lo existente.

---

## 7. Proposed Architecture

### 7.1 Diagrama de Arquitectura

```
                    ┌─────────────────────┐
                    │       Canvas        │
                    │   (React Flow)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Flow Model      │
                    │   (nodes + edges    │
                    │    + metadata)      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐ ┌───▼───────────┐ ┌──▼──────────────┐
    │  Execution Engine │ │ Code Gen      │ │ Validation      │
    │  (BFS + handlers) │ │ Engine        │ │ Engine          │
    └─────────┬─────────┘ │ (mappers)     │ │ (config +       │
              │           └───┬───────────┘ │  structure)     │
              │               │             └─────────────────┘
              ▼               ▼
         Playwright      JS/TS/Python
         (real)          Java/C#
              │               │
              ▼               ▼
         Execution Trace   Generated Code
              │               │
              └───────┬───────┘
                      ▼
               Debug Mapping
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
          Canvas              Code
     (node states)      (line highlighting)
```

### 7.2 Flow Model / AST

El AST actual es **informal** — es el array de `steps` que se pasa a los generadores. Para formalizarlo:

```javascript
// Representación actual (informal)
const steps = [
  {
    id: "node_123",
    type: "fill_form",
    data: {
      configuration: {
        formSelector: "#register-form",
        fields: [
          { selector: "#name", value: "John", type: "text" },
          { selector: "#email", value: "john@test.com", type: "text" }
        ]
      },
      label: "Fill Register Form",
      subNodes: []  // para componentes
    }
  }
];

// AST formal propuesto (compatible con actual)
const flowAST = {
  version: "1.0",
  nodes: [...],  // misma estructura que actual
  edges: [...],
  metadata: {
    name: "My Flow",
    createdAt: "...",
    language: "javascript",
    framework: "playwright"
  }
};
```

La clave es que **la representación actual ya funciona** — solo necesita un wrapper de metadata y un schema de validación. No requiere un rewrite.

---

## 8. Code Generation Architecture

### 8.1 Arquitectura Actual (Correcta)

```
Node Type → NodeMapperRegistry.getMapper(type) → mapper.getCode(params, lang) → code string
```

**Fortalezas**:
- O(1) lookup
- Mappers auto-registrados
- Multi-language support por mapper
- Variable resolution pre-pase

**Debilidades**:
- 17 tipos sin mapper
- No hay validación de que todos los tipos tengan mapper
- No hay fallback inteligente (solo console.log)
- No hay soporte para nodos compuestos con sub-flows en DB

### 8.2 Arquitectura Propuesta

```
Node Type
    │
    ├─► NodeMapperRegistry.getMapper(type)
    │     │
    │     ├─► Found → mapper.getCode(params, lang, framework)
    │     │
    │     └─► Not found → CompositeHandler?
    │           │
    │           ├─► Has subNodes → generateSteps(subNodes)  [existing]
    │           ├─► Has flowId → FlowResolver.resolve() → generateSteps()
    │           └─► Nothing → ExplicitUnsupportedNode(type)
    │
    └─► (Future) NodeDefinition.getCodeGenerator()
          └─► Per-node-type code gen function
```

### 8.3 Estrategia para Nodos no Soportados

**Actual** (problemático):
```javascript
console.log(`⚠️ Action not implemented or pending: fill_form`);
```

**Propuesto** (explícito):
```javascript
// [UNSUPPORTED] fill_form — Code generation not yet implemented
// Use the Canvas execution engine or implement a custom mapper
// See: https://docs.haltest.dev/mappers/fill-form
throw new Error('Haltest: fill_form code generation not implemented');
```

O mejor aún, un comentario estructurado que pueda ser detectado por el sistema:
```javascript
// @haltest:unsupported type=fill_form
// @haltest:hint Use NodeMapperRegistry to register a mapper
```

---

## 9. Multi-language Strategy

### 9.1 Soporte Actual

| Lenguaje | Playwright | Cypress | Selenium |
|----------|-----------|---------|----------|
| JavaScript | ✅ | ✅ | ❌ |
| TypeScript | ✅ | ✅ | ❌ |
| Python | ✅ | ❌ | ✅ |
| Java | ✅ | ❌ | ✅ |
| C# | ✅ | ❌ | ❌ |

### 9.2 Estrategia Recomendada

**Mantener la arquitectura actual de multi-language por mapper.** Cada mapper ya soporta switch por lenguaje. Esto es correcto y extensible.

Para nuevos mappers, seguir el patrón existente:
```javascript
export const FillFormMapper = {
    type: ['fill_form'],
    getCode: (params, lang, index, framework) => {
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return generateJS(params, framework);
            case 'python':
                return generatePython(params, framework);
            case 'java':
                return generateJava(params, framework);
            case 'csharp':
                return generateCSharp(params, framework);
        }
    }
};
```

**No se necesita un AST intermedio separado** — la representación de params + lang + framework es suficiente.

### 9.3 Playwright Codegen como Referencia

Playwright Codegen ya genera código para múltiples lenguajes y prioriza locators por role, text y testId. Haltest puede reutilizar estas convenciones:

- `page.getByRole('button', { name: 'Submit' })` en lugar de `page.click('#submit')`
- `page.getByLabel('Email')` para campos de formulario
- `page.getByTestId('login-form')` para test IDs

Los mappers actuales usan CSS selectors hardcodeados. Deberían evolucionar hacia locators más robustos.

---

## 10. Canvas ↔ Code Synchronization

### 10.1 Sincronización Actual

```
Canvas → Code: ✅ Funciona (debounced real-time)
Code → Canvas: ✅ Existe (TerminalPanel edit mode → POST /import/code)
Canvas ↔ Code: ⚠️ Parcial (no hay tracking de dirty state)
```

### 10.2 Estrategia Propuesta

**Fase 1 — Click-to-Code** (ya parcialmente implementado):
- Cada nodo tiene `node_id` comment en el código generado
- `activeLineIndex` en TerminalPanel ya trackea el nodo ejecutándose
- Extender con highlighting visual del código del nodo seleccionado

**Fase 2 — Click-to-Canvas**:
- Parsear `node_id` comments del código para mapear ranges
- Click en código → `onSelectNode(nodeId)` → highlight en Canvas

**Fase 3 — Edit Mode con Validación**:
- Usuario edita código
- POST `/import/code` para parsear
- Diff visual de cambios
- Apply con confirmación del usuario

### 10.3 Conflictos de Sincronización

| Escenario | Estrategia |
|-----------|-----------|
| Usuario modifica Canvas mientras edita Code | Code se regenera automáticamente (perde edits) → mostrar warning |
| Usuario modifica Code mientras modifica Canvas | Code preview se actualiza, edits se pierden → mostrar warning |
| Code editado tiene cambios inválidos | Rechazar con error message específico |
| Nodo sin representación directa | Mantener como comentario con metadata |

### 10.4 Dirty State

```javascript
const codePreviewState = {
  isDirty: false,        // Canvas cambió desde última regeneración
  lastGeneratedAt: null, // Timestamp de última regeneración
  editedCode: null,      // Código editado manualmente
  hasEdits: false,       // Usuario modificó el código
  pendingChanges: [],    // Cambios del Canvas aún no reflejados
};
```

---

## 11. Execution ↔ Code Synchronization

### 11.1 Estado Actual

El sistema YA tiene infraestructura para esto:

1. **`node_id` comments** en código generado: `// [node_id: node_54819ade]`
2. **`activeLineIndex`** en TerminalPanel calculado desde estos comments
3. **`updateNodeState()`** actualiza estado visual en Canvas
4. **Socket.IO events** propagan estado de ejecución

### 11.2 Mapa de Sincronización

```
Canvas Node (id: node_123)
    ↕ [node_id: node_123] comment
Code Range (lines 15-20)
    ↕ execution-time tracking
Execution Step (backend result)
```

### 11.3 Highlighting Durante Ejecución

El sistema actual YA hace esto parcialmente:
- `activeLineIndex` se calcula buscando el `node_id` del nodo ejecutándose
- El código se highlightea con `activeLine` class

**Falta**:
- Highlight de código completado (success/error)
- Highlight de código pendiente
- Timing por línea
- Sincronización bidireccional (click en código → navegar a nodo)

---

## 12. Composite Node Strategy

### 12.1 Problema Actual

Los nodos compuestos (`component`) **sí generan código** cuando tienen `subNodes` inline. El problema es cuando referencian un `flowId` (sub-flow en DB) — el real-time preview no lo resuelve.

### 12.2 Estrategia

```
Composite Node
    │
    ├─► Tiene subNodes inline?
    │     └─► SÍ → generateSteps(subNodes) [EXISTE]
    │
    ├─► Tiene flowId?
    │     └─► SÍ → FlowResolver.resolve() → generateSteps()
    │           │
    │           ├─► Real-time preview: usar cache de sub-flows
    │           └─► Export: resolver desde DB
    │
    └─► fill_form (caso especial)
          └─► NO es compuesto — es un mapper faltante
              └─► Crear FillFormMapper que itere fields[]
```

### 12.3 fill_form — Ejemplo de Generación

```javascript
// FillFormMapper.getCode() para JavaScript/Playwright
const fillFormCode = (params) => {
    const formSelector = params.formSelector;
    const fields = params.fields || [];
    const lines = [];

    lines.push(`const form = page.locator('${formSelector}');`);

    for (const field of fields) {
        switch (field.type) {
            case 'text':
                lines.push(`await form.locator('${field.selector}').fill('${field.value}');`);
                break;
            case 'select':
                lines.push(`await form.locator('${field.selector}').selectOption('${field.value}');`);
                break;
            case 'checkbox':
                if (field.value === 'true') {
                    lines.push(`await form.locator('${field.selector}').check();`);
                } else {
                    lines.push(`await form.locator('${field.selector}').uncheck();`);
                }
                break;
            case 'file':
                lines.push(`await form.locator('${field.selector}').setInputFiles('${field.value}');`);
                break;
        }
    }

    if (params.submitAfterFill) {
        if (params.submitSelector) {
            lines.push(`await page.locator('${params.submitSelector}').click();`);
        } else {
            lines.push(`await form.submit();`);
        }
    }

    return lines.join('\n');
};
```

---

## 13. Code Editor Strategy

### 13.1 Evaluación de Opciones

| Opción | Descripción | Factibilidad | Riesgo | Recomendación |
|--------|-------------|-------------|--------|---------------|
| **Opción 1** | Canvas editable, código read-only | ✅ Alta | Bajo | **MVP** |
| **Opción 2** | Canvas → Código editable, code → canvas | ⚠️ Media | Alto | Fase 3 |
| **Opción 3** | Visual Mode / Code Mode con sync explícita | ⚠️ Media | Medio | Fase 2 |
| **Opción 4** | Editor con acciones limitadas | ✅ Alta | Bajo | **MVP** |

### 13.2 Recomendación: Opción 1 + 4 Combinada

**MVP**: Canvas editable + Código con copy/download + validación de syntax

**Fase 2**: Code Mode (toggle) con diff visual y apply con confirmación

**Fase 3**: Bidireccional sync con conflict resolution

### 13.3 Code Editor como Herramienta Técnica

El code preview debe funcionar como:

1. **Reader**: Syntax highlighting, line numbers, node_id tracking
2. **Auditor**: Validation, warnings, quality score (PipelineCodeLinter)
3. **Exporter**: Copy, download, framework/language switch
4. **Debugger**: Execution highlighting, error sync
5. **Editor** (futuro): Edit → validate → diff → apply

---

## 14. Validation Strategy

### 14.1 Validación Actual

| Tipo | Implementado | Dónde |
|------|-------------|-------|
| **Syntax validation** | ❌ No | — |
| **Selector validation** | ✅ Parcial | `escapeUtils.validateSelector()` |
| **Variable resolution** | ✅ | `variableManager.resolveRecursive()` |
| **Config validation** | ✅ | `validateNodeConfig()` por tipo |
| **Structure validation** | ✅ | `GraphValidator.validate()` |
| **Code quality** | ✅ Parcial | `PipelineCodeLinter` (no wirado) |

### 14.2 Estrategia Propuesta

```
Canvas change
      ↓
Generate Code
      ↓
┌─────────────────────┐
│ Validation Pipeline  │
├─────────────────────┤
│ 1. Syntax check     │  ← Usar parser del lenguaje target
│ 2. Selector check   │  ← Ya existe (escapeUtils)
│ 3. Variable check   │  ← Ya existe (variableManager)
│ 4. Quality check    │  ← Ya existe (PipelineCodeLinter)
│ 5. Coverage check   │  ← Nuevo: validar que todos los nodos tengan mapper
└─────────────────────┘
      ↓
Display con status badge:
  ✓ Valid code
  ⚠ Warnings (N issues)
  ✗ Invalid (N issues)
```

### 14.3 Validación por Lenguaje

| Lenguaje | Parser | Integración |
|----------|--------|-------------|
| JavaScript | `acorn` o `esprima` | npm package |
| TypeScript | `typescript` compiler API | npm package |
| Python | `ast` module (via worker) | Child process |
| Java | `javaparser` | No trivial |
| C# | `Microsoft.CodeAnalysis.CSharp` | No trivial |

**Recomendación**: Para MVP, validar JS/TS con `acorn` (ligero, fast). Para Python/Java/C#, comment-only validation (comment syntax check).

---

## 15. AI Opportunities

### 15.1 Infraestructura Existente

Haltest YA tiene:
- **AIService** con 5 providers (Ollama, OpenAI, Anthropic, Google, OpenRouter)
- **LLMFactory** con abstracción de providers
- **Key Vault** para encrypted credential storage
- **AISettingsPanel** en frontend
- **Vercel AI SDK** como base

### 15.2 Funcionalidades AI para Code Preview

| Feature | Complejidad | Dependencia AI | Prioridad |
|---------|------------|----------------|-----------|
| **Explain Code** | Baja | Sí | Alta |
| **Review/Audit** | Media | Sí | Alta |
| **Fix Error** | Media | Sí | Alta |
| **Optimize Locator** | Media | Sí | Media |
| **Suggest Assertion** | Baja | Sí | Media |
| **Improve Code** | Alta | Sí | Baja |
| **Refactor** | Alta | Sí | Baja |

### 15.3 Flujo AI Propuesto

```
User clicks "AI Review"
    ↓
Code context extracted (node_id → code range → config)
    ↓
AIService.generateText() with code + context
    ↓
Response parsed (structured output)
    ↓
┌─────────────────────────┐
│ AI Suggestion Panel      │
├─────────────────────────┤
│ 📝 Suggestion text       │
│ 🔄 Diff preview          │
│ ✅ Accept button         │
│ ❌ Dismiss button        │
└─────────────────────────┘
    ↓ (if accepted)
Apply changes to code → Validate → Update Canvas (if applicable)
```

### 15.4 Seguridad / Privacidad AI

**Riesgos**:
- Código puede contener URLs internas, credenciales, tokens
- DOM snapshots pueden contener datos sensibles
- Variables pueden contener secrets

**Mitigaciones**:

```javascript
// 1. Sensitive data detection antes de enviar a AI
const sanitizeForAI = (code) => {
    return code
        .replace(/password\s*[:=]\s*['"][^'"]+['"]/gi, 'password: [REDACTED]')
        .replace(/token\s*[:=]\s*['"][^'"]+['"]/gi, 'token: [REDACTED]')
        .replace(/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, 'api_key: [REDACTED]')
        .replace(/\/\/.*@/g, '// [REDACTED]@');  // URLs con auth
};

// 2. User confirmation antes de enviar
const sendToAI = async (code) => {
    const sanitized = sanitizeForAI(code);
    if (sanitized !== code) {
        const confirmed = await showConfirmDialog(
            'El código contiene datos potencialmente sensibles. ¿Enviar versión sanitizada a IA?'
        );
        if (!confirmed) return;
    }
    return aiService.generateText(sanitized);
};

// 3. Local AI support (Ollama)
// Ya soportado — Ollama no envía datos a servicios externos
```

---

## 16. Playwright Capabilities We Can Reuse

### 16.1 Codegen

Playwright Codegen ya genera código para múltiples lenguajes. Haltest puede:
- Usar las mismas convenciones de locators
- Generar código compatible con `npx playwright codegen` output
- Reutilizar la lógica de selector recommendation

### 16.2 Trace Viewer

Playwright Trace permite:
- Timeline de acciones
- Screenshots por paso
- DOM snapshots
- Network log
- Console log
- Source code mapping

**Haltest NO debe duplicar esto.** En su lugar:
- Generar código con `test.step()` wrappers
- Incluir `node_id` comments para mapeo
- When executing via Playwright test runner, Trace se genera automáticamente

### 16.3 test.step()

Ya se usa en el código generado:
```javascript
await test.step(`Fill Register Form`, async () => {
    // node code here
});
```

Esto permite que Playwright Trace agrupe acciones por step, y que Haltest mapee `node_id` → trace step.

### 16.4 Source Mapping

Playwright soporta source maps para TypeScript. Haltest puede:
- Generar source maps que mapeen código generado → nodos originales
- Usar `sourceRoot` para apuntar al directorio de nodos

---

## 17. Performance Considerations

### 17.1 Problema Actual

```
Cada cambio de nodo
        ↓
Regenerar todo el flujo
        ↓
Re-render editor
        ↓
Canvas lento con flujos grandes
```

### 17.2 Estrategia

| Técnica | Aplicación | Impacto |
|---------|-----------|---------|
| **Debouncing** | TerminalPanel ya usa debounce en regeneración | ✅ Implementado |
| **Incremental generation** | Solo regenerar nodos cambiados + dependientes | Alto |
| **Memoization** | Cache de código generado por nodo | Alto |
| **AST caching** | Mantener AST intermedio, regenerar soloAffected steps | Medio |
| **Web Worker** | Mover code gen a worker thread | Medio |
| **Lazy generation** | Generar solo nodos visibles en viewport | Bajo |

### 17.3 Recomendación para MVP

1. **Mantener debouncing** (ya existe)
2. **Agregar memoization por nodo**: `{ nodeId → generatedCode }` cache
3. **Invalidar cache** solo para nodos cambiados + downstream
4. **Web Worker** solo si flujos > 100 nodos muestran lag

---

## 18. Import / Export Feasibility

### 18.1 Export (Canvas → Code)

**Factibilidad**: ✅ Alta (ya funciona)

El sistema actual exporta correctamente. Mejoras:
- Agregar更多 lenguajes/frameworks
- Integrar PipelineCodeLinter para quality score
- Agregar metadata de trazabilidad

### 18.2 Import (Code → Canvas)

**Factibilidad**: ⚠️ Media (limitada)

El sistema actual (`importer/`) ya tiene:
- PlaywrightParser (Babel AST)
- PlaywrightMapper (AST → HalTest actions)
- FrameworkDetector

**Limitaciones**:
- Solo funciona con código Playwright que siga convenciones estándar
- No puede parsear código arbitrario complejo
- Variables hardcodeadas se pierden
- Custom selectors pueden no mapearse

**Subset soportable inicialmente**:
```javascript
// ✅ Soportado:
await page.goto('https://example.com');
await page.click('#login');
await page.fill('#email', 'test@test.com');
await expect(page).toHaveTitle('Home');

// ❌ No soportado:
const data = await page.evaluate(() => { ... });
await page.route('**/api/**', route => route.fulfill({...}));
// Custom logic, loops complejos, etc.
```

---

## 19. Product / UX Improvements

### 19.1 Funcionalidades MVP

| Feature | Complejidad | Impacto UX | Prioridad |
|---------|------------|-----------|-----------|
| Split View (Canvas + Code) | Baja | Alto | **MVP** |
| Click-to-code (select node → highlight code) | Baja | Alto | **MVP** |
| Language switcher | Baja | Alto | **MVP** |
| Copy / Download | Ya existe | Alto | **MVP** |
| Format (Prettier) | Baja | Medio | **MVP** |
| Syntax validation badge | Media | Medio | **MVP** |

### 19.2 Funcionalidades Fase 2

| Feature | Complejidad | Impacto UX | Prioridad |
|---------|------------|-----------|-----------|
| Click-to-canvas (code → node) | Media | Alto | Fase 2 |
| Execution cursor in code | Media | Alto | Fase 2 |
| Error sync (code ↔ canvas) | Media | Alto | Fase 2 |
| Code diff (before/after) | Media | Medio | Fase 2 |
| AI Review | Media | Alto | Fase 2 |
| AI Explain | Baja | Medio | Fase 2 |

### 19.3 Funcionalidades Fase 3

| Feature | Complejidad | Impacto UX | Prioridad |
|---------|------------|-----------|-----------|
| Code editor (editable) | Alta | Alto | Fase 3 |
| Code → Canvas (import parcial) | Alta | Alto | Fase 3 |
| Trace integration | Media | Medio | Fase 3 |
| AI Fix with diff | Alta | Alto | Fase 3 |
| Multi-file POM view | Media | Medio | Fase 3 |

---

## 20. Feasibility Matrix

| Feature | Factibilidad | Complejidad | Riesgo | Prioridad |
|---------|-------------|------------|--------|-----------|
| **Composite → Code** | ✅ Alta | Baja | Bajo | **P0** |
| **fill_form mapper** | ✅ Alta | Baja | Bajo | **P0** |
| **JS code gen** | ✅ Alta | Baja | Bajo | **P0** |
| **TypeScript** | ✅ Alta | Baja | Bajo | **P0** |
| **Python** | ✅ Alta | Media | Bajo | **P1** |
| **Java** | ✅ Media | Media | Bajo | **P1** |
| **C#** | ✅ Media | Media | Bajo | **P1** |
| **Code ↔ Canvas mapping** | ✅ Alta | Media | Medio | **P1** |
| **Execution highlighting** | ✅ Alta | Baja | Bajo | **P1** |
| **Error sync** | ✅ Media | Media | Medio | **P1** |
| **Editable Code** | ⚠️ Media | Alta | Alto | **P2** |
| **Code → Canvas** | ⚠️ Baja | Muy Alta | Alto | **P3** |
| **AI Review** | ✅ Alta | Media | Bajo | **P1** |
| **AI Fix** | ✅ Media | Media | Medio | **P2** |
| **AI Explain** | ✅ Alta | Baja | Bajo | **P1** |
| **Trace integration** | ⚠️ Media | Media | Medio | **P2** |
| **Code validation** | ✅ Alta | Media | Bajo | **P1** |
| **Import Playwright** | ⚠️ Media | Alta | Alto | **P2** |

---

## 21. Implementation Phases

### Phase 0 — Registry Audit & Fix (1-2 días)

**Objetivo**: Completar los mappers faltantes para todos los tipos con execution handlers.

**Archivos afectados**:
- `apps/backend/services/exporter/nodes/` — Crear mappers nuevos
- `apps/backend/services/exporter/core/GeneratorRegistry.js` — Registrar nuevos mappers

**Tipos a mapear**:
- `fill_form` → FillFormMapper (CRÍTICO)
- `component` → Already handled inline, but needs mapper for registry completeness
- `run_tests`, `cli_params`, `return_code`, `integrate_ci` → CliMapper
- AI types → AiMapper (con fallback a comentarios)

**Criterio de aceptación**:
- Todo tipo con backend handler tiene un mapper (o es explícitamente marked como unsupported)
- No existe `console.log("not implemented")` para tipos soportados
- Tests unitarios para cada mapper nuevo

### Phase 1 — Code Gen Quality (2-3 días)

**Objetivo**: Mejorar la calidad del código generado.

**Archivos afectados**:
- `apps/backend/services/exporter/nodes/InteractionMapper.js` — Usar locators robustos
- `apps/backend/services/exporter/core/BaseGenerator.js` — Agregar quality hooks
- `apps/backend/services/PipelineCodeLinter.js` — Wirar al pipeline

**Cambios**:
- Usar `page.getByRole()` / `page.getByLabel()` en lugar de CSS selectors
- Wirar PipelineCodeLinter al pipeline de export
- Agregar quality score al output

**Criterio de aceptación**:
- Código generado usa locators Playwright recommended
- PipelineCodeLinter se ejecuta automáticamente
- Output incluye quality score y warnings

### Phase 2 — Canvas ↔ Code Mapping (3-4 días)

**Objetivo**: Bidireccional highlighting entre Canvas y Code.

**Archivos afectados**:
- `apps/frontend/src/components/TerminalPanel.jsx` — Click handling, range mapping
- `apps/frontend/src/components/nodes/CustomNode.jsx` — Click-to-code
- `apps/frontend/src/App.jsx` — State management

**Cambios**:
- Click en nodo → highlight rango de código correspondiente
- Click en código → seleccionar nodo en Canvas
- Mapping de `node_id` → code ranges
- Highlight de código durante ejecución

**Criterio de aceptación**:
- Click en nodo highlightea su código
- Click en código selecciona el nodo
- Durante ejecución, el código del nodo activo se muestra destacado

### Phase 3 — Error Synchronization (2-3 días)

**Objetivo**: Errores sincronizados entre Canvas y Code.

**Archivos afectados**:
- `apps/frontend/src/components/TerminalPanel.jsx` — Error display
- `apps/frontend/src/hooks/flow/useFlowExecution.js` — Error propagation

**Cambios**:
- Error en nodo → highlight rojo en código
- Error en código → show tooltip con error detail
- Click en error → navegar al nodo con error

**Criterio de aceptación**:
- Errores se muestran en ambos lados
- Click en error navega al nodo correspondiente

### Phase 4 — Multi-Language Generators (5-7 días)

**Objetivo**: Completar soporte para Python, Java, C#.

**Archivos afectados**:
- Todos los mappers en `apps/backend/services/exporter/nodes/`
- `apps/backend/services/exporter/generators/PlaywrightGenerator.js`

**Criterio de aceptación**:
- Código generado para cada lenguaje es sintácticamente válido
- Framework-specific conventions se respetan

### Phase 5 — Code Validation (3-4 días)

**Objetivo**: Validación automática del código generado.

**Archivos afectados**:
- Nuevo: `apps/backend/services/CodeValidator.js`
- `apps/backend/services/exporter/core/BaseGenerator.js`
- `apps/frontend/src/components/TerminalPanel.jsx`

**Criterio de aceptación**:
- JS/TS se valida con parser
- Output incluye validation status badge
- Warnings se muestran inline

### Phase 6 — AI Capabilities (5-7 días)

**Objetivo**: Funcionalidades AI en Code Preview.

**Archivos afectados**:
- Nuevo: `apps/frontend/src/components/CodeAiPanel.jsx`
- `apps/backend/services/AIService.js` — Nuevos métodos
- `apps/frontend/src/components/TerminalPanel.jsx` — AI integration

**Criterio de aceptación**:
- AI Review genera suggestions
- AI Explain explica código
- AI Fix sugiere fixes con diff
- Solo aparece cuando AI está configurado
- Cambios pasan por user approval

### Phase 7 — Advanced Editor (7-10 días)

**Objetivo**: Code editor con sync bidireccional.

**Criterio de aceptación**:
- Editor con syntax highlighting real (Monaco/CodeMirror)
- Edit → validate → diff → apply
- Conflict resolution
- Rollback capability

---

## 22. Files / Components to Change

### Phase 0 — Registry Fix

| Archivo | Cambio |
|---------|--------|
| `services/exporter/nodes/FillFormMapper.js` | **Nuevo** — Mapper para fill_form |
| `services/exporter/nodes/CliMapper.js` | **Nuevo** — Mapper para run_tests, cli_params, etc. |
| `services/exporter/nodes/AiMapper.js` | **Nuevo** — Mapper para AI types (comment fallback) |
| `services/exporter/core/GeneratorRegistry.js` | Registrar nuevos mappers |
| `__tests__/fill_form_mapper.test.js` | **Nuevo** — Tests |

### Phase 2 — Canvas ↔ Code

| Archivo | Cambio |
|---------|--------|
| `components/TerminalPanel.jsx` | Click handling, range mapping |
| `components/nodes/CustomNode.jsx` | Click-to-code event |
| `App.jsx` | Code preview state management |

### Phase 6 — AI

| Archivo | Cambio |
|---------|--------|
| `components/CodeAiPanel.jsx` | **Nuevo** — AI suggestion panel |
| `services/AIService.js` | Nuevos métodos (explain, review, fix) |
| `components/TerminalPanel.jsx` | AI button integration |

---

## 23. Testing Strategy

### 23.1 Unit Tests

```javascript
// fill_form_mapper.test.js
describe('FillFormMapper', () => {
  it('generates JS code for text fields', () => { ... });
  it('generates JS code for select fields', () => { ... });
  it('generates JS code for checkbox fields', () => { ... });
  it('generates Python code for text fields', () => { ... });
  it('handles submit after fill', () => { ... });
  it('escapes selectors safely', () => { ... });
});

// generator_registry.test.js
describe('NodeMapperRegistry', () => {
  it('has mapper for all backend handler types', () => { ... });
  it('returns undefined for unsupported types', () => { ... });
});

// code_validation.test.js
describe('CodeValidator', () => {
  it('validates JS syntax', () => { ... });
  it('validates TS syntax', () => { ... });
  it('detects invalid selectors', () => { ... });
});
```

### 23.2 Integration Tests

```javascript
// Canvas → Flow Model → Code pipeline
describe('Code Generation Pipeline', () => {
  it('generates code from simple flow', () => { ... });
  it('generates code from composite node', () => { ... });
  it('resolves sub-flow references', () => { ... });
  it('handles all node types', () => { ... });
});
```

### 23.3 E2E Tests

```javascript
// Real flows with all node types
describe('Code Preview E2E', () => {
  it('shows code for navigation flow', () => { ... });
  it('shows code for login flow with fill_form', () => { ... });
  it('highlights code during execution', () => { ... });
  it('syncs errors between canvas and code', () => { ... });
});
```

---

## 24. Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **fill_form mapper genera código incorrecto** | Media | Alto | Tests exhaustivos + validación manual |
| **Nuevos mappers rompen generación existente** | Baja | Alto | Tests de regresión + feature flags |
| **Performance degradation con muchos mappers** | Baja | Medio | Benchmark + lazy loading |
| **AI suggestions envían datos sensibles** | Media | Alto | Sanitization + user confirmation |
| **Import de código arbitrario falla** | Alta | Medio | Limitar subset soportado + fallback graceful |
| **Sync bidireccional crea conflictos** | Media | Alto | Explicit sync mode + conflict resolution UI |

---

## 25. Acceptance Criteria

### Código
- [ ] Todo nodo con backend handler tiene un mapper o es explícitamente marked como unsupported
- [ ] No existe `console.log("not implemented")` para tipos soportados
- [ ] fill_form genera código Playwright válido para todos los lenguajes
- [ ] Nodos compuestos generan código recursivo correcto
- [ ] Código generado usa locators Playwright recommended

### Sincronización
- [ ] Click en nodo → highlight código correspondiente
- [ ] Click en código → seleccionar nodo en Canvas
- [ ] Durante ejecución, nodo activo se highlightea en código
- [ ] Errores se sincronizan entre Canvas y Code

### Validación
- [ ] JS/TS se valida con parser
- [ ] Output incluye validation status badge
- [ ] Warnings se muestran inline

### Multi-language
- [ ] JS, TS, Python, Java, C# generan código válido
- [ ] Framework conventions se respetan por lenguaje

### AI
- [ ] AI Review, Explain, Fix funcionan cuando AI está configurado
- [ ] Cambios AI pasan por user approval
- [ ] Datos sensibles se sanitizan antes de enviar a AI

---

## 26. Recommended MVP

### MVP Scope (Phase 0-2)

**Incluye**:
1. ✅ fill_form mapper (resolve el bug reportado)
2. ✅ Todos los tipos críticos con mappers
3. ✅ Code quality warnings (PipelineCodeLinter wirado)
4. ✅ Click-to-code (select node → highlight code)
5. ✅ Language switcher (JS/TS/Python/Java/C#)
6. ✅ Syntax validation badge para JS/TS

**No incluye**:
- ❌ Code editor bidireccional
- ❌ AI capabilities
- ❌ Trace integration
- ❌ Import de código arbitrario
- ❌ Multi-file POM view

### Effort estimado

| Phase | Días | Dependencias |
|-------|------|-------------|
| Phase 0 | 1-2 | Ninguna |
| Phase 1 | 2-3 | Phase 0 |
| Phase 2 | 3-4 | Phase 0 |
| **Total MVP** | **6-9 días** | |

---

## 27. Future Roadmap

### Q1 — Foundation
- Phase 0: Registry fix
- Phase 1: Code gen quality
- Phase 2: Canvas ↔ Code mapping

### Q2 — Intelligence
- Phase 3: Error sync
- Phase 4: Multi-language completion
- Phase 5: Code validation
- Phase 6: AI capabilities

### Q3 — Advanced
- Phase 7: Code editor
- Import/export improvements
- Trace integration
- Advanced debugging

---

## 28. Answer: Repair or Refactor?

### **Reparar incrementalmente.**

**Evidencia**:
1. La arquitectura existente (BaseGenerator + NodeMapperRegistry) es sólida y extensible
2. El problema de fill_form es una omisión de registro, no un defecto arquitectónico
3. 67 de 86 tipos ya tienen mappers funcionales
4. El pipeline Canvas → FlowResolver → Generator → Code funciona correctamente
5. La infraestructura de AI ya existe y puede ser integrada

**Lo que SÍ se necesita**:
1. Completar los 17 mappers faltantes (Phase 0)
2. Agregar sincronización Canvas↔Code (Phase 2)
3. Agregar validación de código (Phase 5)

**Lo que NO se necesita**:
1. Un AST intermedio separado (la representación actual es suficiente)
2. Un rewrite del code generator
3. Un nuevo framework de code generation

**La deuda técnica real**: La desconexión entre execution handlers y code mappers. Se resuelve con un **node definition schema** que incluya ambos:
```javascript
{
  type: 'fill_form',
  handler: './handlers/fill_form.js',      // execution
  mapper: './nodes/FillFormMapper.js',      // code generation
  schema: './schemas/fill_form.js',         // validation
  inputs: NODE_INPUTS.fill_form,            // UI
  category: 'user_simulation'              // grouping
}
```

Esto es incremental sobre lo existente y puede hacerse sin Breaking changes.
