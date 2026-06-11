// controllers/action.controller.js - REFACTORED
// ==========================================================
// 🧠 Connectors of individual actions to Playwright
// ==========================================================

// import { callTool } from '../services/mcp.service.js';
import { browserService } from '../services/browser.service.js';
import { traceService } from '../services/trace.service.js';
import { networkHistoryService } from '../services/NetworkHistoryService.js';
import { variableManager } from '../services/VariableManager.js';
import aiService from '../services/AIService.js';
import experienceVaultService from '../services/ExperienceVaultService.js';
import { DEFAULT_LOCAL_MODEL } from '../services/LLMFactory.js';
import {
    emitExecutionStatus,
    emitScreenshotReady,
    emitLog,
    emitVariableChange,
    emitAutoHealingUpdate,
} from '../socket.js';
import { z } from 'zod';
import * as fsp from 'fs/promises';
// import * as fs from 'fs';
import * as path from 'path';
import { Flow, Node, Edge, HealingLog, Run } from '../database/init.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { STORAGE_RUNS_DIR, STORAGE_DIR } from '../config/paths.js';
import { isSafePath } from '../utils/security.js';
import { auditService } from '../services/AuditService.js';

// Create Variable Manager instance
// Use shared Variable Manager instance
// const variableManager = new VariableManager();

/**
 * Smartly emits logs to the frontend via socket
 */
const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

/**
 * Returns all captured variables from the manager
 */
