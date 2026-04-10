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
     * @returns {Promise<Object|null>}
     */
    async findMemory(problemSelector, context, _url = '') {
        try {
            console.log(
                `[ExperienceVault] Searching for solution for: "${problemSelector}" in context: "${context}"`,
            );

            // Try exact match first on selector and context
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
    async saveMemory({ context, url, problemSelector, solutionSelector, reasoning, confidence }) {
        try {
            if (!problemSelector || !solutionSelector || problemSelector === solutionSelector) {
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
