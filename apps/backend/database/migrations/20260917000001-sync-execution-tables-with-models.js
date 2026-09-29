'use strict';

import { QueryTypes } from 'sequelize';

/**
 * Bring a fresh install in line with the current Sequelize models.
 *
 * The 20260913 schema migration predates several model fields, so a database
 * created only from migrations was missing:
 *   - execution_runs.finished_at / video_path / browser_version / video_status
 *   - the execution_locks table shape (models key it by flowId with BIGINT
 *     startedAt/expiresAt; the migration created an `id` PK + acquiredAt DATE)
 *
 * Existing installs already have these (older builds ran sequelize.sync), so
 * every step is guarded by PRAGMA introspection and becomes a no-op there.
 */

async function columnsOf(queryInterface, table) {
    const qi = queryInterface.sequelize;
    if (qi.getDialect() === 'sqlite') {
        const rows = await qi.query(`PRAGMA table_info(${table})`, {
            type: QueryTypes.SELECT,
        });
        return rows.map((r) => r.name);
    }
    const rows = await qi.query(
        'SELECT column_name AS name FROM information_schema.columns WHERE table_name = $1',
        { type: QueryTypes.SELECT, bind: [table] },
    );
    return rows.map((r) => r.name);
}

async function hasTable(queryInterface, table) {
    const qi = queryInterface.sequelize;
    if (qi.getDialect() === 'sqlite') {
        const rows = await qi.query(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table}'`,
            { type: QueryTypes.SELECT },
        );
        return rows.length > 0;
    }
    const rows = await qi.query(
        'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1',
        { type: QueryTypes.SELECT, bind: [table] },
    );
    return rows.length > 0;
}

export default {
    async up(queryInterface, Sequelize) {
        // ---- execution_runs: timeline / video / browser columns ----
        const runColumns = await columnsOf(queryInterface, 'execution_runs');
        const runAdditions = [
            ['finished_at', { type: Sequelize.DATE, allowNull: true }],
            ['video_path', { type: Sequelize.STRING(255), allowNull: true }],
            ['browser_version', { type: Sequelize.STRING(255), allowNull: true }],
            [
                'video_status',
                {
                    type: Sequelize.ENUM('recording', 'finalizing', 'available', 'failed'),
                    allowNull: false,
                    defaultValue: 'recording',
                },
            ],
        ];
        for (const [name, definition] of runAdditions) {
            if (!runColumns.includes(name)) {
                await queryInterface.addColumn('execution_runs', name, definition);
                console.log(`   Added execution_runs.${name}`);
            }
        }

        // ---- execution_locks: match the ExecutionLockModel ----
        if (await hasTable(queryInterface, 'execution_locks')) {
            const lockColumns = await columnsOf(queryInterface, 'execution_locks');
            const alreadyAligned = lockColumns.includes('startedAt') && !lockColumns.includes('id');

            if (!alreadyAligned) {
                if (queryInterface.sequelize.getDialect() !== 'sqlite') {
                    // The legacy-layout rebuild below relies on SQLite-only intro‐
                    // spection (PRAGMA) and expressions (strftime). On PostgreSQL
                    // the lock table is always created in the model shape, so a
                    // legacy-table rebuild is never needed here.
                    console.log(
                        `   Skipping SQLite-only execution_locks rebuild on ${queryInterface.sequelize.getDialect()}`,
                    );
                } else {
                    const tempTable = 'execution_locks_new';
                    try {
                        await queryInterface.dropTable(tempTable);
                    } catch (_) {
                        /* not present */
                    }

                    await queryInterface.createTable(tempTable, {
                        flowId: {
                            type: Sequelize.STRING(255),
                            primaryKey: true,
                            allowNull: false,
                        },
                        userId: {
                            type: Sequelize.STRING(255),
                            allowNull: false,
                        },
                        userName: {
                            type: Sequelize.STRING(255),
                            allowNull: true,
                        },
                        runId: {
                            type: Sequelize.STRING(255),
                            allowNull: false,
                        },
                        startedAt: {
                            type: Sequelize.BIGINT,
                            allowNull: false,
                        },
                        expiresAt: {
                            type: Sequelize.BIGINT,
                            allowNull: false,
                        },
                    });

                    // Legacy rows may have NULLs the model forbids and store time as
                    // DATE; normalize while copying.
                    const startedExpr = lockColumns.includes('startedAt')
                        ? 'startedAt'
                        : lockColumns.includes('acquiredAt')
                          ? "CAST(strftime('%s', acquiredAt) AS INTEGER) * 1000"
                          : "CAST(strftime('%s', 'now') AS INTEGER) * 1000";
                    const expiresExpr = lockColumns.includes('expiresAt')
                        ? "CAST(strftime('%s', expiresAt) AS INTEGER) * 1000"
                        : "CAST(strftime('%s', 'now') AS INTEGER) * 1000 + 600000";

                    await queryInterface.sequelize.query(
                        `INSERT INTO ${tempTable} (flowId, userId, userName, runId, startedAt, expiresAt)
                     SELECT flowId,
                            COALESCE(userId, ''),
                            userName,
                            COALESCE(runId, ''),
                            COALESCE(${startedExpr}, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
                            COALESCE(${expiresExpr}, CAST(strftime('%s', 'now') AS INTEGER) * 1000 + 600000)
                       FROM execution_locks`,
                    );

                    await queryInterface.dropTable('execution_locks');
                    await queryInterface.renameTable(tempTable, 'execution_locks');
                    console.log('   Rebuilt execution_locks to match ExecutionLockModel');
                }
            }
        } else {
            await queryInterface.createTable('execution_locks', {
                flowId: {
                    type: Sequelize.STRING(255),
                    primaryKey: true,
                    allowNull: false,
                },
                userId: { type: Sequelize.STRING(255), allowNull: false },
                userName: { type: Sequelize.STRING(255), allowNull: true },
                runId: { type: Sequelize.STRING(255), allowNull: false },
                startedAt: { type: Sequelize.BIGINT, allowNull: false },
                expiresAt: { type: Sequelize.BIGINT, allowNull: false },
            });
            console.log('   Created execution_locks');
        }

        console.log('✅ Execution tables aligned with models');
    },

    async down(queryInterface) {
        // Reverting would reintroduce the drift; only the lock table shape is
        // restored to the legacy layout to keep the migration reversible.
        if (await hasTable(queryInterface, 'execution_locks')) {
            const lockColumns = await columnsOf(queryInterface, 'execution_locks');
            if (!lockColumns.includes('id')) {
                await queryInterface.addColumn('execution_locks', 'id', {
                    type: 'VARCHAR(255)',
                    allowNull: true,
                });
            }
        }
    },
};
