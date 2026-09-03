// core/browser-utils.js - Browser & Context Management Utilities
// Extracted from action.controller.js for reuse across plugins
// ==========================================================

import { browserService } from '../services/browser.service.js';
import { networkHistoryService } from '../services/NetworkHistoryService.js';
import { SecurityAuditor } from '../services/SecurityAuditor.js';
import { DataLeakEngine } from '../services/security/DataLeakEngine.js';
import { DomProtectionEngine } from '../services/security/DomProtectionEngine.js';
import { emitSecurityAlert } from '../socket.js';
import { STORAGE_RUNS_DIR } from '../config/paths.js';
import { DEVICE_PRESETS } from '../utils/constants.js';
import * as fsp from 'fs/promises';
import * as path from 'path';

function getHttpCredentials(browserId, service) {
    if (!browserId) return null;
    const entry = service.get(browserId);
    const creds = entry?.options?.httpCredentials;
    if (creds && typeof creds.username === 'string' && creds.username !== '') {
        const result = { username: creds.username, password: creds.password || '' };
        if (creds.origin) result.origin = creds.origin;
        if (creds.send) result.send = creds.send;
        return result;
    }
    return null;
}

const NETWORK_PRESETS = {
    'No throttling': {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
    },
    'WiFi fast': {
        offline: false,
        latency: 20,
        downloadThroughput: (50 * 1024 * 1024) / 8,
        uploadThroughput: (25 * 1024 * 1024) / 8,
    },
    'WiFi slow': {
        offline: false,
        latency: 80,
        downloadThroughput: (8 * 1024 * 1024) / 8,
        uploadThroughput: (2 * 1024 * 1024) / 8,
    },
    '4G': {
        offline: false,
        latency: 50,
        downloadThroughput: (20 * 1024 * 1024) / 8,
        uploadThroughput: (10 * 1024 * 1024) / 8,
        connectionType: 'cellular4g',
    },
    'Fast 3G': {
        offline: false,
        latency: 150,
        downloadThroughput: (1.5 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        connectionType: 'cellular3g',
    },
    'Slow 3G': {
        offline: false,
        latency: 400,
        downloadThroughput: (400 * 1024) / 8,
        uploadThroughput: (400 * 1024) / 8,
        connectionType: 'cellular3g',
    },
    '2G': {
        offline: false,
        latency: 800,
        downloadThroughput: (80 * 1024) / 8,
        uploadThroughput: (30 * 1024) / 8,
        connectionType: 'cellular2g',
    },
    'High Latency': {
        offline: false,
        latency: 2000,
        downloadThroughput: (10 * 1024 * 1024) / 8,
        uploadThroughput: (5 * 1024 * 1024) / 8,
        connectionType: 'other',
    },
    Offline: {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0,
    },
};

async function applyNetworkConditions(page, options) {
    const {
        networkProfile,
        offline,
        latency,
        downloadThroughput,
        uploadThroughput,
        forceThrottling,
    } = options;

    if (!networkProfile && !forceThrottling) return;

    let conditions = {};
    if (networkProfile === 'Custom') {
        conditions = {
            offline: offline || false,
            latency: latency || 0,
            downloadThroughput:
                downloadThroughput && downloadThroughput > 0 ? (downloadThroughput * 1024) / 8 : -1,
            uploadThroughput:
                uploadThroughput && uploadThroughput > 0 ? (uploadThroughput * 1024) / 8 : -1,
        };
    } else if (networkProfile) {
        conditions = NETWORK_PRESETS[networkProfile] || NETWORK_PRESETS['No throttling'];
    }

    if (Object.keys(conditions).length === 0) return;

    try {
        const context = page.context();
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: conditions.offline,
            latency: conditions.latency,
            downloadThroughput: conditions.downloadThroughput,
            uploadThroughput: conditions.uploadThroughput,
            connectionType: conditions.connectionType || 'cellular4g',
        });
        console.log(`[Network] Throttling applied: ${networkProfile || 'Custom'}`);
    } catch (err) {
        console.warn('[Network] Failed to apply throttling:', err.message);
    }
}

