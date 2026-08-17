import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/GraphValidator.js', () => ({
    GraphValidator: { validate: vi.fn() },
}));

const { GraphValidator } = await import('../services/GraphValidator.js');
const { default: policyValidator } = await import('../core/validators/PolicyValidator.js');

function makeFlow(nodes = [], edges = []) {
    return { nodes, edges };
}

describe('PolicyValidator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        policyValidator.removePolicy('custom_policy_test');
        policyValidator.removePolicy('no_long_loops');
        policyValidator.removePolicy('broken_policy');
        policyValidator.removePolicy('temp_policy');
    });

    it('should pass when GraphValidator reports valid', async () => {
        GraphValidator.validate.mockReturnValue({ valid: true, errors: [] });

        const result = await policyValidator.validate(
            makeFlow([{ id: 'n1', type: 'launch_browser' }], []),
        );

        expect(result.passed).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.validator).toBe('policy');
    });

    it('should map GraphValidator errors to policy errors', async () => {
        GraphValidator.validate.mockReturnValue({
            valid: false,
            errors: ['Cyclic dependency detected', 'Missing edge target'],
        });

        const result = await policyValidator.validate(
            makeFlow([{ id: 'n1', type: 'launch_browser' }], []),
        );

        expect(result.passed).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0]).toEqual({
            rule: 'graph_validator',
            message: 'Cyclic dependency detected',
        });
        expect(result.errors[1]).toEqual({
            rule: 'graph_validator',
            message: 'Missing edge target',
        });
    });

    it('should run custom policies added via addPolicy', async () => {
        GraphValidator.validate.mockReturnValue({ valid: true, errors: [] });

        policyValidator.addPolicy('no_long_loops', (nodes) => {
            if (nodes.length > 10) {
                return { warnings: [{ message: 'Flow is very large' }] };
            }
            return {};
        });

        const nodes = Array.from({ length: 12 }, (_, i) => ({
            id: `n${i}`,
            type: 'click_element',
        }));
        const result = await policyValidator.validate(makeFlow(nodes, []));

        expect(result.passed).toBe(true);
        expect(result.warnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'no_long_loops',
                    message: 'Flow is very large',
                }),
            ]),
        );
    });

    it('should catch errors thrown by custom policies without breaking', async () => {
        GraphValidator.validate.mockReturnValue({ valid: true, errors: [] });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        policyValidator.addPolicy('broken_policy', () => {
            throw new Error('kaboom');
        });

        const result = await policyValidator.validate(
            makeFlow([{ id: 'n1', type: 'launch_browser' }], []),
        );

        expect(result.passed).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('broken_policy'));

        warnSpy.mockRestore();
    });

    it('should stop running a policy after removePolicy', async () => {
        GraphValidator.validate.mockReturnValue({ valid: true, errors: [] });

        const policyFn = vi.fn(() => ({
            errors: [{ message: 'violation' }],
        }));

        policyValidator.addPolicy('temp_policy', policyFn);
        policyValidator.removePolicy('temp_policy');

        const result = await policyValidator.validate(
            makeFlow([{ id: 'n1', type: 'launch_browser' }], []),
        );

        expect(result.passed).toBe(true);
        expect(policyFn).not.toHaveBeenCalled();
        expect(result.errors).toHaveLength(0);
    });
});
