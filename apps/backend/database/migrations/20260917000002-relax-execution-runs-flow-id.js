'use strict';

import { QueryTypes } from 'sequelize';

/**
 * Relax execution_runs.flow_id to nullable.
 *
 * The 20260913000000 schema migration created execution_runs.flow_id as
 * NOT NULL, but the Run model declares it nullable ("Allow null to not block
 * execution if flowId is missing"). Normal app use always sends a flowId, so
 * the drift is not user-facing — but a foreign-key-satisfying run that carries
 * no flow (batch/remote runs) would be rejected on a fresh install, unlike on
 * the real database, which was created by an older build's sequelize.sync.
 *
 * This runs Sequelize's own SQLite table rebuild (only when the column is
 * actually NOT NULL), which preserves every row and index and manages foreign
 * keys itself. Existing installs are already nullable and become a no-op.
 */

export default {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.sequelize.query('PRAGMA table_info(execution_runs)', {
            type: QueryTypes.SELECT,
        });
        const flow = columns.find((c) => c.name === 'flow_id');

        if (flow && flow.notnull === 1) {
            await queryInterface.changeColumn('execution_runs', 'flow_id', {
                type: Sequelize.STRING(255),
                allowNull: true,
            });
            console.log('✅ execution_runs.flow_id relaxed to nullable');
        } else {
            console.log('   execution_runs.flow_id already nullable');
        }
    },

    async down(_queryInterface, _Sequelize) {
        // This migration exists to remove the NOT NULL drift; restoring it
        // would reintroduce the problem, so down intentionally does nothing.
    },
};
