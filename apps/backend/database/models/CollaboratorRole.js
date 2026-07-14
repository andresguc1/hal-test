import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const CollaboratorRole = sequelize.define(
    'CollaboratorRole',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'editor', // 'owner', 'admin', 'editor', 'viewer'
        },
    },
    {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['projectId', 'userId'],
            },
        ],
    },
);

export default CollaboratorRole;
