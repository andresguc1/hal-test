import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    await test.step(`Open Url`, async () => {
        await page.goto(`https://katalon-demo-cura.herokuapp.com/`);
    });

    await test.step(`Click`, async () => {
        await page.click(`#btn-make-appointment`);
    });

    await test.step(`Type Text`, async () => {
        await page.fill(`#txt-username`, `John Doe`);
    });

    await test.step(`Type Text`, async () => {
        await page.fill(`#txt-password`, `ThisIsNotAPassword`);
    });

    await test.step(`Click`, async () => {
        await page.click(`[katalon-object="Object Repository/Page_CuraAppointment/btn_Login"]`);
    });

    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });
    console.log(`✅ Flujo completado con éxito.`);
});
