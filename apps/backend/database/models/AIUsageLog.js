import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

/**
 * AIUsageLog Model
 * Persists per-call AI metrics (tokens, latency, model, task type) so token/latency
 * savings from the AI Task Optimizer can be validated against real data.
 * Fire-and-forget writes; failure to log must never break an AI call.
 */
const AIUsageLog = sequelize.define(
    'AIUsageLog',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        task_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        prompt_tokens: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        completion_tokens: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_tokens: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        latency_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        success: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        retry_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        node_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        run_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: 'ai_usage_log',
        indexes: [
            {
                fields: ['task_type'],
            },
            {
                fields: ['createdAt'],
            },
        ],
    },
);

export default AIUsageLog;
