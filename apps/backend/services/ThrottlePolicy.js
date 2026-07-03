/**
 * ThrottlePolicy — Memory-Aware Resource Estimator for Performance Testing
 *
 * Provides pre-flight resource estimation and runtime auto-throttle logic
 * based on available system memory. Prevents process overflow by capping
 * Virtual Users (VUs) to what the machine can safely handle.
 *
 * Used by PerformanceRunner to:
 * 1. Estimate RAM cost before launching a performance run
 * 2. Calculate safe max VU count dynamically
 * 3. Provide real-time resource snapshots during execution
 */

import os from 'os';

class ThrottlePolicy {
    // Empirical memory cost per Chromium instance (Playwright)
    static RAM_PER_HEADLESS_BROWSER = 250 * 1024 * 1024; // ~250MB
    static RAM_PER_HEADED_BROWSER = 500 * 1024 * 1024; // ~500MB

    // Reserve 20% of system RAM for OS and Node.js process
    static SAFETY_MARGIN = 0.2;

    // Minimum free memory to allow any performance run (500MB)
    static MIN_FREE_MEMORY = 500 * 1024 * 1024;

    /**
     * Estimates the resource cost of a performance run.
     *
     * @param {number} vus - Number of Virtual Users requested
     * @param {Object|null} _flow - Flow object (reserved for future node-weight analysis)
     * @param {boolean} headless - Whether browsers will run headless
     * @returns {{ ramGB: string, freeGB: string, totalGB: string, exceeds: boolean, safeVUs: number, utilizationPercent: string }}
     */
    static estimate(vus, _flow = null, headless = true) {
        const perBrowser = headless ? this.RAM_PER_HEADLESS_BROWSER : this.RAM_PER_HEADED_BROWSER;

        const totalNeeded = vus * perBrowser;
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const safeMemory = freeMemory * (1 - this.SAFETY_MARGIN);

        const safeVUs = Math.max(1, Math.floor(safeMemory / perBrowser));

        return {
            ramGB: (totalNeeded / 1e9).toFixed(1),
            freeGB: (freeMemory / 1e9).toFixed(1),
            totalGB: (totalMemory / 1e9).toFixed(1),
            exceeds: totalNeeded > safeMemory || freeMemory < this.MIN_FREE_MEMORY,
            safeVUs,
            utilizationPercent: ((totalNeeded / freeMemory) * 100).toFixed(0),
        };
    }

    /**
     * Returns the maximum number of concurrent browsers the system can safely handle.
     *
     * @param {boolean} headless
     * @returns {number}
     */
    static getMaxConcurrency(headless = true) {
        const perBrowser = headless ? this.RAM_PER_HEADLESS_BROWSER : this.RAM_PER_HEADED_BROWSER;
        const safeMemory = os.freemem() * (1 - this.SAFETY_MARGIN);
        return Math.max(1, Math.floor(safeMemory / perBrowser));
    }

    /**
     * Returns a real-time resource snapshot for the live metrics dashboard.
     *
     * @returns {{ freeMemoryMB: number, totalMemoryMB: number, usedPercent: string, cpuCount: number, loadAvg: number[] }}
     */
    static snapshot() {
        const free = os.freemem();
        const total = os.totalmem();
        return {
            freeMemoryMB: Math.round(free / 1e6),
            totalMemoryMB: Math.round(total / 1e6),
            usedPercent: (((total - free) / total) * 100).toFixed(1),
            cpuCount: os.cpus().length,
            loadAvg: os.loadavg(),
        };
    }

    /**
     * Checks whether the system is under memory pressure right now.
     * Can be called during a running performance test to trigger dynamic throttling.
     *
     * @returns {{ healthy: boolean, freePercent: string, action: 'continue'|'throttle'|'abort' }}
     */
    static checkHealth() {
        const free = os.freemem();
        const total = os.totalmem();
        const freePercent = (free / total) * 100;

        if (freePercent < 5) {
            return { healthy: false, freePercent: freePercent.toFixed(1), action: 'abort' };
        }
        if (freePercent < 15) {
            return { healthy: false, freePercent: freePercent.toFixed(1), action: 'throttle' };
        }
        return { healthy: true, freePercent: freePercent.toFixed(1), action: 'continue' };
    }
}

export default ThrottlePolicy;
export { ThrottlePolicy };
