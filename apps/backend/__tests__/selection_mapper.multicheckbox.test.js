import { describe, it, expect } from 'vitest';
import { SelectionMapper } from '../services/exporter/nodes/SelectionMapper.js';

const single = (params, lang) =>
    SelectionMapper.getCode({ actionType: 'set_checkbox', ...params }, lang);

describe('SelectionMapper pick_list_option', () => {
    it('searches options inside menuSelector when provided (JS)', () => {
        const code = SelectionMapper.getCode(
            {
                actionType: 'pick_list_option',
                selector: '#lang-dropdown',
                menuSelector: '[role=listbox]',
                optionText: 'Español',
            },
            'javascript',
        );
        expect(code).toContain(
            'page.locator(`[role=listbox]`).getByText(`Español`, { exact: true })',
        );
        expect(code).toContain('await page.locator(`#lang-dropdown`).click();');
    });

    it('falls back to the trigger container for option lookup', () => {
        const code = SelectionMapper.getCode(
            {
                actionType: 'pick_list_option',
                selector: '#lang-dropdown',
                optionIndex: 2,
            },
            'javascript',
        );
        expect(code).toContain("page.locator(`#lang-dropdown`).locator('role=option");
    });
});

describe('SelectionMapper set_checkbox', () => {
    describe('single mode', () => {
        it('exports setChecked(true) for check in JS', () => {
            expect(single({ selector: '#accept', action: 'check' }, 'javascript')).toBe(
                'await page.locator(`#accept`).setChecked(true);',
            );
        });

        it('exports setChecked(false) for uncheck in JS', () => {
            expect(single({ selector: '#accept', action: 'uncheck' }, 'javascript')).toBe(
                'await page.locator(`#accept`).setChecked(false);',
            );
        });

        it('exports click() for toggle in JS', () => {
            expect(single({ selector: '#accept', action: 'toggle' }, 'javascript')).toBe(
                'await page.locator(`#accept`).click();',
            );
        });
    });

    describe('multiple mode', () => {
        const fields = [
            { strategy: 'label', target: 'I accept the terms', action: 'check' },
            { strategy: 'css', target: '#newsletter', action: 'uncheck' },
            { strategy: 'label', target: 'Subscribe', action: 'toggle' },
        ];

        it('exports per-field lines for JS (label + css)', () => {
            const code = single({ fields }, 'javascript');
            expect(code).toContain(
                "await page.getByRole('checkbox', { name: `I accept the terms` }).setChecked(true);",
            );
            expect(code).toContain('await page.locator(`#newsletter`).setChecked(false);');
            expect(code).toContain(
                "await page.getByRole('checkbox', { name: `Subscribe` }).click();",
            );
            expect(code.split('\n')).toHaveLength(3);
        });

        it('exports label mode for Python', () => {
            const code = single(
                { fields: [{ strategy: 'label', target: 'News', action: 'uncheck' }] },
                'python',
            );
            expect(code).toBe('await page.get_by_role("checkbox", name="News").set_checked(False)');
        });

        it('exports label mode for Java', () => {
            const code = single(
                { fields: [{ strategy: 'label', target: 'I accept', action: 'check' }] },
                'java',
            );
            expect(code).toBe(
                'page.getByRole(AriaRole.CHECKBOX, new Locator.GetByRoleOptions().setName("I accept")).setChecked(true);',
            );
        });

        it('exports label mode for C#', () => {
            const code = single(
                { fields: [{ strategy: 'label', target: 'I accept', action: 'toggle' }] },
                'csharp',
            );
            expect(code).toBe(
                'await page.GetByRole(AriaRole.Checkbox, new Page.GetByRoleOptions { Name = "I accept" }).ClickAsync();',
            );
        });
    });
});
