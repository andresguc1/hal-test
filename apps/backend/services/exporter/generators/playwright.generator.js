/**
 * Generador de código Playwright a partir de un flujo de acciones.
 * Soporta múltiples lenguajes: javascript, typescript, python, java, csharp.
 * @param {Array} flowSteps - Lista de pasos del flujo.
 * @param {string} language - Lenguaje de programación destino.
 * @returns {string} - Código fuente generado.
 */
export const generatePlaywrightCode = (flowSteps, language = 'javascript', locale = 'es') => {
    if (!Array.isArray(flowSteps)) {
        throw new Error('El flujo debe ser una lista de pasos.');
    }

    const lang = language.toLowerCase();
    const isEn = locale.startsWith('en');

    // 1. Mapeos de etiquetas localizados
    const actionLabels = {
        es: {
            launch_browser: 'Iniciar Navegador',
            close_browser: 'Finalizar Sesión',
            open_url: 'Navegar a URL',
            navigate: 'Navegar a URL',
            click: 'Hacer Click',
            type_text: 'Ingresar Texto',
            type: 'Ingresar Texto',
            press_key: 'Presionar Tecla',
            hover: 'Pasar Mouse (Hover)',
            scroll: 'Hacer Scroll',
            select_option: 'Seleccionar Opción',
            drag_drop: 'Arrastrar y Soltar',
            execute_js: 'Ejecutar JavaScript',
            wait_visible: 'Esperar Elemento Visible',
            wait_for_element: 'Esperar Elemento',
            wait_fixed: 'Pausa Fija',
            wait_network_match: 'Esperar Respuesta de Red',
            wait_network: 'Esperar Red (Idle)',
            take_screenshot: 'Captura de Pantalla',
            save_dom: 'Guardar DOM',
            log_errors: 'Registrar Errores',
            reload: 'Recargar Página',
            reload_page: 'Recargar Página',
            resize_viewport: 'Redimensionar Ventana',
            component: 'Componente Compuesto',
        },
        en: {
            launch_browser: 'Launch Browser',
            close_browser: 'Close Session',
            open_url: 'Navigate to URL',
            navigate: 'Navigate to URL',
            click: 'Click Element',
            type_text: 'Input Text',
            type: 'Input Text',
            press_key: 'Press Key',
            hover: 'Hover Mouse',
            scroll: 'Scroll Page',
            select_option: 'Select Option',
            drag_drop: 'Drag and Drop',
            execute_js: 'Execute JavaScript',
            wait_visible: 'Wait for Element Visible',
            wait_for_element: 'Wait for Element',
            wait_fixed: 'Fixed Pause',
            wait_network_match: 'Wait for Network Response',
            wait_network: 'Wait for Network (Idle)',
            take_screenshot: 'Take Screenshot',
            save_dom: 'Save DOM',
            log_errors: 'Log Errors',
            reload: 'Reload Page',
            reload_page: 'Reload Page',
            resize_viewport: 'Resize Viewport',
            component: 'Composite Component',
        },
    };

    const labels = actionLabels[isEn ? 'en' : 'es'];

    const i18n = {
        es: {
            start_js: '🚀 Iniciando ejecución del flujo en JavaScript...',
            start_ts: '🚀 Iniciando ejecución del flujo en TypeScript...',
            start_py: '🚀 Iniciando ejecución del flujo en Python (Playwright Async)...',
            start_java: '🚀 Iniciando ejecución del flujo en Java...',
            start_cs: '🚀 Iniciando ejecución del flujo en C#...',
            completed: '✅ Flujo completado con éxito.',
            browser_managed: '// Navegador ya iniciado por el runner de Playwright',
            browser_managed_cs:
                '// Playwright cierra automáticamente el contexto al finalizar el test',
            network_skipped: '// Espera de red saltada: no se proporcionó patrón de URL',
            dom_saved: 'DOM guardado (simulado). Longitud: ',
            page_error: 'Error en la página:',
            listening_errors: 'Escuchando errores de la página...',
            not_implemented: '⚠️ Acción no implementada o pendiente:',
            group: 'GRUPO',
            end_group: 'FIN GRUPO',
        },
        en: {
            start_js: '🚀 Starting flow execution in JavaScript...',
            start_ts: '🚀 Starting flow execution in TypeScript...',
            start_py: '🚀 Starting flow execution in Python (Playwright Async)...',
            start_java: '🚀 Starting flow execution in Java...',
            start_cs: '🚀 Starting flow execution in C#...',
            completed: '✅ Flow completed successfully.',
            browser_managed: '// Browser already launched by Playwright runner',
            browser_managed_cs: '// Playwright automatically closes the context after the test',
            network_skipped: '// Network wait skipped: no URL pattern provided',
            dom_saved: 'DOM saved (simulated). Length: ',
            page_error: 'Page error:',
            listening_errors: 'Listening for page errors...',
            not_implemented: '⚠️ Action not implemented or pending:',
            group: 'GROUP',
            end_group: 'END GROUP',
        },
    };

    const msg = i18n[isEn ? 'en' : 'es'];

    const getLabel = (step, index) => {
        const action = step.type || step.action;
        return (
            step.data?.customLabel || step.data?.label || labels[action] || `${action} ${index + 1}`
        );
    };

    /**
     * Helper to detect if any steps contain assertions.
     * @param {Array} steps - Steps of the flow.
     * @returns {boolean}
     */
    const hasAssertions = (steps) => {
        if (!Array.isArray(steps)) return false;
        return steps.some((step) => {
            const action = step.type || step.action;
            const data = step.data || {};
            if (action === 'assertion') return true;
            if (data.subNodes && hasAssertions(data.subNodes)) return true;
            return false;
        });
    };

    /**
     * Generador Recursivo de Pasos (Base)
     */
    const generateSteps = (steps, generatorFunc, depth = 0) => {
        if (!steps || !Array.isArray(steps)) return '';
        const ignoredTypes = [
            'guide',
            'note',
            'comment',
            'annotation',
            'label',
            'sticky',
            'sticky_note',
            'discussion',
        ];
        return steps
            .filter((step) => {
                const action = step.type || step.action;
                return !ignoredTypes.includes(action);
            })
            .map((step, index) => {
                const action = step.type || step.action;
                const data = step.data || {};
                const isComponent =
                    action === 'component' || (data.subNodes && data.subNodes.length > 0);

                if (isComponent && data.subNodes) {
                    return generatorFunc.component(step, data.subNodes, index, depth);
                }

                return generatorFunc.action(step, index, depth);
            })
            .filter(Boolean)
            .join('\n\n');
    };

    // 2. Generadores por Lenguaje
    const generators = {
        javascript: {
            header: (steps) => {
                const needsExpect = hasAssertions(steps);
                return `import { test${needsExpect ? ', expect' : ''} } from '@playwright/test';\n\ntest('Flujo Generado Hal-Test', async ({ page }) => {\n    console.log('${msg.start_js}');\n`;
            },
            action: (step, index, depth) => {
                const action = step.type || step.action;
                const params = step.data?.configuration || step.data || {};
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 1);

                let code = `${indent}await test.step('${label}', async () => {\n`;

                switch (action) {
                    case 'launch_browser':
                        code += `${indent}    ${msg.browser_managed}\n`;
                        break;
                    case 'open_url':
                    case 'navigate':
                        code += `${indent}    await page.goto('${params.url || ''}');\n`;
                        break;
                    case 'click':
                        code += `${indent}    await page.click('${params.selector || ''}');\n`;
                        break;
                    case 'type_text':
                    case 'type':
                        code += `${indent}    await page.fill('${params.selector || ''}', '${params.text || ''}');\n`;
                        break;
                    case 'press_key':
                        code += `${indent}    await page.keyboard.press('${params.key || ''}');\n`;
                        break;
                    case 'hover':
                        code += `${indent}    await page.hover('${params.selector || ''}');\n`;
                        break;
                    case 'scroll':
                        code += `${indent}    await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500});\n`;
                        break;
                    case 'select_option':
                        code += `${indent}    await page.selectOption('${params.selector || ''}', '${params.value || params.label || ''}');\n`;
                        break;
                    case 'execute_js':
                        code += `${indent}    await page.evaluate(() => {\n${indent}        ${params.script || '// Code'}\n${indent}    });\n`;
                        break;
                    case 'wait_visible':
                    case 'wait_for_element':
                        code += `${indent}    await page.waitForSelector('${params.selector || ''}', { state: 'visible', timeout: ${params.timeout || 30000} });\n`;
                        break;
                    case 'wait_fixed':
                        code += `${indent}    await page.waitForTimeout(${params.ms || params.timeout || 1000});\n`;
                        break;
                    case 'wait_navigation':
                        code += `${indent}    await page.waitForNavigation();\n`;
                        break;
                    case 'wait_network':
                        code += `${indent}    await page.waitForLoadState('networkidle');\n`;
                        break;
                    case 'wait_network_match':
                        if (params.urlMatch) {
                            code += `${indent}    await page.waitForResponse(response => response.url().includes('${params.urlMatch}'));\n`;
                        } else {
                            code += `${indent}    ${msg.network_skipped}\n`;
                        }
                        break;
                    case 'take_screenshot':
                        code += `${indent}    await page.screenshot({ path: 'screenshot_${index}.png' });\n`;
                        break;
                    case 'save_dom':
                        code += `${indent}    const htmlContent = await page.content();\n`;
                        code += `${indent}    console.log('${msg.dom_saved}' + htmlContent.length);\n`;
                        break;
                    case 'log_errors':
                        code += `${indent}    page.on('pageerror', error => console.error('${msg.page_error}', error));\n`;
                        break;
                    case 'reload':
                    case 'reload_page':
                        code += `${indent}    await page.reload();\n`;
                        break;
                    case 'go_back':
                        code += `${indent}    await page.goBack();\n`;
                        break;
                    case 'go_forward':
                        code += `${indent}    await page.goForward();\n`;
                        break;
                    case 'resize_viewport':
                        code += `${indent}    await page.setViewportSize({ width: ${params.width || 1280}, height: ${params.height || 720} });\n`;
                        break;
                    case 'close_browser':
                        code += `${indent}    ${msg.browser_managed_cs}\n`;
                        break;
                    default:
                        code += `${indent}    console.log('${msg.not_implemented} ${action}');\n`;
                }

                code += `${indent}});`;
                return code;
            },
            footer: () => {
                return `\n    console.log('${msg.completed}');\n});`;
            },
            full: (steps) => {
                const selectedGenerator = generators.javascript;
                let code = '';
                if (selectedGenerator.header) code += selectedGenerator.header(steps);
                code += generateSteps(steps, selectedGenerator);
                if (selectedGenerator.footer) code += selectedGenerator.footer();
                return code;
            },
        },

        typescript: {
            header: (steps) => {
                const needsExpect = hasAssertions(steps);
                return `import { test${needsExpect ? ', expect' : ''}, Page } from '@playwright/test';\n\ntest('Flujo Generado Hal-Test (TS)', async ({ page }: { page: Page }) => {\n    console.log('${msg.start_ts}');\n`;
            },
            action: (step, index, depth) => generators.javascript.action(step, index, depth),
            component: (step, subNodes, index, depth) => {
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 1);
                let code = `${indent}await test.step('📦 ${label}', async () => {\n`;
                code += generateSteps(subNodes, generators.typescript, depth + 1);
                code += `\n${indent}});`;
                return code;
            },
            footer: () => {
                return `\n    console.log('${msg.completed}');\n});`;
            },
            full: (steps) => {
                const selectedGenerator = generators.typescript;
                let code = '';
                if (selectedGenerator.header) code += selectedGenerator.header(steps);
                code += generateSteps(steps, selectedGenerator);
                if (selectedGenerator.footer) code += selectedGenerator.footer();
                return code;
            },
        },

        python: {
            header: () => {
                return `import asyncio\nfrom playwright.async_api import async_playwright\n\nasync def run():\n    async with async_playwright() as p:\n        browser = await p.chromium.launch(headless=False)\n        page = await browser.new_page()\n        print("${msg.start_py}")\n`;
            },
            action: (step, index, depth) => {
                const action = step.type || step.action;
                const params = step.data?.configuration || step.data || {};
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 2);
                let code = `${indent}# ${label}\n`;

                switch (action) {
                    case 'launch_browser':
                        code += `${indent}${msg.browser_managed}\n`;
                        break;
                    case 'open_url':
                    case 'navigate':
                        code += `${indent}await page.goto("${params.url || ''}")\n`;
                        break;
                    case 'click':
                        code += `${indent}await page.click("${params.selector || ''}")\n`;
                        break;
                    case 'type_text':
                    case 'type':
                        code += `${indent}await page.fill("${params.selector || ''}", "${params.text || ''}")\n`;
                        break;
                    case 'press_key':
                        code += `${indent}await page.keyboard.press("${params.key || ''}")\n`;
                        break;
                    case 'hover':
                        code += `${indent}await page.hover("${params.selector || ''}")\n`;
                        break;
                    case 'scroll':
                        code += `${indent}await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500})\n`;
                        break;
                    case 'select_option':
                        code += `${indent}await page.select_option("${params.selector || ''}", "${params.value || ''}")\n`;
                        break;
                    case 'execute_js':
                        code += `${indent}await page.evaluate("""${params.script || 'pass'}""")\n`;
                        break;
                    case 'wait_visible':
                    case 'wait_for_element':
                        code += `${indent}await page.wait_for_selector("${params.selector || ''}", state="visible", timeout=${params.timeout || 30000})\n`;
                        break;
                    case 'wait_fixed':
                        code += `${indent}await page.wait_for_timeout(${params.ms || params.timeout || 1000})\n`;
                        break;
                    case 'wait_navigation':
                        code += `${indent}await page.wait_for_navigation()\n`;
                        break;
                    case 'wait_network':
                        code += `${indent}await page.wait_for_load_state('networkidle')\n`;
                        break;
                    case 'wait_network_match':
                        if (params.urlMatch) {
                            code += `${indent}await page.wait_for_response(lambda response: "${params.urlMatch}" in response.url)\n`;
                        } else {
                            code += `${indent}${msg.network_skipped}\n`;
                        }
                        break;
                    case 'take_screenshot':
                        code += `${indent}await page.screenshot(path="screenshot_${index}.png")\n`;
                        break;
                    case 'save_dom':
                        code += `${indent}html_content = await page.content()\n`;
                        code += `${indent}print(f"${msg.dom_saved}{len(html_content)}")\n`;
                        break;
                    case 'log_errors':
                        code += `${indent}page.on("pageerror", lambda error: print(f"${msg.page_error} {error}"))\n`;
                        break;
                    case 'reload':
                    case 'reload_page':
                        code += `${indent}await page.reload()\n`;
                        break;
                    case 'go_back':
                        code += `${indent}await page.go_back()\n`;
                        break;
                    case 'go_forward':
                        code += `${indent}await page.go_forward()\n`;
                        break;
                    case 'resize_viewport':
                        code += `${indent}await page.set_viewport_size({"width": ${params.width || 1280}, "height": ${params.height || 720}})\n`;
                        break;
                    case 'close_browser':
                        code += `${indent}await browser.close()\n`;
                        break;
                    default:
                        code += `${indent}print(f"${msg.not_implemented} {action}")\n`;
                }
                return code;
            },
            component: (step, subNodes, index, depth) => {
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 2);
                let code = `${indent}# [${msg.group}]: ${label}\n`;
                code += generateSteps(subNodes, generators.python, depth + 1);
                code += `\n${indent}# [${msg.end_group}]: ${label}`;
                return code;
            },
            footer: () => {
                return `\n        print("${msg.completed}")\n        await browser.close()\n\nasyncio.run(run())`;
            },
            full: (steps) => {
                const selectedGenerator = generators.python;
                let code = '';
                if (selectedGenerator.header) code += selectedGenerator.header(steps);
                code += generateSteps(steps, selectedGenerator);
                if (selectedGenerator.footer) code += selectedGenerator.footer();
                return code;
            },
        },

        java: {
            header: () => {
                return `import com.microsoft.playwright.*;\nimport com.microsoft.playwright.options.*;\nimport java.nio.file.Paths;\n\npublic class GeneratedFlow {\n    public static void main(String[] args) {\n        try (Playwright playwright = Playwright.create()) {\n            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));\n            Page page = browser.newPage();\n            System.out.println("${msg.start_java}");\n`;
            },
            action: (step, index, depth) => {
                const action = step.type || step.action;
                const params = step.data?.configuration || step.data || {};
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 3);
                let code = `${indent}// ${label}\n`;

                switch (action) {
                    case 'launch_browser':
                        code += `${indent}${msg.browser_managed}\n`;
                        break;
                    case 'open_url':
                    case 'navigate':
                        code += `${indent}page.navigate("${params.url || ''}");\n`;
                        break;
                    case 'click':
                        code += `${indent}page.click("${params.selector || ''}");\n`;
                        break;
                    case 'type_text':
                    case 'type':
                        code += `${indent}page.fill("${params.selector || ''}", "${params.text || ''}");\n`;
                        break;
                    case 'press_key':
                        code += `${indent}page.keyboard().press("${params.key || ''}");\n`;
                        break;
                    case 'hover':
                        code += `${indent}page.hover("${params.selector || ''}");\n`;
                        break;
                    case 'scroll':
                        code += `${indent}page.mouse().wheel(${params.deltaX || 0}, ${params.deltaY || 500});\n`;
                        break;
                    case 'select_option':
                        code += `${indent}page.selectOption("${params.selector || ''}", "${params.value || params.label || ''}");\n`;
                        break;
                    case 'execute_js':
                        code += `${indent}page.evaluate("${(params.script || '// Code').replace(/"/g, '\\"')}");\n`;
                        break;
                    case 'wait_visible':
                    case 'wait_for_element':
                        code += `${indent}page.waitForSelector("${params.selector || ''}", new Page.WaitForSelectorOptions().setState(WaitForSelectorState.VISIBLE).setTimeout(${params.timeout || 30000}));\n`;
                        break;
                    case 'wait_fixed':
                        code += `${indent}page.waitForTimeout(${params.ms || params.timeout || 1000});\n`;
                        break;
                    case 'wait_navigation':
                        code += `${indent}page.waitForNavigation();\n`;
                        break;
                    case 'wait_network':
                        code += `${indent}page.waitForLoadState(LoadState.NETWORKIDLE);\n`;
                        break;
                    case 'wait_network_match':
                        if (params.urlMatch) {
                            code += `${indent}page.waitForResponse(response -> response.url().contains("${params.urlMatch}"));\n`;
                        } else {
                            code += `${indent}${msg.network_skipped}\n`;
                        }
                        break;
                    case 'take_screenshot':
                        code += `${indent}page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get("screenshot_${index}.png")));\n`;
                        break;
                    case 'save_dom':
                        code += `${indent}String htmlContent = page.content();\n`;
                        code += `${indent}System.out.println("${msg.dom_saved}" + htmlContent.length());\n`;
                        break;
                    case 'log_errors':
                        code += `${indent}page.onPageError(error -> System.err.println("${msg.page_error} " + error));\n`;
                        break;
                    case 'reload':
                    case 'reload_page':
                        code += `${indent}page.reload();\n`;
                        break;
                    case 'go_back':
                        code += `${indent}page.goBack();\n`;
                        break;
                    case 'go_forward':
                        code += `${indent}page.goForward();\n`;
                        break;
                    case 'resize_viewport':
                        code += `${indent}page.setViewportSize(${params.width || 1280}, ${params.height || 720});\n`;
                        break;
                    case 'close_browser':
                        code += `${indent}page.close();\n`;
                        break;
                    default:
                        code += `${indent}System.out.println("${msg.not_implemented} ${action}");\n`;
                }
                return code;
            },
            component: (step, subNodes, index, depth) => {
                const label = getLabel(step, index);
                let code = `            // [${msg.group}]: ${label}\n`;
                code += generateSteps(subNodes, generators.java, depth);
                code += `\n            // [${msg.end_group}]: ${label}`;
                return code;
            },
            footer: () => {
                return `\n            System.out.println("${msg.completed}");\n            browser.close();\n        }\n    }\n}`;
            },
            full: (steps) => {
                const selectedGenerator = generators.java;
                let code = '';
                if (selectedGenerator.header) code += selectedGenerator.header(steps);
                code += generateSteps(steps, selectedGenerator);
                if (selectedGenerator.footer) code += selectedGenerator.footer();
                return code;
            },
        },

        csharp: {
            header: () => {
                return `using Microsoft.Playwright;\nusing System.Threading.Tasks;\n\nclass Program\n{\n    public static async Task Main()\n    {\n        using var playwright = await Playwright.CreateAsync();\n        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = false });\n        var page = await browser.NewPageAsync();\n        System.Console.WriteLine("${msg.start_cs}");\n`;
            },
            action: (step, index, depth) => {
                const action = step.type || step.action;
                const params = step.data?.configuration || step.data || {};
                const label = getLabel(step, index);
                const indent = '    '.repeat(depth + 2);
                let code = `${indent}// ${label}\n`;

                switch (action) {
                    case 'launch_browser':
                        code += `${indent}${msg.browser_managed}\n`;
                        break;
                    case 'open_url':
                    case 'navigate':
                        code += `${indent}await page.GotoAsync("${params.url || ''}");\n`;
                        break;
                    case 'click':
                        code += `${indent}await page.ClickAsync("${params.selector || ''}");\n`;
                        break;
                    case 'type_text':
                    case 'type':
                        code += `${indent}await page.FillAsync("${params.selector || ''}", "${params.text || ''}");\n`;
                        break;
                    case 'press_key':
                        code += `${indent}await page.Keyboard.PressAsync("${params.key || ''}");\n`;
                        break;
                    case 'hover':
                        code += `${indent}await page.HoverAsync("${params.selector || ''}");\n`;
                        break;
                    case 'scroll':
                        code += `${indent}await page.Mouse.WheelAsync(${params.deltaX || 0}, ${params.deltaY || 500});\n`;
                        break;
                    case 'select_option':
                        code += `${indent}await page.SelectOptionAsync("${params.selector || ''}", "${params.value || params.label || ''}");\n`;
                        break;
                    case 'execute_js':
                        code += `${indent}await page.EvaluateAsync("${(params.script || '// Code').replace(/"/g, '\\"')}");\n`;
                        break;
                    case 'wait_visible':
                    case 'wait_for_element':
                        code += `${indent}await page.WaitForSelectorAsync("${params.selector || ''}", new() { State = WaitForSelectorState.Visible, Timeout = ${params.timeout || 30000} });\n`;
                        break;
                    case 'wait_fixed':
                        code += `${indent}await Task.Delay(${params.ms || params.timeout || 1000});\n`;
                        break;
                    case 'wait_navigation':
                        code += `${indent}await page.WaitForNavigationAsync();\n`;
                        break;
                    case 'wait_network':
                        code += `${indent}await page.WaitForLoadStateAsync(LoadState.NetworkIdle);\n`;
                        break;
                    case 'wait_network_match':
                        if (params.urlMatch) {
                            code += `${indent}await page.WaitForResponseAsync(response => response.Url.Contains("${params.urlMatch}"));\n`;
                        } else {
                            code += `${indent}${msg.network_skipped}\n`;
                        }
                        break;
                    case 'take_screenshot':
                        code += `${indent}await page.ScreenshotAsync(new() { Path = "screenshot_${index}.png" });\n`;
                        break;
                    case 'save_dom':
                        code += `${indent}string htmlContent = await page.ContentAsync();\n`;
                        code += `${indent}System.Console.WriteLine($"${msg.dom_saved}{htmlContent.Length}");\n`;
                        break;
                    case 'log_errors':
                        code += `${indent}page.PageError += (_, error) => System.Console.Error.WriteLine($"${msg.page_error} {error}");\n`;
                        break;
                    case 'reload':
                    case 'reload_page':
                        code += `${indent}await page.ReloadAsync();\n`;
                        break;
                    case 'go_back':
                        code += `${indent}await page.GoBackAsync();\n`;
                        break;
                    case 'go_forward':
                        code += `${indent}await page.GoForwardAsync();\n`;
                        break;
                    case 'resize_viewport':
                        code += `${indent}await page.SetViewportSizeAsync(${params.width || 1280}, ${params.height || 720});\n`;
                        break;
                    case 'close_browser':
                        code += `${indent}await page.CloseAsync();\n`;
                        break;
                    default:
                        code += `${indent}System.Console.WriteLine("${msg.not_implemented} ${action}");\n`;
                }
                return code;
            },
            component: (step, subNodes, index, depth) => {
                const label = getLabel(step, index);
                let code = `        // [${msg.group}]: ${label}\n`;
                code += generateSteps(subNodes, generators.csharp, depth);
                code += `\n        // [${msg.end_group}]: ${label}`;
                return code;
            },
            footer: () => {
                return `\n        System.Console.WriteLine("${msg.completed}");\n        await browser.CloseAsync();\n    }\n}`;
            },
            full: (steps) => {
                const selectedGenerator = generators.csharp;
                let code = '';
                if (selectedGenerator.header) code += selectedGenerator.header(steps);
                code += generateSteps(steps, selectedGenerator);
                if (selectedGenerator.footer) code += selectedGenerator.footer();
                return code;
            },
        },
    };

    const selectedGenerator = generators[lang] || generators.javascript;
    return selectedGenerator.full(flowSteps);
};
