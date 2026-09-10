import { describe, it, expect } from 'vitest';
import pickListOptionBodySchema from '../../schemas/pick_list_option/body.js';

describe('pick_list_option body schema', () => {
    it('should accept selector + optionText (defaults)', () => {
        const { error, value } = pickListOptionBodySchema.validate({
            selector: '#lang',
            optionText: 'Español',
        });
        expect(error).toBeUndefined();
        expect(value.expandMenu).toBe(true);
        expect(value.timeout).toBe(30000);
    });

    it('should require selector', () => {
        const { error } = pickListOptionBodySchema.validate({ optionText: 'Español' });
        expect(error).toBeDefined();
    });

    it('should accept optionIndex instead of optionText', () => {
        const { error, value } = pickListOptionBodySchema.validate({
            selector: '#lang',
            optionIndex: 3,
        });
        expect(error).toBeUndefined();
        expect(value.optionIndex).toBe(3);
    });

    it('should accept menuSelector', () => {
        const { error, value } = pickListOptionBodySchema.validate({
            selector: '#lang',
            menuSelector: '[role=listbox]',
            optionIndex: 1,
        });
        expect(error).toBeUndefined();
        expect(value.menuSelector).toBe('[role=listbox]');
    });

    it('should accept mode text/index and reject unknown', () => {
        const ok = pickListOptionBodySchema.validate({
            selector: '#lang',
            mode: 'index',
            optionIndex: 2,
        });
        expect(ok.error).toBeUndefined();

        const bad = pickListOptionBodySchema.validate({
            selector: '#lang',
            mode: 'label',
            optionText: 'x',
        });
        expect(bad.error).toBeDefined();
    });
});
