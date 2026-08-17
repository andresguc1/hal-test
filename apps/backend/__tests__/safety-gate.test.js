import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStructuralValidate = vi.fn();
const mockPolicyValidate = vi.fn();
const mockListGoldenFlows = vi.fn();
const mockGetGoldenFlow = vi.fn();

vi.mock('../core/validators/StructuralValidator.js', () => ({
    default: { validate: mockStructuralValidate },
    structuralValidator: { validate: mockStructuralValidate },
}));

vi.mock('../core/validators/PolicyValidator.js', () => ({
    default: { validate: mockPolicyValidate },
    policyValidator: { validate: mockPolicyValidate },
}));

vi.mock('../core/GoldenDatasetStore.js', () => ({
    default: {
        listGoldenFlows: mockListGoldenFlows,
        getGoldenFlow: mockGetGoldenFlow,
    },
    goldenDatasetStore: {
        listGoldenFlows: mockListGoldenFlows,
        getGoldenFlow: mockGetGoldenFlow,
    },
}));

const { default: gate } = await import('../core/SafetyGate.js');

function makeFlow(nodes = [], edges = []) {
    return { nodes, edges };
}

function passResult(validator) {
    return { validator, passed: true, errors: [], warnings: [], duration: 1 };
}

function failResult(validator, errors, warnings = []) {
    return { validator, passed: false, errors, warnings, duration: 1 };
}

describe('SafetyGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should pass when both structural and policy pass', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(passResult('policy'));

        const result = await gate.validate(makeFlow([{ id: 'n1' }], []));

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1.0);
        expect(result.blockedReasons).toHaveLength(0);
    });

    it('should fail when structural validation fails', async () => {
        mockStructuralValidate.mockResolvedValue(
            failResult('structural', [{ message: 'Flow is empty' }]),
        );
        mockPolicyValidate.mockResolvedValue(passResult('policy'));

        const result = await gate.validate(makeFlow([], []));

        expect(result.passed).toBe(false);
        expect(result.blockedReasons).toContain('Flow is empty');
    });

    it('should fail when policy validation fails', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(
            failResult('policy', [{ message: 'Cyclic dependency' }]),
        );

        const result = await gate.validate(makeFlow([{ id: 'n1' }], []));

        expect(result.passed).toBe(false);
        expect(result.blockedReasons).toContain('Cyclic dependency');
    });

    it('should only run structural validation in validateQuick', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));

        const result = await gate.validateQuick(makeFlow([{ id: 'n1' }], []));

        expect(mockStructuralValidate).toHaveBeenCalled();
        expect(mockPolicyValidate).not.toHaveBeenCalled();
        expect(result.passed).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should trigger golden dataset validation for ai_generation source', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(passResult('policy'));
        mockListGoldenFlows.mockResolvedValue([]);
        mockGetGoldenFlow.mockResolvedValue(null);

        const flow = makeFlow([{ id: 'n1', type: 'launch_browser' }], []);
        await gate.validate(flow, { source: 'ai_generation' });

        expect(mockListGoldenFlows).toHaveBeenCalled();
    });

    it('should skip golden dataset validation for manual source at normal level', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(passResult('policy'));

        const flow = makeFlow([{ id: 'n1', type: 'launch_browser' }], []);
        await gate.validate(flow, { source: 'manual' }, 'normal');

        expect(mockListGoldenFlows).not.toHaveBeenCalled();
    });

    it('should trigger golden dataset validation when level is strict', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(passResult('policy'));
        mockListGoldenFlows.mockResolvedValue([]);
        mockGetGoldenFlow.mockResolvedValue(null);

        const flow = makeFlow([{ id: 'n1', type: 'launch_browser' }], []);
        await gate.validate(flow, { source: 'manual' }, 'strict');

        expect(mockListGoldenFlows).toHaveBeenCalled();
    });

    it('should calculate score as ratio of passed validations', async () => {
        mockStructuralValidate.mockResolvedValue(passResult('structural'));
        mockPolicyValidate.mockResolvedValue(passResult('policy'));
        mockListGoldenFlows.mockResolvedValue(['golden1']);
        mockGetGoldenFlow.mockResolvedValue({
            assertions: { structural: { minNodes: 999 } },
        });

        const flow = makeFlow([{ id: 'n1', type: 'launch_browser' }], []);
        const result = await gate.validate(flow, { source: 'ai_generation' });

        expect(result.validations).toHaveLength(3);
        expect(result.score).toBe(Math.round((2 / 3) * 100) / 100);
    });

    it('should convert warnings into suggestions', async () => {
        mockStructuralValidate.mockResolvedValue(
            failResult('structural', [], [{ message: 'Node n2 is unreachable' }]),
        );
        mockPolicyValidate.mockResolvedValue(passResult('policy'));

        const result = await gate.validate(makeFlow([{ id: 'n1' }, { id: 'n2' }], []));

        expect(result.suggestions).toContain('Node n2 is unreachable');
    });

    it('should collect error messages into blockedReasons', async () => {
        mockStructuralValidate.mockResolvedValue(
            failResult('structural', [
                { message: 'No launch_browser' },
                { message: 'Orphan edge' },
            ]),
        );
        mockPolicyValidate.mockResolvedValue(passResult('policy'));

        const result = await gate.validate(makeFlow([{ id: 'n1' }], []));

        expect(result.blockedReasons).toEqual(['No launch_browser', 'Orphan edge']);
    });
});
