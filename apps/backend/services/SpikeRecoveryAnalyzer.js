/**
 * SpikeRecoveryAnalyzer.js
 * Spike Resiliency & Auto-Recovery Analyzer for Spike Performance Testing.
 * Evaluates telemetry timelines, segments metric phases (Pre-Spike, Peak, Post-Spike),
 * and computes exact Auto-Recovery Time (T_recovery in seconds) and Resilience Score.
 */

export class SpikeRecoveryAnalyzer {
    /**
     * Analyzes telemetry samples to assess spike impact and self-healing.
     *
     * @param {Array<Object>} timeline - Timeline snapshots
     * @param {Object} config - Spike configuration ({ virtualUsers, spikeBaseVUs, duration, spikeWindows })
     * @returns {Object} Spike resilience report
     */
    static analyze(timeline = [], config = {}) {
        if (!timeline || timeline.length === 0) {
            return null;
        }

        const peakVUsThreshold = Math.max(2, (config.virtualUsers || 100) * 0.7);
        const baseVUsThreshold = Math.min(peakVUsThreshold - 1, (config.spikeBaseVUs || 10) * 1.5);

        // Segment data points into 3 phases
        const preSpikePoints = [];
        const peakPoints = [];
        const postSpikePoints = [];

        let peakReached = false;
        let peakEnded = false;
        let peakEndTime = null;

        timeline.forEach((pt) => {
            const vus = pt.vus || pt.activeVUs || 1;
            const latency = pt.latency?.p95 || pt.latencyP95 || pt.latency || 0;
            const throughput = pt.throughput || 0;
            const errorRate = parseFloat(pt.errorRate || 0);

            if (!peakReached && vus >= peakVUsThreshold) {
                peakReached = true;
            }

            if (peakReached && !peakEnded && vus <= baseVUsThreshold) {
                peakEnded = true;
                peakEndTime = pt.timestamp || pt.elapsed || Date.now();
            }

            if (!peakReached) {
                preSpikePoints.push({ vus, latency, throughput, errorRate });
            } else if (peakReached && !peakEnded) {
                peakPoints.push({ vus, latency, throughput, errorRate });
            } else {
                postSpikePoints.push({
                    vus,
                    latency,
                    throughput,
                    errorRate,
                    time: pt.timestamp || pt.elapsed,
                });
            }
        });

        // Compute Phase Averages
        const calcPhaseStats = (points) => {
            if (!points || points.length === 0) {
                return {
                    avgLatency: 0,
                    p95Latency: 0,
                    avgThroughput: 0,
                    avgErrorRate: 0,
                    count: 0,
                };
            }
            const count = points.length;
            const avgLat = Math.round(points.reduce((s, p) => s + p.latency, 0) / count);
            const p95Lat = Math.max(...points.map((p) => p.latency));
            const avgTput = parseFloat(
                (points.reduce((s, p) => s + p.throughput, 0) / count).toFixed(2),
            );
            const avgErr = parseFloat(
                (points.reduce((s, p) => s + p.errorRate, 0) / count).toFixed(2),
            );

            return {
                avgLatency: avgLat,
                p95Latency: p95Lat,
                avgThroughput: avgTput,
                avgErrorRate: avgErr,
                count,
            };
        };

        const preStats = calcPhaseStats(preSpikePoints);
        const peakStats = calcPhaseStats(peakPoints);
        const postStats = calcPhaseStats(postSpikePoints);

        // Compute Auto-Recovery Time (T_recovery)
        let recoveryTimeSec = 0;
        let isFullyRecovered = false;
        const baselineLatencyThreshold = (preStats.p95Latency || preStats.avgLatency || 300) * 1.25;

        if (peakEnded && postSpikePoints.length > 0) {
            const recoveryPoint = postSpikePoints.find(
                (pt) => pt.latency <= baselineLatencyThreshold && pt.errorRate <= 5,
            );

            if (recoveryPoint && peakEndTime) {
                const recTimeMs = (recoveryPoint.time || Date.now()) - peakEndTime;
                recoveryTimeSec = Math.max(1, Math.round(recTimeMs / 1000));
                isFullyRecovered = true;
            } else {
                // Elapsed time since peak ended
                const lastPt = postSpikePoints[postSpikePoints.length - 1];
                const recTimeMs = (lastPt.time || Date.now()) - peakEndTime;
                recoveryTimeSec = Math.max(1, Math.round(recTimeMs / 1000));
                isFullyRecovered = false;
            }
        }

        // Compute Resilience Score (0 - 100)
        let resilienceScore = 100;
        if (peakStats.avgErrorRate > 10) resilienceScore -= 30;
        if (peakStats.avgErrorRate > 30) resilienceScore -= 30;
        if (peakStats.p95Latency > 3000) resilienceScore -= 20;
        if (!isFullyRecovered && peakEnded) resilienceScore -= 20;

        resilienceScore = Math.max(0, Math.min(100, resilienceScore));

        return {
            preSpike: preStats,
            peak: peakStats,
            postSpike: postStats,
            recoveryTimeSec,
            isFullyRecovered,
            resilienceScore,
            verdict:
                resilienceScore >= 80
                    ? 'Excelente Resiliencia'
                    : resilienceScore >= 50
                      ? 'Resiliencia Aceptable'
                      : 'Colapso Bajo Sobrecarga Súbita',
        };
    }
}

export default SpikeRecoveryAnalyzer;
