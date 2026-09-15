import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageStrategy } from '../plugins/core-assertion/engine/strategies/PageStrategy.js';
import { assertionEngine } from '../plugins/core-assertion/engine/AssertionEngine.js';

function createMockPage() {
    return {
        url: vi.fn(() => 'https://the-internet.herokuapp.com/dynamic_content'),
        title: vi.fn(async () => 'Test Page'),
    };
}

describe('PageStrategy - exact user bug scenario', () => {
    let strategy;
    let page;

    beforeEach(() => {
        strategy = new PageStrategy();
        page = createMockPage();
    });

    it('EXACT USER SCENARIO: url_equals with regex=true, expected="/dynamic_content", caseSensitive=true, regexFlags=""', async () => {
        const assertion = {
            operator: 'url_equals',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('User Scenario Result:', JSON.stringify(result, null, 2));
    });

    it('EXACT USER SCENARIO with multiple assertions through engine', async () => {
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
            page: createMockPage(),
            locator: {},
            assertions,
            options: {},
            variables: {},
        });

        console.log('Multiple assertions results:', JSON.stringify(results, null, 2));
    });

    it('should test the exact error: pattern=/dynamic_content, flags=[^/]+$i', async () => {
        // This simulates what would happen if flags got contaminated
        const flags = '[^/]+$i';
        const expected = '/dynamic_content';

        try {
            const regex = new RegExp(expected, flags);
            console.log('Regex created successfully:', regex);
        } catch (err) {
            console.log('Expected error:', err.message);
            expect(err.message).toContain('Invalid flags supplied to RegExp constructor');
        }
    });
});
