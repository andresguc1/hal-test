/**
 * SoakLeakDetector.js
 * Memory Leak & Latency Drift Detector for Soak (Endurance) Performance Testing.
 * Analyzes long-running telemetry timelines to compute memory growth slope (MB/hour),
 * latency drift slope (ms/hour), and diagnose potential Memory Leaks or Resource Exhaustion.
 */

export class SoakLeakDetector {
    /**
     * Analyzes telemetry samples for long-term resource leaks and degradation drift.
     *
     * @param {Array<Object>} timeline - Telemetry timeline array
     * @param {Object} [config] - Soak test configuration
     * @returns {Object} Leak and endurance diagnostic report
     */
    static analyze(timeline = [], _config = {}) {
        if (!timeline || timeline.length < 3) {
            return null;
        }

        const data = timeline.map((pt, i) => ({
            timeSec: (pt.elapsed || pt.timestamp || i * 5) / 1000,
            latency: pt.latency?.p95 || pt.latencyP95 || pt.latency || 0,
            memMb: pt.memAvg || pt.memoryUsage || pt.mem || 0,
            cpu: pt.cpuAvg || pt.cpu || 0,
            errorRate: parseFloat(pt.errorRate || 0),
            throughput: pt.throughput || 0,
        }));

        const n = data.length;
        const totalDurationSec = Math.max(1, data[n - 1].timeSec - data[0].timeSec);
        const durationHours = totalDurationSec / 3600;

        // Linear Regression Helper: y = slope * x + intercept
        const calcLinearRegression = (key) => {
            let sumX = 0,
                sumY = 0,
                sumXY = 0,
                sumXX = 0;
            data.forEach((d) => {
                const x = d.timeSec;
                const y = d[key];
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumXX += x * x;
            });
            const denominator = n * sumXX - sumX * sumX;
            if (denominator === 0) return { slopePerSec: 0, intercept: 0 };
            const slopePerSec = (n * sumXY - sumX * sumY) / denominator;
            const intercept = (sumY - slopePerSec * sumX) / n;
            return { slopePerSec, intercept };
        };

        // Regressions for Memory (MB) and Latency (ms)
        const memReg = calcLinearRegression('memMb');
        const latReg = calcLinearRegression('latency');

        const memSlopeMbPerHour = parseFloat((memReg.slopePerSec * 3600).toFixed(2));
        const latSlopeMsPerHour = parseFloat((latReg.slopePerSec * 3600).toFixed(2));

        const startMem = data[0].memMb;
        const endMem = data[n - 1].memMb;
        const totalMemDelta = parseFloat((endMem - startMem).toFixed(2));

        const startLat = data[0].latency;
        const endLat = data[n - 1].latency;
        const totalLatDelta = parseFloat((endLat - startLat).toFixed(2));

        // Memory Leak & Latency Drift Diagnosis
        const isMemoryLeakDetected = memSlopeMbPerHour > 15 && totalMemDelta > 30;
        const isLatencyDriftDetected =
            latSlopeMsPerHour > 100 || (endLat > startLat * 1.5 && startLat > 50);

        // Endurance Stability Score (0 - 100)
        let stabilityScore = 100;
        if (isMemoryLeakDetected) stabilityScore -= 35;
        if (isLatencyDriftDetected) stabilityScore -= 30;
        if (memSlopeMbPerHour > 50) stabilityScore -= 20;

        const maxErr = Math.max(...data.map((d) => d.errorRate));
        if (maxErr > 5) stabilityScore -= 15;

        stabilityScore = Math.max(0, Math.min(100, Math.round(stabilityScore)));

        return {
            durationHours: parseFloat(durationHours.toFixed(2)),
            memSlopeMbPerHour,
            latSlopeMsPerHour,
            totalMemDeltaMb: totalMemDelta,
            totalLatDeltaMs: totalLatDelta,
            isMemoryLeakDetected,
            isLatencyDriftDetected,
            stabilityScore,
            verdict:
                stabilityScore >= 85
                    ? 'Excelente Estabilidad (Sin Fugas)'
                    : stabilityScore >= 60
                      ? 'Estabilidad Aceptable (Degradación Menor)'
                      : isMemoryLeakDetected
                        ? 'ALERTA: Fuga de Memoria Detectada (Memory Leak)'
                        : 'ALERTA: Degradación Progresiva de Latencia',
        };
    }
}

export default SoakLeakDetector;
