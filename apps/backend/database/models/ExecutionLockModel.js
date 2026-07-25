import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

/**
 * ExecutionLockModel — Persistent execution lock table.
 *
 * Mirrors the in-memory ExecutionLock Map but survives server restarts.
 * Uses flowId as primary key (one active lock per flow at most).
 * Locks past their expiresAt are treated as released.
 */
const ExecutionLockModel = sequelize.define(
    'ExecutionLock',
    {
        flowId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        runId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        startedAt: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        tableName: 'execution_locks',
        timestamps: false,
    },
);

export default ExecutionLockModel;