function validateBrowser(req, browserId) {
    const ids = Array.from(browserService.keys());

    let id = browserId;
    let entry = browserId ? browserService.get(browserId) : null;

    if (!entry && ids.length > 0) {
        id = ids[ids.length - 1];
        entry = browserService.get(id);
        if (browserId) {
            console.log(
                `[SESSION] Browser ID ${browserId} not found. Falling back to active session ${id}`,
            );
        }
    }

    if (!entry) {
        return {
            error: true,
            status: 400,
            message: req.t ? req.t('errors.no_active_browsers') : 'No active browser session found',
        };
    }

    return { error: false, browserId: id, entry };
}

async function attachSecurityContextListeners(context) {
    if (!context._securityListenersAttached) {
        context._securityListenersAttached = true;

        context.on('page', async (page) => {
            page._securityMode = true;
            page._securityAlerts = page._securityAlerts || [];

            try {
                await page.exposeFunction('onDOMAlert', (alert) => {
                    if (!page._securityMode) return;
                    const currentRunId = page._currentRunId;
                    const currentNodeId = page._currentNodeId;
                    const enriched = {
                        ...alert,
                        url: page.url(),
                        runId: currentRunId || null,
                        nodeId: currentNodeId || null,
                        timestamp: Date.now(),
                    };
                    page._securityAlerts.push(enriched);
                    emitSecurityAlert(enriched);
                });
            } catch (err) {
                // ignore if already exposed
            }

            page.on('response', async (response) => {
                if (!page._securityMode) return;
                try {
                    const url = response.url();
                    if (url.startsWith('data:') || url.startsWith('blob:')) return;
                    const headers = response.headers();
                    const alerts = SecurityAuditor.auditHeaders(url, headers);
                    const setCookie = headers['set-cookie'];
                    if (setCookie) {
                        const cookieAlerts = SecurityAuditor.auditCookies(url, setCookie);
                        alerts.push(...cookieAlerts);
                    }

                    const currentRunId = page._currentRunId;
                    const currentNodeId = page._currentNodeId;

                    for (const alert of alerts) {
                        const enriched = {
                            ...alert,
                            url,
                            runId: currentRunId || null,
                            nodeId: currentNodeId || null,
                            timestamp: Date.now(),
                        };
                        page._securityAlerts.push(enriched);
                        emitSecurityAlert(enriched);
                    }

                    const dlpFindings = await DataLeakEngine.auditResponse(response);
                    for (const finding of dlpFindings) {
                        const enriched = {
                            ...finding,
                            url,
                            runId: currentRunId || null,
                            nodeId: currentNodeId || null,
                            timestamp: Date.now(),
                        };
                        page._securityAlerts.push(enriched);
                        emitSecurityAlert(enriched);
                    }
                } catch (e) {
                    /* ignore */
                }
            });

            page.on('request', async (request) => {
                if (!page._securityMode) return;
                try {
                    const url = request.url();
                    if (url.startsWith('data:') || url.startsWith('blob:')) return;

                    const currentRunId = page._currentRunId;
                    const currentNodeId = page._currentNodeId;

                    const dlpFindings = await DataLeakEngine.auditRequest(request);
                    for (const finding of dlpFindings) {
                        const enriched = {
                            ...finding,
                            url,
                            runId: currentRunId || null,
                            nodeId: currentNodeId || null,
                            timestamp: Date.now(),
                        };
                        page._securityAlerts.push(enriched);
                        emitSecurityAlert(enriched);
                    }
                } catch (e) {
                    /* ignore */
                }
            });

            page.on('console', async (msg) => {
                if (!page._securityMode) return;
                try {
                    const alert = SecurityAuditor.auditConsoleMessage(msg);
                    if (alert) {
                        const currentRunId = page._currentRunId;
                        const currentNodeId = page._currentNodeId;
                        const enriched = {
                            ...alert,
                            runId: currentRunId || null,
                            nodeId: currentNodeId || null,
                            timestamp: Date.now(),
                        };
                        page._securityAlerts.push(enriched);
                        emitSecurityAlert(enriched);
                    }
                } catch (e) {
                    /* ignore */
                }
            });
        });
    }

    const pages = context.pages ? context.pages() : [];
    for (const page of pages) {
        page._securityMode = true;
        page._securityAlerts = page._securityAlerts || [];
    }
}

