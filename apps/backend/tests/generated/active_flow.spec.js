import { test } from '@playwright/test';

test('Flujo Generado Hal-Test', async ({ page }) => {
    console.log('🚀 Iniciando ejecución del flujo en javascript...');
    await test.step('Enter Username', async () => {
        await page.fill('#user-name-bad', '{{test_user}}');
    });

    await test.step('Enter Password', async () => {
        await page.fill('#password', '{{test_password}}');
    });

    await test.step('Submit Login', async () => {
        await page.click('#login-button');
    });
    console.log('✅ Flujo completado con éxito.');
});
