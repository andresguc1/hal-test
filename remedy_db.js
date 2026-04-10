import sequelize from './apps/backend/database/index.js';

async function remedy() {
    console.log('--- STARTING DATABASE REMEDIATION ---');
    try {
        // 1. execution_runs table
        console.log('Syncing "execution_runs" table...');
        await sequelize.query('ALTER TABLE execution_runs ADD COLUMN browser_version TEXT;').catch(e => console.log('  [SKIPPED] browser_version:', e.message));
        await sequelize.query('ALTER TABLE execution_runs ADD COLUMN memory_palace_hits INTEGER DEFAULT 0;').catch(e => console.log('  [SKIPPED] memory_palace_hits:', e.message));
        await sequelize.query('ALTER TABLE execution_runs ADD COLUMN total_healed INTEGER DEFAULT 0;').catch(e => console.log('  [SKIPPED] total_healed:', e.message));

        // 2. step_results table
        console.log('Syncing "step_results" table...');
        await sequelize.query('ALTER TABLE step_results ADD COLUMN memory_hit TINYINT(1) DEFAULT 0;').catch(e => console.log('  [SKIPPED] memory_hit:', e.message));
        await sequelize.query('ALTER TABLE step_results ADD COLUMN video_timestamp REAL;').catch(e => console.log('  [SKIPPED] video_timestamp:', e.message));
        await sequelize.query('ALTER TABLE step_results ADD COLUMN ai_diagnosis TEXT;').catch(e => console.log('  [SKIPPED] ai_diagnosis:', e.message));

        console.log('--- REMEDIATION COMPLETE ---');
    } catch (err) {
        console.error('CRITICAL REMEDIATION FAILURE:', err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

remedy();