async function getOrCreateContext(req, browser, browserId) {
    if (typeof browser.isConnected === 'function' && !browser.isConnected()) {
        throw new Error(req.t('common.browser_disconnected'));
    }

    try {
        if (typeof browser.contexts === 'function') {
            const contexts = browser.contexts();
            if (Array.isArray(contexts) && contexts.length > 0) {
                const ctx = contexts[0];
                try {
                    await ctx.pages();
                    attachDialogListener(ctx);
                    if (req.body?.securityObservability) {
                        await attachSecurityContextListeners(ctx);
                    }
                    return ctx;
                } catch (err) {
                    console.log('[WARN] Context unhealthy, closing and creating new:', err.message);
                    await ctx.close().catch(() => {});
                }
            }
        }
    } catch (err) {
        console.error('[ERROR] Error verifying contexts:', err.message);
    }

    if (typeof browser.newContext === 'function') {
        console.log('[INFO] Creating new navigation context');
        try {
            let contextOptions = {};

            if (browserId) {
                const entry = browserService.get(browserId);
                if (entry && entry.options) {
                    console.log(
                        '[INFO] Found launch options for browser:',
                        JSON.stringify(entry.options, null, 2),
                    );

                    const runId = req.body.runId;
                    const recordVideo = entry.options.recordVideo !== false;

                    if (runId && recordVideo) {
                        const videoDir = path.join(STORAGE_RUNS_DIR, runId);
                        await fsp.mkdir(videoDir, { recursive: true }).catch(() => {});
                        contextOptions.recordVideo = {
                            dir: videoDir,
                            size: { width: 1280, height: 720 },
                        };
                        console.log(`[AUDIT] Enabling Video Recording to: ${videoDir}`);
                    }

                    const preset = DEVICE_PRESETS[entry.options.devicePreset] || {};
                    const isMaximize =
                        entry.options.maximizeWindow && entry.options.devicePreset === 'Desktop';

                    if (isMaximize) {
                        console.log('[INFO] Applying viewport: null to maximize window');
                        contextOptions.viewport = null;
                    } else {
                        const devicePreset = entry.options.devicePreset || 'Desktop';
                        const w = Number(
                            devicePreset === 'Custom'
                                ? entry.options.width || 1280
                                : preset.width || 1280,
                        );
                        const h = Number(
                            devicePreset === 'Custom'
                                ? entry.options.height || 720
                                : preset.height || 720,
                        );
                        const isMobile =
                            devicePreset === 'Custom'
                                ? !!entry.options.isMobile
                                : !!preset.isMobile;
                        const hasTouch =
                            devicePreset === 'Custom'
                                ? !!entry.options.hasTouch
                                : !!preset.hasTouch;
                        const userAgent = devicePreset === 'Custom' ? null : preset.userAgent;

                        const dsf = Number(
                            entry.options.deviceScaleFactor || preset.deviceScaleFactor || 1,
                        );

                        console.log('=========================================================');
                        console.log(`[AUDIT] Creating Context for: ${devicePreset}`);
                        console.log(`[AUDIT] Effective Viewport: ${w}x${h}`);
                        console.log(`[AUDIT] Virtual Screen: ${w}x${h}`);
                        console.log(`[AUDIT] Device Scale Factor: ${dsf}`);
                        console.log(`[AUDIT] Mobile Mode: ${isMobile ? 'ACTIVE ✅' : 'OFF ❌'}`);
                        console.log(
                            `[AUDIT] Touch Events: ${hasTouch ? 'ENABLED 👆' : 'DISABLED'}`,
                        );
                        console.log('=========================================================');

                        contextOptions.viewport = { width: w, height: h };
                        contextOptions.screen = { width: w, height: h };
                        contextOptions.deviceScaleFactor = dsf;
                        contextOptions.isMobile = isMobile;
                        contextOptions.hasTouch = hasTouch;

                        if (userAgent) {
                            console.log(`[AUDIT] Identity (UA): ${userAgent.substring(0, 50)}...`);
                            contextOptions.userAgent = userAgent;
                        } else if (isMobile) {
                            contextOptions.userAgent =
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
                        }
                    }
                }
            }

            const httpCredentials = getHttpCredentials(browserId, browserService);
            if (httpCredentials) {
                contextOptions.httpCredentials = httpCredentials;
                console.log(
                    `[AUDIT] HTTP Auth enabled for: ${httpCredentials.username}${httpCredentials.origin ? ` (origin: ${httpCredentials.origin})` : ''}`,
                );
            }

            const newContext = await browser.newContext(contextOptions);
            console.log('[SUCCESS] Context created successfully');

            await newContext
                .addInitScript(DomProtectionEngine.getInstrumentationScript())
                .catch((e) => console.warn('[DOM Protection] addInitScript error:', e.message));

            await newContext
                .addInitScript(() => {
                    /* eslint-disable no-undef */
                    if (window.__hal_recorder_injected) return;
                    window.__hal_recorder_injected = true;

                    const init = () => {
                        if (document.getElementById('hal-interaction-recorder-overlay')) return;

                        const container = document.createElement('div');
                        container.id = 'hal-interaction-recorder-overlay';
                        container.style.position = 'fixed';
                        container.style.top = '0';
                        container.style.left = '0';
                        container.style.width = '0';
                        container.style.height = '0';
                        container.style.pointerEvents = 'none';
                        container.style.zIndex = '2147483647';

                        const shadow = container.attachShadow({ mode: 'open' });

                        const style = document.createElement('style');
                        style.textContent = `
                        .cursor {
                            position: fixed;
                            width: 20px;
                            height: 20px;
                            border: 2px solid rgba(99, 102, 241, 0.8);
                            background: rgba(99, 102, 241, 0.4);
                            border-radius: 50%;
                            pointer-events: none;
                            z-index: 2147483647;
                            transform: translate(-50%, -50%);
                            transition: width 0.1s, height 0.1s, background-color 0.1s;
                            display: none;
                        }
                        .cursor.active {
                            width: 14px;
                            height: 14px;
                            background: rgba(239, 68, 68, 0.8);
                            border-color: rgba(239, 68, 68, 1);
                        }
                        .ripple {
                            position: fixed;
                            width: 40px;
                            height: 40px;
                            border: 2px solid rgba(99, 102, 241, 1);
                            border-radius: 50%;
                            pointer-events: none;
                            z-index: 2147483646;
                            transform: translate(-50%, -50%) scale(0);
                            animation: hal-ripple-animation 0.5s ease-out forwards;
                        }
                        @keyframes hal-ripple-animation {
                            to {
                                transform: translate(-50%, -50%) scale(1.5);
                                opacity: 0;
                            }
                        }
                        .key-toast {
                            position: fixed;
                            bottom: 20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(15, 23, 42, 0.9);
                            color: #f1f5f9;
                            padding: 8px 16px;
                            border-radius: 8px;
                            font-family: monospace;
                            font-size: 14px;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            pointer-events: none;
                            z-index: 2147483647;
                            opacity: 0;
                            transition: opacity 0.2s;
                            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                        }
                        .key-toast.visible {
                            opacity: 1;
                        }
                        .step-badge {
                            position: fixed;
                            top: 15px;
                            right: 15px;
                            background: rgba(15, 23, 42, 0.9);
                            color: #6366f1;
                            border: 1px solid rgba(99, 102, 241, 0.3);
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-family: system-ui, -apple-system, sans-serif;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            pointer-events: none;
                            z-index: 2147483647;
                            opacity: 0;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            transform: translateY(-10px);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        }
                    `;
                        shadow.appendChild(style);

                        const cursor = document.createElement('div');
                        cursor.className = 'cursor';
                        shadow.appendChild(cursor);

                        const keyToast = document.createElement('div');
                        keyToast.className = 'key-toast';
                        shadow.appendChild(keyToast);

                        const stepBadge = document.createElement('div');
                        stepBadge.className = 'step-badge';
                        shadow.appendChild(stepBadge);

                        document.documentElement.appendChild(container);

                        let lastX = 0,
                            lastY = 0;

                        window.addEventListener(
                            'mousemove',
                            (e) => {
                                lastX = e.clientX;
                                lastY = e.clientY;
                                cursor.style.left = lastX + 'px';
                                cursor.style.top = lastY + 'px';
                                cursor.style.display = 'block';
                            },
                            { passive: true },
                        );

                        window.addEventListener(
                            'mousedown',
                            (e) => {
                                cursor.classList.add('active');

                                const ripple = document.createElement('div');
                                ripple.className = 'ripple';
                                ripple.style.left = e.clientX + 'px';
                                ripple.style.top = e.clientY + 'px';
                                shadow.appendChild(ripple);

                                setTimeout(() => {
                                    ripple.remove();
                                }, 500);
                            },
                            { passive: true },
                        );

                        window.addEventListener(
                            'mouseup',
                            () => {
                                cursor.classList.remove('active');
                            },
                            { passive: true },
                        );

                        let keyTimeout;
                        let typedText = '';
                        window.addEventListener(
                            'keydown',
                            (e) => {
                                if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

                                if (e.key === 'Backspace') {
                                    typedText = typedText.slice(0, -1);
                                } else if (e.key === 'Enter') {
                                    typedText += ' ↵';
                                } else if (e.key.length === 1) {
                                    typedText += e.key;
                                }

                                if (typedText) {
                                    keyToast.textContent = `Typed: ${typedText}`;
                                    keyToast.classList.add('visible');

                                    clearTimeout(keyTimeout);
                                    keyTimeout = setTimeout(() => {
                                        keyToast.classList.remove('visible');
                                        typedText = '';
                                    }, 1500);
                                }
                            },
                            { passive: true },
                        );

                        window.__hal_update_step = (label, status) => {
                            if (!label) {
                                stepBadge.style.opacity = '0';
                                stepBadge.style.transform = 'translateY(-10px)';
                                return;
                            }
                            let statusDot =
                                '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#6366f1;box-shadow:0 0 8px #6366f1;"></span>';
                            if (status === 'success') {
                                statusDot =
                                    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>';
                                stepBadge.style.color = '#10b981';
                                stepBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                            } else if (status === 'failed') {
                                statusDot =
                                    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span>';
                                stepBadge.style.color = '#ef4444';
                                stepBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            } else {
                                stepBadge.style.color = '#6366f1';
                                stepBadge.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            }
                            stepBadge.innerHTML = `${statusDot} ${label}`;
                            stepBadge.style.opacity = '1';
                            stepBadge.style.transform = 'translateY(0)';
                        };
                    };

                    if (document.body) {
                        init();
                    } else {
                        document.addEventListener('DOMContentLoaded', init);
                    }
                })
                .catch((e) => console.warn('[Visualizer] addInitScript error:', e.message));

            networkHistoryService.track(browserId, newContext);

            attachDialogListener(newContext);

            if (req.body?.securityObservability) {
                await attachSecurityContextListeners(newContext);
            }

            return newContext;
        } catch (err) {
            console.error('[ERROR] Could not create context:', err.message);
            throw new Error(`${req.t('actions.launch_browser.error')}: ${err.message}`);
        }
    }

    throw new Error(
        'The browser does not support creating contexts (newContext method not available)',
    );
}