export const getVariables = (req, res) => {
    try {
        const runId = req.query.runId || req.body?.runId;

        // Use specified runId, or fallback to the latest active run, or legacy flow
        let flowVariables = {};
        if (runId) {
            flowVariables = variableManager.getAll(runId);
        } else {
            // Check if there's an active run we can use for context
            const activeRunId = variableManager.getActiveRunId?.();
            if (activeRunId) {
                flowVariables = variableManager.getAll(activeRunId);
            } else {
                // Fallback: Return legacy_flow variables if no specific run is requested
                flowVariables = variableManager.getAll(null);
            }
        }

        const globalVariables = variableManager.getAll('global');

        res.json({
            success: true,
            data: {
                flow: flowVariables,
                global: globalVariables,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error retrieving variables: ${error.message}`,
        });
    }
};

// ==========================================================
import { DEVICE_PRESETS } from '../utils/constants.js';

// ==========================================================
// NETWORK PRESETS & UTILITIES
// ==========================================================

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

/**
 * Applies network conditions to a page using CDP
 */
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
// ==========================================================
// CONFIGURATION AND CONSTANTS
// ==========================================================

// Storage directory for artifacts (disabled)
// const storageDir = path.resolve('./storages');

// ==========================================================
// BASIC UTILITIES
// ==========================================================

/**
 * Handles browser error and console events, writing logs.
 */
// const handleBrowserEvent = (type, event, logToFile, finalPath) => {
// };

// ==========================================================
// VALIDATION AND CONTEXT UTILITIES
// ==========================================================

/**
 * Common browser validation using the service
 */
function validateBrowser(req, browserId) {
    const ids = Array.from(browserService.keys());

    // Fallback strategy:
    // 1. If explicit ID exists and is valid, use it.
    // 2. If ID is missing/invalid but sessions exist, use the latest one.
    // 3. Otherwise, fail (caller can then choose to auto-launch).

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

/**
 * Get or create context efficiently
 */
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
                    // Test context health - this prevents 'guid not bound' errors
                    await ctx.pages();
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
            // Retrieve launch options to apply viewport and mobile settings
            let contextOptions = {};

            if (browserId) {
                const entry = browserService.get(browserId);
                if (entry && entry.options) {
                    console.log(
                        '[INFO] Found launch options for browser:',
                        JSON.stringify(entry.options, null, 2),
                    );

                    // --- Enable Video Recording if requested ---
                    const runId = req.body.runId;
                    const recordVideo = entry.options.recordVideo !== false; // Default to true

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
                            // Fallback generic mobile UA if custom but mobile
                            contextOptions.userAgent =
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
                        }
                    }
                }
            }

            const newContext = await browser.newContext(contextOptions);
            console.log('[SUCCESS] Context created successfully');

            // Track background network history to avoid race conditions in sequential nodes
            networkHistoryService.track(browserId, newContext);

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

/**
 * Validates and retrieves the active page, context, and browser ID.
 */
async function getActivePage(req, browserId) {
    const validation = validateBrowser(req, browserId);
    if (validation.error) {
        const error = new Error(validation.message);
        error.status = validation.status;
        throw error;
    }

    const targetBrowserId = validation.browserId;
    const browserInstance = validation.entry.browser || validation.entry;

    // Verify browser connection
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

    // Use the last active page as the target
    const pageInstance = pages[pages.length - 1];

    if (pageInstance.isClosed && pageInstance.isClosed()) {
        const error = new Error(req.t('common.page_closed'));
        error.status = 400;
        throw error;
    }

    // --- Apply Launch Network Conditions if present ---
    if (validation.entry.options && validation.entry.options.networkProfile) {
        if (!pageInstance._networkConditionsApplied) {
            await applyNetworkConditions(pageInstance, validation.entry.options);
            pageInstance._networkConditionsApplied = true;
        }
    }

    return { page: pageInstance, browserId: targetBrowserId, context };
}

/**
 * Automatically retrieves and compresses the DOM context if a browser is available.
 * Used to enhance AI prompts with page state for Zero-Config experience.
 */
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

/**
 * Generic wrapper for Playwright actions.
 */
async function executePlaywrightAction(req, res, actionName, actionLogic) {
    let targetBrowserId;
    const start = Date.now();
    const runId = req.body.runId; // Extract runId if present
    const nodeId = req.body.nodeId; // Extract nodeId if present
    const useExperienceVault = req.headers?.['x-hal-experience-vault'] !== 'false';
    const enableFineTuning = req.headers?.['x-hal-fine-tuning'] === 'true';
    let simplifiedDOMBefore = null;

    // --- VARIABLE RESOLUTION ---
    // Deeply interpolate variables in the request body before any logic
    const opts = variableManager.resolveRecursive(req.body, runId); // Pass runId for isolation

    // Ensure continueOnError and takeScreenshot are strictly boolean
    if (opts.continueOnError === 'true' || opts.continueOnError === '1')
        opts.continueOnError = true;
    if (opts.continueOnError === 'false' || opts.continueOnError === '0')
        opts.continueOnError = false;

    if (opts.takeScreenshot === 'true' || opts.takeScreenshot === '1') opts.takeScreenshot = true;
    if (opts.takeScreenshot === 'false' || opts.takeScreenshot === '0') opts.takeScreenshot = false;

    // Coerce numeric parameters if they are strings
    const numParams = ['timeout', 'delay', 'slowMo', 'amount', 'maxScrolls', 'x', 'y'];
    for (const key of numParams) {
        if (opts[key] !== undefined && opts[key] !== null && opts[key] !== '') {
            const parsed = Number(opts[key]);
            if (!isNaN(parsed)) {
                opts[key] = parsed;
            }
        }
    }

    // --- LABEL SAFETY NET ---
    let finalLabel = opts.label || req.body.label || req.body.customLabel;

    if (!finalLabel && nodeId) {
        try {
            // DB-aware resolution: If label is missing from the payload, fetch it from source
            const nodeRecord = await Node.findOne({ where: { nodeId } });
            if (nodeRecord && nodeRecord.data) {
                finalLabel = nodeRecord.data.customLabel || nodeRecord.data.label;
                console.log(
                    `[ActionController] [DEBUG] Recovered label from DB for ${nodeId}: "${finalLabel}"`,
                );
            }
        } catch (dbErr) {
            console.warn(
                '[ActionController] [WARN] Failed to recover label from DB:',
                dbErr.message,
            );
        }
    }

    const label = finalLabel || nodeId || actionName;
    console.log(
        `[ActionController] [DEBUG] Resolved Label for execution: "${label}" (Action: ${actionName})`,
    );
    // -------------------------

    // Diagnostic Log: Highlight what the backend actually "sees" after interpolation
    if (actionName === 'type_text') {
        console.log(
            `[ActionController] [DEBUG] ${actionName} text: "${req.body.text}" -> "${opts.text}" (RunId: ${runId || 'None'})`,
        );
    } else {
        console.log(`[ActionController] [DEBUG] actionName=${actionName} options resolved.`);
    }
    // ---------------------------

    let page, context;

    if (nodeId) {
        req._socketStatusHandled = true; // Flag: prevent middleware double-emission
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
        smartEmitLog(`Executing ${actionName}...`, 'info', nodeId);
    }

    // --- IMPLICIT LAUNCH (Debug Mode) ---
    // If running in debug mode (Run Node) and no browser is open, launch one automatically.
    if (
        actionName !== 'launch_browser' &&
        opts.debugMode &&
        !opts.browserId &&
        Array.from(browserService.keys()).length === 0
    ) {
        console.log(
            '[Implicit Launch] Debug mode detected with no active browser. Launching default...',
        );
        try {
            const { browserId } = await browserService.launchBrowser({
                ...opts,
                headless: false, // Default to visible for debug
            });
            opts.browserId = browserId;
            req.body.browserId = browserId; // Propagate to validation
            targetBrowserId = browserId;
        } catch (err) {
            console.error('[Implicit Launch] Failed:', err);
            // Fallthrough to normal validation which will likely error
        }
    }
    // ------------------------------------

    try {
        // 1. Get resources (browser, page, context)
        const isBrowserAction = ['launch_browser', 'close_browser'].includes(actionName);
        const isContextAction = [
            'create_context',
            'close_context',
            'inject_tokens',
            'persist_session',
            'manage_cookies',
            'manage_storage',
            'modify_headers',
            'manage_tabs',
        ].includes(actionName);

        if (!isBrowserAction && !isContextAction && actionName !== 'open_url') {
            ({
                page,
                browserId: targetBrowserId,
                context,
            } = await getActivePage(req, opts.browserId));
            // browser = context.browser(); // Unused

            if (page && !page.isClosed() && enableFineTuning) {
                try {
                    const { default: selectorHealer } =
                        await import('../services/SelectorHealer.js');
                    simplifiedDOMBefore = await page.evaluate(
                        selectorHealer.getCompressionScript(),
                        opts.selector,
                    );
                } catch (domErr) {
                    console.warn(
                        '[AuditService] Failed to capture DOM before action:',
                        domErr.message,
                    );
                }
            }
        } else if (opts.browserId) {
            const validation = validateBrowser(req, opts.browserId);
            if (!validation.error) {
                // browser = validation.entry.browser || validation.entry; // Unused
                targetBrowserId = validation.browserId;

                // Fix: Ensure context is available for context actions
                if (isContextAction) {
                    const browserInstance = validation.entry.browser || validation.entry;
                    context = await getOrCreateContext(req, browserInstance, targetBrowserId);
                }
            }
        }

        // 2. Execute specific action logic
        const result = await actionLogic(page, opts, targetBrowserId, context);

        const duration = Date.now() - start;
        const finalMessage = result.message || `${actionName} completed successfully`;

        // 3. Register Traceability
        if (actionName !== 'launch_browser' && actionName !== 'open_url') {
            traceService.add({
                action: actionName,
                browserId: targetBrowserId,
                status: 'success',
                durationMs: duration,
                ...result.traceDetails,
            });
        }

        smartEmitLog(`${finalMessage} (${duration}ms)`, 'success', nodeId);

        // --- FLIGHT RECORDER: Optional Screenshot on Success ---
        console.log(
            `[FlightRecorder] Check: takeScreenshot=${opts.takeScreenshot}, runId=${runId}, nodeId=${nodeId}`,
        );
        let screenshotPath = null;
        if (opts.takeScreenshot && page && !page.isClosed() && nodeId) {
            try {
                const effectiveRunId = runId || 'debug';
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, effectiveRunId);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                // Forensic Standard: {runId}/{nodeId}.png
                const filename = `${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath, animations: 'disabled' });
                screenshotPath = `storage/runs/${effectiveRunId}/${filename}`;
                console.log(`[FlightRecorder] Screenshot saved: ${screenshotPath}`);

                // Emit real-time update to frontend
                emitScreenshotReady({ nodeId, screenshotPath, runId: effectiveRunId });
            } catch (err) {
                console.warn(
                    '[WARN] FlightRecorder: Failed to capture success screenshot',
                    err.message,
                );
            }
        }

        // --- FLIGHT RECORDER: Log Success ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'success',
                    duration,
                    input: opts,
                    output: result.data || result.traceDetails,
                    screenshot: screenshotPath,
                    videoTimestamp: req.body.runStartTime
                        ? (Date.now() - req.body.runStartTime) / 1000
                        : null,
                },
            );
        }
        // ------------------------------------

        // --- JSONL AUDIT LOGGING ---
        if (enableFineTuning) {
            try {
                await auditService.logStep({
                    input: opts,
                    domBefore: simplifiedDOMBefore,
                    action: actionName,
                    selector: opts.selector || null,
                    assertionResult: {
                        success: true,
                        status: 'success',
                        message: finalMessage,
                        data: result.data || result.traceDetails || null,
                    },
                    runId,
                    nodeId,
                });
            } catch (auditErr) {
                console.error('[AuditService] Failed to write audit log:', auditErr.message);
            }
        }

        // 4. Respond
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'success' });
        }

        // --- VARIABLE PERSISTENCE ---
        // Save result to variableManager for downstream reuse using normalized storage
        const nodeLabel = label; // Use the robustly resolved label from the beginning
        if (result && result.success !== false) {
            // Standardize output: Ensure status is present for conditional logic
            const nodeResult = result.data || result;
            if (typeof nodeResult === 'object' && nodeResult !== null) {
                if (!nodeResult.status) nodeResult.status = 'success';
                if (nodeResult.recovered === undefined) nodeResult.recovered = false;
            }

            if (nodeId) {
                variableManager.storeNodeResult(
                    nodeId,
                    { label: nodeLabel, customLabel: nodeLabel },
                    nodeResult,
                    runId,
                );
            } else {
                variableManager.set(`${nodeLabel}.result`, nodeResult, runId);
            }
            console.log(
                `[ActionController] Saved normalized result for "${nodeLabel}" to variableManager (Run: ${runId})`,
            );
        }
        // ----------------------------

        // --- EXPERIENCE VAULT: Proactive Learning ---
        if (useExperienceVault && !opts.isSubStep && opts.selector && opts.nodeId) {
            // Determine context
            let contextName = 'Global';
            if (opts.flowId) {
                try {
                    const flow = await Flow.findByPk(opts.flowId);
                    if (flow) contextName = flow.name;
                } catch (e) {
                    console.warn(
                        `[ActionController] Failed to fetch flow name for context: ${e.message}`,
                    );
                }
            }

            // Proactive Storage: Save successful selector for future reference
            experienceVaultService
                .saveMemory({
                    context: contextName,
                    url: page?.url() || '',
                    nodeId: opts.nodeId,
                    problemSelector: opts.selector,
                    solutionSelector: opts.selector, // Baseline: it worked as is
                    reasoning: 'Verified successful execution (Baseline).',
                    confidence: 1.0,
                })
                .then((saved) => {
                    if (saved) {
                        emitLog({
                            message: `[Experience-Vault] 💾 Storing successful selector: "${opts.selector}"`,
                            nodeId: opts.nodeId,
                            type: 'info',
                        });
                        emitLog({
                            message: `[Experience-Vault] 🔗 Linked to node: ${opts.nodeId}`,
                            nodeId: opts.nodeId,
                            type: 'info',
                        });
                    }
                })
                .catch((e) =>
                    console.error('[Experience-Vault] Failed to store baseline:', e.message),
                );
        }

        return res.status(200).json({
            success: true,
            status: 'success',
            recovered: false,
            message: result.message,
            browserId: targetBrowserId,
            durationMs: duration,
            data: result.data || {},
            screenshot: screenshotPath, // FIX: Return screenshot path to frontend
            ...result.responseExtra,
        });
    } catch (error) {
        // Clean HTML entities from error message (Playwright sometimes escapes them)
        const errorMessage = (error.message || 'Unknown selector error').replace(/&quot;/g, '"');
        const isActionFailure =
            errorMessage.includes('Timeout') ||
            errorMessage.includes('selector') ||
            errorMessage.includes('waiting');
        const status = error.status || (isActionFailure ? 400 : 500);
        const duration = Date.now() - start;

        // --- SELF-HEALING LOGIC ---
        // Check if error is "Element not found" or Timeout
        const isSelectorError =
            errorMessage.includes('Timeout') ||
            errorMessage.includes('waiting for selector') ||
            errorMessage.includes('element is not visible') ||
            errorMessage.includes('no element found') ||
            errorMessage.includes('Unexpected token') ||
            errorMessage.includes('parsing css selector') ||
            errorMessage.includes('is not a valid selector');

        if (
            isSelectorError &&
            opts.selector &&
            (runId || opts.debugMode) &&
            !opts.continueOnError
        ) {
            const healingStart = Date.now();
            emitLog({
                message: `[Self-Healing] 🚨 Failure detected for: "${opts.selector}". Error: ${errorMessage.substring(0, 50)}...`,
                nodeId: opts.nodeId,
                type: 'warning',
            });

            const HEALING_HARD_CAP_MS = 60000;

            const healingPromise = (async () => {
                try {
                    const validation = validateBrowser(req, targetBrowserId || opts.browserId);
                    if (validation.error) throw new Error(validation.message);

                    const browserInstance = validation.entry.browser || validation.entry;
                    const browserContexts = browserInstance.contexts();
                    const currentPage = browserContexts[0]?.pages().at(-1);

                    if (!currentPage || currentPage.isClosed()) {
                        throw new Error('No active page available for healing');
                    }

                    const aiConfig = {
                        apiKey: req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY,
                        provider: req.headers['x-ai-provider'] || 'ollama',
                        model: req.headers['x-ai-model'],
                        baseUrl: req.headers['x-ai-base-url'],
                    };

                    let diagnosis = null;
                    let contextName = 'Global';

                    // --- 1. MEMORY PALACE: Priority Search ---
                    if (useExperienceVault) {
                        emitLog({
                            message: `[Experience-Vault] 🔍 Checking stored selectors for: ${opts.selector}...`,
                            nodeId: opts.nodeId,
                            type: 'info',
                        });

                        if (opts.flowId) {
                            const flow = await Flow.findByPk(opts.flowId);
                            if (flow) contextName = flow.name;
                        }

                        diagnosis = await experienceVaultService.findMemory(
                            opts.selector,
                            contextName,
                            currentPage.url(),
                            opts.nodeId,
                        );

                        if (diagnosis) {
                            if (diagnosis.source === 'memory_node') {
                                emitLog({
                                    message: `[Experience-Vault] ✅ Match found: "${diagnosis.correctedSelector}"`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                                emitLog({
                                    message: `[Self-Healing] ♻️ Replacing selector with stored value from Experience Vault`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                            } else {
                                emitLog({
                                    message: `[Experience-Vault] ✅ Solution found in memory. Source: ${contextName}.`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                            }
                            diagnosis.source = 'memory';
                        } else {
                            emitLog({
                                message: `[Experience-Vault] ❌ No previous solution found in history for "${opts.selector}".`,
                                nodeId: opts.nodeId,
                                type: 'info',
                            });
                        }
                    }

                    // --- 2. AI REPAIR: Fallback ---
                    if (!diagnosis) {
                        emitLog({
                            message: `[Self-Healing] 🤖 Escalating to IA (${aiConfig.provider}/${aiConfig.model || 'default'}). Analyzing DOM...`,
                            nodeId: opts.nodeId,
                            type: 'info',
                        });

                        const { default: selectorHealer } =
                            await import('../services/SelectorHealer.js');
                        diagnosis = await selectorHealer.heal({
                            page: currentPage,
                            originalSelector: opts.selector,
                            errorMessage,
                            actionName,
                            timeout: 55000,
                            aiConfig,
                            onProgress: (p) => {
                                if (p.step === 'verifying_candidate') {
                                    emitLog({
                                        message: `[Self-Healing] 🔍 Testing candidate ${p.index}/${p.total}: "${p.candidate}"...`,
                                        nodeId: opts.nodeId,
                                        type: 'info',
                                    });
                                } else if (p.step === 'candidate_success') {
                                    emitLog({
                                        message: `[Self-Healing] ✅ Match found: "${p.candidate}" (${p.unique ? 'Unique' : 'Multiple matches'})`,
                                        nodeId: opts.nodeId,
                                        type: 'success',
                                    });
                                }
                            },
                        });
                        diagnosis.source = 'ai';

                        if (diagnosis.metadata) {
                            emitLog({
                                message: `[Self-Healing] 📊 IA Metadata: DOM Size=${diagnosis.metadata.domSize} chars, AI Time=${diagnosis.metadata.aiResponseTime}ms, Candidates=${diagnosis.metadata.candidateCount}`,
                                nodeId: opts.nodeId,
                                type: 'info',
                            });
                        }
                    }

                    // --- 3. REPAIR EVALUATION ---
                    if (
                        diagnosis?.correctedSelector &&
                        diagnosis.correctedSelector !== opts.selector
                    ) {
                        emitLog({
                            message: `[Self-Healing] 🩹 New selector: "${diagnosis.correctedSelector}" (Confidence: ${Math.round(diagnosis.confidence * 100)}%)`,
                            nodeId: opts.nodeId,
                            type: 'success',
                        });

                        // PERSISTENCE: Save to Node and Experience Vault
                        try {
                            if (opts.nodeId) {
                                const node = await Node.findByPk(opts.nodeId);
                                if (node) {
                                    const oldData = node.data || {};
                                    const oldConfig = oldData.configuration || {};

                                    await node.update({
                                        data: {
                                            ...oldData,
                                            configuration: {
                                                ...oldConfig,
                                                selector: diagnosis.correctedSelector,
                                                healed: true,
                                                healedFrom: diagnosis.source,
                                                originalValue: opts.selector,
                                                healedValue: diagnosis.correctedSelector,
                                                aiReasoning: diagnosis.reasoning,
                                                healingConfidence: diagnosis.confidence,
                                            },
                                        },
                                    });
                                    console.log(
                                        `[Self-Healing] Persistent repair saved for node: ${opts.nodeId}`,
                                    );
                                }
                            }

                            if (diagnosis.source === 'ai' && useExperienceVault) {
                                const saved = await experienceVaultService.saveMemory({
                                    context: contextName,
                                    url: currentPage.url(),
                                    nodeId: opts.nodeId,
                                    problemSelector: opts.selector,
                                    solutionSelector: diagnosis.correctedSelector,
                                    reasoning: diagnosis.reasoning,
                                    confidence: diagnosis.confidence,
                                });

                                if (saved) {
                                    emitLog({
                                        message: `[Experience-Vault] ✨ New solution successfully persisted to the vault.`,
                                        nodeId: opts.nodeId,
                                        type: 'success',
                                    });
                                }
                            }

                            await HealingLog.create({
                                nodeId: opts.nodeId,
                                runId,
                                originalSelector: opts.selector,
                                newSelector: diagnosis.correctedSelector,
                                confidence: diagnosis.confidence,
                                reasoning: diagnosis.reasoning,
                                verified: !!diagnosis.verified,
                            });
                        } catch (pErr) {
                            console.error('[Self-Healing] Persistence failed:', pErr.message);
                        }

                        // NOTIFICATION: Broadcast to UI
                        emitAutoHealingUpdate({
                            nodeId: opts.nodeId,
                            originalSelector: opts.selector,
                            newSelector: diagnosis.correctedSelector,
                            source: diagnosis.source,
                            reasoning: diagnosis.reasoning,
                        });

                        // RETRY
                        const retryResult = await actionLogic(
                            currentPage,
                            { ...opts, selector: diagnosis.correctedSelector },
                            targetBrowserId,
                            context,
                        );
                        const totalDuration = Date.now() - healingStart;

                        emitLog({
                            message: `[Self-Healing] 🎉 Repair successful! Total time: ${totalDuration}ms`,
                            nodeId: opts.nodeId,
                            type: 'success',
                        });

                        if (runId && opts.nodeId) {
                            await executionLogger.logStep(
                                runId,
                                { id: opts.nodeId, type: actionName },
                                {
                                    status: 'healed',
                                    duration: totalDuration,
                                    input: { ...opts, selector: diagnosis.correctedSelector },
                                    output: retryResult.data || retryResult,
                                    memoryHit: diagnosis.source === 'memory',
                                    aiDiagnosis: diagnosis.reasoning,
                                },
                            );
                        }

                        // --- JSONL AUDIT LOGGING (HEALED SUCCESS) ---
                        if (enableFineTuning) {
                            try {
                                await auditService.logStep({
                                    input: opts,
                                    domBefore: simplifiedDOMBefore,
                                    action: actionName,
                                    selector: diagnosis.correctedSelector,
                                    assertionResult: {
                                        success: true,
                                        status: 'healed',
                                        message: `Healed: ${retryResult.message}`,
                                        source: diagnosis.source,
                                        reasoning: diagnosis.reasoning,
                                        data: retryResult.data || retryResult,
                                    },
                                    runId,
                                    nodeId: opts.nodeId,
                                });
                            } catch (auditErr) {
                                console.error(
                                    '[AuditService] Failed to write healed audit log:',
                                    auditErr.message,
                                );
                            }
                        }

                        if (opts.nodeId) {
                            emitExecutionStatus({ stepId: opts.nodeId, status: 'healed' });
                        }

                        return res.status(200).json({
                            success: true,
                            status: 'healed',
                            recovered: true,
                            message: `Healed: ${retryResult.message}`,
                            browserId: targetBrowserId,
                            durationMs: totalDuration,
                            data: {
                                ...(retryResult.data || retryResult),
                                healed: true,
                                source: diagnosis.source,
                            },
                        });
                    } else {
                        emitLog({
                            message: `[Self-Healing] ❌ Repair failed: ${diagnosis?.reasoning || 'No solution found.'}`,
                            nodeId: opts.nodeId,
                            type: 'error',
                        });
                    }
                } catch (err) {
                    emitLog({
                        message: `[Self-Healing] ⚠️ Critical error in repair: ${err.message}`,
                        nodeId: opts.nodeId,
                        type: 'error',
                    });
                }
            })();

            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve('__TIMEOUT__'), HEALING_HARD_CAP_MS),
            );

            const outcome = await Promise.race([healingPromise, timeoutPromise]);
            if (outcome === '__TIMEOUT__') {
                emitLog({
                    message: `[Self-Healing] ⏱️ Repair aborted (Hard cap of ${HEALING_HARD_CAP_MS / 1000}s exceeded).`,
                    nodeId: opts.nodeId,
                    type: 'error',
                });
            } else if (res.headersSent) {
                return;
            }
        }
        // --------------------------

        // --- FLIGHT RECORDER: Log Failure (Initial) ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'failed',
                    duration,
                    input: opts,
                    error: errorMessage,
                    videoTimestamp: req.body.runStartTime
                        ? (Date.now() - req.body.runStartTime) / 1000
                        : null,
                },
            );
        }
        // ------------------------------------

        // Clean up the browser if the error is connection/closed related
        if (
            targetBrowserId &&
            (errorMessage.includes('disconnected') ||
                errorMessage.includes('closed') ||
                errorMessage.includes('desconectado') ||
                errorMessage.includes('cerrado'))
        ) {
            browserService.delete(targetBrowserId);
        }

        // 5. Register Error Traceability
        traceService.add({
            action: actionName,
            browserId: targetBrowserId || opts.browserId,
            status: 'error',
            error: errorMessage,
            selector: opts.selector,
        });

        // --- FLIGHT RECORDER: Forensic Capture (Auto-error Screenshot) ---
        let errorScreenshotPath = null;
        if (page && !page.isClosed() && opts.takeScreenshot !== false) {
            try {
                // Use structured storage: storage/runs/{runId}/error_{nodeId}_{timestamp}.png
                const runFolder = runId || 'orphan';
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runFolder);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                // Forensic Standard: {runId}/{nodeId}.png
                const filename = `${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath });
                errorScreenshotPath = `storage/runs/${runFolder}/${filename}`;
                console.log(`[FlightRecorder] Forensic screenshot saved: ${errorScreenshotPath}`);
            } catch (err) {
                console.warn(
                    '[WARN] FlightRecorder: Failed to capture failure screenshot',
                    err.message,
                );
            }
        }

        // --- SOFT FAIL (CONTINUE ON ERROR) LOGIC ---
        if (opts.continueOnError) {
            console.log(
                `[ActionController] Soft Fail enabled for ${actionName}. Carrying result to next node...`,
            );

            // Broadcast warning instead of error
            smartEmitLog(
                `[NodeError] NodeId=${nodeId} Type=${actionName} Error="${errorMessage}"`,
                'warning',
                nodeId,
            );
            if (nodeId) {
                emitExecutionStatus({
                    stepId: nodeId,
                    status: 'softfailed', // Keep failed visual in UI
                    error: errorMessage,
                });
            }

            // PERSIST FAILED STATE TO VARIABLE MANAGER
            const nodeLabel = label || nodeId || actionName;
            const errorResult = {
                status: 'softfailed',
                success: false,
                recovered: false,
                error: errorMessage,
                durationMs: duration,
                screenshot: errorScreenshotPath,
            };
            if (nodeId) {
                variableManager.storeNodeResult(
                    nodeId,
                    { label: nodeLabel, customLabel: nodeLabel },
                    errorResult,
                    runId,
                );
            } else {
                variableManager.set(`${nodeLabel}.result`, errorResult, runId);
            }

            // RETURN SUCCESS TO MOTOR (Trick Motor into continuing)
            return res.status(200).json({
                success: true,
                status: 'softfailed',
                recovered: false,
                message: `Soft Fail: ${errorMessage}`,
                browserId: targetBrowserId,
                durationMs: duration,
                data: errorResult,
                screenshot: errorScreenshotPath,
            });
        }
        // -------------------------------------------

        // Standard Hard Failure Respond
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'failed', error: errorMessage });
            smartEmitLog(
                `[NodeError] NodeId=${nodeId} Type=${actionName} Error="${errorMessage}"`,
                'error',
                nodeId,
            );
        }
        return res.status(status).json({
            success: false,
            status: 'failed',
            recovered: false,
            message: errorMessage || `${req.t('common.error_internal')} (${actionName})`,
            error: errorMessage,
            selector: opts.selector,
        });
    }
}

// ==========================================================
// INITIALIZATION ACTIONS
// ==========================================================

export const launchBrowserAction = async (req, res) => {
    const nodeId = req.body.nodeId;
    const runId = req.body.runId;
    const start = Date.now();
    if (nodeId) {
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
        smartEmitLog('Launching browser...', 'info', nodeId);
    }

    let launchedBrowserId = null;

    try {
        // --- VARIABLE RESOLUTION ---
        const resolvedBody = variableManager.resolveRecursive(req.body, runId);

        // Coerce types
        if (
            resolvedBody.slowMo !== undefined &&
            resolvedBody.slowMo !== null &&
            resolvedBody.slowMo !== ''
        ) {
            const parsed = Number(resolvedBody.slowMo);
            if (!isNaN(parsed)) resolvedBody.slowMo = parsed;
        }
        if (
            resolvedBody.timeout !== undefined &&
            resolvedBody.timeout !== null &&
            resolvedBody.timeout !== ''
        ) {
            const parsed = Number(resolvedBody.timeout);
            if (!isNaN(parsed)) resolvedBody.timeout = parsed;
        }
        if (
            resolvedBody.width !== undefined &&
            resolvedBody.width !== null &&
            resolvedBody.width !== ''
        ) {
            const parsed = Number(resolvedBody.width);
            if (!isNaN(parsed)) resolvedBody.width = parsed;
        }
        if (
            resolvedBody.height !== undefined &&
            resolvedBody.height !== null &&
            resolvedBody.height !== ''
        ) {
            const parsed = Number(resolvedBody.height);
            if (!isNaN(parsed)) resolvedBody.height = parsed;
        }

        if (resolvedBody.headless === 'true' || resolvedBody.headless === '1')
            resolvedBody.headless = true;
        if (resolvedBody.headless === 'false' || resolvedBody.headless === '0')
            resolvedBody.headless = false;

        if (resolvedBody.maximizeWindow === 'true' || resolvedBody.maximizeWindow === '1')
            resolvedBody.maximizeWindow = true;
        if (resolvedBody.maximizeWindow === 'false' || resolvedBody.maximizeWindow === '0')
            resolvedBody.maximizeWindow = false;

        // --- PERSISTENT BROWSER (Debug Mode) ---
        const { debugMode } = resolvedBody;
        if (debugMode) {
            const latestBrowser = browserService.getLatest();
            const latestId = Array.from(browserService.keys()).pop();

            // Reuse if exists and is connected, AND options match
            if (latestBrowser && latestBrowser.browser.isConnected()) {
                const oldOpts = latestBrowser.options || {};
                const newOpts = resolvedBody || {};

                // Detect changes that require a browser restart
                const hasChanges =
                    oldOpts.devicePreset !== newOpts.devicePreset ||
                    oldOpts.width !== newOpts.width ||
                    oldOpts.height !== newOpts.height ||
                    oldOpts.isMobile !== newOpts.isMobile ||
                    oldOpts.maximizeWindow !== newOpts.maximizeWindow ||
                    oldOpts.headless !== newOpts.headless;

                if (!hasChanges) {
                    console.log('[ACTION] Reusing existing browser (Debug Mode)');
                    smartEmitLog(
                        `Reusing browser (${oldOpts.devicePreset || 'Desktop'})`,
                        'info',
                        nodeId,
                    );
                    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });
                    return res.status(200).json({
                        success: true,
                        message: 'Browser reused (Debug Mode)',
                        browserId: latestId,
                        reused: true,
                        headless: latestBrowser.options.headless || false,
                    });
                } else {
                    console.log(
                        `[ACTION] Options changed (${oldOpts.devicePreset} -> ${newOpts.devicePreset}), restarting browser...`,
                    );
                    smartEmitLog(
                        `Preset changed to ${newOpts.devicePreset}, restarting...`,
                        'info',
                        nodeId,
                    );
                    await browserService.delete(latestId).catch(() => {});
                }
            }
        }
        // ---------------------------------------

        console.log(
            '[ACTION] Starting browser launch with options:',
            JSON.stringify(resolvedBody, null, 2),
        );
        const { browserId, version } = await browserService.launchBrowser(resolvedBody);
        launchedBrowserId = browserId;

        // Update Run record with browser version if we are in a run
        if (runId) {
            try {
                const run = await Run.findByPk(runId);
                if (run) {
                    await run.update({ browser_version: version });
                }
            } catch (err) {
                console.warn(
                    '[FlightRecorder] Failed to update run with browser version:',
                    err.message,
                );
            }
        }

        const duration = Date.now() - start;

        console.log(`[SUCCESS] Browser launched with ID: ${browserId} (v${version})`);
        smartEmitLog(`Browser launched with ID: ${browserId}`, 'success', nodeId);
        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        // --- FLIGHT RECORDER: Log Success ---
        if (runId && nodeId) {
            console.log(`[FlightRecorder] Saving step result for run ${runId}, node ${nodeId}`);
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: 'launch_browser' },
                {
                    status: 'success',
                    duration,
                    input: resolvedBody,
                    output: { browserId },
                },
            );
            console.log(`[FlightRecorder] Step result saved successfully`);
        }
        // ------------------------------------

        traceService.add({ action: 'launch_browser', browserId, status: 'success' });

        return res.status(200).json({
            success: true,
            message: req.t('actions.launch_browser.success'),
            browserId,
            headless: resolvedBody.headless || false,
        });
    } catch (error) {
        if (launchedBrowserId) {
            console.log(`[ACTION] Cleaning up launched browser ${launchedBrowserId} after error`);
            await browserService.delete(launchedBrowserId).catch((err) => {
                console.error(`[ACTION] Failed to cleanup browser session: ${err.message}`);
            });
        }
        const duration = Date.now() - start;
        console.error('[ERROR] Failed to launch browser:', error.message);
        smartEmitLog(`Browser launch failed: ${error.message}`, 'error', nodeId);
        if (nodeId)
            emitExecutionStatus({
                stepId: nodeId,
                status: 'failed',
                error: error.message,
            });

        // --- FLIGHT RECORDER: Log Failure ---
        if (runId && nodeId) {
            executionLogger.logStep(
                runId,
                { id: nodeId, type: 'launch_browser' },
                {
                    status: 'failed',
                    duration,
                    input: req.body,
                    error: error.message,
                },
            );
        }
        // ------------------------------------

        return res.status(500).json({
            success: false,
            message: req.t('actions.launch_browser.error'),
            error: error.message,
            hint:
                error.message.includes('Zygote') || error.message.includes('HistoryService')
                    ? 'System resource limit or zombie process conflict. Try restarting the application.'
                    : 'Check if another browser instance is blocking execution.',
        });
    }
};

export const openUrlAction = async (req, res) => {
    const actionName = 'open_url';
    const start = Date.now();
    let browserId;
    const nodeId = req.body.nodeId;
    const runId = req.body.runId;
    if (nodeId) {
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
        smartEmitLog('Opening URL...', 'info', nodeId);
    }

    try {
        // --- VARIABLE RESOLUTION ---
        const opts = variableManager.resolveRecursive(req.body, runId);

        // Coerce booleans
        if (opts.takeScreenshot === 'true' || opts.takeScreenshot === '1')
            opts.takeScreenshot = true;
        if (opts.takeScreenshot === 'false' || opts.takeScreenshot === '0')
            opts.takeScreenshot = false;

        // Coerce timeout if string
        if (opts.timeout !== undefined && opts.timeout !== null && opts.timeout !== '') {
            const parsed = Number(opts.timeout);
            if (!isNaN(parsed)) {
                opts.timeout = parsed;
            }
        }

        // --- TIMEOUT & NAVIGATION SETTINGS ---
        let { url, waitUntil = 'domcontentloaded', timeout = 30000, takeScreenshot } = opts ?? {};

        // Safety: Prevent too short timeouts for heavy sites
        const MIN_TIMEOUT = 15000;
        if (timeout < MIN_TIMEOUT) {
            console.log(
                `[INFO] Boosting timeout from ${timeout}ms to ${MIN_TIMEOUT}ms for reliability.`,
            );
            timeout = MIN_TIMEOUT;
        }

        if (!url) {
            return res
                .status(400)
                .json({ success: false, message: req.t('actions.open_url.url_required') });
        }

        const validation = validateBrowser(req, req.body.browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        browserId = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        if (typeof browser.isConnected === 'function' && !browser.isConnected()) {
            browserService.delete(browserId);
            return res.status(400).json({
                success: false,
                message: req.t('common.browser_disconnected'),
                hint: 'Use POST /api/actions/launch_browser',
            });
        }

        const context = await getOrCreateContext(req, browser, browserId);
        const pages = context.pages();
        let page;

        if (pages.length > 0) {
            page = pages[0];
            console.log('[INFO] Reusing existing primary page for navigation.');
        } else {
            page = await context.newPage();
            console.log('[INFO] Creating new page for navigation.');
        }

        await page.bringToFront().catch(() => {});

        try {
            await page.goto(url, { waitUntil, timeout });
        } catch (error) {
            const continueOnFailure =
                req.body.configuration?.continueOnFailure || req.body.continueOnFailure || false;

            if (error.message.includes('Timeout') || error.message.includes('navigation')) {
                const errorMsg = `Navigation timeout (${timeout}ms) on ${url}. The site is taking too long to load.`;

                if (continueOnFailure) {
                    smartEmitLog(
                        `[Warning] ${errorMsg} - Continuing due to 'Soft Fail' setting.`,
                        'warning',
                        nodeId,
                    );
                    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' }); // Mark as success to continue flow
                    return res.json({
                        success: true,
                        data: {
                            url,
                            status: 'timeout_soft_fail',
                            message: errorMsg,
                            result: { url, error: error.message },
                        },
                    });
                }

                smartEmitLog(`[Error] ${errorMsg}`, 'error', nodeId);
                throw new Error(errorMsg);
            }

            if (error.message.includes('Page crashed') || error.message.includes('Target closed')) {
                const hint =
                    "Crucial: El sitio es demasiado pesado para el modo 'load'. Cambia el campo 'Wait Until' a 'domcontentloaded' en la configuración del nodo.";
                throw new Error(`${error.message}. HINT: ${hint}`);
            }
            throw error;
        }

        const duration = Date.now() - start;
        traceService.add({
            action: actionName,
            url,
            browserId,
            status: 'success',
            durationMs: duration,
        });

        console.log(`[SUCCESS] URL opened (${duration}ms): ${url}`);
        smartEmitLog(`Navigated to ${url} in ${duration}ms`, 'success', nodeId);
        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        // --- FLIGHT RECORDER: Optional Screenshot on Success ---
        let screenshotPath = null;
        if (takeScreenshot && page && !page.isClosed() && runId && nodeId) {
            try {
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runId);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                // Forensic Standard: {runId}/{nodeId}.png
                const filename = `${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath });
                screenshotPath = `storage/runs/${runId}/${filename}`;
                console.log(`[FlightRecorder] Screenshot saved: ${screenshotPath}`);

                // Emit real-time update to frontend
                emitScreenshotReady({ nodeId, screenshotPath, runId });
            } catch (err) {
                console.warn(
                    '[WARN] FlightRecorder: Failed to capture open_url screenshot',
                    err.message,
                );
            }
        }

        // --- FLIGHT RECORDER: Log Success ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'success',
                    duration,
                    input: opts,
                    output: { url, browserId },
                    screenshot: screenshotPath,
                },
            );
        }
        // ------------------------------------

        return res.status(200).json({
            success: true,
            message: req.t('actions.open_url.success'),
            url,
            durationMs: duration,
            browserId,
            screenshot: screenshotPath, // FIX: Return screenshot path to frontend
        });
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`[ERROR] ${actionName}:`, error.message);
        smartEmitLog(`Navigation failed: ${error.message}`, 'error', nodeId);

        let status = error.status || 500;
        let message = req.t('actions.open_url.error');
        let hint = null;

        // Handle specific "Target Closed" errors gracefully
        if (
            error.message.includes('Target page, context or browser has been closed') ||
            error.message.includes('Session closed') ||
            error.message.includes('browser has been closed')
        ) {
            status = 400;
            message =
                'Browser connection lost. The browser might have been closed manually or crashed.';
            hint = "Please run the 'Launch Browser' node again to start a new session.";
        }

        if (nodeId)
            emitExecutionStatus({
                stepId: nodeId,
                status: 'failed',
                error: message,
            });

        traceService.add({ action: actionName, error: error.message, status: 'error' });

        // --- FLIGHT RECORDER: Log Failure ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'failed',
                    duration,
                    input: req.body,
                    error: error.message,
                },
            );
        }
        // ------------------------------------

        return res.status(status).json({
            success: false,
            message: message,
            hint: hint, // Frontend can display this
            error: error.message,
        });
    }
};

