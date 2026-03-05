import { test } from '@playwright/test';

test('Flujo Generado Hal-Test', async ({ page }) => {
    console.log('🚀 Iniciando ejecución del flujo en JavaScript...');
    await test.step('Launch Browser', async () => {
        // Navegador ya iniciado por el runner de Playwright
    });

    await test.step('Navigate to SauceDemo', async () => {
        await page.goto('https://www.saucedemo.com');
    });

    await test.step('Enter Username', async () => {
        await page.fill('#user-name', 'standard_user');
    });

    await test.step('Enter Password', async () => {
        await page.fill('#password', 'secret_sauce');
    });

    await test.step('Submit Login', async () => {
        await page.click('#login-button');
    });

    await test.step('Reload Page', async () => {
        await page.reload();
    });

    await test.step('Wait List Loaded', async () => {
        // Espera de red saltada: no se proporcionó patrón de URL
    });

    await test.step('Evidence', async () => {
        await page.screenshot({ path: 'screenshot_7.png' });
    });

    await test.step('Finish Tour', async () => {
        // Playwright cierra automáticamente el contexto al finalizar el test
    });
});
