import { Server } from 'socket.io';
import { terminalService } from './services/TerminalService.js';

let io;

export const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Adjust this in production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('📡 [Socket.io] Client connected:', socket.id);

        // ──────────────────────────────────────────
        // Interactive Terminal events
        // ──────────────────────────────────────────

        /** Run a new shell command in the session belonging to this socket */
        socket.on('terminal:run-command', ({ command }) => {
            console.log(`[Terminal] Run command from ${socket.id}: ${command}`);
            terminalService.run(socket.id, command);
        });

        /** Send raw stdin to an already running process */
        socket.on('terminal:send-input', ({ input }) => {
            terminalService.sendInput(socket.id, input);
        });

        /** Kill the process for this session */
        socket.on('terminal:kill', () => {
            terminalService.kill(socket.id);
        });

        // ──────────────────────────────────────────
        // Disconnect: cleanup terminal session
        // ──────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log('🔌 [Socket.io] Client disconnected:', socket.id, `(Reason: ${reason})`);
            terminalService.kill(socket.id);
        });
    });

    console.log('🚀 Socket.io server ready and listening on port 2001');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call init(server) first.');
    }
    return io;
};

// ─── Existing emitters ────────────────────────────────────────────────────────

export const emitExecutionStatus = ({
    stepId,
    status,
    error = null,
    result = null,
    runId = null,
    batchId = null,
}) => {
    if (io) {
        console.log(
            `📡 [Socket.io] Emitting execution-status: ${stepId} -> ${status} (runId: ${runId}, batchId: ${batchId})`,
        );
        io.emit('execution-status', { stepId, status, error, result, runId, batchId });
    } else {
        console.warn('⚠️ [Socket.io] Skipping emission: Socket.io server not initialized');
    }
};

export const emitEdgeStatus = ({ edgeId, status }) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting edge-status: ${edgeId} -> ${status}`);
        io.emit('edge-status', { edgeId, status });
    } else {
        console.warn(
            '⚠️ [Socket.io] Skipping emission: Socket.io server not initialized (edge-status)',
        );
    }
};

export const emitElementPicked = (selectorData) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting element_picked`, selectorData);
        io.emit('element_picked', selectorData);
    }
};

export const emitScreenshotReady = ({ nodeId, screenshotPath, runId }) => {
    if (io) {
        console.log(
            `📡 [Socket.io] Emitting step_screenshot_ready: ${nodeId} -> ${screenshotPath}`,
        );
        io.emit('step_screenshot_ready', { nodeId, screenshotPath, runId });
    }
};

export const emitLog = ({
    message,
    type = 'info',
    nodeId = null,
    timestamp = new Date().toISOString(),
}) => {
    if (io) {
        const prefix = nodeId ? `[${nodeId}] ` : '';
        console.log(`📡 [Socket.io] Emitting execution-log: ${prefix}${message}`);
        io.emit('execution-log', { message, type, nodeId, timestamp });
    }
};

export const emitFlowFinished = ({ runId, status, flowId, error = null }) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting flow-finished: ${runId} -> ${status}`);
        io.emit('flow-finished', { runId, status, flowId, error });
    }
};

export const emitVariableChange = ({ name, value, scope, operation }) => {
    if (io) {
        io.emit('variable-change', { name, value, scope, operation, timestamp: Date.now() });
    }
};

// ─── New emitters for Terminal & Codegen ─────────────────────────────────────

/**
 * Sends terminal stdout/stderr output back to a specific socket client.
 * @param {string} sessionId - The socket.id of the target client
 * @param {string} text      - Raw text output
 * @param {'stdout'|'stderr'|'system'|'command'|'error'} streamType
 */
export const emitTerminalOutput = (sessionId, text, streamType = 'stdout') => {
    if (io) {
        io.to(sessionId).emit('terminal:output', {
            text,
            streamType,
            timestamp: new Date().toISOString(),
        });
    }
};

/**
 * Broadcasts a detected codegen action to all clients (for ghost node creation).
 * @param {string} sessionId
 * @param {{ actionType: string, selector: string, value: string|null }} action
 */
export const emitCodegenAction = (sessionId, action) => {
    if (io) {
        console.log(`📡 [Codegen] Detected action: ${action.actionType} → ${action.selector}`);
        io.emit('codegen:action-detected', { ...action, sessionId });
    }
};
/**
 * Notifies the frontend when a node has been auto-healed (via AI or Memory).
 * @param {{ nodeId: string, originalSelector: string, newSelector: string, source: 'memory'|'ai', reasoning: string }} data
 */
export const emitAutoHealingUpdate = (data) => {
    if (io) {
        console.log(`📡 [Socket.io] Emitting auto_healing_update for node: ${data.nodeId}`);
        io.emit('auto_healing_update', { ...data, timestamp: Date.now() });
    }
};

/**
 * Emits progress logs and step index for fine-tuning/training simulation.
 * @param {{ step: string, progress: number, log: string, done?: boolean, modelName?: string }} data
 */
export const emitFineTuningProgress = (data) => {
    if (io) {
        console.log(
            `📡 [Socket.io] Emitting fine_tuning_progress: ${data.step} (${data.progress}%)`,
        );
        io.emit('fine_tuning_progress', { ...data, timestamp: Date.now() });
    }
};

// ─── Performance Testing emitters ────────────────────────────────────────────

/**
 * Emits a live performance metrics snapshot to all connected clients.
 * Throttled to every 2 seconds by MetricsCollector.
 * @param {Object} metricsSnapshot - Output from MetricsCollector.snapshot()
 */
export const emitPerfMetricsUpdate = (metricsSnapshot) => {
    if (io) {
        io.emit('perf-metrics-update', { ...metricsSnapshot, timestamp: Date.now() });
    }
};

/**
 * Emits VU status updates (active count, completed count).
 * @param {{ activeVUs: number, completedVUs: number, totalVUs: number }} data
 */
export const emitPerfVUStatus = (data) => {
    if (io) {
        io.emit('perf-vu-status', { ...data, timestamp: Date.now() });
    }
};

/**
 * Emits the final performance run summary.
 * @param {Object} summary - Output from MetricsCollector.summarize()
 */
export const emitPerfRunFinished = (summary) => {
    if (io) {
        console.log(
            `📡 [Socket.io] Emitting perf-run-finished: ${summary.data?.totalRequests || 0} requests`,
        );
        io.emit('perf-run-finished', { ...summary, timestamp: Date.now() });
    }
};

/**
 * Emits resource warnings when memory pressure is detected during performance runs.
 * @param {{ freeMemoryMB: number, usedPercent: string, health: string }} data
 */
export const emitPerfResourceWarning = (data) => {
    if (io) {
        io.emit('perf-resource-warning', { ...data, timestamp: Date.now() });
    }
};
