/**
 * SoakTrendAnalyzer.js
 * Hourly Bucket Matrix & Endurance Trend Segmenter for Soak Performance Testing.
 * Groups long-running telemetry datasets into hourly intervals (H1, H2, ..., Hn)
 * to evaluate latency, throughput, error rates, CPU, and RAM evolution hour by hour.
 */

export class SoakTrendAnalyzer {
    /**
     * Segments telemetry timeline into hourly aggregate buckets.
     *
     * @param {Array<Object>} timeline - Telemetry timeline snapshots
     * @param {number} [bucketSizeSec=3600] - Bucket duration in seconds (default: 1 hour)
     * @returns {Array<Object>} Hourly bucket aggregates
     */
    static getHourlyBuckets(timeline = [], bucketSizeSec = 3600) {
        if (!timeline || timeline.length === 0) {
            return [];
        }

        const bucketsMap = new Map();

        timeline.forEach((pt, i) => {
            const elapsedSec = (pt.elapsed || pt.timestamp || i * 5) / 1000;
            const hourNum = Math.floor(elapsedSec / bucketSizeSec) + 1;
            const key = `H${hourNum}`;

            if (!bucketsMap.has(key)) {
                bucketsMap.set(key, {
                    hourLabel: `Hora ${hourNum}`,
                    hourNum,
                    points: [],
                });
            }
            bucketsMap.get(key).points.push(pt);
        });

        const result = [];

        for (const [key, b] of bucketsMap.entries()) {
            const pts = b.points;
            const count = pts.length;
            const latencies = pts.map((p) => p.latency?.p95 || p.latencyP95 || p.latency || 0);
            const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / count);
            const p95Latency = Math.max(...latencies);
            const avgThroughput = parseFloat(
                (pts.reduce((a, p) => a + (p.throughput || 0), 0) / count).toFixed(2),
            );
            const avgErrorRate = parseFloat(
                (pts.reduce((a, p) => a + parseFloat(p.errorRate || 0), 0) / count).toFixed(2),
            );
            const avgMem = parseFloat(
                (pts.reduce((a, p) => a + (p.memAvg || p.mem || 0), 0) / count).toFixed(1),
            );
            const avgCpu = parseFloat(
                (pts.reduce((a, p) => a + (p.cpuAvg || p.cpu || 0), 0) / count).toFixed(1),
            );

            result.push({
                key,
                hourLabel: b.hourLabel,
                hourNum: b.hourNum,
                samplesCount: count,
                avgLatency,
                p95Latency,
                avgThroughput,
                avgErrorRate,
                avgMem,
                avgCpu,
            });
        }

        return result;
    }
}

export default SoakTrendAnalyzer;
