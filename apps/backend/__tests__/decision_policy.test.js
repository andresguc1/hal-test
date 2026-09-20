import { describe, it, expect } from 'vitest';
import {
    rankCandidates,
    applyAmbiguity,
    baseConfidence,
    proximityWeight,
} from '../core/decisions/SelectorRanker.js';
import { applyPolicy, calibrationError, ACTIONS, MODES } from '../core/decisions/DecisionPolicy.js';

describe('SelectorRanker — confidence calibrate (F1)', () => {
    it('unique strong signal => high confidence (>= 0.9)', () => {
        const ranked = rankCandidates({
            domSnippet: '<button data-testid="login-btn"></button>',
            candidates: ['[data-testid="login-btn"]'],
        });
        expect(ranked[0].confidence).toBeGreaterThanOrEqual(0.9);
        expect(ranked[0].ambiguity).toBe(false);
    });

    it('multi-match signal is penalized below AUTO threshold', () => {
        const ranked = rankCandidates({
            domSnippet:
                '<button data-testid="submit"></button><button data-testid="submit"></button>',
            candidates: ['button[data-testid="submit"]'],
        });
        expect(ranked[0].ambiguity).toBe(true);
        expect(ranked[0].confidence).toBeLessThan(0.9);
    });

    it('proximity to original selector boosts confidence', () => {
        const dom = '<button>Order again</button>';
        // base no saturada (0.7 texto) para que el boost por proximidad sea visible
        const withoutProx = rankCandidates({
            domSnippet: dom,
            originalSelector: '',
            candidates: ['button:has-text("Order again")'],
        })[0].confidence;

        // comparte el texto con el original => boost 1.05
        const withProx = rankCandidates({
            domSnippet: dom,
            originalSelector: 'a:has-text("Order again")',
            candidates: ['button:has-text("Order again")'],
        })[0].confidence;

        expect(withoutProx).toBe(0.7);
        expect(withProx).toBeGreaterThan(withoutProx);
        expect(withProx).toBe(0.74);
    });

    it('unrelated candidate is penalized by proximity', () => {
        const ranked = rankCandidates({
            domSnippet: '<input data-testid="email-in" id="user-email">',
            originalSelector: '#user-email',
            candidates: ['[data-testid="email-in"]'],
        });
        // 1.0 (testid) * 0.9 (sin relación con #user-email) => 0.9
        expect(ranked[0].confidence).toBe(0.9);
    });

    it('proximityWeight shares signal detection', () => {
        expect(proximityWeight('#same-id', '#same-id')).toBe(1.15);
        expect(proximityWeight('#other', '#original')).toBe(0.9);
        expect(proximityWeight('#x', '')).toBe(1.0);
    });

    it('baseConfidence + applyAmbiguity behave as contract', () => {
        const signals = [{ name: 'testIdExact', s: 10, count: 2 }];
        expect(baseConfidence(signals)).toBe(1);
        const { confidence, ambiguity } = applyAmbiguity(1, signals);
        expect(ambiguity).toBe(true);
        expect(confidence).toBe(0.7);
    });
});

describe('DecisionPolicy (F2)', () => {
    it('AUTO over threshold', () => {
        const r = applyPolicy({ selector: 'x', confidence: 0.92 });
        expect(r.action).toBe(ACTIONS.AUTO);
    });

    it('SUGGEST in middle band', () => {
        const r = applyPolicy({ selector: 'x', confidence: 0.8 });
        expect(r.action).toBe(ACTIONS.SUGGEST);
    });

    it('HUMAN_REVIEW below threshold', () => {
        const r = applyPolicy({ selector: 'x', confidence: 0.5 });
        expect(r.action).toBe(ACTIONS.HUMAN_REVIEW);
    });

    it('custom thresholds win', () => {
        const r = applyPolicy({ selector: 'x', confidence: 0.6 }, { minConfidenceAuto: 0.5 });
        expect(r.action).toBe(ACTIONS.AUTO);
    });

    it('disabled mode never auto-applies', () => {
        const r = applyPolicy({ selector: 'x', confidence: 0.99 }, { mode: MODES.DISABLED });
        expect(r.action).toBe(ACTIONS.HUMAN_REVIEW);
    });

    it('calibrationError computes MCE + Brier', () => {
        const records = [
            { confidence: 0.9, correct: true },
            { confidence: 0.9, correct: true },
            { confidence: 0.9, correct: false },
            { confidence: 0.6, correct: true },
        ];
        const { mce, brier, n } = calibrationError(records);
        expect(n).toBe(4);
        expect(mce).toBeGreaterThan(0);
        expect(brier).toBeGreaterThan(0);
    });

    it('calibrationError empty input', () => {
        expect(calibrationError([])).toEqual({ mce: 0, brier: 0, n: 0 });
    });
});
