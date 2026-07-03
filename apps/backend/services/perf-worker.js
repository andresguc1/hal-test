import { executionService } from './ExecutionService.js';
import '../database/init.js'; // Ensure DB is initialized in child

process.on('message', async (message) => {
    if (message.type === 'execute') {
        const { flowId, projectId, options } = message.payload;
        try {
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
    process.send({ type: 'error', error: { message: err.message } });
});
