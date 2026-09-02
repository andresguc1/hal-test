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

    // [node_id: node_f2dfd779-3054-42c6-b30a-556804a75834]
    await test.step(`Click`, async () => {
        await page.click(`getByRole('link', { name: 'Context Menu' })`);
    });

    // [node_id: node_16c64892-a3a4-4b6c-9363-9e508afdff89]
    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });
    console.log(`✅ Flujo completado con éxito.`);
});