export const closeBrowserAction = async (req, res) => {
    const start = Date.now();
    try {
        let { browserId, nodeId, runId } = req.body ?? {}; // Extract runId
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'running' });
            smartEmitLog('Closing browser session...', 'info', nodeId);
        }

        if (browserId === '' || browserId === null) browserId = undefined;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            // Idempotency: If the browser is not found (already closed), consider it a success.
            if (validation.status === 400 || validation.status === 404) {
                const alreadyClosedMsg = `Browser ${browserId ? `ID ${browserId}` : ''} not found. Assuming already closed.`;
                console.log(`[INFO] close_browser: ${alreadyClosedMsg} Success.`);

                smartEmitLog(alreadyClosedMsg, 'success', nodeId);
                if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

                return res.status(200).json({
                    success: true,
                    message: req.t('actions.close_browser.success_already_closed'),
                    browserId,
                });
            }

            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        browserId = validation.browserId;

        // --- PERSISTENT BROWSER (Debug Mode) ---
        const { debugMode } = req.body;
        if (debugMode) {
            const debugMsg = `Skipping browser close for ${browserId} (Debug Mode Active)`;
            console.log(`[INFO] ${debugMsg}`);
            smartEmitLog(debugMsg, 'warning', nodeId);

            if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });
            traceService.add({ action: 'close_browser', browserId, status: 'success' });

            return res.status(200).json({
                success: true,
                message: 'Browser kept open (Debug Mode)',
                browserId,
                closed: false,
            });
        }
        // ---------------------------------------

        console.log(`[INFO] Closing browser ${browserId}...`);
        await browserService.delete(browserId);

        const duration = Date.now() - start;
        smartEmitLog(`Browser closed successfully (${duration}ms)`, 'success', nodeId);
        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        traceService.add({ action: 'close_browser', browserId, status: 'success' });

        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        // --- FLIGHT RECORDER: Log Success ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: 'close_browser' },
                {
                    status: 'success',
                    duration,
                    input: req.body,
                    output: { browserId, closed: true },
                },
            );
        }
        // ------------------------------------

        return res.status(200).json({
            success: true,
            message: req.t('actions.close_browser.success'),
            browserId,
        });
    } catch (error) {
        const duration = Date.now() - start;
        console.error('[ERROR] closeBrowserAction:', error.message);
        const { nodeId, runId } = req.body ?? {};

        if (nodeId)
            emitExecutionStatus({
                stepId: nodeId,
                status: 'failed',
                error: error.message,
            });

        // --- FLIGHT RECORDER: Log Failure ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: 'close_browser' },
                {
                    status: 'failed',
                    duration,
                    input: req.body,
                    error: error.message,
                },
            );
        }
        // ------------------------------------

        return res.status(500).json({
            success: false,
            message: req.t('actions.close_browser.error'),
            error: error.message,
        });
    }
};

// ==========================================================
// PLAYWRIGHT ACTIONS (Simplified with Wrapper)
// ==========================================================

export const clickAction = (req, res) =>
    executePlaywrightAction(req, res, 'click', async (page, opts) => {
        const { selector, button, clickCount, modifiers, force } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const clickOptions = { button, clickCount, modifiers, timeout, force };

        await page.click(selector, clickOptions);

        return {
            message: req.t('actions.click.success', { selector }),
            traceDetails: { selector, details: clickOptions },
        };
    });

export const typeTextAction = (req, res) =>
    executePlaywrightAction(req, res, 'type_text', async (page, opts) => {
        const { selector, text, clearBeforeType, delay } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));
        if (text === undefined || text === null) throw new Error(req.t('errors.text_required'));

        const actionOptions = { timeout };

        // Corrected typing logic
        if (clearBeforeType) {
            if (delay > 0) {
                // If there's a delay, we clear first and then type with delay
                await page.fill(selector, '', actionOptions);
                await page.type(selector, text, { ...actionOptions, delay });
            } else {
                // If no delay, fill is faster and clears automatically
                await page.fill(selector, text, actionOptions);
            }
        } else {
            // If NOT clearing, use type to append
            // page.type appends at the end if not explicitly cleared
            await page.type(selector, text, { ...actionOptions, delay: delay || 0 });
        }

        // Automatic screenshot capture (Frontend Requirement)
        let screenshotData = null;
        try {
            // Small wait to ensure rendering updates after typing
            await page.waitForTimeout(200);
            const screenshot = await page.screenshot({
                fullPage: false,
                type: 'png',
            });
            screenshotData = screenshot.toString('base64');
        } catch (err) {
            console.warn('[WARN] Failed to take automatic screenshot in type_text:', err.message);
        }

        return {
            message: req.t('actions.type_text.success', { selector }),
            data: { screenshot: screenshotData },
            traceDetails: { selector, textLength: text.length, delay, clearBeforeType },
        };
    });

export const scrollAction = (req, res) =>
    executePlaywrightAction(req, res, 'scroll', async (page, opts) => {
        const {
            selector,
            direction = 'down',
            amount = 300,
            behavior = 'smooth',
            scrollToEnd = false,
            maxScrolls = 50,
            waitTime = 2000,
            x, // Absolute X coordinate
            y, // Absolute Y coordinate
            duration, // Custom duration
        } = opts;

        // NEW: Infinite Scroll Mode
        if (scrollToEnd) {
            console.log('[Scroll] Infinite scroll mode enabled');
            let lastHeight = 0;
            let currentHeight = 0;
            let attempts = 0;

            // Get initial height
            if (selector) {
                await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
                currentHeight = await page.evaluate((sel) => {
                    const element = document.querySelector(sel);
                    if (!element) throw new Error(`Element not found: ${sel}`);
                    return element.scrollHeight;
                }, selector);
            } else {
                currentHeight = await page.evaluate(() => {
                    return document.body.scrollHeight;
                });
            }

            while (attempts < maxScrolls && lastHeight !== currentHeight) {
                lastHeight = currentHeight;

                // Perform scroll
                if (selector) {
                    await page.evaluate(
                        ({ sel, beh }) => {
                            const element = document.querySelector(sel);
                            if (element) {
                                element.scrollTo({ top: element.scrollHeight, behavior: beh });
                            }
                        },
                        { sel: selector, beh: behavior },
                    );
                } else {
                    await page.evaluate((beh) => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: beh });
                    }, behavior);
                }

                // Wait for new content to load
                await page.waitForTimeout(waitTime);

                // Check new height
                if (selector) {
                    currentHeight = await page.evaluate((sel) => {
                        const element = document.querySelector(sel);
                        if (!element) throw new Error(`Element not found: ${sel}`);
                        return element.scrollHeight;
                    }, selector);
                } else {
                    currentHeight = await page.evaluate(() => {
                        return document.body.scrollHeight;
                    });
                }

                attempts++;
                console.log(
                    `[Scroll] Attempt ${attempts}/${maxScrolls} - Height: ${currentHeight}`,
                );
            }

            const finalStatus =
                lastHeight === currentHeight ? 'Reached end' : 'Max attempts reached';

            return {
                message:
                    req.t('actions.scroll.success_infinite', {
                        attempts,
                        status: finalStatus,
                    }) || `Scrolled to end after ${attempts} attempts. ${finalStatus}`,
                data: {
                    scrolledHeight: currentHeight,
                    attempts,
                    reachedEnd: lastHeight === currentHeight,
                },
                traceDetails: {
                    action: 'scroll_infinite',
                    selector: selector || 'window',
                    attempts,
                    maxScrolls,
                    waitTime,
                    finalHeight: currentHeight,
                },
            };
        }

        // EXISTING: Standard scroll logic
        let dx = 0;
        let dy = 0;

        if (x !== undefined && y !== undefined) {
            // Absolute displacement
            if (selector) {
                await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
                await page.evaluate(
                    ({ selector, x, y, behavior }) => {
                        const element = document.querySelector(selector);
                        if (!element)
                            throw new Error(`Element not found with selector: ${selector}`);
                        element.scrollTo({ left: x, top: y, behavior });
                    },
                    { selector, x, y, behavior },
                );
            } else {
                await page.evaluate(
                    ({ x, y, behavior }) => {
                        window.scrollTo({ left: x, top: y, behavior });
                    },
                    { x, y, behavior },
                );
            }
        } else {
            // Relative displacement
            switch (direction) {
                case 'down':
                    dy = amount;
                    break;
                case 'up':
                    dy = -amount;
                    break;
                case 'right':
                    dx = amount;
                    break;
                case 'left':
                    dx = -amount;
                    break;
                default:
                    throw new Error(`Invalid scroll direction: ${direction}`);
            }

            if (selector) {
                await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
                await page.evaluate(
                    ({ selector, dx, dy, behavior }) => {
                        const element = document.querySelector(selector);
                        if (!element)
                            throw new Error(`Element not found with selector: ${selector}`);
                        element.scrollBy({ left: dx, top: dy, behavior });
                    },
                    { selector, dx, dy, behavior },
                );
            } else {
                await page.evaluate(
                    ({ dx, dy, behavior }) => {
                        window.scrollBy({ left: dx, top: dy, behavior });
                    },
                    { dx, dy, behavior },
                );
            }
        }

        // Generate associated events
        const startTime = Date.now();
        const endTime = startTime + (duration || 0);
        const eventDetails = {
            action: 'scroll',
            startTime,
            endTime,
            selector: selector || 'window',
            direction,
            amount,
            x,
            y,
        };

        traceService.add({
            ...eventDetails,
            status: 'success',
        });

        return {
            message: req.t('actions.scroll.success', { target: selector || 'the main window' }),
            traceDetails: eventDetails,
        };
    });

