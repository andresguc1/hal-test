// routes/api.router.js
// ==========================================================
// 🚀 Optimized router with declarative configuration
// ==========================================================

import { Router } from 'express';
import validate from '../middlewares/validator.js';

// Unified schema import
import * as schemas from '../schemas/index.js';

// Unified controller import
import * as actions from '../controllers/action.controller.js';
import importRouter from './import.router.js';
import exportRouter from './export.router.js';
import runRouter from './run.router.js';

import {
    startInspectorAction,
    stopInspectorAction,
    launchRemoteAction,
    getActiveSessionsAction,
} from '../controllers/inspector.controller.js';

const router = Router();

// ---- INSPECTOR & DEV TOOLS API ----
router.post('/inspector/start', startInspectorAction);
router.post('/inspector/stop', stopInspectorAction);
router.post('/inspector/launch-remote', launchRemoteAction);
router.get('/inspector/sessions', getActiveSessionsAction);
router.get('/variables', actions.getVariables);
router.post('/variables', actions.updateVariablesAction);
router.delete('/variables', actions.deleteVariableAction);
router.post('/inspector/reset', actions.resetEnvironment);
console.log('✅ Inspector routes registered: /start, /stop, /reset');

router.use('/runs', runRouter);

// ==========================================================
// DECLARATIVE ROUTE CONFIGURATION (auto-generated from compact registry)
// ==========================================================

