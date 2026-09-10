import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE importing strategies
vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(),
    convertPlaywrightLocator: vi.fn((sel) => sel),
}));

// Import strategies AFTER mock - they register on import
import { ExistenceStrategy } from '../plugins/core-assertion/engine/strategies/ExistenceStrategy.js';
import { VisibilityStrategy } from '../plugins/core-assertion/engine/strategies/VisibilityStrategy.js';
import { TextStrategy } from '../plugins/core-assertion/engine/strategies/TextStrategy.js';
import { CountStrategy } from '../plugins/core-assertion/engine/strategies/CountStrategy.js';

/**
 * Creates a mock locator with configurable behavior.
 * @param {Object} options
 * @param {number} options.count - Number of matching elements
 * @param {boolean} options.visible - Whether element is visible
 * @param {string} options.text - Element inner text
 * @param {boolean} options.waitForAttachedFail - Make waitFor throw for 'attached' state
 * @param {boolean} options.waitForVisibleFail - Make waitFor throw for 'visible' state
 * @param {boolean} options.countZeroWaitForFail - If count is 0, make waitFor reject (for exists operator)
 */
function createMockLocator(options = {}) {
    const {
        count = 1,
        visible = true,
        text = 'Sample text',
        waitForAttachedFail = false,
        waitForVisibleFail = false,
        countZeroWaitForFail = false,
    } = options;

    const waitFor = vi.fn(async (opts = {}) => {
        // Simulate waitFor throwing for 'attached' when element count is 0 and flag is set
        if (
            opts.state === 'attached' &&
            (waitForAttachedFail || (countZeroWaitForFail && count === 0))
        ) {
            throw new Error('timeout exceeded while waiting for locator');
        }
        if (opts.state === 'visible' && waitForVisibleFail) {
            throw new Error('timeout exceeded while waiting for locator to be visible');
        }
    });

    const base = {
        first: vi.fn(() => base),
        nth: vi.fn(() => base),
        locator: vi.fn(() => base),
        waitFor,
        count: vi.fn(async () => count),
        isVisible: vi.fn(async () => visible),
        innerText: vi.fn(async () => text),
        click: vi.fn(async () => {}),
    };
    return base;
}

describe('ExistenceStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new ExistenceStrategy();
    });

    it('should pass when element exists (operator: exists)', async () => {
        const locator = createMockLocator({ count: 1 });
        const result = await strategy.execute({}, locator, { operator: 'exists' });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('present');
        expect(result.expected).toBe('present');
    });

    it('should fail when element does not exist (operator: exists)', async () => {
        const locator = createMockLocator({ count: 0, countZeroWaitForFail: true });
        const result = await strategy.execute({}, locator, { operator: 'exists' });

        expect(result.passed).toBe(false);
        expect(result.actual).toBe('absent');
        expect(result.expected).toBe('present');
        expect(result.message).toContain('not found');
    });

    it('should pass when element is absent (operator: not_exists)', async () => {
        const locator = createMockLocator({ count: 0 });
        const result = await strategy.execute({}, locator, { operator: 'not_exists' });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('absent');
        expect(result.expected).toBe('absent');
    });

    it('should fail when element is present (operator: not_exists)', async () => {
        const locator = createMockLocator({ count: 2 });
        const result = await strategy.execute({}, locator, { operator: 'not_exists' });

        expect(result.passed).toBe(false);
        expect(result.actual).toBe('present');
        expect(result.expected).toBe('absent');
        expect(result.message).toContain('Expected element to be absent');
    });

    it('should default to exists operator', async () => {
        const locator = createMockLocator({ count: 1 });
        const result = await strategy.execute({}, locator, {});

        expect(result.passed).toBe(true);
    });
});

describe('VisibilityStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new VisibilityStrategy();
    });

    it('should pass when element is visible', async () => {
        const locator = createMockLocator({ count: 1, visible: true });
        const result = await strategy.execute({}, locator, { operator: 'visible' });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('visible');
    });

    it('should fail when element is not visible', async () => {
        const locator = createMockLocator({ count: 1, visible: false, waitForVisibleFail: true });
        const result = await strategy.execute({}, locator, { operator: 'visible' });

        expect(result.passed).toBe(false);
        expect(result.actual).toBe('hidden');
        expect(result.expected).toBe('visible');
    });

    it('should pass when element is hidden (operator: hidden)', async () => {
        const locator = createMockLocator({ count: 1, visible: false });
        const result = await strategy.execute({}, locator, { operator: 'hidden' });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('hidden');
    });

    it('should pass when element is absent (hidden per Playwright semantics)', async () => {
        const locator = createMockLocator({ count: 0 });
        const result = await strategy.execute({}, locator, { operator: 'hidden' });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('absent');
    });

    it('should fail when element is visible but hidden expected', async () => {
        const locator = createMockLocator({ count: 1, visible: true });
        const result = await strategy.execute({}, locator, { operator: 'hidden' });

        expect(result.passed).toBe(false);
        expect(result.actual).toBe('visible');
        expect(result.message).toContain('visible but expected to be hidden');
    });

    it('should default to visible operator', async () => {
        const locator = createMockLocator({ count: 1, visible: true });
        const result = await strategy.execute({}, locator, {});

        expect(result.passed).toBe(true);
    });
});

