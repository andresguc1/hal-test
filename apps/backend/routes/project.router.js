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
        nodes: (flowObj.nodes || []).map(n => ({
            ...n,
            id: n.nodeId, // Use nodeId as React Flow id
            nodeId: undefined // Hide from frontend
        })),
        edges: (flowObj.edges || []).map(e => ({
            ...e,
            id: e.edgeId, // Use edgeId as React Flow id
            edgeId: undefined // Hide from frontend
        }))
    };
};

// ========================================
// PROJECTS
// ========================================

// List all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.findAll({
            order: [['updatedAt', 'DESC']]
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await Project.create({ name, description });
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get project with flows
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [{ model: Flow, as: 'flows' }]
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
        res.json(project);
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
    try {
        const { name } = req.body;
        const flow = await Flow.create({
            name,
            projectId: req.params.projectId
        });
        res.status(201).json(flow);
    } catch (error) {
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
                { model: Edge, as: 'edges' }
            ]
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
            console.warn(`[ProjectRouter] Flow NOT FOUND for update: ID=${flowId}, ProjectID=${projectId}`);
            return res.status(404).json({ error: 'Flow not found' });
        }

        await flow.update({ name, viewport }, { transaction });

        if (nodes) {
            await Node.destroy({ where: { flowId: flow.id }, transaction });
            await Node.bulkCreate(nodes.map(n => ({
                nodeId: n.id,
                type: n.type,
                data: n.data,
                position: n.position,
                flowId: flow.id
            })), { transaction });
        }

        if (edges) {
            await Edge.destroy({ where: { flowId: flow.id }, transaction });
            await Edge.bulkCreate(edges.map(e => ({
                edgeId: e.id,
                source: e.source,
                target: e.target,
                flowId: flow.id
            })), { transaction });
        }

        await transaction.commit();

        const updatedFlow = await Flow.findByPk(flow.id, {
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' }
            ]
        });
        res.json(mapFlowData(updatedFlow));
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(`[ProjectRouter] Error updating flow:`, error);
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
        res.json({ message: 'Flow deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
