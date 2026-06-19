import { test } from '@playwright/test';

test(`Flujo Generado Hal-Test`, async ({ page }) => {
    console.log(`🚀 Iniciando ejecución del flujo en javascript...`);
    // [node_id: imported_launch_browser_0_c669f22c]
    await test.step(`Launch Browser`, async () => {
        // Browser managed by runner
    });

    // [node_id: imported_open_url_1_c8db90b3]
    await test.step(`Open Url`, async () => {
        await page.goto(`https://katalon-demo-cura.herokuapp.com/`);
    });

    // [node_id: imported_click_2_c02af526]
    await test.step(`Click`, async () => {
        await page.click(`#btn-make-appointment`);
    });

    // [node_id: imported_type_text_3_6e8f3fe7]
    await test.step(`Type Text`, async () => {
        await page.fill(`#txt-username`, `John Doe`);
    });

    // [node_id: imported_type_text_4_ce1b7e82]
    await test.step(`Type Text`, async () => {
        await page.fill(`#txt-password`, `ThisIsNotAPassword`);
    });

    // [node_id: imported_click_5_2ab7c477]
    await test.step(`Click`, async () => {
        await page.click(`[katalon-object="Object Repository/Page_CuraAppointment/btn_Login"]`);
    });

    // [node_id: imported_close_browser_6_c73a2ad0]
    await test.step(`Close Browser`, async () => {
        // Browser managed by runner
    });
    console.log(`✅ Flujo completado con éxito.`);
});
