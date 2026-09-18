'use strict';

export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('step_results', 'compositeNodeId', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('step_results', 'subflowId', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('step_results', 'parentNodeId', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('step_results', 'parentNodeId');
        await queryInterface.removeColumn('step_results', 'subflowId');
        await queryInterface.removeColumn('step_results', 'compositeNodeId');
    },
};
