import AdmZip from 'adm-zip';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { traceDiffService } from '../services/trace-diff/TraceDiffService.js';

const tmp = '/tmp/opencode/trace-diff-test';
await fsp.mkdir(tmp, { recursive: true });

function buildTrace(entries) {
    const zip = new AdmZip();
    const jsonl = entries.map((e) => JSON.stringify(e)).join('\n');
    zip.addFile('trace.trace', Buffer.from(jsonl));
    return zip;
}

// Run A: failed execution (goto timeout error + selector not found)
const runA = [
    {
        type: 'context-options',
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        platform: 'linux',
    },
    {
        type: 'before',
        callId: '1@1',
        apiName: 'page.goto',
        startTime: [100, 0],
        params: { url: 'https://example.com' },
    },
    { type: 'after', callId: '1@1', endTime: [105, 0] },
    {
        type: 'before',
        callId: '2@1',
        apiName: 'locator.click',
        startTime: [106, 0],
        params: { selector: '#login-btn' },
    },
    {
        type: 'after',
        callId: '2@1',
        endTime: [136, 0],
        error: { message: 'Timeout 30000ms exceeded' },
    },
    {
        type: 'before',
        callId: '3@1',
        apiName: 'page.fill',
        startTime: [140, 0],
        params: { selector: '#user', value: 'admin' },
    },
    { type: 'after', callId: '3@1', endTime: [141, 0], error: { message: 'Element not found' } },
];

// Run B: fixed execution (no errors, extra assertion added, duration improved)
const runB = [
    {
        type: 'context-options',
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        platform: 'linux',
    },
    {
        type: 'before',
        callId: '1@1',
        apiName: 'page.goto',
        startTime: [200, 0],
        params: { url: 'https://example.com' },
    },
    { type: 'after', callId: '1@1', endTime: [202, 0] },
    {
        type: 'before',
        callId: '2@1',
        apiName: 'locator.click',
        startTime: [203, 0],
        params: { selector: '#login-btn' },
    },
    { type: 'after', callId: '2@1', endTime: [203, 5] },
    {
        type: 'before',
        callId: '3@1',
        apiName: 'page.fill',
        startTime: [204, 0],
        params: { selector: '#user', value: 'admin' },
    },
    { type: 'after', callId: '3@1', endTime: [204, 5] },
    {
        type: 'before',
        callId: '4@1',
        apiName: 'locator.isVisible',
        startTime: [205, 0],
        params: { selector: '.dashboard' },
    },
    { type: 'after', callId: '4@1', endTime: [205, 1] },
];

const zipA = path.join(tmp, 'trace-fail.zip');
const zipB = path.join(tmp, 'trace-pass.zip');
buildTrace(runA).writeZip(zipA);
buildTrace(runB).writeZip(zipB);

console.log('Test zips created:', zipA, zipB);

const diff = await traceDiffService.diffTraces(zipA, zipB);

console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(diff.summary, null, 2));
console.log('\n=== METADATA DIFF ===');
console.log(JSON.stringify(diff.metadata, null, 2));
console.log('\n=== ADDED ===');
diff.events.added.forEach((e) => console.log(' +', e.name, JSON.stringify(e.args)));
console.log('=== REMOVED ===');
diff.events.removed.forEach((e) => console.log(' -', e.name, JSON.stringify(e.args)));
console.log('=== MODIFIED ===');
diff.events.modified.forEach((e) => console.log(' ~', e.name, JSON.stringify(e.changes)));
console.log('=== UNCHANGED ===');
diff.events.unchanged.forEach((e) => console.log(' =', e.name));

// Assertions
const assert = (cond, msg) => {
    if (!cond) {
        console.error('FAIL:', msg);
        process.exit(1);
    }
};
assert(diff.summary.eventsAdded === 1, 'expected 1 added (locator.isVisible)');
assert(diff.summary.eventsRemoved === 0, 'expected 0 removed');
assert(
    diff.events.modified.some((e) => e.name === 'locator.click' && e.changes.error),
    'click error should be modified',
);
assert(
    diff.events.modified.some((e) => e.name === 'page.goto' && e.changes.duration),
    'goto duration should be modified',
);
assert(diff.events.unchanged.length === 0, 'all events should differ by error or duration');

// Legacy format test
const legacyZip = path.join(tmp, 'trace-legacy.zip');
const legacy = [
    {
        cat: 'pw:api',
        name: 'page.goto',
        ts: 1000000,
        dur: 5000000,
        args: { url: 'https://example.com' },
    },
    {
        cat: 'pw:api',
        name: 'locator.click',
        ts: 7000000,
        dur: 30000000,
        args: { selector: '#btn' },
    },
];
const lz = new AdmZip();
lz.addFile('trace.json', Buffer.from(JSON.stringify(legacy)));
lz.writeZip(legacyZip);

const legacyDiff = await traceDiffService.diffTraces(zipA, legacyZip);
console.log('\n=== LEGACY FORMAT ===');
console.log('format:', legacyDiff.traceB.format, '| events:', legacyDiff.traceB.events);
assert(legacyDiff.traceB.format === 'legacy', 'legacy format detected');
assert(legacyDiff.summary.eventsRemoved > 0, 'legacy run should show removed events');

console.log('\nALL TESTS PASSED');
