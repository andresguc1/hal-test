import { describe, it, expect } from 'vitest';
import {
    toCSV,
    toJSON,
    toNDJSON,
    renderDataset,
    collectHeaders,
    formatExtension,
} from '../services/extraction/datasetExporter.js';

describe('datasetExporter.collectHeaders', () => {
    it('collects the union of keys in appearance order', () => {
        const records = [{ title: 'A', price: 1 }, { price: 2, stock: 5 }, { title: 'B' }];
        expect(collectHeaders(records)).toEqual(['title', 'price', 'stock']);
    });

    it('handles empty and non-object records', () => {
        expect(collectHeaders([])).toEqual([]);
        expect(collectHeaders([null, 'x', 3])).toEqual([]);
    });
});

describe('datasetExporter.toCSV', () => {
    it('emits an RFC-ish header row plus one row per record', () => {
        const csv = toCSV(
            [
                { name: 'Alice', city: 'Madrid' },
                { name: 'Bob', city: 'Berlin' },
            ],
            {},
        );
        expect(csv).toBe('name,city\nAlice,Madrid\nBob,Berlin');
    });

    it('quotes fields containing delimiter, quotes, or newlines', () => {
        const csv = toCSV([{ note: 'a, "b"\nc' }], {});
        // Each line is a single quoted field.
        expect(csv).toContain('"a, ""b""\nc"');
        expect(csv.split('\n').length).toBe(3); // header + 2 physical lines because of the embedded newline
    });

    it('uses a custom delimiter', () => {
        const csv = toCSV([{ a: 1, b: 2 }], { delimiter: ';' });
        expect(csv).toBe('a;b\n1;2');
    });

    it('omits the header when requested', () => {
        const csv = toCSV([{ a: 1 }], { includeHeader: false });
        expect(csv).toBe('1');
    });

    it('serializes nested values as JSON (with CSV quoting)', () => {
        const csv = toCSV([{ meta: { nested: true } }], {});
        expect(csv).toContain('"{""nested"":true}"');
    });

    it('treats empty/missing cells as empty strings', () => {
        const csv = toCSV([{ a: null, b: undefined, c: '' }], {});
        expect(csv).toBe('a,b,c\n,,');
    });

    it('handles empty datasets', () => {
        expect(toCSV([], {})).toBe('');
    });
});

describe('datasetExporter.toJSON / toNDJSON', () => {
    it('serializes compact JSON by default', () => {
        expect(toJSON([{ a: 1 }])).toBe('[{"a":1}]');
    });

    it('serializes pretty JSON when requested', () => {
        expect(toJSON([{ a: 1 }], { pretty: true })).toBe('[\n  {\n    "a": 1\n  }\n]');
    });

    it('renders NDJSON one object per line', () => {
        expect(toNDJSON([{ a: 1 }, { b: 2 }])).toBe('{"a":1}\n{"b":2}');
    });
});

describe('datasetExporter.renderDataset / formatExtension', () => {
    const records = [{ name: 'Ada' }];

    it('routes to the correct serializer by format', () => {
        expect(renderDataset(records, 'json')).toBe('[{"name":"Ada"}]');
        expect(renderDataset(records, 'ndjson')).toBe('{"name":"Ada"}');
        expect(renderDataset(records, 'csv')).toBe('name\nAda');
    });

    it('maps formats to extensions', () => {
        expect(formatExtension('json')).toBe('json');
        expect(formatExtension('csv')).toBe('csv');
        expect(formatExtension('ndjson')).toBe('ndjson');
    });

    it('defaults unknown formats to JSON', () => {
        expect(formatExtension('xml')).toBe('json');
    });
});
