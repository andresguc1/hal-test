import { browserService } from '../../../services/browser.service.js';
import { traceService } from '../../../services/trace.service.js';
import { executionLogger } from '../../../services/ExecutionLogger.js';
import { emitExecutionStatus } from '../../../socket.js';
import { validateBrowser } from '../../../core/browser-utils.js';
import { smartEmitLog } from '../../../core/ActionExecutor.js';

const closeBrowserAction = async (req, res) => {
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
            try {
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
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log step result:', logErr.message);
            }
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
            try {
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
            } catch (logErr) {
                console.error('[FlightRecorder] Failed to log failure step:', logErr.message);
            }
        }
        // ------------------------------------

        return res.status(500).json({
            success: false,
            message: req.t('actions.close_browser.error'),
            error: error.message,
        });
    }
};

export default closeBrowserAction;
