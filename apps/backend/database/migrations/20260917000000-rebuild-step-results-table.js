'use strict';

/**
 * Rebuild step_results with an INTEGER AUTOINCREMENT primary key.
 *
 * The 20260913000000 fix-schema-mismatch migration created step_results with a
 * VARCHAR(255) PRIMARY KEY that has no auto-increment. The StepResult model
 * declares id as INTEGER autoIncrement, so Sequelize inserts id=NULL and every
 * write fails with `SQLITE_CONSTRAINT: NOT NULL constraint failed: step_results.id`.
 * That blocked ALL step persistence, which is why the Execution History has
 * always shown "0 / 0 STAGES" even when videos and screenshots were captured.
 *
 * This migration rebuilds the table with the correct id column while preserving
 * any existing rows and also adds the timeline/hierarchy columns required by the
 * Execution Replay system (label, sequence, started_at, finished_at).
 */

export default {
    async up(queryInterface, Sequelize) {
        const table = 'step_results';
        const tempTable = 'step_results_new';

        if (queryInterface.sequelize.getDialect() !== 'sqlite') {
            // This migration rebuilds step_results to repair a SQLite-only
            // defect (VARCHAR(255) PRIMARY KEY without auto-increment). On
            // PostgreSQL the id column is already serial/identity and the
            // additional replay columns are handled by dialect-agnostic
            // addColumn calls, so the rebuild is a no-op on non-SQLite.
            console.log(
                `   step_results rebuild is SQLite-only; skipping on ${queryInterface.sequelize.getDialect()}`,
            );
            return;
        }

        // A previous attempt may have failed midway (e.g. on a fresh database
        // whose step_results used the legacy column names), leaving the staging
        // table behind. Drop it so the rebuild is always restartable.
        try {
            await queryInterface.dropTable(tempTable);
        } catch (_) {
            /* staging table does not exist */
        }

        await queryInterface.createTable(tempTable, {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            run_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: { model: 'execution_runs', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            node_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            node_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            label: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            sequence: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            compositeNodeId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            subflowId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            parentNodeId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            screenshot_path: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            input_data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            output_data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            duration_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            memory_hit: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            video_timestamp: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            ai_diagnosis: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            finished_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Preserve existing rows. The source schema varies by environment: an
        // existing install may already have the replay columns, while a fresh
        // database still carries the legacy names from the 20260913 migration
        // (input/output instead of input_data/output_data, completed_at instead
        // of finished_at, and no screenshot_path/ai_diagnosis/etc). Resolve the
        // copy column-by-column from the real schema so the rebuild never
        // references a column that does not exist.
        const sourceColumns = await queryInterface.sequelize.query(`PRAGMA table_info(${table})`, {
            type: Sequelize.QueryTypes.SELECT,
        });
        const sourceColumnNames = new Set(sourceColumns.map((c) => c.name));

        const destinationColumns = [
            'run_id',
            'node_id',
            'node_type',
            'label',
            'sequence',
            'compositeNodeId',
            'subflowId',
            'parentNodeId',
            'status',
            'error',
            'screenshot_path',
            'input_data',
            'output_data',
            'duration_ms',
            'memory_hit',
            'video_timestamp',
            'ai_diagnosis',
            'started_at',
            'finished_at',
            'createdAt',
            'updatedAt',
        ];

        // Legacy names that should feed a modern column when the modern one is
        // absent.
        const sourceAliases = {
            input_data: ['input_data', 'input'],
            output_data: ['output_data', 'output'],
            finished_at: ['finished_at', 'completed_at'],
        };
        const staticDefaults = {
            memory_hit: '0',
            createdAt: 'CURRENT_TIMESTAMP',
            updatedAt: 'CURRENT_TIMESTAMP',
        };

        const targets = [];
        const sources = [];
        for (const column of destinationColumns) {
            const candidates = sourceAliases[column] || [column];
            const source = candidates.find((candidate) => sourceColumnNames.has(candidate));
            targets.push(`"${column}"`);
            sources.push(source ? `"${source}"` : (staticDefaults[column] ?? 'NULL'));
        }

        await queryInterface.sequelize.query(
            `INSERT INTO ${tempTable} (${targets.join(', ')})
             SELECT ${sources.join(', ')}
               FROM ${table}
              ORDER BY rowid`,
        );

        // Rebuild regular indexes (PK index is recreated automatically).
        try {
            await queryInterface.removeIndex(table, 'idx_step_results_run_id');
        } catch (_) {
            /* index may not exist on this environment */
        }
        try {
            await queryInterface.removeIndex(table, 'idx_step_results_node_id');
        } catch (_) {
            /* index may not exist on this environment */
        }
        await queryInterface.dropTable(table);
        await queryInterface.renameTable(tempTable, table);
        await queryInterface.addIndex(table, ['run_id'], { name: 'idx_step_results_run_id' });
        await queryInterface.addIndex(table, ['node_id'], { name: 'idx_step_results_node_id' });

        console.log('✅ step_results rebuilt with INTEGER AUTOINCREMENT id + replay columns');
    },

    async down(queryInterface, Sequelize) {
        const table = 'step_results';
        const legacyTable = 'step_results_legacy';

        await queryInterface.createTable(legacyTable, {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            run_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: { model: 'execution_runs', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            node_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            node_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            duration_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            screenshot_path: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            input_data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            output_data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            memory_hit: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            video_timestamp: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            ai_diagnosis: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            compositeNodeId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            subflowId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            parentNodeId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.sequelize.query(
            `INSERT INTO ${legacyTable}
                (id, run_id, node_id, node_type, status, duration_ms, error, screenshot_path,
                 input_data, output_data, memory_hit, video_timestamp, ai_diagnosis,
                 compositeNodeId, subflowId, parentNodeId, createdAt, updatedAt)
             SELECT id, run_id, node_id, node_type, status, duration_ms, error, screenshot_path,
                    input_data, output_data, memory_hit, video_timestamp, ai_diagnosis,
                    compositeNodeId, subflowId, parentNodeId, createdAt, updatedAt
               FROM ${table}`,
        );

        try {
            await queryInterface.removeIndex(table, 'idx_step_results_run_id');
        } catch (_) {
            /* ignore */
        }
        try {
            await queryInterface.removeIndex(table, 'idx_step_results_node_id');
        } catch (_) {
            /* ignore */
        }
        await queryInterface.dropTable(table);
        await queryInterface.renameTable(legacyTable, table);
        await queryInterface.addIndex(table, ['run_id'], { name: 'idx_step_results_run_id' });
        await queryInterface.addIndex(table, ['node_id'], { name: 'idx_step_results_node_id' });

        console.log('✅ step_results restored to legacy (VARCHAR id) schema');
    },
};
