import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Project = sequelize.define(
    'Project',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        activeFlowId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        collaborationEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        indexes: [
            {
                name: 'idx_projects_user_updated',
                fields: ['userId', 'updatedAt'],
            },
            {
                name: 'idx_projects_user_name',
                fields: ['userId', 'name'],
            },
        ],
    },
);

export default Project;
