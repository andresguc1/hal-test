// schemas/testSchemas.js (OPTIMIZADO Y COMPLETO)

// ----------------------------------------------------------------------
// 1. ⚙️ Optimización de Importaciones: Importación unificada de todos los esquemas
//    Asume que todos los archivos de esquema están exportados por nombre desde sus carpetas
// ----------------------------------------------------------------------
import {
    // 🛠️ Navegador y Entorno
    launchBrowserBodySchema as launchBrowser,
    closeBrowserBodySchema as closeBrowser,
    openUrlBodySchema as openUrl,
    resizeViewportBodySchema as resizeViewport,
    manageTabsBodySchema as manageTabs,
    backForwardBodySchema as back, // Esquema back/forward
    // Se asume el mismo esquema para 'forward' si es simple
    // backForwardBodySchema as forward,

    // ⏳ Waits (Espera)
    waitFixedBodySchema as waitFixed,
    waitVisibleBodySchema as waitVisible,
    waitNavigationBodySchema as waitNavigation,
    waitNetworkBodySchema as waitNetwork,
    waitConditionalBodySchema as waitConditional,
    waitForElementBodySchema as waitForElement, // Incluido del router anterior

    // 🖱️ Interacción
    clickBodySchema as click,
    typeTextBodySchema as typeText,
    selectOptionBodySchema as selectOption,
    // fillFormBodySchema as fillForm,
    scrollBodySchema as scroll,
    dragDropBodySchema as dragDrop,
    uploadFileBodySchema as uploadFile,

    // 📸 Captura y Logs
    takeScreenshotBodySchema as takeScreenshot,
    saveDomBodySchema as saveDom,
    logErrorsBodySchema as logErrors,
    listenEventsBodySchema as listenEvents,

    // 🌐 Network
    interceptRequestBodySchema as interceptRequest,
    mockResponseBodySchema as mockResponse,
    blockResourceBodySchema as blockResource,
    modifyHeadersBodySchema as modifyHeaders,

    // 🍪 Sesión y Contexto (Incluidos del router anterior)
    manageCookiesBodySchema as manageCookies,
    manageStorageBodySchema as manageStorage,
    injectTokensBodySchema as injectTokens,
    persistSessionBodySchema as persistSession,
    createContextBodySchema as createContext,
    closeContextBodySchema as closeContext,
    cleanupStateBodySchema as cleanupState,

    // 🔧 Utilidades y Flujo
    handleHooksBodySchema as handleHooks,
    controlExceptionsBodySchema as controlExceptions,
    readDataBodySchema as readData,
    saveResultsBodySchema as saveResults,
    handleDownloadsBodySchema as handleDownloads,
    cliParamsBodySchema as cliParams,
    returnCodeBodySchema as returnCode,
    integrateCIBodySchema as integrateCI,

    // 🧠 LLM y Pruebas
    callLlmBodySchema as callLlm,
    generateDataBodySchema as generateData,
    validateSemanticBodySchema as validateSemantic,
    runTestsBodySchema as runTests,

    // 💡 Otras acciones (del router anterior)
    findElementBodySchema as findElement,
    getSetContentBodySchema as getSetContent,
    executeJsBodySchema as executeJs,
} from './index.js'; // 💡 Nota: Requiere un archivo ./index.js que agrupe todos los esquemas.

