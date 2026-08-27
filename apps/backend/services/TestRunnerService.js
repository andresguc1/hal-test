import crypto from 'crypto';
import { executionService } from './ExecutionService.js';
import { emitLog } from '../socket.js';

class TestRunnerService {
    /**
     * Executes multiple flows concurrently with a limited number of workers.
     * @param {string[]} flowIds - Array of Flow IDs to execute.
     * @param {string} projectId - ID of the project.
     * @param {number} concurrency - Number of parallel workers/browser instances allowed.
     * @param {object} options - Additional execution options.
     * @returns {Promise<string>} batchId - UUID for this batch of executions.
     */
    async runBatch(flowIds, projectId, concurrency = 2, options = {}) {
        if (!flowIds || flowIds.length === 0) {
            throw new Error('No configuration or flows provided for batch run.');
        }

        const batchId = crypto.randomUUID();
        const totalFlows = flowIds.length;

        console.log(
            `[TestRunner] Starting Batch ${batchId} with ${totalFlows} flows using ${concurrency} workers.`,
        );
        emitLog({
            message: `[TestRunner] Batch started: ${totalFlows} flows. Concurrency limit: ${concurrency}`,
            type: 'info',
        });

        // Fire-and-forget the processing so the HTTP response can return immediately
        // while the batch runs in the background.
        this._processQueue(flowIds, projectId, concurrency, batchId, options).catch((err) => {
            console.error(`[TestRunner] Critical Batch error for ${batchId}:`, err);
        });

        return batchId;
    }

    async _processQueue(flowIds, projectId, concurrency, batchId, options) {
        let index = 0;
        const totalFlows = flowIds.length;
        let completed = 0;
        let failed = 0;

        const results = [];

        // Worker generator
        const worker = async (workerId) => {
            while (index < flowIds.length) {
                const currentIndex = index++;
                const flowId = flowIds[currentIndex];

                try {
                    console.log(
                        `[TestRunner] Worker ${workerId} executing flow ${flowId} (${currentIndex + 1}/${totalFlows})`,
                    );

                    const runId = await executionService.executeFlow(flowId, projectId, {
                        ...options,
                        batchId: batchId,
                        // Optionally override UI flags like forcing headless during mass runs
                        overrides: { ...options.overrides, headless: true },
                    });

                    results.push({ flowId, runId, status: 'completed' });
                    completed++;
                } catch (error) {
                    console.error(
                        `[TestRunner] Worker ${workerId} failed on flow ${flowId}:`,
                        error.message,
                    );
                    results.push({ flowId, error: error.message, status: 'failed' });
                    failed++;
                }
            }
        };

        // Create the worker fleet
        const workers = Array.from({ length: Math.min(concurrency, totalFlows) }).map((_, i) =>
            worker(i + 1),
        );

        await Promise.allSettled(workers);

        console.log(
            `[TestRunner] Batch ${batchId} finished. Total: ${totalFlows}. Pass: ${completed}, Fail: ${failed}`,
        );
        emitLog({
            message: `[TestRunner] Batch ${batchId} completed. ${completed} Pass / ${failed} Fail`,
            type: failed > 0 ? 'warning' : 'success',
        });

        return results;
    }

    /**
     * Executes a single flow iteratively over a dataset of inputs concurrently with limited workers.
     * @param {string} flowId - The Flow ID to execute.
     * @param {string} projectId - ID of the project.
     * @param {object[]} dataset - Array of rows/objects.
     * @param {object} variablesMapping - Mapping of dataset keys to variable names.
     * @param {number} concurrency - Number of parallel workers/browser instances allowed.
     * @param {object} options - Additional execution options.
     * @returns {Promise<string>} batchId - UUID for this batch of executions.
     */
    async runDatasetBatch(
        flowId,
        projectId,
        dataset,
        variablesMapping,
        concurrency = 2,
        options = {},
    ) {
        if (!flowId) {
            throw new Error('flowId is required for dataset batch run.');
        }
        if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
            throw new Error('dataset must be a non-empty array.');
        }

        const batchId = crypto.randomUUID();
        const totalRows = dataset.length;

        console.log(
            `[TestRunner] Starting Dataset Batch ${batchId} for flow ${flowId} with ${totalRows} rows using ${concurrency} workers.`,
        );
        emitLog({
            message: `[TestRunner] Dataset Batch started: ${totalRows} iterations. Concurrency limit: ${concurrency}`,
            type: 'info',
        });

