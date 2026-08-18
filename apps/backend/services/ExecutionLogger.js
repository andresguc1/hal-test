import { Run, StepResult } from '../database/init.js';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_RUNS_DIR } from '../config/paths.js';
import { recoverFromCorruption, createBackup } from '../database/index.js';

class ExecutionLogger {
    async startRun(flowId, metadata = {}) {
        try {
            const run = await Run.create({
                flow_id: flowId,
                batch_id: metadata.batchId || null,
                flow_name: metadata.flowName || null,
                status: 'running',
                trigger: metadata.trigger || 'manual',
                flow_snapshot: metadata.flowSnapshot || null,
                browser_version: metadata.browserVersion || null,
            });
            return run.id;
        } catch (error) {
            console.error('[ExecutionLogger] Failed to start run:', error.message);
            if (
                error.name === 'SequelizeDatabaseError' &&
                error.message?.includes('SQLITE_CORRUPT')
            ) {
                console.warn(
                    '[ExecutionLogger] SQLite corruption detected during startRun, attempting recovery...',
                );
                createBackup();
                const sequelizeModule = await import('../database/index.js');
                const recovered = await recoverFromCorruption(sequelizeModule.default);
                if (recovered) {
                    try {
                        const run = await Run.create({
                            flow_id: flowId,
                            batch_id: metadata.batchId || null,
                            flow_name: metadata.flowName || null,
                            status: 'running',
                            trigger: metadata.trigger || 'manual',
                            flow_snapshot: metadata.flowSnapshot || null,
                            browser_version: metadata.browserVersion || null,
                        });
                        return run.id;
                    } catch (retryError) {
                        console.error(
                            '[ExecutionLogger] Retry after recovery also failed:',
                            retryError.message,
                        );
                        return null;
                    }
                }
            }
            return null;
        }
    }

    async logStep(runId, nodeData, result) {
        console.log('[ExecutionLogger.logStep] CALLED with runId:', runId, 'nodeId:', nodeData?.id);
        if (!runId) {
            console.log('[ExecutionLogger.logStep] No runId, skipping');
            return;
        }

        const { variableManager } = await import('./VariableManager.js');
        console.log(
            `[ExecutionLogger][VM_INSTANCE=${variableManager.instanceId}] Logging step for node: ${nodeData?.id}`,
        );
        const all = variableManager.getAll(runId);
        console.log(
            `[ExecutionLogger] Available variables in VM at this point: ${Object.keys(all).join(', ')}`,
        );

        try {
            console.log('[ExecutionLogger.logStep] Creating StepResult in DB...');
            await StepResult.create({
                run_id: runId,
                node_id: nodeData.id,
                node_type: nodeData.type,
                status: result.status,
                error: result.error ? String(result.error) : null,
                screenshot_path: result.screenshot,
                input_data: result.input,
                output_data: result.output,
                duration_ms: result.duration,
                memory_hit: !!result.memoryHit,
                video_timestamp: result.videoTimestamp || null,
                ai_diagnosis: result.aiDiagnosis || null,
            });
            console.log('[ExecutionLogger.logStep] StepResult created successfully');
        } catch (error) {
            console.error('[ExecutionLogger] Failed to log step:', error.message);
            if (
                error.name === 'SequelizeDatabaseError' &&
                error.message?.includes('SQLITE_CORRUPT')
            ) {
                console.warn(
                    '[ExecutionLogger] SQLite corruption detected during logStep, attempting recovery...',
                );
                createBackup();
                const sequelizeModule = await import('../database/index.js');
                const recovered = await recoverFromCorruption(sequelizeModule.default);
                if (recovered) {
                    try {
                        await StepResult.create({
                            run_id: runId,
                            node_id: nodeData.id,
                            node_type: nodeData.type,
                            status: result.status,
                            error: result.error ? String(result.error) : null,
                            screenshot_path: result.screenshot,
                            input_data: result.input,
                            output_data: result.output,
                            duration_ms: result.duration,
                            memory_hit: !!result.memoryHit,
                            video_timestamp: result.videoTimestamp || null,
                            ai_diagnosis: result.aiDiagnosis || null,
                        });
                        console.log(
                            '[ExecutionLogger] StepResult created successfully after recovery',
                        );
                        return;
                    } catch (retryError) {
                        console.error(
                            '[ExecutionLogger] Retry after recovery also failed:',
                            retryError.message,
                        );
                    }
                }
            }
            throw error;
        }
    }

    async endRun(runId, status) {
        if (!runId) return;

        try {
            const run = await Run.findByPk(runId);
            if (run) {
                const steps = await StepResult.findAll({
                    where: { run_id: runId },
                });
                const executionData = JSON.stringify(steps);

                const finishedAt = new Date();
                const duration = finishedAt.getTime() - new Date(run.started_at).getTime();

                const memoryHits = steps.filter((s) => s.memory_hit).length;
                const healedCount = steps.filter((s) => s.status === 'healed').length;

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
                    memory_palace_hits: memoryHits,
                    total_healed: healedCount,
                });
            }
        } catch (error) {
            console.error('[ExecutionLogger] Failed to end run:', error.message);
        }
    }

    async deleteRun(runId) {
        try {
            await StepResult.destroy({ where: { run_id: runId } });

            const runDir = path.join(STORAGE_RUNS_DIR, runId);
            try {
                await fs.rm(runDir, { recursive: true, force: true });
                console.log(`[ExecutionLogger] Deleted storage for run: ${runId}`);
            } catch (fsErr) {
                console.warn(`[ExecutionLogger] Could not delete run directory: ${fsErr.message}`);
            }

            const deleted = await Run.destroy({ where: { id: runId } });
            return !!deleted;
        } catch (error) {
            console.error('[ExecutionLogger] Failed to delete run:', error);
            throw error;
        }
    }

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
