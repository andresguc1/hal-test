import { describe, it, expect } from 'vitest';
import { NodeMapperRegistry } from '../services/exporter/core/GeneratorRegistry.js';
import { PlaywrightGenerator } from '../services/exporter/generators/PlaywrightGenerator.js';

/**
 * Regression tests for the Playwright code generated from unified `assert`
 * text assertions. Guards the web-first output contract:
 *  - toHaveText / toContainText (never the non-existent toMatchText)
 *  - case sensitivity via ignoreCase / regex 'i' flag
 *  - whitespace/line-break parity via useInnerText:true
 *  - anchored regex for starts_with / ends_with
 *  - sanitized regex flags
 *  - valid merged options object when timeout + ignoreCase are combined
 *  - `expect` is imported in flat exports that contain assertions
 */
describe('Assert text codegen (Playwright, unified assert node)', () => {
    const mapper = NodeMapperRegistry.getMapper('assert');

    const textCode = ({
        operator,
        expected = 'Hello',
        caseSensitive = false,
        regex = false,
        regexFlags = '',
        timeout = 5000,
    }) => {
        const params = {
            actionType: 'assert',
            target: { selector: '#msg', scope: 'element' },
            timeout,
            assertions: [
                {
                    type: 'text',
                    operator,
                    expected,
                    caseSensitive,
                    regex,
                    regexFlags,
                },
            ],
        };
        return mapper.getCode(params, 'javascript');
    };

    it('equals (case-insensitive) uses Cypress-contains toContainText with ignoreCase', () => {
        const code = textCode({ operator: 'equals', expected: 'Welcome' });
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).toContainText(`Welcome`, { ignoreCase: true, useInnerText: true });',
        );
        expect(code).not.toContain('toMatchText');
    });

    it('equals with timeout keeps a single valid options object', () => {
        const code = textCode({ operator: 'equals', expected: 'Welcome', timeout: 3000 });
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).toContainText(`Welcome`, { timeout: 3000, ignoreCase: true, useInnerText: true });',
        );
        // No trailing second options block that would break the statement.
        expect(code).not.toMatch(/},\{ timeout:/);
    });

    it('equals case-sensitive emits only useInnerText', () => {
        const code = textCode({ operator: 'equals', expected: 'Welcome', caseSensitive: true });
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).toContainText(`Welcome`, { useInnerText: true });',
        );
    });

    it('not_equals maps to not.toContainText', () => {
        const code = textCode({ operator: 'not_equals', expected: 'Welcome' });
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).not.toContainText(`Welcome`, { ignoreCase: true, useInnerText: true });',
        );
    });

    it('contains uses toContainText with ignoreCase', () => {
        const code = textCode({ operator: 'contains', expected: 'modal window' });
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).toContainText(`modal window`, { ignoreCase: true, useInnerText: true });',
        );
    });

    it('starts_with emits anchored regex toHaveText', () => {
        const code = textCode({ operator: 'starts_with', expected: 'This is a modal' });
        expect(code).toContain(
            "await expect(page.locator(`#msg`)).toHaveText(new RegExp(`^This is a modal`, 'i'));",
        );
    });

    it('starts_with escapes regex metacharacters in the literal', () => {
        const code = textCode({ operator: 'starts_with', expected: '(modal) [x]' });
        expect(code).toContain('toHaveText(new RegExp(`^');
        const match = code.match(/toHaveText\(new RegExp\(`\^([^`]+)`, 'i'\)\)/);
        expect(match).toBeTruthy();
        // Double backslashes in the generated template literal render to the
        // actual RegExp source: `\(modal\) \[x\]` matches the literal text.
        const rendered = match[1].replace(/\\(.)/g, '$1');
        expect(rendered).toBe('\\(modal\\) \\[x\\]');
    });

    it('ends_with emits anchored regex toHaveText', () => {
        const code = textCode({ operator: 'ends_with', expected: 'close' });
        expect(code).toContain(
            "await expect(page.locator(`#msg`)).toHaveText(new RegExp(`close$`, 'i'));",
        );
    });

    it('regex uses toHaveText(new RegExp(...)) not toMatchText', () => {
        const code = textCode({ operator: 'regex', expected: '\\d+', caseSensitive: true });
        expect(code).toContain(
            "await expect(page.locator(`#msg`)).toHaveText(new RegExp(`\\\\d+`, ''));",
        );
        expect(code).not.toContain('toMatchText');
    });

    it('not_regex sanitizes invalid flags and adds ignoreCase', () => {
        const code = textCode({ operator: 'not_regex', expected: '\\d+', regexFlags: 'xyzg' });
        // 'xyzg' → invalid chars removed, valid subset 'yg' survives; the
        // case-insensitive default appends 'i'. Flag pollution (e.g. pattern
        // characters like '/+/$') is stripped before building the RegExp.
        expect(code).toContain("not.toHaveText(new RegExp(`\\\\d+`, 'ygi'))");
    });

    it('empty / not_empty map to toHaveText toggles', () => {
        expect(textCode({ operator: 'empty' })).toContain(
            "await expect(page.locator(`#msg`)).toHaveText('');",
        );
        expect(textCode({ operator: 'not_empty' })).toContain(
            "await expect(page.locator(`#msg`)).not.toHaveText('');",
        );
    });
});

describe('Flat export header imports expect when assertions exist', () => {
    const gen = () => new PlaywrightGenerator('javascript', 'en');

    const assertStep = {
        type: 'assert',
        data: {
            configuration: {
                target: { selector: '#msg', scope: 'element' },
                assertions: [{ type: 'text', operator: 'contains', expected: 'Hi' }],
            },
        },
    };

    it('adds expect import and never emits toMatchText', () => {
        const { code } = gen().generate([assertStep]);
        expect(code).toContain("import { test, expect } from '@playwright/test';");
        expect(code).toContain(
            'await expect(page.locator(`#msg`)).toContainText(`Hi`, { ignoreCase: true, useInnerText: true })',
        );
        expect(code).not.toContain('toMatchText');
    });

    it('omits expect import for flows without assertions', () => {
        const { code } = gen().generate([{ type: 'go_back', data: { configuration: {} } }]);
        expect(code).toContain("import { test } from '@playwright/test';");
        expect(code).not.toContain('import { test, expect }');
    });
});
