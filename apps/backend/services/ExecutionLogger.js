import { Run, StepResult } from '../database/init.js';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

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

                // Video Finalization Logic
                let videoPath = null;
                try {
                    const runDir = path.join(STORAGE_RUNS_DIR, runId);
                    const files = await fs.readdir(runDir);
                    const videoFile = files.find((f) => f.endsWith('.webm') || f.endsWith('.mp4'));

                    if (videoFile) {
                        const oldPath = path.join(runDir, videoFile);
                        const newFilename = 'execution.webm';
                        const newPath = path.join(runDir, newFilename);

                        await fs.rename(oldPath, newPath);
                        videoPath = `storage/runs/${runId}/${newFilename}`;
                        console.log(`[ExecutionLogger] Video finalized: ${videoPath}`);
                    }
                } catch (vErr) {
                    console.warn('[ExecutionLogger] Could not finalize video:', vErr.message);
                }

                await run.update({
                    status,
                    finished_at: finishedAt,
                    duration_ms: duration,
                    execution_data: executionData,
                    video_path: videoPath,
                });
            }
        } catch (error) {
            console.error('[ExecutionLogger] Failed to end run:', error);
        }
    }

    /**
     * Deletes a run and its associated data (steps, files).
     * @param {string} runId
     */
    async deleteRun(runId) {
        try {
            // 1. Delete associated step results
            await StepResult.destroy({ where: { run_id: runId } });

            // 2. Delete the run files
            const runDir = path.join(STORAGE_RUNS_DIR, runId);
            try {
                await fs.rm(runDir, { recursive: true, force: true });
                console.log(`[ExecutionLogger] Deleted storage for run: ${runId}`);
            } catch (fsErr) {
                console.warn(`[ExecutionLogger] Could not delete run directory: ${fsErr.message}`);
            }

            // 3. Delete the run record
            const deleted = await Run.destroy({ where: { id: runId } });
            return !!deleted;
        } catch (error) {
            console.error('[ExecutionLogger] Failed to delete run:', error);
            throw error;
        }
    }

    /**
     * Clears all run history and files.
     */
    async clearHistory() {
        try {
            await StepResult.destroy({ where: {}, truncate: false });
            await Run.destroy({ where: {}, truncate: false });
            try {
                await fs.rm(STORAGE_RUNS_DIR, { recursive: true, force: true });
                await fs.mkdir(STORAGE_RUNS_DIR, { recursive: true });
            } catch (fsErr) {
                console.warn(`[ExecutionLogger] Could not clear storage: ${fsErr.message}`);
            }
            return true;
        } catch (error) {
            console.error('[ExecutionLogger] Failed to clear history:', error);
            throw error;
        }
    }
}

export const executionLogger = new ExecutionLogger();
