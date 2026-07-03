import { emitLog } from '../socket.js';
import { ThrottlePolicy } from './ThrottlePolicy.js';
import { MetricsCollector } from './MetricsCollector.js';
import { WorkerPool } from './WorkerPool.js';

/**
 * @typedef {Object} RunOptions
 * @property {string} runId
 * @property {Object} overrides
 * @property {Object} headers
 */

/**
 * Base interface for all Specialized Runners
 */
class Runner {
    /**
     * @param {Object} flow
     * @param {RunOptions} options
     */
    async execute(_flow, _options) {
        throw new Error('Method not implemented');
    }
}

/**
 * Current Playwright-based E2E Runner
 */
class E2ERunner extends Runner {
    /**
     * @param {Object} flow
     * @param {RunOptions} options
     * @param {Function} runFn - The function to call for E2E execution (provided by ExecutionService)
     */
    async execute(flow, options, runFn) {
        console.log(`[E2ERunner] Delegating to standard E2E runner for flow: ${flow.id}`);
        return await runFn(flow, options);
    }
}

/**
 * Performance Runner — Load/Stress Testing via Controlled Worker Pools
 *
 * Reuses the existing ExecutionService pipeline (zero graph translation needed).
 * Each Virtual User (VU) runs the flow independently with isolated variable scopes.
 *
 * Supports load profiles:
 * - constant: Fixed number of VUs for the entire duration
 * - ramp:     Gradually increase VUs from 0 to target over rampUp seconds
 * - spike:    Instant burst to full VU count
 *
 * Resource-aware: Uses ThrottlePolicy to prevent process overflow.
 * Metrics-streaming: Emits live stats to frontend via MetricsCollector.
 */
