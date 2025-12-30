import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Flow = sequelize.define(
    'Flow',
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
        viewport: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: { x: 0, y: 0, zoom: 1 },
        },
        projectId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        timestamps: true,
    },
);

export default Flow;
