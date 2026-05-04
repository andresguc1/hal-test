import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
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
            timeout: 30000,
        });
    });
    console.log(`✅ Flujo completado con éxito.`);
});
