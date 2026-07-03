/**
 * MetricsCollector — Real-Time Performance Metrics Aggregator
 *
 * Collects timing samples from individual VU iterations and computes
 * statistical aggregates (avg, median, p95, p99, throughput, error rate).
 *
 * Features:
 * - Record success/error samples with durations
 * - Compute percentile-based latency statistics
 * - Stream live snapshots to the frontend via Socket.io
 * - Generate final summary reports for storage
 */

class MetricsCollector {
    /**
     * @param {string} flowId - The flow being tested
     * @param {Object} [options]
     * @param {number} [options.streamIntervalMs=2000] - Interval for live metric emissions
     */
    constructor(flowId, options = {}) {
        this.flowId = flowId;
        this.streamIntervalMs = options.streamIntervalMs || 2000;

        /** @type {{ timestamp: number, duration: number, status: string, vuId?: number, error?: string }[]} */
        this.samples = [];

        /** @type {{ timestamp: number, activeVUs: number, completedVUs: number }[]} */
        this.vuTimeline = [];

        this.startTime = Date.now();
        this._emitInterval = null;
        this._io = null;

        // Running counters for efficient computation
        this._totalDuration = 0;
        this._successCount = 0;
        this._errorCount = 0;
    }

    /**
     * Records a single iteration result.
     *
     * @param {'success'|'error'} status
     * @param {number} durationMs - Total iteration wall-clock time in ms
     * @param {Error|null} [error]
     * @param {number} [vuId] - Virtual User identifier
     */
    record(status, durationMs, error = null, vuId = undefined) {
        const sample = {
            timestamp: Date.now(),
            duration: durationMs,
            status,
            vuId,
            error: error?.message || null,
        };

        this.samples.push(sample);
        this._totalDuration += durationMs;

        if (status === 'error') {
            this._errorCount++;
        } else {
            this._successCount++;
        }
    }

    /**
     * Records a VU lifecycle event for the timeline.
     *
     * @param {number} activeVUs - Currently active VUs
     * @param {number} completedVUs - VUs that have finished
     */
    recordVUStatus(activeVUs, completedVUs) {
        this.vuTimeline.push({
            timestamp: Date.now(),
            activeVUs,
            completedVUs,
        });
    }

    /**
     * Starts streaming live metric snapshots via Socket.io.
     *
     * @param {import('socket.io').Server} io - Socket.io server instance
     */
    startStreaming(io) {
        this._io = io;
        this._emitInterval = setInterval(() => {
            if (this._io) {
                this._io.emit('perf-metrics-update', this.snapshot());
            }
        }, this.streamIntervalMs);

        console.log(
            `[MetricsCollector] 📊 Started streaming metrics every ${this.streamIntervalMs}ms`,
        );
    }

    /**
     * Stops the live streaming interval.
     */
    stopStreaming() {
        if (this._emitInterval) {
            clearInterval(this._emitInterval);
            this._emitInterval = null;
        }
    }

    /**
     * Computes a point-in-time snapshot of all metrics.
     *
     * @returns {Object} Metrics snapshot
     */
    snapshot() {
        const total = this.samples.length;
        const elapsed = Date.now() - this.startTime;

        if (total === 0) {
            return {
                flowId: this.flowId,
                totalRequests: 0,
                successCount: 0,
                errorCount: 0,
                errorRate: '0.00',
                latency: { avg: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0 },
                throughput: 0,
                elapsed,
                timestamp: Date.now(),
            };
        }

        const durations = this.samples.map((s) => s.duration).sort((a, b) => a - b);

        return {
            flowId: this.flowId,
            totalRequests: total,
            successCount: this._successCount,
            errorCount: this._errorCount,
            errorRate: ((this._errorCount / total) * 100).toFixed(2),
            latency: {
                avg: Math.round(this._totalDuration / total),
                median: this._percentile(durations, 0.5),
                p95: this._percentile(durations, 0.95),
                p99: this._percentile(durations, 0.99),
                min: durations[0],
                max: durations[durations.length - 1],
            },
            throughput: parseFloat((total / (elapsed / 1000)).toFixed(2)),
            elapsed,
            timestamp: Date.now(),
        };
    }

    /**
     * Generates the final summary report. Stops streaming and returns
     * the complete dataset for storage/export.
     *
     * @returns {{ success: boolean, mode: string, data: Object, samples: Object[], vuTimeline: Object[] }}
     */
    summarize() {
        this.stopStreaming();

        const snap = this.snapshot();

        // Emit final results if socket is available
        if (this._io) {
            this._io.emit('perf-run-finished', snap);
        }

        console.log(
            `[MetricsCollector] 📊 Final: ${snap.totalRequests} requests, ` +
                `${snap.latency.avg}ms avg, ${snap.throughput} req/s, ${snap.errorRate}% errors`,
        );

        return {
            success: snap.errorCount === 0 || parseFloat(snap.errorRate) < 50,
            mode: 'performance',
            data: snap,
            samples: this.samples,
            vuTimeline: this.vuTimeline,
        };
    }

    /**
     * Calculates a percentile value from a sorted array.
     *
     * @param {number[]} sortedArr - Pre-sorted numeric array
     * @param {number} p - Percentile (0-1)
     * @returns {number}
     */
    _percentile(sortedArr, p) {
        if (sortedArr.length === 0) return 0;
        const index = Math.ceil(sortedArr.length * p) - 1;
        return sortedArr[Math.max(0, index)];
    }
}

export default MetricsCollector;
export { MetricsCollector };
