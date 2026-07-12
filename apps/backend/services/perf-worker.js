import { executionService } from './ExecutionService.js';
import '../database/init.js'; // Ensure DB is initialized in child

process.on('message', async (message) => {
    if (message.type === 'execute') {
        const { flowId, projectId, options } = message.payload;
        try {
            // Emits intermediate metrics directly back to the parent WorkerPool
            options.onNodeComplete = (metricPayload) => {
                try {
                    process.send({ type: 'node-metric', payload: metricPayload });
                } catch (e) {
                    // ignore
                }
            };

            // Re-use standard execution pipeline in the child process
            const result = await executionService.executeFlow(flowId, projectId, options);
            process.send({ type: 'success', result });
        } catch (error) {
            process.send({
                type: 'error',
                error: { message: error.message, stack: error.stack },
            });
        }
    }
});

process.on('uncaughtException', (err) => {
    console.error('[PerfWorker] Uncaught Exception:', err);
    // Ignore IPC channel closed errors if parent is dying
    if (err.code !== 'ERR_IPC_CHANNEL_CLOSED') {
        try {
            process.send({ type: 'error', error: { message: err.message } });
        } catch (e) {
            /* ignore */
        }
    }
});

// Self-destruct if parent process dies unexpectedly or closes IPC
process.on('disconnect', () => {
    console.log(`[PerfWorker ${process.pid}] 🔌 Parent disconnected, shutting down worker...`);
    process.exit(0);
});
