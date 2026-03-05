import { Router } from 'express';
import { exportService } from '../services/exporter/index.js';

const router = Router();

// Endpoint to export to code (Playwright, etc.)
router.post('/code', async (req, res) => {
    try {
        const { flow, framework, language, locale, projectId } = req.body;

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
