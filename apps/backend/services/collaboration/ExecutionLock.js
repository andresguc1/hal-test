/**
 * ExecutionLock — Prevents concurrent flow executions from conflicting
 * in a multi-user collaborative environment.
 *
 * When multiple users are editing the same flow, only one execution
 * can run at a time. This lock provides:
 *   1. Advisory locking (users see who is running)
 *   2. Automatic expiration (prevents orphaned locks)
 *   3. Integration with Socket.IO for real-time lock status broadcast
 *   4. SQLite persistence — locks survive server restarts
 *
 * Architecture:
 *   - In-memory Map: fast-path for acquire/check/release (no DB round-trip)
 *   - SQLite table (execution_locks): durability layer — loaded on startup,
 *     written on acquire/release so restarts don't leave ghost locks
 */

import ExecutionLockModel from '../../database/models/ExecutionLockModel.js';

/** @type {number} Maximum lock duration in ms before auto-expiry (5 minutes) */
const LOCK_TTL_MS = 5 * 60 * 1000;

class ExecutionLock {
    constructor() {
        /** @type {Map<string, { userId: string, userName: string, runId: string, startedAt: number }>} */
        this.locks = new Map();

        /** @type {boolean} Whether the DB layer has been loaded */
        this._dbLoaded = false;
    }

    /**
     * Load non-expired locks from SQLite into the in-memory Map.
     * Call once at server startup to survive restarts.
     */
    async loadFromDB() {
        try {
            const now = Date.now();
            const rows = await ExecutionLockModel.findAll({
                where: {},
                raw: true,
            });

            let loaded = 0;
            for (const row of rows) {
                if (Number(row.expiresAt) > now) {
                    this.locks.set(row.flowId, {
                        userId: row.userId,
                        userName: row.userName,
                        runId: row.runId,
                        startedAt: Number(row.startedAt),
                    });
                    loaded++;
                } else {
                    // Expired — clean up from DB silently
                    await ExecutionLockModel.destroy({ where: { flowId: row.flowId } }).catch(
                        () => {},
                    );
                }
            }

            this._dbLoaded = true;
            if (loaded > 0) {
                console.log(
                    `[ExecutionLock] 📂 Recovered ${loaded} active lock(s) from SQLite after restart.`,
                );
            }
        } catch (err) {
            // DB not ready yet (e.g. table not created) — non-fatal, in-memory only
            console.warn(
                '[ExecutionLock] ⚠️ Could not load locks from DB (non-fatal):',
                err.message,
            );
        }
    }

    /**
     * Attempt to acquire an execution lock for a flow.
     * @param {string} flowId
     * @param {string} userId
     * @param {string} userName
     * @param {string} runId
     * @returns {{ acquired: boolean, holder?: { userId: string, userName: string, runId: string, startedAt: number } }}
     */
    async acquire(flowId, userId, userName, runId) {
        // Check for existing lock in memory
        if (this.locks.has(flowId)) {
            const existing = this.locks.get(flowId);

            // Auto-expire stale locks
            if (Date.now() - existing.startedAt > LOCK_TTL_MS) {
                console.warn(
                    `[ExecutionLock] 🔓 Lock expired for flow "${flowId}" (held by ${existing.userName}). Auto-releasing.`,
                );
                this.locks.delete(flowId);
                await ExecutionLockModel.destroy({ where: { flowId } }).catch(() => {});
            } else if (existing.userId === userId) {
                // Same user can re-acquire (idempotent)
                existing.runId = runId;
                existing.startedAt = Date.now();
                await this._persistLock(flowId, existing).catch(() => {});
                return { acquired: true };
            } else {
                // Another user holds the lock — advisory rejection
                return { acquired: false, holder: existing };
            }
        }

        // Acquire the lock in memory
        const lockData = { userId, userName, runId, startedAt: Date.now() };
        this.locks.set(flowId, lockData);

        // Persist to SQLite (fire-and-forget — memory is authoritative)
        await this._persistLock(flowId, lockData).catch((err) => {
            console.warn(
                `[ExecutionLock] ⚠️ Could not persist lock to DB for flow "${flowId}":`,
                err.message,
            );
        });

        console.log(
            `[ExecutionLock] 🔒 Lock acquired: flow="${flowId}" by "${userName}" (run: ${runId})`,
        );
        return { acquired: true };
    }

    /**
     * Release the execution lock for a flow.
     * @param {string} flowId
     * @param {string} [userId] - If provided, only releases if this user holds the lock
     * @returns {boolean} Whether the lock was released
     */
    async release(flowId, userId = null) {
        const existing = this.locks.get(flowId);
        if (!existing) return false;

        if (userId && existing.userId !== userId) {
            console.warn(
                `[ExecutionLock] ⚠️ User "${userId}" attempted to release lock held by "${existing.userId}" on flow "${flowId}". Denied.`,
            );
            return false;
        }

        this.locks.delete(flowId);

        // Remove from SQLite (fire-and-forget)
        await ExecutionLockModel.destroy({ where: { flowId } }).catch((err) => {
            console.warn(
                `[ExecutionLock] ⚠️ Could not remove lock from DB for flow "${flowId}":`,
                err.message,
            );
        });

        console.log(`[ExecutionLock] 🔓 Lock released: flow="${flowId}"`);
        return true;
    }

    /**
     * Check if a flow is currently locked.
     * @param {string} flowId
     * @returns {{ locked: boolean, holder?: Object }}
     */
    check(flowId) {
        const existing = this.locks.get(flowId);
        if (!existing) return { locked: false };

        // Auto-expire stale locks
        if (Date.now() - existing.startedAt > LOCK_TTL_MS) {
            this.locks.delete(flowId);
            ExecutionLockModel.destroy({ where: { flowId } }).catch(() => {});
            return { locked: false };
        }

        return { locked: true, holder: existing };
    }

    /**
     * Get all active locks (for admin/debug purposes).
     * @returns {Object[]}
     */
    getAll() {
        const result = [];
        const now = Date.now();

        this.locks.forEach((lock, flowId) => {
            // Clean expired locks while iterating
            if (now - lock.startedAt > LOCK_TTL_MS) {
                this.locks.delete(flowId);
                ExecutionLockModel.destroy({ where: { flowId } }).catch(() => {});
                return;
            }
            result.push({
                flowId,
                ...lock,
                elapsed: now - lock.startedAt,
            });
        });

        return result;
    }

    /**
     * Force-release all locks (for graceful shutdown).
     */
    async releaseAll() {
        const count = this.locks.size;
        this.locks.clear();

        // Clean SQLite table on graceful shutdown
        await ExecutionLockModel.destroy({ where: {}, truncate: true }).catch(() => {});

        if (count > 0) {
            console.log(`[ExecutionLock] 🔓 Released ${count} execution lock(s) (shutdown).`);
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    async _persistLock(flowId, lockData) {
        await ExecutionLockModel.upsert({
            flowId,
            userId: lockData.userId,
            userName: lockData.userName,
            runId: lockData.runId,
            startedAt: lockData.startedAt,
            expiresAt: lockData.startedAt + LOCK_TTL_MS,
        });
    }
}

// Singleton export
export const executionLock = new ExecutionLock();