async function getActivePage(req, browserId) {
    let validation = validateBrowser(req, browserId);
    if (validation.error) {
        try {
            console.log('[getActivePage] No active browser session. Auto-launching browser...');
            const launchOpts = {
                ...req.body,
                headless: req.body?.headless === true || req.body?.headless === 'true',
            };
            const { browserId: newId } = await browserService.launchBrowser(launchOpts);
            validation = validateBrowser(req, newId);
        } catch (e) {
            console.error('[getActivePage] Auto-launch failed:', e.message);
        }
    }

    if (validation.error) {
        const error = new Error(validation.message);
        error.status = validation.status;
        throw error;
    }

    const targetBrowserId = validation.browserId;
    const browserInstance = validation.entry.browser || validation.entry;

    if (typeof browserInstance.isConnected === 'function' && !browserInstance.isConnected()) {
        browserService.delete(targetBrowserId);
        const error = new Error(req.t('common.browser_disconnected'));
        error.status = 400;
        throw error;
    }

    const context = await getOrCreateContext(req, browserInstance, targetBrowserId);
    let pages = context.pages();
    if (pages.length === 0) {
        console.log('[getActivePage] No active pages found. Creating new page automatically.');
        await context.newPage();
        pages = context.pages();
    }

    const pageInstance = pages[pages.length - 1];

    if (pageInstance.isClosed && pageInstance.isClosed()) {
        const error = new Error(req.t('common.page_closed'));
        error.status = 400;
        throw error;
    }

    if (validation.entry.options && validation.entry.options.networkProfile) {
        if (!pageInstance._networkConditionsApplied) {
            await applyNetworkConditions(pageInstance, validation.entry.options);
            pageInstance._networkConditionsApplied = true;
        }
    }

    return { page: pageInstance, browserId: targetBrowserId, context };
}

