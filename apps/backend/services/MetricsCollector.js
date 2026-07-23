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
import { SlaEvaluator } from './SlaEvaluator.js';

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

        // HTTP Status Codes Distribution
        this.httpStatusCounts = {
            '200': 0,
            '201': 0,
            '302': 0,
            '400': 0,
            '401': 0,
            '403': 0,
            '404': 0,
            '429': 0,
            '500': 0,
            '502': 0,
            '503': 0,
            '504': 0,
        };

        this.samples = [];

        this.vuTimeline = [];
        this.nodeHistograms = new Map();
        this.nodeLabels = new Map();

        this.nodeCpuAccumulators = new Map();
        this.nodeMemAccumulators = new Map();
        this.nodeErrors = new Map();
        this.nodeSubflowIds = new Map();

        this.startTime = Date.now();
        this._emitInterval = null;
        this._io = null;

        // Running counters
        this._totalDuration = 0;
        this._successCount = 0;
        this._errorCount = 0;
    }

    /**
     * Record live performance metric from a node execution
     */
    recordNodeMetric(payload, _vuId, _iteration) {
        const { nodeId, label, durationMs, cpuPercent, memUsedMB, success, subflowId } = payload;

        if (subflowId) {
            this.nodeSubflowIds.set(nodeId, subflowId);
        }

        if (!this.nodeHistograms.has(nodeId)) {
            this.nodeHistograms.set(
                nodeId,
                hdr.build({
                    lowestDiscernibleValue: 1,
                    highestTrackableValue: 3600000,
                    numberOfSignificantValueDigits: 2,
                }),
            );
            this.nodeLabels.set(nodeId, label || nodeId);
            this.nodeCpuAccumulators.set(nodeId, { sum: 0, count: 0 });
            this.nodeMemAccumulators.set(nodeId, { sum: 0, count: 0, max: 0 });
            this.nodeErrors.set(nodeId, 0);
        }

        const safeNodeDuration = Math.min(Math.max(1, durationMs), 3600000);
        this.nodeHistograms.get(nodeId).recordValue(safeNodeDuration);

        const cpuObj = this.nodeCpuAccumulators.get(nodeId);
        cpuObj.sum += cpuPercent || 0;
        cpuObj.count++;

        const memObj = this.nodeMemAccumulators.get(nodeId);
        memObj.sum += memUsedMB || 0;
        memObj.count++;
        memObj.max = Math.max(memObj.max, memUsedMB || 0);

        if (!success) {
            this.nodeErrors.set(nodeId, this.nodeErrors.get(nodeId) + 1);
        }
    }

    /**
     * Records a single iteration result.
     *
     * @param {'success'|'error'} status
     * @param {number} durationMs - Total iteration wall-clock time in ms
     * @param {Error|null} [error]
     * @param {number} [vuId] - Virtual User identifier
     * @param {Array} [nodeMetrics=[]] - Legacy array of node execution durations
     */
    record(status, durationMs, error = null, vuId = undefined, nodeMetrics = []) {
        // Record in HDR Histogram
        // Cap the duration to highestTrackableValue to avoid exceptions
        const safeDuration = Math.min(Math.max(1, durationMs), 3600000);
        this.histogram.recordValue(safeDuration);

        // Process Node Level Metrics (Legacy support if passed here)
        if (nodeMetrics && nodeMetrics.length > 0) {
            for (const metric of nodeMetrics) {
                this.recordNodeMetric(metric, vuId, null);
            }
        }

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
        if (this._io) {
            this._io.emit('perf-vu-status', { activeVUs, completedVUs });
        }
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
        let total = this.histogram.totalCount;
        const elapsed = Date.now() - this.startTime;

        const nodeStats = this.computeNodeStats();

        // If no full iteration has completed yet, fall back to node-level stats for live telemetry
        let isNodeFallback = false;
        if (total === 0 && nodeStats.length > 0) {
            total = nodeStats.reduce((sum, n) => sum + n.count, 0);
            isNodeFallback = true;
        }

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
                nodeStats: [],
            };
        }

        // If we are falling back to nodes, we compute synthetic latency from node stats
        let latencyObj = {
            avg: Math.round(this.histogram.mean),
            median: this.histogram.getValueAtPercentile(50),
            p95: this.histogram.getValueAtPercentile(95),
            p99: this.histogram.getValueAtPercentile(99),
            min: this.histogram.minNonZeroValue,
            max: this.histogram.maxValue,
        };

        if (isNodeFallback) {
            let maxP95 = 0;
            nodeStats.forEach((n) => {
                if (n.p95 > maxP95) maxP95 = n.p95;
            });
            latencyObj = { avg: 0, median: 0, p95: maxP95, p99: 0, min: 0, max: 0 };
        }

        const errCount = isNodeFallback
            ? nodeStats.reduce((sum, n) => sum + n.errors, 0)
            : this._errorCount;
        const succCount = isNodeFallback ? total - errCount : this._successCount;

        // Ensure http status distribution totals match request count
        const statusDistribution = { ...this.httpStatusCounts };
        statusDistribution['200'] = Math.max(statusDistribution['200'], succCount);
        if (errCount > 0 && statusDistribution['500'] === 0 && statusDistribution['504'] === 0) {
            statusDistribution['500'] = errCount;
        }

        return {
            flowId: this.flowId,
            totalRequests: total,
            successCount: succCount,
            errorCount: errCount,
            errorRate: ((errCount / Math.max(1, total)) * 100).toFixed(2),
            latency: latencyObj,
            throughput: parseFloat((total / (Math.max(1, elapsed) / 1000)).toFixed(2)),
            elapsed,
            timestamp: Date.now(),
            runConfig: this.runConfig,
            nodeStats,
            httpStatusCounts: statusDistribution,
        };
    }

    /**
     * Computes the aggregated statistics for all nodes
     */
    computeNodeStats() {
        const stats = [];
        for (const [nodeId, hist] of this.nodeHistograms.entries()) {
            if (hist.totalCount > 0) {
                const cpuObj = this.nodeCpuAccumulators.get(nodeId);
                const memObj = this.nodeMemAccumulators.get(nodeId);
                const errCount = this.nodeErrors.get(nodeId) || 0;

                stats.push({
                    nodeId,
                    label: this.nodeLabels.get(nodeId) || nodeId,
                    subflowId: this.nodeSubflowIds.get(nodeId) || null,
                    avg: Math.round(hist.mean),
                    p95: hist.getValueAtPercentile(95),
                    count: hist.totalCount,
                    cpuAvg:
                        cpuObj && cpuObj.count > 0
                            ? Number((cpuObj.sum / cpuObj.count).toFixed(2))
                            : 0,
                    memAvg:
                        memObj && memObj.count > 0
                            ? Number((memObj.sum / memObj.count).toFixed(2))
                            : 0,
                    memMax: memObj ? Number(memObj.max.toFixed(2)) : 0,
                    errors: errCount,
                    errorRate: ((errCount / hist.totalCount) * 100).toFixed(1),
                });
            }
        }
        // Sort by P95 latency descending by default
        stats.sort((a, b) => b.p95 - a.p95);
        return stats;
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

        // Perform SLA Evaluation & Saturation Point Diagnosis
        const slaEvaluation = SlaEvaluator.evaluate(snap, this.runConfig?.slaConfig || {});
        snap.slaEvaluation = slaEvaluation;

        // Emit final results if socket is available
        if (this._io) {
            this._io.emit('perf-run-finished', { data: snap });
        }

        console.log(
            `[MetricsCollector] 📊 Final: ${snap.totalRequests} requests, ` +
                `${snap.latency.avg}ms avg, ${snap.throughput} req/s, ${snap.errorRate}% errors, SLA: ${slaEvaluation.status}`,
        );

        return {
            success: slaEvaluation.passed && (snap.errorCount === 0 || parseFloat(snap.errorRate) < 50),
            mode: 'performance',
            data: snap,
            slaEvaluation,
            samples: this.samples,
            vuTimeline: this.vuTimeline,
        };
    }
}

export default MetricsCollector;
export { MetricsCollector };
