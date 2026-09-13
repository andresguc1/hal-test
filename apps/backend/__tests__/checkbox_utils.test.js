import { describe, it, expect, vi } from 'vitest';
import {
    actionLabel,
    applyCheckbox,
    assertCheckedState,
    findLabelCheckboxLocator,
    resolveLabelCheckbox,
} from '../plugins/core-interaction/utils/checkboxUtils.js';

// Chainable fake locator: supports count(), first() and locator() nesting.
const fakeLocator = (countValue) => ({
    count: vi.fn(async () => countValue),
    first: vi.fn(function () {
        return this;
    }),
    locator: vi.fn(function () {
        return this;
    }),
});

// Builds a fake page whose three label candidates resolve to specific counts:
// role = accessible-name candidate, label = wrapping <label>, text = adjacent text.
const makePage = (counts) => ({
    getByRole: vi.fn(() => fakeLocator(counts.role ?? 0)),
    locator: vi.fn((sel) =>
        String(sel).startsWith('xpath=')
            ? fakeLocator(counts.text ?? 0)
            : fakeLocator(counts.label ?? 0),
    ),
    getByText: vi.fn(() => fakeLocator(0)),
});

describe('resolveLabelCheckbox chain', () => {
    it('exposes the three candidate strategies in order', () => {
        const page = makePage({});
        const { candidates, source } = resolveLabelCheckbox(page, 'checkbox 1');
        expect(candidates).toHaveLength(3);
        expect(source).toBe('label: "checkbox 1"');
        candidates[0]();
        expect(page.getByRole).toHaveBeenCalledWith('checkbox', {
            name: 'checkbox 1',
            exact: true,
        });
    });
});

describe('findLabelCheckboxLocator', () => {
    it('picks the accessible-name candidate (rule 1) when it matches', async () => {
        const page = makePage({ role: 2, label: 0, text: 0 });
        const { locator, source } = await findLabelCheckboxLocator(page, 'checkbox 1');
        expect(page.getByRole).toHaveBeenCalled();
        expect(page.locator).not.toHaveBeenCalled();
        expect(locator).toBeDefined();
        expect(source).toBe('label: "checkbox 1"');
    });

    it('falls back to a wrapping <label> (rule 2) when there is no accessible name', async () => {
        const page = makePage({ role: 0, label: 1, text: 0 });
        const { source } = await findLabelCheckboxLocator(page, 'checkbox 1');
        expect(page.locator).toHaveBeenCalledWith('label:has-text("checkbox 1")');
        expect(source).toBe('label: "checkbox 1"');
    });

    it('falls back to adjacent text (rule 3) for plain "checkbox 1" markup', async () => {
        const page = makePage({ role: 0, label: 0, text: 1 });
        const { locator } = await findLabelCheckboxLocator(page, 'checkbox 1');
        // The adjacent-text candidate targets the input whose first following
        // text node equals the target.
        const xpathCall = page.locator.mock.calls.find(([arg]) => String(arg).startsWith('xpath='));
        expect(xpathCall).toBeDefined();
        expect(xpathCall[0]).toContain(
            "normalize-space(following-sibling::text()[1]) = 'checkbox 1'",
        );
        expect(locator).toBeDefined();
    });

    it('throws a clear error when no candidate matches', async () => {
        const page = makePage({ role: 0, label: 0, text: 0 });
        await expect(findLabelCheckboxLocator(page, 'missing')).rejects.toThrow(
            /Checkbox not found for "missing"/,
        );
    });
});

describe('actionLabel', () => {
    it('maps actions to target states', () => {
        expect(actionLabel('check')).toBe('checked');
        expect(actionLabel('uncheck')).toBe('unchecked');
        expect(actionLabel('toggle')).toBe('checked');
    });
});

describe('applyCheckbox', () => {
    const tickingPage = {
        waitForTimeout: vi.fn(async () => {}),
    };

    const makeLocator = ({ initiallyChecked = false } = {}) => {
        let checked = initiallyChecked;
        return {
            check: vi.fn(async () => {
                checked = true;
            }),
            uncheck: vi.fn(async () => {
                checked = false;
            }),
            click: vi.fn(async () => {
                checked = !checked;
            }),
            isChecked: vi.fn(async () => checked),
            evaluate: vi.fn(async () => checked),
        };
    };

    it('checks and verifies the live state', async () => {
        const loc = makeLocator();
        const state = await applyCheckbox(tickingPage, loc, 'check', { timeout: 1000 });
        expect(state).toBe('checked');
        expect(loc.check).toHaveBeenCalled();
    });

    it('retries once when the state is re-inverted by JS', async () => {
        let checked = false;
        let reads = 0;
        const loc = {
            check: vi.fn(async () => {
                checked = true;
            }),
            uncheck: vi.fn(async () => {
                checked = false;
            }),
            // First verified read reports "unchecked" (JS flipped it back);
            // the second (after retry) confirms the desired state.
            isChecked: vi.fn(async () => {
                reads += 1;
                return reads === 1 ? false : checked;
            }),
            click: vi.fn(async () => {
                checked = !checked;
            }),
            evaluate: vi.fn(async () => checked),
        };
        const state = await applyCheckbox(tickingPage, loc, 'check', { timeout: 1000 });
        expect(loc.check).toHaveBeenCalledTimes(2);
        expect(state).toBe('checked');
    });

    it('toggles via click and returns the resulting state', async () => {
        const loc = makeLocator({ initiallyChecked: false });
        const state = await applyCheckbox(tickingPage, loc, 'toggle', { timeout: 1000 });
        expect(loc.click).toHaveBeenCalled();
        expect(state).toBe('checked');
    });
});

describe('assertCheckedState', () => {
    const makeStateLocator = (isCheckedImpl, evaluateImpl) => ({
        isChecked: vi.fn(isCheckedImpl),
        evaluate: vi.fn(async () => (evaluateImpl ? evaluateImpl() : false)),
    });

    it('resolves immediately when the state already matches', async () => {
        const loc = makeStateLocator(async () => true);
        const state = await assertCheckedState(loc, true, { timeout: 200 });
        expect(state).toBe('checked');
        expect(loc.isChecked).toHaveBeenCalledTimes(1);
    });

    it('polls until the expected state is reached', async () => {
        let reads = 0;
        const loc = makeStateLocator(async () => {
            reads += 1;
            return reads >= 2;
        });
        const state = await assertCheckedState(loc, true, { timeout: 500 });
        expect(state).toBe('checked');
        expect(reads).toBeGreaterThanOrEqual(2);
    });

    it('throws when the state never matches within the timeout', async () => {
        const loc = makeStateLocator(async () => false);
        await expect(assertCheckedState(loc, true, { timeout: 100 })).rejects.toThrow(
            /expected checked but got unchecked/,
        );
    });

    it('falls back to the evaluate-based read when isChecked rejects', async () => {
        const loc = {
            isChecked: vi.fn(async () => {
                throw new Error('detached');
            }),
            evaluate: vi.fn(async () => true),
        };
        const state = await assertCheckedState(loc, true, { timeout: 200 });
        expect(state).toBe('checked');
        expect(loc.evaluate).toHaveBeenCalled();
    });
});
