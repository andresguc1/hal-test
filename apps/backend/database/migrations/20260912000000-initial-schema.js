'use strict';

/**
 * Initial schema migration
 * Represents the current database schema as of 2026-09-12
 * This migration should only run on fresh databases
 */

export default {
    async up(queryInterface, Sequelize) {
        console.log('Running initial schema migration...');

        // Create Users table
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            role: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'user',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Projects table
        await queryInterface.createTable('Projects', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            userId: {
                type: Sequelize.STRING(255),
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            activeFlowId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            collaborationEnabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Canvases table
        await queryInterface.createTable('Canvases', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            projectId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Projects',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Flows table
        await queryInterface.createTable('Flows', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'main',
            },
            projectId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Projects',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            canvasId: {
                type: Sequelize.STRING(255),
                allowNull: true,
                references: {
                    model: 'Canvases',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            parentId: {
                type: Sequelize.STRING(255),
                allowNull: true,
                references: {
                    model: 'Flows',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            viewport: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            hasInput: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            hasOutput: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Nodes table
        await queryInterface.createTable('Nodes', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
                field: 'nodeId',
            },
            nodeId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            data: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            position: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            flowId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Flows',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            parentId: {
                type: Sequelize.STRING(255),
                allowNull: true,
                references: {
                    model: 'Nodes',
                    key: 'nodeId',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Edges table
        await queryInterface.createTable('Edges', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
                field: 'edgeId',
            },
            edgeId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            source: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            target: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            sourceHandle: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            targetHandle: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            flowId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Flows',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create Runs table
        await queryInterface.createTable('execution_runs', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            flow_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Flows',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            flow_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            project_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            batch_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'pending',
            },
            trigger: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            flow_snapshot: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            duration_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            total_healed: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            memory_palace_hits: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create StepResults table
        await queryInterface.createTable('step_results', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            run_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'execution_runs',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            node_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            node_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            duration_ms: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            input: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            output: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            healed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create HealingLogs table
        await queryInterface.createTable('HealingLogs', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            run_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            node_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            original_selector: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            healed_selector: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            strategy: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            success: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create ExperienceVaults table
        await queryInterface.createTable('ExperienceVaults', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            nodeId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            selector: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            pageUrl: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            context: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            successCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            failureCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            lastUsed: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create CollaboratorRoles table
        await queryInterface.createTable('CollaboratorRoles', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            projectId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Projects',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            userId: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            role: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'editor',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create ExecutionLocks table
        await queryInterface.createTable('execution_locks', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            flowId: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            userName: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            runId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            acquiredAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            expiresAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create SecurityComplianceRuns table
        await queryInterface.createTable('security_compliance_runs', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            targetUrl: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            standard: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            complianceScore: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            dataLeakScore: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            domProtectionScore: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            riskLevel: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'pending',
            },
            execution_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            startedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            completedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create SecurityComplianceResults table
        await queryInterface.createTable('security_compliance_results', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            compliance_run_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                references: {
                    model: 'security_compliance_runs',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            ruleId: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            ruleIdCode: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            severity: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            evidence: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            remediation: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Create AIUsageLogs table
        await queryInterface.createTable('AIUsageLogs', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            model: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            provider: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            promptTokens: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            completionTokens: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            totalTokens: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            estimatedCost: {
                type: Sequelize.DECIMAL(10, 6),
                allowNull: true,
            },
            operation: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Add indexes (idempotent - ignore if already exists)
        const addIndexIfNotExists = async (table, fields, name) => {
            try {
                await queryInterface.addIndex(table, fields, { name });
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                console.log(`   Index ${name} already exists, skipping`);
            }
        };

        await addIndexIfNotExists('Projects', ['userId'], 'idx_projects_user_id');
        await addIndexIfNotExists('Canvases', ['projectId'], 'idx_canvases_project_id');
        await addIndexIfNotExists('Flows', ['projectId'], 'idx_flows_project_id');
        await addIndexIfNotExists('Flows', ['canvasId'], 'idx_flows_canvas_id');
        await addIndexIfNotExists('Flows', ['parentId'], 'idx_flows_parent_id');
        await addIndexIfNotExists('Nodes', ['flowId'], 'idx_nodes_flow_id');
        await addIndexIfNotExists('Nodes', ['parentId'], 'idx_nodes_parent_id');
        await addIndexIfNotExists('Edges', ['flowId'], 'idx_edges_flow_id');
        await addIndexIfNotExists('Edges', ['source'], 'idx_edges_source');
        await addIndexIfNotExists('Edges', ['target'], 'idx_edges_target');
        await addIndexIfNotExists('execution_runs', ['flow_id'], 'idx_runs_flow_id');
        await addIndexIfNotExists('execution_runs', ['project_id'], 'idx_runs_project_id');
        await addIndexIfNotExists('execution_runs', ['batch_id'], 'idx_runs_batch_id');
        await addIndexIfNotExists('execution_runs', ['status'], 'idx_runs_status');
        await addIndexIfNotExists('step_results', ['run_id'], 'idx_step_results_run_id');
        await addIndexIfNotExists('step_results', ['node_id'], 'idx_step_results_node_id');
        await addIndexIfNotExists(
            'CollaboratorRoles',
            ['projectId'],
            'idx_collaborators_project_id',
        );
        await addIndexIfNotExists('CollaboratorRoles', ['userId'], 'idx_collaborators_user_id');
        await addIndexIfNotExists('execution_locks', ['flowId'], 'idx_execution_locks_flow_id');
        await addIndexIfNotExists(
            'security_compliance_runs',
            ['execution_id'],
            'idx_compliance_runs_execution_id',
        );
        await addIndexIfNotExists(
            'security_compliance_results',
            ['compliance_run_id'],
            'idx_compliance_results_run_id',
        );
        await addIndexIfNotExists('AIUsageLogs', ['userId'], 'idx_ai_usage_user_id');

        console.log('✅ Initial schema migration completed');
    },

    async down(queryInterface, _Sequelize) {
        console.log('Rolling back initial schema migration...');

        // Drop indexes first (some might be auto-dropped with tables)
        const indexesToDrop = [
            'idx_projects_user_id',
            'idx_canvases_project_id',
            'idx_flows_project_id',
            'idx_flows_canvas_id',
            'idx_flows_parent_id',
            'idx_nodes_flow_id',
            'idx_nodes_parent_id',
            'idx_edges_flow_id',
            'idx_edges_source',
            'idx_edges_target',
            'idx_runs_flow_id',
            'idx_runs_project_id',
            'idx_runs_batch_id',
            'idx_runs_status',
            'idx_step_results_run_id',
            'idx_step_results_node_id',
            'idx_collaborators_project_id',
            'idx_collaborators_user_id',
            'idx_execution_locks_flow_id',
            'idx_compliance_runs_execution_id',
            'idx_compliance_results_run_id',
            'idx_ai_usage_user_id',
        ];

        for (const indexName of indexesToDrop) {
            try {
                await queryInterface.removeIndex('Projects', indexName);
            } catch (e) {
                // Index might not exist or already dropped
            }
        }

        // Drop tables in reverse order (respecting foreign keys)
        const tables = [
            'AIUsageLogs',
            'security_compliance_results',
            'security_compliance_runs',
            'execution_locks',
            'CollaboratorRoles',
            'ExperienceVaults',
            'HealingLogs',
            'step_results',
            'execution_runs',
            'Edges',
            'Nodes',
            'Flows',
            'Canvases',
            'Projects',
            'Users',
        ];

        for (const table of tables) {
            try {
                await queryInterface.dropTable(table);
            } catch (e) {
                console.warn(`Could not drop table ${table}:`, e.message);
            }
        }

        console.log('✅ Initial schema migration rolled back');
    },
};
