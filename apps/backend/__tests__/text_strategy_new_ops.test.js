import { describe, it, expect, beforeAll, vi } from 'vitest';
import { TextStrategy } from '../plugins/core-assertion/engine/strategies/TextStrategy.js';

describe('TextStrategy - new operators', () => {
    let strategy;
    let page;

    beforeAll(() => {
        strategy = new TextStrategy();
        page = {
            url: vi.fn(() => 'https://the-internet.herokuapp.com/entry_ad'),
            title: vi.fn(async () => 'Test Page'),
        };
    });

    function createMockLocator(text) {
        return {
            waitFor: vi.fn(async () => {}),
            innerText: vi.fn(async () => text),
        };
    }

    it('should pass with starts_with when text starts with expected', async () => {
        const locator = createMockLocator('THIS IS A MODAL WINDOW\n\nSome description\n\nClose');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'starts_with',
                expected: 'THIS IS A MODAL WINDOW',
            },
            {},
        );
        expect(result.passed).toBe(true);
    });

    it('should fail with starts_with when text does not start with expected', async () => {
        const locator = createMockLocator('Some other text\n\nTHIS IS A MODAL WINDOW');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'starts_with',
                expected: 'THIS IS A MODAL WINDOW',
            },
            {},
        );
        expect(result.passed).toBe(false);
    });

    it('should pass with ends_with when text ends with expected', async () => {
        const locator = createMockLocator('Some description\n\nClose');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'ends_with',
                expected: 'Close',
            },
            {},
        );
        expect(result.passed).toBe(true);
    });

    it('should fail with ends_with when text does not end with expected', async () => {
        const locator = createMockLocator('Close\n\nSome description');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'ends_with',
                expected: 'Close',
            },
            {},
        );
        expect(result.passed).toBe(false);
    });

    it('should support caseSensitive with starts_with', async () => {
        const locator = createMockLocator('THIS IS A MODAL WINDOW');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'starts_with',
                expected: 'this is a modal window',
                caseSensitive: true,
            },
            {},
        );
        expect(result.passed).toBe(false); // Case sensitive, so lowercase won't match uppercase
    });

    it('should support caseSensitive false with starts_with', async () => {
        const locator = createMockLocator('THIS IS A MODAL WINDOW');
        const result = await strategy.execute(
            page,
            locator,
            {
                operator: 'starts_with',
                expected: 'this is a modal window',
                caseSensitive: false,
            },
            {},
        );
        expect(result.passed).toBe(true); // Case insensitive, so lowercase matches uppercase
    });
});
