import { Router } from 'express';
import { Project, Flow, Node, Edge } from '../database/init.js';
import sequelize from '../database/index.js';

const router = Router();

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

// ========================================
// PROJECTS
// ========================================

// List all projects with flows
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.findAll({
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                ['updatedAt', 'DESC'],
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/projects', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { name, description } = req.body;
        const project = await Project.create({ name, description }, { transaction });

        // Create default flow
        await Flow.create(
            {
                name: 'Main Flow',
                projectId: project.id,
                viewport: { x: 0, y: 0, zoom: 1 },
            },
            { transaction },
        );

        // Set active flow
        // The default flow creation triggers the association, but we might want to be explicit if we added logic later

        await transaction.commit();

        // Return plain objects to avoid circular references or strict Sequelize instances if needed
        const projectResponse = await Project.findByPk(project.id);
        const flowRef = await Flow.findOne({ where: { projectId: project.id } }); // Get the created flow

        // 3. Devolver AMBOS al frontend (User Pattern)
        res.status(201).json({
            project: projectResponse,
            flow: flowRef,
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(400).json({ error: error.message });
    }
});

// Get project with flows
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update project
router.put('/projects/:id', async (req, res) => {
    try {
        const { name, description, activeFlowId } = req.body;
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await project.update({ name, description, activeFlowId });

        // Return project with flows
        const updatedProject = await Project.findByPk(project.id, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete project
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await project.destroy();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// FLOWS
// ========================================

// Create flow
router.post('/projects/:projectId/flows', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { projectId } = req.params;
        const { name, type, parentId, nodes, edges } = req.body;

        // Check for duplicate flow name in the same project
        const existingFlow = await Flow.findOne({
            where: {
                projectId,
                name,
            },
            transaction,
        });

        if (existingFlow) {
            throw new Error(`Flow with name "${name}" already exists in this project.`);
        }

        const flow = await Flow.create(
            {
                name,
                projectId,
                type: type || 'main',
                parentId: parentId || null,
            },
            { transaction },
        );

        if (nodes && Array.isArray(nodes)) {
            await Node.bulkCreate(
                nodes.map((n) => ({
                    nodeId: n.id,
                    type: n.type,
                    data: n.data,
                    position: n.position,
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        if (edges && Array.isArray(edges)) {
            await Edge.bulkCreate(
                edges.map((e) => ({
                    edgeId: e.id,
                    source: e.source,
                    target: e.target,
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        await transaction.commit();

        // Return the updated project with all flows
        const updatedProject = await Project.findByPk(projectId, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });

        const createdFlowWithContent = await Flow.findOne({
            where: { id: flow.id },
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        res.status(201).json({
            flow: mapFlowData(createdFlowWithContent),
            project: updatedProject,
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
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
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            console.warn(`[ProjectRouter] Flow NOT FOUND: ID=${flowId}, ProjectID=${projectId}`);
            return res.status(404).json({ error: 'Flow not found' });
        }

        res.json(mapFlowData(flow));
    } catch (error) {
        console.error(`[ProjectRouter] Error getting flow:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Update flow (syncing nodes/edges)
router.put('/projects/:projectId/flows/:flowId', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { projectId, flowId } = req.params;
        const { name, viewport, nodes, edges } = req.body;

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

        await flow.update({ name, viewport }, { transaction });

        if (nodes) {
            await Node.destroy({ where: { flowId: flow.id }, transaction });
            await Node.bulkCreate(
                nodes.map((n) => ({
                    nodeId: n.id,
                    type: n.type,
                    data: n.data,
                    position: n.position,
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        if (edges) {
            await Edge.destroy({ where: { flowId: flow.id }, transaction });
            await Edge.bulkCreate(
                edges.map((e) => ({
                    edgeId: e.id,
                    source: e.source,
                    target: e.target,
                    flowId: flow.id,
                })),
                { transaction },
            );
        }

        await transaction.commit();

        const updatedFlow = await Flow.findByPk(flow.id, {
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });
        res.json(mapFlowData(updatedFlow));
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(`[ProjectRouter] Error updating flow:`, error);
        res.status(400).json({ error: error.message });
    }
});

// Bulk reorder flows
router.put('/projects/:projectId/flows/reorder', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
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

        const updatedProject = await Project.findByPk(projectId, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });
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
        if (!flow) return res.status(404).json({ error: 'Flow found' });

        await flow.destroy();

        // Return the updated project with all remaining flows
        const updatedProject = await Project.findByPk(projectId, {
            include: [
                {
                    model: Flow,
                    as: 'flows',
                },
            ],
            order: [
                [{ model: Flow, as: 'flows' }, 'order', 'ASC'],
                [{ model: Flow, as: 'flows' }, 'createdAt', 'ASC'],
            ],
        });

        res.json({
            message: 'Flow deleted',
            project: updatedProject,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
