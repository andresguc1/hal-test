import { PlaywrightGenerator } from './generators/PlaywrightGenerator.js';

export const exportService = {
    /**
     * Resuelve recursivamente los sub-flujos de los componentes.
     * @param {Array} nodes - Nodos del flujo.
     * @param {string} projectId - ID del proyecto para buscar las tablas.
     * @returns {Promise<Array>} - Nodos con subNodes poblados.
     */
    resolveSubFlows: async (nodes, projectId) => {
        if (!nodes || !Array.isArray(nodes)) return [];

        const { Flow, Node, Edge } = await import('../../database/init.js');
        const resolvedNodes = [];

        for (const node of nodes) {
            const newNode = { ...node };
            const type = node.type || node.data?.type;

            if (type === 'component') {
                const flowId = node.data?.configuration?.flowId || node.data?.flowId;
                if (flowId && projectId) {
                    const subFlow = await Flow.findOne({
                        where: { id: flowId, projectId },
                        include: [
                            { model: Node, as: 'nodes' },
                            { model: Edge, as: 'edges' },
                        ],
                    });

                    if (subFlow) {
                        // Mapear los nodos del sub-flujo al formato esperado
                        const subNodesRaw = (subFlow.nodes || []).map((n) => ({
                            id: n.nodeId,
                            type: n.type,
                            data: n.data,
                            position: n.position,
                        }));

                        // Resolver recursivamente
                        newNode.data = {
                            ...newNode.data,
                            subNodes: await exportService.resolveSubFlows(subNodesRaw, projectId),
                        };
                    }
                }
            }
            resolvedNodes.push(newNode);
        }
        return resolvedNodes;
    },

    /**
     * Genera código ejecutable basado en el flujo y el framework seleccionado.
     * @param {Array} flowData - Datos del flujo (lista de pasos).
     * @param {string} framework - Framework destino ('playwright', 'puppeteer', etc.).
     * @returns {object} - Resultado con el código generado y metadatos.
     */
    generateCode: (flowData, framework = 'playwright', language = 'javascript', locale = 'es') => {
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
                    const generator = new PlaywrightGenerator(language, locale);
                    const result = generator.generate(flowData);
                    code = result.code;
                    warnings = result.warnings || [];
                    break;
                }
                default:
                    throw new Error(`Framework no soportado: ${framework}`);
            }

            return {
                success: true,
                code,
                warnings,
                framework,
                language,
                extension,
                filename: `export_${Date.now()}.${extension}`,
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
