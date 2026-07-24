/**
 * BreakingPointDetector.js
 * Analyzes performance metrics timeline to detect the system Breaking Point (Punto de Ruptura)
 * and capacity knee point during Stress Testing, Stepped Ramp-Up, and Load Testing.
 */

export class BreakingPointDetector {
    /**
     * Evaluates a metrics timeline or snapshot history to identify the exact Breaking Point.
     *
     * @param {Array<Object>} timeline - Array of telemetry snapshots { timestamp, activeVUs, latencyP95, throughput, errorRate, errorCount, totalRequests }
     * @param {Object} options - Threshold criteria { errorRateThreshold: 10, latencyThresholdMs: 2500 }
     * @returns {Object|null} Breaking point details or null if no break occurred
     */
    static detect(timeline = [], options = {}) {
        if (!Array.isArray(timeline) || timeline.length === 0) {
            return null;
        }

        const errorRateThreshold = options.errorRateThreshold || 10.0; // 10% default error rate for break
        const latencyThresholdMs = options.latencyThresholdMs || 3000; // 3000ms default latency for break

        let breakingPoint = null;
        let peakRps = 0;
        let maxVUsReached = 0;

        for (let i = 0; i < timeline.length; i++) {
            const pt = timeline[i];
            const vus = pt.activeVUs || pt.vus || 1;
            const latency = pt.latencyP95 || pt.latency || 0;
            const errorRate = parseFloat(pt.errorRate || 0);
            const throughput = pt.throughput || 0;

            if (vus > maxVUsReached) maxVUsReached = vus;
            if (throughput > peakRps) peakRps = throughput;

            // Check breaking point conditions (high error rate or severe latency spike)
            const isBrokenByErrors = errorRate >= errorRateThreshold;
            const isBrokenByLatency = latency >= latencyThresholdMs;

            if ((isBrokenByErrors || isBrokenByLatency) && !breakingPoint) {
                breakingPoint = {
                    broken: true,
                    vus,
                    timestamp: pt.timestamp || Date.now(),
                    sampleIndex: i,
                    latencyP95: Math.round(latency),
                    throughput: Math.round(throughput * 100) / 100,
                    errorRate: errorRate.toFixed(2),
                    reason: isBrokenByErrors
                        ? `Tasa de error excedió ${errorRateThreshold}% (${errorRate.toFixed(1)}%)`
                        : `Latencia P95 excedió ${latencyThresholdMs}ms (${Math.round(latency)}ms)`,
                    cause: isBrokenByErrors ? 'error_rate' : 'latency_spike',
                };
            }
        }

        if (!breakingPoint) {
            return {
                broken: false,
                maxVUsReached,
                peakRps: Math.round(peakRps * 100) / 100,
                message: `El sistema soportó la prueba de estrés hasta ${maxVUsReached} VUs sin colapsar.`,
            };
        }

        return {
            ...breakingPoint,
            maxVUsReached,
            peakRps: Math.round(peakRps * 100) / 100,
        };
    }
}

export default BreakingPointDetector;
