# Fix: Orphan Reaper Kills Browser Mid-Launch (Race Condition)

## Problem

`browserType.launch: Target page, context or browser has been closed` when running flows.

Root cause: **race between the browser launch and the orphan reaper** in
`apps/backend/services/browser.service.js`.

### Timeline

```
t0  launchBrowser() generates browserId, stamps --hal-session=<id> (line 406-410)
t1  browserEngine.launch() spawns Chromium (line 446) — seal now visible to `ps`
t2  30s GC sweep fires → killOrphans() → ps scan finds pid → browsers.has(id)===false → SIGTERM
t3  Chromium dies mid-boot
t4  Playwright rejects: "browserType.launch: Target page, context or browser has been closed"
```

`this.set(browserId, ...)` (line 453) happens AFTER the spawn returns, so the
in-flight launch window is unprotected. `_orphanScanAt` starts at `0` (line 163),
so the first scan fires as soon as the server has been up 2 minutes.

The Phase 0-9 observability changes did not introduce this bug — it predates them
(Sept 5, commits e6c5811/79f7ef6/f277427). They only made it more likely by
slowing startup (first launch after boot aligns with the first eligible scan).

## Changes

All changes in `apps/backend/services/browser.service.js`.

### 1. Constructor — in-flight launch registry + late first scan

Current (lines 160-167):

```js
// --- Idle Garbage Collector ---
this._orphanScanAt = 0;
this.idleInterval = setInterval(() => {
  this._idleSweep(Date.now()).catch(() => {});
}, 30 * 1000);
this.idleInterval.unref();
```

New:

```js
// --- Idle Garbage Collector ---
this._orphanScanAt = Date.now(); // don't scan right at the 2-minute mark
this.idleInterval = setInterval(() => {
  this._idleSweep(Date.now()).catch(() => {});
}, 30 * 1000);
this.idleInterval.unref();

// --- IN-FLIGHT LAUNCHES (orphan-reaper guard) ---
this._launching = new Set();
```

### 2. launchBrowser() — register before spawn, unregister after registration

Current (lines 432-447):

```js
let browser;
let launchMethod = 'launch';

if (browserType === 'lightpanda') {
    ...
    browser = await chromium.connectOverCDP({...});
    launchMethod = 'connectOverCDP';
} else {
    browser = await browserEngine.launch(launchOptions);
}
```

New (wrap with try/finally; register BEFORE the spawn/connect):

```js
let browser;
let launchMethod = 'launch';

this._launching.add(browserId);
try {
    if (browserType === 'lightpanda') {
        ...
        browser = await chromium.connectOverCDP({...});
        launchMethod = 'connectOverCDP';
    } else {
        browser = await browserEngine.launch(launchOptions);
    }
} finally {
    this._launching.delete(browserId);
}
```

### 3. killOrphans() — skip in-flight launches

Current (lines 743-746):

```js
for (const { pid, sessionId } of sealed) {
    if (this.browsers.has(sessionId)) continue; // still owned — ignore
    try {
        process.kill(pid, 'SIGTERM');
```

New:

```js
for (const { pid, sessionId } of sealed) {
    if (this.browsers.has(sessionId)) continue; // still owned — ignore
    if (this._launching.has(sessionId)) continue; // in-flight launch — skip
    try {
        process.kill(pid, 'SIGTERM');
```

## Verification

1. `pnpm test` — all 859+ tests pass (browser_lifecycle.test.js in particular).
2. Launch a real headful browser manually and confirm it survives past the 2-min
   orphan scan window.
3. Run a full flow execution (QUALITY AUTOMATION) and confirm the browser stays up.

## Notes

- No tests currently catch this race: `browser_lifecycle.test.js` mocks
  `_scanProcessTable()` (returns fake pids) and effectively synchronizes
  launch+registration, so the real OS-process window is never exercised.
- Optional follow-up (out of scope unless requested): an integration test that
  launches real Chromium while a mocked `_scanProcessTable()` returns the real
  spawned pid, asserting the process survives.
