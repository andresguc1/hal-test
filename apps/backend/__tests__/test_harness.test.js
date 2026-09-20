import { describe, it, expect, beforeEach } from 'vitest';
import { healingFixtures } from '../test-harness/healing-fixtures.js';
import { runBenchmark } from '../test-harness/run-benchmark.js';

describe('test-harness: auto-healing determinístico (F5)', () => {
    let result;
    beforeEach(async () => {
        result = await runBenchmark();
    });

    it('todos los fixtures deben producir una evaluación por caso', () => {
        expect(result.lines).toHaveLength(healingFixtures.length);
    });

    it('G0: healSuccessRate debe ser 1.0 (siempre repara funcionalmente)', () => {
        expect(result.summary.healSuccessRate).toBeGreaterThanOrEqual(0.95);
        expect(result.summary.healSuccessRate).toBe(1.0);
    });

    it('G1: falseRepairRate debe ser 0 (nunca aplicar algo no funcional)', () => {
        expect(result.summary.falseRepairRate).toBe(0);
    });

    it('G2: MCE <= 0.2 (la confidence debe estar razonablemente calibrada)', () => {
        expect(result.summary.calibration.mce).toBeLessThanOrEqual(0.2);
    });

    it('G3: la ambigüedad debe deferir (nunca AUTO)', () => {
        const ambiguous = result.lines.find((l) => l.id === 'adv-01-multimatch');
        expect(ambiguous).toBeDefined();
        expect(ambiguous.ambiguity).toBe(true);
        expect(ambiguous.action).not.toBe('AUTO');
    });

    it('no debe haber selectores con saltos de línea (regresión normalizeDom)', () => {
        for (const l of result.lines) {
            expect(l.chosen || '').not.toContain('\n');
        }
    });
});
