import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const SecurityComplianceResult = sequelize.define(
    'SecurityComplianceResult',
    {
        id: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        compliance_run_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rule_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        severity: {
            type: DataTypes.STRING,
            defaultValue: 'MEDIUM',
        },
        rule_id_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        confidence: {
            type: DataTypes.STRING,
            defaultValue: 'HIGH',
        },
        affected_resource: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        owasp_reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        asvs_reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'PASS',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        evidence_json: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        recommendation: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        compliance_reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'security_compliance_results',
        timestamps: true,
    },
);

export default SecurityComplianceResult;
