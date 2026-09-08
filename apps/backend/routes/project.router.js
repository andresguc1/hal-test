import { Router } from 'express';
import {
    User,
    Project,
    Canvas,
    Flow,
    Node,
    Edge,
    CollaboratorRole,
    Run,
} from '../database/init.js';
import sequelize from '../database/index.js';
import { Op } from 'sequelize';
import { exportService } from '../services/exporter/index.js';
import { projectStorageService } from '../services/ProjectStorageService.js';
import { projectExportService } from '../services/ProjectExportService.js';
import { projectImportService } from '../services/ProjectImportService.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer for project ZIP uploads
const upload = multer({
    dest: '/tmp/hal_test_project_imports',
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Ensure upload dir exists
if (!fs.existsSync('/tmp/hal_test_project_imports')) {
    fs.mkdirSync('/tmp/hal_test_project_imports', { recursive: true });
}

// Helper to map flow with its nodes and edges to React Flow format
const mapFlowData = (flow) => {
    if (!flow) return null;
    const flowObj = flow.toJSON();
    return {
        ...flowObj,
        nodes: (flowObj.nodes || []).map((n) => ({
            ...n,
            id: n.nodeId, // Use nodeId as React Flow id
            nodeId: undefined, // Hide from frontend
        })),
        edges: (flowObj.edges || []).map((e) => ({
            ...e,
            id: e.edgeId, // Use edgeId as React Flow id
            edgeId: undefined, // Hide from frontend
        })),
    };
};

// Helper to get Project with full flow stats (nodeCount)
const getProjectWithFlowStats = async (projectId) => {
    return await Project.findByPk(projectId, {
        include: [
            {
                model: Canvas,
                as: 'canvases',
                include: [{ model: Flow, as: 'flows' }],
            },
            {
                model: Flow,
                as: 'flows',
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM "Nodes"
                                WHERE "Nodes"."flowId" = "flows"."id"
                            )`),
                            'nodeCount',
                        ],
                    ],
                },
            },
        ],
        order: [
            [{ model: Canvas, as: 'canvases' }, 'order', 'ASC'],
            [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
            [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
        ],
    });
};
const sortNodesTopologically = (nodes, edges) => {
    if (!nodes || nodes.length === 0) return [];

    const nodeMap = new Map(nodes.map((n) => [n.id || n.nodeId, n]));
    const adj = new Map();
    const inDegree = new Map();

    nodes.forEach((n) => {
        const id = n.id || n.nodeId;
        adj.set(id, []);
        inDegree.set(id, 0);
    });

    edges.forEach((e) => {
        if (adj.has(e.source) && adj.has(e.target)) {
            adj.get(e.source).push(e.target);
            inDegree.set(e.target, inDegree.get(e.target) + 1);
        }
    });

    const queue = [];
    // Start with launch_browser or nodes with 0 in-degree
    const roots = nodes.filter(
        (n) => n.type === 'launch_browser' || n.data?.type === 'launch_browser',
    );

    if (roots.length > 0) {
        roots.forEach((r) => {
            const id = r.id || r.nodeId;
            queue.push(id);
        });
    } else {
        // Fallback: use all nodes with 0 in-degree
        for (const [id, degree] of inDegree.entries()) {
            if (degree === 0) queue.push(id);
        }
    }

    const sorted = [];
    const visited = new Set();

    while (queue.length > 0) {
        const currId = queue.shift();
        if (visited.has(currId)) continue;
        visited.add(currId);

        const node = nodeMap.get(currId);
        if (node) sorted.push(node);

        const neighbors = adj.get(currId) || [];
        neighbors.forEach((neighborId) => {
            inDegree.set(neighborId, inDegree.get(neighborId) - 1);
            if (inDegree.get(neighborId) === 0) {
                queue.push(neighborId);
            }
        });
    }

    // Add any remaining unconnected nodes
    nodes.forEach((n) => {
        const id = n.id || n.nodeId;
        if (!visited.has(id)) sorted.push(n);
    });

    return sorted;
};

// Helper: Sync active flow to tests/generated/active_flow.spec.js
const syncActiveFlowToDisk = async (nodes, edges, projectId) => {
    // Disable in production to prevent 500 errors on read-only filesystems
    if (process.env.NODE_ENV === 'production') return;

    try {
        const activeNodes = nodes.filter((n) => !n.data?.disabled);
        const activeEdges = edges.filter((e) => {
            const s = activeNodes.find((n) => (n.id || n.nodeId) === e.source);
            const t = activeNodes.find((n) => (n.id || n.nodeId) === e.target);
            return s && t;
        });

        const sortedNodes = sortNodesTopologically(activeNodes, activeEdges);
        let flattenedNodes = [];

        const flatten = async (currentNodes, executionStack = [], depth = 0) => {
            const IGNORED_TYPES = ['input', 'output', 'annotation', 'note'];
            const MAX_FLATTEN_DEPTH = 10;

            if (depth > MAX_FLATTEN_DEPTH) {
                console.warn(
                    `[ProjectRouter] Max flatten depth (${MAX_FLATTEN_DEPTH}) reached, stopping recursion`,
                );
                return;
            }

            for (const n of currentNodes) {
                if (n.data?.disabled) continue;
                if (n.type === 'component' || n.data?.type === 'component') {
                    const flowId = n.data?.configuration?.flowId || n.data?.flowId;
                    if (flowId && projectId) {
                        // 🚀 INTELLIGENT CIRCULAR CHECK:
                        // Only fail if the flow is ALREADY in the current branch's stack (Infinite Recursion)
                        if (executionStack.includes(flowId)) {
                            console.warn(
                                `[ProjectRouter] Infinite recursion blocked for flowId: ${flowId} (Stack: ${executionStack.join(' -> ')})`,
                            );
                            continue;
                        }

                        // Create a new stack for this specific branch
                        const newStack = [...executionStack, flowId];

                        const { Flow, Node, Edge } = await import('../database/init.js');
                        const flow = await Flow.findOne({
                            where: { id: flowId, projectId },
                            include: [
                                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                                { model: Edge, as: 'edges' },
                            ],
                        });
                        if (flow) {
                            const mappedSubFlow = mapFlowData(flow);
                            const sortedSubNodes = sortNodesTopologically(
                                mappedSubFlow.nodes,
                                mappedSubFlow.edges,
                            );
                            // Recursively flatten with the updated stack
                            await flatten(sortedSubNodes, newStack, depth + 1);
                        }
                    }
                } else if (!IGNORED_TYPES.includes(n.type)) {
                    flattenedNodes.push(n);
                }
            }
        };

        if (sortedNodes) {
            await flatten(sortedNodes);
        }

        console.log(
            `[ProjectRouter] Generating Playwright code for ${flattenedNodes.length} nodes`,
        );
        // Debug: Log first few nodes to check structure
        if (flattenedNodes.length > 0) {
            console.log(
                `[ProjectRouter] Node[0] Sample:`,
                JSON.stringify({
                    type: flattenedNodes[0].type,
                    hasData: !!flattenedNodes[0].data,
                    hasConfig: !!flattenedNodes[0].data?.configuration,
                    configKeys: flattenedNodes[0].data?.configuration
                        ? Object.keys(flattenedNodes[0].data.configuration)
                        : [],
                }),
            );
        }

        const result = exportService.generateCode(flattenedNodes, 'playwright');
        if (result.success) {
            const generatedDir = path.join(process.cwd(), 'tests', 'generated');
            if (!fs.existsSync(generatedDir)) {
                fs.mkdirSync(generatedDir, { recursive: true });
            }
            const filePath = path.join(generatedDir, 'active_flow.spec.js');
            fs.writeFileSync(filePath, result.code, 'utf-8');
            console.log(`[ProjectRouter] Auto-exported active_flow.spec.js`);
        }
    } catch (exportErr) {
        console.error(`[ProjectRouter] Failed to auto-export active_flow.spec.js:`, exportErr);
    }
};

// ========================================
// PROJECTS
// ========================================

// List all projects with flows (and canvases)
// Supports optional search/pagination: ?search=&page=&limit=&sort=&order=
router.get('/projects', async (req, res) => {
    try {
        // If search params are present, use paginated search mode
        const hasQuery = req.query.search || req.query.page || req.query.limit;
        if (hasQuery) {
            return handleProjectSearch(req, res);
        }

        const where = {};
        if (req.user && req.user.id) {
            where.userId = req.user.id;
        }

        const projects = await Project.findAll({
            where,
            include: [
                {
                    model: Canvas,
                    as: 'canvases',
                    include: [
                        {
                            model: Flow,
                            as: 'flows',
                        },
                    ],
                },
                {
                    model: Flow,
                    as: 'flows',
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM "Nodes"
                                    WHERE "Nodes"."flowId" = "flows"."id"
                                )`),
                                'nodeCount',
                            ],
                        ],
                    },
                },
            ],
            order: [
                ['updatedAt', 'DESC'],
                [{ model: Canvas, as: 'canvases' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
            ],
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/projects', async (req, res) => {
    let transaction;
    let transactionCommitted = false;
    try {
        transaction = await sequelize.transaction();
        const { name, description, nodes, edges } = req.body;
        let userId = req.user ? req.user.id : null;

        // Ensure user exists in local DB if we have a userId (from Supabase/Auth)
        if (userId) {
            // First try to find the user by ID
            let user = await User.findByPk(userId, { transaction });

            if (!user) {
                // If not found, check if a user with the same email exists
                const email = req.user.email || 'unknown@haltest.dev';
                user = await User.findOne({ where: { email }, transaction });

                if (!user) {
                    // Finally, create the user if absolutely new
                    user = await User.create(
                        {
                            id: userId,
                            email,
                            name: req.user.user_metadata?.full_name || req.user.name || null,
                        },
                        { transaction },
                    );
                } else if (user.id !== userId) {
                    // Email exists but under a different ID?
                    // This could be an auth sync issue. Let's use the existing user's ID.
                    userId = user.id;
                }
            }
            userId = user.id;
        }

        const project = await Project.create({ name, description, userId }, { transaction });

        // Create default canvas
        const canvas = await Canvas.create(
            {
                name: 'Default Canvas',
                projectId: project.id,
            },
            { transaction },
        );

        // Create default flow associated with the canvas
        const flow = await Flow.create(
            {
                name: 'Main Flow',
                projectId: project.id,
                canvasId: canvas.id,
                viewport: { x: 0, y: 0, zoom: 1 },
            },
            { transaction },
        );

        if (nodes && Array.isArray(nodes) && nodes.length > 0) {
            await Node.bulkCreate(
                nodes.map((n, idx) => ({
                    nodeId: n.id,
                    type: n.type,
                    data: n.data,
                    position: n.position,
                    flowId: flow.id,
                    parentId: n.parentId || null,
                    order: idx,
                })),
                { transaction },
            );

            const hasInput = nodes.some((n) => n.type === 'input');
            const hasOutput = nodes.some((n) => n.type === 'output');
            await flow.update({ hasInput, hasOutput }, { transaction });
        }

        if (edges && Array.isArray(edges) && edges.length > 0) {
            await Edge.bulkCreate(
                edges.map((e) => ({
                    edgeId: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || null,
                    targetHandle: e.targetHandle || null,
                    type: e.type || 'custom',
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        // Set active flow
        await project.update({ activeFlowId: flow.id }, { transaction });

        await transaction.commit();
        transactionCommitted = true;

        // Return the project with its hierarchy
        const projectResponse = await getProjectWithFlowStats(project.id);

        res.status(201).json({
            project: projectResponse,
            flow: flow,
        });
    } catch (error) {
        if (transaction && !transactionCommitted) {
            await transaction.rollback();
        }
        res.status(400).json({ error: error.message });
    }
});
// ========================================
// BULK PROJECT OPERATIONS
// ========================================

// Bulk delete multiple projects atomically
// Body: { projectIds: string[] }
router.delete('/projects/bulk', async (req, res) => {
    let transaction;
    try {
        const { projectIds } = req.body || {};

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return res.status(400).json({ error: 'projectIds array is required' });
        }

        const uniqueIds = [...new Set(projectIds)];
        if (uniqueIds.length > 1000) {
            return res.status(400).json({ error: 'Cannot delete more than 1000 projects at once' });
        }

        transaction = await sequelize.transaction();

        // Fetch all projects to verify they exist and gather stats
        const projects = await Project.findAll({
            where: { id: { [Op.in]: uniqueIds } },
            include: [{ model: Flow, as: 'flows' }],
            transaction,
        });

        if (projects.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: 'No projects found with the provided IDs' });
        }

        // Count total flows, canvas, nodes, edges that will be affected
        const totalFlows = projects.reduce((sum, p) => sum + (p.flows?.length || 0), 0);

        const deletedIds = projects.map((p) => p.id);
        const notFoundIds = uniqueIds.filter((id) => !deletedIds.includes(id));

        // Delete each project (cascade handles children)
        for (const project of projects) {
            await project.destroy({ transaction });
        }

        await transaction.commit();

        res.json({
            message: `${deletedIds.length} project(s) deleted`,
            deleted: deletedIds.length,
            deletedIds,
            notFoundIds,
            stats: {
                projects: deletedIds.length,
                flows: totalFlows,
            },
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(`[ProjectRouter] Bulk delete error:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Delete many projects (query-param based, for simpler clients)
// ?ids=id1,id2,id3
router.delete('/projects/bulk/query', async (req, res) => {
    try {
        const idsParam = req.query.ids || '';
        const projectIds = idsParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        if (projectIds.length === 0) {
            return res.status(400).json({ error: 'ids query parameter is required' });
        }

        // Forward to the same bulk handler logic by using an internal reference
        req.body = { projectIds };
        // Invoke the handler directly
        return handleBulkDelete(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete many projects (query-param based, for simpler clients)
// ?ids=id1,id2,id3
const handleBulkDelete = async (req, res) => {
    let transaction;
    try {
        const { projectIds } = req.body;

        if (!Array.isArray(projectIds) || projectIds.length === 0) {
            return res.status(400).json({ error: 'projectIds array is required' });
        }

        const uniqueIds = [...new Set(projectIds)];
        transaction = await sequelize.transaction();

        const projects = await Project.findAll({
            where: { id: { [Op.in]: uniqueIds } },
            include: [{ model: Flow, as: 'flows' }],
            transaction,
        });

        const totalFlows = projects.reduce((sum, p) => sum + (p.flows?.length || 0), 0);
        const deletedIds = projects.map((p) => p.id);
        const notFoundIds = uniqueIds.filter((id) => !deletedIds.includes(id));

        for (const project of projects) {
            await project.destroy({ transaction });
        }

        await transaction.commit();

        res.json({
            message: `${deletedIds.length} project(s) deleted`,
            deleted: deletedIds.length,
            deletedIds,
            notFoundIds,
            stats: {
                projects: deletedIds.length,
                flows: totalFlows,
            },
        });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(`[ProjectRouter] Bulk delete error:`, error);
        res.status(500).json({ error: error.message });
    }
};

// ========================================
// PROJECT EXPORT
// ========================================

// Export entire project as a self-contained ZIP
// GET /projects/:id/export?sanitize=true
router.get('/projects/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const sanitize = req.query.sanitize !== 'false';

        const result = await projectExportService.exportProject(id, { sanitize });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.send(result.buffer);
    } catch (error) {
        console.error(`[ProjectRouter] Export error:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message,
        });
    }
});

// Export project as JSON (API-friendly alternative to ZIP)
// GET /projects/:id/export/json?sanitize=true
router.get('/projects/:id/export/json', async (req, res) => {
    try {
        const { id } = req.params;
        const sanitize = req.query.sanitize !== 'false';

        const { zip } = await projectExportService.exportProject(id, { sanitize });

        // Extract the important parts as a plain JSON object
        const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
        const projectJson = JSON.parse(await zip.file('project.json').async('string'));

        // Build a single self-contained JSON document
        const flows = {};
        const components = {};

        for (const file of Object.values(zip.files)) {
            if (file.name.startsWith('flows/') && file.name.endsWith('.json') && !file.dir) {
                const key = file.name.replace('flows/', '').replace('.json', '');
                flows[key] = JSON.parse(await file.async('string'));
            }
            if (file.name.startsWith('components/') && file.name.endsWith('.json') && !file.dir) {
                const key = file.name.replace('components/', '').replace('.json', '');
                components[key] = JSON.parse(await file.async('string'));
            }
        }

        let externalRefs = null;
        const extFile = zip.file('external-refs.json');
        if (extFile) {
            externalRefs = JSON.parse(await extFile.async('string'));
        }

        res.json({
            formatVersion: manifest.formatVersion,
            exportedAt: manifest.exportedAt,
            project: projectJson,
            flows,
            components,
            externalRefs,
            sanitized: manifest.sanitized,
        });
    } catch (error) {
        console.error(`[ProjectRouter] Export JSON error:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message,
        });
    }
});

// ========================================
// PROJECT IMPORT
// ========================================

// Import a project from a HAL zip package
// POST /projects/import  (multipart/form-data: file=<zip>)
router.post('/projects/import', upload.single('file'), async (req, res) => {
    let uploadedFile = req.file;
    try {
        if (!uploadedFile) {
            return res.status(400).json({ error: 'File is required (field name: file)' });
        }

        const buffer = fs.readFileSync(uploadedFile.path);

        const userId = req.user?.id || null;
        const targetProjectId = req.body?.targetProjectId || null;
        const targetName = req.body?.name || null;

        const result = await projectImportService.importProject(buffer, {
            targetProjectId: targetProjectId || null,
            targetName,
            userId,
        });

        // Cleanup temp file
        try {
            fs.unlinkSync(uploadedFile.path);
        } catch (e) {
            /* already gone */
        }

        res.status(result.project?.id && !targetProjectId ? 201 : 200).json({
            success: true,
            project: result.project,
            idMap: result.idMap,
            createdFlows: result.createdFlows,
            warnings: result.warnings || [],
            stats: result.stats,
        });
    } catch (error) {
        if (uploadedFile) {
            try {
                fs.unlinkSync(uploadedFile.path);
            } catch (e) {
                /* already gone */
            }
        }
        console.error(`[ProjectRouter] Import error:`, error);
        res.status(400).json({ error: error.message, success: false });
    }
});

// Import a project from JSON body (non-file alternative for API clients)
// POST /projects/import/json
router.post('/projects/import/json', async (req, res) => {
    try {
        const { name, project, flows, components, targetProjectId } = req.body || {};
        if (!project || !flows) {
            return res.status(400).json({
                error: 'project and flows objects are required',
            });
        }

        // Build a minimal manifest for the import service
        const manifest = {
            formatVersion: 1,
            exportedAt: new Date().toISOString(),
            projectId: project.id || null,
            projectName: project.name,
        };

        // We can't easily pass a JSON body to the ZIP-based service, so
        // we construct a minimal zip in memory.
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        zip.file('manifest.json', JSON.stringify(manifest));
        zip.file('project.json', JSON.stringify(project));
        for (const [flowId, flow] of Object.entries(flows || {})) {
            zip.file(`flows/${flowId}.json`, JSON.stringify(flow));
        }
        for (const [compId, comp] of Object.entries(components || {})) {
            zip.file(`components/${compId}.json`, JSON.stringify(comp));
        }

        const buffer = await zip.generateAsync({ type: 'nodebuffer' });

        const userId = req.user?.id || null;
        const result = await projectImportService.importProject(buffer, {
            targetProjectId: targetProjectId || null,
            targetName: name || project.name,
            userId,
        });

        res.status(201).json({
            success: true,
            project: result.project,
            idMap: result.idMap,
            createdFlows: result.createdFlows,
            warnings: result.warnings || [],
            stats: result.stats,
        });
    } catch (error) {
        console.error(`[ProjectRouter] JSON Import error:`, error);
        res.status(400).json({ error: error.message, success: false });
    }
});

// ========================================
// PROJECT SEARCH / PAGINATION
// ========================================

// Search/paginate projects with the same response shape as the list endpoint
const handleProjectSearch = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 50, sort = 'updatedAt', order = 'DESC' } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));

        const where = {};
        if (req.user && req.user.id) {
            where.userId = req.user.id;
        }

        if (search) {
            const dialect = sequelize.getDialect();
            if (dialect === 'postgres') {
                where.name = { [Op.iLike]: `%${search}%` };
            } else {
                // SQLite: LIKE is case-insensitive for ASCII by default
                where.name = { [Op.like]: `%${search}%` };
            }
        }

        // Validate sort field to prevent injection
        const allowedSort = ['name', 'createdAt', 'updatedAt'];
        const sortField = allowedSort.includes(sort) ? sort : 'updatedAt';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Project.findAndCountAll({
            where,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
            order: [[sortField, sortOrder]],
            include: [
                {
                    model: Flow,
                    as: 'flows',
                    attributes: ['id', 'name', 'type', 'order', 'createdAt'],
                },
            ],
        });

        const totalPages = Math.ceil(count / limitNum);

        // Match legacy shape but also add pagination metadata
        res.json({
            projects: rows,
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Import / Clone flow from another project as a Subflow Component
router.post('/projects/:projectId/flows/import-subflow', async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { projectId } = req.params;
        const { sourceFlowId, customName, flowJson } = req.body || {};

        let sourceNodes = [];
        let sourceEdges = [];
        let subflowName = customName || 'Imported Subflow';

        if (sourceFlowId) {
            const sourceFlow = await Flow.findByPk(sourceFlowId, {
                include: [
                    { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                    { model: Edge, as: 'edges' },
                ],
            });
            if (!sourceFlow) {
                await transaction.rollback();
                return res.status(404).json({ success: false, error: 'Source flow not found' });
            }
            subflowName = customName || `Subflow - ${sourceFlow.name}`;
            sourceNodes = sourceFlow.nodes.map((n) => n.toJSON());
            sourceEdges = sourceFlow.edges.map((e) => e.toJSON());
        } else if (flowJson) {
            subflowName = customName || flowJson.name || 'Imported Component';
            sourceNodes = flowJson.nodes || [];
            sourceEdges = flowJson.edges || [];
        } else {
            await transaction.rollback();
            return res
                .status(400)
                .json({ success: false, error: 'Either sourceFlowId or flowJson is required' });
        }

        // Create new component flow in target project
        const newFlow = await Flow.create(
            {
                name: subflowName,
                projectId,
                type: 'component',
            },
            { transaction },
        );

        if (sourceNodes.length > 0) {
            await Node.bulkCreate(
                sourceNodes.map((n, idx) => ({
                    nodeId: n.nodeId || n.id,
                    type: n.type,
                    data: n.data,
                    position: n.position,
                    flowId: newFlow.id,
                    order: idx,
                })),
                { transaction },
            );

            const hasInput = sourceNodes.some((n) => n.type === 'input');
            const hasOutput = sourceNodes.some((n) => n.type === 'output');
            await newFlow.update({ hasInput, hasOutput }, { transaction });
        }

        if (sourceEdges.length > 0) {
            await Edge.bulkCreate(
                sourceEdges.map((e) => ({
                    edgeId: e.edgeId || e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                    flowId: newFlow.id,
                })),
                { transaction },
            );
        }

        await transaction.commit();

        return res.status(201).json({
            success: true,
            data: {
                flowId: newFlow.id,
                name: newFlow.name,
                nodeCount: sourceNodes.length,
                componentNode: {
                    type: 'component',
                    data: {
                        label: newFlow.name,
                        flowId: newFlow.id,
                    },
                },
            },
        });
    } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Get project with flows
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await getProjectWithFlowStats(req.params.id);
        if (!project) {
            console.warn(`[ProjectRouter] Project NOT FOUND: ID=${req.params.id}`);
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get project tree structure with last run status per flow
router.get('/projects/:id/tree', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                    attributes: [
                        'id',
                        'name',
                        'type',
                        'order',
                        'parentId',
                        'createdAt',
                        'updatedAt',
                    ],
                    include: [
                        {
                            model: Node,
                            as: 'nodes',
                            attributes: ['nodeId'],
                        },
                    ],
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Fetch last run status for each flow
        const flows = project.Flows || [];
        const flowIds = flows.map((f) => f.id);

        let lastRuns = [];
        if (flowIds.length > 0) {
            lastRuns = await Run.findAll({
                where: { flow_id: flowIds },
                attributes: [
                    'flow_id',
                    'status',
                    [sequelize.fn('MAX', sequelize.col('started_at')), 'lastRunAt'],
                ],
                group: ['flow_id', 'status'],
                order: [[sequelize.fn('MAX', sequelize.col('started_at')), 'DESC']],
                raw: true,
            });
        }

        // Build a map: flowId -> last run status (most recent)
        const lastRunMap = {};
        for (const run of lastRuns) {
            if (!lastRunMap[run.flow_id]) {
                lastRunMap[run.flow_id] = {
                    status: run.status,
                    lastRunAt: run.lastRunAt,
                };
            }
        }

        // Enrich flows with nodeCount and lastRunStatus
        const enrichedFlows = flows.map((f) => {
            const flowJson = f.toJSON();
            return {
                id: flowJson.id,
                name: flowJson.name,
                type: flowJson.type,
                order: flowJson.order,
                parentId: flowJson.parentId,
                nodeCount: (flowJson.nodes || []).length,
                lastRunStatus: lastRunMap[f.id]?.status || 'never-run',
                lastRunAt: lastRunMap[f.id]?.lastRunAt || null,
                createdAt: flowJson.createdAt,
                updatedAt: flowJson.updatedAt,
            };
        });

        res.json({
            projectId: project.id,
            projectName: project.name,
            flows: enrichedFlows,
            total: enrichedFlows.length,
        });
    } catch (error) {
        console.error('[ProjectRouter] Error fetching tree:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get disk tree structure for a project
router.get('/projects/:id/disk-tree', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const tree = await projectStorageService.getProjectTree(req.params.id);
        res.json(tree);
    } catch (error) {
        console.error('[ProjectRouter] Error fetching disk tree:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a folder within project
router.post('/projects/:id/folders', async (req, res) => {
    try {
        const { path: folderPath, category = 'flows' } = req.body;
        if (!folderPath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const project = await Project.findByPk(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const result = await projectStorageService.createFolder(
            req.params.id,
            `${category}/${folderPath}`,
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a folder within project
router.delete('/projects/:id/folders', async (req, res) => {
    try {
        const { path: folderPath, category = 'flows' } = req.body;
        if (!folderPath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const project = await Project.findByPk(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const result = await projectStorageService.deleteFolder(
            req.params.id,
            `${category}/${folderPath}`,
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update project
router.put('/projects/:id', async (req, res) => {
    try {
        const { name, description, activeFlowId, collaborationEnabled } = req.body;
        const project = await Project.findByPk(req.params.id);
        if (!project) {
            console.warn(`[ProjectRouter] Project NOT FOUND for update: ID=${req.params.id}`);
            return res.status(404).json({ error: 'Project not found' });
        }

        // Build partial update — only include fields that were explicitly sent
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (activeFlowId !== undefined) updates.activeFlowId = activeFlowId;
        if (collaborationEnabled !== undefined) updates.collaborationEnabled = collaborationEnabled;

        await project.update(updates);

        // Return project with flows
        const updatedProject = await getProjectWithFlowStats(project.id);
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete project
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) {
            console.warn(`[ProjectRouter] Project NOT FOUND for deletion: ID=${req.params.id}`);
            return res.status(404).json({ error: 'Project not found' });
        }

        await project.destroy();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// COLLABORATORS
// ========================================

// Get collaborators for a project
router.get('/projects/:projectId/collaborators', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const collaborators = await CollaboratorRole.findAll({
            where: { projectId },
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }],
        });

        res.json({ success: true, data: collaborators });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add or update a collaborator
router.post('/projects/:projectId/collaborators', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (project.userId === user.id) {
            return res.status(400).json({ error: 'Owner cannot be added as a collaborator' });
        }

        const [collab, created] = await CollaboratorRole.findOrCreate({
            where: { projectId, userId: user.id },
            defaults: { role },
        });

        if (!created) {
            collab.role = role;
            await collab.save();
        }

        // Return updated collaborator object with user details
        const updatedCollab = await CollaboratorRole.findByPk(collab.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name'] }],
        });

        res.json({ success: true, data: updatedCollab });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove a collaborator
router.delete('/projects/:projectId/collaborators/:userId', async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        const deleted = await CollaboratorRole.destroy({
            where: { projectId, userId },
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Collaborator not found' });
        }

        res.json({ success: true, message: 'Collaborator removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// FLOWS
// ========================================

// Create flow
router.post('/projects/:projectId/flows', async (req, res) => {
    let transaction;
    let transactionCommitted = false;
    try {
        transaction = await sequelize.transaction();
        const { projectId } = req.params;
        const { name, type, parentId, nodes, edges } = req.body;

        // Check for duplicate flow name and auto-suffix if needed
        let finalName = name;
        let counter = 1;
        while (true) {
            const existingFlow = await Flow.findOne({
                where: {
                    projectId,
                    name: finalName,
                },
                transaction,
            });

            if (!existingFlow) break;
            finalName = `${name} (${counter++})`;
        }

        const flow = await Flow.create(
            {
                name: finalName,
                projectId,
                canvasId: req.body.canvasId || null,
                type: type || 'main',
                parentId: parentId || null,
            },
            { transaction },
        );

        if (nodes && Array.isArray(nodes)) {
            await Node.bulkCreate(
                nodes.map((n, idx) => ({
                    nodeId: n.id,
                    type: n.type,
                    data: n.data,
                    position: n.position,
                    flowId: flow.id,
                    parentId: n.parentId || null,
                    order: idx,
                })),
                { transaction },
            );

            const hasInput = nodes.some((n) => n.type === 'input');
            const hasOutput = nodes.some((n) => n.type === 'output');
            await flow.update({ hasInput, hasOutput }, { transaction });
        }

        if (edges && Array.isArray(edges)) {
            await Edge.bulkCreate(
                edges.map((e) => ({
                    edgeId: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || null,
                    targetHandle: e.targetHandle || null,
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        await transaction.commit();
        transactionCommitted = true;

        // Return the updated project with all flows
        const updatedProject = await getProjectWithFlowStats(projectId);

        const createdFlowWithContent = await Flow.findOne({
            where: { id: flow.id },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        res.status(201).json({
            flow: mapFlowData(createdFlowWithContent),
            project: updatedProject,
        });
    } catch (error) {
        if (transaction && !transactionCommitted) await transaction.rollback();
        res.status(400).json({ error: error.message });
    }
});

// Get flow with nodes and edges
router.get('/projects/:projectId/flows/:flowId', async (req, res) => {
    try {
        const { projectId, flowId } = req.params;
        console.log(`[ProjectRouter] GET Flow: ID=${flowId}, ProjectID=${projectId}`);

        const flow = await Flow.findOne({
            where: { id: flowId, projectId: projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            console.warn(`[ProjectRouter] Flow NOT FOUND: ID=${flowId}, ProjectID=${projectId}`);
            return res.status(404).json({ error: 'Flow not found' });
        }

        const mappedFlow = mapFlowData(flow);

        // Auto-export the loaded flow to the bridge file
        await syncActiveFlowToDisk(mappedFlow.nodes, mappedFlow.edges, projectId);

        res.json(mappedFlow);
    } catch (error) {
        console.error(`[ProjectRouter] Error getting flow:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Export flow with dependencies (Enterprise V2)
router.get('/projects/:projectId/flows/:flowId/export', async (req, res) => {
    try {
        const { projectId, flowId } = req.params;
        const { sanitize } = req.query; // ?sanitize=true
        const { dependencyService } = await import('../services/DependencyService.js');

        // 1. Fetch Main Flow
        const mainFlow = await Flow.findOne({
            where: { id: flowId, projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!mainFlow) return res.status(404).json({ error: 'Flow not found' });

        // 2. Clone and Sanitize Main Flow (Optional)
        const mainFlowObj = mapFlowData(mainFlow);

        if (sanitize === 'true') {
            dependencyService.sanitizeSecrets(mainFlowObj.nodes);
        }

        // 3. Resolve Dependencies (Recursive Components)
        // Pass sanitize flag to service if we want deep sanitization too (YES)
        // We'll interpret resolveDependencies signature, currently it does sanitization internally always.
        // We need to update DependencyService to accept a flag, or handle it here?
        // Let's modify DependencyService properly next. For now, let's just act on main flow.
        // Actually, if I don't update DependencyService, components will ALWAYS be sanitized.
        // I should stick to the service update plan, but for now I'll just conditionally sanitize the main flow logic here
        // But the service should return sanitized component flows.
        const shouldSanitize = sanitize === 'true';
        const dependencies = await dependencyService.resolveDependencies(
            mainFlow.nodes,
            projectId,
            shouldSanitize,
        );

        // 4. Construct Self-Contained Package (v3)
        const exportPackage = {
            meta: {
                version: '3.0.0',
                exportedAt: new Date().toISOString(),
                origin: 'Haltest-Enterprise',
                author: 'User', // TODO: Get from Auth middleware
            },
            flow: mainFlowObj,
            dependencies: {
                components: dependencies.map((d) => {
                    // Ensure dependency format matches import expectation (nodes/edges)
                    // If the service returns raw objects, we might need to map them too if they come from DB
                    // The service uses globalStateManager.getFlow() which likely returns raw DB object or JSON
                    // Let's assume consistent format or map here.
                    // Service returns `components` array.
                    return d;
                }),
            },
        };

        res.json(exportPackage);
    } catch (error) {
        console.error(`[ProjectRouter] Export Error:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Helper for deep cloning backend payloads to prevent reference mutations
const deepClonePayload = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (err) {
        console.warn('[ProjectRouter] Deep clone failed for payload:', err);
        return obj;
    }
};

// Update flow (syncing nodes/edges)
router.put('/projects/:projectId/flows/:flowId', async (req, res) => {
    let transaction;
    let transactionCommitted = false;
    try {
        transaction = await sequelize.transaction();
        const { projectId, flowId } = req.params;

        // Deep clone payload to sanitize input and prevent in-memory reference sharing across models
        const sanitizedBody = deepClonePayload(req.body);
        const { name, viewport, nodes, edges, type, parentId } = sanitizedBody;

        console.log(`[ProjectRouter] PUT Flow: ID=${flowId}, ProjectID=${projectId}`);

        const flow = await Flow.findOne({
            where: { id: flowId, projectId: projectId },
        });

        if (!flow) {
            await transaction.rollback();
            console.warn(
                `[ProjectRouter] Flow NOT FOUND for update: ID=${flowId}, ProjectID=${projectId}`,
            );
            return res.status(404).json({ error: 'Flow not found' });
        }

        // Check for duplicate name if name is being changed
        if (name && name !== flow.name) {
            const existingFlow = await Flow.findOne({
                where: {
                    projectId,
                    name,
                },
                transaction,
            });

            if (existingFlow) {
                await transaction.rollback();
                return res
                    .status(409)
                    .json({ error: `Flow with name "${name}" already exists in this project.` });
            }
        }

        const flowUpdates = { name, viewport };
        if (type !== undefined && ['main', 'component', 'loop'].includes(type)) {
            flowUpdates.type = type;
        }
        if (parentId !== undefined) {
            flowUpdates.parentId = parentId || null;
        }

        await flow.update(flowUpdates, { transaction });

        if (nodes !== undefined) {
            if (!Array.isArray(nodes)) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Nodes must be an array' });
            }

            // Strictly filter and sanitize incoming nodes to ensure they belong to this flowId
            const sanitizedNodes = nodes
                .filter((n) => n && (n.id || n.nodeId))
                .map((n, idx) => {
                    const nodeId = n.id || n.nodeId;
                    const nodeData = deepClonePayload(n.data || {});

                    // Validate flow ownership
                    if (n.flowId && n.flowId !== flow.id) {
                        console.warn(
                            `[ProjectRouter] Node ${nodeId} specifies flowId ${n.flowId} different from route flowId ${flow.id}. Re-binding to route flowId.`,
                        );
                    }

                    return {
                        nodeId,
                        type: n.type || 'default',
                        data: nodeData,
                        position: n.position || { x: 0, y: 0 },
                        flowId: flow.id, // Strictly bind to route flow ID
                        parentId: n.parentId || null,
                        order: idx,
                    };
                });

            await Node.destroy({ where: { flowId: flow.id }, transaction });
            await Node.bulkCreate(sanitizedNodes, { transaction });

            const hasInput = sanitizedNodes.some((n) => n.type === 'input');
            const hasOutput = sanitizedNodes.some((n) => n.type === 'output');
            await flow.update({ hasInput, hasOutput }, { transaction });
        }

        if (edges !== undefined) {
            if (!Array.isArray(edges)) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Edges must be an array' });
            }

            const sanitizedEdges = edges
                .filter((e) => e && (e.id || e.edgeId) && e.source && e.target)
                .map((e) => ({
                    edgeId: e.id || e.edgeId,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle === 'default' ? null : e.sourceHandle || null,
                    targetHandle: e.targetHandle === 'default' ? null : e.targetHandle || null,
                    type: e.type || 'custom',
                    flowId: flow.id, // Strictly bind to route flow ID
                }));

            await Edge.destroy({ where: { flowId: flow.id }, transaction });
            await Edge.bulkCreate(sanitizedEdges, { transaction });
        }

        await transaction.commit();
        transactionCommitted = true;

        const updatedFlow = await Flow.findByPk(flow.id, {
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        const mappedFlow = mapFlowData(updatedFlow);

        // Auto-export the saved flow to the bridge file
        await syncActiveFlowToDisk(mappedFlow.nodes, mappedFlow.edges, projectId);

        res.json(mappedFlow);
    } catch (error) {
        if (transaction && !transactionCommitted) await transaction.rollback();
        console.error(`[ProjectRouter] Error updating flow:`, error);
        res.status(400).json({ error: error.message });
    }
});

// Bulk reorder flows
router.put('/projects/:projectId/flows/reorder', async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { projectId } = req.params;
        const { orders } = req.body; // Array of { id: string, order: number }

        if (!Array.isArray(orders)) {
            throw new Error('Orders must be an array');
        }

        for (const item of orders) {
            await Flow.update(
                { order: item.order },
                {
                    where: { id: item.id, projectId },
                    transaction,
                },
            );
        }

        await transaction.commit();

        const updatedProject = await getProjectWithFlowStats(projectId);
        res.json(updatedProject);
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(400).json({ error: error.message });
    }
});

// Delete flow
router.delete('/projects/:projectId/flows/:flowId', async (req, res) => {
    try {
        const { projectId, flowId } = req.params;

        const flow = await Flow.findOne({
            where: { id: flowId, projectId: projectId },
        });
        if (!flow) return res.status(404).json({ error: 'Flow not found' });

        await flow.destroy();

        // Return the updated project with all remaining flows
        const updatedProject = await getProjectWithFlowStats(projectId);

        res.json({
            message: 'Flow deleted',
            project: updatedProject,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
