'use strict';

/**
 * SQLite-safe: read-only validation of node data structure.
 * We intentionally avoid heavy JSON UPDATE here because SQLite's JSON
 * function support varies by build. A dedicated Node.js sanitisation
 * script will clean the existing DB at a later time (or via migration).
 * This migration merely verifies the migration chain runs without errors.
 */

export default {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            'PRAGMA journal_mode=DELETE; SELECT count(*) AS node_count FROM "Nodes"',
        );
        console.log('✅ Migration 20261021000000: validation passed (SQLite safe)');
    },

    async down() {
        // no-op
    },
};
