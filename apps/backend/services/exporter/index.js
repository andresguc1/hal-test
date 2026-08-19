import { PlaywrightGenerator } from './generators/PlaywrightGenerator.js';
import { CypressGenerator } from './generators/CypressGenerator.js';
import { SeleniumGenerator } from './generators/SeleniumGenerator.js';
import { flowResolver } from '../../core/FlowResolver.js';
import pipelineCodeLinter from '../PipelineCodeLinter.js';
import codeValidator from '../CodeValidator.js';

export const exportService = {
    /**
     * Resuelve recursivamente los sub-flujos de los componentes.
     * Delegates to FlowResolver for consistent resolution logic.
     * @param {Array} nodes - Nodos del flujo.
     * @param {string} projectId - ID del proyecto para buscar las tablas.
     * @returns {Promise<Array>} - Nodos con subNodes poblados.
     */
    resolveSubFlows: async (nodes, projectId) => {
        return flowResolver.resolve(nodes, projectId);
    },

    /**
     * Genera código ejecutable basado en el flujo y el framework seleccionado.
     * @param {Array} flowData - Datos del flujo (lista de pasos).
     * @param {string} framework - Framework destino ('playwright', 'puppeteer', etc.).
     * @returns {object} - Resultado con el código generado y metadatos.
     */
    generateCode: (
        flowData,
        framework = 'playwright',
        language = 'javascript',
        locale = 'es',
        usePOM = false,
        includeCICD = false,
        designPattern = 'flat',
    ) => {
        try {
            let code = '';
            let warnings = [];
            const extensionMap = {
                javascript: 'js',
                typescript: 'ts',
                python: 'py',
                java: 'java',
                csharp: 'cs',
            };
            const extension = extensionMap[language.toLowerCase()] || 'js';

            switch (framework.toLowerCase()) {
                case 'playwright': {
                    const generator = new PlaywrightGenerator(
                        language,
                        locale,
                        usePOM,
                        includeCICD,
                        designPattern,
                    );
                    const result = generator.generate(flowData);
                    const isMultiFile =
                        usePOM || includeCICD || (designPattern !== 'flat' && result.files);
                    if (isMultiFile) {
                        return {
                            success: true,
                            isZip: true,
                            files: result.files,
                            warnings: result.warnings || [],
                            framework,
                            language,
                            extension,
                            designPattern,
                        };
                    }
                    code = result.code;
                    warnings = result.warnings || [];
                    break;
                }
                case 'cypress': {
                    const generator = new CypressGenerator(language, locale);
                    const result = generator.generate(flowData);
                    code = result.code;
                    warnings = result.warnings || [];
                    break;
                }
                case 'selenium': {
                    const generator = new SeleniumGenerator(language, locale);
                    const result = generator.generate(flowData);
                    code = result.code;
                    warnings = result.warnings || [];
                    break;
                }
                default:
                    throw new Error(`Framework no soportado: ${framework}`);
            }

            const filename = `export_${Date.now()}.${extension}`;
            let lintReport = null;
            let validationReport = null;

            if (code) {
                if (
                    framework.toLowerCase() === 'playwright' ||
                    framework.toLowerCase() === 'cypress'
                ) {
                    try {
                        lintReport = pipelineCodeLinter.lintCode(code, filename);
                    } catch (lintError) {
                        console.warn('[ExportService] Lint analysis failed:', lintError.message);
                    }
                }
                try {
                    validationReport = codeValidator.validate(code, language);
                } catch (valError) {
                    console.warn('[ExportService] Code validation failed:', valError.message);
                }
            }

            return {
                success: true,
                code,
                warnings,
                lintReport,
                validationReport,
                framework,
                language,
                extension,
                filename,
            };
        } catch (error) {
            console.error('[ExportService] Error generating code:', error);
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
