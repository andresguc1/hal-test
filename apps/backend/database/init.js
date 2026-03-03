import sequelize from './index.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Canvas from './models/Canvas.js';
import Flow from './models/Flow.js';
import Node from './models/Node.js';
import Edge from './models/Edge.js';
import Run from './models/Run.js';
import StepResult from './models/StepResult.js';

// Define associations
User.hasMany(Project, { as: 'projects', foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
Project.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Project.hasMany(Canvas, {
    as: 'canvases',
    foreignKey: 'projectId',
    onDelete: 'CASCADE',
    hooks: true,
});
Canvas.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Canvas.hasMany(Flow, { as: 'flows', foreignKey: 'canvasId', onDelete: 'CASCADE', hooks: true });
Flow.belongsTo(Canvas, { as: 'canvas', foreignKey: 'canvasId' });

// Keep Project -> Flow for legacy compatibility or direct access if needed
Project.hasMany(Flow, { as: 'flows', foreignKey: 'projectId', onDelete: 'CASCADE', hooks: true });
Flow.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

Flow.hasMany(Node, { as: 'nodes', foreignKey: 'flowId', onDelete: 'CASCADE', hooks: true });
Node.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });

Flow.hasMany(Edge, { as: 'edges', foreignKey: 'flowId', onDelete: 'CASCADE', hooks: true });
Edge.belongsTo(Flow, { as: 'flow', foreignKey: 'flowId' });

// Execution History Associations
Run.hasMany(StepResult, { as: 'steps', foreignKey: 'run_id', onDelete: 'CASCADE', hooks: true });
StepResult.belongsTo(Run, { as: 'run', foreignKey: 'run_id' });

let isInitializing = false;
let isInitialized = false;

export const initDb = async (_force = false) => {
    if (isInitialized) return;
    if (isInitializing) {
        // Wait for initialization to complete if already in progress
        while (isInitializing) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return;
    }

    isInitializing = true;
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
            const defaultUserId = 'default-user-1';
            const defaultProjectId = 'default-project-1';
            const defaultCanvasId = 'default-canvas-1';
            const defaultFlowId = 'default-flow-1';

            const [user] = await User.findOrCreate({
                where: { id: defaultUserId },
                defaults: {
                    email: 'local@haltest.dev',
                    name: 'Local User',
                },
            });

            const [project] = await Project.findOrCreate({
                where: { id: defaultProjectId },
                defaults: {
                    name: 'Default Project',
                    description: 'Automatically created default project',
                    userId: user.id,
                },
            });

            const [canvas] = await Canvas.findOrCreate({
                where: { id: defaultCanvasId },
                defaults: {
                    name: 'Main Canvas',
                    description: 'Default canvas for the project',
                    projectId: project.id,
                },
            });

            const [flow] = await Flow.findOrCreate({
                where: { id: defaultFlowId },
                defaults: {
                    name: 'Main Flow',
                    projectId: project.id,
                    canvasId: canvas.id,
                    viewport: { x: 0, y: 0, zoom: 1 },
                },
            });

            await project.update({ activeFlowId: flow.id });

            console.log('Seeding completed successfully:');
            console.log(`- User created: ${user.name} (${user.id})`);
            console.log(`- Project created: ${project.name} (${project.id})`);
            console.log(`- Canvas created: ${canvas.name} (${canvas.id})`);
            console.log(`- Flow created: ${flow.name} (${flow.id}, canvasId: ${flow.canvasId})`);
        } else {
            const projects = await Project.findAll({
                include: [
                    { model: Canvas, as: 'canvases', include: [{ model: Flow, as: 'flows' }] },
                ],
            });
            projects.forEach((p) => {
                console.log(`Existing Project: ${p.name} (${p.id})`);
                p.canvases.forEach((c) => {
                    console.log(`  - Canvas: ${c.name} (${c.id})`);
                    c.flows.forEach((f) => {
                        console.log(`    - Flow: ${f.name} (${f.id})`);
                    });
                });
            });
        }
        isInitialized = true;
    } catch (error) {
        // Check for Postgres "column does not exist" error (42703) in both original and parent
        if (
            error.name === 'SequelizeDatabaseError' &&
            (error.original?.code === '42703' || error.parent?.code === '42703')
        ) {
            console.warn(
                '⚠️ Schema mismatch detected (missing column). Attempting auto-fix with { alter: true }...',
            );
            try {
                await sequelize.sync({ alter: true });
                console.log('✅ Database schema auto-corrected successfully.');
                return; // Retry success, exit normally
            } catch (alterError) {
                console.error('❌ Failed to auto-fix schema:', alterError);
                throw alterError; // Rethrow if fix fails
            }
        }
        console.error('Unable to connect to the database or sync:', error);
        throw error;
    } finally {
        isInitializing = false;
    }
};

export { User, Project, Canvas, Flow, Node, Edge, Run, StepResult };
