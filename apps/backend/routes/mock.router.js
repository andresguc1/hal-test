// routes/mock.router.js
/**
 * API routes that return configuration data (Mocks)
 * such as categories, node schemas, and simulated project data.
 */

import { Router } from 'express';
import validate from '../middlewares/validator.js';
import openUrlBodySchema from '../schemas/open_url/body.js';
import { mockCategories, allNodeFieldConfigs, mockProjectData } from '../config/mockData.js';

const router = Router();

// 1. API: Get node categories and structure
router.get('/nodes/categories', (req, res) => {
    console.log('📂 API: Returning MCP node categories.');
    res.json(mockCategories);
});

// 2. API: Get schema (parameters) for one or all operations
router.get('/nodes/operations', (req, res) => {
    const operationName = req.query.op;

    if (operationName) {
        console.log(`📋 API: Returning schema for operation: ${operationName}`);
        const schema = allNodeFieldConfigs[operationName];

        if (schema) {
            return res.json({ [operationName]: schema });
        } else {
            return res.status(404).json({
                error: req.t('actions.mock_router.operation_not_found', { operationName }),
            });
        }
    }

    console.log('📋 API: Returning all operation schemas.');
    res.json(allNodeFieldConfigs);
});

// 3. API: Load project data (Mock)
router.get('/project/load', (req, res) => {
    const projectId = req.query.id;

    if (projectId === mockProjectData.projectId) {
        console.log(`📦 API: Returning project data: ${projectId}`);
        return res.json(mockProjectData);
    }

    console.log(`❌ API: Project ID ${projectId} not found.`);
    res.status(404).json({ error: req.t('actions.mock_router.project_not_found') });
});

// 4. API: Simulated workflow reception for Save/Execute
router.post('/data', (req, res) => {
    const receivedData = req.body;
    console.log(
        `📥 API: Received POST request in /api/data. Size: ${JSON.stringify(receivedData).length} bytes`,
    );

    if (!receivedData || Object.keys(receivedData).length === 0) {
        return res.status(400).json({
            status: 'error',
            message: req.t('actions.mock_router.no_data_received'),
            data: receivedData,
        });
    }

    res.json({
        status: 'success',
        message: req.t('actions.mock_router.flow_processed_success'),
        received_timestamp: new Date().toISOString(),
        data_keys_received: Object.keys(receivedData),
    });
});

// 5. API: Test route for validation middleware (open_url)
router.post(
    '/actions/open_url_test', // Renamed to avoid collision with real route in api.router.js
    validate({ body: openUrlBodySchema }),
    (req, res) => {
        const { url, timeout } = req.body;

        console.log(`✅ Executing Open URL Test in: ${url} with timeout: ${timeout}ms`);

        res.status(200).json({
            success: true,
            message: req.t('actions.mock_router.open_url_test_success'),
            data: req.body,
        });
    },
);

export default router;
