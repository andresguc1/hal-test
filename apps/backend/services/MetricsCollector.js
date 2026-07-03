/**
 * MetricsCollector — Real-Time Performance Metrics Aggregator
 *
 * Collects timing samples from individual VU iterations and computes
 * statistical aggregates (avg, median, p95, p99, throughput, error rate).
 * Uses HDR Histogram to prevent memory overflow during high-concurrency load testing.
 *
 * Features:
 * - Record success/error samples with durations in an HDR Histogram
 * - Stream live snapshots to the frontend via Socket.io with throttling
 * - Generate final summary reports for storage
 */

import * as hdr from 'hdr-histogram-js';

class MetricsCollector {
    /**
     * @param {string} flowId - The flow being tested
     * @param {Object} [options]
     * @param {number} [options.streamIntervalMs=2000] - Interval for live metric emissions
     */
    constructor(flowId, options = {}) {
        this.flowId = flowId;
        this.streamIntervalMs = options.streamIntervalMs || 2000;
        this.runConfig = options.runConfig || null;

        // Initialize HDR Histogram (1ms to 1hr range, 2 digits of precision)
        this.histogram = hdr.build({
            lowestDiscernibleValue: 1,
            highestTrackableValue: 3600000,
            numberOfSignificantValueDigits: 2,
        });

        // We only keep the raw samples if explicitly requested to avoid memory bloat,
        // but for compatibility with the final report, we can store a bounded number or
        // just store them all if it's a small test. For now, we'll keep an array
        // but rely on the histogram for calculations.
        this.samples = [];

        this.vuTimeline = [];

        this.startTime = Date.now();
        this._emitInterval = null;
        this._io = null;

        // Running counters
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
        // Record in HDR Histogram
        // Cap the duration to highestTrackableValue to avoid exceptions
        const safeDuration = Math.min(Math.max(1, durationMs), 3600000);
        this.histogram.recordValue(safeDuration);

        // Keep raw sample
        const sample = {
            timestamp: Date.now(),
            duration: durationMs,
            status,
            vuId,
            error: error?.message || null,
        };

        // Push to samples array (in a real extreme load test, you might want to ring-buffer this)
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
     * Computes a point-in-time snapshot of all metrics using the HDR Histogram.
     *
     * @returns {Object} Metrics snapshot
     */
    snapshot() {
        const total = this.histogram.totalCount;
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
                runConfig: this.runConfig,
            };
        }

        return {
            flowId: this.flowId,
            totalRequests: total,
            successCount: this._successCount,
            errorCount: this._errorCount,
            errorRate: ((this._errorCount / total) * 100).toFixed(2),
            latency: {
                avg: Math.round(this.histogram.mean),
                median: this.histogram.getValueAtPercentile(50),
                p95: this.histogram.getValueAtPercentile(95),
                p99: this.histogram.getValueAtPercentile(99),
                min: this.histogram.minNonZeroValue,
                max: this.histogram.maxValue,
            },
            throughput: parseFloat((total / (elapsed / 1000)).toFixed(2)),
            elapsed,
            timestamp: Date.now(),
            runConfig: this.runConfig,
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
}

export default MetricsCollector;
export { MetricsCollector };
