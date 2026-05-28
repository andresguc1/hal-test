import { executionService } from '../services/ExecutionService.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { Run, StepResult, Flow } from '../database/init.js';
import { reportExporter } from '../services/exporter/ReportExporter.js';
import { testRunnerService } from '../services/TestRunnerService.js';
import { activeRunManager } from '../services/ActiveRunManager.js';

export const startBatchRunAction = async (req, res) => {
    try {
        const { flowIds, projectId, concurrency, overrides } = req.body;

        if (!flowIds || !Array.isArray(flowIds) || flowIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: 'Valid flowIds array is required.' });
        }

        const batchId = await testRunnerService.runBatch(flowIds, projectId, concurrency || 2, {
            overrides,
        });

        return res.status(200).json({
            success: true,
            batchId,
            message: `Batch execution initiated with ${flowIds.length} flows and concurrency ${concurrency || 2}`,
        });
    } catch (error) {
        console.error('[RunController] startBatchRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const startRunAction = async (req, res) => {
    try {
        const { flowId, flowName, trigger, nodes, edges, projectId, overrides } = req.body;

        // If nodes/edges are provided, it's a frontend-orchestrated run
        if (nodes && edges) {
            const flowSnapshot = JSON.stringify({ nodes, edges });
            const runId = await executionLogger.startRun(flowId, {
                flowName,
                trigger,
                flowSnapshot,
            });

            if (!runId) {
                return res.status(500).json({ success: false, message: 'Failed to start run' });
            }
            return res.status(200).json({ success: true, runId });
        }

        // If flowId and projectId are provided without snapshot, it's a REMOTE run
        if (flowId && projectId) {
            console.log(`[RemoteRun] Resolved flowId: ${flowId}, projectId: ${projectId}`);

            const flow = await Flow.findByPk(flowId);
            if (!flow) {
                console.warn(`[RemoteRun] Flow ${flowId} not found in database`);
            }

            // 2. Create the run record first so we have an ID to return
            console.log(`[RemoteRun] Initializing run record...`);
            const runId = await executionLogger.startRun(flowId, {
                flowName: flow?.name || 'Remote Run',
                trigger: 'api',
            });

            if (!runId) {
                console.error(`[RemoteRun] Failed to create runId`);
                return res
                    .status(500)
                    .json({ success: false, message: 'Failed to initialize run' });
            }

            console.log(`[RemoteRun] Run created with ID: ${runId}. Triggering execution...`);

            // 3. Trigger execution in the background (DO NOT AWAIT)
            // Extract AI configuration headers to pass to execution
            const aiHeaders = {};
            for (const [key, value] of Object.entries(req.headers)) {
                if (key.startsWith('x-ai-')) {
                    aiHeaders[key] = value;
                }
            }

            executionService
                .executeFlow(flowId, projectId, { overrides, runId, headers: aiHeaders })
                .then(() => console.log(`[RemoteRun] Execution completed for runId: ${runId}`))
                .catch((err) =>
                    console.error(`[RemoteExecution] Background task failed: ${err.message}`, err),
                );

            return res.status(200).json({
                success: true,
                runId,
                message: 'Remote execution initiated in background',
            });
        }

        return res.status(400).json({
            success: false,
            message:
                'Incomplete run data. Provide flowId/projectId for remote run, or snapshot for client run.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const endRunAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'completed' | 'failed'
        await executionLogger.endRun(id, status);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getRunsAction = async (req, res) => {
    try {
        const { flowId, status, limit = 50 } = req.query;
        const whereClause = {};

        if (flowId) {
            whereClause.flow_id = flowId;
        }
        if (status) {
            whereClause.status = status;
        }

        const runs = await Run.findAll({
            where: whereClause,
            order: [['started_at', 'DESC']],
            limit: parseInt(limit, 10),
        });
        return res.status(200).json({ success: true, data: runs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getRunDetailsAction = async (req, res) => {
    try {
        const { id } = req.params;
        const run = await Run.findByPk(id, {
            include: [{ model: StepResult, as: 'steps' }],
        });

        if (!run) {
            return res.status(404).json({ success: false, message: 'Run not found' });
        }

        return res.status(200).json({ success: true, data: run });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteRunAction = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await executionLogger.deleteRun(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Run not found' });
        }

        return res.status(200).json({ success: true, message: 'Run deleted successfully' });
    } catch (error) {
        console.error(`[ERROR] Failed to delete run ${id}:`, error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const clearHistoryAction = async (req, res) => {
    try {
        await executionLogger.clearHistory();
        return res.status(200).json({ success: true, message: 'History cleared successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getReportAnalyticsAction = async (req, res) => {
    try {
        const { projectId } = req.query;

        // Fetch last 100 runs for analytics
        const runs = await Run.findAll({
            where: projectId ? { project_id: projectId } : {},
            order: [['started_at', 'DESC']],
            limit: 100,
        });

        // 1. Calculate ROI
        const totalHealed = runs.reduce((acc, r) => acc + (r.total_healed || 0), 0);
        const timeSavedMinutes = totalHealed * 15; // 15 mins saved per healed test
        const roiHours = (timeSavedMinutes / 60).toFixed(1);

        // 2. Memory Growth
        const totalMemoryHits = runs.reduce((acc, r) => acc + (r.memory_palace_hits || 0), 0);

        // 3. Flakiness Heatmap (Failure count per node)
        // We'll join with StepResult for recent failures
        const recentFailures = await StepResult.findAll({
            where: { status: 'failed' },
            limit: 500,
            order: [['createdAt', 'DESC']],
            attributes: ['node_id', 'node_type', 'createdAt'],
        });

        const nodeFailures = {};
        recentFailures.forEach((f) => {
            nodeFailures[f.node_id] = (nodeFailures[f.node_id] || 0) + 1;
        });

        // Map to a sorted array for the frontend
        const heatmap = Object.entries(nodeFailures)
            .map(([nodeId, count]) => ({ nodeId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return res.status(200).json({
            success: true,
            data: {
                roi: {
                    healed: totalHealed,
                    timeSaved: `${roiHours}h`,
                },
                memory: {
                    hits: totalMemoryHits,
                },
                heatmap,
                totalRuns: runs.length,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const exportReportAction = async (req, res) => {
    try {
        const { id } = req.params;
        const exportPath = await reportExporter.generateSingleFileReport(id);
        return res.download(exportPath);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getBatchSummaryAction = async (req, res) => {
    try {
        const { batchId } = req.params;

        const runs = await Run.findAll({
            where: { batch_id: batchId },
            attributes: ['status', 'flow_id', 'flow_name', 'id', 'duration_ms'],
        });

        if (!runs || runs.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        let passed = 0;
        let failed = 0;
        let running = 0;

        runs.forEach((r) => {
            if (r.status === 'completed') passed++;
            else if (r.status === 'failed') failed++;
            else running++;
        });

        return res.status(200).json({
            success: true,
            data: {
                batchId,
                total: runs.length,
                passed,
                failed,
                running,
                runs,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getFlowHistoryAction = async (req, res) => {
    try {
        const { flowId } = req.params;
        const runs = await Run.findAll({
            where: { flow_id: flowId },
            order: [['started_at', 'DESC']],
            limit: 10,
            attributes: [
                'id',
                'status',
                'started_at',
                'duration_ms',
                'total_healed',
                'memory_palace_hits',
            ],
        });

        return res.status(200).json({ success: true, data: runs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const cancelRunAction = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[RunController] Request to cancel run ID: ${id}`);

        const aborted = activeRunManager.abort(id);
        if (aborted) {
            return res.status(200).json({
                success: true,
                message: `Run ${id} cancelled successfully.`,
            });
        }

        return res.status(404).json({
            success: false,
            message: `Active run ID ${id} not found or already finished.`,
        });
    } catch (error) {
        console.error('[RunController] cancelRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
