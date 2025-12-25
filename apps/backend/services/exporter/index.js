import { generatePlaywrightCode } from './generators/playwright.generator.js';

export const exportService = {
    /**
     * Genera código ejecutable basado en el flujo y el framework seleccionado.
     * @param {Array} flowData - Datos del flujo (lista de pasos).
     * @param {string} framework - Framework destino ('playwright', 'puppeteer', etc.).
     * @returns {object} - Resultado con el código generado y metadatos.
     */
    generateCode: (flowData, framework = 'playwright') => {
        try {
            let code = '';
            let extension = 'js';

            switch (framework.toLowerCase()) {
                case 'playwright':
                    code = generatePlaywrightCode(flowData);
                    break;
                // Futuro: case 'puppeteer': ...
                default:
                    throw new Error(`Framework no soportado: ${framework}`);
            }

            return {
                success: true,
                code,
                framework,
                extension,
                filename: `export_${Date.now()}.${extension}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Prepara los datos para exportación JSON (backup).
     * @param {object} flowData - Datos completos del flujo.
     * @returns {object} - Objeto listo para descargar.
     */
    generateJson: (flowData) => {
        return {
            success: true,
            data: JSON.stringify(flowData, null, 2),
            filename: `flow_backup_${Date.now()}.json`,
            contentType: 'application/json',
        };
    },
};
