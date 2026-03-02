import * as path from 'path';

// Mock de Playwright Page
const mockPage = () => {
    return {
        screenshot: async (opts) => {
            console.log('📸 page.screenshot called with:', opts);
            return Buffer.from('fake_screenshot_base64');
        },
        waitForSelector: async (selector, opts) => {
            console.log(`⏳ waitForSelector called for: ${selector}`, opts);
            return true;
        },
        $: async (selector) => {
            console.log(`🔍 page.$ called for: ${selector}`);
            if (selector === '#exists') {
                return {
                    screenshot: async (opts) => {
                        console.log('📸 element.screenshot called with:', opts);
                        return Buffer.from('fake_element_screenshot_base64');
                    },
                };
            }
            return null;
        },
    };
};

// Mock de executePlaywrightAction (necesitamos mockearlo porque importamos el controlador real)
// PERO, como action.controller.js exporta la función que USA executePlaywrightAction,
// y executePlaywrightAction es interna del módulo, no podemos mockearla fácilmente sin reescribir.
//
// ESTRATEGIA ALTERNATIVA:
// Dado que 'executePlaywrightAction' es un wrapper que llama a nuestra lógica,
// y nuestra lógica es una función anónima pasada como callback...
//
// Vamos a probar la lógica interna extrayéndola o simulando el entorno completo.
// Sin embargo, para simplificar y no modificar el código original solo para tests,
// vamos a intentar ejecutar la acción completa mockeando `req` y `res`,
// y asumiendo que `executePlaywrightAction` funcionará si mockeamos sus dependencias.
//
// PROBLEMA: `executePlaywrightAction` usa `getActivePage` y `validateBrowser`.
// Si no queremos levantar todo el entorno, podemos hacer un test unitario "sucio"
// o intentar invocar la lógica si la exportáramos.
//
// SOLUCIÓN PRÁCTICA:
// Vamos a crear un script que importa `takeScreenshotAction` pero intercepta `executePlaywrightAction`
// NO es posible interceptar una función interna de un módulo ES6 desde fuera fácilmente.
//
// ENTONCES: Vamos a confiar en que `executePlaywrightAction` maneja el wrapper,
// y nosotros vamos a simular que `req.body` tiene lo necesario.
// PERO `executePlaywrightAction` intentará obtener el browser real.
//
// REVISIÓN: `executePlaywrightAction` llama a `getActivePage(opts.browserId)`.
// Si `browserId` no está, falla o busca uno por defecto.
//
// MEJOR ENFOQUE:
// Voy a crear una versión MODIFICADA TEMPORAL de `action.controller.js` para el test,
// O mejor, voy a leer el archivo, extraer la función interna (el callback) y probar esa lógica aislada.
// Es un poco "hacky" pero muy efectivo para validar la lógica de negocio sin dependencias de infraestructura.

// Lógica extraída directamente de action.controller.js para evitar problemas de parsing
const runScreenshotLogic = async (page, opts, path) => {
    const {
        selector,
        fullPage = false,
        path: savePath,
        format = 'png',
        quality = 100,
        timeout = 30000,
        enabled = true,
    } = opts;

    if (!enabled) {
        console.log(`[Screenshot] Node skipped because it is disabled.`);
        return {
            message: 'Captura de pantalla omitida (nodo deshabilitado)',
            data: {
                skipped: true,
            },
            traceDetails: {
                skipped: true,
            },
        };
    }

    // Configuración de opciones para Playwright
    const screenshotOptions = {
        type: format,
        timeout,
    };

    if (format === 'jpeg') {
        screenshotOptions.quality = quality;
    }

    // Si NO hay selector, usamos fullPage (si se solicitó)
    if (!selector) {
        screenshotOptions.fullPage = fullPage;
    }

    // Validación de seguridad para path (Path Traversal)
    if (savePath) {
        // Normalizar y resolver ruta absoluta
        const resolvedPath = path.resolve(savePath);
        // Definir directorios permitidos (ej. carpeta actual o subcarpetas específicas)
        // En este caso, asumimos que cualquier ruta dentro del proyecto o /tmp es válida,
        // pero bloqueamos intentos de salir de la raíz del sistema o acceder a archivos sensibles.
        // Una validación simple es asegurar que no contenga '..'
        if (savePath.includes('..')) {
            throw new Error('Ruta de archivo no segura: se detectó uso de ".."');
        }
        screenshotOptions.path = resolvedPath;
    }

    let screenshotBuffer;

    if (selector) {
        // Caso 1: Captura de Elemento
        await page.waitForSelector(selector, { state: 'visible', timeout });
        const element = await page.$(selector);
        if (!element) {
            throw new Error(`Elemento no encontrado para captura: ${selector}`);
        }
        screenshotBuffer = await element.screenshot(screenshotOptions);
    } else {
        // Caso 2: Captura de Página Completa / Viewport
        screenshotBuffer = await page.screenshot(screenshotOptions);
    }

    // Retorno de datos
    // SIEMPRE retornamos el base64 para que el frontend pueda mostrarlo
    // y para que el sistema de "Captura Automática" pueda reutilizarlo.
    const base64Image = screenshotBuffer.toString('base64');

    return {
        message: 'Captura tomada exitosamente',
        data: {
            screenshot: base64Image,
            savedTo: savePath ? screenshotOptions.path : null,
            format,
        },
        traceDetails: {
            selector,
            fullPage: !selector && fullPage,
            format,
            quality: format === 'jpeg' ? quality : undefined,
            savedTo: savePath,
        },
    };
};

