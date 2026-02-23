import { test, expect } from '@playwright/test';

test('Generated Flow', async ({ page }) => {
    let _stepStart = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
    await test.step('Paso 1: Launch Browser', async () => {
        _stepStart = Date.now();
        console.log('Lanzando navegador...');
        console.log('Navegador lanzado con ID: playwright-test-runner');
    });

    await test.step('Paso 2: Open Google', async () => {
        _stepStart = Date.now();
        console.log('Abriendo URL...');
        await page.goto('https://www.saucedemo.com');
        console.log(`Navegado a https://www.saucedemo.com en ${Date.now() - _stepStart}ms`);
    });

    await test.step('Paso 3: Search HaltTest', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#user-name', 'standard_user');
        console.log(
            `Texto ingresado con éxito en el selector '#user-name'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 4: Click', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando click...');
        await page.click('#login-button');
        console.log(`Click exitoso en el selector '#login-button'. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 5: Type Text', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#password', 'secret_sauce');
        console.log(
            `Texto ingresado con éxito en el selector '#password'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 6: reload page', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando reload...');
        await page.reload();
        console.log(`Recargado con éxito. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 7: wait_network_match', async () => {
        _stepStart = Date.now();
        console.log('Esperando coincidencia de red: /inventory.html...');
        await page.waitForResponse(
            (resp) =>
                resp.url().includes('/inventory.html') &&
                (!'GET' || 'GET' === 'ALL' || resp.request().method() === 'GET') &&
                (!200 || resp.status() === 200),
        );
        console.log(
            `Coincidencia de red encontrada para /inventory.html. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 8: Wait Element (Adv)', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando wait_for_element...');
        await page.waitForSelector('div#header_container > div > div:nth-of-type(2) > div');
        console.log(
            `Elemento 'div#header_container > div > div:nth-of-type(2) > div' encontrado. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 9: Take Screenshot', async () => {
        _stepStart = Date.now();
        await page.screenshot({ path: 'screenshot_1771807627115.png', fullPage: false });
        console.log(`Captura de pantalla realizada con éxito. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 10: Close Browser', async () => {
        _stepStart = Date.now();
        console.log('Cerrando navegador...');
        // El test runner cierra el contexto automáticamente.
        console.log(`Navegador cerrado con éxito. (${Date.now() - _stepStart}ms)`);
    });
    console.log('✅ Flujo completado con éxito.');
});
