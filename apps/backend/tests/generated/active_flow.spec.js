import { test } from '@playwright/test';

test('Flujo Generado Hal-Test', async ({ page }) => {
    console.log('🚀 Iniciando ejecución del flujo en javascript...');
    await test.step('launch_browser', async () => {
        // Browser managed by runner
    });

    await test.step('open_url', async () => {
        await page.goto('https://www.ebay.com');
    });

    await test.step('type_text', async () => {
        await page.fill('#query', 'Metallica');
    });

    await test.step('click', async () => {
        await page.click('#btn_adv_search');
    });

    await test.step('wait_visible', async () => {
        await page.waitForSelector('#search_results', { state: 'visible', timeout: 10000 });
    });

    await test.step('take_screenshot', async () => {
        await page.screenshot({ path: 'screenshot_5.png' });
    });

    await test.step('close_browser', async () => {
        // Browser managed by runner
    });
    console.log('✅ Flujo completado con éxito.');
});
