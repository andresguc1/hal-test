import { safetyGate } from './SafetyGate.js';

/**
 * AIGenerationGuard
 * Intercepts AI-generated flow modifications and validates them
 * through the SafetyGate before they reach the canvas.
 * Implements a retry loop with correction prompts.
 */
class AIGenerationGuard {
    /**
     * Intercepts and validates AI response before canvas injection.
     * @param {object} aiResponse - The AI response with proposed nodes/edges
     * @param {object} currentCanvas - { nodes: Array, edges: Array }
     * @param {object} options - { level: 'strict'|'normal'|'relaxed', maxRetries: number }
     * @returns {Promise<{ approved, rejected, gateReport }>}
     */
    async interceptAndValidate(aiResponse, currentCanvas, options = {}) {
        const level = options.level || 'normal';

        const proposedNodes = this._extractNodesFromResponse(aiResponse);
        const proposedEdges = this._extractEdgesFromResponse(aiResponse);

        if (proposedNodes.length === 0) {
            return {
                approved: aiResponse,
                rejected: null,
                gateReport: { passed: true, score: 1.0, validations: [] },
            };
        }

        const hypotheticalFlow = {
            nodes: [...(currentCanvas?.nodes || []), ...proposedNodes],
            edges: [...(currentCanvas?.edges || []), ...proposedEdges],
        };

        const gateReport = await safetyGate.validate(
            hypotheticalFlow,
            { source: 'ai_generation', aiModel: aiResponse.model },
            level,
        );

        if (gateReport.passed) {
            return { approved: aiResponse, rejected: null, gateReport };
        }

        return { approved: null, rejected: aiResponse, gateReport };
    }

    /**
     * Generates a correction prompt for the AI based on gate failures.
     */
    buildCorrectionPrompt(originalPrompt, gateReport) {
        const errors = gateReport.blockedReasons || [];
        const errorList = errors.map((e) => `- ${e}`).join('\n');

        return `The previous flow generation failed validation:
${errorList}

Please regenerate the flow fixing these issues while keeping the original intent:
${originalPrompt}`;
    }

    /**
     * Full guarded generation loop.
     * @param {Function} generateFn - Async function that generates an AI response
     * @param {object} currentCanvas
     * @param {object} options
     * @returns {Promise<{ response, gateReport, attempts }>}
     */
    async guardedGenerate(generateFn, currentCanvas, options = {}) {
        const maxRetries = options.maxRetries || 3;
        let attempt = 0;
        let lastReport = null;
        let prompt = options.prompt || '';

        while (attempt < maxRetries) {
            const response = await generateFn(prompt);

            const { approved, gateReport } = await this.interceptAndValidate(
                response,
                currentCanvas,
                options,
            );

            lastReport = gateReport;

            if (approved) {
                return {
                    response: approved,
                    gateReport,
                    attempts: attempt + 1,
                };
            }

            prompt = this.buildCorrectionPrompt(prompt, gateReport);
            attempt++;
        }

        return {
            response: null,
            gateReport: lastReport,
            attempts: maxRetries,
            error: 'Safety gate validation failed after max retries',
        };
    }

    // ── Private Helpers ───────────────────────────────────────

    _extractNodesFromResponse(aiResponse) {
        if (!aiResponse) return [];
        if (aiResponse.proposedNodes) return aiResponse.proposedNodes;
        if (aiResponse.toolCalls) {
            const nodes = [];
            for (const call of aiResponse.toolCalls) {
                if (call.name === 'inject_nodes' || call.name === 'add_node_to_canvas') {
                    const args =
                        typeof call.arguments === 'string'
                            ? JSON.parse(call.arguments)
                            : call.arguments;
                    if (args.nodes) nodes.push(...args.nodes);
                    if (args.type) {
                        nodes.push({
                            id: args.id || `ai_${Date.now()}`,
                            type: args.type,
                            data: args.data || {},
                        });
                    }
                }
            }
            return nodes;
        }
        return [];
    }

    _extractEdgesFromResponse(aiResponse) {
        if (!aiResponse) return [];
        if (aiResponse.proposedEdges) return aiResponse.proposedEdges;
        if (aiResponse.toolCalls) {
            const edges = [];
            for (const call of aiResponse.toolCalls) {
                if (call.name === 'connect_nodes') {
                    const args =
                        typeof call.arguments === 'string'
                            ? JSON.parse(call.arguments)
                            : call.arguments;
                    edges.push({
                        id: `edge_${args.sourceId}_${args.targetId}`,
                        source: args.sourceId,
                        target: args.targetId,
                    });
                }
            }
            return edges;
        }
        return [];
    }
}

export const aiGenerationGuard = new AIGenerationGuard();
export default aiGenerationGuard;
