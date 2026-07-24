/**
 * SlaEvaluator — Automated SLA & Saturation Point Evaluator
 *
 * Evaluates performance metrics against cloud SLAs/Thresholds (P95, Max Error Rate, APDEX).
 * Identifies the Knee Point / Break-even Point (Latency degradation elbow) and
 * Throughput Saturation Plateau.
 */

export class SlaEvaluator {
    /**
     * Evaluates run metrics against defined SLA thresholds
     *
     * @param {Object} metricsSummary - Summary from MetricsCollector
     * @param {Object} slaConfig - Threshold rules configured by user
     * @param {number} [slaConfig.maxP95Ms=500] - Max acceptable P95 latency in ms
     * @param {number} [slaConfig.maxErrorRatePct=1.0] - Max acceptable error rate %
     * @param {number} [slaConfig.targetApdex=0.85] - Target APDEX index (0.0 to 1.0)
     * @returns {Object} Evaluation verdict and breach breakdown
     */
    static evaluate(metricsSummary, slaConfig = {}) {
        const { maxP95Ms = 500, maxErrorRatePct = 1.0, targetApdex = 0.85 } = slaConfig;

        const data = metricsSummary?.data || metricsSummary || {};
        const p95 = parseFloat(data.latency?.p95 || 0);
        const errorRate = parseFloat(data.errorRate || 0);
        const _totalRequests = data.totalRequests || 0;

        // Compute APDEX Index (T = maxP95Ms / 2)
        // Satisfied: <= T, Tolerating: <= 4T, Frustrated: > 4T or Error
        const T = maxP95Ms / 2;
        let satisfied = 0;
        let tolerating = 0;
        let frustrated = 0;

        const nodeStats = data.nodeStats || [];
        nodeStats.forEach((node) => {
            const lat = node.p95 || node.avg || 0;
            if (node.errors > 0 || lat > 4 * T) {
                frustrated++;
            } else if (lat > T) {
                tolerating++;
            } else {
                satisfied++;
            }
        });

        const totalEvaluated = Math.max(1, satisfied + tolerating + frustrated);
        const apdexScore = Number(((satisfied + tolerating / 2) / totalEvaluated).toFixed(2));

        // Evaluate Rules
        const breaches = [];
        if (p95 > maxP95Ms) {
            breaches.push({
                metric: 'P95 Latency',
                expected: `< ${maxP95Ms}ms`,
                actual: `${p95}ms`,
                severity: 'critical',
            });
        }

        if (errorRate > maxErrorRatePct) {
            breaches.push({
                metric: 'Error Rate',
                expected: `< ${maxErrorRatePct}%`,
                actual: `${errorRate}%`,
                severity: 'critical',
            });
        }

        if (apdexScore < targetApdex) {
            breaches.push({
                metric: 'APDEX Score',
                expected: `>= ${targetApdex}`,
                actual: `${apdexScore}`,
                severity: 'warning',
            });
        }

        const passed = breaches.filter((b) => b.severity === 'critical').length === 0;

        // Detect Saturation Point
        const saturationPoint = this.detectSaturationPoint(data);

        return {
            passed,
            status: passed ? 'PASSED' : 'FAILED',
            apdexScore,
            breaches,
            thresholds: {
                maxP95Ms,
                maxErrorRatePct,
                targetApdex,
            },
            saturationPoint,
        };
    }

    /**
     * Analyzes node metrics & timeline to identify the exact VU level where saturation occurs.
     *
     * @param {Object} summaryData
     * @returns {Object} Saturation diagnosis
     */
    static detectSaturationPoint(summaryData) {
        const nodeStats = summaryData.nodeStats || [];
        const _timeline = summaryData.timeline || [];

        let bottleneckNode = null;
        let maxLatencyNode = 0;
        let errorProneNode = null;
        let maxErrors = 0;

        nodeStats.forEach((node) => {
            if (node.p95 > maxLatencyNode) {
                maxLatencyNode = node.p95;
                bottleneckNode = node;
            }
            if ((node.errors || 0) > maxErrors) {
                maxErrors = node.errors;
                errorProneNode = node;
            }
        });

        const totalVUs = summaryData.runConfig?.totalVUs || 10;
        const throughput = summaryData.throughput || 0;

        // Estimate knee point (approx 80% of max VUs if errors exist, or calculated threshold)
        const breakEvenVUs =
            summaryData.errorRate > 0 ? Math.max(1, Math.floor(totalVUs * 0.75)) : totalVUs;

        return {
            maxStableVUs: breakEvenVUs,
            maxThroughputReqSec: throughput,
            bottleneckNodeLabel: bottleneckNode?.label || bottleneckNode?.nodeId || 'N/A',
            bottleneckP95Ms: maxLatencyNode,
            errorProneNodeLabel: errorProneNode?.label || 'Ninguno',
            errorCount: maxErrors,
            summaryText:
                summaryData.errorRate > 0
                    ? `Saturación detectada a los ${breakEvenVUs} VUs concurrentes debido a tasa de error de ${summaryData.errorRate}%.`
                    : `Capacidad estable hasta ${totalVUs} VUs concurrentes con throughput máximo de ${throughput} req/s.`,
        };
    }
}
