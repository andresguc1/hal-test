import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE importing strategies
vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(),
    convertPlaywrightLocator: vi.fn((sel) => sel),
}));

// Import strategies AFTER mock
import { AttributeStrategy } from '../plugins/core-assertion/engine/strategies/AttributeStrategy.js';
import { ValueStrategy } from '../plugins/core-assertion/engine/strategies/ValueStrategy.js';
import { StateStrategy } from '../plugins/core-assertion/engine/strategies/StateStrategy.js';
import { CSSPropertyStrategy } from '../plugins/core-assertion/engine/strategies/CSSPropertyStrategy.js';
import { PageStrategy } from '../plugins/core-assertion/engine/strategies/PageStrategy.js';

function createMockLocator(options = {}, overrides = {}) {
    const {
        count = 1,
        visible = true,
        text = 'Sample text',
        value = 'input value',
        attribute = 'attr-value',
        waitForAttachedFail = false,
        waitForVisibleFail = false,
        countZeroWaitForFail = false,
    } = options;

    const waitFor = vi.fn(async (opts = {}) => {
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
        inputValue: vi.fn(async () => value),
        getAttribute: vi.fn(async (name) => (name === 'test-attr' ? attribute : null)),
        click: vi.fn(async () => {}),
        isEnabled: vi.fn(async () => true),
        isChecked: vi.fn(async () => false),
        evaluate: vi.fn(async (fn) => {
            if (fn.toString().includes('activeElement')) return false;
            if (fn.toString().includes('readOnly')) return false;
            if (fn.toString().includes('required')) return false;
            if (fn.toString().includes('selected')) return false;
            if (fn.toString().includes('getComputedStyle')) {
                const style = {
                    getPropertyValue: vi.fn((prop) => {
                        if (prop === 'display') return 'block';
                        if (prop === 'color') return 'rgb(0, 0, 0)';
                        if (prop === 'font-size') return '16px';
                        return '';
                    }),
                };
                return fn({ style });
            }
            return true;
        }),
        ...overrides,
    };
    return base;
}

function createMockPage() {
    return {
        url: vi.fn(() => 'https://example.com/path?query=1'),
        title: vi.fn(async () => 'Example Page Title'),
    };
}

describe('AttributeStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new AttributeStrategy();
    });

    it('should pass when attribute equals expected', async () => {
        const locator = createMockLocator({ attribute: 'expected-value' });
        const result = await strategy.execute({}, locator, {
            operator: 'equals',
            expected: 'expected-value',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
        expect(result.actual).toBe('expected-value');
    });

    it('should fail when attribute does not equal expected', async () => {
        const locator = createMockLocator({ attribute: 'actual-value' });
        const result = await strategy.execute({}, locator, {
            operator: 'equals',
            expected: 'expected-value',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(false);
    });

    it('should pass when attribute contains expected', async () => {
        const locator = createMockLocator({ attribute: 'prefix-value-suffix' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'value',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass not_contains when attribute does not include expected', async () => {
        const locator = createMockLocator({ attribute: 'hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'not_contains',
            expected: 'world',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass empty when attribute is missing', async () => {
        const locator = createMockLocator({ attribute: null });
        const result = await strategy.execute({}, locator, {
            operator: 'empty',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass not_empty when attribute exists', async () => {
        const locator = createMockLocator({ attribute: 'value' });
        const result = await strategy.execute({}, locator, {
            operator: 'not_empty',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
    });

    it('should fail when attribute is required but missing', async () => {
        const locator = createMockLocator({});
        const result = await strategy.execute({}, locator, { operator: 'equals', expected: 'x' });
        expect(result.passed).toBe(false);
        expect(result.message).toContain('Attribute name is required');
    });

    it('should support caseSensitive option', async () => {
        const locator = createMockLocator({ attribute: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'hello',
            attribute: 'test-attr',
            caseSensitive: true,
        });
        expect(result.passed).toBe(false);
    });

    it('should support regex operator', async () => {
        const locator = createMockLocator({ attribute: 'Price: $123.45' });
        const result = await strategy.execute({}, locator, {
            operator: 'regex',
            expected: '\\$\\d+\\.\\d+',
            attribute: 'test-attr',
        });
        expect(result.passed).toBe(true);
    });
});

describe('ValueStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new ValueStrategy();
    });

    it('should pass when value equals expected', async () => {
        const locator = createMockLocator({ value: 'expected-value' });
        const result = await strategy.execute({}, locator, {
            operator: 'equals',
            expected: 'expected-value',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass when value contains expected', async () => {
        const locator = createMockLocator({ value: 'prefix-value-suffix' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'value',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass empty when value is empty', async () => {
        const locator = createMockLocator({ value: '' });
        const result = await strategy.execute({}, locator, { operator: 'empty' });
        expect(result.passed).toBe(true);
    });

    it('should support caseSensitive option', async () => {
        const locator = createMockLocator({ value: 'Hello' });
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: 'hello',
            caseSensitive: true,
        });
        expect(result.passed).toBe(false);
    });
});

describe('StateStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new StateStrategy();
    });

    it('should pass when element is enabled', async () => {
        const locator = createMockLocator({});
        locator.isEnabled.mockResolvedValue(true);
        const result = await strategy.execute({}, locator, { operator: 'enabled' });
        expect(result.passed).toBe(true);
    });

    it('should fail when element is disabled', async () => {
        const locator = createMockLocator({});
        locator.isEnabled.mockResolvedValue(false);
        const result = await strategy.execute({}, locator, { operator: 'enabled' });
        expect(result.passed).toBe(false);
    });

    it('should pass when element is disabled (operator: disabled)', async () => {
        const locator = createMockLocator({});
        locator.isEnabled.mockResolvedValue(false);
        const result = await strategy.execute({}, locator, { operator: 'disabled' });
        expect(result.passed).toBe(true);
    });

    it('should pass when checkbox is checked', async () => {
        const locator = createMockLocator({});
        locator.isChecked.mockResolvedValue(true);
        const result = await strategy.execute({}, locator, { operator: 'checked' });
        expect(result.passed).toBe(true);
    });

    it('should pass when checkbox is unchecked (operator: unchecked)', async () => {
        const locator = createMockLocator({});
        locator.isChecked.mockResolvedValue(false);
        const result = await strategy.execute({}, locator, { operator: 'unchecked' });
        expect(result.passed).toBe(true);
    });

    it('should pass when option is selected', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValueOnce(true);
        const result = await strategy.execute({}, locator, { operator: 'selected' });
        expect(result.passed).toBe(true);
    });

    it('should pass when element is focused', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValueOnce(true);
        const result = await strategy.execute({}, locator, { operator: 'focused' });
        expect(result.passed).toBe(true);
    });

    it('should pass when element is readonly', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValueOnce(true);
        const result = await strategy.execute({}, locator, { operator: 'readonly' });
        expect(result.passed).toBe(true);
    });

    it('should pass when element is required', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValueOnce(true);
        const result = await strategy.execute({}, locator, { operator: 'required' });
        expect(result.passed).toBe(true);
    });

    it('should default to enabled operator', async () => {
        const locator = createMockLocator({});
        locator.isEnabled.mockResolvedValue(true);
        const result = await strategy.execute({}, locator, {});
        expect(result.passed).toBe(true);
    });

    it('should fail gracefully when element not found', async () => {
        const locator = createMockLocator({ count: 0, waitForAttachedFail: true });
        const result = await strategy.execute({}, locator, { operator: 'enabled' });
        expect(result.passed).toBe(false);
        expect(result.message).toContain('was not found');
    });
});

describe('CSSPropertyStrategy', () => {
    let strategy;

    beforeEach(() => {
        strategy = new CSSPropertyStrategy();
    });

    it('should pass when CSS property equals expected', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValue('block');
        const result = await strategy.execute({}, locator, {
            operator: 'equals',
            expected: 'block',
            cssProperty: 'display',
        });
        expect(result.passed).toBe(true);
    });

    it('should pass when CSS property contains expected', async () => {
        const locator = createMockLocator({});
        locator.evaluate.mockResolvedValue('rgb(255, 0, 0)');
        const result = await strategy.execute({}, locator, {
            operator: 'contains',
            expected: '255',
            cssProperty: 'color',
        });
        expect(result.passed).toBe(true);
    });

    it('should fail when CSS property missing', async () => {
        const locator = createMockLocator({});
        const result = await strategy.execute({}, locator, { operator: 'equals', expected: 'x' });
        expect(result.passed).toBe(false);
        expect(result.message).toContain('CSS property name is required');
    });
});

describe('PageStrategy', () => {
    let strategy;
    let page;

    beforeEach(() => {
        strategy = new PageStrategy();
        page = createMockPage();
    });

    it('should pass when URL equals expected', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'url_equals', expected: 'https://example.com/path?query=1' },
        );
        expect(result.passed).toBe(true);
    });

    it('should pass when URL contains expected', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'url_contains', expected: 'example.com' },
        );
        expect(result.passed).toBe(true);
    });

    it('should pass when URL not contains expected', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'url_not_contains', expected: 'other.com' },
        );
        expect(result.passed).toBe(true);
    });

    it('should pass when title equals expected', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'title_equals', expected: 'Example Page Title' },
        );
        expect(result.passed).toBe(true);
    });

    it('should pass when title contains expected', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'title_contains', expected: 'Example' },
        );
        expect(result.passed).toBe(true);
    });

    it('should support regex on URL', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'url_regex', expected: 'https?://example\\.com/.*' },
        );
        expect(result.passed).toBe(true);
    });

    it('should support regex on title', async () => {
        const result = await strategy.execute(
            page,
            {},
            { operator: 'title_regex', expected: 'Example.*Title' },
        );
        expect(result.passed).toBe(true);
    });
});
