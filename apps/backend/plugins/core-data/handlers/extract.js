// plugins/core-data/handlers/extract.js
// ==========================================================
// `extract` node: captures structured data (text, attribute, or
// HTML) from the active page using Playwright locators.
//
// Config contract (from node.data.configuration):
//   selector       {string}  Root locator (required).
//   repeated       {boolean} When true, extract from every match of
//                            `selector`; otherwise from the first only.
//   fields         {array}   [{ name, source: 'text'|'attribute'|'html',
//                            selector, attribute, optional }]
//   outputVariable {string}  Variable that receives the dataset (array).
//   accumulateInto {string}  Optional accumulator variable; records are
//                            appended across executions (pagination loops).
//   dedupeKey      {string}  Optional field used to drop duplicates.
//   ifEmpty        {'ok'|'fail'} Behaviour when nothing matched.
// ==========================================================

import { validateBrowser, getOrCreateContext } from '../../../core/browser-utils.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { mergeDataset, dedupeRecords } from '../../../services/extraction/datasetAccumulator.js';

const VALID_SOURCES = ['text', 'attribute', 'html'];

/**
 * Normalizes the `fields` config into a stable list of field definitions:
 * [{ name, source, selector, attribute, optional }]. Accepts either an
 * array (modern) or a record keyed by field name (legacy/compat).
 */
export function normalizeFieldDefs(fields) {
    const defs = [];
    const pushDef = (name, raw) => {
        if (!name || !raw || typeof raw !== 'object') return;
        const source = VALID_SOURCES.includes(raw.source) ? raw.source : 'text';
        const def = {
            name: String(name).trim(),
            source,
            selector: typeof raw.selector === 'string' ? raw.selector.trim() : '',
            attribute: typeof raw.attribute === 'string' ? raw.attribute.trim() : '',
            optional: raw.optional === true,
        };
        if (def.name) defs.push(def);
    };

    if (Array.isArray(fields)) {
        for (const field of fields) {
            if (!field) continue;
            pushDef(field.name, field);
        }
    } else if (fields && typeof fields === 'object') {
        for (const [name, raw] of Object.entries(fields)) {
            if (typeof raw === 'string') {
                pushDef(name, { source: 'text', selector: raw });
            } else {
                pushDef(name, raw);
            }
        }
    }
    return defs;
}

async function readFromLocator(locator, def) {
    if (def.source === 'html') {
        return (await locator.innerHTML()) || '';
    }
    if (def.source === 'attribute') {
        if (!def.attribute) return '';
        const value = await locator.getAttribute(def.attribute);
        return value == null ? '' : value;
    }
    return ((await locator.textContent()) || '').trim();
}

/**
 * Extracts one record from an element locator (the root item).
 * Each field resolves relative to that element.
 */
async function extractRecord(element, defs) {
    const record = {};
    for (const def of defs) {
        try {
            if (def.selector) {
                record[def.name] = await readFromLocator(
                    element.locator(def.selector).first(),
                    def,
                );
            } else {
                record[def.name] = await readFromLocator(element, def);
            }
        } catch (err) {
            // A missing optional sub-element should not fail the whole item.
            record[def.name] = '';
        }
    }
    return record;
}

const extractAction = async (req, res) => {
    const {
        browserId,
        selector,
        repeated = true,
        fields,
        outputVariable = 'extractedData',
        accumulateInto,
        dedupeKey,
        ifEmpty = 'ok',
        timeoutMs,
        nodeId,
    } = req.body;

    try {
        if (!selector || typeof selector !== 'string' || selector.trim() === '') {
            return res.status(400).json({
                success: false,
                message: req.t(
                    'actions.extract.error_no_selector',
                    'Selector is required for extract.',
                ),
            });
        }

        const defs = normalizeFieldDefs(fields);

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        const browserIdActual = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        const context = await getOrCreateContext(req, browser, browserIdActual);
        const pages = context.pages();
        const page = pages.length > 0 ? pages[pages.length - 1] : await context.newPage();

        emitLog({
            message: `Extracting data with selector: ${selector} (repeated=${repeated})`,
            type: 'info',
            nodeId,
        });

        const locator = page.locator(selector);
        const records = [];

        if (repeated) {
            const count = await locator.count();
            for (let i = 0; i < count; i++) {
                records.push(await extractRecord(locator.nth(i), defs));
            }
        } else if ((await locator.first().count()) > 0) {
            const element = locator.first();
            if (defs.length > 0) {
                records.push(await extractRecord(element, defs));
            } else {
                records.push({ value: ((await element.textContent()) || '').trim() });
            }
        }

        // Empty-result policy: 'ok' continues silently, 'fail' marks the node
        // as failed so a downstream conditional can branch on it.
        if (records.length === 0 && ifEmpty === 'fail') {
            return res.json({
                success: false,
                status: 'error',
                message: req.t('actions.extract.empty', 'No elements matched the selector.'),
                data: {
                    records: [],
                    count: 0,
                    selector,
                    variableName: outputVariable,
                },
            });
        }

        // Accumulate into a run-scoped dataset (pagination loop pattern),
        // optionally de-duplicating by a key field.
        let dataset = records;
        let added = records.length;
        let skipped = 0;
        let total = records.length;

        if (accumulateInto && typeof accumulateInto === 'string') {
            const existing = variableManager.get(accumulateInto, req.body.runId);
            const merged = mergeDataset(existing, records, dedupeKey);
            dataset = merged.records;
            added = merged.added;
            skipped = merged.skipped;
            total = merged.total;
            variableManager.set(accumulateInto, dataset, req.body.runId);
            emitLog({
                message: `Accumulated dataset "${accumulateInto}": total=${total}, added=${added}, duplicatesSkipped=${skipped}`,
                type: 'info',
                nodeId,
            });
        } else if (dedupeKey && typeof dedupeKey === 'string') {
            const { records: deduped, skipped: skippedBatch } = dedupeRecords(records, dedupeKey);
            dataset = deduped;
            skipped = skippedBatch;
            total = dataset.length;
        }

        variableManager.set(outputVariable, dataset, req.body.runId);

        emitLog({
            message: `Extracted ${records.length} records → variable "${outputVariable}"`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.extract.success', 'Data extracted successfully.'),
            data: {
                records: dataset,
                batchCount: records.length,
                count: dataset.length,
                added,
                duplicatesSkipped: skipped,
                total,
                selector,
                variableName: outputVariable,
                accumulateInto: accumulateInto || null,
                dedupeKey: dedupeKey || null,
                timeoutMs: timeoutMs || undefined,
            },
        });
    } catch (error) {
        console.error('[ERROR] extractAction:', error.message);
        emitLog({
            message: `Error extracting data: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.extract.error', 'Error extracting data.'),
            error: error.message,
        });
    }
};

export default extractAction;
