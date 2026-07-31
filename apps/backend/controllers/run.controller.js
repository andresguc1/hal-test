import { executionService } from '../services/ExecutionService.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { Run, StepResult, Flow, Project, CollaboratorRole, Node, Edge } from '../database/init.js';
import { reportExporter } from '../services/exporter/ReportExporter.js';
import { testRunnerService } from '../services/TestRunnerService.js';
import { activeRunManager } from '../services/ActiveRunManager.js';
import { executionManager } from '../services/ExecutionManager.js';
import { ThrottlePolicy } from '../services/ThrottlePolicy.js';
import { executionLock } from '../services/collaboration/ExecutionLock.js';
import { emitFlowFinished } from '../socket.js';

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
        const userId = req.user?.id || 'anonymous';
        const userName = req.user?.email || req.user?.name || 'Anonymous';

        const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        const isAuthDisabled =
            process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';
        const isLocalMode =
            process.env.HALTEST_MODE === 'local' || process.env.HAL_CLI_MODE === 'true';

        if (flowId) {
            const flow = await Flow.findByPk(flowId);
            if (!flow) {
                return res.status(404).json({ success: false, message: 'Flow not found' });
            }
            const resolvedProjectId = projectId || flow.projectId || flow.project_id;
            if (resolvedProjectId) {
                const project = await Project.findByPk(resolvedProjectId);
                if (project && project.collaborationEnabled) {
                    let role = 'viewer';
                    if (
                        isAuthDisabled ||
                        isLocalMode ||
                        (isDev && isAuthDisabled) ||
                        project.userId === userId
                    ) {
                        role = 'owner';
                    } else {
                        const collab = await CollaboratorRole.findOne({
                            where: { projectId: resolvedProjectId, userId },
                        });
                        if (collab) {
                            role = collab.role;
                        }
                    }

                    if (role !== 'owner') {
                        return res.status(403).json({
                            success: false,
                            message:
                                'Unauthorized: Only the project owner can execute flows when collaboration is enabled.',
                        });
                    }
                }
            }
        }

        // Check if flow execution is already locked by another user
        const lockCheck = executionLock.check(flowId);
        if (lockCheck.locked && lockCheck.holder.userId !== userId) {
            return res.status(409).json({
                success: false,
                message: `Cannot execute flow: Locked by ${lockCheck.holder.userName} who is running another execution.`,
                holder: lockCheck.holder,
            });
        }

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

            // Acquire execution lock
            await executionLock.acquire(flowId, userId, userName, runId);

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

            // Acquire execution lock
            await executionLock.acquire(flowId, userId, userName, runId);

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
                )
                .finally(async () => {
                    await executionLock.release(flowId);
                });

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

        // Release execution lock if it exists
        const run = await Run.findByPk(id);
        if (run) {
            await executionLock.release(run.flow_id || run.flowId);
        }

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
            limit: Math.min(parseInt(limit, 10) || 50, 100),
        });
        return res.status(200).json({ success: true, data: runs || [] });
    } catch (error) {
        console.error('[RunController] getRunsAction Error:', error);
        return res.status(200).json({ success: true, data: [] });
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

        // Normalize steps to use both node_id and nodeId for frontend compatibility
        const runData = run.toJSON();
        const normalizedSteps = (runData.steps || []).map((s) => ({
            ...s,
            nodeId: s.nodeId || s.node_id, // Ensure both field names exist
        }));
        const normalizedRun = {
            ...runData,
            steps: normalizedSteps,
        };

        return res.status(200).json({ success: true, data: normalizedRun });
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
        console.log(`[RunController] 🛑 Request to cancel run ID or Flow ID: ${id}`);

        // 1. Release execution lock if it exists for run or flow
        await executionLock.release(id);
        const run = await Run.findByPk(id);
        if (run) {
            await executionLock.release(run.flow_id || run.flowId);
        }

        // 2. Abort in ActiveRunManager
        const aborted = activeRunManager.abort(id);

        // 3. Force abort worker pool processes
        try {
            const { abortAllPools } = await import('../services/WorkerPool.js');
            abortAllPools();
        } catch (poolErr) {
            console.warn('[RunController] Warning aborting worker pools:', poolErr.message);
        }

        return res.status(200).json({
            success: true,
            aborted,
            message: `Run ${id} cancelled successfully.`,
        });
    } catch (error) {
        console.error('[RunController] cancelRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const startDatasetBatchRunAction = async (req, res) => {
    try {
        const { flowId, projectId, dataset, variablesMapping, concurrency, overrides } = req.body;
        const userId = req.user?.id || 'anonymous';

        if (!flowId || !projectId) {
            return res
                .status(400)
                .json({ success: false, message: 'flowId and projectId are required.' });
        }

        // Check lock before starting dataset runs
        const lockCheck = executionLock.check(flowId);
        if (lockCheck.locked && lockCheck.holder.userId !== userId) {
            return res.status(409).json({
                success: false,
                message: `Cannot execute flow: Locked by ${lockCheck.holder.userName} who is running another execution.`,
                holder: lockCheck.holder,
            });
        }

        if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: 'A non-empty dataset array is required.' });
        }

        const batchId = await testRunnerService.runDatasetBatch(
            flowId,
            projectId,
            dataset,
            variablesMapping,
            concurrency || 2,
            { overrides },
        );

        return res.status(200).json({
            success: true,
            batchId,
            message: `Dataset batch execution initiated with ${dataset.length} iterations and concurrency ${concurrency || 2}`,
        });
    } catch (error) {
        console.error('[RunController] startDatasetBatchRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Starts a performance (load/stress) test run.
 * Uses the PerformanceRunner to execute the flow with multiple VUs concurrently.
 */
export const startPerformanceRunAction = async (req, res) => {
    try {
        const { flowId, projectId, performanceConfig = {}, nodes, edges } = req.body;
        const userId = req.user?.id || 'anonymous';
        const userName = req.user?.email || req.user?.name || 'Anonymous';

        if (!flowId) {
            return res.status(400).json({ success: false, message: 'flowId is required.' });
        }

        // Check if locked
        const lockCheck = executionLock.check(flowId);
        if (lockCheck.locked && lockCheck.holder.userId !== userId) {
            return res.status(409).json({
                success: false,
                message: `Cannot execute flow: Locked by ${lockCheck.holder.userName} who is running another execution.`,
                holder: lockCheck.holder,
            });
        }

        // Sync nodes and edges if provided by frontend canvas
        if (nodes && Array.isArray(nodes) && nodes.length > 0) {
            await Node.destroy({ where: { flowId } });
            await Node.bulkCreate(
                nodes.map((n, idx) => ({
                    nodeId: String(n.id || n.nodeId || `node_${idx + 1}`),
                    type: String(n.data?.type || n.type || 'action'),
                    data: n.data || {},
                    position: n.position || { x: 0, y: 0 },
                    flowId,
                    parentId: n.parentId || null,
                })),
            );
            if (edges && Array.isArray(edges)) {
                await Edge.destroy({ where: { flowId } });
                const validEdges = edges
                    .filter(
                        (e) => e && (e.source || e.sourceHandle) && (e.target || e.targetHandle),
                    )
                    .map((e, idx) => ({
                        edgeId: String(e.id || e.edgeId || `edge_${idx + 1}`),
                        source: String(e.source),
                        target: String(e.target),
                        sourceHandle: e.sourceHandle || null,
                        targetHandle: e.targetHandle || null,
                        flowId,
                    }));
                if (validEdges.length > 0) {
                    await Edge.bulkCreate(validEdges);
                }
            }
        }

        // Fetch flow with updated nodes and edges for the runner
        const flow = await Flow.findByPk(flowId, {
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });
        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found.' });
        }

        const effectiveProjectId = projectId || flow.project_id || flow.projectId;

        // Pre-flight resource check
        const requestedVUs = performanceConfig.virtualUsers || 1;
        const estimate = ThrottlePolicy.estimate(
            requestedVUs,
            null,
            performanceConfig.headless !== false,
        );

        // Auto-throttle if requested VUs exceed safe RAM limit (unless aggressive mode)
        if (estimate.exceeds && performanceConfig.throttleStrategy !== 'aggressive') {
            performanceConfig.virtualUsers = estimate.safeVUs;
            if (performanceConfig.stages && Array.isArray(performanceConfig.stages)) {
                performanceConfig.stages = performanceConfig.stages.map((s) => ({
                    ...s,
                    target: Math.min(s.target, estimate.safeVUs),
                }));
            }
        }

        // Create run record for history
        const runId = await executionLogger.startRun(flowId, {
            flowName: flow.name,
            trigger: 'performance',
            flowSnapshot: JSON.stringify({ performanceConfig }),
        });

        // Acquire lock
        await executionLock.acquire(flowId, userId, userName, runId);

        // Fire-and-forget: performance runs are long-lived
        const perfRunPromise = executionManager.execute(
            'performance',
            { ...flow.toJSON(), projectId: effectiveProjectId },
            { performanceConfig, runId },
        );

        perfRunPromise
            .then(async (result) => {
                console.log(
                    `[RunController] Performance run completed for flow ${flowId}: ` +
                        `${result.data?.totalRequests || 0} requests`,
                );
                const run = await Run.findByPk(runId);
                if (run) {
                    run.flow_snapshot = JSON.stringify(result);
                    await run.save();
                }
                await executionLogger.endRun(runId, result.success ? 'completed' : 'failed');
            })
            .catch(async (err) => {
                console.error(`[RunController] Performance run failed: ${err.message}`);
                await executionLogger.endRun(runId, 'failed');
            })
            .finally(async () => {
                await executionLock.release(flowId);
            });

        return res.status(200).json({
            success: true,
            runId,
            message: `Performance test initiated: ${performanceConfig.virtualUsers || 1} VUs × ${performanceConfig.duration || 30}s`,
            estimate,
        });
    } catch (error) {
        console.error('[RunController] startPerformanceRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Returns a resource estimate for a proposed performance run configuration.
 * Used by the frontend to show RAM/VU warnings before starting.
 */
export const estimatePerformanceAction = async (req, res) => {
    try {
        const { virtualUsers = 1, headless = true } = req.body;

        const estimate = ThrottlePolicy.estimate(virtualUsers, null, headless);
        const systemSnapshot = ThrottlePolicy.snapshot();

        return res.status(200).json({
            success: true,
            data: {
                estimate,
                system: systemSnapshot,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Starts a security audit test run.
 * Executes the flow in security mode.
 */
export const startSecurityRunAction = async (req, res) => {
    try {
        const { flowId, projectId, securityConfig = {} } = req.body;
        const userId = req.user?.id || 'anonymous';
        const userName = req.user?.email || req.user?.name || 'Anonymous';

        if (!flowId) {
            return res.status(400).json({ success: false, message: 'flowId is required.' });
        }

        // Check if locked
        const lockCheck = executionLock.check(flowId);
        if (lockCheck.locked && lockCheck.holder.userId !== userId) {
            return res.status(409).json({
                success: false,
                message: `Cannot execute flow: Locked by ${lockCheck.holder.userName} who is running another execution.`,
                holder: lockCheck.holder,
            });
        }

        // Fetch flow or construct fallback flow object
        let flowObj = null;
        let flowName = 'Security Audit Flow';
        let effectiveProjectId = projectId || 'default';

        if (flowId) {
            try {
                const flow = await Flow.findByPk(flowId);
                if (flow) {
                    flowObj = flow.toJSON();
                    flowName = flow.name || flowName;
                    effectiveProjectId = projectId || flow.project_id || flow.projectId || effectiveProjectId;
                }
            } catch (flowErr) {
                console.warn('[RunController] Flow lookup warning:', flowErr.message);
            }
        }

        if (!flowObj) {
            flowObj = { id: flowId, name: flowName, projectId: effectiveProjectId, nodes: [], edges: [] };
        }

        // Create run record for history
        const runId = await executionLogger.startRun(flowId, {
            flowName: flowName,
            trigger: 'security',
            flowSnapshot: JSON.stringify({ securityConfig }),
        });

        // Acquire lock
        await executionLock.acquire(flowId, userId, userName, runId);

        // Execute in background safely
        Promise.resolve().then(async () => {
            try {
                const result = await executionManager.execute(
                    'security',
                    { ...flowObj, projectId: effectiveProjectId },
                    { securityConfig, runId },
                );
                console.log(`[RunController] Security run completed for flow ${flowId}`);
                const isSuccess = result && result.success !== false && result.status !== 'failed';
                const finalStatus = isSuccess ? 'completed' : 'failed';
                await executionLogger.endRun(runId, finalStatus);
                emitFlowFinished({
                    runId,
                    status: finalStatus,
                    flowId,
                });
            } catch (err) {
                console.error(`[RunController] Security run failed: ${err.message}`);
                await executionLogger.endRun(runId, 'failed');
                emitFlowFinished({ runId, status: 'failed', flowId, error: err.message });
            } finally {
                await executionLock.release(flowId);
            }
        });

        return res.status(200).json({
            success: true,
            runId,
            message: 'Security audit initiated successfully.',
        });
    } catch (error) {
        console.error('[RunController] startSecurityRunAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const exportPerformanceReportAction = async (req, res) => {
    try {
        const { runId } = req.params;
        const { format = 'html' } = req.query;

        const run = await Run.findByPk(runId);
        if (!run) {
            return res.status(404).json({ success: false, message: 'Run execution not found' });
        }

        const summary =
            typeof run.summary === 'string' ? JSON.parse(run.summary) : run.summary || {};
        const { ReportExporter } = await import('../services/ReportExporter.js');
        const htmlContent = ReportExporter.generateHTML({
            ...run.toJSON(),
            summary,
        });

        if (format === 'pdf') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="haltest_report_${runId}.html"`);
            return res.send(htmlContent);
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="haltest_report_${runId}.html"`);
        return res.send(htmlContent);
    } catch (error) {
        console.error('[RunController] exportPerformanceReportAction Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
