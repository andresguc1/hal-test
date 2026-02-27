import { test, expect } from '@playwright/test';

test('Generated Flow', async ({ page }) => {
    let _stepStart = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
    await test.step('Paso 1: Launch Browser', async () => {
        _stepStart = Date.now();
        console.log('Lanzando navegador...');
        console.log('Navegador lanzado con ID: playwright-test-runner');
    });

    await test.step('Paso 2: Navigate to SauceDemo', async () => {
        _stepStart = Date.now();
        console.log('Abriendo URL...');
        await page.goto('https://www.saucedemo.com');
        console.log(`Navegado a https://www.saucedemo.com en ${Date.now() - _stepStart}ms`);
    });

    await test.step('Paso 3: Enter Username', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#user-name', 'standard_user');
        console.log(
            `Texto ingresado con éxito en el selector '#user-name'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 4: Enter Password', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#password', 'secret_sauce');
        console.log(
            `Texto ingresado con éxito en el selector '#password'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 5: Submit Login', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando click...');
        await page.click('#login-button');
        console.log(`Click exitoso en el selector '#login-button'. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 6: Reload Page', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando reload...');
        await page.reload();
        console.log(`Recargado con éxito. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 7: Wait List Loaded', async () => {
        _stepStart = Date.now();
        console.log('Esperando coincidencia de red: **/inventory.html*...');
        await page.waitForResponse(
            (resp) =>
                resp.url().includes('**/inventory.html*') &&
                (!'GET' || 'GET' === 'ALL' || resp.request().method() === 'GET') &&
                (!undefined || resp.status() === undefined),
        );
        console.log(
            `Coincidencia de red encontrada para **/inventory.html*. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 8: Evidence', async () => {
        _stepStart = Date.now();
        await page.screenshot({ path: 'screenshot_1772230985274.png', fullPage: false });
        console.log(`Captura de pantalla realizada con éxito. (${Date.now() - _stepStart}ms)`);
    });

    await test.step('Paso 9: Finish Tour', async () => {
        _stepStart = Date.now();
        console.log('Cerrando navegador...');
        // El test runner cierra el contexto automáticamente.
        console.log(`Navegador cerrado con éxito. (${Date.now() - _stepStart}ms)`);
    });
    console.log('✅ Flujo completado con éxito.');
});
