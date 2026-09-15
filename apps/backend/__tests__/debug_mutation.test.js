import { describe, it, vi } from 'vitest';
import { PageStrategy } from '../plugins/core-assertion/engine/strategies/PageStrategy.js';
import { assertionEngine } from '../plugins/core-assertion/engine/AssertionEngine.js';

function createMockPage() {
    return {
        url: vi.fn(() => 'https://the-internet.herokuapp.com/dynamic_content'),
        title: vi.fn(async () => 'Test Page'),
    };
}

describe('Debug mutation issue', () => {
    let strategy;
    let page;

    beforeEach(() => {
        strategy = new PageStrategy();
        page = createMockPage();
    });

    it('should test exact user scenario', async () => {
        const assertion1 = {
            operator: 'url_equals',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        console.log('Before execution:', JSON.stringify(assertion1, null, 2));
        const result1 = await strategy.execute(page, {}, assertion1, {});
        console.log('After execution:', JSON.stringify(assertion1, null, 2));
        console.log('Result:', JSON.stringify(result1, null, 2));
    });

    it('should test multiple assertions through engine', async () => {
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

        console.log('Before execution:', JSON.stringify(assertions, null, 2));
        const results = await assertionEngine.evaluate({
            page: createMockPage(),
            locator: {},
            assertions,
            options: {},
            variables: {},
        });
        console.log('After execution:', JSON.stringify(assertions, null, 2));
        console.log('Results:', JSON.stringify(results, null, 2));
    });
});
