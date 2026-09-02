import { describe, it, expect, vi } from 'vitest';
import { detectOptions } from '../services/OptionDetector.js';
import { writeOptions } from '../services/OptionWriter.js';
import { FormMapper } from '../services/exporter/nodes/FormMapper.js';

vi.mock('../core/selector-utils.js', () => ({
    normalizeSelectorForDotId: vi.fn(async (_page, sel) => sel),
    buildPlaywrightLocator: vi.fn(() => mockContainer),
}));

let mockContainer;
let mockChild;

function locator(overrides = {}) {
    return {
        first: vi.fn(() => mockContainer),
        locator: vi.fn(() => mockChild),
        nth: vi.fn(() => mockChild),
        match: { ...overrides },
        count: overrides.count || vi.fn(async () => 0),
        waitFor: overrides.waitFor || vi.fn(async () => {}),
        evaluate: overrides.evaluate || vi.fn(async () => null),
        click: overrides.click || vi.fn(async () => {}),
        check: overrides.check || vi.fn(async () => {}),
        uncheck: overrides.uncheck || vi.fn(async () => {}),
        isChecked: overrides.isChecked || vi.fn(async () => false),
        selectOption: overrides.selectOption || vi.fn(async () => []),
    };
}

const SELECT_OPTIONS = [
    { id: 'opt-1', label: 'Madrid', value: 'ES-M', type: 'select', index: 0 },
    { id: 'opt-2', label: 'Barcelona', value: 'ES-B', type: 'select', index: 1 },
    { id: 'opt-3', label: 'Valencia', value: 'ES-V', type: 'select', index: 2 },
];

