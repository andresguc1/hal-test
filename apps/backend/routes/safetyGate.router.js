import { Router } from 'express';
import { safetyGate } from '../core/SafetyGate.js';
import { aiGenerationGuard } from '../core/AIGenerationGuard.js';
import { goldenDatasetStore } from '../core/GoldenDatasetStore.js';

const router = Router();

// ==========================================================
// SAFETY GATE VALIDATION
// ==========================================================

/**
 * POST /api/safety-gate/validate
 * Validate a flow through the full Safety Gate pipeline.
 */
router.post('/validate', async (req, res) => {
    try {
        const { flow, context, level } = req.body;

        if (!flow || !flow.nodes) {
            return res.status(400).json({
                success: false,
                message: 'flow with nodes array is required',
            });
        }

        const result = await safetyGate.validate(flow, context || {}, level || 'normal');
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/safety-gate/validate-quick
 * Quick structural-only validation.
 */
router.post('/validate-quick', async (req, res) => {
    try {
        const { flow } = req.body;
        if (!flow || !flow.nodes) {
            return res.status(400).json({
                success: false,
                message: 'flow with nodes array is required',
            });
        }

        const result = await safetyGate.validateQuick(flow);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/safety-gate/validate-ai
 * Validate AI-generated content before canvas injection.
 */
router.post('/validate-ai', async (req, res) => {
    try {
        const { aiResponse, currentCanvas, options } = req.body;

        const result = await aiGenerationGuard.interceptAndValidate(
            aiResponse,
            currentCanvas,
            options || {},
        );

        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================
// GOLDEN DATASETS
// ==========================================================

/**
 * GET /api/safety-gate/golden-datasets
 * List all golden flow datasets.
 */
router.get('/golden-datasets', async (req, res) => {
    try {
        const ids = await goldenDatasetStore.listGoldenFlows();
        const datasets = [];

        for (const id of ids) {
            const ds = await goldenDatasetStore.getGoldenFlow(id);
            if (ds) {
                datasets.push({
                    id: ds.id,
                    metadata: ds.metadata,
                    nodeCount: ds.flow?.nodes?.length || 0,
                });
            }
        }

        return res.json({ success: true, data: datasets });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/safety-gate/golden-datasets
 * Create a new golden dataset from a known-good flow.
 */
router.post('/golden-datasets', async (req, res) => {
    try {
        const { id, flow, assertions } = req.body;
        if (!id || !flow) {
            return res.status(400).json({
                success: false,
                message: 'id and flow are required',
            });
        }

        const result = await goldenDatasetStore.saveGoldenFlow(id, flow, assertions);
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/safety-gate/golden-datasets/:id
 * Get a specific golden dataset.
 */
router.get('/golden-datasets/:id', async (req, res) => {
    try {
        const dataset = await goldenDatasetStore.getGoldenFlow(req.params.id);
        if (!dataset) {
            return res.status(404).json({ success: false, message: 'Golden dataset not found' });
        }
        return res.json({ success: true, data: dataset });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/safety-gate/golden-datasets/:id
 * Delete a golden dataset.
 */
router.delete('/golden-datasets/:id', async (req, res) => {
    try {
        await goldenDatasetStore.deleteGoldenFlow(req.params.id);
        return res.json({ success: true, message: 'Golden dataset deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/safety-gate/golden-datasets/auto-generate
 * Auto-generate a golden dataset from a flow.
 */
router.post('/golden-datasets/auto-generate', async (req, res) => {
    try {
        const { flowId, flowData } = req.body;
        if (!flowId || !flowData) {
            return res.status(400).json({
                success: false,
                message: 'flowId and flowData are required',
            });
        }

        const result = await goldenDatasetStore.autoGenerateFromFlow(flowId, flowData);
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
