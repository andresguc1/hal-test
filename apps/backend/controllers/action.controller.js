// controllers/action.controller.js - REFACTORED
// ==========================================================
// 🧠 Connectors of individual actions to Playwright
// ==========================================================

// import { callTool } from '../services/mcp.service.js';
import { browserService } from '../services/browser.service.js';
import { traceService } from '../services/trace.service.js';
import { globalStateManager } from '../services/stateManager.js';
import VariableManager from '../services/VariableManager.js';
import aiService from '../services/AIService.js';
import { emitExecutionStatus, emitScreenshotReady } from '../socket.js';
import { z } from 'zod';
import * as fsp from 'fs/promises';
// import * as fs from 'fs';
import * as path from 'path';
import { executionLogger } from '../services/ExecutionLogger.js';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

// Create Variable Manager instance
const variableManager = new VariableManager();
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

    if (!browserId && ids.length === 0) {
        return {
            error: true,
            status: 400,
            message: req.t('errors.no_active_browsers'),
        };
    }

    const id = browserId || ids[ids.length - 1];
    const entry = browserService.get(id);

    if (!entry) {
        return {
            error: true,
            status: 404,
            message: req.t('errors.browser_not_found', { id }),
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
                    if (typeof ctx.pages === 'function') {
                        const pages = ctx.pages();
                        if (Array.isArray(pages) && pages.length > 0) {
                            console.log('[INFO] Reusing existing context with active pages');
                            return ctx;
                        }
                    }
                } catch (err) {
                    console.log('[WARN] Invalid existing context, creating new:', err.message);
                }
            }
        }
    } catch (err) {
        console.error('[ERROR] Error verifying contexts:', err.message);
        throw new Error(`${req.t('common.browser_closed')}: ${err.message}`);
    }

    if (typeof browser.newContext === 'function') {
        console.log('[INFO] Creating new navigation context');
        try {
            // Retrieve launch options to apply viewport settings
            let contextOptions = {};
            if (browserId) {
                const entry = browserService.get(browserId);
                if (entry && entry.options && entry.options.maximizeWindow) {
                    console.log('[INFO] Applying viewport: null to maximize window');
                    contextOptions.viewport = null;
                }
            }

            const newContext = await browser.newContext(contextOptions);
            console.log('[SUCCESS] Context created successfully');
            return newContext;
        } catch (err) {
            console.error('[ERROR] Could not create context:', err.message);
            if (err.message.includes('Browser closed') || err.message.includes('Target closed')) {
                throw new Error(req.t('common.browser_closed'));
            }
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
    const pages = context.pages();

    if (pages.length === 0) {
        const error = new Error(req.t('errors.no_active_pages'));
        error.status = 400;
        throw error;
    }

    // Use the last active page as the target
    const pageInstance = pages[pages.length - 1];

    if (pageInstance.isClosed && pageInstance.isClosed()) {
        const error = new Error(req.t('common.page_closed'));
        error.status = 400;
        throw error;
    }

    return { page: pageInstance, browserId: targetBrowserId, context };
}

/**
 * Generic wrapper for Playwright actions.
 */
async function executePlaywrightAction(req, res, actionName, actionLogic) {
    let targetBrowserId;
    const start = Date.now();
    const runId = req.body.runId; // Extract runId if present

    const opts = req.body;
    let page, context;

    const nodeId = opts.nodeId;
    if (nodeId) {
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
    }

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
        ].includes(actionName);

        if (!isBrowserAction && !isContextAction && actionName !== 'open_url') {
            ({
                page,
                browserId: targetBrowserId,
                context,
            } = await getActivePage(req, opts.browserId));
            // browser = context.browser(); // Unused
        } else if (opts.browserId) {
            const validation = validateBrowser(req, opts.browserId);
            if (!validation.error) {
                // browser = validation.entry.browser || validation.entry; // Unused
                targetBrowserId = validation.browserId;
            }
        }

        // 2. Execute specific action logic
        const result = await actionLogic(page, opts, targetBrowserId, context);

        const duration = Date.now() - start;

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

        // --- FLIGHT RECORDER: Optional Screenshot on Success ---
        let screenshotPath = null;
        if (opts.takeScreenshot && page && !page.isClosed() && runId && nodeId) {
            try {
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runId);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                const filename = `step_${Date.now()}_${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath });
                screenshotPath = `storage/runs/${runId}/${filename}`;
                console.log(`[FlightRecorder] Screenshot saved: ${screenshotPath}`);

                // Emit real-time update to frontend
                emitScreenshotReady({ nodeId, screenshotPath, runId });
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
                },
            );
        }
        // ------------------------------------

        // 4. Respond
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'success' });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            browserId: targetBrowserId,
            durationMs: duration,
            data: result.data || {},
            screenshot: screenshotPath, // FIX: Return screenshot path to frontend
            ...result.responseExtra,
        });
    } catch (error) {
        const errorMessage = error?.message || String(error);
        const status = error.status || 500;
        const duration = Date.now() - start;

        // --- SELF-HEALING LOGIC ---
        // Check if error is "Element not found" or Timeout
        const isSelectorError =
            errorMessage.includes('Timeout') ||
            errorMessage.includes('waiting for selector') ||
            errorMessage.includes('element is not visible');

        if (isSelectorError && opts.selector && runId) {
            console.log(`[Self-Healing] Detected selector failure for: ${opts.selector}`);

            try {
                // 1. Get current page context
                const page = browserService.getPage(targetBrowserId);

                // 2. Capture Context (Screenshot + Simplified DOM)
                const screenshotBuffer = await page.screenshot({ encoding: 'base64' });
                const ScreenshotBase64 = `data:image/png;base64,${screenshotBuffer}`;

                // Simplified DOM strategy: Get body HTML but truncated to avoid context window issues
                // Ideally we would want a more intelligent snippet around the area, but full body is a start.
                let domSnippet = await page.content();
                if (domSnippet.length > 50000) domSnippet = domSnippet.substring(0, 50000); // hard cap

                // 3. Ask AI to Heal
                const userKey = req.headers['x-openai-key'];
                const diagnosis = await aiService.healSelector({
                    screenshotBase64: ScreenshotBase64,
                    domSnippet,
                    originalSelector: opts.selector,
                    error: errorMessage,
                    intent: actionName, // We could pass a richer intent if available in opts
                    apiKey: userKey || process.env.OPENAI_API_KEY,
                });

                // 4. Retry if confidence is high
                if (diagnosis.correctedSelector && diagnosis.confidence > 0.8) {
                    console.log(
                        `[Self-Healing] 🩹 AI Suggests: ${diagnosis.correctedSelector} (Confidence: ${diagnosis.confidence})`,
                    );
                    console.log(`[Self-Healing] Reasoning: ${diagnosis.reasoning}`);

                    // Retry action with NEW selector
                    // We need to clone opts and replace selector
                    const newOpts = { ...opts, selector: diagnosis.correctedSelector };

                    // RE-RUN LOGIC
                    // We simply await the actionLogic again.
                    // Note: Recursion risk if we just called executePlaywrightAction again,
                    // allowing one retry here is safer.

                    const retryStart = Date.now();
                    const retryResult = await actionLogic(page, newOpts);
                    const retryDuration = Date.now() - retryStart;

                    // --- FLIGHT RECORDER: Log Healed Success ---
                    if (runId && nodeId) {
                        await executionLogger.logStep(
                            runId,
                            { id: nodeId, type: actionName },
                            {
                                status: 'success', // It's a success now!
                                duration: duration + retryDuration, // Total time
                                input: newOpts,
                                output: retryResult.data || retryResult.traceDetails,
                                metadata: {
                                    healed: true,
                                    originalError: errorMessage,
                                    reasoning: diagnosis.reasoning,
                                },
                            },
                        );
                    }

                    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' }); // Update frontend

                    return res.status(200).json({
                        success: true,
                        message: `Self-Healed: ${retryResult.message}`,
                        browserId: targetBrowserId,
                        durationMs: duration + retryDuration,
                        data: retryResult.data || {},
                        healed: true,
                        originalSelector: opts.selector,
                        newSelector: diagnosis.correctedSelector,
                    });
                } else {
                    console.log(
                        `[Self-Healing] ❌ AI could not heal (Confidence: ${diagnosis.confidence})`,
                    );
                }
            } catch (healError) {
                console.error('[Self-Healing] Logic failed:', healError);
                // Fallthrough to standard error handling
            }
        }
        // --------------------------

        // --- FLIGHT RECORDER: Log Failure ---
        if (runId && nodeId) {
            await executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'failed',
                    duration,
                    input: opts,
                    error: errorMessage,
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
        if (page && !page.isClosed()) {
            try {
                // Use structured storage: storage/runs/{runId}/error_{nodeId}_{timestamp}.png
                const runFolder = runId || 'orphan';
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runFolder);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                const filename = `error_${Date.now()}_${nodeId || 'unknown'}.png`;
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

        if (runId && nodeId) {
            executionLogger.logStep(
                runId,
                { id: nodeId, type: actionName },
                {
                    status: 'failed',
                    error: errorMessage,
                    duration,
                    input: opts,
                    screenshot: errorScreenshotPath,
                },
            );
        }
        // ------------------------------------------------

        console.error(`[ERROR] ${actionName}:`, errorMessage);

        // 6. Respond with Error
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'failed', error: errorMessage });
        }
        return res.status(status).json({
            success: false,
            message: `${req.t('common.error_internal')} (${actionName})`,
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
    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'running' });

    try {
        console.log('[ACTION] Starting browser launch...');
        const { browserId } = await browserService.launchBrowser(req.body);
        const duration = Date.now() - start;

        console.log(`[SUCCESS] Browser launched with ID: ${browserId}`);
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
                    input: req.body,
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
            headless: req.body.headless || false,
        });
    } catch (error) {
        const duration = Date.now() - start;
        console.error('[ERROR] Failed to launch browser:', error.message);
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
    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'running' });

    try {
        const { url, waitUntil = 'load', timeout = 30000 } = req.body ?? {};

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
        await page.goto(url, { waitUntil, timeout });
        const duration = Date.now() - start;

        traceService.add({
            action: actionName,
            url,
            browserId,
            status: 'success',
            durationMs: duration,
        });

        console.log(`[SUCCESS] URL opened (${duration}ms): ${url}`);
        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        // --- FLIGHT RECORDER: Optional Screenshot on Success ---
        let screenshotPath = null;
        const { takeScreenshot } = req.body;
        if (takeScreenshot && page && !page.isClosed() && runId && nodeId) {
            try {
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runId);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                const filename = `step_${Date.now()}_${nodeId}.png`;
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
                    input: req.body,
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
        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'running' });
        if (browserId === '' || browserId === null) browserId = undefined;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        browserId = validation.browserId;
        console.log(`[INFO] Closing browser ${browserId}...`);

        await browserService.delete(browserId);
        const duration = Date.now() - start;

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
        const { selector, button, clickCount, modifiers, timeout, force } = opts;
        const clickOptions = { button, clickCount, modifiers, timeout, force };

        await page.click(selector, clickOptions);

        return {
            message: req.t('actions.click.success', { selector }),
            traceDetails: { selector, details: clickOptions },
        };
    });

export const typeTextAction = (req, res) =>
    executePlaywrightAction(req, res, 'type_text', async (page, opts) => {
        const { selector, text, clearBeforeType, delay, timeout } = opts;
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
            direction,
            amount,
            behavior = 'smooth',
            x, // Absolute X coordinate
            y, // Absolute Y coordinate
            duration, // Custom duration
        } = opts;

        let dx = 0;
        let dy = 0;

        if (x !== undefined && y !== undefined) {
            // Absolute displacement
            if (selector) {
                await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
                await page.evaluate(
                    ({ selector, x, y, behavior }) => {
                        const element = document.querySelector(selector); // eslint-disable-line no-undef
                        if (!element)
                            throw new Error(`Element not found with selector: ${selector}`);
                        element.scrollTo({ left: x, top: y, behavior });
                    },
                    { selector, x, y, behavior },
                );
            } else {
                await page.evaluate(
                    ({ x, y, behavior }) => {
                        window.scrollTo({ left: x, top: y, behavior }); // eslint-disable-line no-undef
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
                        const element = document.querySelector(selector); // eslint-disable-line no-undef
                        if (!element)
                            throw new Error(`Element not found with selector: ${selector}`);
                        element.scrollBy({ left: dx, top: dy, behavior });
                    },
                    { selector, dx, dy, behavior },
                );
            } else {
                await page.evaluate(
                    ({ dx, dy, behavior }) => {
                        window.scrollBy({ left: dx, top: dy, behavior }); // eslint-disable-line no-undef
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

export const getSetContentAction = (req, res) =>
    executePlaywrightAction(req, res, 'get_set_content', async (page, opts) => {
        const {
            selector,
            action = 'get',
            contentType = 'text',
            attribute,
            value,
            clearBeforeSet = true,
        } = opts;

        // Validations
        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        if (!['get', 'set'].includes(action)) {
            throw new Error(req.t('errors.invalid_action'));
        }

        if (!['text', 'html', 'attribute'].includes(contentType)) {
            throw new Error(req.t('errors.invalid_content_type'));
        }

        if (contentType === 'attribute' && !attribute) {
            throw new Error(
                "El parametro 'attribute' es obligatorio cuando contentType es 'attribute'.",
            );
        }

        if (action === 'set' && value === undefined) {
            throw new Error("El parametro 'value' es obligatorio para la accion 'set'.");
        }

        // Esperar que el elemento esté presente
        await page.waitForSelector(selector, { state: 'attached', timeout: 10000 });

        let result;

        if (action === 'get') {
            // ========== GET ACTION ==========
            let content;

            if (contentType === 'attribute') {
                // Get specific attribute
                content = await page.getAttribute(selector, attribute);
                result = {
                    message: req.t('actions.get_set_content.get_attribute_success', { attribute }),
                    data: { content, attribute, contentType: 'attribute' },
                    traceDetails: { selector, action: 'get', contentType, attribute },
                };
            } else if (contentType === 'html') {
                // Get innerHTML
                content = await page.innerHTML(selector);
                result = {
                    message: req.t('actions.get_set_content.get_html_success'),
                    data: { content, contentType: 'html' },
                    traceDetails: { selector, action: 'get', contentType },
                };
            } else {
                // Default: get textContent
                content = await page.textContent(selector);
                result = {
                    message: req.t('actions.get_set_content.get_text_success'),
                    data: { content, contentType: 'text' },
                    traceDetails: { selector, action: 'get', contentType },
                };
            }
        } else if (action === 'set') {
            // ========== SET ACTION ==========

            if (contentType === 'attribute') {
                // Set specific attribute
                await page.evaluate(
                    ({ selector, attribute, value }) => {
                        const element = document.querySelector(selector); // eslint-disable-line no-undef
                        if (!element) throw new Error(`Element not found: ${selector}`);
                        element.setAttribute(attribute, value);
                    },
                    { selector, attribute, value },
                );

                result = {
                    message: req.t('actions.get_set_content.set_attribute_success', { attribute }),
                    traceDetails: {
                        selector,
                        action: 'set',
                        contentType,
                        attribute,
                        value,
                    },
                };
            } else if (contentType === 'html') {
                // Set innerHTML
                await page.evaluate(
                    ({ selector, value, clearBeforeSet }) => {
                        const element = document.querySelector(selector); // eslint-disable-line no-undef
                        if (!element) throw new Error(`Element not found: ${selector}`);

                        if (clearBeforeSet) {
                            element.innerHTML = value;
                        } else {
                            element.innerHTML += value;
                        }
                    },
                    { selector, value, clearBeforeSet },
                );

                result = {
                    message: req.t('actions.get_set_content.set_html_success'),
                    traceDetails: {
                        selector,
                        action: 'set',
                        contentType,
                        clearBeforeSet,
                    },
                };
            } else {
                // Default: set textContent or input value
                // Try to determine if it's an input field
                const tagName = await page.evaluate((sel) => {
                    const el = document.querySelector(sel); // eslint-disable-line no-undef
                    return el ? el.tagName.toLowerCase() : null;
                }, selector);

                const isInputField = ['input', 'textarea', 'select'].includes(tagName);

                if (isInputField) {
                    // For input fields, use fill/type
                    if (clearBeforeSet) {
                        await page.fill(selector, value);
                    } else {
                        // Append to existing content
                        await page.type(selector, value);
                    }
                } else {
                    // For other elements, modify textContent
                    await page.evaluate(
                        ({ selector, value, clearBeforeSet }) => {
                            const element = document.querySelector(selector); // eslint-disable-line no-undef
                            if (!element) throw new Error(`Element not found: ${selector}`);

                            if (clearBeforeSet) {
                                element.textContent = value;
                            } else {
                                element.textContent += value;
                            }
                        },
                        { selector, value, clearBeforeSet },
                    );
                }

                result = {
                    message: req.t('actions.get_set_content.set_text_success'),
                    traceDetails: {
                        selector,
                        action: 'set',
                        contentType,
                        clearBeforeSet,
                        isInputField,
                    },
                };
            }

            // Captura de screenshot automatica para operaciones SET
            let screenshotData = null;
            try {
                // Pequeña espera para asegurar que el renderizado se actualice
                await page.waitForTimeout(200);
                const screenshot = await page.screenshot({
                    fullPage: false,
                    type: 'png',
                });
                screenshotData = screenshot.toString('base64');
            } catch (err) {
                console.warn(
                    '[WARN] Fallo al tomar screenshot automático en get_set_content:',
                    err.message,
                );
            }

            // Add screenshot to response
            if (screenshotData) {
                result.data = { ...(result.data || {}), screenshot: screenshotData };
            }
        }

        return result;
    });

export const selectOptionAction = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const { selector, selectionCriteria, selectionValue, timeout } = opts;

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

        // Ensure files is an array, handling comma-separated strings
        const fileArray = Array.isArray(files)
            ? files
            : typeof files === 'string'
              ? files.split(',').map((file) => file.trim())
              : [];

        // Validate that files are provided
        if (!fileArray || fileArray.length === 0) {
            throw new Error(req.t('errors.files_required'));
        }

        // Validate that file paths are not dangerous
        const invalidFiles = fileArray.filter(
            (file) => file.includes('..') || file.startsWith('/'),
        );
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
            globalStateManager.setVariable(variableName, result);
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
        } = opts;

        // Playwright options configuration
        const screenshotOptions = {
            type: format,
            timeout,
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
            await page.waitForSelector(selector, { state: 'visible', timeout });
            const element = await page.$(selector);
            if (!element) {
                throw new Error(req.t('errors.element_not_found', { selector }));
            }
            screenshotBuffer = await element.screenshot(screenshotOptions);
        } else {
            // Case 2: Full Page / Viewport Capture
            screenshotBuffer = await page.screenshot(screenshotOptions);
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
            throw new Error(
                'Debe proporcionar "path" (archivo) o "variableName" (variable) para guardar el DOM.',
            );
        }

        // 2. Validacion de seguridad para path (si se proporciona)
        let resolvedPath = null;
        if (savePath) {
            if (savePath.includes('..')) {
                throw new Error('Ruta de archivo no segura: se detectó uso de ".."');
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
            globalStateManager.setVariable(variableName, content);
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

// waitForElementAction: Waits for a specific condition on a selector
export const waitForElementAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_element', async (page, opts) => {
        const { selector, condition = 'visible', timeout = 30000 } = opts;

        try {
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
                    const el = document.querySelector(sel); // eslint-disable-line no-undef
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
        const { waitUntil = 'networkidle', timeout = 10000 } = opts;

        // Validate waitUntil against Playwright's allowed states
        const validStates = ['load', 'domcontentloaded', 'networkidle'];
        if (!validStates.includes(waitUntil)) {
            throw new Error(
                `Invalid waitUntil state: ${waitUntil}. Must be one of: ${validStates.join(', ')}`,
            );
        }

        try {
            // Idempotent wait for the desired load state
            await page.waitForLoadState(waitUntil, { timeout: Number(timeout) });
        } catch (error) {
            throw new Error(
                `Wait navigation failed (state: ${waitUntil}, timeout: ${timeout}ms): ${error.message}`,
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
export const waitConditionalAction = (req, res) =>
    executePlaywrightAction(req, res, 'wait_conditional', async (page, opts) => {
        await page.waitForFunction(opts.conditionScript, opts.args, {
            polling: opts.polling,
            timeout: opts.timeout,
        });
        return { message: req.t('actions.wait_conditional.success') };
    });

export const logErrorsAction = (req, res) =>
    executePlaywrightAction(req, res, 'log_errors', async (page, opts) => {
        const { enable } = opts;
        if (enable) {
            page.on('console', (msg) => {
                if (msg.type() === 'error') console.log(`[PAGE CONSOLE ERROR] ${msg.text()}`);
            });
            page.on('pageerror', (err) => {
                console.log(`[PAGE ERROR] ${err.message}`);
            });
            return { message: req.t('actions.log_errors.success') };
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
        const { event } = opts; // e.g., 'dialog', 'request', 'response'
        // This is a basic implementation that only logs.
        // A real implementation might need WebSocket or SSE to send events to the client.
        page.on(event, (data) => {
            console.log(data);
            console.log(`[EVENT ${event}] Detected`);
        });
        return { message: req.t('actions.listen_events.success') };
    });

// ==========================================================
// ACCIONES DE NETWORK (UPDATED)
// ==========================================================

export const interceptRequestAction = (req, res) =>
    executePlaywrightAction(req, res, 'intercept_request', async (page, opts) => {
        const { urlPattern, method, action, responseMock, timeout } = opts;

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

        let response;
        if (statusCode) {
            // Use predicate
            response = await page.waitForResponse(
                (resp) => {
                    // So we must verify status.

                    // Workaround: custom simple glob matcher or simple includes.
                    const url = resp.url();
                    // Very basic glob support: *
                    const createRegex = (str) => {
                        // Escape special regex chars except *
                        const escaped = str
                            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                            .replace(/\*/g, '.*');
                        return new RegExp(`^${escaped}$`);
                    };

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
            globalStateManager.setVariable(saveToVariable, bodyData);
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
                const createRegex = (str) => {
                    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                    return new RegExp(`^${escaped}$`);
                };
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
        const { profile, offline, latency, downloadThroughput, uploadThroughput } = opts;

        const context = page.context();
        const cdpSession = await context.newCDPSession(page);

        // Profile definitions (similar to Chrome DevTools)
        const PRESETS = {
            'No throttling': {
                offline: false,
                latency: 0,
                downloadThroughput: -1,
                uploadThroughput: -1,
            },
            'WiFi fast': {
                offline: false,
                latency: 20, // 10-30 ms avg
                downloadThroughput: (50 * 1024 * 1024) / 8, // 50 Mbps avg
                uploadThroughput: (25 * 1024 * 1024) / 8, // 25 Mbps avg
            },
            'WiFi slow': {
                offline: false,
                latency: 80, // 50-100 ms avg
                downloadThroughput: (8 * 1024 * 1024) / 8, // 8 Mbps avg
                uploadThroughput: (2 * 1024 * 1024) / 8, // 2 Mbps avg
            },
            '4G': {
                offline: false,
                latency: 50, // 40-80 ms avg
                downloadThroughput: (20 * 1024 * 1024) / 8, // 20 Mbps avg
                uploadThroughput: (10 * 1024 * 1024) / 8, // 10 Mbps avg
                connectionType: 'cellular4g',
            },
            'Fast 3G': {
                offline: false,
                latency: 150, // ms
                downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.6 Mbps -> bytes/s
                uploadThroughput: (750 * 1024) / 8, // 750 Kbps
                connectionType: 'cellular3g',
            },
            'Slow 3G': {
                offline: false,
                latency: 400, // ms
                downloadThroughput: (400 * 1024) / 8, // 400 Kbps
                uploadThroughput: (400 * 1024) / 8, // 400 Kbps
                connectionType: 'cellular3g',
            },
            '2G': {
                offline: false,
                latency: 800, // 500-1000 ms avg
                downloadThroughput: (80 * 1024) / 8, // 80 Kbps avg
                uploadThroughput: (30 * 1024) / 8, // 30 Kbps avg
                connectionType: 'cellular2g',
            },
            'High Latency': {
                offline: false,
                latency: 2000, // Very high latency
                downloadThroughput: (10 * 1024 * 1024) / 8, // 10 Mbps (can be decent throughput but high latency)
                uploadThroughput: (5 * 1024 * 1024) / 8,
                connectionType: 'other', // Simulate unstable connection
            },
            Offline: {
                offline: true,
                latency: 0,
                downloadThroughput: 0,
                uploadThroughput: 0,
            },
        };

        let conditions = {};

        if (profile === 'Custom') {
            conditions = {
                offline: offline || false,
                latency: latency || 0,
                downloadThroughput:
                    downloadThroughput && downloadThroughput > 0
                        ? (downloadThroughput * 1024) / 8
                        : -1,
                uploadThroughput:
                    uploadThroughput && uploadThroughput > 0 ? (uploadThroughput * 1024) / 8 : -1,
            };
        } else {
            conditions = PRESETS[profile] || PRESETS['Fast 3G'];
        }

        // Emulate network conditions via CDP
        await cdpSession.send('Network.emulateNetworkConditions', {
            offline: conditions.offline,
            latency: conditions.latency,
            downloadThroughput: conditions.downloadThroughput,
            uploadThroughput: conditions.uploadThroughput,
            connectionType: conditions.connectionType || 'cellular4g',
        });

        return {
            message: req.t('actions.set_network_conditions.success', { profile }),
            data: conditions,
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
export const manageCookiesAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_cookies', async (page, opts, browserId, context) => {
        const { action, cookiesData } = opts;
        let cookies = [];

        // Parse cookiesData if present
        if (cookiesData) {
            try {
                cookies = JSON.parse(cookiesData);
            } catch (e) {
                throw new Error('cookiesData debe ser un JSON string válido.');
            }
        }

        if (action === 'get') {
            const currentCookies = await context.cookies();
            return { message: 'Cookies obtenidas', data: { cookies: currentCookies } };
        } else if (action === 'set') {
            if (!Array.isArray(cookies))
                throw new Error('cookiesData debe ser un array de objetos cookie para "set".');
            await context.addCookies(cookies);
            return { message: 'Cookies establecidas correctamente' };
        } else if (action === 'delete') {
            if (!Array.isArray(cookies))
                throw new Error(
                    'cookiesData debe ser un array de nombres de cookies para "delete".',
                );

            // Delete specific cookies strategy: Get all, filter keep, clear all, add back keep.
            const currentCookies = await context.cookies();
            const namesToDelete = new Set(cookies);
            const cookiesToKeep = currentCookies.filter((c) => !namesToDelete.has(c.name));

            await context.clearCookies();
            if (cookiesToKeep.length > 0) {
                await context.addCookies(cookiesToKeep);
            }
            return { message: `Cookies eliminadas: ${cookies.join(', ')}` };
        } else if (action === 'clear') {
            await context.clearCookies();
            return { message: 'Todas las Cookies han sido limpiadas' };
        } else {
            throw new Error(`Acción de cookies no válida: ${action}`);
        }
    });

export const manageStorageAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_storage', async (page, opts) => {
        const { action, type = 'local', key, value } = opts; // type: 'local' | 'session'

        if (action === 'get') {
            const data = await page.evaluate(
                ({ type, key }) => {
                    const storage =
                        type === 'session' ? window.sessionStorage : window.localStorage; // eslint-disable-line no-undef
                    if (key) return storage.getItem(key);
                    return JSON.stringify(storage); // Retorna todo si no hay key
                },
                { type, key },
            );
            return { message: 'Storage obtenido', data: { value: data } };
        } else if (action === 'set') {
            await page.evaluate(
                ({ type, key, value }) => {
                    const storage =
                        type === 'session' ? window.sessionStorage : window.localStorage; // eslint-disable-line no-undef
                    storage.setItem(key, value);
                },
                { type, key, value },
            );
            return { message: 'Storage actualizado' };
        } else if (action === 'remove' || action === 'delete') {
            await page.evaluate(
                ({ type, key }) => {
                    const storage =
                        type === 'session' ? window.sessionStorage : window.localStorage; // eslint-disable-line no-undef
                    storage.removeItem(key);
                },
                { type, key },
            );
            return { message: 'Propiedad de storage eliminada' };
        } else if (action === 'clear') {
            await page.evaluate(
                ({ type }) => {
                    const storage =
                        type === 'session' ? window.sessionStorage : window.localStorage; // eslint-disable-line no-undef
                    storage.clear();
                },
                { type },
            );
            return { message: 'Storage limpiado' };
        } else {
            throw new Error(`Acción de storage no válida: ${action}`);
        }
    });

export const injectTokensAction = (req, res) =>
    executePlaywrightAction(req, res, 'inject_tokens', async (page, opts, browserId, context) => {
        const { target, key, value } = opts;

        if (target === 'header') {
            const headers = { [key]: value };
            await page.setExtraHTTPHeaders(headers);
            return { message: `Token inyectado en Header: ${key}` };
        } else if (target === 'cookie') {
            // Intentar usar URL de la página actual, o fallback a localhost si falla (requerido por Playwright)
            let url = 'http://localhost';
            try {
                url = page.url();
                if (url === 'about:blank') url = 'http://localhost';
            } catch (e) {
                // CORRECCIÓN: Evitar el bloque vacío
                console.error('Error al obtener URL de la página para cookie:', e); //
            }

            await context.addCookies([
                {
                    name: key,
                    value: value,
                    url: url,
                },
            ]);
            return { message: `Token inyectado en Cookie: ${key}` };
        } else if (target === 'query') {
            const currentUrl = new URL(page.url());
            currentUrl.searchParams.set(key, value);
            await page.goto(currentUrl.toString());
            return { message: `Token inyectado en Query Param y recargado: ${key}` };
        } else {
            throw new Error(`Target de inyección no soportado: ${target}`);
        }
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
                        ls.forEach((item) => window.localStorage.setItem(item.name, item.value)); // eslint-disable-line no-undef
                    }, originState.localStorage);
                }
                if (originState && originState.sessionStorage && includeSessionStorage) {
                    await page.evaluate((ss) => {
                        ss.forEach((item) => window.sessionStorage.setItem(item.name, item.value)); // eslint-disable-line no-undef
                    }, originState.sessionStorage);
                }
            }
            return { message: 'Sesión cargada (Best Effort) en contexto activo' };
        } else if (action === 'clear') {
            await context.clearCookies();
            await page.evaluate(() => {
                window.localStorage.clear(); // eslint-disable-line no-undef
                window.sessionStorage.clear(); // eslint-disable-line no-undef
            });
            return { message: 'Sesión limpiada (Cookies y Storage)' };
        } else {
            throw new Error(`Acción de persistencia no válida: ${action}`);
        }
    });

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
                window.localStorage.clear(); // eslint-disable-line no-undef
                window.sessionStorage.clear(); // eslint-disable-line no-undef
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
            // eslint-disable-next-line no-undef
            window.addEventListener('unhandledrejection', (event) => {
                console.warn('[PAGE UNHANDLED REJECTION]', event.reason);
            });
            // eslint-disable-next-line no-undef
            window.addEventListener('error', (event) => {
                console.warn('[PAGE ERROR]', event.message);
            });
        });
        return { message: req.t('actions.control_exceptions.success') };
    });

export const readDataAction = (req, res) =>
    executePlaywrightAction(req, res, 'read_data', async (page, opts) => {
        const { selector, type = 'text' } = opts; // type: 'text', 'html', 'attributes'

        if (type === 'text') {
            const data = await page.textContent(selector);
            return { message: req.t('actions.read_data.success'), data: { content: data } };
        } else if (type === 'html') {
            const data = await page.innerHTML(selector);
            return { message: req.t('actions.read_data.success'), data: { content: data } };
        } else {
            // Implement attribute logic if necessary
            return { message: req.t('actions.read_data.unsupported_type'), data: {} };
        }
    });

export const saveResultsAction = (req, res) =>
    executePlaywrightAction(req, res, 'save_results', async (page, opts) => {
        const { data, path: savePath } = opts;
        await fsp.writeFile(
            savePath,
            typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        );
        return { message: req.t('actions.save_results.success'), data: { path: savePath } };
    });

export const handleDownloadsAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_downloads', async (page, opts) => {
        const { selector, path: savePath } = opts;

        const downloadPromise = page.waitForEvent('download');
        await page.click(selector);
        const download = await downloadPromise;

        await download.saveAs(savePath);
        return { message: req.t('actions.handle_downloads.success'), data: { path: savePath } };
    });

export const runTestsAction = (req, res) =>
    res.status(200).json({
        success: true,
        message:
            'Test execution triggered (Simulated). Real integration would require a test runner.',
    });

export const cliParamsAction = (req, res) =>
    res.status(200).json({
        success: true,
        message: 'CLI parameters processed',
        data: { params: req.body },
    });

export const returnCodeAction = (req, res) =>
    res.status(200).json({
        success: true,
        message: 'Return code set',
        data: { code: req.body.code || 0 },
    });

export const integrateCIAction = (req, res) =>
    res.status(200).json({
        success: true,
        message: req.t('actions.integrate_ci.success'),
    });

// Acciones adicionales del router original
export const dragDropAction = async (req, res) => {
    let sourceSelector;
    let targetSelector;
    let finalBrowserId;

    try {
        // Extract and validate parameters
        const { steps = 10, force = false } = req.body ?? {};
        ({ sourceSelector, targetSelector } = req.body ?? {});

        if (!sourceSelector || !targetSelector) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.source_target_required'),
            });
        }

        // Validate browser and context
        let { browserId } = req.body ?? {};
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;
        const context = await getOrCreateContext(browserInstance, targetBrowserId);
        const pages = context.pages();

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.no_active_pages'),
            });
        }

        const page = pages[pages.length - 1];
        if (page.isClosed && page.isClosed()) {
            throw new Error(req.t('common.page_closed'));
        }

        finalBrowserId = targetBrowserId;
        const start = Date.now();

        console.log(
            `[INFO] Dragging ${sourceSelector} to ${targetSelector}. Steps: ${steps}, Force: ${force}`,
        );

        // Perform drag-and-drop action
        await page.dragAndDrop(sourceSelector, targetSelector, {
            steps: steps,
            force: force,
            timeout: 30000,
        });

        const duration = Date.now() - start;

        traceService.add({
            action: 'drag_drop',
            sourceSelector,
            targetSelector,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.drag_drop.success', {
                source: sourceSelector,
                target: targetSelector,
            }),
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] dragDropAction:', error.message);

        traceService.add({
            action: 'drag_drop',
            error: error.message,
            status: 'error',
        });

        const status = error.message.includes('No node found') ? 404 : 500;

        return res.status(status).json({
            success: false,
            message: req.t('errors.error_dragging'),
            error: error.message,
            sourceSelector,
            targetSelector,
        });
    }
};
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

export const resizeViewportAction = async (req, res) => {
    try {
        const { width, height } = req.body;

        if (!width || !height) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.width_height_required'),
            });
        }

        const validation = validateBrowser(req.body.browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const browserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;
        const context = await getOrCreateContext(browserInstance, browserId);
        const pages = context.pages();

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.no_active_pages'),
            });
        }

        const page = pages[pages.length - 1];
        if (page.isClosed && page.isClosed()) {
            throw new Error(req.t('common.page_closed'));
        }

        await page.setViewportSize({ width, height });

        return res.status(200).json({
            success: true,
            message: req.t('actions.resize_viewport.success', { width, height }),
        });
    } catch (error) {
        console.error('[ERROR] resizeViewportAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error resizing viewport.',
            error: error.message,
        });
    }
};

// ==========================================================
// FLOW CONTROL ACTIONS
// ==========================================================

export const variableAction = async (req, res) => {
    try {
        const { operation, name, value, scope = 'flow' } = req.body;

        let result;
        let message;

        switch (operation) {
            case 'set':
                variableManager.set(name, value, scope);
                result = { name, value, scope, operation: 'set' };
                message = req.t('actions.variable.set_success', { name, scope });
                break;

            case 'get': {
                const getValue = variableManager.get(name, scope);
                result = { name, value: getValue, scope, operation: 'get' };
                message = req.t('actions.variable.get_success', { name });
                break;
            }

            case 'increment': {
                const amount = typeof value === 'number' ? value : 1;
                variableManager.increment(name, amount, scope);
                const newValue = variableManager.get(name, scope);
                result = { name, value: newValue, amount, scope, operation: 'increment' };
                message = req.t('actions.variable.increment_success', { name, amount });
                break;
            }

            case 'push': {
                variableManager.push(name, value, scope);
                const array = variableManager.get(name, scope);
                result = { name, array, scope, operation: 'push' };
                message = req.t('actions.variable.push_success', { name });
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
        const { conditions, logic = 'AND' } = req.body;

        const result = variableManager.evaluateConditions(conditions, logic);

        return res.status(200).json({
            success: true,
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
        return res.status(500).json({
            success: false,
            message: req.t('actions.conditional.error'),
            error: error.message,
        });
    }
};

export const loopAction = async (req, res) => {
    try {
        const { mode, iterations, condition, array, itemVar, maxIterations = 1000 } = req.body;

        const data = { mode, iterations, condition, array, itemVar, maxIterations };

        return res.status(200).json({
            success: true,
            message: req.t('actions.loop.success'),
            data,
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

        const resolvedInput = variableManager.resolve(input);
        const inputArray =
            variableManager.get(resolvedInput.replace('${', '').replace('}', ''), 'flow') || [];

        let result;
        switch (operation) {
            case 'map':
                result = inputArray.map((item) => variableManager.evaluate(expression, { item }));
                break;
            case 'filter':
                result = inputArray.filter((item) =>
                    variableManager.evaluate(expression, { item }),
                );
                break;
            case 'merge': {
                const mergeArray =
                    variableManager.get(mergeWith.replace('${', '').replace('}', ''), 'flow') || [];
                result = [...inputArray, ...mergeArray];
                break;
            }
            default:
                result = inputArray;
        }

        variableManager.set(outputVar, result, 'flow');

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

// ==========================================================
// 🤖 AI ACTIONS
// ==========================================================

export const callLlmAction = async (req, res) => {
    try {
        let { prompt, system, model, variableName, maxTokens, temperature, provider } = req.body;

        const defaultModel = req.headers['x-openai-model'];

        // Auto-detect provider if not explicitly set
        if (!provider && model) {
            if (model.toLowerCase().includes('gemini')) provider = 'google';
            else if (model.toLowerCase().includes('claude')) provider = 'anthropic';
            else if (model.toLowerCase().includes('grok')) provider = 'grok';
            else provider = 'openai';
        } else if (!provider) {
            provider = 'openai';
        }

        // Select key based on provider
        let apiKey = req.headers['x-openai-key'];
        if (provider === 'google') apiKey = req.headers['x-google-key'];
        if (provider === 'anthropic') apiKey = req.headers['x-anthropic-key'];
        if (provider === 'grok') apiKey = req.headers['x-openai-key']; // Grok often uses same key slot or x-grok-key, but usually compatible with openai sdk

        const response = await aiService.generateText({
            prompt: variableManager.resolve(prompt),
            system: system ? variableManager.resolve(system) : undefined,
            model: model, // Fix: Changed modelName to model to match AIService signature
            defaultModel,
            provider,
            apiKey,
            maxTokens,
            temperature,
        });

        variableManager.set(variableName, response, 'flow');

        return res.status(200).json({
            success: true,
            message: req.t('actions.call_llm.success'),
            data: { response, variable: variableName },
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
        const { description, fields, count = 1, variable } = req.body;

        // Build Zod schema dynamically from fields
        const shape = {};
        fields.forEach((field) => {
            let validator;
            switch (field.type) {
                case 'string':
                    validator = z.string();
                    break;
                case 'number':
                    validator = z.number();
                    break;
                case 'boolean':
                    validator = z.boolean();
                    break;
                case 'array':
                    validator = z.array(z.string());
                    break; // Simplified for now
                case 'object':
                    validator = z.record(z.any());
                    break;
                default:
                    validator = z.string();
            }
            if (field.description) validator = validator.describe(field.description);
            shape[field.name] = validator;
        });

        let schema = z.object(shape);
        if (count > 1) {
            schema = z.array(schema);
        }

        const defaultModel = req.headers['x-openai-model'];
        const keys = {
            openai: req.headers['x-openai-key'],
            google: req.headers['x-google-key'],
            anthropic: req.headers['x-anthropic-key'],
        };

        const data = await aiService.generateStructured({
            description: variableManager.resolve(description),
            schema,
            defaultModel,
            keys,
        });

        variableManager.set(variable, data, 'flow');

        return res.status(200).json({
            success: true,
            message: req.t('actions.generate_data.success'),
            data: { data, variable },
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
        const { content, criteria, variable } = req.body;

        const defaultModel = req.headers['x-openai-model'];
        const keys = {
            openai: req.headers['x-openai-key'],
            google: req.headers['x-google-key'],
            anthropic: req.headers['x-anthropic-key'],
        };

        const result = await aiService.validate({
            content: variableManager.resolve(content),
            criteria: variableManager.resolve(criteria),
            defaultModel,
            keys,
        });

        variableManager.set(variable, result, 'flow');

        return res.status(200).json({
            success: true,
            message: req.t('actions.validate_semantic.success'),
            data: { result, variable },
        });
    } catch (error) {
        console.error('[ERROR] validateSemanticAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.validate_semantic.error'),
            error: error.message,
        });
    }
};

/**
 * Validate AI Credentials by attempting a minimal generation
 */
export const validateAICredentials = async (req, res) => {
    try {
        const { provider, model, apiKey } = req.body;

        if (!provider || !model || !apiKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing provider, model or apiKey',
            });
        }

        const keys = { [provider]: apiKey.trim() };
        // We use a very cheap, short prompt to test connectivity
        await aiService.generateText({
            prompt: "Return 'OK' if you see this.",
            modelName: model,
            defaultModel: model,
            keys,
        });

        res.json({ success: true, message: 'Connection successful' });
    } catch (error) {
        // Log brief error internally (avoid logging full error object which might have keys)
        console.error('[AI Validation Error]', error.message);

        // Return 200 so frontend doesn't log "Unauthorized" console error
        res.status(200).json({
            success: false,
            message: 'Validation failed: ' + (error.message || 'Unknown error'),
        });
    }
};
