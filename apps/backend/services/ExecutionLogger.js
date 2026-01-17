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
                flow_snapshot: metadata.flowSnapshot || null,
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
        console.log('[ExecutionLogger.logStep] CALLED with runId:', runId, 'nodeId:', nodeData?.id);
        if (!runId) {
            console.log('[ExecutionLogger.logStep] No runId, skipping');
            return;
        }

        try {
            console.log('[ExecutionLogger.logStep] Creating StepResult in DB...');
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
            console.log('[ExecutionLogger.logStep] StepResult created successfully');
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
                // Aggregation Logic: Fetch all steps for this run
                const steps = await StepResult.findAll({ where: { run_id: runId } });
                const executionData = JSON.stringify(steps);

                const finishedAt = new Date();
                const duration = finishedAt.getTime() - new Date(run.started_at).getTime();

                await run.update({
                    status,
                    finished_at: finishedAt,
                    duration_ms: duration,
                    execution_data: executionData,
                });
            }
        } catch (error) {
            console.error('[ExecutionLogger] Failed to end run:', error);
        }
    }
}

export const executionLogger = new ExecutionLogger();
