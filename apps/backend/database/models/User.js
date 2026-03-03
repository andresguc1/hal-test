import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'user',
        },
    },
    {
        timestamps: true,
    },
);

export default User;
