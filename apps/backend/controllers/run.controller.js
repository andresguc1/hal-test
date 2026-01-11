import { executionLogger } from '../services/ExecutionLogger.js';
import { Run, StepResult } from '../database/init.js';

export const startRunAction = async (req, res) => {
    try {
        const { flowId, trigger } = req.body;
        const runId = await executionLogger.startRun(flowId, { trigger });

        if (!runId) {
            return res.status(500).json({ success: false, message: 'Failed to start run' });
        }

        return res.status(200).json({ success: true, runId });
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
        const runs = await Run.findAll({
            order: [['started_at', 'DESC']],
            limit: 50,
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
