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
// DECLARATIVE ROUTE CONFIGURATION
// ==========================================================

export const actionRoutes = [
    // ========== Navigation and Environment ==========
    {
        path: 'launch_browser',
        schema: 'launchBrowserBodySchema',
        action: 'launchBrowserAction',
        category: 'browser',
    },
    {
        path: 'open_url',
        schema: 'openUrlBodySchema',
        action: 'openUrlAction',
        category: 'navigation',
    },
    {
        path: 'close_browser',
        schema: 'closeBrowserBodySchema',
        action: 'closeBrowserAction',
        category: 'browser',
    },
    {
        // 🆕 Cambiar 'back' a 'go_back'
        path: 'go_back',
        schema: 'backForwardBodySchema',
        action: 'backAction',
        category: 'navigation',
    },
    {
        // 🆕 Cambiar 'forward' a 'go_forward'
        path: 'go_forward',
        schema: 'backForwardBodySchema',
        action: 'forwardAction',
        category: 'navigation',
    },
    {
        // 🔙 Alias de compatibilidad para 'back'
        path: 'back',
        schema: 'backForwardBodySchema',
        action: 'backAction',
        category: 'navigation',
    },
    {
        // ⏩ Alias de compatibilidad para 'forward'
        path: 'forward',
        schema: 'backForwardBodySchema',
        action: 'forwardAction',
        category: 'navigation',
    },
    {
        path: 'manage_tabs',
        schema: 'manageTabsBodySchema',
        action: 'manageTabsAction',
        category: 'tabs',
    },
    {
        path: 'drag_drop',
        schema: 'dragDropBodySchema',
        action: 'dragDropAction',
        category: 'interaction',
    },
    {
        path: 'resize_viewport',
        schema: 'resizeViewportBodySchema',
        action: 'resizeViewportAction',
        category: 'viewport',
    },
    {
        path: 'reload_page',
        schema: 'backForwardBodySchema',
        action: 'reloadAction',
        category: 'navigation',
    },

    // ========== Element Interaction ==========
    {
        path: 'find_element',
        schema: 'findElementBodySchema',
        action: 'findElementAction',
        category: 'element',
    },
    {
        path: 'get_set_content',
        schema: 'getSetContentBodySchema',
        action: 'getSetContentAction',
        category: 'element',
    },
    {
        path: 'interaction',
        schema: 'interactionBodySchema',
        action: 'interactionAction',
        category: 'interaction',
    },
    {
        path: 'click',
        schema: 'clickBodySchema',
        action: 'clickAction',
        category: 'interaction',
    },
    {
        path: 'type_text',
        schema: 'typeTextBodySchema',
        action: 'typeTextAction',
        category: 'interaction',
    },
    {
        path: 'select_option',
        schema: 'selectOptionBodySchema',
        action: 'selectOptionAction',
        category: 'interaction',
    },
    {
        path: 'submit_form',
        schema: 'submitFormBodySchema',
        action: 'submitFormAction',
        category: 'interaction',
    },
    {
        path: 'scroll',
        schema: 'scrollBodySchema',
        action: 'scrollAction',
        category: 'interaction',
    },
    {
        path: 'upload_file',
        schema: 'uploadFileBodySchema',
        action: 'uploadFileAction',
        category: 'interaction',
    },
    {
        path: 'hover',
        schema: 'hoverBodySchema',
        action: 'hoverAction',
        category: 'interaction',
    },
    {
        path: 'execute_js',
        schema: 'executeJsBodySchema',
        action: 'executeJsAction',
        category: 'scripting',
    },

    // ========== Wait Operations ==========
    {
        path: 'wait_for_element',
        schema: 'waitForElementBodySchema',
        action: 'waitForElementAction',
        category: 'wait',
    },
    {
        path: 'wait_visible',
        schema: 'waitVisibleBodySchema',
        action: 'waitVisibleAction',
        category: 'wait',
    },
    {
        path: 'wait_navigation',
        schema: 'waitNavigationBodySchema',
        action: 'waitNavigationAction',
        category: 'wait',
    },
    {
        path: 'wait_network',
        schema: 'waitNetworkBodySchema',
        action: 'waitNetworkAction',
        category: 'wait',
    },
    {
        path: 'wait_conditional',
        schema: 'waitConditionalBodySchema',
        action: 'waitConditionalAction',
        category: 'wait',
    },
    {
        path: 'pause',
        schema: 'pauseBodySchema',
        action: 'pauseAction',
        category: 'wait',
    },
    {
        path: 'wait_for_response',
        schema: 'waitForResponseBodySchema',
        action: 'waitForResponseAction',
        category: 'wait',
    },
    {
        path: 'wait_for_request',
        schema: 'waitForRequestBodySchema',
        action: 'waitForRequestAction',
        category: 'wait',
    },

    // ========== Monitoring and Capture ==========
    {
        path: 'take_screenshot',
        schema: 'takeScreenshotBodySchema',
        action: 'takeScreenshotAction',
        category: 'capture',
    },
    {
        path: 'save_dom',
        schema: 'saveDomBodySchema',
        action: 'saveDomAction',
        category: 'capture',
    },
    {
        path: 'log_errors',
        schema: 'logErrorsBodySchema',
        action: 'logErrorsAction',
        category: 'monitoring',
    },
    {
        path: 'listen_events',
        schema: 'listenEventsBodySchema',
        action: 'listenEventsAction',
        category: 'monitoring',
    },

    // ========== Network and Session ==========
    {
        path: 'intercept_request',
        schema: 'interceptRequestBodySchema',
        action: 'interceptRequestAction',
        category: 'network',
    },
    {
        path: 'mock_response',
        schema: 'mockResponseBodySchema',
        action: 'mockResponseAction',
        category: 'network',
    },
    {
        path: 'block_resource',
        schema: 'blockResourceBodySchema',
        action: 'blockResourceAction',
        category: 'network',
    },
    {
        path: 'modify_headers',
        schema: 'modifyHeadersBodySchema',
        action: 'modifyHeadersAction',
        category: 'network',
    },
    {
        path: 'set_network_conditions',
        schema: 'setNetworkConditionsBodySchema',
        action: 'setNetworkConditionsAction',
        category: 'network',
    },
    {
        path: 'clear_all_mocks',
        schema: 'clearAllMocksBodySchema',
        action: 'clearAllMocksAction',
        category: 'network',
    },
    {
        path: 'configure_route',
        schema: 'configureRouteBodySchema',
        action: 'configureRouteAction',
        category: 'network',
    },
    {
        path: 'wait_network_match',
        schema: 'waitNetworkMatchBodySchema',
        action: 'waitNetworkMatchAction',
        category: 'network',
    },
    {
        path: 'persist_session',
        schema: 'persistSessionBodySchema',
        action: 'persistSessionAction',
        category: 'session',
    },
    {
        path: 'manage_session',
        schema: 'manageSessionBodySchema',
        action: 'manageSessionAction',
        category: 'session',
    },
    {
        path: 'manage_cookies',
        schema: 'manageCookiesBodySchema',
        action: 'manageCookiesAction',
        category: 'network',
    },

    // ========== Context and State ==========
    {
        path: 'create_context',
        schema: 'createContextBodySchema',
        action: 'createContextAction',
        category: 'context',
    },
    {
        path: 'cleanup_state',
        schema: 'cleanupStateBodySchema',
        action: 'cleanupStateAction',
        category: 'context',
    },
    {
        path: 'close_context',
        schema: 'closeContextBodySchema',
        action: 'closeContextAction',
        category: 'context',
    },

    // ========== Flow and Data Utilities ==========
    {
        path: 'handle_hooks',
        schema: 'handleHooksBodySchema',
        action: 'handleHooksAction',
        category: 'flow',
    },
    {
        path: 'control_exceptions',
        schema: 'controlExceptionsBodySchema',
        action: 'controlExceptionsAction',
        category: 'flow',
    },
    {
        path: 'read_file',
        schema: 'readDataBodySchema',
        action: 'readDataAction',
        category: 'data',
    },
    {
        path: 'write_file',
        schema: 'saveResultsBodySchema',
        action: 'saveResultsAction',
        category: 'data',
    },
    {
        path: 'download_file',
        schema: 'handleDownloadsBodySchema',
        action: 'handleDownloadsAction',
        category: 'data',
    },
    {
        // 🔙 Alias compatibility
        path: 'read_data',
        schema: 'readDataBodySchema',
        action: 'readDataAction',
        category: 'data',
    },
    {
        // 🔙 Alias compatibility
        path: 'save_results',
        schema: 'saveResultsBodySchema',
        action: 'saveResultsAction',
        category: 'data',
    },
    {
        // 🔙 Alias compatibility
        path: 'handle_downloads',
        schema: 'handleDownloadsBodySchema',
        action: 'handleDownloadsAction',
        category: 'data',
    },

    // ========== Testing and CI/CD ==========
    {
        path: 'run_tests',
        schema: 'runTestsBodySchema',
        action: 'runTestsAction',
        category: 'testing',
    },
    {
        path: 'cli_params',
        schema: 'cliParamsBodySchema',
        action: 'cliParamsAction',
        category: 'cli',
    },
    {
        path: 'return_code',
        schema: 'returnCodeBodySchema',
        action: 'returnCodeAction',
        category: 'cli',
    },
    {
        path: 'integrate_ci',
        schema: 'integrateCIBodySchema',
        action: 'integrateCiAction',
        category: 'ci',
    },

    // ========== Flow Control ==========
    {
        path: 'variable',
        schema: 'variableBodySchema',
        action: 'variableAction',
        category: 'flow_control',
    },
    {
        path: 'conditional',
        schema: 'conditionalBodySchema',
        action: 'conditionalAction',
        category: 'flow_control',
    },
    {
        path: 'loop',
        schema: 'loopBodySchema',
        action: 'loopAction',
        category: 'flow_control',
    },
    {
        path: 'branch',
        schema: 'branchBodySchema',
        action: 'branchAction',
        category: 'flow_control',
    },
    {
        path: 'switch',
        schema: 'switchBodySchema',
        action: 'switchAction',
        category: 'flow_control',
    },
    {
        path: 'flow_control',
        schema: 'flowControlBodySchema',
        action: 'flowControlAction',
        category: 'flow_control',
    },
    {
        path: 'transform',
        schema: 'transformBodySchema',
        action: 'transformAction',
        category: 'flow_control',
    },
    {
        path: 'backend_js',
        schema: 'backendJsBodySchema',
        action: 'backendJsAction',
        category: 'flow_control',
    },
    {
        path: 'fail_flow',
        schema: 'failFlowBodySchema',
        action: 'failFlowAction',
        category: 'flow_control',
    },
    {
        path: 'component',
        schema: 'componentBodySchema',
        action: 'componentAction',
        category: 'flow_control',
    },
    {
        path: 'input',
        schema: 'inputBodySchema',
        action: 'inputAction',
        category: 'flow_control',
    },
    {
        path: 'output',
        schema: 'outputBodySchema',
        action: 'outputAction',
        category: 'flow_control',
    },

    // ========== AI Integration (LLM) ==========
    {
        path: 'call_llm',
        schema: 'callLlmBodySchema',
        action: 'callLlmAction',
        category: 'llm_ai',
    },
    {
        path: 'generate_data',
        schema: 'generateDataBodySchema',
        action: 'generateDataAction',
        category: 'llm_ai',
    },
    {
        path: 'validate_semantic',
        schema: 'validateSemanticBodySchema',
        action: 'validateSemanticAction',
        category: 'llm_ai',
    },
    {
        path: 'extract_dom_context',
        schema: 'extractDomContextBodySchema',
        action: 'extractDomContextAction',
        category: 'llm_ai',
    },
    {
        path: 'chain_of_thought',
        schema: 'chainOfThoughtBodySchema',
        action: 'chainOfThoughtAction',
        category: 'llm_ai',
    },
    {
        path: 'smart_selector',
        schema: 'smartSelectorBodySchema',
        action: 'smartSelectorAction',
        category: 'llm_ai',
    },
];

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
            // If we have a successful result and a runId, save it to the singleton VariableManager
            // This mimics ExecutionService behavior, making strictly-typed atomic runs work seamlessly!
            if (standardBody.success !== false) {
                const rID = req.body.runId || 'atomic_run';
                // Use a non-blocking background promise to avoid slowing down API response
                import('../services/VariableManager.js')
                    .then(({ variableManager }) => {
                        const label =
                            req.body.configuration?.customLabel ||
                            req.body.configuration?.label ||
                            req.body.label;
                        const type =
                            req.body.type || req.url.split('/').pop().replace('_action', ''); // Fallback type extraction

                        if (nodeId) variableManager.set(`${nodeId}.result`, standardBody, rID);
                        if (label) variableManager.set(`${label}.result`, standardBody, rID);
                        if (type) variableManager.set(`${type}.result`, standardBody, rID);

                        console.log(
                            `[API Router] 💾 Auto-Saved Atomic Result for: ${type || label || nodeId} in runId: ${rID}`,
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

// (Removed placeholder ai/validate route)

export default router;
