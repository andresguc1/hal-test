import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as actions from '../controllers/action.controller.js';
import { variableManager } from '../services/VariableManager.js';

describe('Logic Engine: Transform Node Logic', () => {
    beforeEach(() => {
        variableManager.clearAll();
    });

    const mockRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    it('should map an array of numbers (map)', async () => {
        variableManager.set('items', [1, 2, 3]);
        const req = {
            body: {
                operation: 'map',
                input: '${items}',
                expression: 'item * 2',
                outputVar: 'doubled',
            },
            t: (k) => k,
        };
        const res = mockRes();

        await actions.transformAction(req, res);

        expect(variableManager.get('doubled')).toEqual([2, 4, 6]);
    });

    it('should filter an array (filter)', async () => {
        variableManager.set('items', [1, 10, 5, 20]);
        const req = {
            body: {
                operation: 'filter',
                input: '${items}',
                expression: 'item > 8',
                outputVar: 'filtered',
            },
            t: (k) => k,
        };
        const res = mockRes();

        await actions.transformAction(req, res);

        expect(variableManager.get('filtered')).toEqual([10, 20]);
    });

    it('should reduce an array (reduce)', async () => {
        variableManager.set('items', [1, 2, 3, 4]);
        const req = {
            body: {
                operation: 'reduce',
                input: '${items}',
                expression: 'acc + item',
                outputVar: 'sum',
            },
            t: (k) => k,
        };
        const res = mockRes();

        await actions.transformAction(req, res);

        expect(variableManager.get('sum')).toBe(10);
    });

    it('should merge two arrays (merge)', async () => {
        variableManager.set('listA', [1, 2]);
        variableManager.set('listB', [3, 4]);
        const req = {
            body: {
                operation: 'merge',
                input: '${listA}',
                mergeWith: '${listB}',
                outputVar: 'merged',
            },
            t: (k) => k,
        };
        const res = mockRes();

        await actions.transformAction(req, res);

        expect(variableManager.get('merged')).toEqual([1, 2, 3, 4]);
    });
});
