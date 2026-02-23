/**
 * Generador de código Playwright a partir de un flujo de acciones.
 * @param {Array} flowSteps - Lista de pasos del flujo.
 * @returns {string} - Código fuente generado.
 */
export const generatePlaywrightCode = (flowSteps) => {
    if (!Array.isArray(flowSteps)) {
        throw new Error('El flujo debe ser una lista de pasos.');
    }

    const header = `import { test, expect } from '@playwright/test';

test('Generated Flow', async ({ page }) => {
    let _stepStart = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
`;

    const footer = `
    console.log('✅ Flujo completado con éxito.');
});
`;

    const body = flowSteps
        .map((step, index) => {
            const action = step.type || step.action;
            const params = step.data?.configuration || step.data || step;

            const actionLabels = {
                launch_browser: 'Lanzar Navegador',
                close_browser: 'Cerrar Navegador',
                open_url: 'Abrir URL',
                navigate: 'Navegar',
                click: 'Click',
                type_text: 'Escribir',
                type: 'Escribir',
                wait_visible: 'Esperar Visibilidad',
                wait_for_element: 'Esperar Elemento',
                take_screenshot: 'Captura de Pantalla',
                wait_fixed: 'Esperar',
                scroll: 'Scroll',
                go_back: 'Atrás',
                go_forward: 'Adelante',
                reload: 'Recargar',
                reload_page: 'Recargar Página',
                press_key: 'Presionar Tecla',
                wait_network_match: 'Esperar Coincidencia de Red',
            };

            const label =
                step.data?.customLabel || step.data?.label || actionLabels[action] || action;
            let codeLine = `    await test.step('Paso ${index + 1}: ${label}', async () => {\n`;
            codeLine += `        _stepStart = Date.now();\n`;

            switch (action) {
                case 'launch_browser':
                    codeLine += `        console.log('Lanzando navegador...');\n`;
                    codeLine += `        console.log('Navegador lanzado con ID: playwright-test-runner');\n`;
                    break;

                case 'close_browser':
                    codeLine += `        console.log('Cerrando navegador...');\n`;
                    codeLine += `        // El test runner cierra el contexto automáticamente.\n`;
                    codeLine += `        console.log(\`Navegador cerrado con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'open_url':
                case 'navigate':
                    codeLine += `        console.log('Abriendo URL...');\n`;
                    codeLine += `        await page.goto('${params.url}');\n`;
                    codeLine += `        console.log(\`Navegado a ${params.url} en \${Date.now() - _stepStart}ms\`);\n`;
                    break;

                case 'click':
                    codeLine += `        console.log('Ejecutando click...');\n`;
                    codeLine += `        await page.click('${params.selector}');\n`;
                    codeLine += `        console.log(\`Click exitoso en el selector '${params.selector}'. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'type_text':
                case 'type':
                    codeLine += `        console.log('Ejecutando type_text...');\n`;
                    codeLine += `        await page.fill('${params.selector}', '${params.text}');\n`;
                    codeLine += `        console.log(\`Texto ingresado con éxito en el selector '${params.selector}'. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'wait_visible':
                    codeLine += `        console.log('Ejecutando wait_visible...');\n`;
                    codeLine += `        await page.waitForSelector('${params.selector}', { state: 'visible' });\n`;
                    codeLine += `        console.log(\`El elemento '${params.selector}' ahora es visible. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'wait_for_element':
                    codeLine += `        console.log('Ejecutando wait_for_element...');\n`;
                    codeLine += `        await page.waitForSelector('${params.selector}');\n`;
                    codeLine += `        console.log(\`Elemento '${params.selector}' encontrado. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'take_screenshot': {
                    const path = params.path || `screenshot_${Date.now()}.png`;
                    codeLine += `        await page.screenshot({ path: '${path}', fullPage: ${params.fullPage || false} });\n`;
                    codeLine += `        console.log(\`Captura de pantalla realizada con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;
                }

                case 'wait_fixed':
                    codeLine += `        console.log('Ejecutando wait_fixed...');\n`;
                    codeLine += `        await page.waitForTimeout(${params.ms});\n`;
                    codeLine += `        console.log(\`Esperado durante ${params.ms}ms. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'scroll':
                    codeLine += `        console.log('Ejecutando scroll...');\n`;
                    if (params.selector) {
                        codeLine += `        await page.locator('${params.selector}').scrollIntoViewIfNeeded();\n`;
                    } else {
                        codeLine += `        await page.mouse.wheel(0, ${params.amount || 500});\n`;
                    }
                    break;

                case 'go_back':
                    codeLine += `        console.log('Ejecutando go_back...');\n`;
                    codeLine += `        await page.goBack();\n`;
                    codeLine += `        console.log(\`Retrocedido con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'go_forward':
                    codeLine += `        console.log('Ejecutando go_forward...');\n`;
                    codeLine += `        await page.goForward();\n`;
                    codeLine += `        console.log(\`Avanzado con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'reload':
                case 'reload_page':
                    codeLine += `        console.log('Ejecutando reload...');\n`;
                    codeLine += `        await page.reload();\n`;
                    codeLine += `        console.log(\`Recargado con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                case 'wait_network_match': {
                    const { type = 'response', urlPattern, method, statusCode } = params;
                    codeLine += `        console.log('Esperando coincidencia de red: ${urlPattern}...');\n`;
                    if (type === 'request') {
                        codeLine += `        await page.waitForRequest(req => req.url().includes('${urlPattern}') && (!'${method}' || '${method}' === 'ALL' || req.method() === '${method}'));\n`;
                    } else {
                        codeLine += `        await page.waitForResponse(resp => resp.url().includes('${urlPattern}') && (!'${method}' || '${method}' === 'ALL' || resp.request().method() === '${method}') && (!${statusCode} || resp.status() === ${statusCode}));\n`;
                    }
                    codeLine += `        console.log(\`Coincidencia de red encontrada para ${urlPattern}. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;
                }

                case 'press_key':
                    codeLine += `        console.log('Ejecutando press_key...');\n`;
                    codeLine += `        await page.keyboard.press('${params.key}');\n`;
                    codeLine += `        console.log(\`Tecla '${params.key}' presionada con éxito. (\${Date.now() - _stepStart}ms)\`);\n`;
                    break;

                default:
                    codeLine += `        // Acción no soportada automáticamente: ${action}\n`;
                    codeLine += `        console.warn('Acción desconocida:', ${JSON.stringify(params)});\n`;
            }

            codeLine += `    });`;
            return codeLine;
        })
        .join('\n\n');

    return header + body + footer;
};
