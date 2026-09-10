import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the core dependencies BEFORE importing the engine
vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(),
    convertPlaywrightLocator: vi.fn((sel) => sel),
}));

// Import engine AFTER mock - strategies register on import
import { buildPlaywrightLocator } from '../core/selector-utils.js';
import { assertionEngine } from '../plugins/core-assertion/engine/AssertionEngine.js';

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

describe('AssertionEngine', () => {
    beforeEach(() => {
        buildPlaywrightLocator.mockReset();
    });

    it('should have registered default strategies', () => {
        expect(assertionEngine.hasStrategy('existence')).toBe(true);
        expect(assertionEngine.hasStrategy('visibility')).toBe(true);
        expect(assertionEngine.hasStrategy('text')).toBe(true);
        expect(assertionEngine.hasStrategy('count')).toBe(true);
    });

    it('should evaluate a single existence assertion (exists)', async () => {
        const locator = createMockLocator({ count: 1 });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'existence', operator: 'exists' }],
        });

        expect(results).toHaveLength(1);
        expect(results[0].passed).toBe(true);
        expect(results[0].type).toBe('existence');
        expect(results[0].operator).toBe('exists');
    });

    it('should evaluate a single existence assertion (not_exists) when absent', async () => {
        const locator = createMockLocator({ count: 0 });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'existence', operator: 'not_exists' }],
        });

        expect(results[0].passed).toBe(true);
        expect(results[0].actual).toBe('absent');
    });

    it('should evaluate visibility assertion (visible)', async () => {
        const locator = createMockLocator({ count: 1, visible: true });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'visibility', operator: 'visible' }],
        });

        expect(results[0].passed).toBe(true);
        expect(results[0].actual).toBe('visible');
    });

    it('should evaluate visibility assertion (hidden) when element is hidden', async () => {
        const locator = createMockLocator({ count: 1, visible: false });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'visibility', operator: 'hidden' }],
        });

        expect(results[0].passed).toBe(true);
        expect(results[0].actual).toBe('hidden');
    });

    it('should evaluate text assertion (contains)', async () => {
        const locator = createMockLocator({ count: 1, text: 'Hello World' });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'text', operator: 'contains', expected: 'World' }],
        });

        expect(results[0].passed).toBe(true);
        expect(results[0].actual).toBe('Hello World');
    });

    it('should evaluate text assertion (equals)', async () => {
        const locator = createMockLocator({ count: 1, text: 'Exact Match' });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'text', operator: 'equals', expected: 'Exact Match' }],
        });

        expect(results[0].passed).toBe(true);
    });

    it('should evaluate count assertion (equals)', async () => {
        const locator = createMockLocator({ count: 3 });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'count', operator: 'equals', expected: 3 }],
        });

        expect(results[0].passed).toBe(true);
        expect(results[0].actual).toBe(3);
    });

    it('should evaluate multiple assertions in one call', async () => {
        const locator = createMockLocator({ count: 2, visible: true, text: 'Item 1' });
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [
                { type: 'count', operator: 'equals', expected: 2 },
                { type: 'visibility', operator: 'visible' },
                { type: 'text', operator: 'contains', expected: 'Item' },
            ],
        });

        expect(results).toHaveLength(3);
        expect(results.every((r) => r.passed)).toBe(true);
    });

    it('should return skipped result for unknown strategy type', async () => {
        const locator = createMockLocator({});
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ type: 'unknown_type', operator: 'equals' }],
        });

        expect(results[0].passed).toBe(false);
        expect(results[0].skipped).toBe(true);
        expect(results[0].message).toContain('No assertion strategy registered');
    });

    it('should return skipped result for missing type', async () => {
        const locator = createMockLocator({});
        buildPlaywrightLocator.mockReturnValue(locator);

        const results = await assertionEngine.evaluate({
            page: {},
            locator,
            assertions: [{ operator: 'equals' }],
        });

        expect(results[0].passed).toBe(false);
        expect(results[0].skipped).toBe(true);
        expect(results[0].message).toContain('missing a "type"');
    });
});
