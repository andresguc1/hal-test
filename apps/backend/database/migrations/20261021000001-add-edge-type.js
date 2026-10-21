'use strict';

/**
 * Add `type` column to Edges table.
 * 1. Add the column if it doesn't exist (SQLite compatible ALTER TABLE)
 * 2. Backfill existing rows with 'custom' (redundant with default, but safe)
 */

export default {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            'ALTER TABLE "Edges" ADD COLUMN "type" TEXT NOT NULL DEFAULT \'custom\'',
        );
        await queryInterface.sequelize.query(
            'UPDATE "Edges" SET "type" = \'custom\' WHERE "type" IS NULL',
        );
        console.log('✅ Migration 20261021000001: Edge type column added and backfilled');
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('UPDATE "Edges" SET "type" = NULL');
    },
};
