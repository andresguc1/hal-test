import fs from 'fs';
import path from 'path';

// Configuration: Retention Period (Days)
const RETENTION_DAYS = 3;
const STORAGE_RUNS_DIR = process.env.STORAGE_RUNS_DIR || 'storage/runs';

class RetentionService {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Starts the daily cleanup job.
     * Can be called on server startup.
     */
    startDailyCleanup() {
        console.log('[RetentionService] Initializing retention policy...');

        // Run immediately on startup
        this.cleanOldArtifacts();

        // Then run every 24 hours
        setInterval(
            () => {
                this.cleanOldArtifacts();
            },
            24 * 60 * 60 * 1000,
        );
    }

    async cleanOldArtifacts() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[RetentionService] Starting cleanup of old artifacts...');

        try {
            if (!fs.existsSync(STORAGE_RUNS_DIR)) {
                console.log('[RetentionService] Storage directory does not exist. Skipping.');
                this.isRunning = false;
                return;
            }

            const runFolders = await fs.promises.readdir(STORAGE_RUNS_DIR);
            let cleanedCount = 0;
            // Removed unused spaceFreed

            for (const folder of runFolders) {
                const folderPath = path.join(STORAGE_RUNS_DIR, folder);
                const stats = await fs.promises.stat(folderPath);

                // Check if folder is older than RETENTION_DAYS
                // Using mtime (modification time)
                const folderAgeDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (folderAgeDays > RETENTION_DAYS) {
                    // It's old. Verify if we should delete it.
                    // If it matches a Run ID, we delete the artifacts but KEEP the DB record.

                    console.log(
                        `[RetentionService] Cleaning artifacts for run/folder: ${folder} (${folderAgeDays.toFixed(1)} days old)`,
                    );

                    await fs.promises.rm(folderPath, { recursive: true, force: true });
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                console.log(
                    `[RetentionService] Cleanup complete. Removed artifacts for ${cleanedCount} runs.`,
                );
            } else {
                console.log('[RetentionService] No old artifacts found to clean.');
            }
        } catch (error) {
            console.error('[RetentionService] Cleanup failed:', error);
        } finally {
            this.isRunning = false;
        }
    }
}

export const retentionService = new RetentionService();
