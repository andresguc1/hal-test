import { nodeRegistry } from './NodeRegistry.js';

/**
 * Registers all built-in plugin handlers into the NodeRegistry.
 * Called at app startup to make handlers available to ActionRouter.
 * Each handler is a thin proxy to the existing action.controller.js exports.
 */

// We dynamically import each handler and schema, then register them.
// This keeps startup fast and avoids loading unused modules.

const BUILTIN_PLUGINS = [
    // ── Browser ──
    {
        type: 'launch_browser',
        category: 'browser_management',
        label: 'Launch Browser',
        color: 'blue',
        icon: 'Globe',
        handlerPath: '../plugins/core-browser/handlers/launch_browser.js',
        schemaPath: '../plugins/core-browser/schemas/launch_browser.js',
    },
    {
        type: 'close_browser',
        category: 'browser_management',
        label: 'Close Browser',
        color: 'blue',
        icon: 'Globe',
        handlerPath: '../plugins/core-browser/handlers/close_browser.js',
        schemaPath: '../plugins/core-browser/schemas/close_browser.js',
    },
    {
        type: 'manage_tabs',
        category: 'browser_management',
        label: 'Manage Tabs',
        color: 'blue',
        icon: 'Globe',
        handlerPath: '../plugins/core-browser/handlers/manage_tabs.js',
        schemaPath: '../plugins/core-browser/schemas/manage_tabs.js',
    },
    {
        type: 'resize_viewport',
        category: 'browser_management',
        label: 'Resize Viewport',
        color: 'blue',
        icon: 'Globe',
        handlerPath: '../plugins/core-browser/handlers/resize_viewport.js',
        schemaPath: '../plugins/core-browser/schemas/resize_viewport.js',
    },

    // ── Navigation ──
    {
        type: 'open_url',
        category: 'navigation',
        label: 'Open URL',
        color: 'indigo',
        icon: 'Compass',
        handlerPath: '../plugins/core-navigation/handlers/open_url.js',
        schemaPath: '../plugins/core-navigation/schemas/open_url.js',
    },
    {
        type: 'go_back',
        category: 'navigation',
        label: 'Go Back',
        color: 'indigo',
        icon: 'ArrowLeft',
        handlerPath: '../plugins/core-navigation/handlers/go_back.js',
        schemaPath: '../plugins/core-navigation/schemas/go_back.js',
    },
    {
        type: 'go_forward',
        category: 'navigation',
        label: 'Go Forward',
        color: 'indigo',
        icon: 'ArrowRight',
        handlerPath: '../plugins/core-navigation/handlers/go_forward.js',
        schemaPath: '../plugins/core-navigation/schemas/go_forward.js',
    },
    {
        type: 'reload_page',
        category: 'navigation',
        label: 'Reload Page',
        color: 'indigo',
        icon: 'RefreshCw',
        handlerPath: '../plugins/core-navigation/handlers/reload_page.js',
        schemaPath: '../plugins/core-navigation/schemas/reload_page.js',
    },

    // ── Interaction ──
    {
        type: 'click',
        category: 'user_interaction',
        label: 'Click Element',
        color: 'green',
        icon: 'MousePointerClick',
        handlerPath: '../plugins/core-interaction/handlers/click.js',
        schemaPath: '../plugins/core-interaction/schemas/click.js',
    },
    {
        type: 'type_text',
        category: 'user_interaction',
        label: 'Type Text',
        color: 'green',
        icon: 'Keyboard',
        handlerPath: '../plugins/core-interaction/handlers/type_text.js',
        schemaPath: '../plugins/core-interaction/schemas/type_text.js',
    },
    {
        type: 'fill_form',
        category: 'user_interaction',
        label: 'Fill Form',
        color: 'green',
        icon: 'FormInput',
        handlerPath: '../plugins/core-interaction/handlers/fill_form.js',
        schemaPath: '../plugins/core-interaction/schemas/fill_form.js',
    },
    {
        type: 'select_option',
        category: 'user_interaction',
        label: 'Select Option',
        color: 'green',
        icon: 'List',
        handlerPath: '../plugins/core-interaction/handlers/select_option.js',
        schemaPath: '../plugins/core-interaction/schemas/select_option.js',
    },
    {
        type: 'scroll',
        category: 'user_interaction',
        label: 'Scroll',
        color: 'green',
        icon: 'ArrowUpDown',
        handlerPath: '../plugins/core-interaction/handlers/scroll.js',
        schemaPath: '../plugins/core-interaction/schemas/scroll.js',
    },
    {
        type: 'hover',
        category: 'user_interaction',
        label: 'Hover',
        color: 'green',
        icon: 'MousePointer2',
        handlerPath: '../plugins/core-interaction/handlers/hover.js',
        schemaPath: '../plugins/core-interaction/schemas/hover.js',
    },
    {
        type: 'drag_drop',
        category: 'user_interaction',
        label: 'Drag & Drop',
        color: 'green',
        icon: 'Move',
        handlerPath: '../plugins/core-interaction/handlers/drag_drop.js',
        schemaPath: '../plugins/core-interaction/schemas/drag_drop.js',
    },
    {
        type: 'upload_file',
        category: 'user_interaction',
        label: 'Upload File',
        color: 'green',
        icon: 'Upload',
        handlerPath: '../plugins/core-interaction/handlers/upload_file.js',
        schemaPath: '../plugins/core-interaction/schemas/upload_file.js',
    },

    // ── Wait ──
    {
        type: 'wait_for_element',
        category: 'wait_timing',
        label: 'Wait for Element',
        color: 'amber',
        icon: 'Clock',
        handlerPath: '../plugins/core-wait/handlers/wait_for_element.js',
        schemaPath: '../plugins/core-wait/schemas/wait_for_element.js',
    },
    {
        type: 'wait_visible',
        category: 'wait_timing',
        label: 'Wait Visible',
        color: 'amber',
        icon: 'Eye',
        handlerPath: '../plugins/core-wait/handlers/wait_visible.js',
        schemaPath: '../plugins/core-wait/schemas/wait_visible.js',
    },
    {
        type: 'wait_navigation',
        category: 'wait_timing',
        label: 'Wait Navigation',
        color: 'amber',
        icon: 'Loader',
        handlerPath: '../plugins/core-wait/handlers/wait_navigation.js',
        schemaPath: '../plugins/core-wait/schemas/wait_navigation.js',
    },
    {
        type: 'wait_network',
        category: 'wait_timing',
        label: 'Wait Network',
        color: 'amber',
        icon: 'Wifi',
        handlerPath: '../plugins/core-wait/handlers/wait_network.js',
        schemaPath: '../plugins/core-wait/schemas/wait_network.js',
    },
    {
        type: 'wait_conditional',
        category: 'wait_timing',
        label: 'Wait Conditional',
        color: 'amber',
        icon: 'Timer',
        handlerPath: '../plugins/core-wait/handlers/wait_conditional.js',
        schemaPath: '../plugins/core-wait/schemas/wait_conditional.js',
    },
    {
        type: 'pause',
        category: 'wait_timing',
        label: 'Pause',
        color: 'amber',
        icon: 'Pause',
        handlerPath: '../plugins/core-wait/handlers/pause.js',
        schemaPath: '../plugins/core-wait/schemas/pause.js',
    },

    // ── Capture ──
    {
        type: 'take_screenshot',
        category: 'capture',
        label: 'Take Screenshot',
        color: 'violet',
        icon: 'Camera',
        handlerPath: '../plugins/core-capture/handlers/take_screenshot.handler.js',
        schemaPath: '../plugins/core-capture/schemas/take_screenshot.schema.js',
    },
    {
        type: 'save_dom',
        category: 'capture',
        label: 'Save DOM',
        color: 'violet',
        icon: 'Download',
        handlerPath: '../plugins/core-capture/handlers/save_dom.handler.js',
        schemaPath: '../plugins/core-capture/schemas/save_dom.schema.js',
    },

    // ── Network ──
    {
        type: 'mock_response',
        category: 'network',
        label: 'Mock Response',
        color: 'cyan',
        icon: 'Server',
        handlerPath: '../plugins/core-network/handlers/mock_response.handler.js',
        schemaPath: '../plugins/core-network/schemas/mock_response.schema.js',
    },
    {
        type: 'intercept_request',
        category: 'network',
        label: 'Intercept Request',
        color: 'cyan',
        icon: 'Shield',
        handlerPath: '../plugins/core-network/handlers/intercept_request.handler.js',
        schemaPath: '../plugins/core-network/schemas/intercept_request.schema.js',
    },
    {
        type: 'manage_cookies',
        category: 'network',
        label: 'Manage Cookies',
        color: 'cyan',
        icon: 'Cookie',
        handlerPath: '../plugins/core-network/handlers/manage_cookies.handler.js',
        schemaPath: '../plugins/core-network/schemas/manage_cookies.schema.js',
    },

    // ── AI ──
    {
        type: 'call_llm',
        category: 'ai_llm',
        label: 'Call LLM',
        color: 'rose',
        icon: 'Brain',
        handlerPath: '../plugins/core-ai/handlers/call_llm.js',
        schemaPath: '../plugins/core-ai/schemas/call_llm.js',
    },
    {
        type: 'generate_data',
        category: 'ai_llm',
        label: 'Generate Data',
        color: 'rose',
        icon: 'Sparkles',
        handlerPath: '../plugins/core-ai/handlers/generate_data.js',
        schemaPath: '../plugins/core-ai/schemas/generate_data.js',
    },
    {
        type: 'validate_semantic',
        category: 'ai_llm',
        label: 'Validate Semantic',
        color: 'rose',
        icon: 'CheckCircle',
        handlerPath: '../plugins/core-ai/handlers/validate_semantic.js',
        schemaPath: '../plugins/core-ai/schemas/validate_semantic.js',
    },

    // ── Flow Control ──
    {
        type: 'variable',
        category: 'flow_logic',
        label: 'Variable',
        color: 'slate',
        icon: 'Variable',
        handlerPath: '../plugins/core-flow-control/handlers/variable.js',
        schemaPath: '../plugins/core-flow-control/schemas/variable.js',
    },
    {
        type: 'conditional',
        category: 'flow_logic',
        label: 'Conditional',
        color: 'slate',
        icon: 'GitBranch',
        handlerPath: '../plugins/core-flow-control/handlers/conditional.js',
        schemaPath: '../plugins/core-flow-control/schemas/conditional.js',
    },
    {
        type: 'loop',
        category: 'flow_logic',
        label: 'Loop',
        color: 'slate',
        icon: 'Repeat',
        handlerPath: '../plugins/core-flow-control/handlers/loop.js',
        schemaPath: '../plugins/core-flow-control/schemas/loop.js',
    },
    {
        type: 'transform',
        category: 'flow_logic',
        label: 'Transform',
        color: 'slate',
        icon: 'Shuffle',
        handlerPath: '../plugins/core-flow-control/handlers/transform.js',
        schemaPath: '../plugins/core-flow-control/schemas/transform.js',
    },
    {
        type: 'backend_js',
        category: 'flow_logic',
        label: 'Backend JS',
        color: 'slate',
        icon: 'Code',
        handlerPath: '../plugins/core-flow-control/handlers/backend-js.js',
        schemaPath: '../plugins/core-flow-control/schemas/backend-js.js',
    },

    // ── Security ──
    {
        type: 'csp_validator',
        category: 'security',
        label: 'CSP Validator',
        color: 'red',
        icon: 'Shield',
        handlerPath: '../plugins/core-security/handlers/csp_validator.js',
        schemaPath: '../plugins/core-security/schemas/csp_validator.js',
    },
    {
        type: 'header_auditor',
        category: 'security',
        label: 'Header Auditor',
        color: 'red',
        icon: 'AlertTriangle',
        handlerPath: '../plugins/core-security/handlers/header_auditor.js',
        schemaPath: '../plugins/core-security/schemas/header_auditor.js',
    },

    // ── Assertion ──
    {
        type: 'assert_page_text',
        category: 'assertion',
        label: 'Assert Page Text',
        color: 'emerald',
        icon: 'CheckCircle',
        handlerPath: '../plugins/core-assertion/handlers/assert_page_text.handler.js',
        schemaPath: '../plugins/core-assertion/schemas/assert_page_text.schema.js',
    },

    // ── Session ──
    {
        type: 'persist_session',
        category: 'session',
        label: 'Persist Session',
        color: 'orange',
        icon: 'Database',
        handlerPath: '../plugins/core-session/handlers/persist_session.js',
        schemaPath: '../plugins/core-session/schemas/persist_session.js',
    },
    {
        type: 'manage_session',
        category: 'session',
        label: 'Manage Session',
        color: 'orange',
        icon: 'Key',
        handlerPath: '../plugins/core-session/handlers/manage_session.js',
        schemaPath: '../plugins/core-session/schemas/manage_session.js',
    },
    {
        type: 'create_context',
        category: 'session',
        label: 'Create Context',
        color: 'orange',
        icon: 'Plus',
        handlerPath: '../plugins/core-session/handlers/create_context.js',
        schemaPath: '../plugins/core-session/schemas/create_context.js',
    },

    // ── Data ──
    {
        type: 'read_file',
        category: 'data',
        label: 'Read File',
        color: 'slate',
        icon: 'FileInput',
        handlerPath: '../plugins/core-data/handlers/read_data.js',
        schemaPath: '../plugins/core-data/schemas/read_data.js',
    },
    {
        type: 'write_file',
        category: 'data',
        label: 'Write File',
        color: 'slate',
        icon: 'FileOutput',
        handlerPath: '../plugins/core-data/handlers/save_results.js',
        schemaPath: '../plugins/core-data/schemas/save_results.js',
    },
];

