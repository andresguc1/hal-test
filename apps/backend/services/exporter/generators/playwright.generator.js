/**
 * Generador de código Playwright a partir de un flujo de acciones.
 * @param {Array} flowSteps - Lista de pasos del flujo.
 * @returns {string} - Código fuente generado.
 */
export const generatePlaywrightCode = (flowSteps) => {
    if (!Array.isArray(flowSteps)) {
        throw new Error('El flujo debe ser una lista de pasos.');
    }

    const header = `
const { chromium, firefox, webkit } = require('playwright');

(async () => {
    // Configuración inicial
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🚀 Iniciando ejecución del flujo...');
`;

    const footer = `
        console.log('✅ Flujo completado con éxito.');
    } catch (error) {
        console.error('❌ Error durante la ejecución:', error);
    } finally {
        // Limpieza
        await context.close();
        await browser.close();
    }
})();
`;

    const body = flowSteps
        .map((step, index) => {
            const { action, ...params } = step;
            let codeLine = `        // Paso ${index + 1}: ${action}\n`;

            switch (action) {
                case 'launch_browser':
                    // Generalmente manejado en el header, pero si hay opciones específicas:
                    if (params.headless !== undefined) {
                        codeLine += `        // Nota: La configuración de headless se define en el lanzamiento del browser.\n`;
                    }
                    break;

                case 'open_url':
                case 'navigate':
                    codeLine += `        await page.goto('${params.url}');`;
                    break;

                case 'click':
                    codeLine += `        await page.click('${params.selector}');`;
                    break;

                case 'type_text':
                case 'type':
                    codeLine += `        await page.fill('${params.selector}', '${params.text}');`;
                    break;

                case 'wait_visible':
                    codeLine += `        await page.waitForSelector('${params.selector}', { state: 'visible' });`;
                    break;

                case 'wait_for_element':
                    codeLine += `        await page.waitForSelector('${params.selector}');`;
                    break;

                case 'take_screenshot': {
                    const path = params.path || `screenshot_${Date.now()}.png`;
                    codeLine += `        await page.screenshot({ path: '${path}', fullPage: ${params.fullPage || false} }); `;
                    break;
                }

                case 'wait_fixed':
                    codeLine += `        await page.waitForTimeout(${params.ms}); `;
                    break;

                case 'scroll':
                    if (params.selector) {
                        codeLine += `        await page.locator('${params.selector}').scrollIntoViewIfNeeded(); `;
                    } else {
                        codeLine += `        await page.mouse.wheel(0, ${params.amount || 500}); `;
                    }
                    break;

                case 'go_back':
                    codeLine += `        await page.goBack(); `;
                    break;

                case 'go_forward':
                    codeLine += `        await page.goForward(); `;
                    break;

                default:
                    codeLine += `        // Acción no soportada automáticamente: ${action}\n`;
                    codeLine += `        // Params: ${JSON.stringify(params)}`;
            }

            return codeLine;
        })
        .join('\n\n');

    return header + body + footer;
};
