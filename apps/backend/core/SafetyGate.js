import { structuralValidator } from './validators/StructuralValidator.js';
import { policyValidator } from './validators/PolicyValidator.js';
import { goldenDatasetStore } from './GoldenDatasetStore.js';

/**
 * SafetyGate
 * Orchestrates the 3-layer validation pipeline for flows.
 * Layers:
 *   1. StructuralValidator - JSON schema + node contracts
 *   2. PolicyValidator     - Graph topology + best practices
 *   3. GoldenDatasetValidator - Comparison against known-good flows
 */
class SafetyGate {
    /**
     * Runs the full validation pipeline.
     * @param {object} flow - { nodes: Array, edges: Array }
     * @param {object} context - { source: 'ai_generation' | 'manual', aiModel?: string }
     * @param {'strict' | 'normal' | 'relaxed'} level
     * @returns {Promise<SafetyGateResult>}
     */
    async validate(flow, context = {}, level = 'normal') {
        const startTime = Date.now();
        const validations = [];

        // Layer 1: Structural (always runs)
        const structural = await structuralValidator.validate(flow);
        validations.push(structural);

        // Layer 2: Policy (always runs)
        const policy = await policyValidator.validate(flow);
        validations.push(policy);

        // Layer 3: Golden Dataset (only for AI generation or strict mode)
        if (context.source === 'ai_generation' || level === 'strict') {
            const golden = await this._validateAgainstGolden(flow, context);
            if (golden) validations.push(golden);
        }

        const allErrors = validations.flatMap((v) => v.errors);
        const allWarnings = validations.flatMap((v) => v.warnings);

        return {
            passed: allErrors.length === 0,
            level,
            validations,
            score: this._calculateScore(validations),
            suggestions: this._generateSuggestions(allWarnings),
            blockedReasons: allErrors.map((e) => e.message),
            duration: Date.now() - startTime,
        };
    }

    /**
     * Quick structural-only validation (for fast checks).
     */
    async validateQuick(flow) {
        const structural = await structuralValidator.validate(flow);
        return {
            passed: structural.passed,
            errors: structural.errors,
            warnings: structural.warnings,
            duration: structural.duration,
        };
    }

    // ── Private ───────────────────────────────────────────────

    async _validateAgainstGolden(flow) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];

        const goldenFlows = await goldenDatasetStore.listGoldenFlows();

        for (const goldenId of goldenFlows) {
            const golden = await goldenDatasetStore.getGoldenFlow(goldenId);
            if (!golden?.assertions?.structural) continue;

            const sa = golden.assertions.structural;

            if (sa.minNodes && (flow.nodes?.length || 0) < sa.minNodes) {
                errors.push({
                    rule: 'golden_min_nodes',
                    message: `Flow has ${flow.nodes?.length || 0} nodes, minimum required is ${sa.minNodes} (from golden: ${goldenId})`,
                });
            }

            if (sa.maxNodes && (flow.nodes?.length || 0) > sa.maxNodes) {
                warnings.push({
                    rule: 'golden_max_nodes',
                    message: `Flow has ${flow.nodes?.length || 0} nodes, typical max is ${sa.maxNodes} (from golden: ${goldenId})`,
                });
            }

            if (sa.requiredNodeTypes) {
                const flowTypes = new Set((flow.nodes || []).map((n) => n.type || n.data?.type));
                for (const required of sa.requiredNodeTypes) {
                    if (!flowTypes.has(required)) {
                        errors.push({
                            rule: 'golden_required_type',
                            message: `Flow is missing required node type "${required}" (from golden: ${goldenId})`,
                        });
                    }
                }
            }
        }

        return {
            validator: 'golden',
            passed: errors.length === 0,
            errors,
            warnings,
            duration: Date.now() - startTime,
        };
    }

    _calculateScore(validations) {
        if (validations.length === 0) return 1.0;

        const totalWeight = validations.length;
        const passedWeight = validations.filter((v) => v.passed).length;

        return Math.round((passedWeight / totalWeight) * 100) / 100;
    }

    _generateSuggestions(warnings) {
        return warnings.map((w) => w.message);
    }
}

export const safetyGate = new SafetyGate();
export default safetyGate;
