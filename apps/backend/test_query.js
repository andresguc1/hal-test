import { Project, Flow, Canvas } from './database/init.js';
import { initDb } from './database/init.js';

const test = async () => {
    try {
        await initDb();
        console.log('DB Init success');

        const projects = await Project.findAll();
        if (projects.length === 0) {
            console.log('No projects to test with');
            return;
        }

        const projectId = projects[0].id;
        console.log('Testing with Project ID:', projectId);

        // Test Creation (Simulating POST)
        const randomName = 'Test Flow ' + Math.floor(Math.random() * 10000);
        console.log('Creating flow with name:', randomName);

        const flow = await Flow.create({
            name: randomName,
            projectId: projectId,
            type: 'main',
        });

        console.log('Flow created successfully ID:', flow.id);

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

        console.log('Query success! Number of flows:', updatedProject.flows.length);

        // Test mapFlowData (Simulating GET/PUT)
        const mapFlowData = (flow) => {
            if (!flow) return null;
            const flowObj = flow.toJSON();
            return {
                ...flowObj,
                nodes: (flowObj.nodes || []).map((n) => ({
                    ...n,
                    id: n.nodeId,
                    nodeId: undefined,
                })),
                edges: (flowObj.edges || []).map((e) => ({
                    ...e,
                    id: e.edgeId,
                    edgeId: undefined,
                })),
            };
        };

        const firstFlow = updatedProject.flows[0];
        if (firstFlow) {
            console.log('Mapping first flow ID:', firstFlow.id);

            // Re-fetch with includes like the GET handler
            const { Node, Edge } = await import('./database/init.js');
            const flowWithIncludes = await Flow.findOne({
                where: { id: firstFlow.id },
                include: [
                    { model: Node, as: 'nodes' },
                    { model: Edge, as: 'edges' },
                ],
            });

            console.log('Flow with includes fetched.');
            const mapped = mapFlowData(flowWithIncludes);
            console.log('Map success! Nodes count:', mapped.nodes.length);
        }
    } catch (err) {
        console.error('Query failed with error:', err);
    }
    process.exit(0);
};

test();