/**
 * Loads all built-in plugins into the NodeRegistry.
 * Must be called once at app startup before routes are registered.
 * @returns {{ loaded: number, failed: number }}
 */
export async function bootstrapBuiltinPlugins() {
    let loaded = 0;
    let failed = 0;

    for (const plugin of BUILTIN_PLUGINS) {
        try {
            const [handlerModule, schemaModule] = await Promise.all([
                import(plugin.handlerPath),
                import(plugin.schemaPath),
            ]);

            const handler = handlerModule.default || handlerModule;
            const schema = schemaModule.default || schemaModule;

            nodeRegistry.register(
                {
                    type: plugin.type,
                    category: plugin.category,
                    label: plugin.label,
                    color: plugin.color,
                    icon: plugin.icon,
                    version: '1.0.0',
                    handler,
                    schema,
                },
                'builtin',
            );

            loaded++;
        } catch (error) {
            console.error(`[PluginBootstrap] Failed to load ${plugin.type}: ${error.message}`);
            failed++;
        }
    }

    console.log(
        `[PluginBootstrap] ✅ Loaded ${loaded}/${BUILTIN_PLUGINS.length} built-in plugins (${failed} failed)`,
    );

    return { loaded, failed };
}

export { BUILTIN_PLUGINS };
export default bootstrapBuiltinPlugins;
