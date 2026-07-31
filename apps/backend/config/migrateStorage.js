import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORAGE_DIR } from './paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');

export function migrateStorageIfNecessary() {
    try {
        const oldStorageDir = path.join(BACKEND_ROOT, 'storage');
        const oldDbPath = path.join(BACKEND_ROOT, 'database.sqlite');
        const oldWalPath = path.join(BACKEND_ROOT, 'database.sqlite-wal');
        const oldShmPath = path.join(BACKEND_ROOT, 'database.sqlite-shm');
        const oldBackupsDir = path.join(BACKEND_ROOT, 'backups');

        let migrationOccurred = false;

        // Ensure new storage directory exists
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }

        // Migrate storage directory contents
        if (fs.existsSync(oldStorageDir) && oldStorageDir !== STORAGE_DIR) {
            console.log(
                `[Migration] Migrating old storage from ${oldStorageDir} to ${STORAGE_DIR}`,
            );

            // Move contents of old storage to new STORAGE_DIR
            const entries = fs.readdirSync(oldStorageDir);
            for (const entry of entries) {
                const srcPath = path.join(oldStorageDir, entry);
                const destPath = path.join(STORAGE_DIR, entry);

                // Only move if destination doesn't exist yet
                if (!fs.existsSync(destPath)) {
                    fs.cpSync(srcPath, destPath, { recursive: true });
                    console.log(`[Migration] Moved ${entry} to ${STORAGE_DIR}`);
                }
            }
            migrationOccurred = true;
        }

        // Migrate SQLite database files
        const newDbPath = path.join(STORAGE_DIR, 'database.sqlite');
        if (fs.existsSync(oldDbPath) && !fs.existsSync(newDbPath)) {
            console.log(`[Migration] Migrating database from ${oldDbPath} to ${newDbPath}`);
            fs.copyFileSync(oldDbPath, newDbPath);
            if (fs.existsSync(oldWalPath))
                fs.copyFileSync(oldWalPath, path.join(STORAGE_DIR, 'database.sqlite-wal'));
            if (fs.existsSync(oldShmPath))
                fs.copyFileSync(oldShmPath, path.join(STORAGE_DIR, 'database.sqlite-shm'));
            migrationOccurred = true;
        }

        // Migrate backups directory
        const newBackupsDir = path.join(STORAGE_DIR, 'backups');
        if (fs.existsSync(oldBackupsDir) && !fs.existsSync(newBackupsDir)) {
            fs.cpSync(oldBackupsDir, newBackupsDir, { recursive: true });
            migrationOccurred = true;
        }

        if (migrationOccurred) {
            console.log(`[Migration] ⚠️ Data migration completed successfully.`);
            console.log(`[Migration] Your old data was copied to ${STORAGE_DIR} securely.`);
        }
    } catch (e) {
        console.error(`[Migration] Error during data migration:`, e);
    }
}
