import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { STORAGE_DIR } from '../config/paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let sequelize;

const SQLITE_DB_PATH = path.join(STORAGE_DIR, 'database.sqlite');
const SQLITE_WAL_PATH = SQLITE_DB_PATH + '-wal';
const SQLITE_SHM_PATH = SQLITE_DB_PATH + '-shm';
const BACKUP_DIR = path.join(STORAGE_DIR, 'backups');

function ensureBackupDir() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    } catch (_) {
        /* ignore */
    }
}

function rotateBackups(maxBackups = 5) {
    try {
        ensureBackupDir();
        const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('database.sqlite'));
        if (files.length >= maxBackups) {
            files.sort();
            const toRemove = files.slice(0, files.length - maxBackups + 1);
            toRemove.forEach((f) => {
                try {
                    fs.unlinkSync(path.join(BACKUP_DIR, f));
                } catch (_) {
                    /* ignore */
                }
            });
        }
    } catch (_) {
        /* ignore */
    }
}

function createBackup() {
    try {
        ensureBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `database.sqlite.${timestamp}.bak`);
        if (fs.existsSync(SQLITE_DB_PATH)) {
            fs.copyFileSync(SQLITE_DB_PATH, backupPath);
            console.log(`[Database] Backup created: ${backupPath}`);
        }
    } catch (e) {
        console.warn('[Database] Failed to create backup:', e.message);
    }
}

async function verifyIntegrity(sequelizeInstance) {
    try {
        const [result] = await sequelizeInstance.query('PRAGMA integrity_check;');
        const status = result?.[0]?.['integrity_check'] ?? result?.[0]?.integrity_check;
        if (status === 'ok') {
            return true;
        }
        console.error(`[Database] Integrity check failed: ${status}`);
        return false;
    } catch (e) {
        console.error('[Database] Integrity check error:', e.message);
        return false;
    }
}

async function recoverFromCorruption(sequelizeInstance) {
    console.warn('[Database] Attempting recovery from corruption...');

    try {
        await sequelizeInstance.close().catch(() => {});

        createBackup();
        rotateBackups();

        if (fs.existsSync(SQLITE_WAL_PATH)) {
            try {
                fs.unlinkSync(SQLITE_WAL_PATH);
                console.log('[Database] Removed WAL file');
            } catch (_) {
                /* ignore */
            }
        }
        if (fs.existsSync(SQLITE_SHM_PATH)) {
            try {
                fs.unlinkSync(SQLITE_SHM_PATH);
                console.log('[Database] Removed SHM file');
            } catch (_) {
                /* ignore */
            }
        }

        const corruptedPath = SQLITE_DB_PATH + '.corrupted.' + Date.now();
        if (fs.existsSync(SQLITE_DB_PATH)) {
            try {
                fs.renameSync(SQLITE_DB_PATH, corruptedPath);
                console.log(`[Database] Moved corrupted DB to: ${corruptedPath}`);
            } catch (e) {
                console.warn('[Database] Could not rename corrupted DB:', e.message);
            }
        }

        const newSequelize = new Sequelize({
            dialect: 'sqlite',
            storage: SQLITE_DB_PATH,
            logging: false,
            retry: {
                match: [/SQLITE_BUSY/],
                max: 10,
            },
            pool: {
                max: 5,
                min: 0,
                idle: 10000,
                acquire: 30000,
            },
            dialectOptions: {
                mode: 6,
            },
        });

        await newSequelize.authenticate();
        console.log('[Database] New database connection established after recovery');

        // Update the module-level sequelize so all imports see the new instance
        sequelize = newSequelize;

        return newSequelize;
    } catch (e) {
        console.error('[Database] Recovery failed:', e.message);
        return null;
    }
}

if (isProduction && process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: SQLITE_DB_PATH,
        logging: false,
        retry: {
            match: [/SQLITE_BUSY/],
            max: 10,
        },
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
            acquire: 30000,
        },
        dialectOptions: {
            mode: 6,
        },
    });

    sequelize.beforeConnect(async (config) => {
        config.foreign_keys = true;
    });

    sequelize.afterConnect(async () => {
        try {
            await sequelize.query('PRAGMA journal_mode=WAL;');
            console.log('[Database] SQLite WAL mode enabled');
        } catch (e) {
            console.warn('[Database] WAL mode setup skipped:', e.message);
        }

        try {
            await sequelize.query('PRAGMA busy_timeout=10000;');
            console.log('[Database] SQLite busy_timeout set to 10s');
        } catch (e) {
            console.warn('[Database] busy_timeout setup skipped:', e.message);
        }

        try {
            await sequelize.query('PRAGMA synchronous=NORMAL;');
            console.log('[Database] SQLite synchronous set to NORMAL');
        } catch (e) {
            console.warn('[Database] synchronous setup skipped:', e.message);
        }

        try {
            await sequelize.query('PRAGMA cache_size=-64000;');
            console.log('[Database] SQLite cache size set to 64MB');
        } catch (e) {
            console.warn('[Database] cache_size setup skipped:', e.message);
        }

        const isHealthy = await verifyIntegrity(sequelize);
        if (!isHealthy) {
            console.warn('[Database] Database integrity check failed on startup');
        }
    });
}

sequelize.beforeDefine((model, options) => {
    if (options.timestamps !== false) {
        options.timestamps = true;
    }
});

export { verifyIntegrity, recoverFromCorruption, createBackup, ensureBackupDir, rotateBackups };
export default sequelize;
