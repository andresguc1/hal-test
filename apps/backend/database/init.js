import sequelize from './index.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Canvas from './models/Canvas.js';
import Flow from './models/Flow.js';
import Node from './models/Node.js';
import Edge from './models/Edge.js';
import Run from './models/Run.js';
import StepResult from './models/StepResult.js';
import HealingLog from './models/HealingLog.js';
import ExperienceVault from './models/ExperienceVault.js';
import CollaboratorRole from './models/CollaboratorRole.js';
import ExecutionLockModel from './models/ExecutionLockModel.js';
import SecurityComplianceRun from './models/SecurityComplianceRun.js';
import SecurityComplianceResult from './models/SecurityComplianceResult.js';
import AIUsageLog from './models/AIUsageLog.js';

// Define associations
User.hasMany(Project, { as: 'projects', foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
Project.belongsTo(User, { as: 'user', foreignKey: 'userId' });

SecurityComplianceRun.hasMany(SecurityComplianceResult, {
    as: 'results',
    foreignKey: 'compliance_run_id',
    onDelete: 'CASCADE',
    hooks: true,
});
SecurityComplianceResult.belongsTo(SecurityComplianceRun, {
    as: 'run',
    foreignKey: 'compliance_run_id',
});

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

// Collaborator associations
Project.hasMany(CollaboratorRole, {
    as: 'collaboratorRoles',
    foreignKey: 'projectId',
    onDelete: 'CASCADE',
    hooks: true,
});
CollaboratorRole.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

User.hasMany(CollaboratorRole, {
    as: 'collaboratorRoles',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    hooks: true,
});
CollaboratorRole.belongsTo(User, { as: 'user', foreignKey: 'userId' });

let isInitializing = false;
let isInitialized = false;

/**
 * Run database migrations
 * Creates backup before running migrations in production
 */
export const runMigrations = async () => {
    const isProduction = sequelize.getDialect() === 'postgres';
    const isForced = process.env.DB_FORCE_MIGRATE === 'true';

    // In production, create backup before migrations
    if (isProduction && !isForced) {
        try {
            const { createBackup } = await import('../scripts/db-backup.js');
            console.log('📦 Creating pre-migration backup...');
            await createBackup();
        } catch (error) {
            console.warn('⚠️  Pre-migration backup failed:', error.message);
            // Continue anyway - migrations should be safe
        }
    }

    // Dynamic import to avoid circular dependencies
    const { migrate } = await import('./migrate.js');
    await migrate();
};

/**
 * Initialize database - runs migrations and seeds data
 * Replaces the old sync({ alter }) approach
 */
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

        // Run migrations instead of sync({ alter })
        // This replaces the old auto-migration approach
        await runMigrations();

        // Backfill Node.order for existing rows (new column added with defaultValue: 0)
        try {
            await sequelize.query('UPDATE "Nodes" SET "order" = "id" - 1 WHERE "order" = 0', {
                logging: false,
            });
        } catch (e) {
            // Ignore if column doesn't exist yet (will be created by migration)
        }

        // Backfill Flow.hasInput/hasOutput for existing rows
        try {
            await sequelize.query(
                `
                UPDATE "Flows" SET "hasInput" = (
                    SELECT COUNT(*) > 0 FROM "Nodes" WHERE "Nodes"."flowId" = "Flows"."id" AND "Nodes"."type" = 'input'
                ), "hasOutput" = (
                    SELECT COUNT(*) > 0 FROM "Nodes" WHERE "Nodes"."flowId" = "Flows"."id" AND "Nodes"."type" = 'output'
                )
            `,
                { logging: false },
            );
        } catch (e) {
            // Ignore if columns don't exist yet (will be created by migration)
        }

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
        // Detailed logging for connection failures
        console.error(' [DB_INIT] Unable to connect to the database or run migrations:', {
            name: error.name,
            message: error.message,
            code: error.original?.code || error.parent?.code,
            sql: error.sql,
        });

        // Check for Postgres "column does not exist" error (42703) or "relation does not exist" (42P01)
        const isPostgresSchemaError =
            error.name === 'SequelizeDatabaseError' &&
            ['42703', '42P01'].includes(error.original?.code || error.parent?.code);

        if (isPostgresSchemaError || process.env.DB_AUTO_MIGRATE === 'true') {
            console.warn(
                ' [DB_INIT] ⚠️ Schema mismatch or missing tables detected. Attempting migration...',
            );
            try {
                await runMigrations();
                console.log(' [DB_INIT] ✅ Database migrations completed successfully.');
                isInitialized = true;
                return;
            } catch (migrationError) {
                console.error(' [DB_INIT] ❌ Failed to run migrations:', migrationError);
                throw migrationError;
            }
        }
        throw error;
    } finally {
        isInitializing = false;
    }
};

export {
    User,
    Project,
    Canvas,
    Flow,
    Node,
    Edge,
    Run,
    StepResult,
    HealingLog,
    ExperienceVault,
    CollaboratorRole,
    ExecutionLockModel,
    SecurityComplianceRun,
    SecurityComplianceResult,
    AIUsageLog,
};

// Allow running directly from CLI
if (process.argv[1] && process.argv[1].endsWith('init.js')) {
    const force = process.argv.includes('--force');
    initDb(force)
        .then(() => {
            console.log('✅ Database initialization successful.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        });
}
