import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Vitest global setup — runs ONCE in the main process before test workers fork.
 *
 * Backend tests run as many parallel processes, and importing app.js invokes
 * initDb() in every worker. On a fresh CI runner (empty ~/.haltest) several
 * workers race migrations + default-data seeding against the single shared
 * SQLite file, which spuriously fails with `SQLITE_BUSY: database is locked`.
 *
 * This setup points the whole run at a throwaway storage directory and performs
 * the migrations + seeding a single time, so workers only ever see an
 * already-initialized database and never contend for writes at startup.
 */
export default async function setup() {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'haltest-test-'));
    process.env.HALTEST_HOME = path.join(tempRoot, 'haltest-home');
    fs.mkdirSync(process.env.HALTEST_HOME, { recursive: true });

    const { initDb } = await import('./database/init.js');
    await initDb();
}