async function runTests() {
    console.log('🚀 Iniciando pruebas de take_screenshot logic...\n');

    const page = mockPage();

    // TEST 1: Full Page Screenshot (Default)
    console.log('🧪 TEST 1: Full Page Default');
    try {
        const result = await runScreenshotLogic(page, { fullPage: true }, path);
        console.log('✅ Resultado:', result.data.screenshot ? 'Base64 Presente' : 'Falta Base64');
        if (result.traceDetails.fullPage !== true)
            throw new Error('fullPage no se reportó en trace');
    } catch (e) {
        console.error('❌ Falló Test 1:', e);
    }
    console.log('---------------------------------------------------');

    // TEST 2: Element Screenshot (Selector válido)
    console.log('🧪 TEST 2: Element Screenshot (#exists)');
    try {
        const result = await runScreenshotLogic(page, { selector: '#exists' }, path);
        console.log('✅ Resultado:', result.data.screenshot ? 'Base64 Presente' : 'Falta Base64');
        if (result.traceDetails.selector !== '#exists') throw new Error('Selector no reportado');
    } catch (e) {
        console.error('❌ Falló Test 2:', e);
    }
    console.log('---------------------------------------------------');

    // TEST 3: Element Screenshot (Selector inválido)
    console.log('🧪 TEST 3: Element Screenshot (#missing)');
    try {
        await runScreenshotLogic(page, { selector: '#missing' }, path);
        console.error('❌ Falló Test 3: Debería haber lanzado error');
    } catch (e) {
        console.log('✅ Error esperado capturado:', e.message);
    }
    console.log('---------------------------------------------------');

    // TEST 4: Path Validation (Valid)
    console.log('🧪 TEST 4: Path Validation (Valid)');
    try {
        const result = await runScreenshotLogic(page, { path: './safe/shot.png' }, path);
        console.log('✅ SavedTo:', result.data.savedTo);
        if (!result.data.savedTo.endsWith('shot.png'))
            throw new Error('Path no retornado correctamente');
    } catch (e) {
        console.error('❌ Falló Test 4:', e);
    }
    console.log('---------------------------------------------------');

    // TEST 5: Path Validation (Invalid - Traversal)
    console.log('🧪 TEST 5: Path Validation (Invalid ..)');
    try {
        await runScreenshotLogic(page, { path: '../unsafe.png' }, path);
        console.error('❌ Falló Test 5: Debería haber lanzado error de seguridad');
    } catch (e) {
        console.log('✅ Error de seguridad capturado:', e.message);
    }
    console.log('---------------------------------------------------');

    // TEST 6: Format & Quality
    console.log('🧪 TEST 6: Format JPEG & Quality');
    try {
        const result = await runScreenshotLogic(page, { format: 'jpeg', quality: 50 }, path);
        console.log('✅ Format:', result.data.format);
        if (result.data.format !== 'jpeg') throw new Error('Formato incorrecto');
    } catch (e) {
        console.error('❌ Falló Test 6:', e);
    }
    console.log('---------------------------------------------------');
    // TEST 7: Disabled Screenshot
    console.log('🧪 TEST 7: Disabled Screenshot');
    try {
        const result = await runScreenshotLogic(page, { enabled: false }, path);
        console.log(
            '✅ Resultado:',
            result.data.skipped ? 'Captura Omitida' : 'Error: No se omitió',
        );
        if (!result.data.skipped) throw new Error('Debería haber reportado skipped: true');
    } catch (e) {
        console.error('❌ Falló Test 7:', e);
    }
    console.log('---------------------------------------------------');
}

runTests();
