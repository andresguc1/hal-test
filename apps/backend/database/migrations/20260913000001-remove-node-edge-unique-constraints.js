'use strict';

/**
 * Remove the global UNIQUE constraints on Nodes.nodeId / Edges.edgeId.
 *
 * The previous schema-fix migration created these columns with `unique: true`,
 * but node/edge ids are only unique PER FLOW — sub-flows (grouping) deliberately
 * reuse the same ids as their parent flow. The global UNIQUE made
 * POST /api/projects/:id/flows fail with 400 when grouping nodes.
 *
 * SQLite cannot drop auto-generated UNIQUE indexes in place, so we recreate both
 * tables (preserving data) without the constraints. The parentId FK -> Nodes.nodeId
 * is also dropped because SQLite requires a unique index on the referenced column.
 */

const quote = (c) => `"${c}"`;

const nodeColumns = [
    'id',
    'nodeId',
    'type',
    'data',
    'position',
    'flowId',
    'parentId',
    'order',
    'createdAt',
    'updatedAt',
];

const edgeColumns = [
    'id',
    'edgeId',
    'source',
    'target',
    'sourceHandle',
    'targetHandle',
    'type',
    'flowId',
    'createdAt',
    'updatedAt',
];

const nodeColSql = nodeColumns.map(quote).join(', ');
const edgeColSql = edgeColumns.map(quote).join(', ');