export const backAction = (req, res) =>
    executePlaywrightAction(req, res, 'go_back', async (page) => {
        const response = await page.goBack();
        if (response === null) {
            const error = new Error(req.t('actions.back.error_no_history'));
            error.status = 400;
            throw error;
        }
        return {
            message: req.t('actions.back.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export const forwardAction = (req, res) =>
    executePlaywrightAction(req, res, 'go_forward', async (page) => {
        const response = await page.goForward();
        if (response === null) {
            const error = new Error(req.t('actions.forward.error_no_history'));
            error.status = 400;
            throw error;
        }
        return {
            message: req.t('actions.forward.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export const reloadAction = (req, res) =>
    executePlaywrightAction(req, res, 'reload_page', async (page) => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        return {
            message: req.t('actions.reload.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export const manageTabsAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_tabs', async (page, opts, browserId, context) => {
        const { action, url, tabIndex, closeAll } = opts;
        let message = '';
        let responseData = {};

        // Validate that the action is valid
        const validActions = ['new', 'switch', 'close', 'list'];
        if (!validActions.includes(action)) {
            throw new Error(
                req.t('actions.manage_tabs.error_invalid_action', {
                    action,
                    validActions: validActions.join(', '),
                }),
            );
        }

        if (action === 'new') {
            // Create new tab
            const newPage = await context.newPage();
            if (url) {
                await newPage.goto(url, { waitUntil: 'load', timeout: 30000 });
                responseData.url = newPage.url();
            } else {
                responseData.url = 'about:blank';
            }
            const pages = context.pages();
            responseData.tabIndex = pages.length - 1;
            responseData.totalTabs = pages.length;
            message = req.t('actions.manage_tabs.new_success', { count: pages.length });
        } else if (action === 'switch') {
            // Switch to specific tab
            if (tabIndex === undefined || tabIndex === null) {
                throw new Error(req.t('actions.manage_tabs.error_tab_index_required'));
            }
            const pages = context.pages();
            if (tabIndex < 0 || tabIndex >= pages.length) {
                throw new Error(
                    req.t('actions.manage_tabs.error_invalid_index', {
                        index: tabIndex,
                        max: pages.length - 1,
                    }),
                );
            }
            const targetPage = pages[tabIndex];
            await targetPage.bringToFront();
            responseData.tabIndex = tabIndex;
            responseData.url = targetPage.url();
            responseData.title = await targetPage.title();
            message = req.t('actions.manage_tabs.switch_success', {
                index: tabIndex,
                title: responseData.title,
            });
        } else if (action === 'close') {
            // Close tab(s)
            if (closeAll) {
                const pages = context.pages();
                const count = pages.length;
                await Promise.all(pages.map((p) => p.close()));
                message = req.t('actions.manage_tabs.close_all_success', { count });
                responseData.closedCount = count;
            } else if (tabIndex !== undefined && tabIndex !== null) {
                const pages = context.pages();
                if (tabIndex < 0 || tabIndex >= pages.length) {
                    throw new Error(
                        req.t('actions.manage_tabs.error_invalid_index', {
                            index: tabIndex,
                            max: pages.length - 1,
                        }),
                    );
                }
                await pages[tabIndex].close();
                message = req.t('actions.manage_tabs.close_index_success', { index: tabIndex });
                responseData.closedIndex = tabIndex;
                responseData.remainingTabs = context.pages().length;
            } else {
                // Close active tab (the last one in the array)
                const pages = context.pages();
                if (pages.length === 0) {
                    throw new Error(req.t('actions.manage_tabs.error_no_tabs'));
                }
                await page.close();
                message = req.t('actions.manage_tabs.close_active_success');
                responseData.remainingTabs = context.pages().length;
            }
        } else if (action === 'list') {
            // List all tabs
            const pages = context.pages();
            const tabsInfo = await Promise.all(
                pages.map(async (p, index) => {
                    try {
                        return {
                            index,
                            url: p.url(),
                            title: await p.title(),
                            isClosed: p.isClosed(),
                        };
                    } catch (err) {
                        return {
                            index,
                            url: 'unknown',
                            title: 'Error retrieving information',
                            isClosed: true,
                            error: err.message,
                        };
                    }
                }),
            );
            responseData.tabs = tabsInfo;
            responseData.totalTabs = pages.length;
            message = req.t('actions.manage_tabs.list_success', { count: pages.length });
        }

        return {
            message,
            data: responseData,
            traceDetails: { action, url, tabIndex, totalTabs: context.pages().length },
        };
    });

// ... (Other actions remain similar, using executePlaywrightAction)
// NOTE: To keep the complete file, we should include all exported functions.

// IMPLEMENTATION OF OTHER CRITICAL ACTIONS (Based on the router)

export const findElementAction = (req, res) =>
    executePlaywrightAction(req, res, 'find_element', async (page, opts) => {
        const {
            selector,
            selectorType = 'css',
            timeout = 10000, // Aligned with frontend
            visible = true,
        } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        // Convert selector based on type
        let playwrightSelector = selector;
        if (selectorType === 'xpath') {
            // Playwright requires 'xpath=' prefix for XPath selectors
            playwrightSelector = selector.startsWith('xpath=') ? selector : `xpath=${selector}`;
        }

        // Determine wait state based on visible parameter
        const waitState = visible ? 'visible' : 'attached';

        // Wait for the element with correct configuration
        await page.waitForSelector(playwrightSelector, {
            state: waitState,
            timeout,
        });

        // Verify current visibility of the element
        const isVisible = await page.isVisible(playwrightSelector);

        return {
            message: req.t('actions.find_element.success', { selector }),
            data: {
                found: true,
                visible: isVisible,
                selectorType,
                state: waitState,
            },
            traceDetails: {
                selector,
                selectorType,
                found: true,
                visible: isVisible,
            },
        };
    });

export const selectOptionAction = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const { selector, selectionCriteria, selectionValue } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        // Base options configuration
        let valuesToSelect = {};
        const runOptions = {};
        if (timeout) runOptions.timeout = timeout;

        // Map criteria to selection values (if they exist)
        if (selectionValue !== '' && selectionValue !== null && selectionValue !== undefined) {
            if (selectionCriteria === 'value') {
                valuesToSelect.value = selectionValue;
            } else if (selectionCriteria === 'label') {
                valuesToSelect.label = selectionValue;
            } else if (selectionCriteria === 'index') {
                valuesToSelect.index = parseInt(selectionValue, 10);
            } else {
                throw new Error(
                    req.t('errors.invalid_selection_criteria', { criteria: selectionCriteria }),
                );
            }
        }

        // Logic to handle selectors and target resolution
        let targetElement = selector; // By default we use the selector as string (for page.selectOption)
        let resolvedTargetType = 'original_selector';

        try {
            // Inspect the element
            await page.waitForSelector(selector, { state: 'attached', timeout: timeout || 30000 });
            const element = await page.$(selector);

            if (element) {
                const tagName = await element.evaluate((el) => el.tagName);

                if (tagName === 'OPTION') {
                    // Case: Selector points to <option>
                    const selectHandle = await element.evaluateHandle((el) => el.closest('select'));
                    const isSelect = await selectHandle.evaluate(
                        (el) => el instanceof HTMLSelectElement, // eslint-disable-line no-undef
                    );

                    if (isSelect) {
                        targetElement = selectHandle; // Now the target is the <select> handle
                        resolvedTargetType = 'parent_select';

                        // If no explicit value, select THIS specific option
                        if (!selectionValue) {
                            valuesToSelect = element; // Pass the option handle as value to select
                        }
                    } else {
                        console.warn('[WARN] Selector points to OPTION but has no SELECT parent.');
                    }
                }
            }
        } catch (err) {
            console.warn('[WARN] Failed to inspect element in select_option:', err.message);
        }

        // Execute selection
        let result;
        if (typeof targetElement === 'string') {
            // Use page method with string selector
            result = await page.selectOption(targetElement, valuesToSelect, runOptions);
        } else {
            // Use handle method (targetElement is an ElementHandle of <select>)
            result = await targetElement.selectOption(valuesToSelect, runOptions);
        }

        return {
            message: req.t('actions.select_option.success'),
            data: { selected: result },
            traceDetails: {
                selector,
                selectionCriteria,
                selectionValue,
                timeout,
                resolvedTarget: resolvedTargetType,
                implicitSelection: !selectionValue && resolvedTargetType === 'parent_select',
            },
        };
    });

export const submitFormAction = (req, res) =>
    executePlaywrightAction(req, res, 'submit_form', async (page, opts) => {
        const { selector } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));
        await page.locator(selector).press('Enter'); // Or use evaluate for submit()
        return { message: req.t('actions.submit_form.success'), traceDetails: { selector } };
    });

export const uploadFileAction = (req, res) =>
    executePlaywrightAction(req, res, 'upload_file', async (page, opts) => {
        const { selector, files } = opts;

        // Validate that selector is present
        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        // Ensure files is an array, handling JSON strings or comma-separated strings
        let fileArray = [];
        if (Array.isArray(files)) {
            fileArray = files;
        } else if (typeof files === 'string') {
            const trimmedFiles = files.trim();
            if (trimmedFiles.startsWith('[') && trimmedFiles.endsWith(']')) {
                try {
                    fileArray = JSON.parse(trimmedFiles);
                } catch (e) {
                    // Fallback to comma-separated if JSON parse fails
                    fileArray = trimmedFiles.split(',').map((f) => f.trim());
                }
            } else {
                fileArray = trimmedFiles.split(',').map((f) => f.trim());
            }
        }

        // Validate that files are provided
        if (!fileArray || fileArray.length === 0) {
            throw new Error(req.t('errors.files_required'));
        }

        // Validate that file paths are not dangerous
        const invalidFiles = fileArray.filter((file) => file.includes('..'));
        if (invalidFiles.length > 0) {
            throw new Error(req.t('errors.unsafe_file_paths', { paths: invalidFiles.join(', ') }));
        }

        // Upload files
        await page.setInputFiles(selector, fileArray);

        return {
            message: req.t('actions.upload_file.success'),
            traceDetails: { selector, filesCount: fileArray.length },
        };
    });

export const hoverAction = (req, res) =>
    executePlaywrightAction(req, res, 'hover', async (page, opts) => {
        const { selector, timeout = 30000 } = opts;

        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        await page.hover(selector, { timeout });

        return {
            message: req.t('actions.hover.success', { selector }),
            traceDetails: { selector, timeout },
        };
    });

export const executeJsAction = (req, res) =>
    executePlaywrightAction(req, res, 'execute_js', async (page, opts) => {
        const { script, args, returnValue, variableName } = opts;

        // 1. Parse arguments if they come as a JSON string
        let parsedArgs = args;
        if (typeof args === 'string' && args.trim() !== '') {
            try {
                parsedArgs = JSON.parse(args);
            } catch (e) {
                throw new Error(req.t('errors.parse_args_error', { error: e.message }));
            }
        }

        // 2. Execute the script
        // ⚠️ SECURITY WARNING: This allows RCE.
        // It is assumed the script is a valid function or expression.
        let result;
        try {
            // Pass parsedArgs as second argument to evaluate
            result = await page.evaluate(script, parsedArgs);
        } catch (err) {
            throw new Error(req.t('errors.script_execution_error', { error: err.message }));
        }

        // 3. Capture return value if requested
        let stored = false;
        if (returnValue && variableName) {
            variableManager.set(variableName, result, req.body.runId);
            stored = true;
        }

        return {
            message: req.t('actions.execute_js.success'),
            data: {
                result: returnValue ? result : undefined,
                stored,
                variableName: stored ? variableName : undefined,
            },
            traceDetails: {
                scriptLength: script.length,
                argsProvided: !!parsedArgs,
                returnValueCaptured: stored,
            },
        };
    });

export const takeScreenshotAction = (req, res) =>
    executePlaywrightAction(req, res, 'take_screenshot', async (page, opts) => {
        const {
            selector,
            fullPage = false,
            path: savePath,
            format = 'png',
            quality = 100,
            timeout = 30000,
            enabled = true,
        } = opts;

        if (!enabled) {
            console.log(`[Screenshot] Node skipped because it is disabled.`);
            return {
                message: req.t('actions.take_screenshot.skipped', {
                    defaultValue: 'Captura de pantalla omitida (nodo deshabilitado)',
                }),
                data: {
                    skipped: true,
                },
                traceDetails: {
                    skipped: true,
                },
            };
        }

        // Playwright options configuration
        const screenshotOptions = {
            type: format,
            timeout: fullPage ? Math.max(timeout, 60000) : timeout, // 60s for fullPage
            animations: 'disabled', // Prevent crashes on high-motion sites
        };

        if (format === 'jpeg') {
            screenshotOptions.quality = quality;
        }

        // If NO selector, use fullPage (if requested)
        if (!selector) {
            screenshotOptions.fullPage = fullPage;
        }

        // Security validation for path (Path Traversal)
        if (savePath) {
            // Normalize and resolve absolute path
            const resolvedPath = path.resolve(savePath);
            // Define allowed directories (e.g., current folder or specific subfolders)
            // In this case, we assume any path within the project or /tmp is valid,
            // but we block attempts to escape the system root or access sensitive files.
            // A simple validation is ensuring it does not contain '..'
            if (savePath.includes('..')) {
                throw new Error(req.t('errors.unsafe_file_path'));
            }
            screenshotOptions.path = resolvedPath;
        }

        let screenshotBuffer;

        if (selector) {
            // Case 1: Element Capture
            console.log(`[Screenshot] Element mode: ${selector} (Timeout: ${timeout}ms)`);
            await page.waitForSelector(selector, { state: 'visible', timeout });
            const element = await page.$(selector);
            if (!element) {
                throw new Error(req.t('errors.element_not_found', { selector }));
            }
            screenshotBuffer = await element.screenshot(screenshotOptions);
        } else {
            // Case 2: Full Page / Viewport Capture
            if (fullPage) {
                console.log('[Screenshot] Full Page mode (Starting warmup scroll...)');
                // Optimization: Scroll to bottom and back to wake up lazy-loaded elements
                try {
                    // Manual warmup with race to avoid hang
                    await Promise.race([
                        page.evaluate(() => {
                            /* global window, document */
                            window.scrollTo(0, document.body.scrollHeight / 2);
                            return new Promise((r) => setTimeout(r, 500)).then(() =>
                                window.scrollTo(0, 0),
                            );
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Warmup timeout')), 5000),
                        ),
                    ]);
                    console.log('[Screenshot] Warmup complete.');
                } catch (e) {
                    console.warn('[Screenshot] Warmup skipped (timed out or failed):', e.message);
                }
                console.log(
                    `[Screenshot] Executing fullPage capture (Max wait: ${screenshotOptions.timeout}ms)...`,
                );
            } else {
                console.log('[Screenshot] Viewport mode');
            }

            screenshotBuffer = await page.screenshot(screenshotOptions);
            console.log('[Screenshot] Capture successful.');
        }
        if (!screenshotBuffer) {
            throw new Error('Screenshot operation failed to return a valid image.');
        }

        // Return data
        // ALWAYS return base64 so the frontend can display it
        // and so the "Automatic Capture" system can reuse it.
        const base64Image = screenshotBuffer.toString('base64');

        return {
            message: req.t('actions.take_screenshot.success'),
            data: {
                screenshot: base64Image,
                savedTo: savePath ? screenshotOptions.path : null,
                format,
            },
            traceDetails: {
                selector,
                fullPage: !selector && fullPage,
                format,
                quality: format === 'jpeg' ? quality : undefined,
                savedTo: savePath,
            },
        };
    });

export const saveDomAction = (req, res) =>
    executePlaywrightAction(req, res, 'save_dom', async (page, opts) => {
        const { path: savePath, variableName, selector, timeout = 30000 } = opts;

        // 1. Validacion: Se requiere al menos un destino (path o variableName)
        if (!savePath && !variableName) {
            throw new Error(req.t('errors.save_dom_destination_required'));
        }

        // 2. Validacion de seguridad para path (si se proporciona)
        let resolvedPath = null;
        if (savePath) {
            if (savePath.includes('..')) {
                throw new Error(req.t('errors.unsafe_file_path'));
            }
            resolvedPath = path.resolve(savePath);
        }

        // 3. Obtencion del Contenido
        let content = '';
        if (selector) {
            // Caso: Capturar elemento especifico
            await page.waitForSelector(selector, { state: 'attached', timeout });
            const element = await page.$(selector);
            if (!element) {
                throw new Error(`Elemento no encontrado: ${selector}`);
            }
            // Extraer outerHTML para incluir el elemento mismo
            content = await element.evaluate((el) => el.outerHTML);
        } else {
            // Caso: Capturar página completa
            content = await page.content();
        }

        // 4. Persistencia del Contenido
        const results = {};

        // Guardar en Archivo
        if (resolvedPath) {
            await fsp.writeFile(resolvedPath, content);
            results.path = resolvedPath;
        }

        // Guardar en Variable
        if (variableName) {
            variableManager.set(variableName, content, req.body.runId);
            results.variableStored = variableName;
        }

        return {
            message: 'DOM guardado exitosamente',
            data: results,
            traceDetails: {
                path: resolvedPath,
                variableName,
                selector,
                contentLength: content.length,
            },
        };
    });

export const getSetContentAction = (req, res) =>
    executePlaywrightAction(req, res, 'get_set_content', async (page, opts) => {
        const {
            selector,
            action = 'get',
            contentType = 'text',
            attribute,
            value,
            clearBeforeSet = true,
            timeout = 30000,
        } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        await page.waitForSelector(selector, { state: 'attached', timeout });
        const element = await page.$(selector);
        if (!element) {
            throw new Error(req.t('errors.element_not_found', { selector }));
        }

        let result;
        if (action === 'get') {
            if (contentType === 'text') {
                result = await element.innerText();
            } else if (contentType === 'html') {
                result = await element.innerHTML();
            } else if (contentType === 'value') {
                result = await element.inputValue();
            } else if (contentType === 'attribute' && attribute) {
                result = await element.getAttribute(attribute);
            } else {
                throw new Error(req.t('errors.invalid_content_type', { contentType }));
            }
        } else if (action === 'set') {
            if (value === undefined) {
                throw new Error(req.t('errors.value_required_for_set'));
            }

            if (contentType === 'text') {
                await element.fill(''); // Clear before setting text
                await element.type(value);
            } else if (contentType === 'html') {
                await element.evaluate((el, val) => (el.innerHTML = val), value);
            } else if (contentType === 'value') {
                if (clearBeforeSet) {
                    await element.fill('');
                }
                await element.type(value);
            } else if (contentType === 'attribute' && attribute) {
                await element.evaluate((el, { attr, val }) => el.setAttribute(attr, val), {
                    attr: attribute,
                    val: value,
                });
            } else {
                throw new Error(req.t('errors.invalid_content_type', { contentType }));
            }
            result = value; // For set actions, the result is the value that was set
        } else {
            throw new Error(req.t('errors.invalid_action', { action }));
        }

        return {
            message: req.t(`actions.get_set_content.${action}.success`),
            data: {
                selector,
                action,
                contentType,
                attribute,
                value: result,
            },
            traceDetails: {
                selector,
                action,
                contentType,
                attribute,
                valueLength: typeof result === 'string' ? result.length : undefined,
            },
        };
    });

// waitForElementAction: Waits for a specific condition on a selector
export const waitForElementAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_element', async (page, opts) => {
        const { selector, condition = 'visible', timeout = 30000, scrollIntoView = false } = opts;

        try {
            // Scroll if requested
            if (scrollIntoView) {
                try {
                    // First wait for it to be attached (so we can scroll)
                    await page.waitForSelector(selector, { state: 'attached', timeout });
                    const el = page.locator(selector).first();
                    await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
                } catch (err) {
                    // Ignore scroll errors, maybe it's not interpretable yet or will fail in the main wait
                    console.warn(`[WARN] Scroll attempt failed for '${selector}':`, err.message);
                }
            }

            // Map condition to Playwright's state
            // Conditions 'visible', 'hidden', 'attached', 'detached' match Playwright states
            const playwrightState = condition;

            // Execute wait with clean parameters
            await page.waitForSelector(selector, {
                state: playwrightState,
                timeout: timeout,
            });

            // Descriptive messages based on the condition
            const messages = {
                visible: req.t('actions.wait_for_element.visible', { selector }),
                hidden: req.t('actions.wait_for_element.hidden', { selector }),
                attached: req.t('actions.wait_for_element.attached', { selector }),
                detached: req.t('actions.wait_for_element.detached', { selector }),
            };

            return {
                message: messages[condition] || req.t('actions.wait_for_element.condition_met'),
                data: {
                    selector,
                    condition,
                    conditionMet: true,
                },
                traceDetails: {
                    selector,
                    condition,
                    timeout,
                },
            };
        } catch (error) {
            // Specific handling for TimeoutError
            if (error.name === 'TimeoutError' || error.message.includes('Timeout')) {
                throw new Error(req.t('errors.wait_timeout', { selector, condition, timeout }));
            }
            throw error;
        }
    });
export const waitVisibleAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_visible', async (page, opts) => {
        const { selector, timeout = 15000, scrollIntoView = true } = opts;

        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        // 1. Scroll if necessary
        if (scrollIntoView) {
            try {
                // First wait for it to exist in the DOM to be able to scroll
                await page.waitForSelector(selector, { state: 'attached', timeout });

                // Attempt to scroll
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) el.scrollIntoView({ block: 'center', inline: 'center' });
                }, selector);
            } catch (err) {
                console.warn(`[WARN] Could not scroll to element '${selector}': ${err.message}`);
                // Continue, maybe it's already visible or the error will trigger in the next step
            }
        }

        // 2. Wait for visibility
        await page.waitForSelector(selector, { state: 'visible', timeout });

        // 3. Implicit screenshot capture (VISUAL_CHANGE_NODES)
        let screenshotData = null;
        try {
            await page.waitForTimeout(500); // Recommended 500ms delay
            const screenshot = await page.screenshot({
                fullPage: false,
                type: 'png',
            });
            screenshotData = screenshot.toString('base64');
        } catch (err) {
            console.warn(
                '[WARN] Failed to take automatic screenshot in wait_visible:',
                err.message,
            );
        }

        return {
            message: req.t('actions.wait_visible.success'),
            data: { screenshot: screenshotData },
            traceDetails: { selector, timeout, scrollIntoView },
        };
    });
export const waitNavigationAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_navigation', async (page, opts) => {
        // Extract parameters with safe defaults
        const { url, waitUntil = 'load', timeout = 30000 } = opts;

        // Validate waitUntil against Playwright's allowed states
        const validStates = ['load', 'domcontentloaded', 'networkidle'];
        if (!validStates.includes(waitUntil)) {
            throw new Error(
                `Invalid waitUntil state: ${waitUntil}. Must be one of: ${validStates.join(', ')}`,
            );
        }

        try {
            if (url) {
                // Wait for a specific URL or pattern
                await page.waitForURL(url, { waitUntil, timeout: Number(timeout) });
            } else {
                // Idempotent wait for the desired load state on the current page
                await page.waitForLoadState(waitUntil, { timeout: Number(timeout) });
            }
        } catch (error) {
            throw new Error(
                `Wait navigation failed (url: ${url || 'current'}, state: ${waitUntil}, timeout: ${timeout}ms): ${error.message}`,
            );
        }

        return {
            message: req.t('actions.wait_navigation.success'),
            data: {
                waitedFor: waitUntil,
                timeout,
                url: page.url(),
            },
        };
    });
export const waitNetworkAction = (req, res) =>
    // Enhanced waitNetworkAction with proper includeResources handling and continuous idle detection
    executePlaywrightAction(req, res, 'wait_network', async (page, opts) => {
        // Normalize payload with defaults (browserId handled internally)
        const { idleTime = 1000, includeResources = true } = opts || {};
        const normalizedIdleTime = typeof idleTime === 'number' && idleTime >= 0 ? idleTime : 1000;

        // Helper to wait for network idle respecting includeResources and idleTime
        const waitForNetworkIdle = async (page, idleMs, includeResources) => {
            const pending = new Set();
            const isRelevant = (req) => {
                if (includeResources) return true;
                const type = req.resourceType();
                return !['image', 'stylesheet', 'font', 'media'].includes(type);
            };
            const onRequest = (req) => {
                if (isRelevant(req)) pending.add(req);
            };
            const onDone = (req) => {
                if (isRelevant(req)) pending.delete(req);
            };
            page.on('request', onRequest);
            page.on('requestfinished', onDone);
            page.on('requestfailed', onDone);
            await new Promise((resolve) => {
                let timer;
                const check = () => {
                    if (pending.size === 0) {
                        timer = setTimeout(() => {
                            cleanup();
                            resolve();
                        }, idleMs);
                    }
                };
                const resetTimer = () => {
                    if (timer) clearTimeout(timer);
                };
                const cleanup = () => {
                    page.removeListener('request', onRequest);
                    page.removeListener('requestfinished', onDone);
                    page.removeListener('requestfailed', onDone);
                };
                // Initial check
                check();
                // Reset timer on new relevant request
                page.on('request', (req) => {
                    if (isRelevant(req)) resetTimer();
                });
                // Re‑check when a request finishes or fails
                page.on('requestfinished', check);
                page.on('requestfailed', check);
            });
        };

        await waitForNetworkIdle(page, normalizedIdleTime, includeResources);

        return {
            message: req.t('actions.wait_network.success'),
            data: {
                idleTime: normalizedIdleTime,
                includeResources: Boolean(includeResources),
            },
        };
    });
export const waitConditionalAction = async (req, res) => {
    const { waitType = 'browser', expression, timeout = 30000, polling = 100 } = req.body;

    if (waitType === 'browser') {
        return executePlaywrightAction(req, res, 'wait_conditional', async (page) => {
            await page.waitForFunction(expression, null, {
                polling,
                timeout,
            });
            return { message: req.t('actions.wait_conditional.success') };
        })(req, res);
    } else {
        // Variable Wait Logic
        const startTime = Date.now();
        const checkCondition = () => {
            try {
                // expression should be a condition object or array of conditions
                const conditions =
                    typeof expression === 'string' ? JSON.parse(expression) : expression;
                const condArray = Array.isArray(conditions) ? conditions : [conditions];
                return variableManager.evaluateConditions(condArray, 'AND');
            } catch (e) {
                console.warn('[WaitVariable] Evaluation failed:', e.message);
                return false;
            }
        };

        while (Date.now() - startTime < timeout) {
            if (checkCondition()) {
                return res.status(200).json({
                    success: true,
                    message: 'Variable condition met',
                });
            }
            await new Promise((resolve) => setTimeout(resolve, polling));
        }

        return res.status(408).json({
            success: false,
            message: `Timeout waiting for variable condition after ${timeout}ms`,
        });
    }
};

// --- LOG ERROR FILTERING ---
const NOISY_DOMAINS = [
    'backtrace.io',
    'google-analytics.com',
    'doubleclick.net',
    'sentry.io',
    'segment.io',
    'hotjar.com',
    'facebook.net',
    'facebook.com/tr',
    'clarity.ms',
    'browser-sync',
];

/**
 * Checks if a log message or URL belongs to a known noisy third-party domain
 */
const isNoisyLog = (text, url = '') => {
    const combined = (text + ' ' + url).toLowerCase();
    return NOISY_DOMAINS.some((domain) => combined.includes(domain));
};

export const logErrorsAction = (req, res) =>
    executePlaywrightAction(req, res, 'log_errors', async (page, opts) => {
        const { enable } = opts;
        if (enable) {
            const context = page.context();
            const attachToPage = (p) => {
                p.on('console', (msg) => {
                    if (msg.type() === 'error') {
                        const content = msg.text();
                        if (isNoisyLog(content)) return; // Skip noisy analytics/tracking errors

                        // Skip redundant generic network failures from console (already captured by network monitor with URL)
                        if (content.includes('net::ERR_FAILED')) return;

                        const message = `[Browser Console] ${content}`;
                        console.log(message);
                        smartEmitLog(message, 'error', opts.nodeId);
                        // Update node state to warning to give visual feedback
                        emitExecutionStatus({
                            stepId: opts.nodeId,
                            status: 'warning',
                            error: { message: 'Errors detected in console' },
                        });
                    }
                });
                p.on('pageerror', (err) => {
                    const content = err.message;
                    if (isNoisyLog(content)) return;

                    const message = `[Browser Error] ${content}`;
                    console.log(message);
                    smartEmitLog(message, 'error', opts.nodeId);
                    emitExecutionStatus({
                        stepId: opts.nodeId,
                        status: 'warning',
                        error: { message: 'Page error detected' },
                    });
                });
                p.on('requestfailed', (request) => {
                    const url = request.url();
                    const failure = request.failure();
                    const errorText = failure?.errorText || 'Unknown error';

                    if (isNoisyLog(errorText, url)) return;

                    const message = `[Network Error] Failed to load: ${url} - ${errorText}`;
                    console.log(message);
                    smartEmitLog(message, 'error', opts.nodeId);
                    emitExecutionStatus({
                        stepId: opts.nodeId,
                        status: 'warning',
                        error: { message: 'Network resource failed to load' },
                    });
                });
            };

            // Attach to current page
            attachToPage(page);

            // Attach to all future pages in this context (Persistent Collector)
            context.on('page', (p) => {
                console.log('[LogErrors] New page detected, attaching listeners...');
                attachToPage(p);
            });

            return { message: req.t('actions.log_errors.success') + ' (Monitoring enabled)' };
        } else {
            // Playwright does not have an easy method to "unsubscribe" from all anonymous listeners
            // without saving a reference. For now, this action only enables logging.
            // To disable robustly, we would need to manage the listeners.
            return {
                message: 'Disabling logging is not fully supported in this simple version',
            };
        }
    });

// ==========================================================
// PAUSE / SLEEP ACTION
// ==========================================================

export const pauseAction = (req, res) =>
    executePlaywrightAction(req, res, 'pause', async (page, opts) => {
        const { duration } = opts;

        // Use page.waitForTimeout (or simple setTimeout if page not available)
        // Since executePlaywrightAction ensures 'page' exists, we use Playwright's method
        // which helps in keeping the test runner alive/aware.
        await page.waitForTimeout(duration);

        return {
            message: req.t('actions.pause.success', { duration }),
            traceDetails: { duration },
        };
    });

export const listenEventsAction = (req, res) =>
    executePlaywrightAction(req, res, 'listen_events', async (page, opts) => {
        const {
            eventType,
            selector,
            urlPattern,
            method,
            logToFile,
            filePath,
            timeout = 0,
            nodeId,
        } = opts;

        const isNetworkEvent = ['request', 'response'].includes(eventType);
        const isDomEvent = ['click', 'input', 'change', 'submit'].includes(eventType);
        const isDialogEvent = eventType === 'dialog';
        const isConsoleEvent = eventType === 'console';

        const handleEvent = async (data) => {
            let message = `[EVENT: ${eventType}]`;

            if (isNetworkEvent) {
                const url = typeof data.url === 'function' ? data.url() : data.url;
                const reqMethod =
                    typeof data.method === 'function'
                        ? data.method()
                        : data.request
                          ? data.request().method()
                          : '';

                // Filter by URL Pattern (Basic glob-like matching if possible, or simple includes)
                if (urlPattern && !url.includes(urlPattern.replace(/\*/g, ''))) return;

                // Filter by Method
                if (method && reqMethod.toUpperCase() !== method.toUpperCase()) return;

                message += ` ${reqMethod} ${url}`;
            } else if (isDialogEvent) {
                message += ` ${data.type()}: ${data.message()}`;
                await data.dismiss().catch(() => {}); // Auto-dismiss to prevent hang
            } else if (isConsoleEvent) {
                message += ` [${data.type()}] ${data.text()}`;
            } else if (isDomEvent) {
                // DOM events are trickier as page.on doesn't have a direct 'click' event usually
                // unless it's a custom exposed function.
                message += ` Element interaction detected`;
                if (selector) message += ` on ${selector}`;
            }

            smartEmitLog(message, 'info', nodeId);

            if (logToFile && filePath) {
                try {
                    const logEntry =
                        JSON.stringify({
                            timestamp: new Date().toISOString(),
                            type: eventType,
                            details: data.toString?.() || 'Event data captured',
                        }) + '\n';
                    await fsp.appendFile(filePath, logEntry);
                } catch (err) {
                    console.error('[ERROR] Failed to log to file:', err.message);
                }
            }
        };

        if (isDomEvent) {
            // For DOM events, we inject a script to listen and report back
            const exposedName = `__hal_event_${nodeId || Date.now()}`;
            await page.exposeFunction(exposedName, (info) => {
                if (!selector || (info.selector && info.selector.includes(selector))) {
                    handleEvent(info);
                }
            });

            await page.addInitScript(
                ({ eventType, exposedName, selector }) => {
                    document.addEventListener(
                        eventType,
                        (e) => {
                            const target = e.target;

                            // Client-side filtering if selector is provided
                            if (selector && !target.matches(selector)) return;

                            const info = {
                                type: eventType,
                                tagName: target.tagName,
                                id: target.id,
                                className: target.className,
                            };
                            window[exposedName](info);
                        },
                        true,
                    );
                },
                { eventType, exposedName, selector },
            );

            smartEmitLog(`Listening for DOM ${eventType} events...`, 'info', nodeId);
        } else {
            // Playwright native events
            page.on(eventType, handleEvent);
            smartEmitLog(`Listening for Playwright ${eventType} events...`, 'info', nodeId);
        }

        // Handle unsubscription after timeout
        if (timeout > 0) {
            setTimeout(() => {
                if (!page.isClosed()) {
                    page.off(eventType, handleEvent);
                    smartEmitLog(`Stopped listening for ${eventType} (Timeout)`, 'info', nodeId);
                }
            }, timeout);
        }

        return {
            message: `Listening for ${eventType} events started. ${timeout > 0 ? `(Timeout: ${timeout}ms)` : '(Indefinite)'}`,
            data: { eventType, timeout, logToFile },
        };
    });

