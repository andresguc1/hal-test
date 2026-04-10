import { Run, initDb } from './apps/backend/database/init.js';

async function test() {
    await initDb();
    try {
        const runs = await Run.findAll({ limit: 1 });
        console.log('Successfully found runs:', runs.length);
    } catch (e) {
        console.error('FAILED TO FETCH RUNS:', e.message);
        process.exit(1);
    }
}

test();
