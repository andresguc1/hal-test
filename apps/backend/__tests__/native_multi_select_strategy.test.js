import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(),
}));

import { buildPlaywrightLocator } from '../core/selector-utils.js';
import { NativeMultiSelectStrategy } from '../services/strategies/NativeMultiSelectStrategy.js';

function makeOption(overrides = {}) {
    return {
        id: 'opt-2',
        label: 'Option 2',
        value: 'option2',
        type: 'native_select_multi',
        index: 0,
        locator: '',
        selected: false,
        checked: false,
        enabled: true,
        visible: true,
        actualState: { checked: false, selected: false, enabled: true, visible: true },
        ...overrides,
    };
}

function makeContainer(optionItem) {
    let menuOpened = false;
    const target = {
        locator: vi.fn(() => ({ first: vi.fn(() => ({ count: vi.fn(async () => 0) })) })),
        evaluate: vi.fn(async () => 'DIV'),
    };
    const filterChain = { first: vi.fn(() => optionItem) };
    const chain = {
        nth: vi.fn(() => target),
        filter: vi.fn(() => filterChain),
        first: vi.fn(() => chain),
    };
    const optionLocators = {
        count: vi.fn(async () => (menuOpened ? 3 : 0)),
        filter: vi.fn(() => ({
            count: vi.fn(async () => (menuOpened ? 2 : 0)),
            first: vi.fn(() => optionItem),
        })),
        first: vi.fn(() => optionItem),
    };
    const container = {
        first: vi.fn(() => container),
        waitFor: vi.fn(async () => {}),
        getAttribute: vi.fn(async (name) => {
            if (name === 'aria-expanded') return menuOpened ? 'true' : 'false';
            return null;
        }),
        click: vi.fn(async () => {
            menuOpened = true;
        }),
        locator: vi.fn((selector) => {
            if (selector && selector.includes('role=')) return optionLocators;
            if (selector === 'li' || selector.includes('[role="option"]')) return optionLocators;
            return chain;
        }),
        getByText: vi.fn(() => ({ first: vi.fn(() => optionItem) })),
    };
    return { container, chain, getMenuOpened: () => menuOpened };
}

function makePage() {
    return {
        waitForTimeout: vi.fn(async () => {}),
        locator: vi.fn(() => ({
            filter: vi.fn(() => ({ first: vi.fn(() => null) })),
        })),
    };
}

describe('NativeMultiSelectStrategy custom-dropdown fallback', () => {
    let strategy;

    beforeEach(() => {
        strategy = new NativeMultiSelectStrategy();
        buildPlaywrightLocator.mockReset();
    });

    it('opens the trigger and clicks each option by label when the element is not a native <select>', async () => {
        const optionItem = {
            waitFor: vi.fn(async () => {}),
            click: vi.fn(async () => {}),
            evaluate: vi.fn(async (fn) =>
                fn({
                    matches: () => false,
                    getAttribute: (name) => (name === 'aria-selected' ? 'true' : null),
                    classList: { contains: () => false },
                }),
            ),
        };
        const { container } = makeContainer(optionItem);
        buildPlaywrightLocator.mockImplementation((_page, sel) =>
            sel === '#dropdown' ? container : optionItem,
        );

        const res = await strategy.execute(
            {
                page: makePage(),
                containerSelector: '#dropdown',
                selectedOptions: [
                    { label: 'Option 1', action: 'SELECT' },
                    { label: 'Option 2', action: 'SELECT' },
                ],
                detectedOptions: [
                    makeOption({ id: 'opt-1', label: 'Option 1', value: 'option1' }),
                    makeOption(),
                ],
                timeout: 30000,
            },
            10000,
        );

        expect(container.click).toHaveBeenCalled();
        expect(optionItem.click).toHaveBeenCalled();
        expect(res.applied).toHaveLength(2);
        expect(res.applied.map((a) => a.label)).toEqual(['Option 1', 'Option 2']);
        expect(res.evidence.every((e) => e.result === 'PASS')).toBe(true);
    });

    it('throws a descriptive error when a custom option cannot be located in the menu', async () => {
        const optionItem = {
            waitFor: vi.fn(async () => {
                throw new Error('not visible');
            }),
        };
        const { container } = makeContainer(optionItem);
        buildPlaywrightLocator.mockImplementation((_page, sel) =>
            sel === '#dropdown' ? container : optionItem,
        );

        const page = makePage();
        page.locator.mockImplementation(() => ({
            filter: vi.fn(() => ({ first: vi.fn(() => optionItem) })),
        }));

        await expect(
            strategy.execute(
                {
                    page,
                    containerSelector: '#dropdown',
                    selectedOptions: [{ label: 'Option 2', action: 'SELECT' }],
                    detectedOptions: [makeOption()],
                    timeout: 30000,
                },
                10000,
            ),
        ).rejects.toThrow(/Could not resolve locator for option "Option 2" in custom dropdown/);
    });
});

describe('NativeMultiSelectStrategy native <select> path', () => {
    let strategy;

    beforeEach(() => {
        strategy = new NativeMultiSelectStrategy();
        buildPlaywrightLocator.mockReset();
    });

    it('keeps using selectOption() when the resolved element is a real <select>', async () => {
        let selectState = false;
        const selectedOption = makeOption({
            index: 1,
            locator: "getByRole('option', { name: 'Option 2' })",
        });

        const ancestorSelect = {
            count: vi.fn(async () => 1),
            evaluate: vi.fn(async (fn) => {
                const src = fn.toString();
                if (src.includes('el.tagName')) return 'SELECT';
                if (src.includes('el.selected')) return selectState;
                return null;
            }),
            selectOption: vi.fn(async () => {
                selectState = true;
            }),
        };

        const container = {
            first: vi.fn(() => container),
            waitFor: vi.fn(async () => {}),
            locator: vi.fn(() => ({
                nth: vi.fn(() => ({
                    locator: vi.fn(() => ({ first: vi.fn(() => ancestorSelect) })),
                })),
            })),
        };

        buildPlaywrightLocator.mockImplementation((_page, sel) =>
            sel === '#dropdown' ? container : container,
        );

        const res = await strategy.execute({
            page: makePage(),
            containerSelector: '#dropdown',
            selectedOptions: [{ label: 'Option 2', action: 'SELECT' }],
            detectedOptions: [selectedOption],
            timeout: 30000,
        });

        expect(ancestorSelect.selectOption).toHaveBeenCalledWith(
            { label: 'Option 2' },
            { timeout: 30000 },
        );
        expect(res.applied).toHaveLength(1);
        expect(res.evidence[0].result).toBe('PASS');
    });
});
