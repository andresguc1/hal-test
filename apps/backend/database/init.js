import sequelize from './index.js';
import Project from './models/Project.js';
import Flow from './models/Flow.js';
import Node from './models/Node.js';
import Edge from './models/Edge.js';
import Run from './models/Run.js';
import StepResult from './models/StepResult.js';

// Define associations
Project.hasMany(Flow, { as: 'flows', foreignKey: 'projectId', onDelete: 'CASCADE', hooks: true });
Flow.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Flow.hasMany(Node, { as: 'nodes', foreignKey: 'flowId', onDelete: 'CASCADE', hooks: true });
Node.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });

Flow.hasMany(Edge, { as: 'edges', foreignKey: 'flowId', onDelete: 'CASCADE', hooks: true });
Edge.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });

// Execution History Associations
Run.hasMany(StepResult, { as: 'steps', foreignKey: 'run_id', onDelete: 'CASCADE', hooks: true });
StepResult.belongsTo(Run, { as: 'run', foreignKey: 'run_id' });

export const initDb = async (_force = false) => {
    try {
        console.log('Initializing database...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Note: SQLite has limited ALTER TABLE support.
        // For schema changes, delete the database file and restart.

        await sequelize.sync();
        console.log('Database synchronized');

        // Seed initial project if empty
        const count = await Project.count();
        if (count === 0) {
            console.log('Seeding initial data...');

            // Explicitly use string IDs for seeding to ensure consistency
            const defaultProjectId = 'default-project-1';
            const defaultFlowId = 'default-flow-1';

            const project = await Project.create({
                id: defaultProjectId,
                name: 'Default Project',
                description: 'Automatically created default project',
            });

            const flow = await Flow.create({
                id: defaultFlowId,
                name: 'Main Flow',
                projectId: project.id,
                viewport: { x: 0, y: 0, zoom: 1 },
            });

            await project.update({ activeFlowId: flow.id });

            console.log('Seeding completed successfully:');
            console.log(`- Project created: ${project.name} (${project.id})`);
            console.log(`- Flow created: ${flow.name} (${flow.id}, projectId: ${flow.projectId})`);
        } else {
            const projects = await Project.findAll({ include: [{ model: Flow, as: 'flows' }] });
            projects.forEach((p) => {
                console.log(`Existing Project: ${p.name} (${p.id})`);
                p.flows.forEach((f) => {
                    console.log(`  - Flow: ${f.name} (${f.id})`);
                });
            });
        }
    } catch (error) {
        console.error('Unable to connect to the database or sync:', error);
        throw error;
    }
};

export { Project, Flow, Node, Edge, Run, StepResult };
