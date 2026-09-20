'use strict';

export default {
    async up(queryInterface, Sequelize) {
        const addColumn = async (name, type) => {
            try {
                await queryInterface.addColumn('HealingLogs', name, type);
            } catch (e) {
                // Columna ya existe (re-ejecución) — ignorar
            }
        };

        await addColumn('provider', { type: Sequelize.STRING, allowNull: true });
        await addColumn('policy_action', { type: Sequelize.STRING, allowNull: true });
        await addColumn('ambiguity', {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        });
        await addColumn('signals_matched', { type: Sequelize.JSON, allowNull: true });
        await addColumn('calibrated_confidence', { type: Sequelize.FLOAT, allowNull: true });
    },

    async down(queryInterface) {
        for (const name of [
            'calibrated_confidence',
            'signals_matched',
            'ambiguity',
            'policy_action',
            'provider',
        ]) {
            try {
                await queryInterface.removeColumn('HealingLogs', name);
            } catch (e) {
                // La columna no existe — ignorar
            }
        }
    },
};
