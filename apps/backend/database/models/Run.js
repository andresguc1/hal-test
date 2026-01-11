import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Run = sequelize.define(
    'Run',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        flow_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('running', 'completed', 'failed'),
            defaultValue: 'running',
        },
        started_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        finished_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        duration_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        trigger: {
            type: DataTypes.STRING,
            defaultValue: 'manual',
        },
    },
    {
        timestamps: true,
        tableName: 'execution_runs', // Explicit table name
    },
);

export default Run;
