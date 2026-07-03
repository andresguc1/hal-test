/**
 * WorkerPool — Concurrency-Limited Async Task Scheduler
 *
 * Implements a semaphore-based pool that limits how many async tasks
 * (browser-backed VU iterations) can run simultaneously. This prevents
 * browser process explosion and keeps resource usage within bounds
 * determined by ThrottlePolicy.
 *
 * Usage:
 *   const pool = new WorkerPool(3);  // max 3 concurrent tasks
 *   await pool.run(async () => { ... });
 *   await pool.drain();  // wait for all pending tasks
 */

class WorkerPool {
    /**
     * @param {number} concurrency - Maximum number of tasks that can run simultaneously
     */
    constructor(concurrency = 3) {
        this.concurrency = Math.max(1, concurrency);
        this._running = 0;
        this._queue = [];
        this._results = [];
        this._aborted = false;
    }

    /**
     * Current number of running tasks.
     */
    get activeCount() {
        return this._running;
    }

    /**
     * Number of tasks waiting in queue.
     */
    get pendingCount() {
        return this._queue.length;
    }

    /**
     * Schedules a task for execution. If the pool is at capacity,
     * the task will wait until a slot becomes available.
     *
     * @param {() => Promise<*>} taskFn - Async function to execute
     * @returns {Promise<*>} Resolves when the task completes
     */
    run(taskFn) {
        if (this._aborted) {
            return Promise.reject(new Error('WorkerPool has been aborted'));
        }

        return new Promise((resolve, reject) => {
            const execute = async () => {
                if (this._aborted) {
                    reject(new Error('WorkerPool has been aborted'));
                    return;
                }

                this._running++;
                try {
                    const result = await taskFn();
                    this._results.push({ status: 'fulfilled', value: result });
                    resolve(result);
                } catch (err) {
                    this._results.push({ status: 'rejected', reason: err });
                    reject(err);
                } finally {
                    this._running--;
                    this._dequeue();
                }
            };

            if (this._running < this.concurrency) {
                execute();
            } else {
                this._queue.push(execute);
            }
        });
    }

    /**
     * Runs multiple tasks with controlled concurrency.
     * Unlike Promise.all, this respects the pool's concurrency limit.
     *
     * @param {Array<() => Promise<*>>} taskFns - Array of async task functions
     * @returns {Promise<Array<{ status: string, value?: *, reason?: Error }>>}
     */
    async runAll(taskFns) {
        const settled = await Promise.allSettled(taskFns.map((fn) => this.run(fn)));
        return settled;
    }

    /**
     * Waits until all currently running and queued tasks finish.
     *
     * @param {number} [timeoutMs=0] - Maximum wait time (0 = no limit)
     * @returns {Promise<void>}
     */
    drain(timeoutMs = 0) {
        return new Promise((resolve, reject) => {
            let timer = null;

            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    reject(new Error(`WorkerPool drain timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }

            const check = () => {
                if (this._running === 0 && this._queue.length === 0) {
                    if (timer) clearTimeout(timer);
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };

            check();
        });
    }

    /**
     * Aborts all pending tasks. Running tasks will finish but queued ones are dropped.
     */
    abort() {
        this._aborted = true;
        const dropped = this._queue.length;
        this._queue = [];
        console.log(`[WorkerPool] 🛑 Aborted. Dropped ${dropped} queued tasks.`);
    }

    /**
     * Resets the pool for reuse.
     */
    reset() {
        this._aborted = false;
        this._queue = [];
        this._results = [];
        this._running = 0;
    }

    /**
     * Returns collected results from all completed tasks.
     */
    getResults() {
        return [...this._results];
    }

    /**
     * Dequeues and runs the next waiting task if a slot is available.
     * @private
     */
    _dequeue() {
        if (this._queue.length > 0 && this._running < this.concurrency && !this._aborted) {
            const next = this._queue.shift();
            next();
        }
    }
}

export default WorkerPool;
export { WorkerPool };
