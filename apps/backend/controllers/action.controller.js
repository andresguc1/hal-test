// controllers/action.controller.js - BARREL FILE
// ==========================================================
// 🧠 Re-exports all action handlers from plugin modules
// ==========================================================

import { variableManager } from '../services/VariableManager.js';
import aiService from '../services/AIService.js';
import { browserService } from '../services/browser.service.js';
import { emitExecutionStatus, emitVariableChange } from '../socket.js';

// ──── Utility Endpoints (not yet pluginized) ────

export const getVariables = (req, res) => {
    try {
        const runId = req.query.runId || req.body?.runId;
        let flowVariables = {};
        if (runId) {
            flowVariables = variableManager.getAll(runId);
        } else {
            const activeRunId = variableManager.getActiveRunId?.();
            if (activeRunId) {
                flowVariables = variableManager.getAll(activeRunId);
            } else {
                flowVariables = variableManager.getAll(null);
            }
        }
        const globalVariables = variableManager.getAll('global');
        res.json({
            success: true,
            data: { flow: flowVariables, global: globalVariables },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error retrieving variables: ${error.message}`,
        });
    }
};

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

export const validateAICredentials = async (req, res) => {
    try {
        const { provider, model, apiKey, baseUrl } = req.body;
        if (!provider) {
            return res.status(400).json({ success: false, message: 'Missing provider' });
        }
        await aiService.validateKey({ provider, apiKey, baseUrl, model });
        res.json({ success: true, message: 'Connection successful' });
    } catch (error) {
        console.error('[AI Validation Error]', error.message);
        res.status(200).json({
            success: false,
            message: 'Validation failed: ' + (error.message || 'Unknown error'),
        });
    }
};

import { smartEmitLog } from '../core/ActionExecutor.js';

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
        return res.json({ success: true, data: { audit, issues, healthy: success }, message });
    } catch (error) {
        console.error('[SecurityAudit Error]', error.message);
        if (nodeId) {
            emitExecutionStatus({ stepId: nodeId, status: 'failed' });
            smartEmitLog(`Audit failed: ${error.message}`, 'error', nodeId);
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

import { executePlaywrightAction } from '../core/ActionExecutor.js';

export const executeJsAction = (req, res) =>
    executePlaywrightAction(req, res, 'execute_js', async (page, opts) => {
        const { script, args, returnValue, variableName } = opts;
        let parsedArgs = args;
        if (typeof args === 'string' && args.trim() !== '') {
            try {
                parsedArgs = JSON.parse(args);
            } catch (e) {
                throw new Error(req.t('errors.parse_args_error', { error: e.message }));
            }
        }
        let result;
        try {
            result = await page.evaluate(script, parsedArgs);
        } catch (err) {
            throw new Error(req.t('errors.script_execution_error', { error: err.message }));
        }
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

// ──── Browser Plugin ────
export { default as launchBrowserAction } from '../plugins/core-browser/handlers/launch_browser.js';
export { default as closeBrowserAction } from '../plugins/core-browser/handlers/close_browser.js';
export { default as manageTabsAction } from '../plugins/core-browser/handlers/manage_tabs.js';
export { default as resizeViewportAction } from '../plugins/core-browser/handlers/resize_viewport.js';
export { default as browserDialogAction } from '../plugins/core-browser/handlers/browser_dialog.js';

// ──── Navigation Plugin ────
export { default as openUrlAction } from '../plugins/core-navigation/handlers/open_url.js';
export { default as backAction } from '../plugins/core-navigation/handlers/go_back.js';
export { default as forwardAction } from '../plugins/core-navigation/handlers/go_forward.js';
export { default as reloadAction } from '../plugins/core-navigation/handlers/reload_page.js';

// ──── Interaction Plugin ────
export { default as clickAction } from '../plugins/core-interaction/handlers/click.js';
export { default as typeTextAction } from '../plugins/core-interaction/handlers/type_text.js';
export { default as fillFormAction } from '../plugins/core-interaction/handlers/fill_form.js';
export { default as findElementAction } from '../plugins/core-interaction/handlers/find_element.js';
export { default as hoverAction } from '../plugins/core-interaction/handlers/hover.js';
export { default as scrollAction } from '../plugins/core-interaction/handlers/scroll.js';
export { default as selectOptionAction } from '../plugins/core-interaction/handlers/select_option.js';
export { default as dragDropAction } from '../plugins/core-interaction/handlers/drag_drop.js';
export { default as uploadFileAction } from '../plugins/core-interaction/handlers/upload_file.js';
export { default as getSetContentAction } from '../plugins/core-interaction/handlers/get_set_content.js';

// ──── Wait Plugin ────
export { default as waitForElementAction } from '../plugins/core-wait/handlers/wait_for_element.js';
export { default as waitVisibleAction } from '../plugins/core-wait/handlers/wait_visible.js';
export { default as waitNavigationAction } from '../plugins/core-wait/handlers/wait_navigation.js';
export { default as waitNetworkAction } from '../plugins/core-wait/handlers/wait_network.js';
export { default as waitForResponseAction } from '../plugins/core-wait/handlers/wait_for_response.js';
export { default as waitForRequestAction } from '../plugins/core-wait/handlers/wait_for_request.js';
export { default as waitConditionalAction } from '../plugins/core-wait/handlers/wait_conditional.js';
export { default as pauseAction } from '../plugins/core-wait/handlers/pause.js';

// ──── Capture Plugin ────
export { default as takeScreenshotAction } from '../plugins/core-capture/handlers/take_screenshot.js';
export { default as saveDomAction } from '../plugins/core-capture/handlers/save_dom.js';
export { default as logErrorsAction } from '../plugins/core-capture/handlers/log_errors.js';
export { default as listenEventsAction } from '../plugins/core-capture/handlers/listen_events.js';

// ──── Network Plugin ────
export { default as interceptRequestAction } from '../plugins/core-network/handlers/intercept_request.handler.js';
export { default as mockResponseAction } from '../plugins/core-network/handlers/mock_response.handler.js';
export { default as blockResourceAction } from '../plugins/core-network/handlers/block_resource.handler.js';
export { default as modifyHeadersAction } from '../plugins/core-network/handlers/modify_headers.handler.js';
export { default as setNetworkConditionsAction } from '../plugins/core-network/handlers/set_network_conditions.handler.js';
export { default as clearAllMocksAction } from '../plugins/core-network/handlers/clear_all_mocks.handler.js';
export { default as configureRouteAction } from '../plugins/core-network/handlers/configure_route.handler.js';
export { default as waitNetworkMatchAction } from '../plugins/core-network/handlers/wait_network_match.handler.js';
export { default as manageCookiesAction } from '../plugins/core-network/handlers/manage_cookies.handler.js';

// ──── Session Plugin ────
export { default as persistSessionAction } from '../plugins/core-session/handlers/persist_session.js';
export { default as manageSessionAction } from '../plugins/core-session/handlers/manage_session.js';
export { default as manageStorageAction } from '../plugins/core-session/handlers/manage_storage.js';
export { default as injectTokensAction } from '../plugins/core-session/handlers/inject_tokens.js';
export { default as createContextAction } from '../plugins/core-session/handlers/create_context.js';
export { default as cleanupStateAction } from '../plugins/core-session/handlers/cleanup_state.js';
export { default as closeContextAction } from '../plugins/core-session/handlers/close_context.js';

// ──── Data Plugin ────
export { default as readDataAction } from '../plugins/core-data/handlers/read_data.js';
export { default as saveResultsAction } from '../plugins/core-data/handlers/save_results.js';
export { default as handleDownloadsAction } from '../plugins/core-data/handlers/handle_downloads.js';

// ──── Testing Plugin ────
export { default as runTestsAction } from '../plugins/core-testing/handlers/run_tests.js';
export { default as cliParamsAction } from '../plugins/core-testing/handlers/cli_params.js';
export { default as returnCodeAction } from '../plugins/core-testing/handlers/return_code.js';
export { default as integrateCiAction } from '../plugins/core-testing/handlers/integrate_ci.js';

// ──── Flow Control Plugin ────
export { default as variableAction } from '../plugins/core-flow-control/handlers/variable.js';
export { default as conditionalAction } from '../plugins/core-flow-control/handlers/conditional.js';
export { default as switchAction } from '../plugins/core-flow-control/handlers/switch.js';
export { default as loopAction } from '../plugins/core-flow-control/handlers/loop.js';
export { default as branchAction } from '../plugins/core-flow-control/handlers/branch.js';
export { default as flowControlAction } from '../plugins/core-flow-control/handlers/flow-control.js';
export { default as transformAction } from '../plugins/core-flow-control/handlers/transform.js';
export { default as backendJsAction } from '../plugins/core-flow-control/handlers/backend-js.js';
export { default as failFlowAction } from '../plugins/core-flow-control/handlers/fail-flow.js';
export { default as handleHooksAction } from '../plugins/core-flow-control/handlers/handle-hooks.js';
export { default as controlExceptionsAction } from '../plugins/core-flow-control/handlers/control-exceptions.js';
export { default as componentAction } from '../plugins/core-flow-control/handlers/component.js';
export { default as inputAction } from '../plugins/core-flow-control/handlers/input.js';
export { default as outputAction } from '../plugins/core-flow-control/handlers/output.js';

// ──── AI Plugin ────
export { default as callLlmAction } from '../plugins/core-ai/handlers/call_llm.js';
export { default as generateDataAction } from '../plugins/core-ai/handlers/generate_data.js';
export { default as validateSemanticAction } from '../plugins/core-ai/handlers/validate_semantic.js';
export { default as extractDomContextAction } from '../plugins/core-ai/handlers/extract_dom_context.js';
export { default as chainOfThoughtAction } from '../plugins/core-ai/handlers/chain_of_thought.js';
export { default as smartSelectorAction } from '../plugins/core-ai/handlers/smart_selector.js';

// ──── Security Plugin ────
export { default as cspValidatorAction } from '../plugins/core-security/handlers/csp_validator.js';
export { default as headerAuditorAction } from '../plugins/core-security/handlers/header_auditor.js';
export { default as domSanitizerAction } from '../plugins/core-security/handlers/dom_sanitizer.js';
export { default as auditPolicyAction } from '../plugins/core-security/handlers/audit_policy.js';
export { default as sensitiveDataMonitorAction } from '../plugins/core-security/handlers/sensitive_data_monitor.js';

// ──── Assertion Plugin ────
export { default as assertPageTextAction } from '../plugins/core-assertion/handlers/assert_page_text.handler.js';

// ──── Interaction dispatcher (legacy) ────
import _clickAction from '../plugins/core-interaction/handlers/click.js';
import _typeTextAction from '../plugins/core-interaction/handlers/type_text.js';
import _selectOptionAction from '../plugins/core-interaction/handlers/select_option.js';
import _waitVisibleAction from '../plugins/core-wait/handlers/wait_visible.js';
import _waitForElementAction from '../plugins/core-wait/handlers/wait_for_element.js';
import _takeScreenshotAction from '../plugins/core-capture/handlers/take_screenshot.js';
import _openUrlAction from '../plugins/core-navigation/handlers/open_url.js';
import _launchBrowserAction from '../plugins/core-browser/handlers/launch_browser.js';
import _closeBrowserAction from '../plugins/core-browser/handlers/close_browser.js';
import _setNetworkConditionsAction from '../plugins/core-network/handlers/set_network_conditions.handler.js';
import _clearAllMocksAction from '../plugins/core-network/handlers/clear_all_mocks.handler.js';
import _waitNetworkAction from '../plugins/core-wait/handlers/wait_network.js';
import _listenEventsAction from '../plugins/core-capture/handlers/listen_events.js';
import _scrollAction from '../plugins/core-interaction/handlers/scroll.js';
import _hoverAction from '../plugins/core-interaction/handlers/hover.js';
import _uploadFileAction from '../plugins/core-interaction/handlers/upload_file.js';
import _manageCookiesAction from '../plugins/core-network/handlers/manage_cookies.handler.js';
import _manageStorageAction from '../plugins/core-session/handlers/manage_storage.js';
import _dragDropAction from '../plugins/core-interaction/handlers/drag_drop.js';
import _reloadAction from '../plugins/core-navigation/handlers/reload_page.js';
import _cliParamsAction from '../plugins/core-testing/handlers/cli_params.js';
import _returnCodeAction from '../plugins/core-testing/handlers/return_code.js';
import _runTestsAction from '../plugins/core-testing/handlers/run_tests.js';
import _integrateCiAction from '../plugins/core-testing/handlers/integrate_ci.js';
import _switchAction from '../plugins/core-flow-control/handlers/switch.js';
import _configureRouteAction from '../plugins/core-network/handlers/configure_route.handler.js';
import _waitNetworkMatchAction from '../plugins/core-network/handlers/wait_network_match.handler.js';

export async function interactionAction(req, res) {
    let { action } = req.body;
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
            action = 'close_browser';
        }
        if (action) {
            console.log(`[INFO] Inferred action: ${action} from body keys: ${Object.keys(body)}`);
        }
    }
    console.log(`[INFO] Dispatching interaction action: ${action}`);

    const actionMap = {
        configure_route: _configureRouteAction,
        wait_network_match: _waitNetworkMatchAction,
        click: _clickAction,
        type_text: _typeTextAction,
        type: _typeTextAction,
        select_option: _selectOptionAction,
        wait_visible: _waitVisibleAction,
        wait_for_element: _waitForElementAction,
        take_screenshot: _takeScreenshotAction,
        execute_js: executeJsAction,
        navigate: _openUrlAction,
        open_url: _openUrlAction,
        launch_browser: _launchBrowserAction,
        close_browser: _closeBrowserAction,
        set_network_conditions: _setNetworkConditionsAction,
        clear_all_mocks: _clearAllMocksAction,
        wait_network: _waitNetworkAction,
        listen_events: _listenEventsAction,
        scroll: _scrollAction,
        hover: _hoverAction,
        upload_file: _uploadFileAction,
        manage_cookies: _manageCookiesAction,
        manage_storage: _manageStorageAction,
        drag_drop: _dragDropAction,
        reload_page: _reloadAction,
        cli_params: _cliParamsAction,
        return_code: _returnCodeAction,
        run_tests: _runTestsAction,
        integrate_ci: _integrateCiAction,
        switch: _switchAction,
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