// Compact registry: nodeType → { schema, category }
// Action names follow the convention: `${nodeType}Action` (camelCase)
// Route aliases map alternative paths to an existing nodeType
const ROUTE_REGISTRY = {
    // Browser
    launch_browser: { schema: 'launchBrowserBodySchema', category: 'browser' },
    close_browser: { schema: 'closeBrowserBodySchema', category: 'browser' },
    manage_tabs: { schema: 'manageTabsBodySchema', category: 'tabs' },
    resize_viewport: { schema: 'resizeViewportBodySchema', category: 'viewport' },
    // Navigation
    open_url: { schema: 'openUrlBodySchema', category: 'navigation' },
    go_back: { schema: 'backForwardBodySchema', category: 'navigation' },
    go_forward: { schema: 'backForwardBodySchema', category: 'navigation' },
    reload_page: { schema: 'backForwardBodySchema', category: 'navigation' },
    // Interaction
    click: { schema: 'clickBodySchema', category: 'interaction' },
    type_text: { schema: 'typeTextBodySchema', category: 'interaction' },
    fill_form: { schema: 'fillFormBodySchema', category: 'interaction' },
    select_option: { schema: 'selectOptionBodySchema', category: 'interaction' },
    scroll: { schema: 'scrollBodySchema', category: 'interaction' },
    hover: { schema: 'hoverBodySchema', category: 'interaction' },
    drag_drop: { schema: 'dragDropBodySchema', category: 'interaction' },
    upload_file: { schema: 'uploadFileBodySchema', category: 'interaction' },
    find_element: { schema: 'findElementBodySchema', category: 'element' },
    get_set_content: { schema: 'getSetContentBodySchema', category: 'element' },
    interaction: { schema: 'interactionBodySchema', category: 'interaction' },
    execute_js: { schema: 'executeJsBodySchema', category: 'scripting' },
    // Wait
    wait_for_element: { schema: 'waitForElementBodySchema', category: 'wait' },
    wait_visible: { schema: 'waitVisibleBodySchema', category: 'wait' },
    wait_navigation: { schema: 'waitNavigationBodySchema', category: 'wait' },
    wait_network: { schema: 'waitNetworkBodySchema', category: 'wait' },
    wait_conditional: { schema: 'waitConditionalBodySchema', category: 'wait' },
    pause: { schema: 'pauseBodySchema', category: 'wait' },
    wait_for_response: { schema: 'waitForResponseBodySchema', category: 'wait' },
    wait_for_request: { schema: 'waitForRequestBodySchema', category: 'wait' },
    // Capture
    take_screenshot: { schema: 'takeScreenshotBodySchema', category: 'capture' },
    save_dom: { schema: 'saveDomBodySchema', category: 'capture' },
    log_errors: { schema: 'logErrorsBodySchema', category: 'monitoring' },
    listen_events: { schema: 'listenEventsBodySchema', category: 'monitoring' },
    // Network
    intercept_request: { schema: 'interceptRequestBodySchema', category: 'network' },
    mock_response: { schema: 'mockResponseBodySchema', category: 'network' },
    block_resource: { schema: 'blockResourceBodySchema', category: 'network' },
    modify_headers: { schema: 'modifyHeadersBodySchema', category: 'network' },
    set_network_conditions: { schema: 'setNetworkConditionsBodySchema', category: 'network' },
    clear_all_mocks: { schema: 'clearAllMocksBodySchema', category: 'network' },
    configure_route: { schema: 'configureRouteBodySchema', category: 'network' },
    wait_network_match: { schema: 'waitNetworkMatchBodySchema', category: 'network' },
    manage_cookies: { schema: 'manageCookiesBodySchema', category: 'network' },
    // Session
    persist_session: { schema: 'persistSessionBodySchema', category: 'session' },
    manage_session: { schema: 'manageSessionBodySchema', category: 'session' },
    create_context: { schema: 'createContextBodySchema', category: 'context' },
    cleanup_state: { schema: 'cleanupStateBodySchema', category: 'context' },
    close_context: { schema: 'closeContextBodySchema', category: 'context' },
    // Data
    read_file: { schema: 'readDataBodySchema', category: 'data' },
    write_file: { schema: 'saveResultsBodySchema', category: 'data' },
    download_file: { schema: 'handleDownloadsBodySchema', category: 'data' },
    read_data: { schema: 'readDataBodySchema', category: 'data' },
    save_results: { schema: 'saveResultsBodySchema', category: 'data' },
    handle_downloads: { schema: 'handleDownloadsBodySchema', category: 'data' },
    // Testing
    run_tests: { schema: 'runTestsBodySchema', category: 'testing' },
    cli_params: { schema: 'cliParamsBodySchema', category: 'cli' },
    return_code: { schema: 'returnCodeBodySchema', category: 'cli' },
    integrate_ci: { schema: 'integrateCIBodySchema', category: 'ci' },
    // Flow Control
    variable: { schema: 'variableBodySchema', category: 'flow_control' },
    conditional: { schema: 'conditionalBodySchema', category: 'logic' },
    switch: { schema: 'switchBodySchema', category: 'logic' },
    loop: { schema: 'loopBodySchema', category: 'flow_control' },
    branch: { schema: 'branchBodySchema', category: 'flow_control' },
    flow_control: { schema: 'flowControlBodySchema', category: 'flow_control' },
    transform: { schema: 'transformBodySchema', category: 'flow_control' },
    backend_js: { schema: 'backendJsBodySchema', category: 'flow_control' },
    fail_flow: { schema: 'failFlowBodySchema', category: 'flow_control' },
    handle_hooks: { schema: 'handleHooksBodySchema', category: 'flow' },
    control_exceptions: { schema: 'controlExceptionsBodySchema', category: 'flow' },
    component: { schema: 'componentBodySchema', category: 'flow_control' },
    input: { schema: 'inputBodySchema', category: 'flow_control' },
    output: { schema: 'outputBodySchema', category: 'flow_control' },
    // AI
    call_llm: { schema: 'callLlmBodySchema', category: 'llm_ai' },
    generate_data: { schema: 'generateDataBodySchema', category: 'llm_ai' },
    validate_semantic: { schema: 'validateSemanticBodySchema', category: 'llm_ai' },
    extract_dom_context: { schema: 'extractDomContextBodySchema', category: 'llm_ai' },
    chain_of_thought: { schema: 'chainOfThoughtBodySchema', category: 'llm_ai' },
    smart_selector: { schema: 'smartSelectorBodySchema', category: 'llm_ai' },
    // Security
    csp_validator: { schema: 'cspValidatorBodySchema', category: 'security' },
    header_auditor: { schema: 'headerAuditorBodySchema', category: 'security' },
    dom_sanitizer: { schema: 'domSanitizerBodySchema', category: 'security' },
    audit_policy: { schema: 'auditPolicyBodySchema', category: 'security' },
    sensitive_data_monitor: { schema: 'sensitiveDataMonitorBodySchema', category: 'security' },
    assert_page_text: { schema: 'assertPageTextBodySchema', category: 'element' },
};
// Route aliases: alternative paths → existing nodeType
const ROUTE_ALIASES = {
    back: 'go_back',
    forward: 'go_forward',
};

// Explicit action name overrides where the barrel export name
// doesn't follow the `${snake_type}Action` → `${camelType}Action` convention
const ACTION_NAME_OVERRIDES = {
    go_back: 'backAction',
    go_forward: 'forwardAction',
    reload_page: 'reloadAction',
    read_file: 'readDataAction',
    write_file: 'saveResultsAction',
    download_file: 'handleDownloadsAction',
    read_data: 'readDataAction',
    save_results: 'saveResultsAction',
    handle_downloads: 'handleDownloadsAction',
};

// Convert snake_type to camelCase Action name (e.g. 'launch_browser' → 'launchBrowserAction')
const toActionName = (type) =>
    ACTION_NAME_OVERRIDES[type] || type.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) + 'Action';

