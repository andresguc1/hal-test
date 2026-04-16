import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    await test.step(`Navigate to SauceDemo`, async () => {
        await page.goto(`https://www.saucedemo.com`);
    });

    await test.step(`Global: test_password`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: variable`);
    });

    await test.step(`Global: test_user`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: variable`);
    });

    await test.step(`Enter Username`, async () => {
        await page.fill(`#user-name`, `{{test_user}}`);
    });

    await test.step(`Enter Password`, async () => {
        await page.fill(`#password`, `{{test_password}}`);
    });

    await test.step(`Submit Login`, async () => {
        await page.click(`#login-button`);
    });

    await test.step(`Wait Element (Adv)`, async () => {
        await page.waitForSelector('[data-test="secondary-header"]', {
            state: 'attached',
            timeout: 8000,
        });
    });

    await test.step(`conditional`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: conditional`);
    });

    await test.step(`Log Errors`, async () => {
        page.on('pageerror', (error) => console.error('Page error:', error));
    });

    await test.step(`Reload Page`, async () => {
        await page.reload();
    });

    await test.step(`Evidence`, async () => {
        await page.screenshot({ path: 'screenshot_11.png' });
    });
    console.log(`✅ Flujo completado con éxito.`);
});
