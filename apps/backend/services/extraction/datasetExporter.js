// services/extraction/datasetExporter.js
// ==========================================================
// Pure dataset serializers for extracted records.
// Supported formats: JSON, CSV, NDJSON (newline-delimited JSON).
// ==========================================================

/**
 * Collects the union of record keys in order of appearance.
 * @param {Array<object>} records
 * @returns {Array<string>}
 */
export function collectHeaders(records) {
    const headers = [];
    const seen = new Set();
    for (const record of records || []) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
        for (const key of Object.keys(record)) {
            if (!seen.has(key)) {
                seen.add(key);
                headers.push(key);
            }
        }
    }
    return headers;
}

/**
 * Normalizes a cell value for CSV output.
 * @param {*} value
 * @returns {string}
 */
export function csvCell(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return String(value);
    return String(value);
}

/**
 * Quotes a CSV field if it contains a delimiter, quote, or newline.
 * @param {string} field
 * @param {string} delimiter
 * @returns {string}
 */
export function csvQuote(field, delimiter) {
    const needsQuoting =
        field.includes('"') ||
        field.includes(delimiter) ||
        field.includes('\n') ||
        field.includes('\r');
    if (!needsQuoting) return field;
    return `"${field.replace(/"/g, '""')}"`;
}

/**
 * Serializes records to a single CSV document (RFC 4180-ish).
 * The header is the union of all record keys in appearance order.
 * @param {Array<object>} records
 * @param {{ delimiter?: string, includeHeader?: boolean }} [options]
 * @returns {string}
 */
export function toCSV(records, options = {}) {
    const delimiter = options.delimiter || ',';
    const includeHeader = options.includeHeader !== false;
    const list = Array.isArray(records) ? records : [];
    const headers = collectHeaders(list);

    const rows = [];
    if (includeHeader && headers.length > 0) {
        rows.push(headers.map((h) => csvQuote(h, delimiter)).join(delimiter));
    }
    for (const record of list) {
        const row = headers.map((h) => {
            const value = record && typeof record === 'object' ? record[h] : undefined;
            return csvQuote(csvCell(value), delimiter);
        });
        rows.push(row.join(delimiter));
    }
    return rows.join('\n');
}

/**
 * Serializes records to pretty or compact JSON.
 * @param {Array<object>} records
 * @param {{ pretty?: boolean }} [options]
 * @returns {string}
 */
export function toJSON(records, options = {}) {
    return JSON.stringify(Array.isArray(records) ? records : [], null, options.pretty ? 2 : 0);
}

/**
 * Serializes records to newline-delimited JSON (one object per line).
 * @param {Array<object>} records
 * @returns {string}
 */
export function toNDJSON(records) {
    const list = Array.isArray(records) ? records : [];
    return list.map((record) => JSON.stringify(record)).join('\n');
}

/**
 * Renders records in the requested format.
 * @param {Array<object>} records
 * @param {string} format - 'json' | 'csv' | 'ndjson'
 * @param {object} [options]
 * @returns {string}
 */
export function renderDataset(records, format, options = {}) {
    switch (format) {
        case 'csv':
            return toCSV(records, options);
        case 'ndjson':
            return toNDJSON(records);
        case 'json':
        default:
            return toJSON(records, options);
    }
}

/**
 * Maps a format name to its file extension.
 * @param {string} format
 * @returns {string}
 */
export function formatExtension(format) {
    if (format === 'csv') return 'csv';
    if (format === 'ndjson') return 'ndjson';
    return 'json';
}

export default {
    collectHeaders,
    csvCell,
    csvQuote,
    toCSV,
    toJSON,
    toNDJSON,
    renderDataset,
    formatExtension,
};
