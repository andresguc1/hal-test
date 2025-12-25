/**
 * @swagger
 * tags:
 *   - name: Browser Management
 *     description: Control del navegador, gestión de pestañas y viewport.
 *   - name: DOM Manipulation
 *     description: Búsqueda y manipulación de elementos del DOM.
 *   - name: User Simulation
 *     description: Simulación de acciones de usuario (click, teclear, etc.).
 *   - name: Synchronization
 *     description: Operaciones de espera y sincronización.
 *   - name: Diagnostics
 *     description: Capturas, logs y monitoreo de eventos.
 *   - name: Network Control
 *     description: Intercepción y modificación de tráfico de red.
 *   - name: Session Management
 *     description: Cookies, almacenamiento local y manejo de sesión.
 *   - name: Test Execution
 *     description: Contextos, hooks y manejo de excepciones.
 *   - name: File Data
 *     description: Lectura y escritura de datos.
 *   - name: LLM AI
 *     description: Integración con modelos de lenguaje.
 *   - name: Execution Interface
 *     description: Parámetros de CLI y control de ejecución.
 */

// ==========================================
// Browser Management
// ==========================================

/**
 * @swagger
 * /api/actions/launch_browser:
 *   post:
 *     summary: Lanza una nueva instancia del navegador.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaunchBrowserBodySchema'
 *     responses:
 *       200:
 *         description: Navegador lanzado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/open_url:
 *   post:
 *     summary: Abre una URL en la pestaña activa.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpenUrlBodySchema'
 *     responses:
 *       200:
 *         description: URL abierta correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/close_browser:
 *   post:
 *     summary: Cierra la instancia del navegador.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CloseBrowserBodySchema'
 *     responses:
 *       200:
 *         description: Navegador cerrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/manage_tabs:
 *   post:
 *     summary: Gestiona las pestañas del navegador (crear, cerrar, cambiar).
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManageTabsBodySchema'
 *     responses:
 *       200:
 *         description: Operación de pestañas exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/resize_viewport:
 *   post:
 *     summary: Redimensiona el viewport del navegador.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResizeViewportBodySchema'
 *     responses:
 *       200:
 *         description: Viewport ajustado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/go_back:
 *   post:
 *     summary: Navega hacia atrás en el historial.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BackForwardBodySchema'
 *     responses:
 *       200:
 *         description: Navegación exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/go_forward:
 *   post:
 *     summary: Navega hacia adelante en el historial.
 *     tags: [Browser Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BackForwardBodySchema'
 *     responses:
 *       200:
 *         description: Navegación exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// DOM Manipulation
// ==========================================

/**
 * @swagger
 * /api/actions/find_element:
 *   post:
 *     summary: Busca un elemento en el DOM.
 *     tags: [DOM Manipulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FindElementBodySchema'
 *     responses:
 *       200:
 *         description: Elemento encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/get_set_content:
 *   post:
 *     summary: Obtiene o establece contenido de un elemento.
 *     tags: [DOM Manipulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetSetContentBodySchema'
 *     responses:
 *       200:
 *         description: Operación de contenido exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/execute_js:
 *   post:
 *     summary: Ejecuta código JavaScript arbitrario en la página.
 *     tags: [DOM Manipulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecuteJsBodySchema'
 *     responses:
 *       200:
 *         description: Script ejecutado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// User Simulation
// ==========================================

/**
 * @swagger
 * /api/actions/click:
 *   post:
 *     summary: Simula un click en un elemento.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClickBodySchema'
 *     responses:
 *       200:
 *         description: Click realizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/type_text:
 *   post:
 *     summary: Escribe texto en un campo.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeTextBodySchema'
 *     responses:
 *       200:
 *         description: Texto escrito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/select_option:
 *   post:
 *     summary: Selecciona una opción en un desplegable.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SelectOptionBodySchema'
 *     responses:
 *       200:
 *         description: Opción seleccionada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/submit_form:
 *   post:
 *     summary: Envía un formulario.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitFormBodySchema'
 *     responses:
 *       200:
 *         description: Formulario enviado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/scroll:
 *   post:
 *     summary: Realiza scroll en la página.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScrollBodySchema'
 *     responses:
 *       200:
 *         description: Scroll realizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/drag_drop:
 *   post:
 *     summary: Arrastra y suelta un elemento.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DragDropBodySchema'
 *     responses:
 *       200:
 *         description: Drag & Drop completado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/upload_file:
 *   post:
 *     summary: Sube un archivo a un input file.
 *     tags: [User Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadFileBodySchema'
 *     responses:
 *       200:
 *         description: Archivo subido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Synchronization
// ==========================================

/**
 * @swagger
 * /api/actions/wait_for_element:
 *   post:
 *     summary: Espera la presencia de un elemento.
 *     tags: [Synchronization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitForElementBodySchema'
 *     responses:
 *       200:
 *         description: Elemento encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/wait_visible:
 *   post:
 *     summary: Espera a que un elemento sea visible.
 *     tags: [Synchronization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitVisibleBodySchema'
 *     responses:
 *       200:
 *         description: Elemento visible.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/wait_navigation:
 *   post:
 *     summary: Espera evento de navegación.
 *     tags: [Synchronization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitNavigationBodySchema'
 *     responses:
 *       200:
 *         description: Navegación completada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/wait_network:
 *   post:
 *     summary: Espera inactividad de red.
 *     tags: [Synchronization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitNetworkBodySchema'
 *     responses:
 *       200:
 *         description: Red inactiva.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/wait_conditional:
 *   post:
 *     summary: Espera condición JS personalizada.
 *     tags: [Synchronization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaitConditionalBodySchema'
 *     responses:
 *       200:
 *         description: Condición cumplida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Diagnostics
// ==========================================

/**
 * @swagger
 * /api/actions/take_screenshot:
 *   post:
 *     summary: Toma una captura de pantalla.
 *     tags: [Diagnostics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TakeScreenshotBodySchema'
 *     responses:
 *       200:
 *         description: Screenshot capturado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/save_dom:
 *   post:
 *     summary: Guarda el HTML actual.
 *     tags: [Diagnostics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveDomBodySchema'
 *     responses:
 *       200:
 *         description: DOM guardado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/log_errors:
 *   post:
 *     summary: Registra errores en el servidor.
 *     tags: [Diagnostics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogErrorsBodySchema'
 *     responses:
 *       200:
 *         description: Error registrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/listen_events:
 *   post:
 *     summary: Escucha eventos del navegador.
 *     tags: [Diagnostics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListenEventsBodySchema'
 *     responses:
 *       200:
 *         description: Listener activo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Network Control
// ==========================================

/**
 * @swagger
 * /api/actions/intercept_request:
 *   post:
 *     summary: Intercepta peticiones HTTP.
 *     tags: [Network Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterceptRequestBodySchema'
 *     responses:
 *       200:
 *         description: Intercepción configurada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/mock_response:
 *   post:
 *     summary: Simula respuestas de red.
 *     tags: [Network Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MockResponseBodySchema'
 *     responses:
 *       200:
 *         description: Mock activo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/block_resource:
 *   post:
 *     summary: Bloquea recursos específicos.
 *     tags: [Network Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlockResourceBodySchema'
 *     responses:
 *       200:
 *         description: Recurso bloqueado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/modify_headers:
 *   post:
 *     summary: Modifica headers de petición/respuesta.
 *     tags: [Network Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModifyHeadersBodySchema'
 *     responses:
 *       200:
 *         description: Headers modificados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Session Management
// ==========================================

/**
 * @swagger
 * /api/actions/manage_cookies:
 *   post:
 *     summary: Gestiona cookies del navegador.
 *     tags: [Session Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManageCookiesBodySchema'
 *     responses:
 *       200:
 *         description: Operación de cookies exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/manage_storage:
 *   post:
 *     summary: Gestiona Local Storage y Session Storage.
 *     tags: [Session Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManageStorageBodySchema'
 *     responses:
 *       200:
 *         description: Operación de storage exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/inject_tokens:
 *   post:
 *     summary: Inyecta tokens de autenticación.
 *     tags: [Session Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InjectTokensBodySchema'
 *     responses:
 *       200:
 *         description: Tokens inyectados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/persist_session:
 *   post:
 *     summary: Guarda o carga el estado de la sesión.
 *     tags: [Session Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersistSessionBodySchema'
 *     responses:
 *       200:
 *         description: Sesión persistida/cargada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Test Execution
// ==========================================

/**
 * @swagger
 * /api/actions/create_context:
 *   post:
 *     summary: Crea un nuevo contexto de navegador.
 *     tags: [Test Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContextBodySchema'
 *     responses:
 *       200:
 *         description: Contexto creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/cleanup_state:
 *   post:
 *     summary: Limpia el estado del navegador.
 *     tags: [Test Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CleanupStateBodySchema'
 *     responses:
 *       200:
 *         description: Estado limpio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/handle_hooks:
 *   post:
 *     summary: Ejecuta hooks (beforeEach, afterEach).
 *     tags: [Test Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HandleHooksBodySchema'
 *     responses:
 *       200:
 *         description: Hooks ejecutados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/control_exceptions:
 *   post:
 *     summary: Controla excepciones esperadas.
 *     tags: [Test Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ControlExceptionsBodySchema'
 *     responses:
 *       200:
 *         description: Excepción manejada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/close_context:
 *   post:
 *     summary: Cierra un contexto de navegador.
 *     tags: [Test Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CloseContextBodySchema'
 *     responses:
 *       200:
 *         description: Contexto cerrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// File Data
// ==========================================

/**
 * @swagger
 * /api/actions/read_data:
 *   post:
 *     summary: Lee datos de archivos locales.
 *     tags: [File Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReadDataBodySchema'
 *     responses:
 *       200:
 *         description: Datos leídos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/save_results:
 *   post:
 *     summary: Guarda resultados de ejecución.
 *     tags: [File Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveResultsBodySchema'
 *     responses:
 *       200:
 *         description: Resultados guardados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/handle_downloads:
 *   post:
 *     summary: Gestiona descargas de archivos.
 *     tags: [File Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HandleDownloadsBodySchema'
 *     responses:
 *       200:
 *         description: Descarga gestionada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// LLM AI
// ==========================================

/**
 * @swagger
 * /api/actions/call_llm:
 *   post:
 *     summary: Realiza una llamada a un LLM.
 *     tags: [LLM AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallLlmBodySchema'
 *     responses:
 *       200:
 *         description: Respuesta del LLM.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/generate_data:
 *   post:
 *     summary: Genera datos sintéticos usando IA.
 *     tags: [LLM AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateDataBodySchema'
 *     responses:
 *       200:
 *         description: Datos generados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/validate_semantic:
 *   post:
 *     summary: Valida contenido semánticamente con IA.
 *     tags: [LLM AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateSemanticBodySchema'
 *     responses:
 *       200:
 *         description: Validación completada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

// ==========================================
// Execution Interface
// ==========================================

/**
 * @swagger
 * /api/actions/run_tests:
 *   post:
 *     summary: Ejecuta suites de pruebas externas.
 *     tags: [Execution Interface]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RunTestsBodySchema'
 *     responses:
 *       200:
 *         description: Pruebas iniciadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/cli_params:
 *   post:
 *     summary: Procesa parámetros de línea de comandos.
 *     tags: [Execution Interface]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CliParamsBodySchema'
 *     responses:
 *       200:
 *         description: Parámetros procesados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/return_code:
 *   post:
 *     summary: Gestiona códigos de retorno del proceso.
 *     tags: [Execution Interface]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReturnCodeBodySchema'
 *     responses:
 *       200:
 *         description: Código de retorno establecido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */

/**
 * @swagger
 * /api/actions/integrate_ci:
 *   post:
 *     summary: Integra resultados con sistemas CI/CD.
 *     tags: [Execution Interface]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IntegrateCIBodySchema'
 *     responses:
 *       200:
 *         description: Integración exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 */
