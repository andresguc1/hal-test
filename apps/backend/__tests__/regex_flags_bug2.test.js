import { describe, it, beforeEach, vi } from 'vitest';
import { PageStrategy } from '../plugins/core-assertion/engine/strategies/PageStrategy.js';

function createMockPage() {
    return {
        url: vi.fn(() => 'https://the-internet.herokuapp.com/dynamic_content'),
        title: vi.fn(async () => 'Test Page'),
    };
}

describe('PageStrategy - deeper bug investigation', () => {
    let strategy;
    let page;

    beforeEach(() => {
        strategy = new PageStrategy();
        page = createMockPage();
    });

    it('should test exact user scenario: url_equals with regex=true, pattern=/dynamic_content', async () => {
        const assertion = {
            operator: 'url_equals',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Result:', JSON.stringify(result, null, 2));
        // Should test against the URL with the literal pattern "/dynamic_content"
    });

    it('should test with url_contains operator', async () => {
        const assertion = {
            operator: 'url_contains',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Result:', JSON.stringify(result, null, 2));
    });

    it('should test the exact error scenario: pattern with [^/]+$ and flags contamination', async () => {
        // First, let's see if there's any state being shared
        const assertion1 = {
            operator: 'url_regex',
            expected: '[^/]+$',
            regex: true,
            regexFlags: 'i',
            caseSensitive: false,
        };

        await strategy.execute(page, {}, assertion1, {});
        console.log('Test assertion1:', JSON.stringify(assertion1, null, 2));

        const assertion2 = {
            operator: 'url_equals',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result2 = await strategy.execute(page, {}, assertion2, {});
        console.log('Test assertion2:', JSON.stringify(assertion2, null, 2));
        console.log('Result2:', JSON.stringify(result2, null, 2));
    });

    it('should test multiple assertions in sequence through AssertionEngine', async () => {
        const { assertionEngine } =
            await import('../plugins/core-assertion/engine/AssertionEngine.js');

        const assertions = [
            {
                type: 'page',
                operator: 'url_regex',
                expected: '[^/]+$',
                regex: true,
                regexFlags: 'i',
                caseSensitive: false,
            },
            {
                type: 'page',
                operator: 'url_equals',
                expected: '/dynamic_content',
                regex: true,
                regexFlags: '',
                caseSensitive: true,
            },
        ];

        const results = await assertionEngine.evaluate({
            page,
            locator: {},
            assertions,
            options: {},
            variables: {},
        });

        console.log('Results:', JSON.stringify(results, null, 2));
    });
});
