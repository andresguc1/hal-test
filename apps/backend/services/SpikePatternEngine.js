/**
 * SpikePatternEngine.js
 * Multi-Spike Pattern Generator for Spike Performance Testing.
 * Generates structured stages for single, multiple, or periodic traffic spikes
 * with baseline warm-up, instant jump, peak hold, instant drop, and recovery intervals.
 */

export class SpikePatternEngine {
    /**
     * Generates k6-compatible stage schedules for spike testing.
     *
     * @param {Object} config
     * @param {number} [config.virtualUsers=100] - Peak VUs
     * @param {number} [config.spikeBaseVUs=10] - Baseline VUs
     * @param {number} [config.duration=60] - Peak hold duration in seconds
     * @param {number} [config.spikeCount=1] - Number of spikes to execute
     * @param {number} [config.spikeIntervalSec=30] - Interval between spikes in seconds
     * @param {number} [config.warmUpSec=15] - Warm-up duration before first spike
     * @param {number} [config.coolDownSec=15] - Cool-down duration after last spike
     * @returns {{ stages: Array<{ target: number, duration: string }>, totalDurationSec: number, spikeWindows: Array<{ spikeNum: number, startSec: number, endSec: number }> }}
     */
    static generateStages(config = {}) {
        const peakVUs = Math.max(1, parseInt(config.virtualUsers || 100, 10));
        const baseVUs = Math.max(1, parseInt(config.spikeBaseVUs || 10, 10));
        const peakDurationSec = Math.max(5, parseInt(config.duration || 60, 10));
        const spikeCount = Math.max(1, parseInt(config.spikeCount || 1, 10));
        const intervalSec = Math.max(5, parseInt(config.spikeIntervalSec || 30, 10));
        const warmUpSec = Math.max(5, parseInt(config.warmUpSec || 15, 10));
        const coolDownSec = Math.max(5, parseInt(config.coolDownSec || 15, 10));

        const stages = [];
        const spikeWindows = [];
        let currentClockSec = 0;

        // 1. Initial Warm-Up at Baseline
        stages.push({ target: baseVUs, duration: `${warmUpSec}s` });
        currentClockSec += warmUpSec;

        for (let i = 1; i <= spikeCount; i++) {
            // Instant Jump to Peak
            stages.push({ target: peakVUs, duration: '2s' });
            const spikeStartSec = currentClockSec + 2;

            // Peak Hold
            stages.push({ target: peakVUs, duration: `${peakDurationSec}s` });
            const spikeEndSec = spikeStartSec + peakDurationSec;
            spikeWindows.push({ spikeNum: i, startSec: spikeStartSec, endSec: spikeEndSec });
            currentClockSec = spikeEndSec;

            // Instant Drop back to Baseline
            stages.push({ target: baseVUs, duration: '2s' });
            currentClockSec += 2;

            // Interval between spikes (if not last spike)
            if (i < spikeCount) {
                stages.push({ target: baseVUs, duration: `${intervalSec}s` });
                currentClockSec += intervalSec;
            }
        }

        // Final Cool-Down at Baseline
        stages.push({ target: baseVUs, duration: `${coolDownSec}s` });
        currentClockSec += coolDownSec;

        return {
            stages,
            totalDurationSec: currentClockSec,
            spikeWindows,
            baseVUs,
            peakVUs,
        };
    }
}

export default SpikePatternEngine;
