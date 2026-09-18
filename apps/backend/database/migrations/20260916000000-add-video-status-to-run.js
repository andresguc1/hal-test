'use strict';

export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('execution_runs', 'video_status', {
            type: Sequelize.ENUM('recording', 'finalizing', 'available', 'failed'),
            allowNull: false,
            defaultValue: 'recording',
        });
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.removeColumn('execution_runs', 'video_status');
    },
};