        // Fire-and-forget the processing so the HTTP response can return immediately
        // while the batch runs in the background.
        this._processDatasetQueue(
            flowId,
            projectId,
            dataset,
            variablesMapping,
            concurrency,
            batchId,
            options,
        ).catch((err) => {
            console.error(`[TestRunner] Critical Dataset Batch error for ${batchId}:`, err);
        });

        return batchId;
    }

    async _processDatasetQueue(
        flowId,
        projectId,
        dataset,
        variablesMapping,
        concurrency,
        batchId,
        options,
    ) {
        let index = 0;
        const totalRows = dataset.length;
        let completed = 0;
        let failed = 0;

        const results = [];

        // Fetch flow to get its name and snapshot
        const { Flow, Node, Edge } = await import('../database/init.js');
        const { executionLogger } = await import('./ExecutionLogger.js');
        const flow = await Flow.findByPk(flowId, {
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });
        const baseFlowName = flow ? flow.name : 'Flow';

        let flowSnapshot = null;
        if (flow) {
            const nodes = flow.nodes.map((n) => {
                const nodeObj = n.toJSON();
                return {
                    ...nodeObj,
                    id: nodeObj.nodeId, // Map to React Flow id format
                };
            });
            const nodeIds = new Set(nodes.map((n) => n.id));
            const edges = flow.edges
                .map((e) => {
                    const edgeObj = e.toJSON();
                    return {
                        ...edgeObj,
                        id: edgeObj.edgeId, // Map to React Flow id format
                    };
                })
                .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
            flowSnapshot = JSON.stringify({ nodes, edges });
        }

        const worker = async (workerId) => {
            while (index < dataset.length) {
                const currentIndex = index++;
                const row = dataset[currentIndex];

                // 1. Map row fields to variables
                const mappedVariables = {};
                if (
                    variablesMapping &&
                    typeof variablesMapping === 'object' &&
                    Object.keys(variablesMapping).length > 0
                ) {
                    for (const [varName, columnName] of Object.entries(variablesMapping)) {
                        if (columnName && row[columnName] !== undefined) {
                            mappedVariables[varName] = row[columnName];
                        }
                    }
                } else {
                    // Fallback: auto-map matching names
                    Object.assign(mappedVariables, row);
                }

                // 2. Determine a row preview/identifier for the run name
                const rowKeys = Object.keys(row);
                let rowIdentifier = '';
                if (rowKeys.length > 0) {
                    const candidateKey =
                        rowKeys.find((k) =>
                            ['email', 'username', 'user', 'name', 'id', 'key'].includes(
                                k.toLowerCase(),
                            ),
                        ) || rowKeys[0];
                    rowIdentifier = String(row[candidateKey] || '');
                    if (rowIdentifier.length > 15) {
                        rowIdentifier = rowIdentifier.substring(0, 15) + '...';
                    }
                }

                const iterationLabel = rowIdentifier ? ` - ${rowIdentifier}` : '';
                const runFlowName = `${baseFlowName} [Iter ${currentIndex + 1}${iterationLabel}]`;

                // 3. Pre-create run record so it has a custom name
                const runId = await executionLogger.startRun(flowId, {
                    flowName: runFlowName,
                    trigger: 'dataset',
                    batchId: batchId,
                    flowSnapshot,
                });

                try {
                    console.log(
                        `[TestRunner] Worker ${workerId} executing dataset row ${currentIndex + 1}/${totalRows} (Run ID: ${runId})`,
                    );

                    await executionService.executeFlow(flowId, projectId, {
                        ...options,
                        runId,
                        batchId,
                        variables: mappedVariables,
                        overrides: { ...options.overrides, headless: true },
                    });

                    results.push({ runId, index: currentIndex, status: 'completed' });
                    completed++;
                } catch (error) {
                    console.error(
                        `[TestRunner] Worker ${workerId} failed on row ${currentIndex + 1}:`,
                        error.message,
                    );
                    results.push({
                        runId,
                        index: currentIndex,
                        error: error.message,
                        status: 'failed',
                    });
                    failed++;
                }
            }
        };

        // Create the worker fleet
        const workers = Array.from({ length: Math.min(concurrency, totalRows) }).map((_, i) =>
            worker(i + 1),
        );

        await Promise.allSettled(workers);

        console.log(
            `[TestRunner] Dataset Batch ${batchId} finished. Total: ${totalRows}. Pass: ${completed}, Fail: ${failed}`,
        );
        emitLog({
            message: `[TestRunner] Dataset Batch ${batchId} completed. ${completed} Pass / ${failed} Fail`,
            type: failed > 0 ? 'warning' : 'success',
        });

        return results;
    }
}

export const testRunnerService = new TestRunnerService();
