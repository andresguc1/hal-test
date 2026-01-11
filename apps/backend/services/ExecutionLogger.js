import { Run, StepResult } from '../database/init.js';

class ExecutionLogger {
    /**
     * Starts a new execution run.
     * @param {string} flowId
     * @param {object} metadata - { trigger: 'manual'|'api', ... }
     * @returns {Promise<string>} runId
     */
    async startRun(flowId, metadata = {}) {
        try {
            const run = await Run.create({
                flow_id: flowId,
                flow_name: metadata.flowName || null,
                status: 'running',
                trigger: metadata.trigger || 'manual',
            });
            return run.id;
        } catch (error) {
            console.error('[ExecutionLogger] Failed to start run:', error);
            return null; // Fail safe, don't block execution
        }
    }

    /**
     * Logs the result of a step execution.
     * @param {string} runId
     * @param {object} nodeData - { id, type }
     * @param {object} result - { status, error, input, output, duration, screenshot }
     */
    async logStep(runId, nodeData, result) {
        if (!runId) return;

        try {
            await StepResult.create({
                run_id: runId,
                node_id: nodeData.id,
                node_type: nodeData.type,
                status: result.status, // 'success', 'failed', 'skipped'
                error: result.error ? String(result.error) : null,
                screenshot_path: result.screenshot,
                input_data: result.input,
                output_data: result.output,
                duration_ms: result.duration,
            });
        } catch (error) {
            console.error('[ExecutionLogger] Failed to log step:', error);
        }
    }

    /**
     * Ends the execution run.
     * @param {string} runId
     * @param {string} status - 'completed' | 'failed'
     */
    async endRun(runId, status) {
        if (!runId) return;

        try {
            const run = await Run.findByPk(runId);
            if (run) {
                const finishedAt = new Date();
                const duration = finishedAt.getTime() - new Date(run.started_at).getTime();

                await run.update({
                    status,
                    finished_at: finishedAt,
                    duration_ms: duration,
                });
            }
        } catch (error) {
            console.error('[ExecutionLogger] Failed to end run:', error);
        }
    }
}

export const executionLogger = new ExecutionLogger();
