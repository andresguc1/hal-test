import { ExperienceVault } from '../database/init.js';
import { Op } from 'sequelize';

/**
 * ExperienceVaultService
 * Manages the "memories" of HalTest.
 * Allows horizontal reuse of solutions across different test runs.
 */
class ExperienceVaultService {
    /**
     * Finds a matching memory in the vault.
     * @param {string} problemSelector - The faulty selector.
     * @param {string} context - The context (e.g. flow name).
     * @param {string} url - Current page URL (optional).
     * @param {string} nodeId - The specific node ID (optional).
     * @returns {Promise<Object|null>}
     */
    async findMemory(problemSelector, context, _url = '', nodeId = null) {
        try {
            console.log(
                `[ExperienceVault] Searching for solution for: "${problemSelector}" in context: "${context}"`,
            );

            // 1. Try match by nodeId first (High Priority - Revert to known good)
            if (nodeId) {
                let nodeMemory = await ExperienceVault.findOne({
                    where: { nodeId },
                    order: [['updatedAt', 'DESC']],
                });

                if (nodeMemory && nodeMemory.solutionSelector !== problemSelector) {
                    console.log(
                        `[ExperienceVault] 🎯 Found previous successful selector for node: ${nodeId}`,
                    );
                    return {
                        correctedSelector: nodeMemory.solutionSelector,
                        reasoning: `[Experience-Vault] Reverting to previously known good selector for this node.`,
                        confidence: 1.0,
                        isFromVault: true,
                        source: 'memory_node',
                    };
                }
            }

            // 2. Try exact match first on selector and context
            let memory = await ExperienceVault.findOne({
                where: {
                    problemSelector,
                    context,
                },
                order: [
                    ['confidence', 'DESC'],
                    ['updatedAt', 'DESC'],
                ],
            });

            // If not found, try exact match on selector only (more broad)
            if (!memory) {
                memory = await ExperienceVault.findOne({
                    where: {
                        problemSelector,
                    },
                    order: [
                        ['confidence', 'DESC'],
                        ['usageCount', 'DESC'],
                    ],
                });
            }

            if (memory) {
                console.log(`[ExperienceVault] 🏛️ Match found! Memory ID: ${memory.id}`);

                // Update stats
                await memory.update({
                    usageCount: (memory.usageCount || 0) + 1,
                    lastUsedAt: new Date(),
                });

                return {
                    correctedSelector: memory.solutionSelector,
                    reasoning: `[Vault] ${memory.reasoning || 'Reused from a past successful repair.'}`,
                    confidence: memory.confidence,
                    isFromVault: true,
                };
            }

            console.log(`[ExperienceVault] No matching memory found.`);
            return null;
        } catch (error) {
            console.error('[ExperienceVault] Search error:', error.message);
            return null;
        }
    }

    /**
     * Saves a successful repair into the vault.
     * @param {Object} data - Context, url, problemSelector, solutionSelector, reasoning, confidence
     */
    async saveMemory({
        context,
        url,
        problemSelector,
        solutionSelector,
        reasoning,
        confidence,
        nodeId,
    }) {
        try {
            if (!problemSelector || !solutionSelector) {
                return null;
            }

            console.log(`[ExperienceVault] Saving successful repair to vault...`);

            // Check if this memory already exists to avoid duplicates
            let memory = await ExperienceVault.findOne({
                where: {
                    problemSelector,
                    solutionSelector,
                    context,
                },
            });

            if (memory) {
                // Update confidence if it's better
                await memory.update({
                    confidence: Math.max(memory.confidence, confidence || 0.8),
                    reasoning: reasoning || memory.reasoning,
                });
                return memory;
            }

            // Create new memory
            memory = await ExperienceVault.create({
                context,
                url,
                nodeId,
                problemSelector,
                solutionSelector,
                reasoning,
                confidence: confidence || 0.8,
            });

            console.log(`[ExperienceVault] ✨ New memory saved: ${memory.id}`);
            return memory;
        } catch (error) {
            console.error('[ExperienceVault] Save error:', error.message);
            return null;
        }
    }
}

export default new ExperienceVaultService();
