import * as fsp from 'fs/promises';
import * as path from 'path';
import { STORAGE_RUNS_DIR } from '../../config/paths.js';

/**
 * TraceDiffService
 * Parses Playwright trace archives (.zip) and computes differences between two runs.
 *
 * Supported trace formats:
 *  - Modern (Playwright >= 1.14): trace.trace (JSONL events) + trace.network
 *  - Legacy: trace.json (Chrome Trace Event format, microsecond timestamps)
 */
class TraceDiffService {
    constructor() {
        this.tempDir = path.join(STORAGE_RUNS_DIR, '.trace-diff-temp');

        // Volatile per-run identifiers that must not be treated as differences.
        this.ignoredArgKeys = new Set([
            'pageId',
            'frameId',
            'callId',
            'snapshotName',
            'browserContextId',
            'executionContextId',
            'requestId',
            'responseId',
            'wallTime',
            'monotonicTime',
            'frameSwapWallTime',
            'timestamp',
        ]);
        this.ignoredMetaKeys = new Set(['title']);
    }

    async init() {
        await fsp.mkdir(this.tempDir, { recursive: true });
    }

    /**
     * Extract a trace zip and return normalized events + metadata.
     */
    async extractTrace(tracePath) {
        const extractDir = path.join(
            this.tempDir,
            `${path.basename(tracePath, '.zip')}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        );
        await fsp.mkdir(extractDir, { recursive: true });

        try {
            await this.extractZip(tracePath, extractDir);

            const { entries, format } = await this.readTraceEntries(extractDir);
            const { events, meta } = this.normalizeEvents(entries, format);

            return { events, meta, format, extractDir };
        } catch (error) {
            await this.cleanup(extractDir);
            throw error;
        }
    }

    async extractZip(zipPath, destDir) {
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(destDir, true);
    }

    /**
     * Read raw entries from either modern (trace.trace JSONL) or legacy (trace.json).
     */
    async readTraceEntries(extractDir) {
        const modernPath = path.join(extractDir, 'trace.trace');
        const legacyPath = path.join(extractDir, 'trace.json');

        if (await this.exists(modernPath)) {
            const raw = await fsp.readFile(modernPath, 'utf-8');
            const entries = [];
            for (const line of raw.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    entries.push(JSON.parse(trimmed));
                } catch {
                    // Skip malformed lines
                }
            }
            return { entries, format: 'modern' };
        }

        if (await this.exists(legacyPath)) {
            const raw = await fsp.readFile(legacyPath, 'utf-8');
            const parsed = JSON.parse(raw);
            const entries = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.traceEvents)
                  ? parsed.traceEvents
                  : [];
            return { entries, format: 'legacy' };
        }

        throw new Error('No trace.trace or trace.json found in trace archive');
    }

    /**
     * Normalize raw entries into a common event shape:
     * { type, name, timestamp(ms), duration(ms), args, error }
     */
    normalizeEvents(entries, format) {
        if (format === 'modern') {
            return this.normalizeModern(entries);
        }
        return this.normalizeLegacy(entries);
    }

    normalizeModern(entries) {
        const events = [];
        const meta = { snapshotCount: 0, screencastFrames: 0 };
        const pendingByCallId = new Map();
        let firstTimestamp = null;

        // Playwright's modern trace uses monotonic timestamps in milliseconds.
        const toMs = (t) => {
            if (Array.isArray(t)) return (t[0] + (t[1] || 0) / 1e9) * 1000;
            if (typeof t === 'number') return t;
            return null;
        };

        const nameOf = (entry) =>
            entry.apiName ||
            (entry.class && entry.method ? `${entry.class}.${entry.method}` : entry.method);

        const trackFirst = (ts) => {
            if (ts !== null && firstTimestamp === null) firstTimestamp = ts;
        };

        for (const entry of entries) {
            switch (entry.type) {
                case 'context-options': {
                    meta.browserName = entry.browserName;
                    meta.viewport = entry.options?.viewport || entry.viewport;
                    meta.userAgent = entry.options?.userAgent || entry.userAgent;
                    meta.platform = entry.platform || meta.platform;
                    meta.playwrightVersion = entry.playwrightVersion || entry.version;
                    meta.title = entry.title;
                    meta.sdkLanguage = entry.sdkLanguage;
                    break;
                }

                case 'metadata': {
                    Object.assign(meta, entry);
                    break;
                }

                case 'before': {
                    const ts = toMs(entry.startTime);
                    trackFirst(ts);
                    const event = {
                        type: 'api',
                        name: nameOf(entry),
                        timestamp: ts ?? 0,
                        duration: 0,
                        args: entry.params || entry.args || {},
                        error: null,
                        callId: entry.callId,
                    };
                    if (entry.callId) pendingByCallId.set(entry.callId, event);
                    events.push(event);
                    break;
                }

                case 'after': {
                    const event = entry.callId ? pendingByCallId.get(entry.callId) : null;
                    if (event) {
                        const end = toMs(entry.endTime);
                        if (end !== null) {
                            event.duration = Math.max(0, end - event.timestamp);
                        }
                        if (entry.error) {
                            event.error =
                                typeof entry.error === 'string'
                                    ? entry.error
                                    : entry.error.message || JSON.stringify(entry.error);
                        }
                        if (entry.result && typeof entry.result === 'object') {
                            event.result = entry.result;
                        }
                        pendingByCallId.delete(entry.callId);
                    }
                    break;
                }

                case 'event':
                case 'log': {
                    const ts = toMs(entry.time ?? entry.timestamp ?? entry.startTime);
                    trackFirst(ts);
                    events.push({
                        type: entry.type,
                        name: entry.type === 'log' ? entry.message || 'log' : nameOf(entry),
                        timestamp: ts ?? 0,
                        duration: 0,
                        args: entry.params || entry.args || {},
                        message: entry.message,
                        error: null,
                    });
                    break;
                }

                case 'frame-snapshot': {
                    meta.snapshotCount += 1;
                    break;
                }

                case 'screencast-frame': {
                    meta.screencastFrames += 1;
                    break;
                }

                default:
                    break;
            }
        }

        // Normalize timestamps relative to trace start for stable cross-run comparison
        if (firstTimestamp !== null) {
            for (const e of events) e.timestamp = Math.max(0, e.timestamp - firstTimestamp);
        }

        events.sort((a, b) => a.timestamp - b.timestamp);
        return { events, meta };
    }

    normalizeLegacy(entries) {
        const events = [];
        const meta = {};

        for (const entry of entries) {
            if (entry.cat === 'metadata' || entry.name === 'metadata') {
                if (entry.args) Object.assign(meta, entry.args);
                continue;
            }

            const isApi = entry.cat === 'pw:api' || entry.cat === 'pw:action';
            const isNav = entry.cat === 'pw:navigation';
            const isConsole = entry.cat === 'console';
            const isNetwork = entry.cat === 'network';
            if (!isApi && !isNav && !isConsole && !isNetwork) continue;

            events.push({
                type: isConsole ? 'console' : isNetwork ? 'network' : isNav ? 'navigation' : 'api',
                name: entry.name,
                timestamp: (entry.ts || 0) / 1000, // µs -> ms
                duration: (entry.dur || 0) / 1000,
                args: entry.args || {},
                error: entry.args?.error || null,
            });
        }

        // Normalize relative to first event
        if (events.length > 0) {
            const base = events[0].timestamp;
            for (const e of events) e.timestamp = Math.max(0, e.timestamp - base);
        }

        events.sort((a, b) => a.timestamp - b.timestamp);
        return { events, meta };
    }

    /**
     * Compare two trace archives and return a structured diff.
     */
    async diffTraces(tracePathA, tracePathB) {
        await this.init();

        const [traceA, traceB] = await Promise.all([
            this.extractTrace(tracePathA),
            this.extractTrace(tracePathB),
        ]);

        try {
            const eventDiff = this.diffEvents(traceA.events, traceB.events);
            const metadataDiff = this.diffMetadata(traceA.meta, traceB.meta);

            return {
                traceA: { path: tracePathA, events: traceA.events.length, format: traceA.format },
                traceB: { path: tracePathB, events: traceB.events.length, format: traceB.format },
                events: eventDiff,
                metadata: metadataDiff,
                summary: {
                    eventsAdded: eventDiff.added.length,
                    eventsRemoved: eventDiff.removed.length,
                    eventsModified: eventDiff.modified.length,
                    eventsUnchanged: eventDiff.unchanged.length,
                    snapshotsA: traceA.meta?.snapshotCount || 0,
                    snapshotsB: traceB.meta?.snapshotCount || 0,
                    screencastFramesA: traceA.meta?.screencastFrames || 0,
                    screencastFramesB: traceB.meta?.screencastFrames || 0,
                },
            };
        } finally {
            await this.cleanup(traceA.extractDir);
            await this.cleanup(traceB.extractDir);
        }
    }

    diffEvents(eventsA, eventsB) {
        const mapA = this.groupEvents(eventsA);
        const mapB = this.groupEvents(eventsB);

        const added = [];
        const removed = [];
        const modified = [];
        const unchanged = [];

        const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

        for (const key of allKeys) {
            const listA = mapA.get(key) || [];
            const listB = mapB.get(key) || [];

            if (listA.length === 0) {
                added.push(...listB.map((e) => ({ ...e, diffType: 'added' })));
            } else if (listB.length === 0) {
                removed.push(...listA.map((e) => ({ ...e, diffType: 'removed' })));
            } else {
                const maxLen = Math.max(listA.length, listB.length);
                for (let i = 0; i < maxLen; i++) {
                    const a = listA[i];
                    const b = listB[i];
                    if (!a) {
                        added.push({ ...b, diffType: 'added' });
                    } else if (!b) {
                        removed.push({ ...a, diffType: 'removed' });
                    } else {
                        const changes = this.compareEventArgs(a, b);
                        if (Object.keys(changes).length > 0) {
                            modified.push({
                                ...b,
                                diffType: 'modified',
                                changes,
                                original: {
                                    timestamp: a.timestamp,
                                    duration: a.duration,
                                    error: a.error,
                                },
                            });
                        } else {
                            unchanged.push({ ...b, diffType: 'unchanged' });
                        }
                    }
                }
            }
        }

        return { added, removed, modified, unchanged };
    }

    groupEvents(events) {
        const map = new Map();
        for (const e of events) {
            const selector = e.args?.selector || e.args?.url || e.args?.text || '';
            const key = `${e.type}:${e.name}:${selector}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(e);
        }
        return map;
    }