async function fetchContext(req, browserId) {
    if (!browserId) return null;

    try {
        const validation = validateBrowser(req, browserId);
        if (validation.error) return null;

        const browserInstance = validation.entry.browser || validation.entry;
        const contexts = browserInstance.contexts();
        if (contexts.length === 0) return null;

        const pages = contexts[0].pages();
        if (pages.length === 0) return null;

        const activePage = pages[pages.length - 1];
        if (activePage.isClosed()) return null;

        const { default: selectorHealer } = await import('../services/SelectorHealer.js');
        const compressedDOM = await activePage.evaluate(selectorHealer.getCompressionScript());

        return compressedDOM;
    } catch (err) {
        console.warn('[AI Context] Failed to fetch auto-context:', err.message);
        return null;
    }
}

function isCIEnvironment() {
    return (
        process.env.HALTEST_RUNNER_MODE === 'ci' ||
        process.env.CI === 'true' ||
        process.env.HALTEST_MODE === 'ci' ||
        process.env.GITHUB_ACTIONS === 'true' ||
        process.env.GITLAB_CI === 'true' ||
        process.env.JENKINS_URL !== undefined
    );
}

/**
 * Attaches a JavaScript dialog listener to every page of a context/frame so
 * native browser dialogs (alert/confirm/prompt/beforeunload) are recorded in
 * page._dialogQueue. Installed unconditionally (independent of security
 * observability) so the "browser_dialog" node always has deterministic capture.
 */
