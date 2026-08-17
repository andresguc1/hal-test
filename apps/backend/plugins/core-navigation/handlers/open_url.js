import { variableManager } from '../../../services/VariableManager.js';
import { browserService } from '../../../services/browser.service.js';
import { traceService } from '../../../services/trace.service.js';
import { executionLogger } from '../../../services/ExecutionLogger.js';
import { emitExecutionStatus, emitScreenshotReady } from '../../../socket.js';
import { STORAGE_RUNS_DIR } from '../../../config/paths.js';
import { validateBrowser, getOrCreateContext } from '../../../core/browser-utils.js';
import { smartEmitLog } from '../../../core/ActionExecutor.js';
import * as fsp from 'fs/promises';
import * as path from 'path';
/* eslint-disable no-undef */

const openUrlAction = async (req, res) => {
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

        let validation = validateBrowser(req, req.body.browserId);
        if (validation.error) {
            try {
                console.log('[openUrlAction] No active browser session. Auto-launching browser...');
                const launchOpts = { headless: req.body?.headless !== false };
                const { browserId: newId } = await browserService.launchBrowser(launchOpts);
                validation = validateBrowser(req, newId);
            } catch (e) {
                console.error('[openUrlAction] Auto-launch failed:', e.message);
            }
        }
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

        if (page && !page.isClosed()) {
            page._currentRunId = runId;
            page._currentNodeId = nodeId;
            if (!page._securityAlerts) page._securityAlerts = [];
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
            try {
                await executionLogger.logStep(
                    runId,
                    { id: nodeId, type: actionName },
                    {
                        status: 'success',
                        duration,
                        input: opts,
                        output: {
                            url,
                            browserId,
                            securityAlerts:
                                page && page._securityAlerts
                                    ? page._securityAlerts.filter((a) => a.nodeId === nodeId)
                                    : [],
                        },
                        screenshot: screenshotPath,
                    },
                );
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log step result:', logErr.message);
            }
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
            try {
                await executionLogger.logStep(
                    runId,
                    { id: nodeId, type: actionName },
                    {
                        status: 'failed',
                        duration,
                        input: req.body,
                        error: error.message,
                        output: {
                            securityAlerts:
                                typeof page !== 'undefined' && page && page._securityAlerts
                                    ? page._securityAlerts.filter((a) => a.nodeId === nodeId)
                                    : [],
                        },
                    },
                );
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log failure step:', logErr.message);
            }
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

export default openUrlAction;
