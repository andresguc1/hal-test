'use strict';

import { QueryTypes } from 'sequelize';

/**
 * Adds execution_runs.trace_path so Playwright trace archives produced for a
 * run can be located and served (e.g. the Trace Viewer / Trace Diff features).
 *
 * Guarded by column introspection so it is a no-op on installs that already
 * have the column (older builds ran sequelize.sync against the model).
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

export default {
    async up(queryInterface, Sequelize) {
        const runColumns = await columnsOf(queryInterface, 'execution_runs');
        if (!runColumns.includes('trace_path')) {
            await queryInterface.addColumn('execution_runs', 'trace_path', {
                type: Sequelize.STRING(512),
                allowNull: true,
            });
            console.log('   Added execution_runs.trace_path');
        }
    },

    async down(queryInterface) {
        const runColumns = await columnsOf(queryInterface, 'execution_runs');
        if (runColumns.includes('trace_path')) {
            await queryInterface.removeColumn('execution_runs', 'trace_path');
        }
    },
};
