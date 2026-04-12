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
}

export const testRunnerService = new TestRunnerService();
