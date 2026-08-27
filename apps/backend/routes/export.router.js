import { Router } from 'express';
import { exportService } from '../services/exporter/index.js';
import { Flow, Node, Edge } from '../database/init.js';

const router = Router();

// Lightweight endpoint to fetch a sub-flow's nodes for code preview (no side effects)
router.post('/subflow', async (req, res) => {
    try {
        const { flowId, projectId } = req.body;
        if (!flowId || !projectId) {
            return res
                .status(400)
                .json({ success: false, message: 'flowId and projectId required' });
        }

        const flow = await Flow.findOne({
            where: { id: flowId, projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            return res.json({ success: false, nodes: [] });
        }

        const flowObj = flow.toJSON();
        const nodes = (flowObj.nodes || []).map((n) => ({
            id: n.nodeId || n.id,
            type: n.type,
            data: n.data,
            position: n.position,
        }));

        res.json({ success: true, nodes });
    } catch (error) {
        console.error('[ExportRouter] Error fetching subflow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to export to code (Playwright, etc.)
router.post('/code', async (req, res) => {
    try {
        const { flow, framework, language, locale, projectId, usePOM, includeCICD, designPattern } =
            req.body;

        if (!flow || !Array.isArray(flow)) {
            return res.status(400).json({
                success: false,
                message: req.t('actions.export_router.flow_required'),
            });
        }

        // Resolve components recursively if projectId is provided
        const resolvedFlow = projectId
            ? await exportService.resolveSubFlows(flow, projectId)
            : flow;

        const result = exportService.generateCode(
            resolvedFlow,
            framework || 'playwright',
            language || 'javascript',
            locale || 'es',
            !!usePOM,
            !!includeCICD,
            designPattern || 'flat',
        );

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to export to JSON (Backup)
router.post('/json', (req, res) => {
    try {
        const { flow } = req.body;

        if (!flow) {
            return res.status(400).json({
                success: false,
                message: req.t('actions.export_router.flow_data_required'),
            });
        }

        const result = exportService.generateJson(flow);

        // Send as download
        res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
        res.setHeader('Content-Type', result.contentType);
        res.send(result.data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