// ==========================================================
// ACCIONES DE NETWORK (UPDATED)
// ==========================================================

export const interceptRequestAction = (req, res) =>
    executePlaywrightAction(req, res, 'intercept_request', async (page, opts) => {
        const { urlPattern, method, action, responseMock, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        // Determinar comportamiento
        const handleRoute = async (route) => {
            const request = route.request();

            // Validar Método si se especifica
            if (method && method !== 'ALL' && request.method() !== method) {
                return route.fallback();
            }

            try {
                if (action === 'block') {
                    await route.abort();
                } else if (action === 'mock') {
                    let body = responseMock;
                    try {
                        // Intentar parsear si es string JSON
                        if (typeof body === 'string') {
                            body = JSON.parse(body);
                        }
                    } catch (e) {
                        // Si falla, usar string crudo
                    }

                    await route.fulfill({
                        status: 200,
                        body: typeof body === 'object' ? JSON.stringify(body) : body,
                        contentType: 'application/json',
                    });
                } else if (action === 'modify') {
                    // Por ahora 'modify' sin payload especifico actúa como passthrough
                    // o logging, permitiendo implementar lógica custom futura
                    await route.continue();
                } else {
                    await route.continue();
                }
            } catch (err) {
                // Si la ruta ya fue manejada o cerrada, ignorar
                console.warn('[WARN] Error en intercept_request route handler:', err.message);
            }
        };

        await page.route(urlPattern, handleRoute);

        // Manejo de timeout para des-registrar (opcional, Playwright no tiene un unroute con timeout nativo)
        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: `Intercepción (${action}) configurada para: ${urlPattern}` };
    });

export const mockResponseAction = (req, res) =>
    executePlaywrightAction(req, res, 'mock_response', async (page, opts) => {
        // Envolver mock_response como una especialización de intercept
        const { urlPattern, method = 'GET', status = 200, responseBody, headers, timeout } = opts;

        const handleRoute = async (route) => {
            const request = route.request();
            if (method && request.method() !== method) {
                return route.fallback();
            }

            let finalBody = responseBody;
            // Ensure string for responseBody if it's an object, or keep as string
            if (typeof finalBody !== 'string') {
                finalBody = JSON.stringify(finalBody);
            }

            let finalHeaders = {};
            if (headers) {
                try {
                    finalHeaders = JSON.parse(headers);
                } catch (e) {
                    console.warn('Headers inválidos en mock_response');
                }
            }

            await route.fulfill({
                status,
                body: finalBody,
                headers: finalHeaders,
                contentType: 'application/json', // Default, puede ser sobrescrito en headers
            });
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: req.t('actions.mock_response.success', { urlPattern }) };
    });

export const blockResourceAction = (req, res) =>
    executePlaywrightAction(req, res, 'block_resource', async (page, opts) => {
        const { urlPattern, resourceType, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const handleRoute = async (route) => {
            const request = route.request();
            // Filter by resourceType if specified
            if (resourceType && request.resourceType() !== resourceType) {
                return route.fallback();
            }
            await route.abort();
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return {
            message: req.t('actions.block_resource.success', {
                urlPattern,
                resourceType: resourceType || 'all',
            }),
        };
    });

export const modifyHeadersAction = (req, res) =>
    executePlaywrightAction(req, res, 'modify_headers', async (page, opts) => {
        const { urlPattern, headers, method, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        let headersObj = {};
        try {
            headersObj = JSON.parse(headers);
        } catch (e) {
            throw new Error(req.t('errors.headers_json_required'));
        }

        const handleRoute = async (route) => {
            const request = route.request();
            if (method && request.method() !== method) {
                return route.fallback();
            }

            const originalHeaders = request.headers();
            await route.continue({
                headers: { ...originalHeaders, ...headersObj },
            });
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: req.t('actions.modify_headers.success', { urlPattern }) };
    });

export const waitForResponseAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_response', async (page, opts) => {
        const { urlPattern, statusCode, timeout = 30000, saveToVariable } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        let response;
        if (statusCode) {
            // Use predicate
            response = await page.waitForResponse(
                (resp) => {
                    // So we must verify status.

                    // Workaround: custom simple glob matcher or simple includes.
                    const url = resp.url();
                    // Very basic glob support: *
                    const regex = createRegex(urlPattern);
                    const matchUrl = regex.test(url);
                    const matchStatus = resp.status() === statusCode;

                    return matchUrl && matchStatus;
                },
                { timeout },
            );
        } else {
            // Just match URL
            response = await page.waitForResponse(urlPattern, { timeout });
        }

        let bodyData = null;
        if (saveToVariable && response) {
            try {
                bodyData = await response.json();
            } catch (e) {
                bodyData = await response.text();
            }
            variableManager.set(saveToVariable, bodyData, req.body.runId);
        }

        return {
            message: req.t('actions.wait_for_response.success'),
            data: {
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                savedVariable: saveToVariable ? saveToVariable : null,
            },
        };
    });

export const waitForRequestAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_request', async (page, opts) => {
        const { urlPattern, method, timeout = 30000 } = opts;

        const request = await page.waitForRequest(
            (req) => {
                // URL Match
                // Same regex logic as above
                const regex = createRegex(urlPattern);
                const matchUrl = regex.test(req.url());

                // Method Match
                let matchMethod = true;
                if (method && method !== 'ALL') {
                    matchMethod = req.method() === method;
                }

                return matchUrl && matchMethod;
            },
            { timeout },
        );

        return {
            message: req.t('actions.wait_for_request.success'),
            data: {
                url: request.url(),
                method: request.method(),
                postData: request.postData(),
            },
        };
    });

export const setNetworkConditionsAction = (req, res) =>
    executePlaywrightAction(req, res, 'set_network_conditions', async (page, opts) => {
        const { profile } = opts;

        // Map UI field 'profile' to schema field 'networkProfile'
        await applyNetworkConditions(page, {
            ...opts,
            networkProfile: opts.profile,
            forceThrottling: true,
        });

        return {
            message: req.t('actions.set_network_conditions.success', { profile }),
        };
    });

export const clearAllMocksAction = (req, res) =>
    executePlaywrightAction(req, res, 'clear_all_mocks', async (page) => {
        // Clear all routes defined on the page
        await page.unrouteAll({ behavior: 'ignoreErrors' });

        // Also try to clean up context if necessary, but page.unrouteAll is what "clear_all_mocks" needs for mocks.
        // The network conditions CDP session is not cleared with unrouteAll,
        // but "clear_all_mocks" suggests clearing Stubs/Spies.

        return { message: req.t('actions.clear_all_mocks.success') };
    });

export const persistSessionAction = (req, res) =>
    executePlaywrightAction(req, res, 'persist_session', async (page, opts, browserId, context) => {
        const {
            action = 'save',
            path: savePath,
            includeLocalStorage = true,
            includeSessionStorage = true,
        } = opts;

        if (!savePath) throw new Error('Path es requerido para persistir la sesión');

        // Helper to ensure directory exists
        const ensureDirectory = async (filePath) => {
            const dir = path.dirname(filePath);
            await fsp.mkdir(dir, { recursive: true });
        };

        if (action === 'save') {
            await ensureDirectory(savePath);
            // Default storageState saves cookies and local storage from the Context
            await context.storageState({ path: savePath });
            // Note: storageState captures cookies and localStorage from ALL origins in context.
            return { message: 'Sesión guardada en archivo', data: { path: savePath } };
        } else if (action === 'load') {
            // Load state manually into current context
            let state;
            try {
                const content = await fsp.readFile(savePath, 'utf-8');
                state = JSON.parse(content);
            } catch (e) {
                throw new Error(`No se pudo leer el archivo de sesión en: ${savePath}`);
            }

            if (state.cookies) {
                await context.addCookies(state.cookies);
            }

            if (state.origins) {
                // Inyectar storage para el origen actual si coincide
                const currentOrigin = new URL(page.url()).origin;
                const originState = state.origins.find((o) => o.origin === currentOrigin);

                if (originState && originState.localStorage && includeLocalStorage) {
                    await page.evaluate((ls) => {
                        ls.forEach((item) => window.localStorage.setItem(item.name, item.value));
                    }, originState.localStorage);
                }
                if (originState && originState.sessionStorage && includeSessionStorage) {
                    await page.evaluate((ss) => {
                        ss.forEach((item) => window.sessionStorage.setItem(item.name, item.value));
                    }, originState.sessionStorage);
                }
            }
            return { message: 'Sesión cargada (Best Effort) en contexto activo' };
        } else if (action === 'clear') {
            await context.clearCookies();
            await page.evaluate(() => {
                window.localStorage.clear();
                window.sessionStorage.clear();
            });
            return { message: 'Sesión limpiada (Cookies y Storage)' };
        } else {
            throw new Error(`Acción de persistencia no válida: ${action}`);
        }
    });

export const manageSessionAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_session', async (page, opts, browserId, context) => {
        const { target, action, key, value, variableName, cookiesData } = opts;

        // 1. COOKIES
        if (target === 'cookie') {
            if (action === 'get') {
                const cookies = await context.cookies();
                if (key) {
                    const cookie = cookies.find((c) => c.name === key);
                    const val = cookie ? cookie.value : null;
                    if (variableName) {
                        variableManager.set(variableName, val, req.body.runId);
                    }
                    return {
                        message: `Cookie ${key} obtenida: ${val}`,
                        data: { value: val, cookie, variableStored: variableName },
                    };
                }
                return { message: 'Cookies obtenidas', data: { cookies } };
            } else if (action === 'set') {
                let url = 'http://localhost';
                try {
                    url = page.url();
                    if (url === 'about:blank') url = 'http://localhost';
                } catch (e) {
                    console.error('Error getting page URL for session cookie:', e);
                }

                const cookiesToSet = cookiesData
                    ? JSON.parse(cookiesData)
                    : [{ name: key, value, url }];
                await context.addCookies(
                    Array.isArray(cookiesToSet) ? cookiesToSet : [cookiesToSet],
                );
                return { message: 'Cookies establecidas' };
            } else if (action === 'delete') {
                const currentCookies = await context.cookies();
                const namesToDelete = cookiesData
                    ? new Set(JSON.parse(cookiesData))
                    : new Set([key]);
                const cookiesToKeep = currentCookies.filter((c) => !namesToDelete.has(c.name));
                await context.clearCookies();
                if (cookiesToKeep.length > 0) await context.addCookies(cookiesToKeep);
                return { message: 'Cookies eliminadas' };
            } else if (action === 'clear') {
                await context.clearCookies();
                return { message: 'Cookies limpiadas' };
            }
        }

        // 2. STORAGE (Local / Session)
        if (target === 'local_storage' || target === 'session_storage') {
            const storageType = target === 'session_storage' ? 'session' : 'local';
            if (action === 'get') {
                const data = await page.evaluate(
                    ({ storageType, key }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        return key ? storage.getItem(key) : JSON.stringify(storage);
                    },
                    { storageType, key },
                );
                if (variableName) {
                    variableManager.set(variableName, data, req.body.runId);
                }
                return {
                    message: `${target} obtenido: ${data}`,
                    data: { value: data, variableStored: variableName },
                };
            } else if (action === 'set') {
                await page.evaluate(
                    ({ storageType, key, value }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.setItem(key, value);
                    },
                    { storageType, key, value },
                );
                return { message: `${target} actualizado` };
            } else if (action === 'delete') {
                await page.evaluate(
                    ({ storageType, key }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.removeItem(key);
                    },
                    { storageType, key },
                );
                return { message: `${target} eliminado` };
            } else if (action === 'clear') {
                await page.evaluate(
                    ({ storageType }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.clear();
                    },
                    { storageType },
                );
                return { message: `${target} limpiado` };
            }
        }

        // 3. HEADER
        if (target === 'header') {
            if (action === 'set') {
                await page.setExtraHTTPHeaders({ [key]: value });
                return { message: `Header ${key} inyectado` };
            }
            throw new Error(`Acción ${action} no soportada para headers`);
        }

        // 4. QUERY
        if (target === 'query') {
            if (action === 'set') {
                const currentUrl = new URL(page.url());
                currentUrl.searchParams.set(key, value);
                await page.goto(currentUrl.toString());
                return { message: `Query param ${key} inyectado y página recargada` };
            }
            throw new Error(`Acción ${action} no soportada para query params`);
        }

        throw new Error(`Combinación de target ${target} y acción ${action} no válida`);
    });

/**
 * Specialized wrapper for Cookies management
 */
export const manageCookiesAction = (req, res) => {
    req.body.target = 'cookie';
    return manageSessionAction(req, res);
};

/**
 * Specialized wrapper for Local/Session Storage management
 */
export const manageStorageAction = (req, res) => {
    const { storageType } = req.body;
    req.body.target = storageType === 'session' ? 'session_storage' : 'local_storage';
    if (req.body.action === 'remove') req.body.action = 'delete'; // Compatibility
    return manageSessionAction(req, res);
};

/**
 * Specialized wrapper for Token injection (Headers, Cookies, Query)
 */
export const injectTokensAction = (req, res) => {
    req.body.action = 'set';
    return manageSessionAction(req, res);
};

export const createContextAction = (req, res) =>
    executePlaywrightAction(req, res, 'create_context', async (_page, _opts, browserId) => {
        // Note: executePlaywrightAction already attempts to obtain a context.
        // If we want to force a new one, we should use browser.newContext() directly.
        // However, the current getOrCreateContext logic in the controller already handles this.
        // To be explicit, here we could close the current one and open a new one with options
        // if necessary, but for simplicity we'll return the success of obtaining it.

        return {
            message: req.t('actions.create_context.success'),
            data: { browserId },
        };
    });

export const cleanupStateAction = (req, res) =>
    executePlaywrightAction(req, res, 'cleanup_state', async (page, opts, browserId, context) => {
        await context.clearCookies();
        // Clear local and session storage
        await page.evaluate(() => {
            try {
                window.localStorage.clear();
                window.sessionStorage.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        return { message: req.t('actions.cleanup_state.success') };
    });

export const closeContextAction = (req, res) =>
    executePlaywrightAction(
        req,
        res,
        'close_context',
        async (_page, _opts, _browserId, context) => {
            await context.close();
            return { message: req.t('actions.close_context.success') };
        },
    );

export const handleHooksAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_hooks', async (page, opts) => {
        // Implementación básica: ejecutar script de hook
        const { hookScript } = opts;
        if (hookScript) {
            await page.evaluate(hookScript);
            return { message: req.t('actions.handle_hooks.success') };
        }
        return { message: req.t('actions.handle_hooks.no_script') };
    });

export const controlExceptionsAction = (req, res) =>
    executePlaywrightAction(req, res, 'control_exceptions', async (page) => {
        // Configure handling of uncaught exceptions on the page
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (event) => {
                console.warn('[PAGE UNHANDLED REJECTION]', event.reason);
            });

            window.addEventListener('error', (event) => {
                console.warn('[PAGE ERROR]', event.message);
            });
        });
        return { message: req.t('actions.control_exceptions.success') };
    });

export const readDataAction = (req, res) =>
    executePlaywrightAction(req, res, 'read_data', async (page, opts) => {
        const { selector, type = 'text', variableName } = opts; // type: 'text', 'html', 'attributes'

        let data;
        if (type === 'text') {
            data = await page.textContent(selector);
        } else if (type === 'html') {
            data = await page.innerHTML(selector);
        } else {
            // Implement attribute logic if necessary
            return { message: req.t('actions.read_data.unsupported_type'), data: {} };
        }

        // Persist to variables if requested
        if (variableName) {
            variableManager.set(variableName, data, req.body.runId);
        }

        return {
            message: req.t('actions.read_data.success'),
            data: { content: data, variableName: variableName || undefined },
        };
    });

export const saveResultsAction = (req, res) =>
    executePlaywrightAction(req, res, 'save_results', async (page, opts) => {
        const { data, path: savePath, variableName } = opts;

        // Security check: Prevent Path Traversal
        if (!isSafePath(savePath, STORAGE_DIR)) {
            throw new Error(
                req.t('errors.unsafe_path', { path: savePath }) || `Unsafe path: ${savePath}`,
            );
        }

        await fsp.writeFile(
            savePath,
            typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        );

        // Persist path to variable if requested
        if (variableName) {
            variableManager.set(variableName, savePath, req.body.runId);
        }

        return {
            message: req.t('actions.save_results.success'),
            data: { path: savePath, variableName: variableName || undefined },
        };
    });

export const handleDownloadsAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_downloads', async (page, opts) => {
        const { selector, path: savePath, variableName } = opts;

        const downloadPromise = page.waitForEvent('download');
        await page.click(selector);
        const download = await downloadPromise;

        // Security check: Prevent Path Traversal
        if (!isSafePath(savePath, STORAGE_DIR)) {
            throw new Error(
                req.t('errors.unsafe_path', { path: savePath }) || `Unsafe path: ${savePath}`,
            );
        }

        await download.saveAs(savePath);

        // Persist path to variable if requested
        if (variableName) {
            variableManager.set(variableName, savePath, req.body.runId);
        }

        return {
            message: req.t('actions.handle_downloads.success'),
            data: { path: savePath, variableName: variableName || undefined },
        };
    });

export const runTestsAction = (req, res) => {
    const { testSuite, parallel, retries, reportFormat, timeout } = req.body;

    smartEmitLog(`[TEST RUNNER] Starting execution of suite: ${testSuite || 'all'}`, 'info');

    if (parallel > 1) {
        smartEmitLog(`[TEST RUNNER] Distributing across ${parallel} workers...`, 'info');
    }

    if (reportFormat) {
        smartEmitLog(`[TEST RUNNER] Report format set to: ${reportFormat}`, 'info');
    }

    return res.status(200).json({
        success: true,
        message: req.t('actions.run_tests.success') || 'Test execution simulation triggered',
        data: { testSuite, parallel, retries, reportFormat, timeout },
    });
};

export const integrateCiAction = (req, res) => {
    const { provider = 'auto', verbose = true } = req.body;

    let detectedProvider = provider;
    const ciVars = {};

    // 1. Detection Logic
    if (provider === 'auto' || provider === 'github') {
        if (process.env.GITHUB_ACTIONS) {
            detectedProvider = 'github';
            ciVars.CI_PLATFORM = 'GitHub Actions';
            ciVars.CI_RUN_ID = process.env.GITHUB_RUN_ID;
            ciVars.CI_ACTOR = process.env.GITHUB_ACTOR;
            ciVars.CI_REPOSITORY = process.env.GITHUB_REPOSITORY;
        }
    }

    if ((provider === 'auto' || provider === 'gitlab') && !ciVars.CI_PLATFORM) {
        if (process.env.GITLAB_CI) {
            detectedProvider = 'gitlab';
            ciVars.CI_PLATFORM = 'GitLab CI';
            ciVars.CI_RUN_ID = process.env.CI_PIPELINE_ID;
            ciVars.CI_ACTOR = process.env.GITLAB_USER_LOGIN;
            ciVars.CI_REPOSITORY = process.env.CI_PROJECT_PATH;
        }
    }

    if ((provider === 'auto' || provider === 'jenkins') && !ciVars.CI_PLATFORM) {
        if (process.env.JENKINS_URL) {
            detectedProvider = 'jenkins';
            ciVars.CI_PLATFORM = 'Jenkins';
            ciVars.CI_RUN_ID = process.env.BUILD_NUMBER;
            ciVars.CI_ACTOR = process.env.BUILD_USER_ID || 'anonymous';
            ciVars.CI_REPOSITORY = process.env.JOB_NAME;
        }
    }

    // Fallback if nothing detected but provider was specified
    if (!ciVars.CI_PLATFORM && provider !== 'auto') {
        ciVars.CI_PLATFORM = provider;
        ciVars.CI_STATUS = 'Generic/Manual';
    }

    // 2. Persist to VariableManager (Global)
    Object.entries(ciVars).forEach(([key, val]) => {
        if (val) variableManager.set(key, val, 'global');
    });

    if (verbose && ciVars.CI_PLATFORM) {
        smartEmitLog(
            `[CI] provider detected: ${ciVars.CI_PLATFORM} (Run ID: ${ciVars.CI_RUN_ID})`,
            'info',
        );
    } else if (verbose) {
        smartEmitLog(`[CI] No CI environment detected. Running in local mode.`, 'info');
    }

    return res.status(200).json({
        success: true,
        message: ciVars.CI_PLATFORM
            ? `CI environment recognized: ${ciVars.CI_PLATFORM}`
            : 'CI integration initialized (Local/Manual)',
        data: {
            detectedProvider,
            variables: ciVars,
        },
    });
};

