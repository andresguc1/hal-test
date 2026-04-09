import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    await test.step(`Navigate to SauceDemo`, async () => {
        await page.goto(`https://www.saucedemo.com`);
    });

    await test.step(`Set Password`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: variable`);
    });

    await test.step(`Set Username`, async () => {
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

    await test.step(`Take Screenshot`, async () => {
        await page.screenshot({ path: 'screenshot_7.png' });
    });

    await test.step(`loop`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: loop`);
    });

    await test.step(`Take Screenshot`, async () => {
        await page.screenshot({ path: 'screenshot_9.png' });
    });

    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });
    console.log(`✅ Flujo completado con éxito.`);
});