class PerformanceRunner extends Runner {
    async execute(flow, options) {
        const config = options.performanceConfig || {};
        const {
            virtualUsers = 1,
            duration = 30,
            rampUp = 0,
            profile = 'constant',
            throttleStrategy = 'auto',
            maxConcurrentBrowsers = 3,
            headless = true,
        } = config;

        const flowId = flow.id;
        const projectId = flow.projectId;

        console.log(`[PerformanceRunner] ⚡ Starting performance run for flow: ${flowId}`);
        console.log(
            `[PerformanceRunner] Config: ${virtualUsers} VUs, ${duration}s, ` +
                `profile=${profile}, throttle=${throttleStrategy}, maxBrowsers=${maxConcurrentBrowsers}`,
        );

        // 1. Pre-flight: Estimate resource cost
        const estimate = ThrottlePolicy.estimate(virtualUsers, flow, headless);
        console.log(
            `[PerformanceRunner] Resource estimate: ${estimate.ramGB}GB needed, ` +
                `${estimate.freeGB}GB free, safe VUs: ${estimate.safeVUs}`,
        );

        if (estimate.exceeds && throttleStrategy !== 'aggressive') {
            const error = new Error(
                `Estimated ${estimate.ramGB}GB RAM exceeds available ${estimate.freeGB}GB. ` +
                    `Reduce VUs to ${estimate.safeVUs} or set throttle strategy to "aggressive".`,
            );
            error.code = 'RESOURCE_LIMIT';
            error.suggestion = { safeVUs: estimate.safeVUs };
            throw error;
        }

        // 2. Determine effective VU count (auto-throttle may reduce it)
        let effectiveVUs = virtualUsers;
        if (throttleStrategy === 'auto' && estimate.exceeds) {
            effectiveVUs = estimate.safeVUs;
            emitLog({
                message: `[Performance] Auto-throttled from ${virtualUsers} to ${effectiveVUs} VUs (memory constraint)`,
                type: 'warning',
            });
        }

        // 3. Initialize metrics collector
        const metrics = new MetricsCollector(flowId);

        // Start streaming if socket is available
        try {
            const { getIO } = await import('../socket.js');
            metrics.startStreaming(getIO());
        } catch {
            console.warn('[PerformanceRunner] Socket.io not available for live metrics');
        }

        emitLog({
            message: `[Performance] Starting ${effectiveVUs} VUs × ${duration}s (${profile} profile)`,
            type: 'info',
        });

        // 4. Build schedule based on profile
        const schedule = this._buildSchedule(profile, effectiveVUs, duration, rampUp);

        // 5. Execute with worker pool
        const concurrency = Math.min(maxConcurrentBrowsers, effectiveVUs);
        const pool = new WorkerPool(concurrency);

        let totalIterations = 0;
        let aborted = false;
        const startTime = Date.now();

        // Pre-import for use in interval
        let ioRef = null;
        try {
            const { getIO } = await import('../socket.js');
            ioRef = getIO();
        } catch {
            // Socket not available
        }

        if (ioRef) {
            try {
                // Emit initial configuration so UI doesn't look stuck
                ioRef.emit('perf-run-started', {
                    flowId,
                    totalVUs: effectiveVUs,
                    durationSec: duration,
                    flowName: 'Load Test', // Could fetch actual flow name if passed
                });
            } catch {
                // Ignore
            }
        }

        // Health check interval (dynamic throttling during execution)
        const healthInterval = setInterval(() => {
            const health = ThrottlePolicy.checkHealth();
            if (health.action === 'abort') {
                console.error(
                    `[PerformanceRunner] 🛑 CRITICAL: Free memory at ${health.freePercent}%. Aborting.`,
                );
                emitLog({
                    message: `[Performance] CRITICAL: System memory at ${health.freePercent}% free. Aborting run.`,
                    type: 'error',
                });
                aborted = true;
                pool.abort();
            } else if (health.action === 'throttle') {
                emitLog({
                    message: `[Performance] WARNING: Memory pressure detected (${health.freePercent}% free)`,
                    type: 'warning',
                });
            }

            // Also emit resource snapshot
            if (ioRef) {
                try {
                    ioRef.emit('perf-resource-warning', {
                        ...ThrottlePolicy.snapshot(),
                        health: health.action,
                    });
                } catch {
                    // Socket emission failed
                }
            }
        }, 5000);

        try {
            for (const phase of schedule) {
                if (aborted) break;

                const elapsedSec = (Date.now() - startTime) / 1000;
                if (elapsedSec >= duration) break;

                const vuTasks = Array.from({ length: phase.vus }, (_, vuIndex) => {
                    return async () => {
                        if (aborted) return;

                        const iterStart = Date.now();
                        totalIterations++;
                        const vuId = vuIndex + 1;

                        metrics.recordVUStatus(
                            pool.activeCount + 1,
                            totalIterations - pool.activeCount,
                        );

                        try {
                            await pool.runTask({
                                flowId,
                                projectId,
                                options: {
                                    overrides: { headless: true, recordVideo: false },
                                    variables: {
                                        __vu: vuId,
                                        __iteration: totalIterations,
                                        __perfMode: true,
                                    },
                                    mode: 'e2e', // Run through standard E2E pipeline inside child
                                },
                            });
                            metrics.record('success', Date.now() - iterStart, null, vuId);
                        } catch (err) {
                            metrics.record('error', Date.now() - iterStart, err, vuId);
                        }
                    };
                });

                // Run this phase's VUs through the worker pool
                await Promise.allSettled(vuTasks.map((fn) => fn()));

                // Delay between phases (for ramp profile)
                if (phase.delayMs > 0 && !aborted) {
                    await new Promise((r) => setTimeout(r, phase.delayMs));
                }
            }
        } finally {
            clearInterval(healthInterval);
        }

        // 6. Generate summary
        const summary = metrics.summarize();

        emitLog({
            message:
                `[Performance] Completed: ${summary.data.totalRequests} requests, ` +
                `${summary.data.latency.avg}ms avg, ${summary.data.throughput} req/s, ` +
                `${summary.data.errorRate}% errors`,
            type: summary.success ? 'success' : 'warning',
        });

        return summary;
    }

