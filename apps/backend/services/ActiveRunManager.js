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
 *
 * Abort-and-reset semantics:
 *   The engine's real execution state (executedNodeIds, activatedNodeIds,
 *   pendingNodePointer) lives in the `runState` object owned by
 *   ExecutionService.executeFlow — NOT here. To let a forced stop clear that
 *   state atomically, ExecutionService registers a `resetCallback` alongside
 *   its AbortSignal. `abortAndReset(runId)` then aborts the controller AND
 *   invokes the callback, so both the pending dispatch and the engine pointers
 *   are cleared in a single, ordered operation.
 */
class ActiveRunManager {
    constructor() {
        this.runs = new Map(); // runId -> { controller, startTime, aborted, done, resetCallback }
        // Aborts requested before register() ran (cancel-before-register race).
        this.pendingAborts = new Set(); // runId
    }

    /**
     * Registers a run and returns its AbortSignal.
     *
     * @param {string} runId
     * @param {Function} [resetCallback] Optional callback invoked on
     *   `abortAndReset`. It receives no arguments and must be idempotent; it
     *   is responsible for clearing the engine's own execution state.
     * @returns {AbortSignal|null}
     */
    register(runId, resetCallback = null) {
        if (!runId) return null;
        const controller = new AbortController();
        // Honour an abort that was requested while this run was not yet
        // registered: abort immediately so the run never starts.
        const wasPendingAbort = this.pendingAborts.has(runId);
        if (wasPendingAbort) this.pendingAborts.delete(runId);

        this.runs.set(runId, {
            controller,
            startTime: Date.now(),
            aborted: wasPendingAbort,
            done: false,
            resetCallback: typeof resetCallback === 'function' ? resetCallback : null,
        });

        if (wasPendingAbort) {
            controller.abort();
            console.log(
                `[ActiveRunManager] Registered run ${runId} already aborted (pending abort honoured)`,
            );
            // A cancel landed before this run existed: honour it fully by
            // running the reset callback now, so the engine state the run is
            // about to create is cleared instead of lingering.
            const registered = this.runs.get(runId);
            if (registered && typeof registered.resetCallback === 'function') {
                try {
                    registered.resetCallback();
                } catch (err) {
                    console.warn(
                        `[ActiveRunManager] resetCallback failed for run ${runId}:`,
                        err?.message || err,
                    );
                }
                registered.resetCallback = null;
            }
        } else {
            console.log(`[ActiveRunManager] Registered active run ID: ${runId}`);
        }
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

    isAborted(runId) {
        if (!runId) return false;
        return this.runs.get(runId)?.aborted === true;
    }

    /**
     * Registers (or replaces) the reset callback for an already-registered run.
     * Lets ExecutionService attach the callback once `runState` exists, even if
     * `register()` was called earlier.
     *
     * @returns {boolean} true if the run existed and the callback was stored
     */
    setResetCallback(runId, resetCallback) {
        if (!runId) return false;
        const run = this.runs.get(runId);
        if (!run) return false;
        run.resetCallback = typeof resetCallback === 'function' ? resetCallback : null;
        return true;
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
        if (!run) {
            // Not registered yet — remember it so register() aborts immediately.
            this.pendingAborts.add(runId);
            return false;
        }
        if (run.aborted) return true; // idempotent
        console.log(`[ActiveRunManager] 🛑 Triggering abort for run ID: ${runId}`);
        run.controller.abort();
        run.aborted = true;
        return true;
    }

    /**
     * Aborts the run AND clears the engine's in-memory execution state via the
     * registered reset callback. This is the method to call for abrupt
     * user-initiated stops.
     *
     * It:
     * 1. Triggers the AbortController so in-flight handlers see the cancellation
     * 2. Invokes the engine's resetCallback (clears executedNodeIds,
     *    activatedNodeIds, pendingNodePointer) so the next run starts clean
     * 3. Marks the run as aborted (retained until `done()` is called)
     *
     * @param {string} runId
     * @returns {boolean} true if the run existed and was aborted
     */
    abortAndReset(runId) {
        if (!runId) return false;
        const run = this.runs.get(runId);
        if (!run) {
            // Not registered yet — remember it so register() aborts immediately.
            this.pendingAborts.add(runId);
            return false;
        }

        if (!run.aborted) {
            console.log(`[ActiveRunManager] 🛑🔄 Abort-and-reset for run ID: ${runId}`);
            run.controller.abort();
            run.aborted = true;
        }

        // Always run the reset callback (guarded & idempotent) so repeated
        // cancels are safe and a late callback registration is still honoured.
        if (typeof run.resetCallback === 'function') {
            try {
                run.resetCallback();
            } catch (err) {
                console.warn(
                    `[ActiveRunManager] resetCallback failed for run ${runId}:`,
                    err?.message || err,
                );
            }
            run.resetCallback = null;
        }

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
            run.resetCallback = null;
            this.runs.delete(runId);
        }
        this.pendingAborts.delete(runId);
    }

    cleanup(runId) {
        // Deprecated: use done() instead. Kept for compatibility with any
        // callers that still use it, but it now behaves the same as done().
        this.done(runId);
    }
}

export const activeRunManager = new ActiveRunManager();
export default activeRunManager;
