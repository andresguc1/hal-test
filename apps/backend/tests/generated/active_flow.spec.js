import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: node_f02f9efb-6ef7-4fc5-996c-aeefcd5cbd6e]
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    // [node_id: node_7b69cdb6-f262-468d-b2b5-5ae8185ebce0]
    await test.step(`parabank.parasoft.com`, async () => {
        await page.goto(`https://parabank.parasoft.com/parabank/index.htm`);
    });

    // [node_id: node_185e319c-a0f5-4d3f-8f0d-ef5fce063b99]
    await test.step(`Fill Form`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: fill_form`);
    });

    // [node_id: node_df086283-cdad-476f-9c3a-d86ab0b8797e]
    await test.step(`Click Log In`, async () => {
        await page.click(`div#loginPanel > form > div:nth-of-type(3) > input`);
    });

    // [node_id: node_55e32d2b-b660-4ff3-b364-6077a7b2bc49]
    await test.step(`Success Login`, async () => {
        await expect(page.locator('body')).toContainText(`Accounts Overview`, {
            ignoreCase: true,
            timeout: 0,
        });
    });

    // [node_id: node_48dc80a6-ebf1-4ff8-a24a-123ec0765274]
    await test.step(`Click Open Account`, async () => {
        await page.click(`//a[contains(text(), Open New Account)]`);
    });

    // [node_id: node_369d2471-f345-4db3-a059-f99b320f3b48]
    await test.step(`Click New Account`, async () => {
        await page.click(`div#openAccountForm > form > div > input`);
    });
    console.log(`✅ Flujo completado con éxito.`);
});
