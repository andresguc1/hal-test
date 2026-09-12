'use strict';

/**
 * Migration Runner
 * Handles running migrations up/down with proper tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_TABLE = 'SequelizeMeta';

async function ensureMigrationTable() {
    const dialect = sequelize.getDialect();
    let sql;

    if (dialect === 'sqlite') {
        sql = `
      CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executedAt" DATETIME NOT NULL DEFAULT (datetime('now'))
      );
    `;
    } else {
        sql = `
      CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    }

    await sequelize.query(sql);
}

async function getExecutedMigrations() {
    await ensureMigrationTable();
    const [results] = await sequelize.query(
        `SELECT "name" FROM "${MIGRATION_TABLE}" ORDER BY "executedAt"`,
    );
    return results.map((r) => r.name);
}

async function getPendingMigrations() {
    const executed = await getExecutedMigrations();
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort();

    return files.filter((f) => !executed.includes(f));
}

async function loadMigration(filename) {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const migration = await import(filepath);
    return migration.default;
}

async function runMigrationUp(migration, filename) {
    console.log(`\n📦 Running migration: ${filename}`);
    const startTime = Date.now();

    try {
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        const dialect = sequelize.getDialect();
        const now = dialect === 'sqlite' ? "datetime('now')" : 'NOW()';
        await sequelize.query(
            `INSERT INTO "${MIGRATION_TABLE}" ("name", "executedAt") VALUES (?, ${now})`,
            { replacements: [filename] },
        );
        console.log(`✅ Migration ${filename} completed in ${Date.now() - startTime}ms`);
        return true;
    } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error);
        throw error;
    }
}

async function runMigrationDown(migration, filename) {
    console.log(`\n🔄 Rolling back migration: ${filename}`);
    const startTime = Date.now();

    try {
        await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
        await sequelize.query(`DELETE FROM "${MIGRATION_TABLE}" WHERE "name" = ?`, {
            replacements: [filename],
        });
        console.log(`✅ Rollback ${filename} completed in ${Date.now() - startTime}ms`);
        return true;
    } catch (error) {
        console.error(`❌ Rollback ${filename} failed:`, error);
        throw error;
    }
}

async function migrate() {
    console.log('🚀 Starting migrations...\n');

    await sequelize.authenticate();
    console.log('📡 Database connection established');

    const pending = await getPendingMigrations();

    if (pending.length === 0) {
        console.log('✅ No pending migrations');
        return;
    }

    console.log(`📋 Found ${pending.length} pending migration(s):`);
    pending.forEach((f) => console.log(`   - ${f}`));

    for (const filename of pending) {
        const migration = await loadMigration(filename);
        await runMigrationUp(migration, filename);
    }

    console.log('\n✅ All migrations completed successfully!');
}

async function rollback(steps = 1) {
    console.log(`🔄 Rolling back ${steps} migration(s)...\n`);

    await sequelize.authenticate();
    console.log('📡 Database connection established');

    const executed = await getExecutedMigrations();

    if (executed.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
    }

    const toRollback = executed.slice(-steps).reverse();

    console.log(`📋 Rolling back ${toRollback.length} migration(s):`);
    toRollback.forEach((f) => console.log(`   - ${f}`));

    for (const filename of toRollback) {
        const migration = await loadMigration(filename);
        await runMigrationDown(migration, filename);
    }

    console.log('\n✅ Rollback completed successfully!');
}

async function status() {
    console.log('📊 Migration Status\n');

    await sequelize.authenticate();

    const executed = await getExecutedMigrations();
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort();

    console.log(`Total migrations: ${files.length}`);
    console.log(`Executed: ${executed.length}`);
    console.log(`Pending: ${files.length - executed.length}\n`);

    for (const filename of files) {
        const isExecuted = executed.includes(filename);
        console.log(`${isExecuted ? '✅' : '⏳'} ${filename}`);
    }
}

async function createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const filename = `${timestamp}-${name.toLowerCase().replace(/\s+/g, '-')}.js`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    const template = `'use strict';

/**
 * ${name}
 * Created: ${new Date().toISOString()}
 */

export default {
  async up(queryInterface, Sequelize) {
    console.log('Running migration: ${name}');
    
    // Add your migration code here
    // Example:
    // await queryInterface.addColumn('TableName', 'columnName', {
    //   type: Sequelize.STRING(255),
    //   allowNull: true,
    // });
    
    console.log('✅ Migration ${name} completed');
  },

  async down(queryInterface, _Sequelize) {
    console.log('Rolling back migration: ${name}');
    
    // Add your rollback code here
    // Example:
    // await queryInterface.removeColumn('TableName', 'columnName');
    
    console.log('✅ Rollback ${name} completed');
  },
};
`;

    fs.writeFileSync(filepath, template);
    console.log(`✅ Created migration: ${filename}`);
    console.log(`📝 Edit: ${filepath}`);
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
        case 'up':
        case 'migrate':
            migrate()
                .then(() => process.exit(0))
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            break;
        case 'down':
        case 'rollback':
            rollback(parseInt(arg) || 1)
                .then(() => process.exit(0))
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            break;
        case 'status':
            status()
                .then(() => process.exit(0))
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            break;
        case 'create':
            if (!arg) {
                console.error('Usage: node migrate.js create "Migration Name"');
                process.exit(1);
            }
            createMigration(arg)
                .then(() => process.exit(0))
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            break;
        default:
            console.log('Usage:');
            console.log('  node migrate.js migrate     - Run all pending migrations');
            console.log('  node migrate.js rollback [n] - Rollback n migrations (default 1)');
            console.log('  node migrate.js status       - Show migration status');
            console.log('  node migrate.js create "Name" - Create new migration file');
            process.exit(1);
    }
}

export { migrate, rollback, status, createMigration };