export const cliParamsAction = (req, res) => {
    const { paramName, paramType, defaultValue, required } = req.body;

    // 1. Search in process.env, req.query, or req.params (for webhook-like triggers)
    let value =
        process.env[paramName] || req.query[paramName] || req.params[paramName] || req.body.value;

    // 2. Fallback to default
    if (value === undefined || value === null || value === '') {
        value = defaultValue;
    }

    // 3. Check if required
    if (required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({
            success: false,
            message: `Required CLI parameter missing: ${paramName}`,
        });
    }

    // 4. Type conversion
    if (paramType === 'number') value = Number(value);
    if (paramType === 'boolean') value = String(value).toLowerCase() === 'true';

    // 5. Persist to Global variable scope
    variableManager.set(paramName, value, 'global');

    smartEmitLog(`[CLI] Parameter injected: ${paramName} = ${value}`, 'info');

    return res.status(200).json({
        success: true,
        message: `CLI parameter ${paramName} injected successfully`,
        data: { [paramName]: value },
    });
};

export const returnCodeAction = (req, res) => {
    const { successField = 'success', exitOnFail = true, customCodes, verbose = true } = req.body;

    // We look for the success state in the variables (defaulting to the 'success' variable)
    const isSuccess = variableManager.get(successField, req.body.runId) !== false;

    let codes = { success: 0, failed: 1 };
    if (customCodes) {
        try {
            codes = typeof customCodes === 'string' ? JSON.parse(customCodes) : customCodes;
        } catch (e) {
            console.warn('[ReturnCode] Failed to parse customCodes JSON');
        }
    }

    const finalCode = isSuccess ? codes.success : codes.failed;

    // Store in a reserved global variable
    variableManager.set('HAL_RETURN_CODE', finalCode, 'global');

    if (verbose) {
        smartEmitLog(
            `[SYSTEM] Final return code set to: ${finalCode} (Success: ${isSuccess})`,
            'info',
        );
    }

    if (!isSuccess && exitOnFail) {
        smartEmitLog(`[SYSTEM] Flow flagged to exit with failure code.`, 'warning');
    }

    return res.status(200).json({
        success: true,
        message: `Return code ${finalCode} registered`,
        data: { code: finalCode, exitOnFail },
    });
};

export const integrateCIAction = (req, res) => {
    const { provider = 'auto', saveArtifacts, outputPath, envVariables } = req.body;

    const ciData = {
        CI: !!process.env.CI,
        GITHUB_ACTIONS: !!process.env.GITHUB_ACTIONS,
        GITLAB_CI: !!process.env.GITLAB_CI,
        REPO: process.env.GITHUB_REPOSITORY || process.env.CI_PROJECT_PATH || 'unknown',
        SHA: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'local',
        BRANCH: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME || 'main',
    };

    // Populate variable manager with CI metadata
    Object.entries(ciData).forEach(([key, val]) => {
        variableManager.set(`CI_${key}`, val, 'global');
    });

    // Handle extra env variables
    if (envVariables) {
        try {
            const extra =
                typeof envVariables === 'string' ? JSON.parse(envVariables) : envVariables;
            Object.entries(extra).forEach(([k, v]) => {
                variableManager.set(k, v, 'global');
            });
        } catch (e) {
            console.warn('[IntegrateCI] Failed to parse envVariables');
        }
    }

    smartEmitLog(
        `[CI/CD] Integration active for provider: ${provider}. Metadata captured.`,
        'info',
    );

    return res.status(200).json({
        success: true,
        message: req.t('actions.integrate_ci.success'),
        data: { ciData, artifactsPath: saveArtifacts ? outputPath : null },
    });
};

// Acciones adicionales del router original
export const dragDropAction = (req, res) =>
    executePlaywrightAction(req, res, 'drag_drop', async (page, opts) => {
        const { sourceSelector, targetSelector, steps = 10, force = false } = opts;

        if (!sourceSelector || !targetSelector) {
            const error = new Error(req.t('errors.source_target_required'));
            error.status = 400;
            throw error;
        }

        console.log(
            `[INFO] Dragging ${sourceSelector} to ${targetSelector}. Steps: ${steps}, Force: ${force}`,
        );

        await page.dragAndDrop(sourceSelector, targetSelector, {
            steps: Number(steps),
            force,
            timeout: 30000,
        });

        return {
            message: req.t('actions.drag_drop.success', {
                source: sourceSelector,
                target: targetSelector,
            }),
            traceDetails: { sourceSelector, targetSelector, steps, force },
        };
    });
/**
 * Consolidates intercept_request, block_resource, modify_headers, mock_response
 */
export const configureRouteAction = (req, res) =>
    executePlaywrightAction(req, res, 'configure_route', async (page, opts) => {
        const {
            urlPattern,
            routeAction = 'abort',
            method,
            statusCode = 200,
            responseBody,
            headers,
            timeout,
        } = opts;
        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const handleRoute = async (route) => {
            const request = route.request();
            const methodFilter =
                method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
            if (methodFilter && request.method().toUpperCase() !== methodFilter) {
                return route.fallback();
            }

            try {
                if (routeAction === 'abort') {
                    await route.abort();
                } else if (routeAction === 'mock') {
                    let finalBody = responseBody;
                    if (typeof finalBody !== 'string' && finalBody) {
                        finalBody = JSON.stringify(finalBody);
                    }
                    let finalHeaders = {};
                    if (headers) {
                        try {
                            finalHeaders = JSON.parse(headers);
                        } catch (e) {
                            console.warn('[WARN] Invalid headers JSON in mock');
                        }
                    }
                    await route.fulfill({
                        status: Number(statusCode),
                        body: finalBody,
                        headers: finalHeaders,
                        contentType: 'application/json',
                    });
                } else if (routeAction === 'modify_headers') {
                    let headersObj = {};
                    try {
                        headersObj = JSON.parse(headers || '{}');
                    } catch (e) {
                        throw new Error(req.t('errors.headers_json_required'));
                    }
                    const originalHeaders = request.headers();
                    await route.continue({
                        headers: { ...originalHeaders, ...headersObj },
                    });
                } else if (routeAction === 'log') {
                    console.log(`[ROUTE LOG] ${request.method()} ${request.url()}`);
                    await route.continue();
                } else {
                    await route.continue();
                }
            } catch (err) {
                console.warn(`[WARN] Route handler error for ${urlPattern}: ${err.message}`);
            }
        };

        await page.route(urlPattern, handleRoute);
        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }
        return { message: `Route configured (${routeAction}) for: ${urlPattern}` };
    });

/**
 * Helper to create a regex from a URL pattern string
 */
const createRegex = (str) => {
    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(escaped, 'i'); // Case-insensitive and partial match
};

/**
 * Consolidates wait_for_request and wait_for_response
 */
export const waitNetworkMatchAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_network_match', async (page, opts, targetBrowserId) => {
        const { type = 'response', urlPattern, method, statusCode, timeout = 30000 } = opts;
        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const regex = createRegex(urlPattern);

        // 1. Check History FIRST (Avoid race conditions in sequential flows like Reload -> Wait)
        const historyMatch = networkHistoryService.findMatch(targetBrowserId, {
            type,
            regex,
            method,
            statusCode,
            since: Date.now() - 60000, // Look back up to 1 minute
        });

        if (historyMatch) {
            console.log(`[INFO] Found matching ${type} in background history: ${historyMatch.url}`);
            return {
                message: `Matched ${type} from history: ${historyMatch.url} (${
                    historyMatch.status || historyMatch.method
                })`,
                data: historyMatch,
            };
        }

        // 2. If not in history, start fresh listener
        let data = {};

        if (type === 'request') {
            const request = await page.waitForRequest(
                (req) => {
                    const matchUrl = regex.test(req.url());
                    const methodFilter =
                        method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
                    const matchMethod =
                        !methodFilter || req.method().toUpperCase() === methodFilter;
                    return matchUrl && matchMethod;
                },
                { timeout: Number(timeout) },
            );
            data = { url: request.url(), method: request.method() };
        } else {
            const response = await page.waitForResponse(
                (resp) => {
                    const matchUrl = regex.test(resp.url());
                    const reqMethod = resp.request().method().toUpperCase();
                    const methodFilter =
                        method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
                    const matchMethod = !methodFilter || reqMethod === methodFilter;
                    const matchStatus = !statusCode || resp.status() === Number(statusCode);
                    return matchUrl && matchMethod && matchStatus;
                },
                { timeout: Number(timeout) },
            );
            data = { url: response.url(), status: response.status() };
        }
        return {
            message: `Waited for ${type} matching ${urlPattern}`,
            data,
        };
    });

/**
 * Acción genérica de interaccion que despacha a otras acciones según el campo 'action'.
 * Frontend usa esto para nodos genéricos de interaccion.
 */
export async function interactionAction(req, res) {
    let { action } = req.body;

    // Inferencia de accion si no viene explícita (parche para frontend)
    if (!action) {
        const body = req.body;
        if (body.browserType) {
            action = 'launch_browser';
        } else if (body.selector) {
            if (body.text) action = 'type_text';
            else action = 'click';
        } else if (body.url) {
            action = 'open_url';
        } else if (body.browserId && Object.keys(body).length <= 3) {
            // Heurística para close_browser: tiene browserId y pocas propiedades
            action = 'close_browser';
        }

        if (action) {
            console.log(`[INFO] Inferred action: ${action} from body keys: ${Object.keys(body)}`);
        }
    }

    console.log(`[INFO] Dispatching interaction action: ${action}`);

    // Mapa de acciones soportadas por el dispatcher
    const actionMap = {
        configure_route: configureRouteAction,
        wait_network_match: waitNetworkMatchAction,
        click: clickAction,
        type_text: typeTextAction,
        type: typeTextAction, // Common alias
        select_option: selectOptionAction,
        wait_visible: waitVisibleAction,
        wait_for_element: waitForElementAction,
        take_screenshot: takeScreenshotAction,
        execute_js: executeJsAction,
        navigate: openUrlAction, // Alias for open_url
        open_url: openUrlAction,
        launch_browser: launchBrowserAction,
        close_browser: closeBrowserAction,
        set_network_conditions: setNetworkConditionsAction,
        clear_all_mocks: clearAllMocksAction,
        wait_network: waitNetworkAction,
        listen_events: listenEventsAction,
        scroll: scrollAction,
        hover: hoverAction,
        upload_file: uploadFileAction,
        manage_cookies: manageCookiesAction,
        manage_storage: manageStorageAction,
        drag_drop: dragDropAction,
        reload_page: reloadAction,
        cli_params: cliParamsAction,
        return_code: returnCodeAction,
        run_tests: runTestsAction,
        integrate_ci: integrateCiAction,
        switch: switchAction,
    };

    const handler = actionMap[action];

    if (handler) {
        return handler(req, res);
    }

    console.warn(`[WARN] Acción no soportada en interactionAction: ${action}`);
    return res.status(400).json({
        success: false,
        message: req.t('actions.interaction.error_unsupported_action', { action }),
        availableActions: Object.keys(actionMap),
    });
}

export const resizeViewportAction = (req, res) =>
    executePlaywrightAction(req, res, 'resize_viewport', async (page, opts) => {
        const { devicePreset } = opts;
        let { width, height } = opts;

        // If a preset is provided, use its dimensions
        if (devicePreset && DEVICE_PRESETS[devicePreset]) {
            width = DEVICE_PRESETS[devicePreset].width;
            height = DEVICE_PRESETS[devicePreset].height;
        }

        if (!width || !height) {
            const error = new Error(req.t('errors.width_height_required'));
            error.status = 400;
            throw error;
        }

        const w = Number(width);
        const h = Number(height);

        // 1. Resize Internal Viewport
        await page.setViewportSize({ width: w, height: h });

        // 2. Attempt to resize physical window if headful
        try {
            const browser = page.context().browser();
            if (browser) {
                const browserId = req.body.browserId;
                const entry = browserService.get(browserId);

                // If we are in headful (headless=false), we try to resize the window via CDP or window calls
                if (entry && !entry.options.headless) {
                    console.log(`[ResizeViewport] Attempting physical resize to ${w}x${h}`);

                    // Chromium specific: using CDP instance to resize window
                    const session = await page.context().newCDPSession(page);
                    const { windowId } = await session.send('Browser.getWindowForTarget');
                    await session.send('Browser.setWindowBounds', {
                        windowId,
                        bounds: { width: w + 20, height: h + 100 }, // Add broad padding for headful UI
                    });
                    await session.detach();
                }
            }
        } catch (err) {
            console.warn('[ResizeViewport] Could not resize physical window:', err.message);
        }

        return {
            message: req.t('actions.resize_viewport.success', { width: w, height: h }),
            traceDetails: { width: w, height: h, devicePreset },
        };
    });

// ==========================================================
// FLOW CONTROL ACTIONS
// ==========================================================

