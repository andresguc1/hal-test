import { test, expect } from '@playwright/test';

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
        await expect(page.locator('body')).toContainText(`Welcome to the-internet`, { ignoreCase: true, timeout: 0 });
    });

    // [node_id: node_3b2bb292-9782-499e-9b63-5f70571e9af4]
    await test.step(`Click`, async () => {
        await page.click(`getByRole('link', { name: 'Exit Intent' })`);
    });

    // [node_id: node_6b664ba8-b1b5-4cdf-829b-6e4c3f5ec082]
    await test.step(`Assert Page Contains Text`, async () => {
        await expect(page.locator('body')).toContainText(`Exit Intent`, { ignoreCase: true });
    });

    // [node_id: node_06d6b604-b8d4-492a-8f5a-33cb50cabbfc]
    await test.step(`mouse_move`, async () => {
        const vp = page.viewportSize();
        await page.mouse.move(Math.round(vp.width / 2), Math.round(vp.height / 2), { steps: 12 });
    });

    // [node_id: node_47e26b4c-f6be-44b3-86f6-01b599d31e83]
    await test.step(`Assert`, async () => {
        await expect(page.locator(`div#ouibounce-modal > div:nth-of-type(2)`)).toBeAttached();
    await expect(page.locator(`div#ouibounce-modal > div:nth-of-type(2)`)).toBeVisible();
    await expect(page.locator(`div#ouibounce-modal > div:nth-of-type(2)`)).toContainText(`THIS IS A MODAL WINDOW`, { ignoreCase: true, useInnerText: true });
    });

    // [node_id: node_d9fc16a4-c9aa-4c89-9a9f-f07a7856aefd]
    await test.step(`Go Back`, async () => {
        await page.goBack();
    });
    console.log(`✅ Flujo completado con éxito.`);
});