'use strict';

/**
 * Add contentHash column + unique constraint on Flows.
 *
 * 1. contentHash (SHA-256 of normalized nodes+edges) enables content-based
 *    deduplication during imports without re-reading every flow's nodes.
 * 2. Unique index on (projectId, type, name) enforces name uniqueness at the
 *    DB level, backing up the application-level suffix loop in project.router.js.
 * 3. Pre-existing duplicate names are sanitized (renamed with a suffix) before
 *    the unique index is created.
 */

export default {
    async up(queryInterface, Sequelize) {
        // 1. Add contentHash column
        try {
            await queryInterface.addColumn('Flows', 'contentHash', {
                type: Sequelize.STRING(64),
                allowNull: true,
                defaultValue: null,
            });
        } catch (e) {
            // Column already exists (re-run) — ignore
        }

        const qi = queryInterface.sequelize;

        // 2. Sanitize pre-existing duplicate names before adding the unique index.
        //    Keep the oldest flow (lowest id) and rename the rest.
        const [duplicates] = await qi.query(`
            SELECT "projectId", "type", name
            FROM "Flows"
            WHERE "projectId" IS NOT NULL
            GROUP BY "projectId", "type", name
            HAVING COUNT(*) > 1
        `);

        for (const dup of duplicates) {
            const [rows] = await qi.query(
                `SELECT id FROM "Flows"
                 WHERE "projectId" = :projectId AND "type" = :type AND name = :name
                 ORDER BY "createdAt" ASC, id ASC`,
                {
                    replacements: {
                        projectId: dup.projectId,
                        type: dup.type,
                        name: dup.name,
                    },
                },
            );

            // Keep the first (oldest), rename the rest
            for (let i = 1; i < rows.length; i++) {
                const newName = `${dup.name} (${i})`;
                await qi.query(`UPDATE "Flows" SET name = :newName WHERE id = :id`, {
                    replacements: { newName, id: rows[i].id },
                });
            }
        }

        if (duplicates.length > 0) {
            console.log(`🔧 FlowDeduplicator: renamed ${duplicates.length} duplicate group(s)`);
        }

        // 3. Add unique index (projectId, type, name)
        try {
            await queryInterface.addIndex('Flows', ['projectId', 'type', 'name'], {
                unique: true,
                name: 'uq_flows_project_type_name',
            });
        } catch (e) {
            if (!String(e.message).toLowerCase().includes('already exists')) {
                throw e;
            }
        }

        // 4. Add contentHash lookup index
        try {
            await queryInterface.addIndex('Flows', ['projectId', 'contentHash'], {
                name: 'idx_flows_project_content_hash',
            });
        } catch (e) {
            if (!String(e.message).toLowerCase().includes('already exists')) {
                throw e;
            }
        }

        console.log('✅ Flows: contentHash column + unique (projectId,type,name) index added');
    },

    async down(queryInterface) {
        try {
            await queryInterface.removeIndex('Flows', 'idx_flows_project_content_hash');
        } catch (e) {
            // Index doesn't exist — ignore
        }
        try {
            await queryInterface.removeIndex('Flows', 'uq_flows_project_type_name');
        } catch (e) {
            // Index doesn't exist — ignore
        }
        try {
            await queryInterface.removeColumn('Flows', 'contentHash');
        } catch (e) {
            // Column doesn't exist — ignore
        }
    },
};