describe('TextStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new TextStrategy();
    });

    it('should pass when text contains expected substring', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello World' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'World',
        });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe('Hello World');
        expect(result.expected).toBe('World');
    });

    it('should pass when text equals expected', async () => {
        const locator = createMockLocator({ count: 1, text: 'Exact' });
        const result = await strategy.execute({}, locator, {
            operator: 'equals',
            expected: 'Exact',
        });

        expect(result.passed).toBe(true);
    });

    it('should fail when text does not contain expected', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'World',
        });

        expect(result.passed).toBe(false);
        expect(result.message).toContain('Expected text to contain');
    });

    it('should pass not_contains when text does not include expected', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'not_contains',
            expected: 'World',
        });

        expect(result.passed).toBe(true);
    });

    it('should fail not_contains when text includes expected', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello World' });
        const result = await strategy.execute({}, locator, {
            operator: 'not_contains',
            expected: 'World',
        });

        expect(result.passed).toBe(false);
    });

    it('should pass empty when text is empty', async () => {
        const locator = createMockLocator({ count: 1, text: '' });
        const result = await strategy.execute({}, locator, { operator: 'empty' });

        expect(result.passed).toBe(true);
    });

    it('should pass not_empty when text is not empty', async () => {
        const locator = createMockLocator({ count: 1, text: 'Content' });
        const result = await strategy.execute({}, locator, { operator: 'not_empty' });

        expect(result.passed).toBe(true);
    });

    it('should fail empty when text is not empty', async () => {
        const locator = createMockLocator({ count: 1, text: 'Content' });
        const result = await strategy.execute({}, locator, { operator: 'empty' });

        expect(result.passed).toBe(false);
        expect(result.message).toContain('Expected the element text to be empty');
    });

    it('should support caseSensitive option', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'hello',
            caseSensitive: true,
        });

        expect(result.passed).toBe(false);
    });

    it('should be case insensitive by default', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'hello',
            caseSensitive: false,
        });

        expect(result.passed).toBe(true);
    });

    it('should support regex operator', async () => {
        const locator = createMockLocator({ count: 1, text: 'Price: $123.45' });
        const result = await strategy.execute({}, locator, {
            operator: 'regex',
            expected: '\\$\\d+\\.\\d+',
        });

        expect(result.passed).toBe(true);
    });

    it('should support not_regex operator', async () => {
        const locator = createMockLocator({ count: 1, text: 'No numbers here' });
        const result = await strategy.execute({}, locator, {
            operator: 'not_regex',
            expected: '\\d+',
        });

        expect(result.passed).toBe(true);
    });

    it('should return error for invalid regex', async () => {
        const locator = createMockLocator({ count: 1, text: 'Anything' });
        const result = await strategy.execute({}, locator, {
            operator: 'regex',
            expected: '[invalid',
        });

        expect(result.passed).toBe(false);
        expect(result.message).toContain('Invalid regular expression');
    });

    it('should default to contains operator', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello World' });
        const result = await strategy.execute({}, locator, { expected: 'World' });

        expect(result.passed).toBe(true);
    });

    it('should fail gracefully when element not found', async () => {
        const locator = createMockLocator({ count: 0, waitForAttachedFail: true });
        const result = await strategy.execute({}, locator, { operator: 'contains', expected: 'x' });

        expect(result.passed).toBe(false);
        expect(result.message).toContain('was not found');
    });
});

describe('CountStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new CountStrategy();
    });

    it('should pass when count equals expected', async () => {
        const locator = createMockLocator({ count: 3 });
        const result = await strategy.execute({}, locator, { operator: 'equals', expected: 3 });

        expect(result.passed).toBe(true);
        expect(result.actual).toBe(3);
        expect(result.expected).toBe('3');
    });

    it('should fail when count not equals expected', async () => {
        const locator = createMockLocator({ count: 2 });
        const result = await strategy.execute({}, locator, { operator: 'equals', expected: 3 });

        expect(result.passed).toBe(false);
        expect(result.expected).toBe('3');
    });

    it('should pass greater_than when count is higher', async () => {
        const locator = createMockLocator({ count: 5 });
        const result = await strategy.execute({}, locator, {
            operator: 'greater_than',
            expected: 3,
        });

        expect(result.passed).toBe(true);
        expect(result.expected).toBe('> 3');
    });

    it('should fail greater_than when count is not higher', async () => {
        const locator = createMockLocator({ count: 2 });
        const result = await strategy.execute({}, locator, {
            operator: 'greater_than',
            expected: 3,
        });

        expect(result.passed).toBe(false);
    });

    it('should pass less_than when count is lower', async () => {
        const locator = createMockLocator({ count: 2 });
        const result = await strategy.execute({}, locator, { operator: 'less_than', expected: 3 });

        expect(result.passed).toBe(true);
    });

    it('should pass greater_or_equal when count equals expected', async () => {
        const locator = createMockLocator({ count: 3 });
        const result = await strategy.execute({}, locator, {
            operator: 'greater_or_equal',
            expected: 3,
        });

        expect(result.passed).toBe(true);
    });

    it('should pass less_or_equal when count equals expected', async () => {
        const locator = createMockLocator({ count: 3 });
        const result = await strategy.execute({}, locator, {
            operator: 'less_or_equal',
            expected: 3,
        });

        expect(result.passed).toBe(true);
    });

    it('should pass between when count in range', async () => {
        const locator = createMockLocator({ count: 5 });
        const result = await strategy.execute({}, locator, {
            operator: 'between',
            min: 3,
            max: 10,
        });

        expect(result.passed).toBe(true);
        expect(result.expected).toBe('between 3 and 10');
    });

    it('should fail between when count outside range', async () => {
        const locator = createMockLocator({ count: 1 });
        const result = await strategy.execute({}, locator, {
            operator: 'between',
            min: 3,
            max: 10,
        });

        expect(result.passed).toBe(false);
    });

    it('should default to equals operator', async () => {
        const locator = createMockLocator({ count: 2 });
        const result = await strategy.execute({}, locator, { expected: 2 });

        expect(result.passed).toBe(true);
    });
});