export const variableAction = async (req, res) => {
    try {
        const { operation = 'set', name, value, scope = 'flow', runId } = req.body;

        let result;
        let message;

        switch (operation) {
            case 'set':
                variableManager.set(name, value, runId, scope);
                result = { name, value, scope, operation: 'set' };
                message = req.t('actions.variable.set_success', { name, scope });
                // Emit real-time update
                emitVariableChange({ name, value, scope, operation: 'set' });
                break;

            case 'get': {
                const getValue = variableManager.get(name, runId);
                result = { name, value: getValue, scope, operation: 'get' };
                message = req.t('actions.variable.get_success', { name });
                break;
            }

            case 'increment': {
                const amount = typeof value === 'number' ? value : 1;
                variableManager.increment(name, amount, runId);
                const newValue = variableManager.get(name, runId);
                result = { name, value: newValue, amount, scope, operation: 'increment' };
                message = req.t('actions.variable.increment_success', { name, amount });
                emitVariableChange({ name, value: newValue, scope, operation: 'increment' });
                break;
            }

            case 'push': {
                variableManager.push(name, value, runId);
                const array = variableManager.get(name, runId);
                result = { name, array, scope, operation: 'push' };
                message = req.t('actions.variable.push_success', { name });
                emitVariableChange({ name, value: array, scope, operation: 'push' });
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid operation: ${operation}`,
                });
        }

        return res.status(200).json({
            success: true,
            message,
            data: result,
        });
    } catch (error) {
        console.error('[ERROR] variableAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.variable.error'),
            error: error.message,
        });
    }
};

export const conditionalAction = async (req, res) => {
    try {
        const {
            conditions,
            logic: bodyLogic = 'AND',
            branches: bodyBranches,
            runId: bodyRunId,
            variables,
            configuration,
        } = req.body;

        // Configuration takes precedence if present
        const branches = configuration?.branches || bodyBranches || [];
        const logic = configuration?.logic || bodyLogic;
        const runId = bodyRunId || 'global';
        const debugMode = req.body.debugMode || configuration?.debugMode || false;

        // Always log basic info to console for developer visibility
        console.log(`[Conditional] Starting evaluation for node: ${req.body.nodeId || 'unknown'}`);

        // 🔍 INCOMING DATA DIAGNOSTIC & SEEDING
        // Seed the variable manager with incoming variables to ensure isolated runs work
        if (variables && typeof variables === 'object') {
            console.log(
                `[ActionController] 🌱 Seeding ${Object.keys(variables).length} variables into runId: ${runId}`,
            );
            Object.entries(variables).forEach(([k, v]) => {
                variableManager.set(k, v, runId);
            });
        }

        const allVars = variableManager.getAll(runId);
        const varKeys = Object.keys(allVars);
        console.log(
            `[Conditional] 📥 Available variables (${varKeys.length}):`,
            varKeys.slice(0, 10).join(', ') + (varKeys.length > 10 ? '...' : ''),
        );

        // Log specific values for variables used in branches to satisfy user request
        if (branches && Array.isArray(branches)) {
            branches.forEach((branch, idx) => {
                try {
                    if (branch.expression && typeof branch.expression === 'object') {
                        const { left, right } = branch.expression;
                        const valL = variableManager.resolveValue(left, runId);
                        const valR = variableManager.resolveValue(right, runId);
                        console.log(
                            `[Conditional][Branch ${idx}] 📍 Data Check: "${left}" -> ${JSON.stringify(valL)} | "${right}" -> ${JSON.stringify(valR)}`,
                        );
                    }
                } catch (e) {
                    console.log(`[Conditional] 📍 Diagnostic skip for branch ${idx}: ${e.message}`);
                }
            });
        }

        if (debugMode) {
            smartEmitLog(
                `[Conditional] Starting evaluation (Logic: ${logic}, Branches: ${branches?.length || 0})`,
                'info',
                req.body.nodeId,
            );
        }

        if (branches && Array.isArray(branches) && branches.length > 0) {
            let matchedBranch = null;
            const trace = {};

            for (const branch of branches) {
                // Skip fallback branches for evaluation
                if (branch.isFallback || branch.id === 'false' || branch.id === 'Else') continue;

                let branchMatched = false;
                let rL = undefined;
                let rR = undefined;
                try {
                    const expr = branch.expression || {};
                    rL = variableManager.resolveValue(expr.left, runId);
                    rR = variableManager.resolveValue(expr.right, runId);

                    let exprResult = false;
                    if (typeof branch.expression === 'string') {
                        exprResult = variableManager.evaluate(branch.expression, runId, {}, true);
                    } else {
                        exprResult = variableManager.evaluateStructured(
                            branch.expression,
                            runId,
                            true,
                        );
                    }

                    branchMatched =
                        !branch.expression ||
                        Object.keys(branch.expression).length === 0 ||
                        exprResult === true;

                    // User-friendly log format
                    const logLabel = branch.label || branch.id;
                    const comparison = branch.expression
                        ? `Comparing [${expr.left || '?'}] (${JSON.stringify(rL)}) with [${expr.right || '?'}] (${JSON.stringify(rR)})`
                        : 'Default Catch-all (No expression)';
                    const statusIcon = branchMatched ? '✅ MATCH' : '❌ NO MATCH';

                    smartEmitLog(
                        `[Conditional] Branch "${logLabel}": ${comparison} -> ${statusIcon}`,
                        'info',
                        req.body.nodeId,
                    );
                } catch (e) {
                    smartEmitLog(
                        `[Conditional] 💥 Error evaluating branch "${branch.label}": ${e.message}`,
                        'error',
                        req.body.nodeId,
                    );
                    trace[branch.id || branch.label] = {
                        matched: false,
                        status: 'error',
                        error: e.message,
                        resolvedLeft: rL,
                        resolvedRight: rR,
                    };
                }

                if (!trace[branch.id || branch.label]) {
                    trace[branch.id || branch.label] = {
                        matched: branchMatched,
                        status: branchMatched ? 'matched' : 'not_matched',
                        resolvedLeft: rL,
                        resolvedRight: rR,
                    };
                }

                if (branchMatched) {
                    matchedBranch = branch;
                    break; // FIRST MATCH WINS
                }
            }

            // Mark skipped branches
            for (const branch of branches) {
                const bId = branch.id || branch.label;
                if (!trace[bId]) {
                    trace[bId] = { matched: false, status: 'skipped' };
                }
            }

            const requestedFallback =
                configuration?.fallbackPath || req.body.fallbackPath || 'false';

            // Fallback logic if no branch matched
            if (!matchedBranch) {
                matchedBranch = branches.find(
                    (b) =>
                        b.isFallback ||
                        b.id === 'false' ||
                        b.id === 'Else' ||
                        (!b.expression && b.id !== requestedFallback),
                );
                if (matchedBranch) {
                    smartEmitLog(
                        `[Conditional] 🛡️ No matches found. Routing to Fallback: "${matchedBranch.label || requestedFallback}"`,
                        'info',
                        req.body.nodeId,
                    );
                    const bId = matchedBranch.id || matchedBranch.label;
                    trace[bId] = { matched: true, status: 'matched' };
                }
            }

            const finalPath = matchedBranch
                ? matchedBranch.id || matchedBranch.label
                : requestedFallback;
            const finalResult = !!matchedBranch;

            smartEmitLog(
                `[Conditional] ✅ Final Decision: ${matchedBranch?.label || finalPath}`,
                'success',
                req.body.nodeId,
            );

            return res.json({
                success: true,
                data: {
                    result: finalResult,
                    path: finalPath,
                    branchLabel: matchedBranch?.label,
                    trace,
                },
            });
        }

        // LEGACY LOGIC: Single conditions array -> true/false
        const result = variableManager.evaluateConditions(conditions, logic, runId);

        return res.status(200).json({
            success: true,
            status: result ? 'true' : 'false',
            message: req.t('actions.conditional.success'),
            data: {
                result,
                path: result ? 'true' : 'false',
                conditions,
                logic,
            },
        });
    } catch (error) {
        console.error('[ERROR] conditionalAction:', error.message);

        const continueOnFailure =
            req.body.configuration?.continueOnFailure || req.body.continueOnFailure || false;
        if (continueOnFailure) {
            smartEmitLog(
                `[Conditional] 🛡️ Soft Fail: Routing to "Else" due to error: ${error.message}`,
                'warning',
                req.body.nodeId,
            );
            return res.json({
                success: true,
                data: {
                    result: false,
                    path: 'Else',
                    error: error.message,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: req.t('actions.conditional.error'),
            error: error.message,
        });
    }
};

export const switchAction = async (req, res) => {
    try {
        const {
            variableName: bodyVariableName,
            cases: bodyCases,
            runId: bodyRunId,
            variables,
            configuration,
            nodeId,
        } = req.body;

        // Configuration takes precedence
        const variableName = configuration?.variableName || bodyVariableName;
        const cases = configuration?.cases || bodyCases || [];
        const comparisonType = configuration?.comparisonType || 'equals';
        const runId = bodyRunId || 'global';

        console.log(
            `[Switch] Starting evaluation for node: ${nodeId || 'unknown'} (comparison: ${comparisonType})`,
        );

        // 🟢 SEED VARIABLE CONTEXT
        if (variables && typeof variables === 'object') {
            console.log(
                `[Switch] 🌱 Seeding ${Object.keys(variables).length} variables into runId: ${runId}`,
            );
            Object.entries(variables).forEach(([k, v]) => {
                variableManager.set(k, v, runId);
            });
        }

        // 1. Resolve the variable value
        let resolvedValue = variableManager.resolveValue(variableName, runId);

        // If resolution yields a string that looks like a placeholder, it might be unresolved
        const isUnres = (v) => typeof v === 'string' && (v.includes('{{') || v.includes('${'));
        if (isUnres(resolvedValue)) {
            console.warn(`[Switch] ⚠️ Expression "${variableName}" unresolved: ${resolvedValue}`);
            smartEmitLog(
                `[Switch] ⚠️ Expression "${variableName}" could not be resolved. Value is undefined.`,
                'warning',
                nodeId,
            );
            resolvedValue = undefined;
        }

        smartEmitLog(
            `[Switch] Evaluating "${variableName}" -> [${JSON.stringify(resolvedValue)}] (${typeof resolvedValue}) using ${comparisonType}`,
            'info',
            nodeId,
        );

        // 2. Normalize helper — conservative: only trims strings and converts numeric strings.
        //    Does NOT convert "0"->false, "1"->true, "yes"->true, "no"->false to avoid invisible bugs.
        //    Guards against exotic formats: hex (0x1A), scientific (1e5), Infinity are treated as strings.
        const normalize = (val) => {
            if (val === null || val === undefined) return val;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') {
                const s = val.trim();
                // Only convert unambiguous decimal numeric strings (integers and floats)
                // Reject: hex (0x...), octal (0o...), binary (0b...), scientific (1e5), Infinity, NaN
                if (s !== '' && /^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
                return s;
            }
            return val;
        };

        // 3. Comparison function based on comparisonType
        const compare = (resolved, caseVal) => {
            switch (comparisonType) {
                case 'contains':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .includes(String(caseVal ?? '').toLowerCase());
                case 'startsWith':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .startsWith(String(caseVal ?? '').toLowerCase());
                case 'endsWith':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .endsWith(String(caseVal ?? '').toLowerCase());
                case 'regex': {
                    try {
                        const regex = new RegExp(String(caseVal ?? ''), 'i');
                        return regex.test(String(resolved ?? ''));
                    } catch (regexErr) {
                        console.warn(
                            `[Switch] ⚠️ Invalid regex pattern "${caseVal}": ${regexErr.message}`,
                        );
                        return false;
                    }
                }
                case 'equals':
                default:
                    return normalize(resolved) === normalize(caseVal);
            }
        };

        // 4. Find matching case
        let matchedCase = null;
        const trace = {};

        let normalizedCases = cases;
        if (cases && typeof cases === 'object' && !Array.isArray(cases)) {
            // Convert legacy object format { "value": "pathId" } to array format
            normalizedCases = Object.entries(cases).map(([val, pathId]) => ({
                id: pathId,
                value: val,
                label: val,
            }));
        }

        if (Array.isArray(normalizedCases)) {
            for (const c of normalizedCases) {
                if (c.value === 'default') continue; // Default is handled as fallback
                // Resolve variables in case value (allows comparing against other variables)
                const rawCaseValue = variableManager.resolveValue(c.value, runId);
                const isMatch = compare(resolvedValue, rawCaseValue);

                trace[c.id] = {
                    value: c.value,
                    resolvedCaseValue: rawCaseValue,
                    normalizedResolved: normalize(resolvedValue),
                    normalizedCase: normalize(rawCaseValue),
                    comparisonType,
                    matched: isMatch,
                };

                const logLabel = c.label || c.value || c.id;
                smartEmitLog(
                    `[Switch] Case "${logLabel}": ${comparisonType}([${JSON.stringify(resolvedValue)}], [${JSON.stringify(rawCaseValue)}]) -> ${isMatch ? '✅ MATCH' : '❌ NO'}`,
                    'info',
                    nodeId,
                );

                if (isMatch) {
                    matchedCase = c;
                    break;
                }
            }
        }

        let finalPath = matchedCase ? matchedCase.id : 'default';
        // Handle legacy default key in object cases
        if (
            !matchedCase &&
            cases &&
            typeof cases === 'object' &&
            !Array.isArray(cases) &&
            cases.default
        ) {
            finalPath = cases.default;
        }

        smartEmitLog(
            `[Switch] ✅ Final Decision: ${matchedCase ? matchedCase.label || matchedCase.id : 'Default'} (path: ${finalPath})`,
            'success',
            nodeId,
        );

        return res.json({
            success: true,
            path: finalPath, // Root level for DPE
            data: {
                resolvedValue,
                path: finalPath,
                targetPath: finalPath, // Legacy support
                matchedCaseId: matchedCase?.id || null,
                matchedCaseLabel: matchedCase?.label || null,
                comparisonType,
                trace,
            },
        });
    } catch (error) {
        console.error('[ERROR] switchAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error executing switch action',
            error: error.message,
        });
    }
};

export const loopAction = async (req, res) => {
    try {
        const {
            nodeId,
            mode,
            loopType: inputLoopType,
            iterations,
            condition,
            array: arrayInput,
            itemVar = 'item',
            indexVar = 'i',
            maxIterations = 1000,
        } = req.body;

        let loopType = inputLoopType;
        if (!loopType) {
            const normalizedMode = mode;
            if (normalizedMode === 'while') {
                loopType = 'while';
            } else {
                loopType = 'for';
            }
        }

        const stateKey = `_loop_state_${nodeId}`;
        let state = variableManager.get(stateKey, req.body.runId);

        if (!state) {
            state = { index: 0, totalIterations: 0 };
        }

        let shouldContinue = false;
        let currentItem = null;

        if (loopType === 'for') {
            let total = 0;
            // Legacy array compatibility
            if (mode === 'array' || mode === 'each' || mode === 'forEach') {
                let list = [];
                if (typeof arrayInput === 'string') {
                    list =
                        variableManager.get(arrayInput, req.body.runId) ||
                        variableManager.resolveValue(arrayInput, req.body.runId);
                } else if (Array.isArray(arrayInput)) {
                    list = arrayInput;
                }
                if (!Array.isArray(list)) list = [];
                total = list.length;
                if (state.index < total) {
                    currentItem = list[state.index];
                }
            } else {
                total = Number(variableManager.resolveValue(iterations, req.body.runId));
                if (isNaN(total)) total = 0;
            }
            shouldContinue = state.index < total;
        } else if (loopType === 'while') {
            try {
                shouldContinue = variableManager.evaluate(condition, req.body.runId) === true;
            } catch (e) {
                shouldContinue = false;
            }
        }

        // Safety check
        if (state.index >= maxIterations) {
            shouldContinue = false;
        }

        if (!shouldContinue) {
            variableManager.delete(stateKey, req.body.runId);
            return res.status(200).json({
                success: true,
                message: 'Loop completed',
                path: 'completed', // Root level path
                data: {
                    path: 'completed',
                    totalIterations: state.index,
                },
            });
        }

        // Update variables for this iteration
        variableManager.set('loop.index', state.index, req.body.runId);
        variableManager.set('loop.iteration', state.index + 1, req.body.runId);
        variableManager.set('loop.isFirst', state.index === 0, req.body.runId);
        variableManager.set(indexVar, state.index, req.body.runId);

        if (mode === 'array' || mode === 'each' || mode === 'forEach') {
            variableManager.set(itemVar, currentItem, req.body.runId);
            variableManager.set('loop.currentItem', currentItem, req.body.runId);
        }

        // Increment state
        variableManager.set(
            stateKey,
            {
                index: state.index + 1,
                totalIterations: state.index + 1,
            },
            req.body.runId,
        );

        return res.status(200).json({
            success: true,
            message: `Loop iteration ${state.index}`,
            path: 'body', // Root level path
            data: {
                path: 'body',
                index: state.index,
                item: currentItem,
            },
        });
    } catch (error) {
        console.error('[ERROR] loopAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.loop.error'),
            error: error.message,
        });
    }
};

export const branchAction = async (req, res) => {
    try {
        const { mode, timeout = 30000 } = req.body;

        return res.status(200).json({
            success: true,
            message: req.t('actions.branch.success'),
            data: { mode, timeout },
        });
    } catch (error) {
        console.error('[ERROR] branchAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.branch.error'),
            error: error.message,
        });
    }
};

export const flowControlAction = async (req, res) => {
    try {
        const { action, returnValue } = req.body;

        return res.status(200).json({
            success: true,
            message: req.t('actions.flow_control.success'),
            data: { action, returnValue },
        });
    } catch (error) {
        console.error('[ERROR] flowControlAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.flow_control.error'),
            error: error.message,
        });
    }
};
export const transformAction = async (req, res) => {
    try {
        const { operation, input, expression, mergeWith, outputVar } = req.body;

        const inputArray =
            (typeof input === 'string' ? variableManager.get(input, req.body.runId) : null) ||
            variableManager.resolveValue(input, req.body.runId) ||
            [];

        let result;
        switch (operation) {
            case 'map':
                result = inputArray.map((item) =>
                    variableManager.evaluate(expression, req.body.runId, { item }),
                );
                break;
            case 'filter':
                result = inputArray.filter((item) =>
                    variableManager.evaluate(expression, req.body.runId, { item }),
                );
                break;
            case 'merge': {
                const mergeArray =
                    (typeof mergeWith === 'string'
                        ? variableManager.get(mergeWith, req.body.runId)
                        : null) ||
                    variableManager.resolveValue(mergeWith, req.body.runId) ||
                    [];
                result = Array.isArray(mergeArray)
                    ? [...inputArray, ...mergeArray]
                    : [...inputArray, mergeArray];
                break;
            }
            case 'reduce': {
                // For reduce, we evaluate expression(acc, item)
                // We might need an initial value. In our schema it's optional
                // If not provided, we use the first element of the array
                if (inputArray.length === 0) {
                    result = null;
                } else {
                    result = inputArray.reduce((acc, item) => {
                        return variableManager.evaluate(expression, req.body.runId, { acc, item });
                    });
                }
                break;
            }
            default:
                result = inputArray;
        }

        variableManager.set(outputVar, result, req.body.runId);

        return res.status(200).json({
            success: true,
            message: req.t('actions.transform.success'),
            data: { operation, result, outputVar },
        });
    } catch (error) {
        console.error('[ERROR] transformAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.transform.error'),
            error: error.message,
        });
    }
};

export const backendJsAction = async (req, res) => {
    try {
        const { expression, script, code, outputVar = 'backendResult' } = req.body;
        const activeScript = expression || script || code;
        if (!activeScript) {
            return res.status(400).json({
                success: false,
                message: 'Expression/Script is required',
            });
        }

        const result = variableManager.evaluate(activeScript, req.body.runId);
        const resolvedOutput = outputVar.replace('${', '').replace('}', '');
        variableManager.set(resolvedOutput, result, req.body.runId);

        console.log(`[FLOW] Backend JS executed. Saved to ${resolvedOutput}`);

        return res.status(200).json({
            success: true,
            message: 'Backend Script executed successfully',
            data: { result, variable: resolvedOutput },
        });
    } catch (error) {
        console.error('[ERROR] backendJsAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error executing backend JS',
            error: error.message,
        });
    }
};

export const failFlowAction = async (req, res) => {
    try {
        const { message = 'Flow explicitly aborted' } = req.body;

        return res.status(200).json({
            success: false, // Mark failure to stop runner
            message: `Flow explicitly failed: ${message}`,
            error: message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error executing fail index action',
            error: error.message,
        });
    }
};

/**
 * Execute a Subflow (Component) recursively
 */
export const componentAction = async (req, res) => {
    try {
        const { configuration, nodeId, label, runId } = req.body;
        const nodeLabel = label || configuration?.label || nodeId || 'Component';
        const flowId = configuration?.flowId || req.body.flowId;

        if (!flowId) {
            return res.status(400).json({
                success: false,
                message: 'Missing flowId for component execution',
            });
        }

        emitLog({
            message: `Entering subflow: ${flowId}`,
            type: 'info',
            nodeId,
        });

        // 1. Fetch subflow structure
        const subflow = await Flow.findByPk(flowId, {
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!subflow) {
            throw new Error(`Subflow not found: ${flowId}`);
        }

        // 2. Prepare subflow execution context
        const { ExecutionService } = await import('../services/ExecutionService.js');
        const { variableManager: vm } = await import('../services/VariableManager.js');
        const executionService = new ExecutionService();

        // 2.b Handle Input Mapping (Parent -> Child)
        const inputMapping = configuration?.inputMapping || [];
        if (Array.isArray(inputMapping)) {
            for (const mapping of inputMapping) {
                if (mapping.parentVar && mapping.childVar) {
                    const val = vm.resolveValue(mapping.parentVar, runId);
                    vm.set(mapping.childVar, val, runId);
                }
            }
        }

        // 🌟 PRE-INITIALIZE COMPONENT RESULT
        // This allows internal nodes (like a Conditional node) to reference the component's status
        // even before it has finished executing the entire subflow.
        const initialResult = {
            success: true,
            status: 'running',
            message: `Subflow "${nodeLabel}" is currently executing...`,
            data: { status: true, success: true, label: nodeLabel },
        };
        vm.set(`${nodeId}.result`, initialResult, runId);
        vm.set(`${nodeLabel}.result`, initialResult, runId);
        vm.set(nodeId, initialResult, runId);
        vm.set(nodeLabel, initialResult, runId);
        console.log(`[Component] 🚀 Pre-initialized variables for: "${nodeLabel}" (ID: ${nodeId})`);

        // Map database models to the format expected by ExecutionService
        console.log(`[Component] 📦 Subflow "${subflow.name}" has ${subflow.nodes.length} nodes.`);
        const allNodes = subflow.nodes.map((n) => {
            console.log(
                `   - Node: "${n.data?.label || n.nodeId}" (Type: ${n.type}, Parent: ${n.parentId || 'NONE'})`,
            );
            return {
                nodeId: n.nodeId,
                type: n.type,
                data: n.data,
                parentId: n.parentId, // CRITICAL FIX: Ensure parentId is preserved!
            };
        });
        const allEdges = subflow.edges.map((e) => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
        }));

        const entryNodes = allNodes.filter((n) => n.type === 'entry');
        if (entryNodes.length === 0) {
            throw new Error(`Subflow ${flowId} has no Entry node`);
        }

        // 3. Run subflow
        // CRITICAL: activatedNodeIds must include entry nodes so runSequence activation check passes
        const subflowState = {
            runId: runId || `subrun_${Date.now()}`,
            browserId: req.body.browserId,
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(entryNodes.map((n) => n.nodeId)),
            edgeStates: {},
            variables: {},
            overrides: {},
            headers: req.headers || {},
            startTime: Date.now(),
            // 🚀 CONTEXT INHERITANCE:
            // This allows nodes inside the subflow to know who "called" them
            // so they can sync results back to the parent component node.
            callerId: nodeId,
            callerLabel: nodeLabel,
        };

        const subflowResult = await executionService.runSequence(
            entryNodes,
            allNodes,
            allEdges,
            subflowState,
        );

        // 🚀 CRITICAL: MEMORY MERGE (Subflow -> Parent)
        // Ensure all internal variables from the subflow run are visible to the parent scope
        if (subflowState.variables) {
            Object.entries(subflowState.variables).forEach(([key, val]) => {
                vm.set(key, val, runId);
            });
        }

        // 3.b Handle Manual Output Mapping (Child -> Parent via config)
        const outputMapping = configuration?.outputMapping || [];
        if (Array.isArray(outputMapping)) {
            for (const mapping of outputMapping) {
                if (mapping.childVar && mapping.parentVar) {
                    const val = vm.get(mapping.childVar, runId);
                    vm.set(mapping.parentVar, val, runId);
                }
            }
        }

        // 🚀 AUTO-COLLECT RESULTS FROM 'OUTPUT' NODES
        const subflowOutputs = {};
        const outputNodes = allNodes.filter((n) => n.type === 'output');

        outputNodes.forEach((outNode) => {
            const outLabel = outNode.data?.customLabel || outNode.data?.label || outNode.nodeId;
            const outVal =
                vm.get(`${outNode.nodeId}.result`, runId) || vm.get(`${outLabel}.result`, runId);

            if (outVal !== undefined && outVal !== null) {
                // If it's a structured result, take the .data part or the whole thing
                subflowOutputs[outLabel] = outVal.data !== undefined ? outVal.data : outVal;
            } else {
                console.warn(`[Component] ⚠️ Output node "${outLabel}" produced no data.`);
            }
        });

        // 🌟 DATA CONTRACT VALIDATION
        // Check if there were any manual mappings that failed
        const missingMappings = outputMapping.filter(
            (m) => vm.get(m.childVar, runId) === undefined,
        );
        if (missingMappings.length > 0) {
            smartEmitLog(
                `[Warning] Some output mappings are missing data: ${missingMappings.map((m) => m.childVar).join(', ')}`,
                'warning',
                nodeId,
            );
        }

        // 🌟 GUARANTEED STRUCTURED OUTPUT
        const finalStatus = subflowResult?.success !== false ? 'success' : 'failed';
        const structuredResult = {
            success: finalStatus === 'success',
            status: finalStatus,
            message: subflowResult?.message || `Subflow "${nodeLabel}" completed.`,
            data: {
                ...subflowOutputs,
                status: finalStatus,
                success: finalStatus === 'success',
                label: nodeLabel,
            },
            flowId,
            executedNodes: subflowState.executedNodeIds.size,
        };

        // Store back to variable manager for parent access
        vm.set(`${nodeId}.result`, structuredResult, runId);
        vm.set(`${nodeLabel}.result`, structuredResult, runId);
        vm.set(nodeId, structuredResult, runId);
        vm.set(nodeLabel, structuredResult, runId);

        const outputList = Object.keys(subflowOutputs);
        const outputSummary =
            outputList.length > 0
                ? `Validated Outputs: [${outputList.join(', ')}]`
                : 'No outputs produced';
        smartEmitLog(`Subflow "${nodeLabel}" finished. ${outputSummary}`, 'success', nodeId);

        const safeLabel = nodeLabel.replace(/[^a-zA-Z0-9]/g, '');
        if (safeLabel && safeLabel !== nodeLabel) {
            vm.set(`${safeLabel}.result`, structuredResult, runId);
        }

        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        // Also store in legacy_flow scope for UI compatibility
        if (!runId || runId.startsWith('interactive-')) {
            vm.set(`${nodeId}.result`, structuredResult, null);
            vm.set(`${nodeLabel}.result`, structuredResult, null);
        }

        console.log(
            `[ComponentAction] ✅ Result stored for "${nodeLabel}" (Run: ${runId || 'legacy'}):`,
            JSON.stringify(structuredResult).substring(0, 200),
        );

        emitLog({
            message: `Completed subflow: ${flowId} (${subflowState.executedNodeIds.size} nodes executed)`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            status: 'success',
            message: `Subflow ${flowId} executed successfully`,
            data: structuredResult,
        });
    } catch (error) {
        console.error('[ERROR] componentAction:', error.message);
        emitLog({
            message: `Error in subflow: ${error.message}`,
            type: 'error',
            nodeId: req.body.nodeId,
        });

        // Always return a structured error payload so the flow can handle it gracefully
        const { configuration: cfg, nodeId: nid, label: lbl, runId: rid } = req.body;
        const errLabel = lbl || cfg?.label || nid || 'Component';
        const errorPayload = {
            status: 'error',
            data: { label: errLabel, flowId: cfg?.flowId || req.body.flowId },
            error: { message: error.message, code: 'COMPONENT_EXECUTION_ERROR' },
        };

        // Store error result so conditional nodes downstream can inspect it
        try {
            const { variableManager: vm2 } = await import('../services/VariableManager.js');
            if (nid) vm2.set(`${nid}.result`, errorPayload, rid || null);
            if (errLabel) vm2.set(`${errLabel}.result`, errorPayload, rid || null);
        } catch (_) {
            /* non-fatal */
        }

        return res.status(200).json({
            // Note: 200 status so ExecutionService doesn't throw on soft failures;
            // success:false signals the flow engine to handle the error path.
            success: false,
            status: 'error',
            message: 'Error executing subflow',
            error: { message: error.message, code: 'COMPONENT_EXECUTION_ERROR' },
            data: errorPayload,
        });
    }
};

/**
 * Input Action: Handles parameter declarations in subflows
 */
export const inputAction = async (req, res) => {
    try {
        const { name, defaultValue } = req.body;
        const { variableManager } = await import('../services/VariableManager.js');

        // If variable is already set (by componentAction mapping), we keep it.
        // Otherwise, we set it to the default value if provided.
        if (name && !variableManager.has(name, req.body.runId) && defaultValue !== undefined) {
            variableManager.set(name, defaultValue, req.body.runId);
        }

        return res.status(200).json({
            success: true,
            data: name ? { name, value: variableManager.get(name, req.body.runId) } : {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error in input action',
            error: error.message,
        });
    }
};

/**
 * Output Action: Handles return values in subflows
 */
export const outputAction = async (req, res) => {
    try {
        const { name, value } = req.body;
        const { variableManager } = await import('../services/VariableManager.js');

        // Resolve return value
        let resolvedValue = undefined;
        if (value !== undefined) {
            resolvedValue = variableManager.resolveValue(value, req.body.runId);
        }

        if (name) {
            variableManager.set(name, resolvedValue, req.body.runId);
        }

        return res.status(200).json({
            success: true,
            action: 'return', // Signal to runSequence to bubble up this data
            data:
                resolvedValue !== undefined
                    ? resolvedValue
                    : name
                      ? { name, value: resolvedValue }
                      : {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error in output action',
            error: error.message,
        });
    }
};

// ==========================================================
// 🤖 AI ACTIONS
// ==========================================================

export const callLlmAction = async (req, res) => {
    try {
        const {
            prompt,
            system,
            variableName = 'llmResult',
            maxTokens,
            temperature,
            browserId,
            injectBrowserContext = false,
        } = req.body;

        // Debug headers
        console.log('[AI Debug] Received Headers:', {
            'x-ai-provider': req.headers['x-ai-provider'],
            'x-ai-model': req.headers['x-ai-model'],
            'x-ai-api-key': req.headers['x-ai-api-key']
                ? 'PRESENT (len: ' + req.headers['x-ai-api-key'].length + ')'
                : 'MISSING',
            'x-ai-base-url': req.headers['x-ai-base-url'],
        });

        // Resolve context: Read from headers
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';

        // Strictly use global config, ignore any node-level overrides
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = injectBrowserContext ? await fetchContext(req, browserId) : null;
        let resolvedPrompt = variableManager.resolve(prompt) || '';

        // Zero-Config Fallback: If prompt is empty but we have context
        if (!resolvedPrompt && autoContext) {
            resolvedPrompt =
                'Describe the visible content, main features, and purpose of this page in detail.';
        }

        if (autoContext) {
            resolvedPrompt = `[CURRENT PAGE CONTEXT]\n${autoContext}\n\n[USER PROMPT]\n${resolvedPrompt}`;
            console.log('[AI Context] Injected browser context into call_llm prompt');
        }
        // ------------------------------

        const response = await aiService.generateText({
            prompt: resolvedPrompt,
            system: system ? variableManager.resolve(system) : undefined,
            model: activeModel,
            provider: activeProvider,
            apiKey,
            baseUrl: headerBaseUrl,
            maxTokens,
            temperature,
            parentSignal: req.signal,
        });

        // Extract text from object
        const resultText = response.text ? response.text.trim() : '';

        // Set variable
        variableManager.set(variableName, resultText, req.body.runId);

        // Emit log for UI visualization
        emitLog({
            message: `AI Response: ${resultText.substring(0, 100)}${resultText.length > 100 ? '...' : ''}`,
            type: 'success',
            nodeId: req.body.nodeId || 'call_llm',
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.call_llm.success'),
            result: resultText,
            data: { response: resultText, usage: response.usage, variable: variableName },
        });
    } catch (error) {
        console.error('[ERROR] callLlmAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.call_llm.error'),
            error: error.message,
        });
    }
};

export const generateDataAction = async (req, res) => {
    try {
        const {
            browserId,
            description,
            expectedFormat = 'json',
            variableName = 'generatedData',
            variable, // Alias support
            maxTokens = 2048,
            temperature = 0.7,
            count = 1,
            fields,
            injectBrowserContext = false,
        } = req.body;

        const targetVariable = variable || variableName;

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = injectBrowserContext ? await fetchContext(req, browserId) : null;
        let activeDescription = variableManager.resolve(description) || '';

        // Zero-Config Fallback
        if (!activeDescription && autoContext) {
            activeDescription =
                'Extract all meaningful data fields, products, lists, or structured information visible on this page.';
        }

        if (autoContext) {
            activeDescription = `[PAGE CONTEXT]\n${autoContext}\n\n[INSTRUCTION]\n${activeDescription}`;
            console.log('[AI Context] Injected browser context into generate_data prompt');
        }
        // ------------------------------

        // Read from headers
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        const keys = {
            openai: req.headers['x-openai-key'] || process.env.OPENAI_API_KEY,
            anthropic: req.headers['x-anthropic-key'] || process.env.ANTHROPIC_API_KEY,
            ollama: 'ollama',
            openrouter: apiKey,
            baseUrl: headerBaseUrl,
        };

        // Build a robust, valid Zod schema for structured output to satisfy Vercel AI SDK requirements
        let schema;
        if (expectedFormat === 'json') {
            if (fields && Array.isArray(fields) && fields.length > 0) {
                const schemaFields = {};
                for (const field of fields) {
                    if (field && typeof field === 'object' && field.name) {
                        let fieldSchema = z.string();
                        if (field.type === 'number') fieldSchema = z.number();
                        else if (field.type === 'boolean') fieldSchema = z.boolean();
                        else if (field.type === 'array') fieldSchema = z.array(z.any());
                        else if (field.type === 'object') fieldSchema = z.record(z.any());

                        if (field.description) {
                            fieldSchema = fieldSchema.describe(field.description);
                        }
                        schemaFields[field.name] = fieldSchema;
                    }
                }
                schema = z.object(schemaFields);
            } else {
                // If no fields are explicitly defined, use a generic result schema
                // to guide generateObject and avoid AI SDK compilation failures
                schema = z.object({
                    result: z
                        .any()
                        .describe(
                            'The generated structured data matching the requested description',
                        ),
                });
            }
        } else {
            // Non-JSON format: schema is not used by generateText, so we pass a placeholder z.any()
            schema = z.any();
        }

        const finalPrompt = `Generate ${count} item(s) in ${expectedFormat} format. 
Description: ${activeDescription}
${fields ? `Fields: ${JSON.stringify(fields)}` : ''}`;

        const data = await aiService.generateStructured({
            description: finalPrompt,
            schema,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            keys,
            maxTokens,
            temperature,
            expectedFormat,
            parentSignal: req.signal,
        });

        let resolvedData = data;
        // Extract generic result key for seamless backward compatibility if fields wasn't used
        if (expectedFormat === 'json' && (!fields || fields.length === 0)) {
            if (
                data &&
                typeof data === 'object' &&
                'result' in data &&
                Object.keys(data).length === 1
            ) {
                resolvedData = data.result;
            }
        }

        variableManager.set(targetVariable, resolvedData, req.body.runId);

        const displayData =
            typeof resolvedData === 'object' ? JSON.stringify(resolvedData) : String(resolvedData);
        const truncatedData =
            displayData.length > 80 ? displayData.substring(0, 80) + '...' : displayData;

        console.log(
            `[Generate Data] Generated value: "${displayData}" saved to variable "${targetVariable}"`,
        );

        // Emit log for UI visualization
        emitLog({
            message: `Generated Data (${expectedFormat}): "${truncatedData}" saved to ${targetVariable}`,
            type: 'success',
            nodeId: req.body.nodeId || 'generate_data',
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.generate_data.success'),
            data: resolvedData,
            result: resolvedData,
            variable: targetVariable,
        });
    } catch (error) {
        console.error('[ERROR] generateDataAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.generate_data.error'),
            error: error.message,
        });
    }
};

export const validateSemanticAction = async (req, res) => {
    try {
        const {
            browserId,
            content: rawContent,
            criteria: rawCriteria,
            expectedAnswer,
            variableName = 'semanticValid',
            maxTokens = 2048,
            nodeId,
        } = req.body;

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = await fetchContext(req, browserId);
        let content = variableManager.resolve(rawContent);
        if (autoContext && (!content || content.length < 5)) {
            // If content is empty or very short, use the browser context as content
            content = autoContext;
            console.log('[AI Context] Using browser context for semantic validation');
        }
        // ------------------------------

        // --- ZERO-CONFIG LOGIC: Read from headers ---
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        emitLog({
            message: `Ejecutando validación semántica con modelo ${activeModel} (maxTokens: ${maxTokens})`,
            type: 'ai',
            nodeId,
        });

        const keys = {
            openai: req.headers['x-openai-key'] || process.env.OPENAI_API_KEY,
            anthropic: req.headers['x-anthropic-key'] || process.env.ANTHROPIC_API_KEY,
            ollama: 'ollama',
            openrouter: apiKey,
            baseUrl: headerBaseUrl,
        };

        // Resolve inputs (may contain variables like ${text})
        let criteria = variableManager.resolve(rawCriteria, req.body.runId) || '';

        // Zero-Config Fallback
        if (!criteria && autoContext) {
            criteria =
                'Does this page appear to be loaded correctly with relevant content and no obvious error messages?';
        }

        if (!content) {
            throw new Error(`El contenido a validar está vacío o no se resolvió correctamente.`);
        }

        const result = await aiService.validate({
            content,
            criteria,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            keys,
            maxTokens: Number(maxTokens),
            parentSignal: req.signal,
        });

        // Map result to a success/fail based on expectedAnswer
        const isMatch =
            String(result.isValid).toLowerCase() === String(expectedAnswer).toLowerCase() ||
            (result.isValid && String(expectedAnswer).toLowerCase() === 'true');

        variableManager.set(variableName, isMatch, req.body.runId);

        emitLog({
            message: `Validación finalizada. Resultado: ${result.isValid} (Coincidencia: ${isMatch})`,
            type: 'success',
            nodeId,
        });

        // --- JSONL AUDIT LOGGING ---
        const enableFineTuningVal = req.headers?.['x-hal-fine-tuning'] === 'true';
        if (enableFineTuningVal) {
            try {
                await auditService.logStep({
                    input: req.body,
                    domBefore: autoContext || null,
                    action: 'validate_semantic',
                    selector: null,
                    assertionResult: {
                        success: true,
                        status: 'success',
                        isValid: result.isValid,
                        isMatch,
                        reasoning: result.reasoning,
                    },
                    runId: req.body.runId,
                    nodeId,
                });
            } catch (auditErr) {
                console.error(
                    '[AuditService] Failed to write semantic audit log:',
                    auditErr.message,
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: req.t('actions.validate_semantic.success'),
            data: {
                ...result,
                variable: variableName,
                isMatch,
            },
        });
    } catch (error) {
        console.error('[ERROR] validateSemanticAction:', error.message);
        emitLog({
            message: `Error en validación semántica: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.validate_semantic.error'),
            error: error.message,
        });
    }
};

