import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageStrategy } from '../plugins/core-assertion/engine/strategies/PageStrategy.js';

function createMockPage() {
    return {
        url: vi.fn(() => 'https://the-internet.herokuapp.com/dynamic_content'),
        title: vi.fn(async () => 'Test Page'),
    };
}

describe('PageStrategy - regex/flags bug reproduction', () => {
    let strategy;
    let page;

    beforeEach(() => {
        strategy = new PageStrategy();
        page = createMockPage();
    });

    it('should handle regex with empty flags and caseSensitive=true', async () => {
        const assertion = {
            operator: 'url_regex',
            expected: '[^/]+$',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Test 1 result:', JSON.stringify(result, null, 2));
        expect(result.passed).toBe(true);
    });

    it('should handle regex with flags=i and caseSensitive=true', async () => {
        const assertion = {
            operator: 'url_regex',
            expected: '[^/]+$',
            regex: true,
            regexFlags: 'i',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Test 2 result:', JSON.stringify(result, null, 2));
        expect(result.passed).toBe(true);
    });

    it('should handle regex with pattern containing forward slash and empty flags', async () => {
        const assertion = {
            operator: 'url_regex',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Test 3 result:', JSON.stringify(result, null, 2));
        // This should fail because the pattern has literal / that needs to be escaped
        // But it should NOT produce "Invalid flags" error
    });

    it('should handle url_equals with regex=true', async () => {
        const assertion = {
            operator: 'url_equals',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result = await strategy.execute(page, {}, assertion, {});
        console.log('Test 4 result:', JSON.stringify(result, null, 2));
    });

    it('should demonstrate the bug: regexFlags being contaminated', async () => {
        // This simulates what happens when multiple assertions run
        // and the assertion object gets mutated
        const assertion1 = {
            operator: 'url_regex',
            expected: '[^/]+$',
            regex: true,
            regexFlags: 'i',
            caseSensitive: false,
        };

        const result1 = await strategy.execute(page, {}, assertion1, {});
        console.log('Test 5a - First assertion result:', JSON.stringify(result1, null, 2));

        // Now check if assertion1 was mutated
        console.log('Test 5a - After execution, assertion1:', JSON.stringify(assertion1, null, 2));

        // Run second assertion
        const assertion2 = {
            operator: 'url_regex',
            expected: '/dynamic_content',
            regex: true,
            regexFlags: '',
            caseSensitive: true,
        };

        const result2 = await strategy.execute(page, {}, assertion2, {});
        console.log('Test 5b - Second assertion result:', JSON.stringify(result2, null, 2));
    });
});
