import { Sequelize, DataTypes } from 'sequelize';
import { variableManager } from '../services/VariableManager.js';
import * as actions from '../controllers/action.controller.js';
import fs from 'fs';
// import path from 'path';

// 1. Create In-Memory DB
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

// 2. Define Models
const Project = sequelize.define('Project', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: DataTypes.STRING,
});
const Flow = sequelize.define('Flow', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: DataTypes.STRING,
});
const Node = sequelize.define('Node', {
    nodeId: { type: DataTypes.STRING },
    type: DataTypes.STRING,
    data: DataTypes.JSON,
});
const Edge = sequelize.define('Edge', {
    edgeId: DataTypes.STRING,
    source: DataTypes.STRING,
    target: DataTypes.STRING,
    sourceHandle: DataTypes.STRING,
    targetHandle: DataTypes.STRING,
});

// Associations
Project.hasMany(Flow, { as: 'flows', foreignKey: 'projectId' });
Flow.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Flow.hasMany(Node, { as: 'nodes', foreignKey: 'flowId' });
Node.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });
Flow.hasMany(Edge, { as: 'edges', foreignKey: 'flowId' });
Edge.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });

async function run() {
    try {
        console.log('--- 🚀 RUNNING EXAMPLE FLOW: BIFURCACIÓN DE PRECIOS ---');
        await sequelize.sync({ force: true });

        const flowJson = JSON.parse(
            fs.readFileSync('./examples/logic_branching_flow.json', 'utf-8'),
        );

        // Setup
        const project = await Project.create({ id: 'prj-1', name: 'Test' });
        await Flow.create({
            id: 'flow-1',
            name: flowJson.name,
            projectId: project.id,
        });

        // Create Nodes
        for (const node of flowJson.nodes) {
            await Node.create({
                nodeId: node.nodeId,
                type: node.type,
                data: node.data,
                flowId: 'flow-1',
            });
        }

        // Create Edges
        for (const edge of flowJson.edges) {
            await Edge.create({
                edgeId: edge.edgeId,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle || null,
                flowId: 'flow-1',
            });
        }

        console.log(
            `✅ Loaded ${flowJson.nodes.length} nodes and ${flowJson.edges.length} edges from JSON.`,
        );

        // --- Simulated Execution Service Loop ---
        let path = null;
        const executed = new Set();

        const executeStep = async (nodeId) => {
            if (executed.has(nodeId)) return;
            executed.add(nodeId);

            const node = await Node.findOne({ where: { nodeId, flowId: 'flow-1' } });
            if (!node) return;

            console.log(`\n[Runner] Executing Node: ${nodeId} (${node.type})`);

            // Execute using actions controllers
            const actionName = node.type.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) + 'Action';
            const handler = actions[actionName];
            if (!handler)
                throw new Error(`Handler not found for ${node.type} (Action: ${actionName})`);

            const req = { body: node.data || {}, t: (k) => k };
            let resultData = null;
            const res = {
                statusCode: 200,
                status: () => res,
                json: (d) => {
                    resultData = d;
                    return res;
                },
            };

            await handler(req, res);

            if (resultData && resultData.success === false) {
                console.log(`[Runner] Node ${nodeId} returned failure:`, resultData.message);
            }

            // Capture path for branching
            path = resultData?.data?.path || null;

            // Find next edges
            let nextEdges = await Edge.findAll({ where: { source: nodeId, flowId: 'flow-1' } });
            if (path) {
                console.log(`[Runner] Branching path returned: '${path}'`);
                nextEdges = nextEdges.filter((e) => e.sourceHandle === path);
            }

            // Traverse
            for (const edge of nextEdges) {
                await executeStep(edge.target);
            }
        };

        await executeStep('n1');

        console.log('\n📊 --- FINAL VARIABLES STATE ---');
        console.log(`Price = ${variableManager.get('Price')}`);
        console.log(`Discount = ${variableManager.get('Discount')}`);
        console.log(`Final = ${variableManager.get('Final')}`);

        if (variableManager.get('Final') === 108) {
            console.log(
                '\n✅ TEST SUCCESS: 120 - 12 = 108. El flujo eligió la rama "true" correctamente.',
            );
        } else {
            console.error('\n❌ TEST FAILURE: El resultado no coincide.');
        }
    } catch (e) {
        console.error(e);
    }
}

run();
