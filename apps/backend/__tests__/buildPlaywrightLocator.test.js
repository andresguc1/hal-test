import { describe, it, expect, vi } from 'vitest';
import {
    buildPlaywrightLocator,
    convertPlaywrightLocator,
    normalizeSelectorForDotId,
} from '../core/selector-utils.js';

describe('buildPlaywrightLocator', () => {
    const createMockPage = () => ({
        locator: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByTestId: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByPlaceholder: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByLabel: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByAltText: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByTitle: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByText: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
        getByRole: vi.fn(() => ({
            click: vi.fn(),
            fill: vi.fn(),
            type: vi.fn(),
            waitFor: vi.fn(),
            isVisible: vi.fn(),
            scrollIntoViewIfNeeded: vi.fn(),
            evaluate: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
        })),
    });

    it('should parse getByTestId', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByTestId('submit-button')");
        expect(page.getByTestId).toHaveBeenCalledWith('submit-button');
        expect(locator).toBeDefined();
    });

    it('should parse getByPlaceholder', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByPlaceholder('Enter email')");
        expect(page.getByPlaceholder).toHaveBeenCalledWith('Enter email');
        expect(locator).toBeDefined();
    });

    it('should parse getByLabel', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByLabel('Username')");
        expect(page.getByLabel).toHaveBeenCalledWith('Username');
        expect(locator).toBeDefined();
    });

    it('should parse getByAltText', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByAltText('Company Logo')");
        expect(page.getByAltText).toHaveBeenCalledWith('Company Logo');
        expect(locator).toBeDefined();
    });

    it('should parse getByTitle', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByTitle('Close dialog')");
        expect(page.getByTitle).toHaveBeenCalledWith('Close dialog');
        expect(locator).toBeDefined();
    });

    it('should parse getByText', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByText('Submit')");
        expect(page.getByText).toHaveBeenCalledWith('Submit');
        expect(locator).toBeDefined();
    });

    it('should parse getByRole without name', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByRole('button')");
        expect(page.getByRole).toHaveBeenCalledWith('button');
        expect(locator).toBeDefined();
    });

    it('should parse getByRole with name', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, "getByRole('button', { name: 'Save' })");
        expect(page.getByRole).toHaveBeenCalledWith('button', { name: 'Save' });
        expect(locator).toBeDefined();
    });

    it('should fallback to page.locator for CSS selectors', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, '#submit-button');
        expect(page.locator).toHaveBeenCalledWith('#submit-button');
        expect(locator).toBeDefined();
    });

    it('should fallback to page.locator for unknown strings', () => {
        const page = createMockPage();
        const locator = buildPlaywrightLocator(page, 'button.submit');
        expect(page.locator).toHaveBeenCalledWith('button.submit');
        expect(locator).toBeDefined();
    });

    it('should parse chained locator with page.getByRole', () => {
        const page = createMockPage();
        const dialogLocator = { getByRole: vi.fn(() => ({ count: vi.fn().mockResolvedValue(2) })) };
        page.getByRole = vi.fn(() => dialogLocator);
        const locator = buildPlaywrightLocator(
            page,
            "page.getByRole('dialog', { name: 'Checkout' }).getByRole('button', { name: 'Save' })",
        );
        expect(page.getByRole).toHaveBeenCalledWith('dialog', { name: 'Checkout' });
        expect(dialogLocator.getByRole).toHaveBeenCalledWith('button', { name: 'Save' });
        expect(locator).toBeDefined();
    });
});

describe('convertPlaywrightLocator', () => {
    it('should pass through getByTestId', () => {
        expect(convertPlaywrightLocator("getByTestId('foo')")).toBe("getByTestId('foo')");
    });

    it('should pass through getByPlaceholder', () => {
        expect(convertPlaywrightLocator("getByPlaceholder('foo')")).toBe("getByPlaceholder('foo')");
    });

    it('should pass through getByLabel', () => {
        expect(convertPlaywrightLocator("getByLabel('foo')")).toBe("getByLabel('foo')");
    });

    it('should pass through getByAltText', () => {
        expect(convertPlaywrightLocator("getByAltText('foo')")).toBe("getByAltText('foo')");
    });

    it('should pass through getByTitle', () => {
        expect(convertPlaywrightLocator("getByTitle('foo')")).toBe("getByTitle('foo')");
    });

    it('should pass through getByText', () => {
        expect(convertPlaywrightLocator("getByText('foo')")).toBe("getByText('foo')");
    });

    it('should pass through getByRole', () => {
        expect(convertPlaywrightLocator("getByRole('button')")).toBe("getByRole('button')");
    });

    it('should pass through CSS selectors unchanged', () => {
        expect(convertPlaywrightLocator('#foo')).toBe('#foo');
    });

    it('should handle null/undefined', () => {
        expect(convertPlaywrightLocator(null)).toBe(null);
        expect(convertPlaywrightLocator(undefined)).toBe(undefined);
    });
});

describe('normalizeSelectorForDotId', () => {
    it('should return non-CSS selectors unchanged', async () => {
        const page = {
            locator: vi.fn(() => ({ count: vi.fn().mockResolvedValue(0) })),
        };
        const result = await normalizeSelectorForDotId(page, "getByTestId('foo')");
        expect(result).toBe("getByTestId('foo')");
        expect(page.locator).not.toHaveBeenCalled();
    });

    it('should return CSS selectors that work unchanged', async () => {
        const page = {
            locator: vi.fn(() => ({ count: vi.fn().mockResolvedValue(1) })),
        };
        const result = await normalizeSelectorForDotId(page, '#foo.bar');
        expect(result).toBe('#foo.bar');
    });
});
