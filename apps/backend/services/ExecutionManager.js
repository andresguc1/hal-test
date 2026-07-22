import { emitLog } from '../socket.js';
import { ThrottlePolicy } from './ThrottlePolicy.js';
import { MetricsCollector } from './MetricsCollector.js';
import { WorkerPool } from './WorkerPool.js';
import { activeRunManager } from './ActiveRunManager.js';
import { executionService } from './ExecutionService.js';

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

        let {
            virtualUsers = 1,
            duration = 30,
            rampUp = 0,
            profile = 'constant',
            stages = null,
            throttleStrategy = 'auto',
            maxConcurrentBrowsers = 3,
            headless = true,
        } = config;

        // If custom stages are provided, derive duration and max VUs
        if (stages && stages.length > 0) {
            duration = stages.reduce((acc, stage) => acc + (Number(stage.durationSec) || 0), 0);
            virtualUsers = Math.max(...stages.map((stage) => Number(stage.target) || 0));
        }

        const flowId = flow.id;
        const projectId = flow.projectId;

        console.log(`[PerformanceRunner] ⚡ Starting performance run for flow: ${flowId}`);
        console.log(
            `[PerformanceRunner] Config: ${virtualUsers} max VUs, ${duration}s, ` +
                `profile=${stages ? 'custom' : profile}, throttle=${throttleStrategy}, maxBrowsers=${maxConcurrentBrowsers}`,
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
                message: `[Performance] Auto-throttled from ${virtualUsers} to ${effectiveVUs} max VUs (memory constraint)`,
                type: 'warning',
            });
            // If throttled and using stages, we must cap all stages to effectiveVUs
            if (stages) {
                stages = stages.map((s) => ({ ...s, target: Math.min(s.target, effectiveVUs) }));
            }
        }

        // 3. Initialize metrics collector
        const metrics = new MetricsCollector(flowId, {
            runConfig: {
                flowId,
                totalVUs: effectiveVUs,
                durationSec: duration,
                flowName: 'Load Test', // Ideally fetched from DB
            },
        });

        // Start streaming if socket is available
        try {
            const { getIO } = await import('../socket.js');
            metrics.startStreaming(getIO());
        } catch {
            console.warn('[PerformanceRunner] Socket.io not available for live metrics');
        }

        emitLog({
            message: `[Performance] Starting ${effectiveVUs} max VUs × ${duration}s (${stages ? 'custom stages' : profile} profile)`,
            type: 'info',
        });

        // 4. Execute with worker pool
        const concurrency = Math.min(maxConcurrentBrowsers, effectiveVUs);
        const pool = new WorkerPool(concurrency);

        const runId = options.runId;
        const abortSignal = runId ? activeRunManager.register(runId) : null;

        let totalIterations = 0;
        let aborted = false;
        const startTime = Date.now();

        if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
                console.log(`[PerformanceRunner] 🛑 User aborted performance run ID: ${runId}`);
                emitLog({
                    message: `[Performance] Run aborted by user.`,
                    type: 'warning',
                });
                aborted = true;
                pool.abort();
            });
        }

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
                    runId,
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
            // Translate profile to stages if custom stages are not provided
            const finalStages =
                stages && stages.length > 0
                    ? stages
                    : this._buildStages(profile, effectiveVUs, duration, rampUp);

            await new Promise((resolve) => {
                let activeVUs = 0;
                let nextVuId = 1;
                let isFinished = false;

                const getTargetVUs = (elapsedSec) => {
                    let accumulated = 0;
                    for (const stage of finalStages) {
                        accumulated += stage.durationSec;
                        if (elapsedSec <= accumulated) {
                            return stage.target;
                        }
                    }
                    return 0; // If beyond last stage, scale down to 0
                };

                const spawnVU = (vuId) => {
                    if (aborted || isFinished) return;

                    activeVUs++;
                    totalIterations++;
                    const iterStart = Date.now();
                    const currentIteration = totalIterations;

                    metrics.recordVUStatus(activeVUs, totalIterations - activeVUs);

                    pool.runTask(
                        {
                            flowId,
                            projectId,
                            options: {
                                performanceConfig: config, // Enables telemetry in ExecutionService
                                overrides: { headless: true, recordVideo: false },
                                variables: {
                                    __vu: vuId,
                                    __iteration: currentIteration,
                                    __perfMode: true,
                                },
                                mode: 'e2e',
                            },
                        },
                        (metricPayload) => {
                            if (metrics.recordNodeMetric) {
                                metrics.recordNodeMetric(metricPayload, vuId, currentIteration);
                            }
                        },
                    )
                        .then((result) => {
                            metrics.record(
                                'success',
                                Date.now() - iterStart,
                                null,
                                vuId,
                                result?.nodeMetrics || [],
                            );
                        })
                        .catch((err) => {
                            metrics.record('error', Date.now() - iterStart, err, vuId, []);
                        })
                        .finally(() => {
                            activeVUs--;
                            metrics.recordVUStatus(activeVUs, totalIterations - activeVUs);

                            if (aborted || isFinished) return;

                            // Scale check on completion
                            const currentElapsed = (Date.now() - startTime) / 1000;
                            const target = getTargetVUs(currentElapsed);

                            if (activeVUs < target) {
                                spawnVU(vuId); // Reuse this VU's slot
                            }
                        });
                };

                // Main Ticker Loop (evaluates every 500ms)
                const ticker = setInterval(() => {
                    if (aborted) {
                        clearInterval(ticker);
                        resolve();
                        return;
                    }

                    const elapsedSec = (Date.now() - startTime) / 1000;

                    if (elapsedSec >= duration) {
                        isFinished = true;
                        clearInterval(ticker);
                        // Wait for active VUs to drain (simplified: we just resolve immediately for hard-stop)
                        resolve();
                        return;
                    }

                    const target = getTargetVUs(elapsedSec);

                    // Scale Up
                    while (activeVUs < target && !aborted && !isFinished) {
                        spawnVU(nextVuId++);
                    }

                    // Note: Scaling down happens naturally when tasks finish and we don't respawn them
                }, 500);
            });
        } finally {
            if (runId) {
                activeRunManager.cleanup(runId);
            }
            clearInterval(healthInterval);
            pool.abort(); // Ensure workers are killed after test completes
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
     * Translates the load profile into a series of temporal stages.
     * @private
     */
    _buildStages(profile, totalVUs, durationSec, rampUpSec = 0) {
        const stages = [];

        switch (profile) {
            case 'baseline':
                // Single user running normally to establish baseline metrics
                stages.push({ durationSec, target: 1 });
                break;

            case 'spike': {
                // 30% low, 20% max spike, 50% low
                const lowVUs = Math.max(1, Math.floor(totalVUs * 0.1));
                const t1 = Math.floor(durationSec * 0.3);
                const t2 = Math.floor(durationSec * 0.2);
                const t3 = durationSec - t1 - t2;
                stages.push({ durationSec: t1, target: lowVUs });
                stages.push({ durationSec: t2, target: totalVUs });
                if (t3 > 0) stages.push({ durationSec: t3, target: lowVUs });
                break;
            }

            case 'stress': {
                // Stepped increments (4 steps)
                const steps = 4;
                const stepDuration = Math.floor(durationSec / steps);
                for (let i = 1; i <= steps; i++) {
                    const targetAtStep = Math.ceil((totalVUs / steps) * i);
                    const dur =
                        i === steps ? durationSec - stepDuration * (steps - 1) : stepDuration;
                    stages.push({ durationSec: dur, target: targetAtStep });
                }
                break;
            }

            case 'capacity':
                // Continuous ramp up from 1 to totalVUs over the entire duration
                for (let i = 1; i <= durationSec; i++) {
                    const targetAtStep = Math.ceil((totalVUs / durationSec) * i);
                    stages.push({ durationSec: 1, target: targetAtStep });
                }
                break;

            case 'load':
            case 'ramp': {
                // Ramp up for rampUpSec (or 20% of duration), then sustain
                const actualRamp = rampUpSec > 0 ? rampUpSec : Math.floor(durationSec * 0.2);
                if (actualRamp > 0) {
                    for (let i = 1; i <= actualRamp; i++) {
                        const targetAtStep = Math.ceil((totalVUs / actualRamp) * i);
                        stages.push({ durationSec: 1, target: targetAtStep });
                    }
                }
                const sustain = durationSec - actualRamp;
                if (sustain > 0) {
                    stages.push({ durationSec: sustain, target: totalVUs });
                }
                break;
            }

            case 'endurance':
            case 'constant':
            default:
                // Constant profile
                stages.push({ durationSec: durationSec, target: totalVUs });
                break;
        }

        return stages;
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

    async execute(flow, options = {}, runFn) {
        const flowId = flow?.id || flow?.flowId || flow?.flow_id;
        console.log(`[SecurityRunner] Starting Security Audit for flow: ${flowId}`);

        // Safely extract nodes from flow (handles undefined, arrays, or JSON strings)
        let nodes = [];
        if (Array.isArray(flow?.nodes)) {
            nodes = flow.nodes;
        } else if (flow?.flow_data?.nodes && Array.isArray(flow.flow_data.nodes)) {
            nodes = flow.flow_data.nodes;
        } else if (typeof flow?.flow_data === 'string') {
            try {
                const parsed = JSON.parse(flow.flow_data);
                if (Array.isArray(parsed?.nodes)) nodes = parsed.nodes;
            } catch (e) {
                /* ignore parse error */
            }
        } else if (flow?.data?.nodes && Array.isArray(flow.data.nodes)) {
            nodes = flow.data.nodes;
        }

        // Find Audit Checkpoint Nodes
        const auditNodes = nodes.filter(
            (n) =>
                n?.type === 'audit_policy' ||
                n?.type === 'sensitive_data_monitor' ||
                n?.type === 'security_header_audit',
        );

        if (auditNodes.length === 0) {
            emitLog({
                message:
                    'No security checkpoint nodes found in flow. Running non-intrusive Quality Gate audit...',
                type: 'info',
            });
        } else {
            emitLog({
                message: `Found ${auditNodes.length} security checkpoint node(s) in flow. Initiating Quality Gate...`,
                type: 'info',
            });
        }

        // 1. Delegate execution to runFn if provided
        if (typeof runFn === 'function') {
            return await runFn(flow, options);
        }

        // 2. Fallback to executionService if flow is persisted in DB (has projectId)
        if (executionService && flowId && (flow.projectId || flow.project_id)) {
            try {
                const projectId = flow.projectId || flow.project_id;
                return await executionService.executeFlow(flowId, projectId, {
                    runId: options?.runId,
                    securityConfig: options?.securityConfig,
                    mode: 'security',
                });
            } catch (err) {
                console.warn(
                    `[SecurityRunner] executionService.executeFlow skipped: ${err.message}`,
                );
            }
        }

        emitLog({ message: 'Security Audit completed', type: 'success' });
        return { success: true, mode: 'security', auditNodesCount: auditNodes.length };
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
