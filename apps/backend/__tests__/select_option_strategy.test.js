import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(),
}));

import { buildPlaywrightLocator } from '../core/selector-utils.js';
import { CheckboxGroupStrategy } from '../services/strategies/CheckboxGroupStrategy.js';

function makeLocator({ failAttach = false } = {}, overrides = {}) {
    const l = {
        first: vi.fn(() => l),
        nth: vi.fn(() => l),
        locator: vi.fn(() => makeLocator({ failAttach })),
        waitFor:
            overrides.waitFor ||
            vi.fn(async () => {
                if (failAttach) throw new Error('timeout exceeded while waiting for locator');
            }),
        isChecked: overrides.isChecked || vi.fn(async () => false),
        check: overrides.check || vi.fn(async () => {}),
        uncheck: overrides.uncheck || vi.fn(async () => {}),
        click: overrides.click || vi.fn(async () => {}),
        count: overrides.count || vi.fn(async () => 1),
        ...overrides,
    };
    return l;
}

// Container whose `.locator()` descendants always fail to attach, simulating a
// checkbox that is NOT a descendant of the container at execution time.
function detachedContainer() {
    const container = makeLocator({});
    container.locator = vi.fn(() => makeLocator({ failAttach: true }));
    return container;
}

describe('CheckboxGroupStrategy locator resolution (absolute-id global fallback)', () => {
    let strategy;

    beforeEach(() => {
        strategy = new CheckboxGroupStrategy();
        buildPlaywrightLocator.mockReset();
    });

    it('unchecks via the global locator when the id is not inside the container', async () => {
        const container = detachedContainer();
        buildPlaywrightLocator.mockImplementation((_page, sel) => {
            if (sel === '#checkboxes') return container;
            return makeLocator({});
        });

        const uncheck = vi.fn(async () => {});
        // Live state read before the action: checked=true (matches detection), then
        // false after the uncheck, so the strategy is not skipped and verifies PASS.
        const globalTarget = makeLocator(
            {},
            {
                uncheck,
                isChecked: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
            },
        );
        buildPlaywrightLocator.mockReturnValueOnce(globalTarget);

        const res = await strategy.execute({
            page: {},
            containerSelector: '#checkboxes',
            selectedOptions: [{ label: 'checkbox 2', action: 'UNCHECK' }],
            detectedOptions: [
                {
                    id: 'cb2',
                    label: 'checkbox 2',
                    value: 'checkbox 2',
                    type: 'checkbox',
                    index: 1,
                    locator: '#checkbox-1',
                    checked: true,
                    actualState: { checked: true },
                },
            ],
            timeout: 30000,
        });

        expect(globalTarget.waitFor).toHaveBeenCalled();
        expect(uncheck).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.applied[0].action).toBe('UNCHECK');
        expect(res.evidence[0].result).toBe('PASS');
    });

    it('retries by index when the id resolves nowhere and the position cannot attach, then throws a descriptive error', async () => {
        const container = detachedContainer();
        buildPlaywrightLocator.mockImplementation((_page, sel) => {
            if (sel === '#checkboxes') return container;
            return makeLocator({ failAttach: true });
        });

        await expect(
            strategy.execute({
                page: {},
                containerSelector: '#checkboxes',
                selectedOptions: [{ label: 'checkbox 2', action: 'UNCHECK' }],
                detectedOptions: [
                    {
                        id: 'cb2',
                        label: 'checkbox 2',
                        value: 'checkbox 2',
                        type: 'checkbox',
                        index: 1,
                        locator: '#checkbox-1',
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 30000,
            }),
        ).rejects.toThrow(/not found in container "#checkboxes"/);
    });

    it('recovers with an index-based relative target when the absolute id exists nowhere but the option is reachable by position', async () => {
        const container = makeLocator({});
        const relativeTarget = makeLocator({});
        relativeTarget.uncheck = vi.fn(async () => {});
        // Live state read before the action: checked=true (matches detection),
        // then false after the uncheck, so the strategy is not skipped.
        relativeTarget.isChecked = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        // The id never resolves (inside the container or globally), but the
        // checkbox is reachable as `#checkboxes >> input:nth(1)`.
        container.locator = vi.fn((sel) =>
            sel.includes('#checkbox-1') ? makeLocator({ failAttach: true }) : relativeTarget,
        );
        buildPlaywrightLocator.mockImplementation((_page, sel) => {
            if (sel === '#checkboxes') return container;
            return makeLocator({ failAttach: true });
        });

        const res = await strategy.execute({
            page: {},
            containerSelector: '#checkboxes',
            selectedOptions: [{ label: 'checkbox 2', action: 'UNCHECK' }],
            detectedOptions: [
                {
                    id: 'cb2',
                    label: 'checkbox 2',
                    value: 'checkbox 2',
                    type: 'checkbox',
                    index: 1,
                    locator: '#checkbox-1',
                    checked: true,
                    actualState: { checked: true },
                },
            ],
            timeout: 30000,
        });

        expect(relativeTarget.uncheck).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.applied[0].action).toBe('UNCHECK');
        expect(res.evidence[0].result).toBe('PASS');
    });

    it('produces FAIL evidence + descriptive error when a bare (index) checkbox cannot attach', async () => {
        const container = makeLocator({});
        container.locator = vi.fn(() => makeLocator({ failAttach: true }));
        buildPlaywrightLocator.mockReturnValue(container);

        await expect(
            strategy.execute({
                page: {},
                containerSelector: '#checkboxes',
                selectedOptions: [{ label: 'checkbox 2', action: 'UNCHECK' }],
                detectedOptions: [
                    {
                        id: 'cb2',
                        label: 'checkbox 2',
                        value: 'checkbox 2',
                        type: 'checkbox',
                        index: 1,
                        locator: '',
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 30000,
            }),
        ).rejects.toThrow(/not found in container "#checkboxes"/);
        expect(strategy).toBeDefined();
    });
});
