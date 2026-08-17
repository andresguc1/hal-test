#!/usr/bin/env node

/**
 * Migration Script: SQLite → Disk Storage (v2)
 *
 * Migrates all existing projects, flows, pages, and components
 * from SQLite-only to the new hybrid disk + SQLite storage.
 *
 * Usage: node --experimental-vm-modules scripts/migrate-to-v2.js [--dry-run]
 */

import { Flow, Node, Edge, Project, Canvas } from '../database/init.js';
import { projectStorageService } from '../services/ProjectStorageService.js';
import { flowSerializer } from '../services/FlowSerializer.js';

const isDryRun = process.argv.includes('--dry-run');

async function migrate() {
    console.log('='.repeat(60));
    console.log('HalTest v2 Migration: SQLite → Disk Storage');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
    console.log('='.repeat(60));
    console.log('');

    const projects = await Project.findAll();
    console.log(`Found ${projects.length} project(s) in SQLite.\n`);

    const stats = {
        projects: { created: 0, skipped: 0 },
        flows: { created: 0, skipped: 0 },
        errors: [],
    };

    for (const project of projects) {
        console.log(`── Processing project: ${project.name} (${project.id}) ──`);

        if (!isDryRun) {
            try {
                const existing = await projectStorageService
                    .loadProject(project.id)
                    .catch(() => null);
                if (!existing) {
                    await projectStorageService.createProject({
                        id: project.id,
                        name: project.name,
                        description: project.description,
                    });
                    stats.projects.created++;
                    console.log(`  ✅ Created project directory on disk`);
                } else {
                    stats.projects.skipped++;
                    console.log(`  ⏭️  Project already exists on disk, skipping creation`);
                }
            } catch (error) {
                stats.errors.push({ type: 'project', id: project.id, error: error.message });
                console.log(`  ❌ Error creating project: ${error.message}`);
                continue;
            }
        } else {
            console.log(`  [DRY RUN] Would create project directory`);
            stats.projects.created++;
        }

        const flows = await Flow.findAll({
            where: { projectId: project.id },
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        console.log(`  Found ${flows.length} flow(s)`);

        for (const flow of flows) {
            const nodeCount = flow.nodes?.length || 0;
            const edgeCount = flow.edges?.length || 0;

            if (!isDryRun) {
                try {
                    const relativePath = `flows/${flow.id}.json`;
                    const alreadyExists = projectStorageService.fileExists(
                        project.id,
                        relativePath,
                    );

                    if (!alreadyExists) {
                        const flowJson = flowSerializer._mapFlowToV2(flow);
                        await projectStorageService.writeFile(project.id, relativePath, flowJson);
                        await projectStorageService.addFileRef(project.id, 'flows', relativePath);
                        stats.flows.created++;
                        console.log(`    ✅ ${flow.name} (${nodeCount} nodes, ${edgeCount} edges)`);
                    } else {
                        stats.flows.skipped++;
                        console.log(`    ⏭️  ${flow.name} (already on disk)`);
                    }
                } catch (error) {
                    stats.errors.push({
                        type: 'flow',
                        id: flow.id,
                        projectId: project.id,
                        error: error.message,
                    });
                    console.log(`    ❌ ${flow.name}: ${error.message}`);
                }
            } else {
                console.log(
                    `    [DRY RUN] Would save: ${flow.name} (${nodeCount} nodes, ${edgeCount} edges)`,
                );
                stats.flows.created++;
            }
        }

        console.log('');
    }

    console.log('='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  Projects created: ${stats.projects.created}`);
    console.log(`  Projects skipped: ${stats.projects.skipped}`);
    console.log(`  Flows created:    ${stats.flows.created}`);
    console.log(`  Flows skipped:    ${stats.flows.skipped}`);
    console.log(`  Errors:           ${stats.errors.length}`);

    if (stats.errors.length > 0) {
        console.log('\nErrors:');
        for (const err of stats.errors) {
            console.log(`  - [${err.type}] ${err.id}: ${err.error}`);
        }
    }

    console.log('='.repeat(60));

    if (!isDryRun && stats.errors.length === 0) {
        console.log('\n✅ Migration completed successfully!');
        console.log('Projects are now available on disk under ~/.haltest/projects/');
    } else if (isDryRun) {
        console.log('\n🔍 Dry run complete. Run without --dry-run to apply changes.');
    }
}

migrate().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
