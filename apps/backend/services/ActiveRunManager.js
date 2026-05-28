class ActiveRunManager {
    constructor() {
        this.runs = new Map(); // runId -> { controller, startTime }
    }

    register(runId) {
        if (!runId) return null;
        const controller = new AbortController();
        this.runs.set(runId, {
            controller,
            startTime: Date.now(),
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

    abort(runId) {
        if (!runId) return false;
        const run = this.runs.get(runId);
        if (run) {
            console.log(`[ActiveRunManager] 🛑 Triggering abort for run ID: ${runId}`);
            run.controller.abort();
            this.runs.delete(runId);
            return true;
        }
        return false;
    }

    cleanup(runId) {
        if (!runId) return;
        if (this.runs.has(runId)) {
            console.log(`[ActiveRunManager] Cleaning up registry for run ID: ${runId}`);
            this.runs.delete(runId);
        }
    }
}

export const activeRunManager = new ActiveRunManager();
export default activeRunManager;