    /**
     * Builds a VU schedule based on the load profile.
     *
     * @param {'constant'|'ramp'|'spike'} profile
     * @param {number} totalVUs
     * @param {number} durationSec
     * @param {number} rampUpSec
     * @returns {Array<{ vus: number, delayMs: number }>}
     * @private
     */
    _buildSchedule(profile, totalVUs, durationSec, rampUpSec) {
        const phases = [];

        if (profile === 'spike') {
            // Single burst: all VUs at once, then repeat for duration
            const iterations = Math.max(1, Math.ceil(durationSec / 5)); // ~5s per iteration batch
            for (let i = 0; i < iterations; i++) {
                phases.push({ vus: totalVUs, delayMs: 0 });
            }
        } else if (profile === 'ramp' && rampUpSec > 0) {
            // Gradually increase VUs
            const steps = Math.min(totalVUs, Math.ceil(rampUpSec / 2));
            const vusPerStep = totalVUs / steps;
            const delayPerStep = (rampUpSec * 1000) / steps;

            for (let i = 1; i <= steps; i++) {
                const currentVUs = Math.ceil(vusPerStep * i);
                phases.push({ vus: Math.min(currentVUs, totalVUs), delayMs: delayPerStep });
            }

            // Sustain phase after ramp-up
            const sustainSec = durationSec - rampUpSec;
            if (sustainSec > 0) {
                const sustainIterations = Math.max(1, Math.ceil(sustainSec / 5));
                for (let i = 0; i < sustainIterations; i++) {
                    phases.push({ vus: totalVUs, delayMs: 0 });
                }
            }
        } else {
            // Constant: steady VU count throughout
            const iterations = Math.max(1, Math.ceil(durationSec / 5));
            for (let i = 0; i < iterations; i++) {
                phases.push({ vus: totalVUs, delayMs: 0 });
            }
        }

        return phases;
    }
}

/**
 * DAST/Audit-based Security Runner
 */
class SecurityRunner extends Runner {
    constructor() {
        super();
        this.actions = null;
    }

    async execute(flow, _options) {
        console.log(`[SecurityRunner] Starting Security Audit for flow: ${flow.id}`);

        // Find Audit Nodes
        const auditNodes = flow.nodes.filter((n) => n.type === 'security_header_audit');

        if (auditNodes.length === 0) {
            emitLog({
                message: 'No security audit nodes found in flow. Running global ZAP spider...',
                type: 'info',
            });
            // Here we would call ZAP API
        }

        emitLog({ message: 'Security Audit completed (Mock)', type: 'success' });
        return { success: true, mode: 'security' };
    }
}

class ExecutionManager {
    constructor() {
        this.runners = {
            e2e: new E2ERunner(),
            performance: new PerformanceRunner(),
            security: new SecurityRunner(),
        };
    }

    /**
     * Executes a flow in the specified mode
     * @param {string} mode - 'e2e' | 'performance' | 'security'
     * @param {Object} flow
     * @param {RunOptions} options
     * @param {Function} [e2eRunFn] - Callback for E2E execution
     */
    async execute(mode, flow, options, e2eRunFn) {
        const runner = this.runners[mode || 'e2e'];

        if (!runner) {
            throw new Error(`Execution mode "${mode}" is not supported.`);
        }

        emitLog({ message: `HalTest: Switching to ${mode.toUpperCase()} Runner...`, type: 'info' });

        try {
            return await runner.execute(flow, options, e2eRunFn);
        } catch (error) {
            emitLog({ message: `Runner Error (${mode}): ${error.message}`, type: 'error' });
            throw error;
        }
    }

    /**
     * Pre-flight resource estimation for the UI.
     * Returns cost estimate without starting execution.
     *
     * @param {Object} performanceConfig
     * @returns {Object} ThrottlePolicy estimate
     */
    estimateResources(performanceConfig) {
        return ThrottlePolicy.estimate(
            performanceConfig.virtualUsers || 1,
            null,
            performanceConfig.headless !== false,
        );
    }
}

export const executionManager = new ExecutionManager();
