import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const SecurityComplianceRun = sequelize.define(
    'SecurityComplianceRun',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        execution_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        project_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        framework_code: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'OWASP_ASVS_L2',
        },
        target_url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        compliance_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        data_leak_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        dom_protection_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        risk_level: {
            type: DataTypes.STRING,
            defaultValue: 'LOW',
        },
        total_rules: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        passed_rules: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        failed_rules: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'PASS',
        },
    },
    {
        tableName: 'security_compliance_runs',
        timestamps: true,
    },
);

export default SecurityComplianceRun;
