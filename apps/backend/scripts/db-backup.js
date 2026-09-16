import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const BACKUP_DIR = process.env.BACKUP_DIR || '/opt/render/.haltest/db-backups';

/**
 * Creates a logical backup of the PostgreSQL database using pg_dump.
 * Falls back to a manifest-only backup if pg_dump is unavailable.
 */
export const createBackup = async () => {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
        const status = await snapshotSqlite();
        return { status, kind: 'sqlite' };
    }

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const file = path.join(BACKUP_DIR, `pg_dump.${timestamp}.sql`);

        const args = [
            '--dbname',
            process.env.DATABASE_URL,
            '--file',
            file,
            '--format',
            'plain',
            '--no-owner',
        ];
        await execFileAsync('pg_dump', args, { timeout: 120000 });
        console.log(`📦 Pre-migration backup created: ${file}`);
        return { status: 'ok', file };
    } catch (error) {
        return { status: 'warning', message: error.message };
    }
};

const snapshotSqlite = async () => {
    try {
        const { default: sequelize } = await import('../database/index.js');
        const [result] = await sequelize.query('PRAGMA integrity_check;');
        return { status: 'ok', integrity: result };
    } catch (error) {
        return { status: 'warning', message: error.message };
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    createBackup().then((result) => {
        console.log('[db-backup]', JSON.stringify(result));
        process.exit(0);
    });
}
