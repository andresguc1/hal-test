import { describe, it, expect } from 'vitest';
import {
    toRecords,
    appendRecords,
    keyOf,
    dedupeRecords,
    mergeDataset,
} from '../services/extraction/datasetAccumulator.js';

describe('datasetAccumulator.toRecords', () => {
    it('passes arrays of objects through', () => {
        expect(toRecords([{ a: 1 }])).toEqual([{ a: 1 }]);
    });

    it('wraps a single object', () => {
        expect(toRecords({ a: 1 })).toEqual([{ a: 1 }]);
    });

    it('returns [] for anything else', () => {
        expect(toRecords(null)).toEqual([]);
        expect(toRecords(undefined)).toEqual([]);
        expect(toRecords('x')).toEqual([]);
        expect(toRecords(42)).toEqual([]);
    });

    it('drops non-object items from arrays', () => {
        expect(toRecords([{ a: 1 }, 'x', null])).toEqual([{ a: 1 }]);
    });
});

describe('datasetAccumulator.appendRecords', () => {
    it('appends incoming to existing', () => {
        const merged = appendRecords([{ id: 1 }], [{ id: 2 }, { id: 3 }]);
        expect(merged).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('handles undefined existing', () => {
        expect(appendRecords(undefined, [{ id: 1 }])).toEqual([{ id: 1 }]);
    });

    it('handles an object existing as a single record', () => {
        expect(appendRecords({ id: 'a' }, [{ id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }]);
    });
});

describe('datasetAccumulator.keyOf', () => {
    it('normalizes primitives to trimmed strings', () => {
        expect(keyOf(' x ')).toBe('x');
        expect(keyOf(5)).toBe('5');
        expect(keyOf(true)).toBe('true');
    });

    it('returns empty string for nullish values', () => {
        expect(keyOf(null)).toBe('');
        expect(keyOf(undefined)).toBe('');
    });

    it('stringifies objects', () => {
        expect(keyOf({ a: 1 })).toBe('{"a":1}');
    });
});

describe('datasetAccumulator.dedupeRecords', () => {
    it('keeps the first occurrence per key and reports skips', () => {
        const input = [
            { slug: 'a', v: 1 },
            { slug: 'b', v: 2 },
            { slug: 'a', v: 3 },
            { slug: 'b', v: 4 },
        ];
        const { records, skipped } = dedupeRecords(input, 'slug');
        expect(records).toEqual([
            { slug: 'a', v: 1 },
            { slug: 'b', v: 2 },
        ]);
        expect(skipped).toBe(2);
    });

    it('keeps records without the key', () => {
        const input = [{ slug: 'a' }, { other: 1 }, { other: 2 }];
        const { records, skipped } = dedupeRecords(input, 'slug');
        expect(records).toHaveLength(3);
        expect(skipped).toBe(0);
    });

    it('normalizes numeric keys', () => {
        const input = [{ id: 1 }, { id: '1' }, { id: 2 }];
        const { records, skipped } = dedupeRecords(input, 'id');
        expect(records).toEqual([{ id: 1 }, { id: 2 }]);
        expect(skipped).toBe(1);
    });

    it('returns the input untouched when no key is provided', () => {
        const { records, skipped } = dedupeRecords([{ a: 1 }, { a: 1 }], null);
        expect(records).toEqual([{ a: 1 }, { a: 1 }]);
        expect(skipped).toBe(0);
    });
});

describe('datasetAccumulator.mergeDataset', () => {
    it('appends then dedupes by key', () => {
        const { records, added, skipped, total } = mergeDataset(
            [{ id: 1 }],
            [{ id: 1 }, { id: 2 }],
            'id',
        );
        expect(records).toEqual([{ id: 1 }, { id: 2 }]);
        expect(added).toBe(2);
        expect(skipped).toBe(1);
        expect(total).toBe(2);
    });

    it('skips deduplication when no key is provided', () => {
        const { records, skipped } = mergeDataset([{ id: 1 }], [{ id: 1 }], null);
        expect(records).toEqual([{ id: 1 }, { id: 1 }]);
        expect(skipped).toBe(0);
    });
});
