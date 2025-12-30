import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Node = sequelize.define(
    'Node',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nodeId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        position: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: { x: 0, y: 0 },
        },
        flowId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: true,
    },
);

export default Node;
