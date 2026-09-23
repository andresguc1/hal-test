// services/extraction/datasetAccumulator.js
// ==========================================================
// Pure helpers for the dataset accumulator semantics used by
// the `extract` node: append records across executions and
// dedupe an accumulated dataset by a configured key.
// ==========================================================

/**
 * Normalizes any value into an array of records (objects).
 * Plain arrays pass through; a single object becomes [object];
 * anything else becomes [].
 * @param {*} value
 * @returns {Array<object>}
 */
export function toRecords(value) {
    if (Array.isArray(value)) return value.filter((r) => r && typeof r === 'object');
    if (value && typeof value === 'object') return [value];
    return [];
}

/**
 * Appends incoming records to an existing dataset.
 * @param {*} existing - Existing dataset (array, object, or anything).
 * @param {Array<object>} incoming - New records extracted in this run.
 * @returns {Array<object>}
 */
export function appendRecords(existing, incoming) {
    return [...toRecords(existing), ...toRecords(incoming)];
}

/**
 * Normalizes a record value to a stable dedupe key string.
 * @param {*} value
 * @returns {string}
 */
export function keyOf(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).trim();
}

/**
 * Dedupes a dataset by a record field, keeping the first occurrence
 * (stable). Records missing the key (empty/null/undefined) are always
 * kept, so optional fields never silently collapse rows.
 *
 * @param {Array<object>} records
 * @param {string} key - Field name used for deduplication.
 * @returns {{ records: Array<object>, skipped: number }}
 */
export function dedupeRecords(records, key) {
    const list = Array.isArray(records) ? records : [];
    if (!key) return { records: list, skipped: 0 };

    const seen = new Set();
    const result = [];
    let skipped = 0;

    for (const record of list) {
        if (!record || typeof record !== 'object') {
            result.push(record);
            continue;
        }
        const k = keyOf(record[key]);
        if (k === '') {
            // Records without the dedupe field are always kept.
            result.push(record);
            continue;
        }
        if (seen.has(k)) {
            skipped += 1;
            continue;
        }
        seen.add(k);
        result.push(record);
    }

    return { records: result, skipped };
}

/**
 * Appends records and then dedupes the merged dataset by `key`.
 * @param {*} existing
 * @param {Array<object>} incoming
 * @param {string} [key] - Optional dedupe field.
 * @returns {{ records: Array<object>, added: number, skipped: number, total: number }}
 */
export function mergeDataset(existing, incoming, key) {
    const records = appendRecords(existing, incoming);
    const added = toRecords(incoming).length;
    if (!key) {
        return { records, added, skipped: 0, total: records.length };
    }
    const { records: deduped, skipped } = dedupeRecords(records, key);
    return { records: deduped, added, skipped, total: deduped.length };
}

export default {
    toRecords,
    appendRecords,
    keyOf,
    dedupeRecords,
    mergeDataset,
};
