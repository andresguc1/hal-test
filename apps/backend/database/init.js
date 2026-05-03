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

const safeSync = async (options) => {
    const isSqlite = sequelize.getDialect() === 'sqlite';
    if (isSqlite && options.alter) {
        try {
            await sequelize.query('PRAGMA foreign_keys = OFF');
            const [results] = await sequelize.query(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup'",
            );
            for (const row of results) {
                if (row.name) {
                    await sequelize.query(`DROP TABLE IF EXISTS "${row.name}"`);
                    console.log(` [DB_INIT] 🧹 Dropped orphaned backup table: ${row.name}`);
                }
            }
        } catch (e) {
            console.warn(' [DB_INIT] ⚠️ Error preparing SQLite for alter:', e.message);
        }
    }

    try {
        await sequelize.sync(options);
    } finally {
        if (isSqlite && options.alter) {
            try {
                await sequelize.query('PRAGMA foreign_keys = ON');
            } catch (e) {
                console.warn(' [DB_INIT] ⚠️ Error restoring SQLite foreign keys:', e.message);
            }
        }
    }
};

// Health Check to detect missing columns in production (Render/Postgres)
const checkSchemaHealth = async () => {
    try {
        console.log(' [DB_INIT] Running schema health check...');
        // Check critical new columns that often cause 500s if missing
        await sequelize.query('SELECT "parentId" FROM "Nodes" LIMIT 1', {
            logging: false,
        });
        await sequelize.query('SELECT "batch_id" FROM "execution_runs" LIMIT 1', {
            logging: false,
        });
        await sequelize.query('SELECT "nodeId" FROM "ExperienceVaults" LIMIT 1', {
            logging: false,
        });
        console.log(' [DB_INIT] ✅ Schema health check passed.');
    } catch (error) {
        const isMissingColumn =
            error.name === 'SequelizeDatabaseError' &&
            ['42703', 'SQLITE_ERROR'].some((code) =>
                (error.original?.code || error.message).includes(code),
            );

        if (isMissingColumn) {
            console.warn(
                ' [DB_INIT] ⚠️ Schema mismatch detected via health check. Attempting auto-fix with { alter: true }...',
            );
            await safeSync({ alter: true });
            console.log(' [DB_INIT] ✅ Database schema auto-corrected successfully.');
        } else {
            console.error(' [DB_INIT] ❌ Schema health check failed with unexpected error:', error);
            // Don't throw here, let the main initDb handle it if it's fatal
        }
    }
};

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

        const shouldAlter = _force || process.env.DB_AUTO_MIGRATE === 'true';

        try {
            await safeSync({ alter: shouldAlter });
            console.log(`Database synchronized (Alter: ${shouldAlter})`);
        } catch (syncError) {
            const isMissingColumn =
                syncError.name === 'SequelizeDatabaseError' &&
                ['42703', 'SQLITE_ERROR'].some((code) =>
                    (syncError.original?.code || syncError.message).includes(code),
                );

            if (isMissingColumn && !shouldAlter) {
                console.warn(
                    ' [DB_INIT] ⚠️ Schema mismatch detected during sync. Attempting auto-fix with { alter: true }...',
                );
                await safeSync({ alter: true });
                console.log(' [DB_INIT] ✅ Database schema auto-corrected successfully.');
            } else {
                throw syncError;
            }
        }

        // Pre-flight Schema Health Check (especially for PostgreSQL/Production)
        await checkSchemaHealth();

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
        console.error(' [DB_INIT] Unable to connect to the database or sync:', {
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
                ' [DB_INIT] ⚠️ Schema mismatch or missing tables detected. Attempting auto-fix with { alter: true }...',
            );
            try {
                // In production, we use alter: true to add missing columns/tables without data loss
                await safeSync({ alter: true });
                console.log(' [DB_INIT] ✅ Database schema auto-corrected successfully.');
                isInitialized = true;
                return;
            } catch (alterError) {
                console.error(' [DB_INIT] ❌ Failed to auto-fix schema:', alterError);
                throw alterError;
            }
        }
        throw error;
    } finally {
        isInitializing = false;
    }
};

export { User, Project, Canvas, Flow, Node, Edge, Run, StepResult, HealingLog, ExperienceVault };

// Allow running directly from CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('init.js')) {
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
