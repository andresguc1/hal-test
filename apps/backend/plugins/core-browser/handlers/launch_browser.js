import { variableManager } from '../../../services/VariableManager.js';
import { browserService, computeProfileHash } from '../../../services/browser.service.js';
import { executionLogger } from '../../../services/ExecutionLogger.js';
import { emitExecutionStatus } from '../../../socket.js';
import { Run } from '../../../database/init.js';
import { smartEmitLog } from '../../../core/ActionExecutor.js';
import { getOrCreateContext } from '../../../core/browser-utils.js';

const launchBrowserAction = async (req, res) => {
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
                // Profile-hash comparison (Fase 1): replaces the manual option
                // diff that silently failed to detect engine changes
                // (chromium -> firefox -> webkit), mixing browser processes.
                const oldProfileHash = latestBrowser.profileHash;
                const newProfileHash = computeProfileHash(resolvedBody);
                const hasChanges = oldProfileHash !== newProfileHash;

                if (!hasChanges) {
                    console.log('[ACTION] Reusing existing browser (Debug Mode)');
                    smartEmitLog(
                        `Reusing browser (${resolvedBody.devicePreset || 'Desktop'})`,
                        'info',
                        nodeId,
                    );
                    if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });
                    return res.status(200).json({
                        success: true,
                        message: 'Browser reused (Debug Mode)',
                        browserId: latestId,
                        reused: true,
                        headless: latestBrowser.options.headless ?? false,
                    });
                } else {
                    console.log(
                        `[ACTION] Profile changed (${oldProfileHash} -> ${newProfileHash}), restarting browser...`,
                    );
                    smartEmitLog(`Browser profile changed, restarting...`, 'info', nodeId);
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

        // Ensure a visual page/window exists if launching in visible mode
        if (!resolvedBody.headless) {
            try {
                const entry = browserService.get(browserId);
                if (entry && entry.browser) {
                    const context = await getOrCreateContext(req, entry.browser, browserId);
                    const pages = context.pages();
                    if (pages.length === 0) {
                        await context.newPage();
                    }
                }
            } catch (pageErr) {
                console.warn('[ACTION] Could not create initial page on launch:', pageErr.message);
            }
        }

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
            try {
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
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log step result:', logErr.message);
            }
        }
        // ------------------------------------

        const launchedSession = browserService.get(browserId);
        const actualHeadless = launchedSession?.options?.headless ?? resolvedBody.headless;

        return res.status(200).json({
            success: true,
            message: req.t('actions.launch_browser.success'),
            browserId,
            headless: actualHeadless,
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
            try {
                await executionLogger.logStep(
                    runId,
                    { id: nodeId, type: 'launch_browser' },
                    {
                        status: 'failed',
                        duration,
                        input: req.body,
                        error: error.message,
                    },
                );
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log failure step:', logErr.message);
            }
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

export default launchBrowserAction;
