import { describe, it, expect } from 'vitest';
import SelectorRanker, {
    rankCandidates,
    bestSelector,
    generateCandidates,
} from '../core/decisions/SelectorRanker.js';

describe('SelectorRanker — candidate generation', () => {
    it('should generate candidates in semantic priority order', () => {
        const dom =
            '<button data-testid="login-btn" aria-label="Login" id="login" role="button"><span>Login</span></button>';
        const candidates = generateCandidates(dom);
        expect(candidates[0]).toBe('[data-testid="login-btn"]');
        expect(candidates.indexOf('[aria-label="Login"]')).toBeGreaterThan(-1);
        expect(candidates.indexOf('#login')).toBeGreaterThan(-1);
        expect(candidates.indexOf('[role="button"]')).toBeGreaterThan(-1);
    });

    it('should avoid duplicates in generated candidates', () => {
        const dom = '<button data-testid="save" id="save"><span>Save</span></button>';
        const candidates = generateCandidates(dom);
        expect(new Set(candidates).size).toBe(candidates.length);
    });

    it('should handle empty DOM returning no candidates', () => {
        expect(generateCandidates('')).toHaveLength(0);
    });

    it('should parse HalTest pipe-delimited compressed DOM', () => {
        const pipedDom =
            'ref:0|tag:button|id:login|testId:login-btn|aria:Login|role:button|text:Login\n' +
            'ref:1|tag:a|href:/register|aria:Create account';
        const ranked = rankCandidates({
            domSnippet: pipedDom,
            candidates: ['[data-testid="login-btn"]', 'a:has-text("Create account")'],
        });
        expect(ranked[0].selector).toBe('[data-testid="login-btn"]');
        expect(ranked[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should generate candidates from pipe-delimited DOM', () => {
        const pipedDom = 'ref:0|tag:button|testId:go-next';
        const candidates = generateCandidates(pipedDom);
        expect(candidates).toContain('[data-testid="go-next"]');
    });
});

describe('SelectorRanker — ranked candidates', () => {
    it('should rank data-testid above id above text', () => {
        const dom = '<button data-testid="login-btn" id="login"><span>Login</span></button>';
        const ranked = rankCandidates({
            domSnippet: dom,
            candidates: ['#login', 'button:has-text("Login")', '[data-testid="login-btn"]'],
        });
        expect(ranked[0].selector).toBe('[data-testid="login-btn"]');
        expect(ranked[1].selector).toBe('#login');
        expect(ranked[2].selector).toBe('button:has-text("Login")');
    });

    it('should flag ambiguity when the winning signal matches multiple DOM elements', () => {
        const dom = '<button data-testid="submit"></button><button data-testid="submit"></button>';
        const ranked = rankCandidates({
            domSnippet: dom,
            candidates: ['button[data-testid="submit"]'],
        });
        expect(ranked[0].ambiguity).toBe(true);
        expect(ranked[0].confidence).toBeLessThan(0.8);
        expect(ranked[0].reason).toBe('weak-multi-match');
    });

    it('should give high confidence to a unique strong signal', () => {
        const dom = '<input data-testid="email-input" type="email" id="user-email">';
        const ranked = rankCandidates({
            domSnippet: dom,
            candidates: ['[data-testid="email-input"]', '#user-email'],
        });
        expect(ranked[0].confidence).toBeGreaterThanOrEqual(0.9);
        expect(ranked[0].ambiguity).toBe(false);
    });

    it('should report no-signal when nothing matches', () => {
        const ranked = rankCandidates({
            domSnippet: '<div><span>Hello</span></div>',
            candidates: ['#nope', '[data-testid="missing"]'],
        });
        expect(ranked[0].reason).toBe('no-signal');
        expect(ranked[0].confidence).toBe(0);
    });

    it('should generate candidates from DOM when non provided', () => {
        const ranked = rankCandidates({ domSnippet: '<button data-testid="go"></button>' });
        expect(ranked.length).toBeGreaterThan(0);
        expect(ranked[0].selector).toContain('go');
    });
});

describe('SelectorRanker — bestSelector', () => {
    it('should return null on no-signal', () => {
        const best = bestSelector({
            domSnippet: '<div></div>',
            candidates: ['#missing'],
        });
        expect(best.selector).toBeNull();
        expect(best.confidence).toBe(0);
    });

    it('should return the top candidate otherwise', () => {
        const best = bestSelector({
            domSnippet: '<button data-testid="ok" id="footer-ok"></button>',
            candidates: ['#footer-ok', '[data-testid="ok"]'],
        });
        expect(best.selector).toBe('[data-testid="ok"]');
        expect(best.ranked).toHaveLength(2);
    });

    it('should honor intent-insensitive deterministic behavior (same inputs -> same outputs)', () => {
        const dom = '<a data-testid="settings" href="/settings">Settings</a>';
        const input = {
            domSnippet: dom,
            candidates: ['a[data-testid="settings"]', 'a:has-text("Settings")'],
        };
        const a = bestSelector(input);
        const b = bestSelector(input);
        expect(a.selector).toBe(b.selector);
        expect(a.confidence).toBe(b.confidence);
    });
});
