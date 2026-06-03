import { initDb, Run, StepResult } from '../apps/backend/database/init.js';

async function main() {
    await initDb();
    const runs = await Run.findAll({
        order: [['started_at', 'DESC']],
        limit: 5
    });

    console.log('--- RECENT RUNS ---');
    for (const run of runs) {
        console.log(`Run ID: ${run.id}, Status: ${run.status}, Started: ${run.started_at}`);
        const steps = await StepResult.findAll({
            where: { run_id: run.id }
        });
        console.log(`  Steps count: ${steps.length}`);
        for (const step of steps) {
            console.log(`    Step: ${step.node_id} (${step.node_type}), Status: ${step.status}`);
            if (step.status === 'failed') {
                console.log(`      Error: ${step.error}`);
            }
        }
    }
}

main().catch(console.error);
