import swaggerJsdoc from 'swagger-jsdoc';
import { convertJoiToOpenApiSchema } from './schemaConverter.js';

// 🎯 Importación del objeto completo exportado por default de tu archivo de schemas
import * as allJoiSchemas from '../schemas/index.js';

// Desestructuración de TODOS los SCHEMAS
const {
    // Navegación
    launchBrowserBodySchema,
    closeBrowserBodySchema,
    openUrlBodySchema,
    resizeViewportBodySchema,
    manageTabsBodySchema,
    backForwardBodySchema,

    // Interacción
    findElementBodySchema,
    getSetContentBodySchema,
    executeJsBodySchema,
    clickBodySchema,
    typeTextBodySchema,
    fillFormBodySchema,
    selectOptionBodySchema,
    scrollBodySchema,
    dragDropBodySchema,
    uploadFileBodySchema,
    interactionBodySchema,

    // Espera
    waitForElementBodySchema,
    waitVisibleBodySchema,
    waitNavigationBodySchema,
    waitNetworkBodySchema,
    waitConditionalBodySchema,
    waitFixedBodySchema,

    // Captura y Logs
    takeScreenshotBodySchema,
    saveDomBodySchema,
    logErrorsBodySchema,
    listenEventsBodySchema,
    saveResultsBodySchema,

    // Network
    interceptRequestBodySchema,
    mockResponseBodySchema,
    blockResourceBodySchema,
    modifyHeadersBodySchema,

    // Sesión
    manageSessionBodySchema,
    persistSessionBodySchema,
    createContextBodySchema,
    closeContextBodySchema,
    cleanupStateBodySchema,

    // Utilidades / Flujo
    handleHooksBodySchema,
    controlExceptionsBodySchema,
    readDataBodySchema,
    handleDownloadsBodySchema,
    cliParamsBodySchema,
    returnCodeBodySchema,
    integrateCIBodySchema,

    // AI
    callLlmBodySchema,
    generateDataBodySchema,
    validateSemanticBodySchema,
    runTestsBodySchema,
} = allJoiSchemas;

