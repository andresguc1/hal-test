import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: node_f1307abd-7296-4631-8741-a0d037e98783]
    await test.step(`launch_browser`, async () => {
        // Browser managed by runner
    });

    // [node_id: node_ebbf0916-c5b6-4d35-9038-b7afb817720d]
    await test.step(`Open URL`, async () => {
        await page.goto(`https://parabank.parasoft.com/parabank/index.htm`);
    });

    // [node_id: node_824c89b1-1e03-4e64-a3d8-ddf945ed011a]
    await test.step(`Click`, async () => {
        await page.click(`div#loginPanel > p:nth-of-type(2) > a`);
    });

    // [node_id: node_36acd94c-3b49-46b6-b3c7-b12bb1a01fcb]
    await test.step(`Fill Form`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: fill_form`);
    });

    // [node_id: node_14a1e902-7677-4599-bca1-1a5330347226]
    await test.step(`Assert Page Contains Text`, async () => {
        await expect(page.locator('body')).toContainText(
            `Your account was created successfully. You are now logged in.`,
            { ignoreCase: true },
        );
    });

    // [node_id: node_34e10ca1-77c0-46a7-9577-483da0e6e5c2]
    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });
    console.log(`✅ Flujo completado con éxito.`);
});
