import { describe, it, expect } from 'vitest';
import { TextStrategy } from '../plugins/core-assertion/engine/strategies/TextStrategy.js';

/**
 * Regression tests for TextStrategy web-first semantics.
 *
 * Covers the operator matrix required by the assertion-locator task plus the
 * whitespace/line-break normalization contract (mirror of Playwright's
 * toHaveText / toContainText) and dynamic / delayed content handling.
 */

function mockLocator(texts = ['']) {
    let calls = 0;
    return {
        waitFor: async () => {
            // Assume the element is attached.
        },
        innerText: async () => {
            const value = texts[Math.min(calls, texts.length - 1)];
            calls += 1;
            if (value instanceof Error) throw value;
            return value;
        },
    };
}

function absentLocator() {
    return {
        waitFor: async () => {
            throw new Error('Element timed out');
        },
    };
}

const strategy = new TextStrategy();

const run = (locator, assertion, options = {}) => strategy.execute({}, locator, assertion, options);

describe('TextStrategy - membership (Cypress contains) semantics', () => {
    it('equals passes when the expected text is the complete text', async () => {
        expect(
            (
                await run(mockLocator(['THIS IS A MODAL WINDOW']), {
                    operator: 'equals',
                    expected: 'THIS IS A MODAL WINDOW',
                })
            ).passed,
        ).toBe(true);
    });

    it('equals passes when the expected text is only part of the text', async () => {
        // Cypress `.contains()` behavior: a text is valid whether it appears
        // as a part or as the whole of the element text.
        const result = await run(mockLocator(['THIS IS A MODAL WINDOW']), {
            operator: 'equals',
            expected: 'MODAL WINDOW',
        });
        expect(result.passed).toBe(true);
    });

    it('equals fails when the text is not present anywhere', async () => {
        const result = await run(mockLocator(['WRONG TEXT']), {
            operator: 'equals',
            expected: 'THIS IS A MODAL WINDOW',
        });
        expect(result.passed).toBe(false);
        expect(result.message).toContain('to contain');
    });

    it('equals matches a title inside a container element (like Cypress contains)', async () => {
        // The modal container exposes title + description + button text; the
        // expected title exists as a part of it, so Equals passes.
        const modalText = 'THIS IS A MODAL WINDOW\n\nA description paragraph here.\n\nClose';
        const equals = await run(mockLocator([modalText]), {
            operator: 'equals',
            expected: 'THIS IS A MODAL WINDOW',
        });
        expect(equals.passed).toBe(true);

        const contains = await run(mockLocator([modalText]), {
            operator: 'contains',
            expected: 'THIS IS A MODAL WINDOW',
        });
        expect(contains.passed).toBe(true);
    });

    it('not_equals passes when the text is absent', async () => {
        const result = await run(mockLocator(['OTHER']), {
            operator: 'not_equals',
            expected: 'THIS',
        });
        expect(result.passed).toBe(true);
    });

    it('not_contains fails when text includes expected', async () => {
        const result = await run(mockLocator(['THIS IS A MODAL WINDOW']), {
            operator: 'not_contains',
            expected: 'MODAL',
        });
        expect(result.passed).toBe(false);
    });
});

describe('TextStrategy - regex operators', () => {
    it('regex passes for matching pattern (case-insensitive by default)', async () => {
        const result = await run(mockLocator(['Price: $123.45']), {
            operator: 'regex',
            expected: 'price: \\$\\d+\\.\\d+',
        });
        expect(result.passed).toBe(true);
    });

    it('regex respects caseSensitive', async () => {
        const cs = await run(mockLocator(['Price: $123.45']), {
            operator: 'regex',
            expected: 'price: \\d+',
            caseSensitive: true,
        });
        expect(cs.passed).toBe(false);
    });

    it('not_regex passes when pattern is absent', async () => {
        const result = await run(mockLocator(['No numbers']), {
            operator: 'not_regex',
            expected: '\\d+',
        });
        expect(result.passed).toBe(true);
    });

    it('invalid flags do not leak into the RegExp constructor', async () => {
        // Regression: flags contaminated with pattern characters used to throw
        // "Invalid flags supplied to RegExp constructor '[^/]+$i'".
        const result = await run(mockLocator(['dynamic content loaded']), {
            operator: 'regex',
            expected: 'dynamic content',
            caseSensitive: true,
            regexFlags: "yzgi'mx",
        });
        expect(result.passed).toBe(true);
    });
});

describe('TextStrategy - whitespace and line-break normalization', () => {
    it('collapses multiple spaces for equals', async () => {
        const result = await run(mockLocator(['Hello    World']), {
            operator: 'equals',
            expected: 'Hello World',
        });
        expect(result.passed).toBe(true);
    });

    it('collapses line breaks for equals (block text)', async () => {
        const result = await run(mockLocator(['THIS IS A MODAL\nWINDOW']), {
            operator: 'equals',
            expected: 'THIS IS A MODAL WINDOW',
        });
        expect(result.passed).toBe(true);
    });

    it('normalizes leading/trailing whitespace on both sides', async () => {
        const result = await run(mockLocator(['   padded text   ']), {
            operator: 'equals',
            expected: ' padded text ',
        });
        expect(result.passed).toBe(true);
    });

    it('contains ignores line breaks in the haystack', async () => {
        const result = await run(mockLocator(['Hello\nWorld\nAgain']), {
            operator: 'contains',
            expected: 'Hello World',
        });
        expect(result.passed).toBe(true);
    });
});

describe('TextStrategy - dynamic and delayed content (web-first retry)', () => {
    it('passes when text appears after a small delay', async () => {
        const result = await run(
            mockLocator(['loading...', 'loading...', 'Done Content']),
            {
                operator: 'contains',
                expected: 'Done',
            },
            { timeout: 3000 },
        );
        expect(result.passed).toBe(true);
    });

    it('passes equals once delayed content settles', async () => {
        const result = await run(
            mockLocator(['', '', 'Final Value']),
            {
                operator: 'equals',
                expected: 'Final Value',
            },
            { timeout: 3000 },
        );
        expect(result.passed).toBe(true);
    });

    it('fails after deadline when content never matches', async () => {
        const result = await run(
            mockLocator(['stale', 'stale', 'stale']),
            {
                operator: 'equals',
                expected: 'fresh',
            },
            { timeout: 400 },
        );
        expect(result.passed).toBe(false);
    });

    it('reports absent when element is never attached', async () => {
        const result = await run(absentLocator(), {
            operator: 'contains',
            expected: 'anything',
        });
        expect(result.passed).toBe(false);
        expect(result.actual).toBe('absent');
    });
});

describe('TextStrategy - diagnostics', () => {
    it('includes operator, type and caseSensitive in the result', async () => {
        const result = await run(mockLocator(['Hello']), {
            operator: 'equals',
            expected: 'Bye',
            caseSensitive: true,
        });
        expect(result).toMatchObject({
            passed: false,
            operator: 'equals',
            type: 'text',
            caseSensitive: true,
        });
        expect(typeof result.expected).toBe('string');
    });

    it('starts_with and ends_with are registered operators', () => {
        expect(strategy.operators).toContain('starts_with');
        expect(strategy.operators).toContain('ends_with');
    });
});
