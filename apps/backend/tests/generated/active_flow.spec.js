import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: node_a699db51-1bb0-4b20-b761-3b2a964cb47a]
    await test.step(`Click A/B Test Link`, async () => {
        await page.click(`getByRole('link', { name: 'A/B Testing' })`);
    });

    // [node_id: node_97bd9ac2-2651-4043-ba0b-0924843c4691]
    await test.step(`Assert Page Contains Text`, async () => {
        await expect(page.locator('body')).toContainText(`A/B Test`, {
            ignoreCase: true,
            timeout: 0,
        });
    });

    // [node_id: node_78c04aa1-6df9-4340-83c5-0c73c01ed975]
    await test.step(`Go Back`, async () => {
        await page.goBack();
    });
    console.log(`✅ Flujo completado con éxito.`);
});