const options = {
    // --- Metadatos de la API (Información General y Orden de Categorías) ---
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HaltTest API Backend',
            version: '1.0.0-NO-MCP',
            description:
                'Documentación de la API RESTful para la orquestación de acciones de testing. Los esquemas de entrada se generan dinámicamente desde Joi (SSOT).',
            contact: {
                name: 'Equipo HaltTest',
                url: 'https://github.com/tu-usuario/halt-test-project',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:2001/api',
                description: 'Servidor de Desarrollo Local',
            },
        ],
        // 📝 Define el ORDEN y la DESCRIPCIÓN de las categorías
        tags: [
            { name: 'General', description: 'Endpoints de estado y salud del sistema.' },
            {
                name: 'Browser Management',
                description: 'Launch, close, navigation, tabs, and viewport control.',
            },
            {
                name: 'DOM Manipulation',
                description: 'Find elements, get/set content, execute JS.',
            },
            {
                name: 'User Simulation',
                description: 'Simulated user interactions: click, type, scroll, drag & drop.',
            },
            {
                name: 'Synchronization',
                description: 'Waits and pauses for conditions, visibility, or network.',
            },
            {
                name: 'Diagnostics',
                description: 'Screenshots, DOM extraction, logs, and event listening.',
            },
            { name: 'Network Control', description: 'Network interception and mock responses.' },
            {
                name: 'Session Management',
                description: 'Cookies, storage, tokens, and context persistence.',
            },
            {
                name: 'Test Execution',
                description: 'Context creation, cleanup, hooks, and exception handling.',
            },
            { name: 'File Data', description: 'Reading data, saving results, handling downloads.' },
            { name: 'LLM AI', description: 'AI integrations for data generation and validation.' },
            {
                name: 'Execution Interface',
                description: 'Parameters, return codes, CI integration.',
            },
        ],
        components: {
            // --- ESQUEMAS DE SEGURIDAD ---
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token de autenticación JWT.',
                },
            },

            // --- SCHEMAS REUSABLES Y GENERADOS ---
            schemas: {
                // 1. RESPUESTA DE ÉXITO ESTÁNDAR (Manual)
                StandardSuccess: {
                    type: 'object',
                    description: 'Estructura estándar para respuestas exitosas (HTTP 200/201).',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Operación completada exitosamente.' },
                        data: {
                            type: 'object',
                            description: 'Contenido opcional retornado por la acción.',
                        },
                    },
                },

                // 2. RESPUESTA DE ERROR ESTÁNDAR (Manual)
                ErrorResponse: {
                    type: 'object',
                    description:
                        'Estructura estándar para errores de cliente (4xx) o servidor (5xx).',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Error de validación en la petición.' },
                        details: {
                            type: 'array',
                            description: 'Detalles de los errores de campo (para 400 Bad Request).',
                            items: { type: 'object' },
                        },
                    },
                },

                // 3. SCHEMAS DE INPUT GENERADOS AUTOMÁTICAMENTE DESDE JOI

                // Browser Management
                LaunchBrowserBodySchema: convertJoiToOpenApiSchema(launchBrowserBodySchema),
                CloseBrowserBodySchema: convertJoiToOpenApiSchema(closeBrowserBodySchema),
                OpenUrlBodySchema: convertJoiToOpenApiSchema(openUrlBodySchema),
                ResizeViewportBodySchema: convertJoiToOpenApiSchema(resizeViewportBodySchema),
                ManageTabsBodySchema: convertJoiToOpenApiSchema(manageTabsBodySchema),
                BackForwardBodySchema: convertJoiToOpenApiSchema(backForwardBodySchema),

                // DOM Manipulation
                FindElementBodySchema: convertJoiToOpenApiSchema(findElementBodySchema),
                GetSetContentBodySchema: convertJoiToOpenApiSchema(getSetContentBodySchema),
                ExecuteJsBodySchema: convertJoiToOpenApiSchema(executeJsBodySchema),

                // User Simulation
                ClickBodySchema: convertJoiToOpenApiSchema(clickBodySchema),
                TypeTextBodySchema: convertJoiToOpenApiSchema(typeTextBodySchema),
                FillFormBodySchema: convertJoiToOpenApiSchema(fillFormBodySchema),
                SelectOptionBodySchema: convertJoiToOpenApiSchema(selectOptionBodySchema),
                ScrollBodySchema: convertJoiToOpenApiSchema(scrollBodySchema),
                DragDropBodySchema: convertJoiToOpenApiSchema(dragDropBodySchema),
                UploadFileBodySchema: convertJoiToOpenApiSchema(uploadFileBodySchema),
                InteractionBodySchema: convertJoiToOpenApiSchema(interactionBodySchema),

                // Synchronization
                WaitForElementBodySchema: convertJoiToOpenApiSchema(waitForElementBodySchema),
                WaitVisibleBodySchema: convertJoiToOpenApiSchema(waitVisibleBodySchema),
                WaitNavigationBodySchema: convertJoiToOpenApiSchema(waitNavigationBodySchema),
                WaitNetworkBodySchema: convertJoiToOpenApiSchema(waitNetworkBodySchema),
                WaitConditionalBodySchema: convertJoiToOpenApiSchema(waitConditionalBodySchema),
                WaitFixedBodySchema: convertJoiToOpenApiSchema(waitFixedBodySchema),

                // Diagnostics
                TakeScreenshotBodySchema: convertJoiToOpenApiSchema(takeScreenshotBodySchema),
                SaveDomBodySchema: convertJoiToOpenApiSchema(saveDomBodySchema),
                LogErrorsBodySchema: convertJoiToOpenApiSchema(logErrorsBodySchema),
                ListenEventsBodySchema: convertJoiToOpenApiSchema(listenEventsBodySchema),
                SaveResultsBodySchema: convertJoiToOpenApiSchema(saveResultsBodySchema),

                // Network Control
                InterceptRequestBodySchema: convertJoiToOpenApiSchema(interceptRequestBodySchema),
                MockResponseBodySchema: convertJoiToOpenApiSchema(mockResponseBodySchema),
                BlockResourceBodySchema: convertJoiToOpenApiSchema(blockResourceBodySchema),
                ModifyHeadersBodySchema: convertJoiToOpenApiSchema(modifyHeadersBodySchema),

                // Session Management
                ManageSessionBodySchema: convertJoiToOpenApiSchema(manageSessionBodySchema),
                PersistSessionBodySchema: convertJoiToOpenApiSchema(persistSessionBodySchema),
                CreateContextBodySchema: convertJoiToOpenApiSchema(createContextBodySchema),
                CloseContextBodySchema: convertJoiToOpenApiSchema(closeContextBodySchema),
                CleanupStateBodySchema: convertJoiToOpenApiSchema(cleanupStateBodySchema),

                // Utilidades / Flujo
                HandleHooksBodySchema: convertJoiToOpenApiSchema(handleHooksBodySchema),
                ControlExceptionsBodySchema: convertJoiToOpenApiSchema(controlExceptionsBodySchema),
                ReadDataBodySchema: convertJoiToOpenApiSchema(readDataBodySchema),
                HandleDownloadsBodySchema: convertJoiToOpenApiSchema(handleDownloadsBodySchema),
                CliParamsBodySchema: convertJoiToOpenApiSchema(cliParamsBodySchema),
                ReturnCodeBodySchema: convertJoiToOpenApiSchema(returnCodeBodySchema),
                IntegrateCIBodySchema: convertJoiToOpenApiSchema(integrateCIBodySchema),

                // AI
                CallLlmBodySchema: convertJoiToOpenApiSchema(callLlmBodySchema),
                GenerateDataBodySchema: convertJoiToOpenApiSchema(generateDataBodySchema),
                ValidateSemanticBodySchema: convertJoiToOpenApiSchema(validateSemanticBodySchema),
                RunTestsBodySchema: convertJoiToOpenApiSchema(runTestsBodySchema),
            },
        },
    },

    // --- Rutas de los archivos donde buscar los comentarios JSDoc (Globs Relativos) ---
    apis: [
        './app.js',
        './routes/*.js', // Esto importará nuestro nuevo swaggerDefinitions.js automáticamente
        './swagger/swaggerConfig.js',
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