function attachDialogListener(target) {
    const attachToPage = (page) => {
        if (page._dialogListenerAttached) return;
        page._dialogListenerAttached = true;
        page._dialogQueue = page._dialogQueue || [];
        page.on('dialog', async (dialog) => {
            const entry = {
                type: dialog.type(),
                message: dialog.message(),
                at: Date.now(),
            };
            page._dialogQueue.push(entry);
            const action = page._dialogDefaultAction || 'accept';
            const promptText = page._dialogPromptText;
            try {
                if (action === 'dismiss') {
                    await dialog.dismiss().catch(() => {});
                } else if (dialog.type() === 'prompt' && promptText !== undefined) {
                    await dialog.accept(String(promptText)).catch(() => {});
                } else {
                    await dialog.accept().catch(() => {});
                }
            } catch (err) {
                // dialog was already handled
            }
        });
    };

    if (target && target.pages && typeof target.pages === 'function') {
        // target is a BrowserContext
        try {
            if (!target._dialogListenerAttached) {
                target._dialogListenerAttached = true;
                target.on('page', (page) => {
                    page._dialogQueue = page._dialogQueue || [];
                    attachToPage(page);
                });
            }
            for (const page of target.pages()) attachToPage(page);
        } catch (err) {
            // context not listenable
        }
    } else if (target) {
        // target is a Page
        attachToPage(target);
    }
}

export {
    NETWORK_PRESETS,
    applyNetworkConditions,
    validateBrowser,
    attachSecurityContextListeners,
    attachDialogListener,
    getHttpCredentials,
    getOrCreateContext,
    getActivePage,
    fetchContext,
    isCIEnvironment,
};