    compareEventArgs(a, b) {
        const changes = {};

        if (a.error !== b.error) {
            changes.error = { before: a.error, after: b.error };
        }
        if (Math.abs((a.duration || 0) - (b.duration || 0)) > 250) {
            changes.duration = {
                before: `${Math.round(a.duration || 0)}ms`,
                after: `${Math.round(b.duration || 0)}ms`,
            };
        }

        const keys = new Set([...Object.keys(a.args || {}), ...Object.keys(b.args || {})]);
        for (const key of keys) {
            if (this.ignoredArgKeys.has(key)) continue;
            const valA = a.args?.[key];
            const valB = b.args?.[key];
            if (JSON.stringify(valA) !== JSON.stringify(valB)) {
                changes[key] = { before: valA, after: valB };
            }
        }

        return changes;
    }

    diffMetadata(metaA, metaB) {
        const changes = {};
        const keys = new Set([...Object.keys(metaA || {}), ...Object.keys(metaB || {})]);
        for (const key of keys) {
            if (this.ignoredMetaKeys.has(key)) continue;
            if (JSON.stringify(metaA[key]) !== JSON.stringify(metaB[key])) {
                changes[key] = { before: metaA[key], after: metaB[key] };
            }
        }
        return changes;
    }

    async exists(p) {
        try {
            await fsp.access(p);
            return true;
        } catch {
            return false;
        }
    }

    async cleanup(dir) {
        try {
            await fsp.rm(dir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    }
}

export const traceDiffService = new TraceDiffService();
