import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: sub_type_user]
    await test.step(`Enter Username`, async () => {
        await page.fill(`#user-name`, `{{user_role}}`);
    });

    // [node_id: sub_type_pass]
    await test.step(`Enter Password`, async () => {
        await page.fill(`#password`, `secret_sauce`);
    });

    // [node_id: sub_click]
    await test.step(`Click Login`, async () => {
        await page.click(`#login-button`);
    });
    console.log(`✅ Flujo completado con éxito.`);
});