export default {
    async up(queryInterface, _Sequelize) {
        const qi = queryInterface.sequelize;

        console.log('🚚 Rebuilding Nodes/Edges without global UNIQUE constraints...');

        await qi.query('PRAGMA foreign_keys=OFF');

        try {
            // ---- Nodes ----
            await qi.query('DROP TABLE IF EXISTS "_Nodes_new"');
            await qi.query(
                'CREATE TABLE IF NOT EXISTS "_Nodes_new" (' +
                    '"id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    '"nodeId" VARCHAR(255) NOT NULL, ' +
                    '"type" VARCHAR(100) NOT NULL, ' +
                    '"data" JSONB, ' +
                    '"position" JSONB, ' +
                    '"flowId" VARCHAR(255) NOT NULL REFERENCES "Flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE, ' +
                    '"parentId" VARCHAR(255), ' +
                    '"order" INTEGER NOT NULL DEFAULT 0, ' +
                    '"createdAt" DATETIME NOT NULL, ' +
                    '"updatedAt" DATETIME NOT NULL' +
                    ')',
            );

            await qi.query(
                `INSERT INTO "_Nodes_new" (${nodeColSql}) SELECT ${nodeColSql} FROM "Nodes"`,
            );
            await qi.query('DROP TABLE IF EXISTS "Nodes"');
            await qi.query('ALTER TABLE "_Nodes_new" RENAME TO "Nodes"');

            // ---- Edges ----
            await qi.query('DROP TABLE IF EXISTS "_Edges_new"');
            await qi.query(
                'CREATE TABLE IF NOT EXISTS "_Edges_new" (' +
                    '"id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    '"edgeId" VARCHAR(255) NOT NULL, ' +
                    '"source" VARCHAR(255) NOT NULL, ' +
                    '"target" VARCHAR(255) NOT NULL, ' +
                    '"sourceHandle" VARCHAR(255), ' +
                    '"targetHandle" VARCHAR(255), ' +
                    '"type" VARCHAR(50), ' +
                    '"flowId" VARCHAR(255) NOT NULL REFERENCES "Flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE, ' +
                    '"createdAt" DATETIME NOT NULL, ' +
                    '"updatedAt" DATETIME NOT NULL' +
                    ')',
            );

            await qi.query(
                `INSERT INTO "_Edges_new" (${edgeColSql}) SELECT ${edgeColSql} FROM "Edges"`,
            );
            await qi.query('DROP TABLE IF EXISTS "Edges"');
            await qi.query('ALTER TABLE "_Edges_new" RENAME TO "Edges"');
        } finally {
            await qi.query('PRAGMA foreign_keys=ON');
        }

        // Recreate lookup indexes (dropped along with the old tables)
        const addIndexIfNotExists = async (table, fields, name) => {
            try {
                await queryInterface.addIndex(table, fields, { name });
            } catch (error) {
                if (!String(error.message).includes('already exists')) {
                    throw error;
                }
                console.log(`   Index ${name} already exists, skipping`);
            }
        };

        await addIndexIfNotExists('Nodes', ['flowId'], 'idx_nodes_flow_id');
        await addIndexIfNotExists('Nodes', ['parentId'], 'idx_nodes_parent_id');
        await addIndexIfNotExists('Nodes', ['nodeId'], 'idx_nodes_node_id');
        await addIndexIfNotExists('Edges', ['flowId'], 'idx_edges_flow_id');
        await addIndexIfNotExists('Edges', ['source'], 'idx_edges_source');
        await addIndexIfNotExists('Edges', ['target'], 'idx_edges_target');
        await addIndexIfNotExists('Edges', ['edgeId'], 'idx_edges_edge_id');

        console.log('✅ Removed global UNIQUE constraints from Nodes.nodeId / Edges.edgeId');
    },

    async down(queryInterface, _Sequelize) {
        // Re-add the UNIQUE constraints by recreating the tables again.
        const qi = queryInterface.sequelize;
        await qi.query('PRAGMA foreign_keys=OFF');

        try {
            await qi.query(
                'CREATE TABLE IF NOT EXISTS "_Nodes_old" (' +
                    '"id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    '"nodeId" VARCHAR(255) NOT NULL UNIQUE, ' +
                    '"type" VARCHAR(100) NOT NULL, ' +
                    '"data" JSONB, ' +
                    '"position" JSONB, ' +
                    '"flowId" VARCHAR(255) NOT NULL REFERENCES "Flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE, ' +
                    '"parentId" VARCHAR(255), ' +
                    '"order" INTEGER NOT NULL DEFAULT 0, ' +
                    '"createdAt" DATETIME NOT NULL, ' +
                    '"updatedAt" DATETIME NOT NULL' +
                    ')',
            );
            await qi.query(
                `INSERT INTO "_Nodes_old" (${nodeColSql}) SELECT ${nodeColSql} FROM "Nodes"`,
            );
            await qi.query('DROP TABLE IF EXISTS "Nodes"');
            await qi.query('ALTER TABLE "_Nodes_old" RENAME TO "Nodes"');

            await qi.query(
                'CREATE TABLE IF NOT EXISTS "_Edges_old" (' +
                    '"id" INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    '"edgeId" VARCHAR(255) NOT NULL UNIQUE, ' +
                    '"source" VARCHAR(255) NOT NULL, ' +
                    '"target" VARCHAR(255) NOT NULL, ' +
                    '"sourceHandle" VARCHAR(255), ' +
                    '"targetHandle" VARCHAR(255), ' +
                    '"type" VARCHAR(50), ' +
                    '"flowId" VARCHAR(255) NOT NULL REFERENCES "Flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE, ' +
                    '"createdAt" DATETIME NOT NULL, ' +
                    '"updatedAt" DATETIME NOT NULL' +
                    ')',
            );
            await qi.query(
                `INSERT INTO "_Edges_old" (${edgeColSql}) SELECT ${edgeColSql} FROM "Edges"`,
            );
            await qi.query('DROP TABLE IF EXISTS "Edges"');
            await qi.query('ALTER TABLE "_Edges_old" RENAME TO "Edges"');
        } finally {
            await qi.query('PRAGMA foreign_keys=ON');
        }

        const addIndexIfNotExists = async (table, fields, name) => {
            try {
                await queryInterface.addIndex(table, fields, { name });
            } catch (error) {
                if (!String(error.message).includes('already exists')) {
                    throw error;
                }
            }
        };

        await addIndexIfNotExists('Nodes', ['flowId'], 'idx_nodes_flow_id');
        await addIndexIfNotExists('Nodes', ['parentId'], 'idx_nodes_parent_id');
        await addIndexIfNotExists('Nodes', ['nodeId'], 'idx_nodes_node_id');
        await addIndexIfNotExists('Edges', ['flowId'], 'idx_edges_flow_id');
        await addIndexIfNotExists('Edges', ['source'], 'idx_edges_source');
        await addIndexIfNotExists('Edges', ['target'], 'idx_edges_target');
        await addIndexIfNotExists('Edges', ['edgeId'], 'idx_edges_edge_id');

        console.log('✅ Re-added global UNIQUE constraints to Nodes.nodeId / Edges.edgeId');
    },
};
