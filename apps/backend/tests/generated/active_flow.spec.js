import { test, expect } from '@playwright/test';

test('Generated Flow', async ({ page }) => {
    let _stepStart = Date.now();
    console.log('🚀 Iniciando ejecución del flujo...');
    await test.step('Paso 1: Enter Username', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#user-name', 'standard_user');
        console.log(
            `Texto ingresado con éxito en el selector '#user-name'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 2: Enter Password', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando type_text...');
        await page.fill('#password', 'secret_sauce');
        console.log(
            `Texto ingresado con éxito en el selector '#password'. (${Date.now() - _stepStart}ms)`,
        );
    });

    await test.step('Paso 3: Submit Login', async () => {
        _stepStart = Date.now();
        console.log('Ejecutando click...');
        await page.click('#login-button');
        console.log(`Click exitoso en el selector '#login-button'. (${Date.now() - _stepStart}ms)`);
    });
    console.log('✅ Flujo completado con éxito.');
});