export const extractDomContextAction = async (req, res) => {
    try {
        const {
            browserId,
            selector,
            extractionType = 'text',
            variableName = 'domContext',
            maxTokens = 2048,
            nodeId,
        } = req.body;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        const browserIdActual = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        const context = await getOrCreateContext(req, browser, browserIdActual);
        const pages = context.pages();
        const page = pages.length > 0 ? pages[pages.length - 1] : await context.newPage();

        emitLog({
            message: `Extracting DOM Context (${extractionType}) using ${selector || 'body'}`,
            type: 'info',
            nodeId,
        });

        let rawContent = '';
        if (selector) {
            const resolvedSelector = variableManager.resolve(selector);
            if (extractionType === 'html') {
                rawContent = await page.$eval(resolvedSelector, (el) => el.outerHTML);
            } else {
                rawContent = await page.$eval(resolvedSelector, (el) => el.innerText);
            }
        } else {
            if (extractionType === 'html') {
                rawContent = await page.content();
            } else {
                rawContent = await page.innerText('body');
            }
        }

        let finalContent = rawContent;

        // --- AI SMART EXTRACTION (Zero-Config) ---
        if (extractionType === 'text' || extractionType === 'markdown') {
            const activeProvider = req.headers['x-ai-provider'] || 'ollama';
            const activeModel =
                req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
            const headerBaseUrl = req.headers['x-ai-base-url'];
            const apiKey =
                req.headers['x-ai-api-key'] ||
                (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
                (activeProvider === 'ollama' ? 'ollama' : undefined);

            emitLog({
                message: `Cleaning up content with AI (${activeModel})...`,
                type: 'ai',
                nodeId,
            });

            const prompt =
                extractionType === 'markdown'
                    ? `Convert the following content into clean, well-structured Markdown. Remove UI noise like navigation menus, footers, and ads. Focus on the main content.\n\nContent:\n${rawContent}`
                    : `Extract and clean the main text from the following content. Remove boilerplate, UI artifacts, and repetitive elements. Retain only the actual information.\n\nContent:\n${rawContent}`;

            const response = await aiService.generateText({
                prompt,
                provider: activeProvider,
                model: activeModel,
                apiKey,
                baseUrl: headerBaseUrl,
                maxTokens: Number(maxTokens),
                parentSignal: req.signal,
            });

            finalContent = response.text || rawContent;
        }

        variableManager.set(variableName, finalContent, req.body.runId);

        emitLog({
            message: `Context extracted and saved to ${variableName}`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.extract_dom_context.success'),
            data: {
                content: finalContent.substring(0, 500),
                variable: variableName,
                isSmart: extractionType !== 'html',
            },
        });
    } catch (error) {
        console.error('[ERROR] extractDomContextAction:', error.message);
        emitLog({
            message: `Error extracting DOM context: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.extract_dom_context.error'),
            error: error.message,
        });
    }
};

export const chainOfThoughtAction = async (req, res) => {
    try {
        const {
            instruction,
            thoughtVariable = 'aiThought',
            answerVariable = 'aiAnswer',
            temperature = 0.7,
            maxTokens = 2048,
            nodeId,
        } = req.body;

        // --- ZERO-CONFIG LOGIC ---
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        emitLog({
            message: `Iniciando razonamiento (CoT) con modelo ${activeModel}...`,
            type: 'ai',
            nodeId,
        });

        const resolvedInstruction = variableManager.resolve(instruction);
        const prompt = `Task: ${resolvedInstruction}\n\nPlease think step by step. Use this exact format:\nTHOUGHT: <your detailed reasoning process>\nANSWER: <your final concise answer>`;

        const response = await aiService.generateText({
            prompt,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            baseUrl: headerBaseUrl,
            temperature: Number(temperature),
            maxTokens: Number(maxTokens),
            taskType: 'reasoning',
            parentSignal: req.signal,
        });

        const text = response.text || '';
        const thoughtMatch = text.match(/THOUGHT:([\s\S]*?)(?=ANSWER:|$)/i);
        const answerMatch = text.match(/ANSWER:([\s\S]*)/i);

        const thought = thoughtMatch ? thoughtMatch[1].trim() : 'No separate thought extracted.';
        const answer = answerMatch ? answerMatch[1].trim() : text;

        variableManager.set(thoughtVariable, thought, req.body.runId);
        variableManager.set(answerVariable, answer, req.body.runId);

        emitLog({
            message: `Razonamiento completado. Resultado guardado en ${answerVariable}.`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.chain_of_thought.success'),
            data: { thought, answer, thoughtVariable, answerVariable },
        });
    } catch (error) {
        console.error('[ERROR] chainOfThoughtAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.chain_of_thought.error'),
            error: error.message,
        });
    }
};

export const smartSelectorAction = async (req, res) => {
    try {
        const {
            browserId,
            originalSelector,
            intent,
            variableName = 'suggestedSelector',
            nodeId,
        } = req.body;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        const browserIdActual = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        const context = await getOrCreateContext(req, browser, browserIdActual);
        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();

        // --- ZERO-CONFIG LOGIC ---
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        emitLog({
            message: `Healing selector with AI (${activeModel})...`,
            type: 'ai',
            nodeId,
        });

        // Extract DOM snippet for context
        const domSnippet = await page.content();

        const resolvedIntent = variableManager.resolve(intent);

        const result = await aiService.healSelector({
            domSnippet,
            originalSelector,
            intent: resolvedIntent,
            error: 'Element not found with original selector',
            provider: activeProvider,
            model: activeModel,
            apiKey,
            baseUrl: headerBaseUrl,
            timeout: 60000, // 1 minute timeout for healer
            parentSignal: req.signal,
        });

        const newSelector = result.correctedSelector || originalSelector;
        variableManager.set(variableName, newSelector, req.body.runId);

        emitLog({
            message: `Selector healed: ${newSelector} (Confidence: ${(result.confidence * 100).toFixed(0)}%)`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.smart_selector.success'),
            data: {
                suggestedSelector: newSelector,
                confidence: result.confidence,
                reasoning: result.reasoning,
            },
        });
    } catch (error) {
        console.error('[ERROR] smartSelectorAction:', error.message);
        emitLog({
            message: `Error healing selector: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.smart_selector.error'),
            error: error.message,
        });
    }
};

/**
 * Validate AI Credentials by attempting a minimal generation
 */
export const validateAICredentials = async (req, res) => {
    try {
        const { provider, model, apiKey, baseUrl } = req.body;

        if (!provider) {
            return res.status(400).json({
                success: false,
                message: 'Missing provider',
            });
        }

        await aiService.validateKey({
            provider,
            apiKey,
            baseUrl,
            model,
        });

        res.json({ success: true, message: 'Connection successful' });
    } catch (error) {
        console.error('[AI Validation Error]', error.message);
        res.status(200).json({
            success: false,
            message: 'Validation failed: ' + (error.message || 'Unknown error'),
        });
    }
};

/**
 * Action: Security Header Audit
 * Validates security policies (HSTS, CSP, CORS) without a full browser.
 */
export const securityHeaderAuditAction = async (req, res) => {
    const { url, nodeId } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    if (nodeId) {
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
        smartEmitLog(`Auditing security headers for: ${url}...`, 'info', nodeId);
    }

    try {
        const response = await fetch(url, { method: 'HEAD' });
        const headers = response.headers;

        const audit = {
            hsts: headers.has('strict-transport-security'),
            csp: headers.has('content-security-policy'),
            xfo: headers.has('x-frame-options'),
            xcto: headers.has('x-content-type-options'),
            cors: headers.get('access-control-allow-origin') || 'Restrictive (Default)',
        };

        const issues = [];
        if (!audit.hsts) issues.push('HSTS Missing');
        if (!audit.csp) issues.push('CSP Missing');
        if (!audit.xfo) issues.push('X-Frame-Options Missing');

        const success = issues.length === 0;
        const message = success
            ? 'Security headers are optimal.'
            : `Audit finished with issues: ${issues.join(', ')}`;

        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: success ? 'success' : 'warning' });
            smartEmitLog(message, success ? 'success' : 'warning', nodeId);
        }

        return res.json({
            success: true,
            data: {
                audit,
                issues,
                healthy: success,
            },
            message,
        });
    } catch (error) {
        console.error('[SecurityAudit Error]', error.message);
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'failed' });
            smartEmitLog(`Audit failed: ${error.message}`, 'error', nodeId);
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Force-closes all browsers and cleans up orphaned processes
 */
export const resetEnvironment = async (req, res) => {
    try {
        console.log('[System] Resetting environment...');
        await browserService.sanitize();
        res.json({ success: true, message: 'Environment cleaned and resetted' });
    } catch (error) {
        console.error('[Reset Error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Action: Manually Update or Seed Variables
 * Supports updating flow (run-specific) or global variables.
 */
export const updateVariablesAction = async (req, res) => {
    try {
        const { variables, runId, scope = 'flow' } = req.body;

        if (!variables || typeof variables !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Variables object is required',
            });
        }

        Object.entries(variables).forEach(([key, value]) => {
            variableManager.set(key, value, runId, scope);
            emitVariableChange({ name: key, value, scope, operation: 'set' });
        });

        res.json({
            success: true,
            message: `Updated ${Object.keys(variables).length} variables in ${scope} scope.`,
        });
    } catch (error) {
        console.error('[UpdateVariables Error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteVariableAction = async (req, res) => {
    try {
        const { name, scope = 'flow', runId } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Variable name is required',
            });
        }

        variableManager.deleteVariable(name, scope, runId);
        emitVariableChange({ name, value: undefined, scope, operation: 'delete' });

        res.json({
            success: true,
            message: `Deleted variable "${name}" from ${scope} scope.`,
        });
    } catch (error) {
        console.error('[DeleteVariable Error]', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
