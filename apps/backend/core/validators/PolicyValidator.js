import { GraphValidator } from '../../services/GraphValidator.js';

/**
 * PolicyValidator
 * Layer 2 of the Safety Gate pipeline.
 * Validates flow against policy rules (topology, best practices).
 * Wraps the existing GraphValidator with additional policy checks.
 */
class PolicyValidator {
    constructor() {
        this._customPolicies = new Map();
    }

    /**
     * Validates a flow against policy rules.
     * @param {object} flow - { nodes: Array, edges: Array }
     * @returns {Promise<ValidationResult>}
     */
    async validate(flow) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];

        // Delegate to existing GraphValidator for core rules
        const graphResult = GraphValidator.validate(flow);
        if (!graphResult.valid) {
            for (const err of graphResult.errors) {
                errors.push({ rule: 'graph_validator', message: err });
            }
        }

        // Run custom policies
        const nodes = flow.nodes || [];
        const edges = flow.edges || [];

        for (const [policyId, policy] of this._customPolicies) {
            try {
                const result = policy.fn(nodes, edges, flow);
                if (result?.errors) {
                    errors.push(...result.errors.map((e) => ({ rule: policyId, ...e })));
                }
                if (result?.warnings) {
                    warnings.push(...result.warnings.map((w) => ({ rule: policyId, ...w })));
                }
            } catch (error) {
                console.warn(`[PolicyValidator] Error in policy ${policyId}: ${error.message}`);
            }
        }

        return {
            validator: 'policy',
            passed: errors.length === 0,
            errors,
            warnings,
            duration: Date.now() - startTime,
        };
    }

    /**
     * Registers a custom policy.
     */
    addPolicy(policyId, fn, description) {
        this._customPolicies.set(policyId, { fn, description });
    }

    /**
     * Removes a policy.
     */
    removePolicy(policyId) {
        this._customPolicies.delete(policyId);
    }
}

export const policyValidator = new PolicyValidator();
export default policyValidator;
