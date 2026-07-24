/**
 * CircuitBreakerGuard.js
 * Safety guard for Stress Testing and Load Testing.
 * Evaluates live telemetry metrics against user-configured safety thresholds (error rate %, latency ms)
 * and triggers an automatic abort if thresholds are violated for N consecutive samples.
 */

export class CircuitBreakerGuard {
    constructor(options = {}) {
        this.stopAtErrorRate = options.stopAtErrorRate || null; // e.g. 25 (%)
        this.maxLatencyMs = options.maxLatencyMs || null; // e.g. 5000 (ms)
        this.consecutiveLimit = options.consecutiveLimit || 3;
        this.violationCount = 0;
        this.tripped = false;
        this.tripReason = null;
    }

    /**
     * Evaluates a live telemetry snapshot against circuit breaker rules.
     *
     * @param {Object} snapshot - { errorRate, latency: { p95 }, totalRequests }
     * @returns {{ tripped: boolean, reason: string|null }}
     */
    evaluate(snapshot) {
        if (this.tripped) {
            return { tripped: true, reason: this.tripReason };
        }

        if (!snapshot || (snapshot.totalRequests || 0) < 5) {
            return { tripped: false, reason: null };
        }

        const errorRate = parseFloat(snapshot.errorRate || 0);
        const latencyP95 = snapshot.latency?.p95 || snapshot.latencyP95 || 0;

        let isViolated = false;
        let currentReason = null;

        if (this.stopAtErrorRate !== null && errorRate >= this.stopAtErrorRate) {
            isViolated = true;
            currentReason = `Tasa de error (${errorRate.toFixed(1)}%) superó el límite de seguridad de ${this.stopAtErrorRate}%`;
        } else if (this.maxLatencyMs !== null && latencyP95 >= this.maxLatencyMs) {
            isViolated = true;
            currentReason = `Latencia P95 (${Math.round(latencyP95)}ms) superó el límite de seguridad de ${this.maxLatencyMs}ms`;
        }

        if (isViolated) {
            this.violationCount++;
            if (this.violationCount >= this.consecutiveLimit) {
                this.tripped = true;
                this.tripReason = currentReason;
                console.warn(`[CircuitBreakerGuard] 🛑 DISYUNTOR DISPARADO: ${currentReason}`);
                return { tripped: true, reason: currentReason };
            }
        } else {
            this.violationCount = Math.max(0, this.violationCount - 1);
        }

        return { tripped: false, reason: null };
    }

    reset() {
        this.violationCount = 0;
        this.tripped = false;
        this.tripReason = null;
    }
}

export default CircuitBreakerGuard;
