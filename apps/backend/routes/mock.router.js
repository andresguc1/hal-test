// routes/mock.router.js
/**
 * API routes that return configuration data (Mocks)
 * such as categories, node schemas, and simulated project data.
 * Now powered by NodeRegistry for dynamic plugin-driven definitions.
 */

import { Router } from 'express';
import validate from '../middlewares/validator.js';
import openUrlBodySchema from '../schemas/open_url/body.js';
import { mockProjectData } from '../config/mockData.js';
import { nodeRegistry } from '../core/NodeRegistry.js';

const router = Router();

// 1. API: Get node categories and structure (dynamic from NodeRegistry, fallback to mock)
router.get('/nodes/categories', (req, res) => {
    if (nodeRegistry.count() > 0) {
        return res.json(nodeRegistry.getFrontendDefinitions());
    }
    // Fallback: import mock data if NodeRegistry is not yet populated
    import('../config/mockData.js')
        .then(({ mockCategories }) => res.json(mockCategories))
        .catch(() => res.json({}));
});

// 2. API: Get all node type definitions (for frontend node palette)
router.get('/nodes/definitions', (req, res) => {
    const types = nodeRegistry.getAllTypes();
    const definitions = {};

    for (const type of types) {
        const def = nodeRegistry.get(type);
        if (def) {
            definitions[type] = {
                type: def.type,
                category: def.category,
                label: def.label,
                color: def.color,
                icon: def.icon,
                version: def.version,
                source: def.source,
            };
        }
    }

    res.json({
        success: true,
        total: types.length,
        nodes: definitions,
    });
});

// 3. API: Get schema (parameters) for one or all operations (dynamic from NodeRegistry)
router.get('/nodes/operations', (req, res) => {
    const operationName = req.query.op;

    if (operationName) {
        const schema = nodeRegistry.getSchema(operationName);
        if (schema) {
            return res.json({ [operationName]: schema });
        } else {
            return res.status(404).json({
                error: req.t('actions.mock_router.operation_not_found', { operationName }),
            });
        }
    }

    const allTypes = nodeRegistry.getAllTypes();
    const allSchemas = {};
    for (const type of allTypes) {
        const schema = nodeRegistry.getSchema(type);
        if (schema) {
            allSchemas[type] = schema;
        }
    }
    res.json(allSchemas);
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
