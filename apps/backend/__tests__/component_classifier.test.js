import { describe, it, expect } from 'vitest';
import { buildRobustLocator, enrichDetectionResult } from '../services/ComponentClassifier.js';

describe('buildRobustLocator', () => {
    it('keeps a non-empty raw locator untouched', () => {
        expect(
            buildRobustLocator({ locator: "getByLabel('name')", id: 'checkbox-0', nativeId: null }),
        ).toBe("getByLabel('name')");
    });

    it('uses a real native id as an absolute locator', () => {
        expect(
            buildRobustLocator({
                locator: '',
                id: 'cb2',
                nativeId: 'cb2',
                type: 'checkbox',
                label: 'checkbox 2',
            }),
        ).toBe('#cb2');
    });

    it('does NOT fabricate an id locator from synthetic detector ids', () => {
        expect(
            buildRobustLocator({
                locator: '',
                id: 'checkbox-0',
                nativeId: null,
                type: 'checkbox',
                label: 'checkbox 1',
            }),
        ).toBe('');
    });

    it('falls back to the index fallback (empty) before ever fabricating a random locator', () => {
        expect(
            buildRobustLocator({
                locator: '',
                id: 'checkbox-1',
                nativeId: null,
                type: 'checkbox',
                label: '',
            }),
        ).toBe('');
    });

    it('uses getByRole for native select options', () => {
        expect(
            buildRobustLocator({
                locator: '',
                id: 'select-0-option-2',
                nativeId: null,
                type: 'native_select',
                label: 'Option B',
            }),
        ).toBe("getByRole('option', { name: 'Option B' })");
    });
});

describe('enrichDetectionResult', () => {
    it('does not assign fabricated absolute locators to bare checkboxes', () => {
        const res = enrichDetectionResult({
            found: true,
            groupType: 'checkbox-group',
            options: [
                {
                    id: 'checkbox-0',
                    type: 'checkbox',
                    label: 'checkbox 1',
                    index: 0,
                    checked: false,
                },
                {
                    id: 'checkbox-1',
                    type: 'checkbox',
                    label: 'checkbox 2',
                    index: 1,
                    checked: true,
                },
            ],
        });

        expect(res.groupType).toBe('checkbox-group');
        expect(res.options).toHaveLength(2);
        for (const o of res.options) {
            expect(o.locator).not.toMatch(/^#checkbox-\d+$/);
        }
        expect(res.options[0].locator).toBe('');
        expect(res.options[1].locator).toBe('');
    });
});