// Auto-generate actionRoutes from the registry
export const actionRoutes = Object.entries(ROUTE_REGISTRY).flatMap(
    ([nodeType, { schema, category }]) => [
        { path: nodeType, schema, action: toActionName(nodeType), category },
    ],
);

// Append aliases
for (const [aliasPath, targetType] of Object.entries(ROUTE_ALIASES)) {
    const target = ROUTE_REGISTRY[targetType];
    if (target) {
        actionRoutes.push({
            path: aliasPath,
            schema: target.schema,
            action: toActionName(targetType),
            category: target.category,
        });
    }
}

// ==========================================================
// DYNAMIC ROUTE GENERATION
// ==========================================================

// Validate that all schemas and actions exist
const validationErrors = [];

actionRoutes.forEach(({ path, schema, action }) => {
    if (!schemas[schema]) {
        validationErrors.push(`⚠️ Schema not found: ${schema} para ruta ${path}`);
    }
    if (!actions[action]) {
        validationErrors.push(`⚠️ Action not found: ${action} para ruta ${path}`);
    }
});

if (validationErrors.length > 0) {
    console.error('='.repeat(60));
    console.error('❌ ROUTER CONFIGURATION ERRORS:');
    validationErrors.forEach((err) => console.error(err));
    console.error('='.repeat(60));
    throw new Error('Router configuration error. Check console for details.');
}

// Middleware wrapper: auto-emits execution-status socket events for ALL actions
const withSocketStatus = (handler) => async (req, res) => {
    const nodeId = req.body?.nodeId || req.body?.stepId;
    try {
        // Emit "running" state (only if handler doesn't manage its own socket events)
        if (nodeId && !req._socketStatusHandled) {
            const { emitExecutionStatus } = await import('../socket.js');
            emitExecutionStatus({ stepId: nodeId, status: 'running' });
        }

        // 🆕 AUTO-SEED: If the request includes variables, seed them into the VariableManager
        // This ensures that placeholders like {{user}} are resolved in the current action
        const { nodeId: bodyNodeId, runId, variables } = req.body;
        console.log(
            `[API Router] Execution Interceptor: Node=${bodyNodeId || 'unknown'}, RunId=${runId || 'none'}`,
        );

        // 🟢 SEED VARIABLE CONTEXT
        // Required for atomic runs (Run Node) to resolve {{PreviousNode.result}}
        if (variables && typeof variables === 'object') {
            try {
                const { variableManager } = await import('../services/VariableManager.js');
                // We use the provided runId OR fallback to 'atomic_run' for shared context
                const effectiveRunId = runId || 'atomic_run';
                const varKeys = Object.keys(variables);

                console.log(
                    `[API Router] Seeding ${varKeys.length} variables. EffectiveRunId: ${effectiveRunId}`,
                );

                // Seed both the specific runId (if provided) and the atomic_run shared scope
                variableManager.initRun(effectiveRunId, variables);
                if (effectiveRunId !== 'atomic_run') {
                    variableManager.initRun('atomic_run', variables);
                }

                // Ensure the body has the same runId so controller uses the correct scope
                req.body.runId = effectiveRunId;
            } catch (err) {
                console.warn('[API Router] Failed to seed variable context:', err.message);
            }
        }

        // Intercept res.json to detect success/error from the response and enforce standard schema
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // 🆕 STANDARD RESPONSE DECORATOR
            // Enforce a consistent contract for all nodes so Conditional nodes can rely on them
            const standardBody = {
                success: body?.success !== undefined ? !!body.success : true,
                status: body?.status || (body?.success === false ? 'error' : 'success'),
                message:
                    body?.message ||
                    (body?.success === false ? 'Action failed' : 'Action completed'),
                timestamp: new Date().toISOString(),
                nodeId: nodeId || body?.nodeId || null,
                ...body, // Keep original data at root for backward compatibility
            };

            // Only emit if handler didn't already handle socket events itself
            if (nodeId && !req._socketStatusHandled) {
                import('../socket.js')
                    .then(({ emitExecutionStatus }) => {
                        const status = standardBody.status;
                        const error =
                            standardBody.success === false
                                ? standardBody.message || 'Unknown error'
                                : null;
                        emitExecutionStatus({
                            stepId: nodeId,
                            status,
                            error,
                            result: standardBody,
                        });
                    })
                    .catch(() => {
                        /* socket not ready */
                    });
            }

            // 💾 ATOMIC RUN MEMORY PERSISTENCE:
            // Use storeNodeResult for clean, deterministic atomic run storage
            if (standardBody.success !== false) {
                const rID = req.body.runId || 'atomic_run';
                // Use a non-blocking background promise to avoid slowing down API response
                import('../services/VariableManager.js')
                    .then(({ variableManager }) => {
                        const label =
                            req.body.customLabel ||
                            req.body.label ||
                            req.body.configuration?.customLabel ||
                            req.body.configuration?.label;
                        const type =
                            req.body.type || req.url.split('/').pop().replace('_action', ''); // Fallback type extraction

                        if (nodeId) {
                            variableManager.storeNodeResult(
                                nodeId,
                                { label, customLabel: label, technicalName: type },
                                standardBody,
                                rID,
                            );
                        } else if (label) {
                            variableManager.set(`${label}.result`, standardBody, rID);
                        }

                        console.log(
                            `[API Router] 💾 Auto-Saved Normalized Atomic Result for: ${type || label || nodeId} in runId: ${rID}`,
                        );
                    })
                    .catch((err) =>
                        console.error('[API Router] Failed atomic variable save:', err.message),
                    );
            }

            return originalJson(standardBody);
        };

        return await handler(req, res);
    } catch (error) {
        if (nodeId && !req._socketStatusHandled) {
            try {
                const { emitExecutionStatus } = await import('../socket.js');
                emitExecutionStatus({ stepId: nodeId, status: 'error', error: error.message });
            } catch (_) {
                /* socket not ready */
            }
        }
        throw error;
    }
};

