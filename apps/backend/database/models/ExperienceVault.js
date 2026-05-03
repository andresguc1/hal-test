import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

/**
 * ExperienceVault Model
 * Stores successful "memories" of selector repairs to be reused,
 * avoiding redundant AI calls. Inspired by MemPalace knowledge graphs.
 */
const ExperienceVault = sequelize.define(
    'ExperienceVault',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        context: {
            type: DataTypes.STRING, // e.g., Flow Name, Project Name, or URL pattern
            allowNull: false,
        },
        url: {
            type: DataTypes.TEXT, // The URL where the failure happened
            allowNull: true,
        },
        nodeId: {
            type: DataTypes.STRING, // Link to the specific node in the flow
            allowNull: true,
        },
        problemSelector: {
            type: DataTypes.TEXT, // The broken selector
            allowNull: false,
        },
        solutionSelector: {
            type: DataTypes.TEXT, // The selector that actually worked
            allowNull: false,
        },
        reasoning: {
            type: DataTypes.TEXT, // AI reasoning / context
            allowNull: true,
        },
        confidence: {
            type: DataTypes.FLOAT,
            defaultValue: 1.0,
        },
        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        lastUsedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: true,
        indexes: [
            {
                fields: ['problemSelector', 'context'],
            },
            {
                fields: ['nodeId'],
            },
        ],
    },
);

export default ExperienceVault;