// ----------------------------------------------------------------------
// 2. 🚀 Optimización: Definición centralizada de todos los esquemas
//    Usa un objeto para mapear los nombres de exportación a los esquemas importados
// ----------------------------------------------------------------------
const allBodySchemas = {
    // Re-exportaciones de Esquemas Base (BodySchema)
    launchBrowserBodySchema: launchBrowser,
    closeBrowserBodySchema: closeBrowser,
    openUrlBodySchema: openUrl,
    resizeViewportBodySchema: resizeViewport,
    manageTabsBodySchema: manageTabs,
    backForwardBodySchema: back, // Se usa el mismo para back/forward
    waitFixedBodySchema: waitFixed,
    waitVisibleBodySchema: waitVisible,
    waitNavigationBodySchema: waitNavigation,
    waitNetworkBodySchema: waitNetwork,
    waitConditionalBodySchema: waitConditional,
    clickBodySchema: click,
    typeTextBodySchema: typeText,
    selectOptionBodySchema: selectOption,

    scrollBodySchema: scroll,
    dragDropBodySchema: dragDrop,
    uploadFileBodySchema: uploadFile,
    takeScreenshotBodySchema: takeScreenshot,
    saveDomBodySchema: saveDom,
    logErrorsBodySchema: logErrors,
    listenEventsBodySchema: listenEvents,
    interceptRequestBodySchema: interceptRequest,
    mockResponseBodySchema: mockResponse,

    // Incluir esquemas adicionales del router optimizado para completitud
    waitForElementBodySchema: waitForElement,
    blockResourceBodySchema: blockResource,
    modifyHeadersBodySchema: modifyHeaders,
    manageCookiesBodySchema: manageCookies,
    manageStorageBodySchema: manageStorage,
    injectTokensBodySchema: injectTokens,
    persistSessionBodySchema: persistSession,
    createContextBodySchema: createContext,
    closeContextBodySchema: closeContext,
    cleanupStateBodySchema: cleanupState,
    handleHooksBodySchema: handleHooks,
    controlExceptionsBodySchema: controlExceptions,
    readDataBodySchema: readData,
    saveResultsBodySchema: saveResults,
    handleDownloadsBodySchema: handleDownloads,
    cliParamsBodySchema: cliParams,
    returnCodeBodySchema: returnCode,
    integrateCIBodySchema: integrateCI,
    callLlmBodySchema: callLlm,
    generateDataBodySchema: generateData,
    validateSemanticBodySchema: validateSemantic,
    runTestsBodySchema: runTests,
    findElementBodySchema: findElement,
    getSetContentBodySchema: getSetContent,
    executeJsBodySchema: executeJs,
};

// ----------------------------------------------------------------------
// 3. ✨ Generación y Exportación Dinámica
//    Genera:
//    a) Re-exportaciones de BodySchema (e.g., export const launchBrowserBodySchema = ...)
//    b) Esquemas de Validación para Middleware (e.g., export const launchBrowserSchema = { body: ... })
// ----------------------------------------------------------------------
const schemasToExport = {};

Object.entries(allBodySchemas).forEach(([key, schema]) => {
    // a) Re-exportaciones de Esquemas Base (e.g., launchBrowserBodySchema)
    schemasToExport[key] = schema;

    // b) Esquemas de Validación para Middleware (e.g., launchBrowserSchema)
    const middlewareKey = key.replace('BodySchema', 'Schema');
    schemasToExport[middlewareKey] = { body: schema };
});

// Exporta todos los objetos generados dinámicamente
// Esto permite usar la desestructuración: import { openUrlBodySchema, openUrlSchema } from './testSchemas.js';
export default schemasToExport;

// NOTA: Si tu entorno de testing requiere una exportación con `export const ...`,
// tendrás que usar `module.exports = schemasToExport` o un bucle de exportación
// diferente que cree las constantes de forma explícita, pero para un archivo
// de utilidades central, un `export default` de un objeto es a menudo el más simple.

// 💡 Si necesitas la exportación por nombre (`export const`):
/*
// ----------------------------------------------------------------------
// 3. (Alternativa) Exportación con Bucle (Si el entorno lo exige)
// ----------------------------------------------------------------------
const exports = {};
Object.entries(allBodySchemas).forEach(([key, schema]) => {
    exports[key] = schema; // Re-exportación de BodySchema
    const middlewareKey = key.replace('BodySchema', 'Schema');
    exports[middlewareKey] = { body: schema }; // Esquema de Middleware
});

// Exporta las constantes dinámicamente
Object.keys(exports).forEach(key => {
    module.exports[key] = exports[key];
});
*/