// Create routes dynamically
actionRoutes.forEach(({ path, schema, action }) => {
    const schemaObject = schemas[schema];
    const actionHandler = actions[action];

    router.post(
        `/actions/${path}`,
        validate({ body: schemaObject }),
        withSocketStatus(actionHandler),
    );
});

console.log(`✅ ${actionRoutes.length} action routes registered successfully`);

// ==========================================================
// ADDITIONAL ROUTES
// ==========================================================

// Health Check
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        service: 'HaltTest Backend API',
        uptime: process.uptime(),
        routes: actionRoutes.length,
        timestamp: new Date().toISOString(),
    });
});

// Route documentation (useful for debugging)
router.get('/routes', (req, res) => {
    const routesByCategory = actionRoutes.reduce((acc, route) => {
        if (!acc[route.category]) {
            acc[route.category] = [];
        }
        acc[route.category].push({
            path: route.path,
            endpoint: `/actions/${route.path}`,
            method: 'POST',
        });
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        totalRoutes: actionRoutes.length,
        categories: Object.keys(routesByCategory).sort(),
        routes: routesByCategory,
    });
});

// Register import router
router.use('/import', importRouter);

// Register export router
router.use('/export', exportRouter);

// Register AI router
// Register AI router (Conflict removed: handled in app.js)
// router.use('/ai', aiRouter);

// ==========================================================
// AUDIT & FINE-TUNING ROUTES
// ==========================================================
import { getAuditLogs, clearAuditLogs, startFineTuning } from '../controllers/audit.controller.js';
import selectorPreValidator from '../services/SelectorPreValidator.js';
import flowMetricsDashboardService from '../services/FlowMetricsDashboardService.js';
import accessibilityTreePlanner from '../services/agents/AccessibilityTreePlanner.js';

router.get('/audit/logs', getAuditLogs);
router.delete('/audit/logs', clearAuditLogs);
router.post('/audit/train', startFineTuning);

// Real-time pre-execution selector validation
router.post('/selectors/validate', async (req, res) => {
    try {
        const { selector } = req.body || {};
        const result = await selectorPreValidator.validateSelector(selector);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Quality & Cobertura Metrics Dashboard
router.get('/metrics/dashboard', (req, res) => {
    try {
        const metrics = flowMetricsDashboardService.generateDashboardMetrics({
            flows: [
                { id: 'f1', nodes: [1, 2, 3] },
                { id: 'f2', nodes: [1, 2] },
            ],
            runs: [
                { id: 'r1', status: 'completed', duration_ms: 1200 },
                { id: 'r2', status: 'completed', duration_ms: 1500 },
            ],
            healingLogs: [{ healed: true }, { healed: true }],
        });
        return res.status(200).json({ success: true, data: metrics });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Accessibility Tree Critical Path Planner
router.post('/planner/generate', (req, res) => {
    try {
        const { url, goal, accessibilitySnapshot } = req.body || {};
        const interactiveNodes =
            accessibilityTreePlanner.parseAccessibilityTree(accessibilitySnapshot);
        const criticalPath = accessibilityTreePlanner.analyzeCriticalPaths(interactiveNodes, goal);
        const flowNodes = accessibilityTreePlanner.generateFlowNodes(url, criticalPath);

        return res.status(200).json({
            success: true,
            data: {
                goal,
                interactiveCount: interactiveNodes.length,
                criticalPath,
                nodes: flowNodes,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
