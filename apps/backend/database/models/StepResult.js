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
        /** Human-friendly label used in the Execution History / Replay UI */
        label: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        /** Deterministic order of the step within its run */
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        /** Exact wall-clock time the step started (unlike createdAt which is set at persist time) */
        started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        /** Exact wall-clock time the step finished */
        finished_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        /** ID of the composite node that contains this step (if any) */
        compositeNodeId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        /** ID of the subflow that contains this step (if any) */
        subflowId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        /** ID of the parent node that triggered this step (if any) */
        parentNodeId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'running',
                'success',
                'failed',
                'skipped',
                'healed',
                'softfailed',
                'blocked',
                'cancelled',
            ),
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
