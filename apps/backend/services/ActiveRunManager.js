/**
 * ActiveRunManager tracks in-flight runs and their AbortControllers.
 *
 * Key change from the old version: abort() no longer deletes the entry
 * immediately. Instead it marks the controller aborted and leaves the entry
 * in place until the execution service reports completion via `done()`.
 * This keeps the abort signal live long enough for the in-flight handler
 * to observe it (the old version deleted the entry before the guard in
 * ActionExecutor could ever see it).
 *
 * The `done(runId)` call must be invoked exactly once per successful or
 * failed completion, and it is the only place that removes the entry.
 */
class ActiveRunManager {
    constructor() {
        this.runs = new Map(); // runId -> { controller, startTime, aborted, done }
    }

    register(runId) {
        if (!runId) return null;
        const controller = new AbortController();
        this.runs.set(runId, {
            controller,
            startTime: Date.now(),
            aborted: false,
            done: false,
        });
        console.log(`[ActiveRunManager] Registered active run ID: ${runId}`);
        return controller.signal;
    }

    getSignal(runId) {
        if (!runId) return null;
        return this.runs.get(runId)?.controller.signal || null;
    }

    isActive(runId) {
        if (!runId) return false;
        return this.runs.has(runId);
    }

    /**
     * Requests abort for a run. The entry is retained until `done(runId)` is
     * called, so that in-flight handlers can observe the aborted signal.
     *
     * @returns {boolean} true if the run existed and was signalled
     */
    abort(runId) {
        if (!runId) return false;
        const run = this.runs.get(runId);
        if (!run) return false;
        if (run.aborted) return true; // idempotent
        console.log(`[ActiveRunManager] 🛑 Triggering abort for run ID: ${runId}`);
        run.controller.abort();
        run.aborted = true;
        return true;
    }

    /**
     * Called by ExecutionService when a run finishes (success or failure).
     * This is the ONLY place that removes the entry.
     */
    done(runId) {
        if (!runId) return;
        const run = this.runs.get(runId);
        if (run) {
            console.log(`[ActiveRunManager] Done for run ID: ${runId}`);
            this.runs.delete(runId);
        }
    }

    cleanup(runId) {
        // Deprecated: use done() instead. Kept for compatibility with any
        // callers that still use it, but it now behaves the same as done().
        this.done(runId);
    }
}

export const activeRunManager = new ActiveRunManager();
export default activeRunManager;
