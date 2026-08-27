import { Router } from 'express';
import { projectStorageService } from '../services/ProjectStorageService.js';
import { flowSerializer } from '../services/FlowSerializer.js';
import { pageObjectStore } from '../services/PageObjectStore.js';
import { componentRegistry } from '../services/ComponentRegistry.js';
import { flowResolver } from '../core/FlowResolver.js';
import { Flow, Node, Edge, Project } from '../database/init.js';

const router = Router();

// ==========================================================
// PROJECT DISK SYNC
// ==========================================================

/**
 * POST /api/storage/projects/:projectId/sync
 * Synchronize a project from SQLite to disk.
 */
router.post('/projects/:projectId/sync', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const projectData = {
            id: project.id,
            name: project.name,
            description: project.description,
            config: {},
        };

        const existing = await projectStorageService.loadProject(projectId).catch(() => null);
        if (!existing) {
            await projectStorageService.createProject(projectData);
        }

        const syncResult = await flowSerializer.syncProject(projectId);

        return res.json({
            success: true,
            data: syncResult,
            message: `Project synchronized to disk`,
        });
    } catch (error) {
        console.error('[StorageRouter] Sync error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/storage/projects/:projectId/status
 * Get disk sync status for a project.
 */
router.get('/projects/:projectId/status', async (req, res) => {
    try {
        const { projectId } = req.params;
        const exists = projectStorageService.fileExists(projectId, 'project.json');

        if (!exists) {
            return res.json({
                success: true,
                data: { onDisk: false, needsSync: true },
            });
        }

        const project = await projectStorageService.loadProject(projectId);
        const dbFlowCount = await Flow.count({ where: { projectId } });
        const diskFlowCount = project.flows?.length || 0;

        return res.json({
            success: true,
            data: {
                onDisk: true,
                needsSync: dbFlowCount !== diskFlowCount,
                dbFlowCount,
                diskFlowCount,
                lastSync: project.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================
// FLOW EXPORT / IMPORT
// ==========================================================

/**
 * POST /api/storage/flows/:flowId/export
 * Export a single flow as JSON.
 */
router.post('/flows/:flowId/export', async (req, res) => {
    try {
        const { flowId } = req.params;
        const { projectId } = req.query;

        const result = await flowSerializer.exportJson(flowId, projectId);

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/storage/flows/import
 * Import a flow from JSON into a project.
 */
router.post('/flows/import', async (req, res) => {
    try {
        const { flowJson, projectId } = req.body;

        if (!flowJson || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'flowJson and projectId are required',
            });
        }

        const flow = await flowSerializer.importJson(flowJson, projectId);

        return res.json({
            success: true,
            data: { flowId: flow.id },
            message: 'Flow imported successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================
// PAGE OBJECTS
// ==========================================================

/**
 * GET /api/storage/projects/:projectId/pages
 * List all Page Objects for a project.
 */
router.get('/projects/:projectId/pages', async (req, res) => {
    try {
        const pages = await pageObjectStore.list(req.params.projectId);
        return res.json({ success: true, data: pages });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/storage/projects/:projectId/pages
 * Create a new Page Object.
 */
router.post('/projects/:projectId/pages', async (req, res) => {
    try {
        const page = await pageObjectStore.create(req.params.projectId, req.body);
        return res.status(201).json({ success: true, data: page });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/storage/projects/:projectId/pages/:pageId
 * Get a specific Page Object.
 */
router.get('/projects/:projectId/pages/:pageId', async (req, res) => {
    try {
        const page = await pageObjectStore.get(req.params.projectId, req.params.pageId);
        return res.json({ success: true, data: page });
    } catch (error) {
        return res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/storage/projects/:projectId/pages/:pageId
 * Update a Page Object.
 */
router.put('/projects/:projectId/pages/:pageId', async (req, res) => {
    try {
        const page = await pageObjectStore.update(
            req.params.projectId,
            req.params.pageId,
            req.body,
        );
        return res.json({ success: true, data: page });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/storage/projects/:projectId/pages/:pageId
 * Delete a Page Object.
 */
router.delete('/projects/:projectId/pages/:pageId', async (req, res) => {
    try {
        await pageObjectStore.delete(req.params.projectId, req.params.pageId);
        return res.json({ success: true, message: 'Page Object deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/storage/projects/:projectId/pages/:pageId/validate
 * Validate all locators in a Page Object.
 */
router.post('/projects/:projectId/pages/:pageId/validate', async (req, res) => {
    try {
        const result = await pageObjectStore.validateLocators(
            req.params.projectId,
            req.params.pageId,
        );
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================
// COMPONENTS
// ==========================================================

/**
 * GET /api/storage/projects/:projectId/components
 * List all components, optionally filtered by category.
 */
router.get('/projects/:projectId/components', async (req, res) => {
    try {
        const components = await componentRegistry.list(req.params.projectId, req.query.category);
        return res.json({ success: true, data: components });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/storage/projects/:projectId/components
 * Register a new component.
 */
router.post('/projects/:projectId/components', async (req, res) => {
    try {
        const component = await componentRegistry.register(req.params.projectId, req.body);
        return res.status(201).json({ success: true, data: component });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/storage/projects/:projectId/components/:componentId
 * Get a specific component.
 */
router.get('/projects/:projectId/components/:componentId', async (req, res) => {
    try {
        const component = await componentRegistry.get(req.params.projectId, req.params.componentId);
        return res.json({ success: true, data: component });
    } catch (error) {
        return res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/storage/projects/:projectId/components/:componentId
 * Update a component.
 */
router.put('/projects/:projectId/components/:componentId', async (req, res) => {
    try {
        const component = await componentRegistry.update(
            req.params.projectId,
            req.params.componentId,
            req.body,
        );
        return res.json({ success: true, data: component });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/storage/projects/:projectId/components/:componentId
 * Delete a component.
 */
router.delete('/projects/:projectId/components/:componentId', async (req, res) => {
    try {
        await componentRegistry.delete(req.params.projectId, req.params.componentId);
        return res.json({ success: true, message: 'Component deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================================
// FLOW RESOLUTION
// ==========================================================

/**
 * POST /api/storage/flows/:flowId/resolve
 * Resolve all sub-flow components in a flow.
 */
router.post('/flows/:flowId/resolve', async (req, res) => {
    try {
        const { flowId } = req.params;
        const { projectId } = req.body;

        const flow = await Flow.findOne({
            where: { id: flowId, projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        const nodes = flow.nodes.map((n) => ({
            id: n.nodeId || n.id,
            type: n.type,
            data: n.data,
            position: n.position,
        }));

        const resolvedNodes = await flowResolver.resolve(nodes, projectId);

        const cycleCheck = await flowResolver.detectCycles(nodes, projectId);

        return res.json({
            success: true,
            data: {
                nodes: resolvedNodes,
                edges: flow.edges.map((e) => ({
                    id: e.edgeId || e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                })),
                dependencies: flowResolver.listDependencies(resolvedNodes),
                cycleCheck,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
