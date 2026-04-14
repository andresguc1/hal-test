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
            allowNull: true, // Allow null to not block execution if flowId is missing
        },
        batch_id: {
            type: DataTypes.STRING,
            allowNull: true, // Used to group multiple runs from a single Test Runner execution
        },
        project_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        flow_name: {
            type: DataTypes.STRING,
            allowNull: true,
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
        flow_snapshot: {
            type: DataTypes.TEXT, // Stores JSON string of { nodes, edges }
            allowNull: true,
        },
        video_path: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        browser_version: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        memory_palace_hits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_healed: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
        tableName: 'execution_runs', // Explicit table name
    },
);

export default Run;
