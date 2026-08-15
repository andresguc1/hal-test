import { describe, it, expect } from 'vitest';
import selectorPreValidator from '../services/SelectorPreValidator.js';

describe('SelectorPreValidator Unit Tests', () => {
    it('should validate robust data-testid selectors with high score', async () => {
        const result = await selectorPreValidator.validateSelector('[data-testid="submit-login"]');
        expect(result.validSyntax).toBe(true);
        expect(result.score).toBe(1.0);
        expect(result.issues).toHaveLength(0);
    });

    it('should penalize dynamic auto-generated numeric IDs', async () => {
        const result = await selectorPreValidator.validateSelector('#button-948271');
        expect(result.validSyntax).toBe(true);
        expect(result.score).toBeLessThan(0.5);
        expect(result.issues).toContain('Selector contains dynamic generated numbers');
    });

    it('should handle invalid syntax empty input', async () => {
        const result = await selectorPreValidator.validateSelector('');
        expect(result.validSyntax).toBe(false);
        expect(result.score).toBe(0);
    });
});
