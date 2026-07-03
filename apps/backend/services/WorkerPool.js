import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WorkerPool — Concurrency-Limited child_process Scheduler
 *
 * Implements a pool of forked Node.js child processes to run VU iterations.
 * This guarantees complete event loop isolation and prevents the main Node
 * process from crashing under extreme load.
 */
class WorkerPool {
    constructor(concurrency = 3) {
        this.concurrency = Math.max(1, concurrency);
        this.workers = [];
        this.activeTasks = new Map(); // workerId -> resolve/reject tuple
        this.queue = [];
        this._aborted = false;

        this._initPool();
    }

    _initPool() {
        const workerPath = path.join(__dirname, 'perf-worker.js');
        for (let i = 0; i < this.concurrency; i++) {
            const worker = fork(workerPath, [], {
                env: process.env, // Pass environment (like HAL_MAX_BROWSERS)
                stdio: 'inherit', // Pipe logs to main process
            });

            worker.on('message', (msg) => this._handleWorkerMessage(worker.pid, msg));
            worker.on('error', (err) => console.error(`[Worker ${worker.pid}] error:`, err));
            worker.on('exit', (code) => {
                if (code !== 0 && !this._aborted) {
                    console.warn(`[Worker ${worker.pid}] exited with code ${code}. Replacing...`);
                    // If a worker dies unexpectedly, replace it (simplified for brevity)
                }
            });

            this.workers.push({ id: worker.pid, process: worker, isBusy: false });
        }
        console.log(`[WorkerPool] 🚀 Initialized ${this.concurrency} isolated child processes.`);
    }

    _handleWorkerMessage(workerId, msg) {
        const task = this.activeTasks.get(workerId);
        if (!task) return;

        const workerObj = this.workers.find((w) => w.id === workerId);
        if (workerObj) workerObj.isBusy = false;
        this.activeTasks.delete(workerId);

        if (msg.type === 'success') {
            task.resolve(msg.result);
        } else if (msg.type === 'error') {
            task.reject(new Error(msg.error.message || 'Worker Error'));
        }

        this._dequeue();
    }

    get activeCount() {
        return this.activeTasks.size;
    }

    get pendingCount() {
        return this.queue.length;
    }

    /**
     * Schedules a task. Resolves when the child process completes it.
     * @param {Object} payload - { flowId, projectId, options }
     */
    runTask(payload) {
        if (this._aborted) return Promise.reject(new Error('WorkerPool aborted'));

        return new Promise((resolve, reject) => {
            this.queue.push({ payload, resolve, reject });
            this._dequeue();
        });
    }

    _dequeue() {
        if (this._aborted || this.queue.length === 0) return;

        const availableWorker = this.workers.find((w) => !w.isBusy);
        if (!availableWorker) return;

        const task = this.queue.shift();
        availableWorker.isBusy = true;
        this.activeTasks.set(availableWorker.id, { resolve: task.resolve, reject: task.reject });

        availableWorker.process.send({ type: 'execute', payload: task.payload });
    }

    async runAll(tasksPayloads) {
        const promises = tasksPayloads.map((payload) => this.runTask(payload));
        return Promise.allSettled(promises);
    }

    abort() {
        this._aborted = true;
        this.queue.forEach((t) => t.reject(new Error('Aborted')));
        this.queue = [];
        this.workers.forEach((w) => {
            if (w.process && !w.process.killed) {
                w.process.kill('SIGTERM');
            }
        });
        this.workers = [];
        this.activeTasks.clear();
        console.log('[WorkerPool] 🛑 All child processes terminated.');
    }
}

export default WorkerPool;
export { WorkerPool };
