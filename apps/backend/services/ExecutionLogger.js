import { Run, StepResult } from '../database/init.js';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_RUNS_DIR } from '../config/paths.js';
import { recoverFromCorruption, createBackup } from '../database/index.js';

class ExecutionLogger {
    /**
     * Derived, scoped run ids (componentAction uses `${runId}_child_${nodeId}`,
     * loops/for_each use `${runId}_loop_${nodeId}_${index}`) are not real rows in
     * execution_runs. Steps must always persist under the canonical ROOT run id so
     * the row passes the run_id foreign key and History can group them.
     */
    static toRootRunId(runId) {
        if (!runId) return runId;
        return String(runId).split('_child_')[0].split('_loop_')[0];
    }

    /** Per-run monotonic counters so steps keep a deterministic order. */
    constructor() {
        this.sequenceCounters = new Map();
        this.runStarts = new Map();
        this._sequenceSeeds = new Map();
    }

    /**
     * Seed the in-memory sequence counter from the DB for a process that
     * restarted mid-run, so sequences continue (never repeat) instead of
     * resetting. Each run is seeded at most once per process; concurrent
     * first-log calls share the same pending promise.
     */
    _seedSequence(rootRunId) {
        if (this.sequenceCounters.has(rootRunId)) return Promise.resolve();
        if (this._sequenceSeeds.has(rootRunId)) return this._sequenceSeeds.get(rootRunId);

        const seed = StepResult.max('sequence', { where: { run_id: rootRunId } })
            .then((max) => {
                if (!this.sequenceCounters.has(rootRunId)) {
                    this.sequenceCounters.set(rootRunId, max ? Number(max) : 0);
                }
            })
            .catch(() => {
                if (!this.sequenceCounters.has(rootRunId)) {
                    this.sequenceCounters.set(rootRunId, 0);
                }
            })
            .finally(() => {
                this._sequenceSeeds.delete(rootRunId);
            });

        this._sequenceSeeds.set(rootRunId, seed);
        return seed;
    }

    _nextSequence(runId) {
        const root = ExecutionLogger.toRootRunId(runId);
        const next = (this.sequenceCounters.get(root) || 0) + 1;
        this.sequenceCounters.set(root, next);
        return next;
    }

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
            this.runStarts.set(run.id, Date.now());
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
                        this.runStarts.set(run.id, Date.now());
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

    /**
     * Resolve a display label from node data / result / metadata with a
     * consistent priority order.
     */
    static resolveLabel(nodeData, result = {}, metadata = {}) {
        return (
            metadata.label ||
            nodeData.label ||
            nodeData.customLabel ||
            nodeData.nodeType ||
            result.label ||
            nodeData.id ||
            nodeData.type
        );
    }

    /**
     * Builds the StepResult payload, normalizing scoped run ids back to the root
     * run id, adding the per-run sequence, real started/finished times, a
     * best-effort measured video timestamp and the step label.
     */
    _buildStepPayload(runId, nodeData, result, metadata = {}) {
        const rootRunId = ExecutionLogger.toRootRunId(runId);
        const now = Date.now();
        const duration = typeof result.duration === 'number' ? result.duration : null;

        // Measured, honest timeline timestamp: seconds since the run started on
        // the server clock. The clip itself starts when the browser launches, so
        // the first steps appear slightly after t=0. We never fabricate values;
        // if the run start is unknown the timestamp is simply left null.
        let videoTimestamp = result.videoTimestamp || null;
        if (videoTimestamp === null && this.runStarts.has(rootRunId)) {
            const elapsedSec = (now - this.runStarts.get(rootRunId)) / 1000;
            videoTimestamp = elapsedSec >= 0 ? Number(elapsedSec.toFixed(3)) : null;
        }

        const label = ExecutionLogger.resolveLabel(nodeData, result, metadata);

        return {
            run_id: rootRunId,
            node_id: nodeData.id,
            node_type: nodeData.type,
            label,
            sequence: this._nextSequence(rootRunId),
            status: result.status,
            error: result.error ? String(result.error) : null,
            screenshot_path: result.screenshot,
            input_data: result.input,
            output_data: result.output,
            duration_ms: duration,
            memory_hit: !!result.memoryHit,
            video_timestamp: videoTimestamp,
            ai_diagnosis: result.aiDiagnosis || null,
            started_at: new Date(now - (duration || 0)),
            finished_at: new Date(now),
            compositeNodeId: metadata.compositeNodeId || null,
            subflowId: metadata.subflowId || null,
            parentNodeId: metadata.parentNodeId || null,
        };
    }

    async _persist(payload) {
        try {
            await StepResult.create(payload);
            return true;
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
                        await StepResult.create(payload);
                        return true;
                    } catch (retryError) {
                        console.error(
                            '[ExecutionLogger] Retry after recovery also failed:',
                            retryError.message,
                        );
                    }
                }
            }
            return false;
        }
    }

    async logStep(runId, nodeData, result, metadata = {}) {
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

        // Continue a monotonically-increasing sequence across a process restart
        // instead of restarting from 1 inside an interrupted run.
        await this._seedSequence(ExecutionLogger.toRootRunId(runId));

        const payload = this._buildStepPayload(runId, nodeData, result, metadata);
        console.log('[ExecutionLogger.logStep] Creating StepResult in DB...');
        const ok = await this._persist(payload);
        if (ok) {
            console.log('[ExecutionLogger.logStep] StepResult created successfully');
        } else {
            console.warn(`[ExecutionLogger.logStep] Step NOT persisted for node ${nodeData?.id}`);
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

                const finishedAt = new Date();
                const duration = finishedAt.getTime() - new Date(run.started_at).getTime();

                const memoryHits = steps.filter((s) => s.memory_hit).length;
                const healedCount = steps.filter((s) => s.status === 'healed').length;

                // Video finalization with explicit lifecycle states
                let videoPath = null;
                let videoStatus = 'available';

                try {
                    const runDir = path.join(STORAGE_RUNS_DIR, runId);
                    const files = await fs.readdir(runDir);
                    const videoFile = files.find((f) => f.endsWith('.webm') || f.endsWith('.mp4'));

                    if (videoFile) {
                        const oldPath = path.join(runDir, videoFile);
                        const newFilename = 'execution.webm';
                        const newPath = path.join(runDir, newFilename);

                        // Verify file exists and has content before renaming
                        const stat = await fs.stat(oldPath);
                        if (stat.size > 0) {
                            await fs.rename(oldPath, newPath);
                            videoPath = `storage/runs/${runId}/${newFilename}`;
                            console.log(`[ExecutionLogger] Video finalized: ${videoPath}`);
                        } else {
                            videoStatus = 'failed';
                            console.warn('[ExecutionLogger] Video file is empty');
                        }
                    } else {
                        videoStatus = 'failed';
                        console.warn('[ExecutionLogger] No video file found in run directory');
                    }
                } catch (vErr) {
                    console.warn('[ExecutionLogger] Could not finalize video:', vErr.message);
                    videoStatus = 'failed';
                }

                await run.update({
                    status,
                    finished_at: finishedAt,
                    duration_ms: duration,
                    video_path: videoStatus === 'available' ? videoPath : null,
                    video_status: videoStatus,
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
