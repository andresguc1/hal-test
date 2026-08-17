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

    // [node_id: node_a740b728-15dd-4694-b67f-4b594f0d3d21]
    await test.step(`Click Register Button`, async () => {
        await page.click(`div#loginPanel > p:nth-of-type(2) > a`);
    });

    // [node_id: node_54819ade-7f05-4fb8-a6f3-9d16c8aba711]
    await test.step(`Fill Register Form`, async () => {
        console.log(`⚠️ Acción no implementada o pendiente: fill_form`);
    });

    // [node_id: node_712cf7de-42f3-4aa9-ab24-655376e715ef]
    await test.step(`Click Register`, async () => {
        await page.click(`form#customerForm > table > tbody > tr:nth-of-type(13) > td:nth-of-type(2) > input`);
    });

    // [node_id: node_9e657501-cb5b-49d8-a9de-16630c7facb3]
    await test.step(`Assert Page Contains Text`, async () => {
        await expect(page.locator('body')).toContainText(`Welcome`, { ignoreCase: true, timeout: 0 });
    });
    console.log(`✅ Flujo completado con éxito.`);
});