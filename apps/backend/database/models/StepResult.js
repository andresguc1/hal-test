import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const StepResult = sequelize.define(
    'StepResult',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        run_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        node_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        node_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'skipped', 'healed'),
            defaultValue: 'pending',
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        screenshot_path: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        input_data: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        output_data: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        duration_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        memory_hit: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        video_timestamp: {
            type: DataTypes.FLOAT, // Seconds into the video
            allowNull: true,
        },
        ai_diagnosis: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: 'step_results', // Explicit table name
    },
);

export default StepResult;
