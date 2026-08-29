import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: node_42e38c40-46a7-4980-8c55-b21c90fc4f58]
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    // [node_id: node_2f0b14ee-f054-4f01-8aad-3776811c04b7]
    await test.step(`Open URL`, async () => {
        await page.goto(`https://the-internet.herokuapp.com/`);
    });

    // [node_id: node_41a3e3d9-4d16-4dc2-96ec-6f8ba7e11170]
    await test.step(`Assert Page Contains Text`, async () => {
        await expect(page.locator('body')).toContainText(`Welcome to the-internet`, {
            ignoreCase: true,
            timeout: 0,
        });
    });

    // [node_id: node_5cb1029e-3211-4a6c-b30e-c1b5b31250e8]
    await test.step(`Click Challenging DOM Link`, async () => {
        await page.click(`getByRole('link', { name: 'Challenging DOM' })`);
    });

    // [node_id: node_6c494301-8580-4206-b6f3-947891c280bc]
    await test.step(`Find Element`, async () => {
        const elementCount = await page.locator(`#canvas`).count();
        console.log(`Found ${elementCount} element(s) matching: #canvas`);
    });

    // [node_id: node_16c64892-a3a4-4b6c-9363-9e508afdff89]
    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });

    // [node_id: node_03347693-5891-4937-81f5-0b4806f9b536]
    await test.step(`Go Back`, async () => {
        await page.goBack();
    });
    console.log(`✅ Flujo completado con éxito.`);
});
