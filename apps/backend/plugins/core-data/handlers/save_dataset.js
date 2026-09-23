// plugins/core-data/handlers/save_dataset.js
// ==========================================================
// `save_dataset` node: persists a dataset stored in a variable
// (produced by `extract` or any accumulation) to disk as JSON,
// CSV, or NDJSON under the run's artifacts directory.
//
// Config contract (from node.data.configuration):
//   source         {string}  Variable name holding the records (array).
//   format         {string}  'json' | 'csv' | 'ndjson' (default 'json').
//   filename       {string}  Optional artifact name (sanitized) inside
//                            connections/datasets/ of the run directory.
//   outputVariable {string}  Optional variable receiving the artifact info.
//   pretty         {boolean} Pretty-print JSON (default false).
//   csvDelimiter   {string}  Field delimiter for CSV (default ',').
// ==========================================================

import path from 'path';
import fs from 'fs';
import { STORAGE_RUNS_DIR } from '../../../config/paths.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { isSafePath } from '../../../utils/security.js';
import { renderDataset, formatExtension } from '../../../services/extraction/datasetExporter.js';
import { toRecords } from '../../../services/extraction/datasetAccumulator.js';

const VALID_FORMATS = ['json', 'csv', 'ndjson'];

const saveDatasetAction = async (req, res) => {
    const {
        source,
        format = 'json',
        filename,
        outputVariable,
        pretty = false,
        csvDelimiter = ',',
        nodeId,
    } = req.body;

    try {
        if (!source || typeof source !== 'string') {
            return res.status(400).json({
                success: false,
                message: req.t(
                    'actions.save_dataset.error_missing_source',
                    'A dataset variable name (source) is required.',
                ),
            });
        }

        const targetFormat = VALID_FORMATS.includes(format) ? format : 'json';
        const runId = req.body.runId || 'atomic_run';
        const records = toRecords(variableManager.get(source, runId));

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t(
                    'actions.save_dataset.error_empty_dataset',
                    'The dataset variable is empty.',
                ),
                data: { source, records: 0 },
            });
        }

        const ext = formatExtension(targetFormat);
        const safeName = path.basename(filename || `dataset-${Date.now()}.${ext}`).trim();
        const finalName = safeName === '' ? `dataset-${Date.now()}.${ext}` : safeName;

        const runDir = path.join(STORAGE_RUNS_DIR, runId);
        const datasetsDir = path.join(runDir, 'datasets');
        const fullPath = path.join(datasetsDir, finalName);

        if (!isSafePath(fullPath, runDir)) {
            return res.status(400).json({
                success: false,
                message: req.t(
                    'actions.save_dataset.error_unsafe_path',
                    'The target path is not allowed.',
                ),
            });
        }

        await fs.promises.mkdir(datasetsDir, { recursive: true });

        const content =
            targetFormat === 'csv'
                ? renderDataset(records, 'csv', { delimiter: csvDelimiter || ',' })
                : renderDataset(records, targetFormat, { pretty: pretty === true });

        await fs.promises.writeFile(fullPath, content, 'utf-8');

        const relativePath = path.relative(STORAGE_RUNS_DIR, fullPath).split(path.sep).join('/');
        const downloadUrl = `storage/runs/${relativePath}`;

        const artifactInfo = {
            path: fullPath,
            relativePath,
            fileName: finalName,
            format: targetFormat,
            records: records.length,
            bytes: Buffer.byteLength(content, 'utf-8'),
            downloadUrl,
        };

        if (outputVariable && typeof outputVariable === 'string') {
            variableManager.set(outputVariable, artifactInfo, runId);
        }

        emitLog({
            message: `Dataset saved (${records.length} records, ${artifactInfo.bytes} bytes) → ${path.relative(process.cwd(), fullPath)}`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.save_dataset.success', 'Dataset saved successfully.'),
            data: artifactInfo,
        });
    } catch (error) {
        console.error('[ERROR] saveDatasetAction:', error.message);
        emitLog({
            message: `Error saving dataset: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.save_dataset.error', 'Error saving dataset.'),
            error: error.message,
        });
    }
};

export default saveDatasetAction;
