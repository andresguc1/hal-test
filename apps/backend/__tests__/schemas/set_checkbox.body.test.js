import { describe, it, expect } from 'vitest';
import setCheckboxBodySchema from '../../schemas/set_checkbox/body.js';

describe('set_checkbox body schema', () => {
    it('should accept single mode (selector + default action)', () => {
        const { error, value } = setCheckboxBodySchema.validate({ selector: '#accept' });
        expect(error).toBeUndefined();
        expect(value.action).toBe('check');
        expect(value.timeout).toBe(0);
    });

    it('should accept action toggle', () => {
        const { error, value } = setCheckboxBodySchema.validate({
            selector: '#accept',
            action: 'toggle',
        });
        expect(error).toBeUndefined();
        expect(value.action).toBe('toggle');
    });

    it('should default verifyState to true', () => {
        const { error, value } = setCheckboxBodySchema.validate({ selector: '#accept' });
        expect(error).toBeUndefined();
        expect(value.verifyState).toBe(true);
    });

    it('should accept verifyState false', () => {
        const { error, value } = setCheckboxBodySchema.validate({
            selector: '#accept',
            verifyState: false,
        });
        expect(error).toBeUndefined();
        expect(value.verifyState).toBe(false);
    });

    it('should reject a non-boolean verifyState', () => {
        const { error } = setCheckboxBodySchema.validate({
            selector: '#accept',
            verifyState: 'yes',
        });
        expect(error).toBeDefined();
    });

    it('should reject invalid actions', () => {
        const { error } = setCheckboxBodySchema.validate({
            selector: '#accept',
            action: 'banana',
        });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('check');
    });

    it('should require selector when fields are absent', () => {
        const { error } = setCheckboxBodySchema.validate({ action: 'check' });
        expect(error).toBeDefined();
    });

    it('should accept multiple mode with fields', () => {
        const payload = {
            fields: [
                { strategy: 'label', target: 'I accept the terms', action: 'check' },
                { strategy: 'css', target: '#newsletter', action: 'uncheck' },
                { strategy: 'label', target: 'Subscribe' },
            ],
            timeout: 5000,
        };
        const { error, value } = setCheckboxBodySchema.validate(payload);
        expect(error).toBeUndefined();
        expect(value.fields).toHaveLength(3);
        expect(value.fields[0].action).toBe('check');
        expect(value.fields[1].action).toBe('uncheck');
        expect(value.fields[2].action).toBe('check');
        expect(value.selector).toBeUndefined();
    });

    it('should allow an empty selector string in multiple mode', () => {
        const { error } = setCheckboxBodySchema.validate({
            selector: '',
            fields: [{ target: '#x' }],
        });
        expect(error).toBeUndefined();
    });

    it('should reject a field without target', () => {
        const { error } = setCheckboxBodySchema.validate({ fields: [{ strategy: 'css' }] });
        expect(error).toBeDefined();
    });

    it('should reject invalid field strategy', () => {
        const { error } = setCheckboxBodySchema.validate({
            fields: [{ strategy: 'id', target: '#x' }],
        });
        expect(error).toBeDefined();
    });

    it('should reject an empty fields array', () => {
        const { error } = setCheckboxBodySchema.validate({
            selector: '',
            fields: [],
        });
        expect(error).toBeDefined();
    });
});
