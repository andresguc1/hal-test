'use strict';

export default {
    async up(queryInterface, Sequelize) {
        const addColumn = async (name, type) => {
            try {
                await queryInterface.addColumn('Projects', name, type);
            } catch (e) {
                // Column already exists (re-run) — ignore
            }
        };

        // defaultActionTimeoutMs: project-level default timeout in milliseconds.
        // NULL means "no project default" (falls through to platform default).
        // 0 means "platform default" explicitly. Positive values are the timeout.
        await addColumn('defaultActionTimeoutMs', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface) {
        try {
            await queryInterface.removeColumn('Projects', 'defaultActionTimeoutMs');
        } catch (e) {
            // Column doesn't exist — ignore
        }
    },
};
