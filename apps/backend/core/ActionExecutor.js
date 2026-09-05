// core/ActionExecutor.js - Core Action Execution Engine
// Extracted from action.controller.js for reuse across plugins
// ==========================================================

import { browserService } from '../services/browser.service.js';
import { activeRunManager } from '../services/ActiveRunManager.js';
import { traceService } from '../services/trace.service.js';
import { variableManager } from '../services/VariableManager.js';
import experienceVaultService from '../services/ExperienceVaultService.js';
import {
    emitExecutionStatus,
    emitScreenshotReady,
    emitLog,
    emitAutoHealingUpdate,
} from '../socket.js';
import { Flow, Node, HealingLog } from '../database/init.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { STORAGE_RUNS_DIR } from '../config/paths.js';
import { auditService } from '../services/AuditService.js';
import * as fsp from 'fs/promises';
import * as path from 'path';
import {
    validateBrowser,
    getActivePage,
    getOrCreateContext,
    isCIEnvironment,
} from './browser-utils.js';
import { buildPlaywrightLocator, resolveSelectors } from './selector-utils.js';

const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

async function executePlaywrightAction(req, res, actionName, actionLogic) {
    let targetBrowserId;
    const start = Date.now();
    const runId = req.body.runId;
    const nodeId = req.body.nodeId;
    const useExperienceVault = req.headers?.['x-hal-experience-vault'] !== 'false';
    const enableFineTuning = req.headers?.['x-hal-fine-tuning'] === 'true';
    const autoHealingHeader = req.headers?.['x-hal-auto-healing-enabled'];
    const autoHealingRetryHeader = req.headers?.['x-hal-auto-healing-max-retries'];
    const autoHealingEnabled = autoHealingHeader === 'true' || autoHealingHeader === '1';
    const autoHealingRetryLimit = Number.isFinite(Number(autoHealingRetryHeader))
        ? Math.max(0, Math.min(3, Number(autoHealingRetryHeader)))
        : 0;
    const effectiveAutoHealingRetryLimit = autoHealingEnabled ? autoHealingRetryLimit : 0;
    let simplifiedDOMBefore = null;

    const opts = variableManager.resolveRecursive(req.body, runId);

    if (opts.continueOnError === 'true' || opts.continueOnError === '1')
        opts.continueOnError = true;
    if (opts.continueOnError === 'false' || opts.continueOnError === '0')
        opts.continueOnError = false;
    if (opts.continueOnError === undefined && opts.continueOnFailure) opts.continueOnError = true;

    if (opts.takeScreenshot === 'true' || opts.takeScreenshot === '1') opts.takeScreenshot = true;
    if (opts.takeScreenshot === 'false' || opts.takeScreenshot === '0') opts.takeScreenshot = false;

    const numParams = ['timeout', 'delay', 'slowMo', 'amount', 'maxScrolls', 'x', 'y'];
    for (const key of numParams) {
        if (opts[key] !== undefined && opts[key] !== null && opts[key] !== '') {
            const parsed = Number(opts[key]);
            if (!isNaN(parsed)) {
                opts[key] = parsed;
            }
        }
    }

    const resolvedOpts = resolveSelectors(opts, actionName);

    let finalLabel = opts.label || req.body.label || req.body.customLabel;

    if (!finalLabel && nodeId) {
        try {
            const nodeRecord = await Node.findOne({ where: { nodeId } });
            if (nodeRecord && nodeRecord.data) {
                finalLabel = nodeRecord.data.customLabel || nodeRecord.data.label;
                console.log(
                    `[ActionExecutor] [DEBUG] Recovered label from DB for ${nodeId}: "${finalLabel}"`,
                );
            }
        } catch (dbErr) {
            console.warn('[ActionExecutor] [WARN] Failed to recover label from DB:', dbErr.message);
        }
    }

    const label = finalLabel || nodeId || actionName;
    console.log(
        `[ActionExecutor] [DEBUG] Resolved Label for execution: "${label}" (Action: ${actionName})`,
    );

    if (actionName === 'type_text') {
        console.log(
            `[ActionExecutor] [DEBUG] ${actionName} text: "${req.body.text}" -> "${opts.text}" (RunId: ${runId || 'None'})`,
        );
    } else {
        console.log(`[ActionExecutor] [DEBUG] actionName=${actionName} options resolved.`);
    }

    let page, context;

    if (nodeId) {
        req._socketStatusHandled = true;
        emitExecutionStatus({ stepId: nodeId, status: 'running' });
        smartEmitLog(`Executing ${actionName}...`, 'info', nodeId);
    }

    // Safety gate: never implicitly open a browser for an action that belongs
    // to a run that has been cancelled. If the run was stopped (e.g. the user
    // pressed "Stop" during a composite), each stray in-flight request would
    // otherwise re-launch a fresh browser — one per exposed node — because the
    // session's browser was already closed and browserService is empty.
    const runAborted = activeRunManager.getSignal(runId)?.aborted === true;

    if (
        !runAborted &&
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
                headless: false,
            });
            opts.browserId = browserId;
            req.body.browserId = browserId;
            targetBrowserId = browserId;
        } catch (err) {
            console.error('[Implicit Launch] Failed:', err);
        }
    }

    try {
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

            if (page && !page.isClosed()) {
                page._currentRunId = runId;
                page._currentNodeId = nodeId;
                if (!page._securityAlerts) page._securityAlerts = [];
            }

            if (page && !page.isClosed()) {
                try {
                    const { default: selectorHealer } =
                        await import('../services/SelectorHealer.js');
                    simplifiedDOMBefore = await page.evaluate(
                        selectorHealer.getCompressionScript(),
                        opts.selector,
                    );
                } catch (domErr) {
                    console.warn(
                        '[ActionExecutor] Failed to capture DOM before action:',
                        domErr.message,
                    );
                }
            }
        } else if (opts.browserId) {
            const validation = validateBrowser(req, opts.browserId);
            if (!validation.error) {
                targetBrowserId = validation.browserId;

                if (isContextAction) {
                    const browserInstance = validation.entry.browser || validation.entry;
                    context = await getOrCreateContext(req, browserInstance, targetBrowserId);
                }
            }
        }

        if (page && !page.isClosed()) {
            await page
                .evaluate((lbl) => {
                    /* eslint-disable no-undef */
                    if (typeof window.__hal_update_step === 'function') {
                        window.__hal_update_step(lbl, 'running');
                    }
                }, label)
                .catch(() => {});

            if (resolvedOpts.selector) {
                try {
                    const locator = buildPlaywrightLocator(page, resolvedOpts.selector);
                    await locator
                        .evaluate((el) => {
                            el.style.outline = '3px solid #6366f1';
                            el.style.outlineOffset = '2px';
                            setTimeout(() => {
                                el.style.outline = '';
                                el.style.outlineOffset = '';
                            }, 800);
                        })
                        .catch(() => {});
                } catch (e) {
                    // Ignore highlight failures
                }
            }
        }

        const result = await actionLogic(page, resolvedOpts, targetBrowserId, context);

        if (page && !page.isClosed()) {
            await page
                .evaluate((lbl) => {
                    /* eslint-disable no-undef */
                    if (typeof window.__hal_update_step === 'function') {
                        window.__hal_update_step(lbl, 'success');
                        setTimeout(() => window.__hal_update_step(null), 1000);
                    }
                }, label)
                .catch(() => {});
        }

        const duration = Date.now() - start;
        const finalMessage = result.message || `${actionName} completed successfully`;

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

        let screenshotPath = null;
        if (opts.takeScreenshot && page && !page.isClosed() && nodeId) {
            try {
                const effectiveRunId = runId || 'debug';
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, effectiveRunId);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                const filename = `${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath, animations: 'disabled' });
                screenshotPath = `storage/runs/${effectiveRunId}/${filename}`;
                console.log(`[ActionExecutor] Screenshot saved: ${screenshotPath}`);
                emitScreenshotReady({ nodeId, screenshotPath, runId: effectiveRunId });
            } catch (err) {
                console.warn(
                    '[WARN] ActionExecutor: Failed to capture success screenshot',
                    err.message,
                );
            }
        }

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
                            ...(typeof result.data === 'object'
                                ? result.data
                                : { value: result.data }),
                            ...(typeof result.traceDetails === 'object' ? result.traceDetails : {}),
                            securityAlerts:
                                page && page._securityAlerts
                                    ? page._securityAlerts.filter(
                                          (a) => !a.nodeId || a.nodeId === nodeId,
                                      )
                                    : Array.isArray(result?.data?.alerts)
                                      ? result.data.alerts
                                      : [],
                        },
                        screenshot: screenshotPath,
                        videoTimestamp: req.body.runStartTime
                            ? (Date.now() - req.body.runStartTime) / 1000
                            : null,
                    },
                );
            } catch (logErr) {
                console.error('[ActionExecutor] Failed to log step result:', logErr.message);
            }
        }

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
                console.error('[ActionExecutor] Failed to write audit log:', auditErr.message);
            }
        }

        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'success' });
        }

        const nodeLabel = label;
        if (result && result.success !== false) {
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
                `[ActionExecutor] Saved normalized result for "${nodeLabel}" to variableManager (Run: ${runId})`,
            );
        }

        // Only treat a node as a successful baseline when BOTH the transport
        // and the handler payload confirm success. find_element returns
        // { success: false } on not-found; storing that as a "successful"
        // selector would poison the Experience Vault with failing selectors.
        const actionSucceed = result?.success !== false && result?.data?.success !== false;

        if (
            useExperienceVault &&
            actionSucceed &&
            !opts.isSubStep &&
            opts.selector &&
            opts.nodeId
        ) {
            let contextName = 'Global';
            if (opts.flowId) {
                try {
                    const flow = await Flow.findByPk(opts.flowId);
                    if (flow) contextName = flow.name;
                } catch (e) {
                    console.warn(
                        `[ActionExecutor] Failed to fetch flow name for context: ${e.message}`,
                    );
                }
            }

            experienceVaultService
                .saveMemory({
                    context: contextName,
                    url: page?.url() || '',
                    nodeId: opts.nodeId,
                    problemSelector: opts.selector,
                    solutionSelector: opts.selector,
                    reasoning: 'Verified successful execution (Baseline).',
                    confidence: 1.0,
                })
                .then((saved) => {
                    if (saved) {
                        emitLog({
                            message: `[Experience-Vault] Storing successful selector: "${opts.selector}"`,
                            nodeId: opts.nodeId,
                            type: 'info',
                        });
                        emitLog({
                            message: `[Experience-Vault] Linked to node: ${opts.nodeId}`,
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
            screenshot: screenshotPath,
            ...result.responseExtra,
        });
    } catch (error) {
        const errorMessage = (error.message || 'Unknown selector error').replace(/&quot;/g, '"');
        const isDraftMode = req.headers?.['x-hal-draft-mode'] === 'true';

        if (isDraftMode) {
            console.warn(
                `[Draft Mode] Execution error in node ${nodeId}. Skipping action gracefully. Error: ${errorMessage}`,
            );
            // The Draft-Mode early return used to skip the stale-session cleanup
            // below, so a dead/closed browser stayed registered and every later
            // node kept tripping over it ("Target page... has been closed").
            if (
                targetBrowserId &&
                (errorMessage.includes('disconnected') ||
                    errorMessage.includes('closed') ||
                    errorMessage.includes('desconectado') ||
                    errorMessage.includes('cerrado'))
            ) {
                browserService.delete(targetBrowserId);
            }
            if (nodeId) {
                emitExecutionStatus({
                    stepId: nodeId,
                    status: 'softfailed',
                    error: errorMessage,
                    message: `Acción omitida: Nodo incompleto (Draft Mode). Detalles: ${errorMessage.substring(0, 100)}`,
                });
                smartEmitLog(`Acción omitida: Nodo incompleto (Draft Mode)`, 'warning', nodeId);
            }
            return res.status(200).json({
                success: true,
                status: 'softfailed',
                message: `Acción omitida: Nodo incompleto (Draft Mode). Detalles: ${errorMessage.substring(0, 100)}`,
                error: errorMessage,
                browserId: targetBrowserId,
            });
        }

        if (isCIEnvironment()) {
            console.log('[CI-Mode] Selector healing bypass activated via HALTEST_RUNNER_MODE');
            smartEmitLog(
                `[CI Mode] Selector failed: ${opts?.selector || 'N/A'}. Healing disabled. Error: ${String(errorMessage).substring(0, 100)}`,
                'error',
                nodeId,
            );

            if (nodeId) {
                emitExecutionStatus({ stepId: nodeId, status: 'failed' });
            }

            return res.status(400).json({
                success: false,
                message: `Selector failed in CI mode (healing disabled): ${errorMessage}`,
                browserId: targetBrowserId,
                ciMode: true,
            });
        }

        const isActionFailure =
            errorMessage.includes('Timeout') ||
            errorMessage.includes('selector') ||
            errorMessage.includes('waiting');
        const status = error.status || (isActionFailure ? 400 : 500);
        const duration = Date.now() - start;

        const isSelectorError =
            errorMessage.includes('Timeout') ||
            errorMessage.includes('waiting for selector') ||
            errorMessage.includes('element is not visible') ||
            errorMessage.includes('no element found') ||
            errorMessage.includes('Unexpected token') ||
            errorMessage.includes('parsing css selector') ||
            errorMessage.includes('is not a valid selector');

        const isHealingDisabled = !autoHealingEnabled || effectiveAutoHealingRetryLimit === 0;

        if (
            isSelectorError &&
            opts.selector &&
            (runId || opts.debugMode) &&
            !opts.continueOnError &&
            !isHealingDisabled
        ) {
            const healingStart = Date.now();
            emitLog({
                message: `[Self-Healing] Failure detected for: "${opts.selector}". Error: ${errorMessage.substring(0, 50)}...`,
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

                    if (useExperienceVault) {
                        emitLog({
                            message: `[Experience-Vault] Checking stored selectors for: ${opts.selector}...`,
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
                                    message: `[Experience-Vault] Match found: "${diagnosis.correctedSelector}"`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                                emitLog({
                                    message: `[Self-Healing] Replacing selector with stored value from Experience Vault`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                            } else {
                                emitLog({
                                    message: `[Experience-Vault] Solution found in memory. Source: ${contextName}.`,
                                    nodeId: opts.nodeId,
                                    type: 'success',
                                });
                            }
                            diagnosis.source = 'memory';
                        } else {
                            emitLog({
                                message: `[Experience-Vault] No previous solution found in history for "${opts.selector}".`,
                                nodeId: opts.nodeId,
                                type: 'info',
                            });
                        }
                    }

                    if (!diagnosis) {
                        emitLog({
                            message: `[Self-Healing] Escalating to IA (${aiConfig.provider}/${aiConfig.model || 'default'}). Analyzing DOM...`,
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
                            maxTiers: effectiveAutoHealingRetryLimit,
                            onProgress: (p) => {
                                if (p.step === 'verifying_candidate') {
                                    emitLog({
                                        message: `[Self-Healing] Testing candidate ${p.index}/${p.total}: "${p.candidate}"...`,
                                        nodeId: opts.nodeId,
                                        type: 'info',
                                    });
                                } else if (p.step === 'candidate_success') {
                                    emitLog({
                                        message: `[Self-Healing] Match found: "${p.candidate}" (${p.unique ? 'Unique' : 'Multiple matches'})`,
                                        nodeId: opts.nodeId,
                                        type: 'success',
                                    });
                                }
                            },
                        });
                        diagnosis.source = 'ai';

                        if (diagnosis.metadata) {
                            emitLog({
                                message: `[Self-Healing] IA Metadata: DOM Size=${diagnosis.metadata.domSize} chars, AI Time=${diagnosis.metadata.aiResponseTime}ms, Candidates=${diagnosis.metadata.candidateCount}`,
                                nodeId: opts.nodeId,
                                type: 'info',
                            });
                        }
                    }

                    if (
                        diagnosis?.correctedSelector &&
                        diagnosis.correctedSelector !== opts.selector
                    ) {
                        emitLog({
                            message: `[Self-Healing] New selector: "${diagnosis.correctedSelector}" (Confidence: ${Math.round(diagnosis.confidence * 100)}%)`,
                            nodeId: opts.nodeId,
                            type: 'success',
                        });

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
                                        message: `[Experience-Vault] New solution successfully persisted to the vault.`,
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

                        emitAutoHealingUpdate({
                            nodeId: opts.nodeId,
                            originalSelector: opts.selector,
                            newSelector: diagnosis.correctedSelector,
                            source: diagnosis.source,
                            reasoning: diagnosis.reasoning,
                            isBreakingChange: !!diagnosis.isBreakingChange,
                        });

                        const retryResult = await actionLogic(
                            currentPage,
                            { ...opts, selector: diagnosis.correctedSelector },
                            targetBrowserId,
                            context,
                        );
                        const totalDuration = Date.now() - healingStart;

                        if (retryResult.success !== false) {
                            try {
                                if (opts.flowId && opts.nodeId) {
                                    const flow = await Flow.findByPk(opts.flowId);
                                    if (flow && flow.data?.nodes) {
                                        const updatedNodes = flow.data.nodes.map((n) => {
                                            if ((n.id || n.nodeId) === opts.nodeId) {
                                                const updated = {
                                                    ...n,
                                                    data: {
                                                        ...(n.data || {}),
                                                        configuration: {
                                                            ...(n.data?.configuration || {}),
                                                            selector: diagnosis.correctedSelector,
                                                            healed: true,
                                                            healedFrom: diagnosis.source,
                                                            originalValue: opts.selector,
                                                            healedValue:
                                                                diagnosis.correctedSelector,
                                                            aiReasoning: diagnosis.reasoning,
                                                            healingConfidence: diagnosis.confidence,
                                                        },
                                                    },
                                                };
                                                return updated;
                                            }
                                            return n;
                                        });
                                        await flow.update({
                                            data: { ...flow.data, nodes: updatedNodes },
                                        });
                                        console.log(
                                            `[Self-Healing] Flow document updated for flow: ${opts.flowId}`,
                                        );
                                    }
                                }
                            } catch (flowErr) {
                                console.error(
                                    '[Self-Healing] Flow persistence failed:',
                                    flowErr.message,
                                );
                            }
                        }

                        emitLog({
                            message: `[Self-Healing] Repair successful! Total time: ${totalDuration}ms`,
                            nodeId: opts.nodeId,
                            type: 'success',
                        });

                        if (diagnosis.isBreakingChange) {
                            emitLog({
                                message: `[Self-Healing] Breaking change detected: selector type/locator strategy changed. Review flow after execution.`,
                                nodeId: opts.nodeId,
                                type: 'warning',
                            });
                        }

                        if (runId && opts.nodeId) {
                            try {
                                await executionLogger.logStep(
                                    runId,
                                    { id: opts.nodeId, type: actionName },
                                    {
                                        status: 'healed',
                                        duration: totalDuration,
                                        input: { ...opts, selector: diagnosis.correctedSelector },
                                        output: {
                                            ...(typeof retryResult.data === 'object'
                                                ? retryResult.data
                                                : { value: retryResult.data }),
                                            securityAlerts:
                                                currentPage && currentPage._securityAlerts
                                                    ? currentPage._securityAlerts.filter(
                                                          (a) => a.nodeId === opts.nodeId,
                                                      )
                                                    : [],
                                        },
                                        memoryHit: diagnosis.source === 'memory',
                                        aiDiagnosis: diagnosis.reasoning,
                                    },
                                );
                            } catch (logErr) {
                                console.error(
                                    '[ActionExecutor] Failed to log healed step:',
                                    logErr.message,
                                );
                            }
                        }

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
                                    '[ActionExecutor] Failed to write healed audit log:',
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
                            message: `[Self-Healing] Repair failed: ${diagnosis?.reasoning || 'No solution found.'}`,
                            nodeId: opts.nodeId,
                            type: 'error',
                        });
                    }
                } catch (err) {
                    emitLog({
                        message: `[Self-Healing] Critical error in repair: ${err.message}`,
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
                    message: `[Self-Healing] Repair aborted (Hard cap of ${HEALING_HARD_CAP_MS / 1000}s exceeded).`,
                    nodeId: opts.nodeId,
                    type: 'error',
                });
            } else if (res.headersSent) {
                return;
            }
        }

        if (page && !page.isClosed()) {
            await page
                .evaluate((lbl) => {
                    /* eslint-disable no-undef */
                    if (typeof window.__hal_update_step === 'function') {
                        window.__hal_update_step(lbl, 'failed');
                        setTimeout(() => window.__hal_update_step(null), 2000);
                    }
                }, label)
                .catch(() => {});
        }

        if (runId && nodeId) {
            try {
                await executionLogger.logStep(
                    runId,
                    { id: nodeId, type: actionName },
                    {
                        status: 'failed',
                        duration,
                        input: opts,
                        error: errorMessage,
                        output: {
                            securityAlerts:
                                page && page._securityAlerts
                                    ? page._securityAlerts.filter((a) => a.nodeId === nodeId)
                                    : [],
                        },
                        videoTimestamp: req.body.runStartTime
                            ? (Date.now() - req.body.runStartTime) / 1000
                            : null,
                    },
                );
            } catch (logErr) {
                console.error('[ActionExecutor] Failed to log failure step:', logErr.message);
            }
        }

        if (
            targetBrowserId &&
            (errorMessage.includes('disconnected') ||
                errorMessage.includes('closed') ||
                errorMessage.includes('desconectado') ||
                errorMessage.includes('cerrado'))
        ) {
            browserService.delete(targetBrowserId);
        }

        traceService.add({
            action: actionName,
            browserId: targetBrowserId || opts.browserId,
            status: 'error',
            error: errorMessage,
            selector: opts.selector,
        });

        let errorScreenshotPath = null;
        if (page && !page.isClosed() && opts.takeScreenshot !== false) {
            try {
                const runFolder = runId || 'orphan';
                const screenshotsDir = path.join(STORAGE_RUNS_DIR, runFolder);
                await fsp.mkdir(screenshotsDir, { recursive: true });
                const filename = `${nodeId}.png`;
                const fullPath = path.join(screenshotsDir, filename);
                await page.screenshot({ path: fullPath });
                errorScreenshotPath = `storage/runs/${runFolder}/${filename}`;
                console.log(`[ActionExecutor] Forensic screenshot saved: ${errorScreenshotPath}`);
            } catch (err) {
                console.warn(
                    '[WARN] ActionExecutor: Failed to capture failure screenshot',
                    err.message,
                );
            }
        }

        if (opts.continueOnError) {
            console.log(
                `[ActionExecutor] Soft Fail enabled for ${actionName}. Carrying result to next node...`,
            );

            smartEmitLog(
                `[NodeError] NodeId=${nodeId} Type=${actionName} Error="${errorMessage}"`,
                'warning',
                nodeId,
            );
            if (nodeId) {
                emitExecutionStatus({
                    stepId: nodeId,
                    status: 'softfailed',
                    error: errorMessage,
                });
            }

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
            message: errorMessage || `Internal error (${actionName})`,
            error: errorMessage,
            selector: opts.selector,
        });
    }
}

export { executePlaywrightAction, smartEmitLog };
