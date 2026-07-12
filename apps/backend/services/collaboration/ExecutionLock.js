/**
 * ExecutionLock — Prevents concurrent flow executions from conflicting
 * in a multi-user collaborative environment.
 *
 * When multiple users are editing the same flow, only one execution
 * can run at a time. This lock provides:
 *   1. Advisory locking (users see who is running)
 *   2. Automatic expiration (prevents orphaned locks)
 *   3. Integration with Socket.IO for real-time lock status broadcast
 */

/** @type {number} Maximum lock duration in ms before auto-expiry (5 minutes) */
const LOCK_TTL_MS = 5 * 60 * 1000;

class ExecutionLock {
    constructor() {
        /** @type {Map<string, { userId: string, userName: string, runId: string, startedAt: number }>} */
        this.locks = new Map();
    }

    /**
     * Attempt to acquire an execution lock for a flow.
     * @param {string} flowId
     * @param {string} userId
     * @param {string} userName
     * @param {string} runId
     * @returns {{ acquired: boolean, holder?: { userId: string, userName: string, runId: string, startedAt: number } }}
     */
    acquire(flowId, userId, userName, runId) {
        // Check for existing lock
        if (this.locks.has(flowId)) {
            const existing = this.locks.get(flowId);

            // Auto-expire stale locks
            if (Date.now() - existing.startedAt > LOCK_TTL_MS) {
                console.warn(
                    `[ExecutionLock] 🔓 Lock expired for flow "${flowId}" (held by ${existing.userName}). Auto-releasing.`,
                );
                this.locks.delete(flowId);
            } else if (existing.userId === userId) {
                // Same user can re-acquire (idempotent)
                existing.runId = runId;
                existing.startedAt = Date.now();
                return { acquired: true };
            } else {
                // Another user holds the lock
                return { acquired: false, holder: existing };
            }
        }

        // Acquire the lock
        this.locks.set(flowId, {
            userId,
            userName,
            runId,
            startedAt: Date.now(),
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
    release(flowId, userId = null) {
        const existing = this.locks.get(flowId);
        if (!existing) return false;

        if (userId && existing.userId !== userId) {
            console.warn(
                `[ExecutionLock] ⚠️ User "${userId}" attempted to release lock held by "${existing.userId}" on flow "${flowId}". Denied.`,
            );
            return false;
        }

        this.locks.delete(flowId);
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
    releaseAll() {
        const count = this.locks.size;
        this.locks.clear();
        if (count > 0) {
            console.log(`[ExecutionLock] 🔓 Released ${count} execution lock(s) (shutdown).`);
        }
    }
}

// Singleton export
export const executionLock = new ExecutionLock();
