import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const HealingLog = sequelize.define(
    'HealingLog',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        nodeId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        flowId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        runId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        originalSelector: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        newSelector: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        confidence: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        reasoning: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        applied: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        policy_action: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ambiguity: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        signals_matched: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        calibrated_confidence: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    },
);

export default HealingLog;
