import { executionService } from '../services/ExecutionService.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { Run, StepResult, Flow } from '../database/init.js';

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
