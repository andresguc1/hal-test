/**
 * Generador de código Playwright a partir de un flujo de acciones.
 * Soporta múltiples lenguajes: javascript, typescript, python, java, csharp.
 * @param {Array} flowSteps - Lista de pasos del flujo.
 * @param {string} language - Lenguaje de programación destino.
 * @returns {string} - Código fuente generado.
 */
export const generatePlaywrightCode = (flowSteps, language = 'javascript') => {
    if (!Array.isArray(flowSteps)) {
        throw new Error('El flujo debe ser una lista de pasos.');
    }

    const lang = language.toLowerCase();

    // 1. Definir los mapeos de acciones a código según el lenguaje
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

    const getLabel = (step, _index) => {
        const action = step.type || step.action;
        return step.data?.customLabel || step.data?.label || actionLabels[action] || action;
    };

    // 2. Generar el cuerpo según el lenguaje
    const generators = {
        javascript: (steps) => {
            const header = `import { test, expect } from '@playwright/test';

test('Generated Flow', async ({ page }) => {
    let _stepStart = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
`;

            const body = steps
                .map((step, index) => {
                    const action = step.type || step.action;
                    const params = step.data?.configuration || step.data || step;
                    const label = getLabel(step, index);

                    let lines = `    await test.step('Paso ${index + 1}: ${label}', async () => {\n`;
                    lines += `        _stepStart = Date.now();\n`;

                    switch (action) {
                        case 'open_url':
                        case 'navigate':
                            lines += `        await page.goto('${params.url}');\n`;
                            break;
                        case 'click':
                            lines += `        await page.click('${params.selector}');\n`;
                            break;
                        case 'type_text':
                        case 'type':
                            lines += `        await page.fill('${params.selector}', '${params.text}');\n`;
                            break;
                        case 'wait_visible':
                            lines += `        await page.waitForSelector('${params.selector}', { state: 'visible' });\n`;
                            break;
                        case 'take_screenshot':
                            lines += `        await page.screenshot({ path: 'screenshot_${index}.png' });\n`;
                            break;
                        case 'wait_fixed':
                            lines += `        await page.waitForTimeout(${params.ms});\n`;
                            break;
                        case 'press_key':
                            lines += `        await page.keyboard.press('${params.key}');\n`;
                            break;
                        default:
                            lines += `        // Acción no implementada: ${action}\n`;
                    }
                    lines += `    });`;
                    return lines;
                })
                .join('\n\n');

            return header + body + `\n    console.log('✅ Flujo completado con éxito.');\n});`;
        },

        typescript: (steps) => {
            const header = `import { test, expect, Page } from '@playwright/test';

test('Generated Flow (TS)', async ({ page }: { page: Page }) => {
    let _stepStart: number = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
`;

            const body = steps
                .map((step, index) => {
                    const action = step.type || step.action;
                    const params = step.data?.configuration || step.data || step;
                    const label = getLabel(step, index);

                    let lines = `    await test.step('Paso ${index + 1}: ${label}', async () => {\n`;
                    lines += `        _stepStart = Date.now();\n`;

                    switch (action) {
                        case 'open_url':
                        case 'navigate':
                            lines += `        await page.goto('${params.url}');\n`;
                            break;
                        case 'click':
                            lines += `        await page.click('${params.selector}');\n`;
                            break;
                        case 'type_text':
                        case 'type':
                            lines += `        await page.fill('${params.selector}', '${params.text}');\n`;
                            break;
                        default:
                            lines += `        // TODO: Implement ${action}\n`;
                    }
                    lines += `    });`;
                    return lines;
                })
                .join('\n\n');

            return header + body + `\n    console.log('✅ Flujo completado con éxito.');\n});`;
        },

        python: (steps) => {
            const header = `import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        print("🚀 Iniciando ejecución del flujo...")
`;

            const body = steps
                .map((step, index) => {
                    const action = step.type || step.action;
                    const params = step.data?.configuration || step.data || step;
                    const label = getLabel(step, index);

                    let lines = `        # Paso ${index + 1}: ${label}\n`;
                    switch (action) {
                        case 'open_url':
                        case 'navigate':
                            lines += `        await page.goto("${params.url}")\n`;
                            break;
                        case 'click':
                            lines += `        await page.click("${params.selector}")\n`;
                            break;
                        case 'type_text':
                        case 'type':
                            lines += `        await page.fill("${params.selector}", "${params.text}")\n`;
                            break;
                        default:
                            lines += `        # TODO: Implement ${action}\n`;
                    }
                    return lines;
                })
                .join('\n');

            const footer = `
        print("✅ Flujo completado con éxito.")
        await browser.close()

asyncio.run(run())`;
            return header + body + footer;
        },

        java: (steps) => {
            const header = `import com.microsoft.playwright.*;

public class GeneratedFlow {
    public static void main(String[] args) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch();
            Page page = browser.newPage();
            System.out.println("🚀 Iniciando ejecución del flujo...");
`;

            const body = steps
                .map((step, index) => {
                    const action = step.type || step.action;
                    const params = step.data?.configuration || step.data || step;
                    const label = getLabel(step, index);

                    let lines = `            // Paso ${index + 1}: ${label}\n`;
                    switch (action) {
                        case 'open_url':
                        case 'navigate':
                            lines += `            page.navigate("${params.url}");\n`;
                            break;
                        case 'click':
                            lines += `            page.click("${params.selector}");\n`;
                            break;
                        case 'type_text':
                        case 'type':
                            lines += `            page.fill("${params.selector}", "${params.text}");\n`;
                            break;
                        default:
                            lines += `            // TODO: Implement ${action}\n`;
                    }
                    return lines;
                })
                .join('\n');

            const footer = `
            System.out.println("✅ Flujo completado con éxito.");
            browser.close();
        }
    }
}`;
            return header + body + footer;
        },

        csharp: (steps) => {
            const header = `using Microsoft.Playwright;
using System.Threading.Tasks;

class Program
{
    public static async Task Main()
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();
        System.Console.WriteLine("🚀 Iniciando ejecución del flujo...");
`;

            const body = steps
                .map((step, index) => {
                    const action = step.type || step.action;
                    const params = step.data?.configuration || step.data || step;
                    const label = getLabel(step, index);

                    let lines = `        // Paso ${index + 1}: ${label}\n`;
                    switch (action) {
                        case 'open_url':
                        case 'navigate':
                            lines += `        await page.GotoAsync("${params.url}");\n`;
                            break;
                        case 'click':
                            lines += `        await page.ClickAsync("${params.selector}");\n`;
                            break;
                        case 'type_text':
                        case 'type':
                            lines += `        await page.FillAsync("${params.selector}", "${params.text}");\n`;
                            break;
                        default:
                            lines += `        // TODO: Implement ${action}\n`;
                    }
                    return lines;
                })
                .join('\n');

            const footer = `
        System.Console.WriteLine("✅ Flujo completado con éxito.");
    }
}`;
            return header + body + footer;
        },
    };

    const generator = generators[lang] || generators.javascript;
    return generator(flowSteps);
};