describe('OptionWriter', () => {
    beforeEach(() => {
        mockContainer = locator({});
        mockChild = locator({});
    });

    // Build a scoped locator whose every resolver (`nth`, `first`, `locator`)
    // returns itself, so method overrides apply no matter how the chain is built.
    const scoped = (overrides = {}) => {
        const s = {
            ...mockChild,
            isChecked: overrides.isChecked || vi.fn(async () => false),
            first: () => s,
            nth: () => s,
            locator: () => s,
            waitFor: overrides.waitFor || vi.fn(async () => {}),
            ...overrides,
        };
        return s;
    };

    const withScoped = (s) => {
        mockContainer.locator = vi.fn(() => s);
        return s;
    };

    it('returns empty applied when no selectedOptions', async () => {
        const res = await writeOptions(
            {},
            {
                containerSelector: '#container',
                selectedOptions: [],
                options: SELECT_OPTIONS,
            },
        );
        expect(res.applied).toEqual([]);
        expect(res.evidence).toEqual([]);
        expect(res.optionCount).toBe(SELECT_OPTIONS.length);
    });

    it('throws when option does not exist', async () => {
        await expect(
            writeOptions(
                {},
                {
                    containerSelector: '#c',
                    selectedOptions: [{ label: 'Paris', action: 'CHECK' }],
                    options: SELECT_OPTIONS,
                },
            ),
        ).rejects.toThrow(/does not exist/);
    });

    it('throws when option is disabled', async () => {
        await expect(
            writeOptions(
                {},
                {
                    containerSelector: '#c',
                    selectedOptions: [{ label: 'Barcelona', action: 'CHECK' }],
                    options: [{ ...SELECT_OPTIONS[1], enabled: false }],
                },
            ),
        ).rejects.toThrow(/disabled/);
    });

    it('clicks list-type options with default CHECK action (legacy item)', async () => {
        const s = withScoped(scoped());
        const click = s.click;
        const res = await writeOptions(
            {},
            {
                containerSelector: '#list',
                selectedOptions: [{ label: 'Option A' }], // no action -> CHECK
                options: [
                    {
                        id: 'a',
                        label: 'Option A',
                        value: 'a',
                        type: 'list',
                        index: 0,
                        checked: false,
                        actualState: { checked: false },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(click).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.applied[0].action).toBe('CHECK');
    });

    it('applies CHECK to an unchecked checkbox with PASS evidence', async () => {
        const s = withScoped(scoped({ isChecked: vi.fn(async () => true) }));
        const check = s.check;
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [{ label: 'A', action: 'CHECK' }],
                options: [
                    {
                        id: 'a',
                        label: 'A',
                        value: 'a',
                        type: 'checkbox',
                        index: 0,
                        checked: false,
                        actualState: { checked: false },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(check).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.applied[0].action).toBe('CHECK');
        expect(res.evidence).toHaveLength(1);
        expect(res.evidence[0].before).toBe('Unchecked');
        expect(res.evidence[0].action).toBe('CHECK');
        expect(res.evidence[0].after).toBe('Checked');
        expect(res.evidence[0].result).toBe('PASS');
    });

    it('does NOT interact when current state already matches CHECK (diff strategy)', async () => {
        const s = withScoped(scoped());
        const check = s.check;
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [{ label: 'A', action: 'CHECK' }],
                options: [
                    {
                        id: 'a',
                        label: 'A',
                        value: 'a',
                        type: 'checkbox',
                        index: 0,
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(check).not.toHaveBeenCalled();
        expect(res.applied).toHaveLength(0);
        expect(res.evidence[0].result).toBe('PASS');
        expect(res.evidence[0].message).toContain('Already in desired state');
    });

    it('applies UNCHECK to a checked checkbox', async () => {
        const s = withScoped(scoped({ isChecked: vi.fn(async () => false) }));
        const uncheck = s.uncheck;
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [{ label: 'B', action: 'UNCHECK' }],
                options: [
                    {
                        id: 'b',
                        label: 'B',
                        value: 'b',
                        type: 'checkbox',
                        index: 0,
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(uncheck).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.applied[0].action).toBe('UNCHECK');
    });

    it('keeps NO_CHANGE options untouched (independence)', async () => {
        const s = withScoped(scoped({ isChecked: vi.fn(async () => true) }));
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [
                    { label: 'A', action: 'CHECK' },
                    { label: 'B', action: 'NO_CHANGE' },
                ],
                options: [
                    {
                        id: 'a',
                        label: 'A',
                        value: 'a',
                        type: 'checkbox',
                        index: 0,
                        checked: false,
                        actualState: { checked: false },
                    },
                    {
                        id: 'b',
                        label: 'B',
                        value: 'b',
                        type: 'checkbox',
                        index: 1,
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 1000,
            },
        );
        // A is checked (action); B is NO_CHANGE so never touched.
        expect(s.check).toHaveBeenCalledTimes(1);
        expect(s.uncheck).not.toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
    });

    it('throws a specific error when UNCHECK is requested on a radio', async () => {
        withScoped(scoped());
        await expect(
            writeOptions(
                {},
                {
                    containerSelector: '#opts',
                    selectedOptions: [{ label: 'R', action: 'UNCHECK' }],
                    options: [
                        {
                            id: 'r',
                            label: 'R',
                            value: 'r',
                            type: 'radio',
                            index: 0,
                            checked: true,
                            actualState: { checked: true },
                        },
                    ],
                    timeout: 1000,
                },
            ),
        ).rejects.toThrow(/mutually exclusive/);
    });

    it('throws a specific error when UNCHECK is requested on a select', async () => {
        withScoped(scoped());
        await expect(
            writeOptions(
                {},
                {
                    containerSelector: '#opts',
                    selectedOptions: [{ label: 'S', action: 'UNCHECK' }],
                    options: [
                        {
                            id: 's',
                            label: 'S',
                            value: 's',
                            type: 'select',
                            index: 0,
                            checked: false,
                            actualState: { checked: false },
                            multiple: false,
                        },
                    ],
                    timeout: 1000,
                },
            ),
        ).rejects.toThrow(/UNCHECK is not supported for the <select>/);
    });

    it('skips interaction of an already-checked radio via CHECK', async () => {
        const s = withScoped(scoped({ isChecked: vi.fn(async () => true) }));
        const check = s.check;
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [{ label: 'R', action: 'CHECK' }],
                options: [
                    {
                        id: 'r',
                        label: 'R',
                        value: 'r',
                        type: 'radio',
                        index: 0,
                        checked: true,
                        actualState: { checked: true },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(check).not.toHaveBeenCalled();
        expect(res.applied).toHaveLength(0);
        expect(res.evidence[0].result).toBe('PASS');
    });

    it('reports FAIL when verification detects a different final state', async () => {
        const s = withScoped(scoped({ isChecked: vi.fn(async () => false) }));
        const res = await writeOptions(
            {},
            {
                containerSelector: '#opts',
                selectedOptions: [{ label: 'A', action: 'CHECK' }],
                options: [
                    {
                        id: 'a',
                        label: 'A',
                        value: 'a',
                        type: 'checkbox',
                        index: 0,
                        checked: false,
                        actualState: { checked: false },
                    },
                ],
                timeout: 1000,
            },
        );
        expect(s.check).toHaveBeenCalled();
        expect(res.applied).toHaveLength(1);
        expect(res.evidence[0].result).toBe('FAIL');
        expect(res.evidence[0].message).toContain('Expected Checked');
    });
});

describe('OptionDetector', () => {
    it('returns found=false when no options in the container', async () => {
        const page = {
            isClosed: () => false,
            evaluate: vi.fn(async () => ({
                found: false,
                groupType: 'not-found',
                options: [],
                message: 'no options',
            })),
        };
        const res = await detectOptions(page, '#nope');
        expect(res.found).toBe(false);
        expect(res.options).toEqual([]);
    });

    it('forwards detected options from the page script', async () => {
        const detected = SELECT_OPTIONS.map((o) => ({ ...o, selected: false, enabled: true }));
        const page = {
            isClosed: () => false,
            evaluate: vi.fn(async () => ({
                found: true,
                groupType: 'select',
                options: detected,
                message: '',
            })),
        };
        const res = await detectOptions(page, '#list');
        expect(res.found).toBe(true);
        expect(res.groupType).toBe('select');
        expect(res.options).toHaveLength(3);
    });
});

describe('FormMapper multi-option (select_option)', () => {
    it('generates checkbox/radio/list code per detected type', () => {
        const code = FormMapper.getCode(
            {
                actionType: 'select_option',
                containerSelector: '#opts',
                selectedOptions: [
                    { label: 'Admin', value: 'admin' },
                    { label: 'Editor', value: 'editor' },
                ],
                detectedOptions: [
                    { label: 'Admin', type: 'checkbox', locator: '#c1' },
                    { label: 'Editor', type: 'list', locator: '#l1' },
                ],
            },
            'javascript',
        );
        expect(code).toContain("getByRole('checkbox', { name: `Admin` }).check()");
        expect(code).toContain('locator(`#l1`).click()');
    });

    it('emits selectOption for native select detected type', () => {
        const code = FormMapper.getCode(
            {
                actionType: 'select_option',
                containerSelector: '#country',
                selectedOptions: [{ label: 'Spain', value: 'ES' }],
                detectedOptions: [{ label: 'Spain', value: 'ES', type: 'select' }],
            },
            'javascript',
        );
        expect(code).toContain(".locator('select').selectOption({ label: `Spain` })");
    });

    it('falls back to legacy page.selectOption when no containerSelector', () => {
        const code = FormMapper.getCode(
            { actionType: 'select_option', selector: '#dd', value: 'x' },
            'javascript',
        );
        expect(code).toBe('await page.selectOption(`#dd`, `x`);');
    });

    it('emits uncheck() for UNCHECK and skips NO_CHANGE', () => {
        const code = FormMapper.getCode(
            {
                actionType: 'select_option',
                containerSelector: '#opts',
                selectedOptions: [
                    { label: 'A', value: 'a', action: 'UNCHECK' },
                    { label: 'B', value: 'b', action: 'NO_CHANGE' },
                ],
                detectedOptions: [
                    { label: 'A', type: 'checkbox', locator: '#a' },
                    { label: 'B', type: 'checkbox', locator: '#b' },
                ],
            },
            'javascript',
        );
        expect(code).toContain('.uncheck()');
        expect(code).not.toContain('name: `B`');
        expect(code.split('\n')).toHaveLength(1);
    });

    it('emits a comment (no uncheck) for radio UNCHECK', () => {
        const code = FormMapper.getCode(
            {
                actionType: 'select_option',
                containerSelector: '#opts',
                selectedOptions: [{ label: 'R', value: 'r', action: 'UNCHECK' }],
                detectedOptions: [{ label: 'R', type: 'radio', locator: '#r' }],
            },
            'javascript',
        );
        expect(code).toContain('cannot uncheck');
    });
});
