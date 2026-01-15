/**
 * StorageCleanupService.js
 * Automatic cleanup of temporary files and old run artifacts
 */

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

// Storage runs directory is handled via paths.js
const TMP_DIR = '/tmp';
const MAX_AGE_HOURS = 24;
const MAX_SIZE_MB = 100;

class StorageCleanupService {
    /**
     * Run all cleanup tasks
     */
    async run() {
        console.log('[StorageCleanup] Starting cleanup...');

        try {
            await this.cleanupPlaywrightTemp();
            await this.cleanupOldRuns();
            await this.enforceMaxSize();
            console.log('[StorageCleanup] Cleanup complete.');
        } catch (err) {
            console.error('[StorageCleanup] Error during cleanup:', err.message);
        }
    }

    /**
     * Clean up Playwright temporary directories in /tmp
     */
    async cleanupPlaywrightTemp() {
        try {
            const files = await fsp.readdir(TMP_DIR);
            const playwrightDirs = files.filter(
                (f) => f.startsWith('playwright_') || f.startsWith('.org.chromium.'),
            );

            for (const dir of playwrightDirs) {
                const fullPath = path.join(TMP_DIR, dir);
                try {
                    await fsp.rm(fullPath, { recursive: true, force: true });
                    console.log(`[StorageCleanup] Removed: ${fullPath}`);
                } catch (e) {
                    // Ignore permission errors for system directories
                }
            }

            if (playwrightDirs.length > 0) {
                console.log(
                    `[StorageCleanup] Cleaned ${playwrightDirs.length} Playwright temp dirs`,
                );
            }
        } catch (err) {
            console.warn('[StorageCleanup] Could not clean /tmp:', err.message);
        }
    }

    /**
     * Remove run folders older than MAX_AGE_HOURS
     */
    async cleanupOldRuns() {
        if (!fs.existsSync(STORAGE_RUNS_DIR)) {
            return;
        }

        const now = Date.now();
        const maxAge = MAX_AGE_HOURS * 60 * 60 * 1000;
        let deletedCount = 0;

        const runs = await fsp.readdir(STORAGE_RUNS_DIR);

        for (const runId of runs) {
            const runPath = path.join(STORAGE_RUNS_DIR, runId);

            try {
                const stats = await fsp.stat(runPath);

                if (stats.isDirectory()) {
                    const age = now - stats.mtimeMs;

                    if (age > maxAge) {
                        await fsp.rm(runPath, { recursive: true, force: true });
                        deletedCount++;
                    }
                }
            } catch (e) {
                // Ignore errors on individual files
            }
        }

        if (deletedCount > 0) {
            console.log(
                `[StorageCleanup] Removed ${deletedCount} runs older than ${MAX_AGE_HOURS}h`,
            );
        }
    }

    /**
     * Enforce maximum storage size by deleting oldest runs first
     */
    async enforceMaxSize() {
        if (!fs.existsSync(STORAGE_RUNS_DIR)) {
            return;
        }

        const maxBytes = MAX_SIZE_MB * 1024 * 1024;

        // Get all run directories with their stats
        const runs = await fsp.readdir(STORAGE_RUNS_DIR);
        const runStats = [];

        for (const runId of runs) {
            const runPath = path.join(STORAGE_RUNS_DIR, runId);

            try {
                const stats = await fsp.stat(runPath);
                if (stats.isDirectory()) {
                    const size = await this.getDirSize(runPath);
                    runStats.push({ runId, path: runPath, mtime: stats.mtimeMs, size });
                }
            } catch (e) {
                // Ignore
            }
        }

        // Calculate total size
        let totalSize = runStats.reduce((sum, r) => sum + r.size, 0);

        if (totalSize <= maxBytes) {
            return;
        }

        // Sort by oldest first
        runStats.sort((a, b) => a.mtime - b.mtime);

        // Delete oldest until under limit
        let deletedCount = 0;
        for (const run of runStats) {
            if (totalSize <= maxBytes) break;

            await fsp.rm(run.path, { recursive: true, force: true });
            totalSize -= run.size;
            deletedCount++;
        }

        if (deletedCount > 0) {
            console.log(
                `[StorageCleanup] Removed ${deletedCount} runs to enforce ${MAX_SIZE_MB}MB limit`,
            );
        }
    }

    /**
     * Calculate directory size recursively
     */
    async getDirSize(dirPath) {
        let size = 0;

        try {
            const files = await fsp.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fsp.stat(filePath);

                if (stats.isFile()) {
                    size += stats.size;
                } else if (stats.isDirectory()) {
                    size += await this.getDirSize(filePath);
                }
            }
        } catch (e) {
            // Ignore errors
        }

        return size;
    }
}

export const storageCleanupService = new StorageCleanupService();
