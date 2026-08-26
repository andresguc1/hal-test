import { nodeRegistry } from './NodeRegistry.js';

/**
 * Registers all built-in plugin handlers into the NodeRegistry.
 * Called at app startup to make handlers available to ActionRouter.
 *
 * IMPORTANT: Each plugin uses a loadModules() function with static import() calls
 * (string-literal arguments) so that esbuild can resolve and bundle them.
 * Dynamic import(plugin.handlerPath) with variable arguments is NOT bundled by esbuild,
 * which breaks the npm-published CLI package where the plugins/ directory is not included.
 */

const BUILTIN_PLUGINS = [
    {
        type: 'launch_browser',
        category: 'browser_management',
        label: 'Launch Browser',
        color: 'blue',
        icon: 'Globe',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-browser/handlers/launch_browser.js'),
                import('../plugins/core-browser/schemas/launch_browser.js'),
            ]),
    },
    {
        type: 'close_browser',
        category: 'browser_management',
        label: 'Close Browser',
        color: 'blue',
        icon: 'Globe',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-browser/handlers/close_browser.js'),
                import('../plugins/core-browser/schemas/close_browser.js'),
            ]),
    },
    {
        type: 'manage_tabs',
        category: 'browser_management',
        label: 'Manage Tabs',
        color: 'blue',
        icon: 'Globe',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-browser/handlers/manage_tabs.js'),
                import('../plugins/core-browser/schemas/manage_tabs.js'),
            ]),
    },
    {
        type: 'resize_viewport',
        category: 'browser_management',
        label: 'Resize Viewport',
        color: 'blue',
        icon: 'Globe',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-browser/handlers/resize_viewport.js'),
                import('../plugins/core-browser/schemas/resize_viewport.js'),
            ]),
    },
    {
        type: 'open_url',
        category: 'navigation',
        label: 'Open URL',
        color: 'indigo',
        icon: 'Compass',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-navigation/handlers/open_url.js'),
                import('../plugins/core-navigation/schemas/open_url.js'),
            ]),
    },
    {
        type: 'go_back',
        category: 'navigation',
        label: 'Go Back',
        color: 'indigo',
        icon: 'ArrowLeft',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-navigation/handlers/go_back.js'),
                import('../plugins/core-navigation/schemas/go_back.js'),
            ]),
    },
    {
        type: 'go_forward',
        category: 'navigation',
        label: 'Go Forward',
        color: 'indigo',
        icon: 'ArrowRight',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-navigation/handlers/go_forward.js'),
                import('../plugins/core-navigation/schemas/go_forward.js'),
            ]),
    },
    {
        type: 'reload_page',
        category: 'navigation',
        label: 'Reload Page',
        color: 'indigo',
        icon: 'RefreshCw',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-navigation/handlers/reload_page.js'),
                import('../plugins/core-navigation/schemas/reload_page.js'),
            ]),
    },
    {
        type: 'click',
        category: 'user_interaction',
        label: 'Click Element',
        color: 'green',
        icon: 'MousePointerClick',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/click.js'),
                import('../plugins/core-interaction/schemas/click.js'),
            ]),
    },
    {
        type: 'type_text',
        category: 'user_interaction',
        label: 'Type Text',
        color: 'green',
        icon: 'Keyboard',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/type_text.js'),
                import('../plugins/core-interaction/schemas/type_text.js'),
            ]),
    },
    {
        type: 'fill_form',
        category: 'user_interaction',
        label: 'Fill Form',
        color: 'green',
        icon: 'FormInput',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/fill_form.js'),
                import('../plugins/core-interaction/schemas/fill_form.js'),
            ]),
    },
    {
        type: 'select_option',
        category: 'user_interaction',
        label: 'Select Option',
        color: 'green',
        icon: 'List',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/select_option.js'),
                import('../plugins/core-interaction/schemas/select_option.js'),
            ]),
    },
    {
        type: 'scroll',
        category: 'user_interaction',
        label: 'Scroll',
        color: 'green',
        icon: 'ArrowUpDown',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/scroll.js'),
                import('../plugins/core-interaction/schemas/scroll.js'),
            ]),
    },
    {
        type: 'hover',
        category: 'user_interaction',
        label: 'Hover',
        color: 'green',
        icon: 'MousePointer2',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/hover.js'),
                import('../plugins/core-interaction/schemas/hover.js'),
            ]),
    },
    {
        type: 'drag_drop',
        category: 'user_interaction',
        label: 'Drag & Drop',
        color: 'green',
        icon: 'Move',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/drag_drop.js'),
                import('../plugins/core-interaction/schemas/drag_drop.js'),
            ]),
    },
    {
        type: 'upload_file',
        category: 'user_interaction',
        label: 'Upload File',
        color: 'green',
        icon: 'Upload',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/upload_file.js'),
                import('../plugins/core-interaction/schemas/upload_file.js'),
            ]),
    },
    {
        type: 'find_element',
        category: 'user_interaction',
        label: 'Find Element',
        color: 'green',
        icon: 'Search',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/find_element.js'),
                import('../plugins/core-interaction/schemas/find_element.js'),
            ]),
    },
    {
        type: 'get_set_content',
        category: 'user_interaction',
        label: 'Get/Set Content',
        color: 'green',
        icon: 'FileText',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-interaction/handlers/get_set_content.js'),
                import('../plugins/core-interaction/schemas/get_set_content.js'),
            ]),
    },
    {
        type: 'wait_for_element',
        category: 'wait_timing',
        label: 'Wait for Element',
        color: 'amber',
        icon: 'Clock',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_for_element.js'),
                import('../plugins/core-wait/schemas/wait_for_element.js'),
            ]),
    },
    {
        type: 'wait_visible',
        category: 'wait_timing',
        label: 'Wait Visible',
        color: 'amber',
        icon: 'Eye',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_visible.js'),
                import('../plugins/core-wait/schemas/wait_visible.js'),
            ]),
    },
    {
        type: 'wait_navigation',
        category: 'wait_timing',
        label: 'Wait Navigation',
        color: 'amber',
        icon: 'Loader',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_navigation.js'),
                import('../plugins/core-wait/schemas/wait_navigation.js'),
            ]),
    },
    {
        type: 'wait_network',
        category: 'wait_timing',
        label: 'Wait Network',
        color: 'amber',
        icon: 'Wifi',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_network.js'),
                import('../plugins/core-wait/schemas/wait_network.js'),
            ]),
    },
    {
        type: 'wait_conditional',
        category: 'wait_timing',
        label: 'Wait Conditional',
        color: 'amber',
        icon: 'Timer',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_conditional.js'),
                import('../plugins/core-wait/schemas/wait_conditional.js'),
            ]),
    },
    {
        type: 'pause',
        category: 'wait_timing',
        label: 'Pause',
        color: 'amber',
        icon: 'Pause',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/pause.js'),
                import('../plugins/core-wait/schemas/pause.js'),
            ]),
    },
    {
        type: 'wait_for_response',
        category: 'wait_timing',
        label: 'Wait for Response',
        color: 'amber',
        icon: 'ArrowDownToLine',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_for_response.js'),
                import('../plugins/core-wait/schemas/wait_for_response.js'),
            ]),
    },
    {
        type: 'wait_for_request',
        category: 'wait_timing',
        label: 'Wait for Request',
        color: 'amber',
        icon: 'ArrowUpFromLine',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-wait/handlers/wait_for_request.js'),
                import('../plugins/core-wait/schemas/wait_for_request.js'),
            ]),
    },
    {
        type: 'take_screenshot',
        category: 'capture',
        label: 'Take Screenshot',
        color: 'violet',
        icon: 'Camera',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-capture/handlers/take_screenshot.js'),
                import('../plugins/core-capture/schemas/take_screenshot.js'),
            ]),
    },
    {
        type: 'save_dom',
        category: 'capture',
        label: 'Save DOM',
        color: 'violet',
        icon: 'Download',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-capture/handlers/save_dom.js'),
                import('../plugins/core-capture/schemas/save_dom.js'),
            ]),
    },
    {
        type: 'log_errors',
        category: 'capture',
        label: 'Log Errors',
        color: 'violet',
        icon: 'Bug',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-capture/handlers/log_errors.js'),
                import('../plugins/core-capture/schemas/log_errors.js'),
            ]),
    },
    {
        type: 'listen_events',
        category: 'capture',
        label: 'Listen Events',
        color: 'violet',
        icon: 'Radio',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-capture/handlers/listen_events.js'),
                import('../plugins/core-capture/schemas/listen_events.js'),
            ]),
    },
    {
        type: 'mock_response',
        category: 'network',
        label: 'Mock Response',
        color: 'cyan',
        icon: 'Server',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/mock_response.handler.js'),
                import('../plugins/core-network/schemas/mock_response.js'),
            ]),
    },
    {
        type: 'intercept_request',
        category: 'network',
        label: 'Intercept Request',
        color: 'cyan',
        icon: 'Shield',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/intercept_request.handler.js'),
                import('../plugins/core-network/schemas/intercept_request.js'),
            ]),
    },
    {
        type: 'manage_cookies',
        category: 'network',
        label: 'Manage Cookies',
        color: 'cyan',
        icon: 'Cookie',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/manage_cookies.handler.js'),
                import('../plugins/core-network/schemas/manage_cookies.js'),
            ]),
    },
    {
        type: 'set_network_conditions',
        category: 'network',
        label: 'Set Network Conditions',
        color: 'cyan',
        icon: 'Gauge',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/set_network_conditions.handler.js'),
                import('../plugins/core-network/schemas/set_network_conditions.js'),
            ]),
    },
    {
        type: 'configure_route',
        category: 'network',
        label: 'Configure Route',
        color: 'cyan',
        icon: 'Route',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/configure_route.handler.js'),
                import('../plugins/core-network/schemas/configure_route.js'),
            ]),
    },
    {
        type: 'clear_all_mocks',
        category: 'network',
        label: 'Clear All Mocks',
        color: 'cyan',
        icon: 'Trash2',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/clear_all_mocks.handler.js'),
                import('../plugins/core-network/schemas/clear_all_mocks.js'),
            ]),
    },
    {
        type: 'wait_network_match',
        category: 'network',
        label: 'Wait Network Match',
        color: 'cyan',
        icon: 'Target',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/wait_network_match.handler.js'),
                import('../plugins/core-network/schemas/wait_network_match.js'),
            ]),
    },
    {
        type: 'block_resource',
        category: 'network',
        label: 'Block Resource',
        color: 'cyan',
        icon: 'Ban',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/block_resource.handler.js'),
                import('../plugins/core-network/schemas/block_resource.js'),
            ]),
    },
    {
        type: 'modify_headers',
        category: 'network',
        label: 'Modify Headers',
        color: 'cyan',
        icon: 'Settings',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-network/handlers/modify_headers.handler.js'),
                import('../plugins/core-network/schemas/modify_headers.js'),
            ]),
    },
    {
        type: 'call_llm',
        category: 'ai_llm',
        label: 'Call LLM',
        color: 'rose',
        icon: 'Brain',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/call_llm.js'),
                import('../plugins/core-ai/schemas/call_llm.js'),
            ]),
    },
    {
        type: 'generate_data',
        category: 'ai_llm',
        label: 'Generate Data',
        color: 'rose',
        icon: 'Sparkles',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/generate_data.js'),
                import('../plugins/core-ai/schemas/generate_data.js'),
            ]),
    },
    {
        type: 'validate_semantic',
        category: 'ai_llm',
        label: 'Validate Semantic',
        color: 'rose',
        icon: 'CheckCircle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/validate_semantic.js'),
                import('../plugins/core-ai/schemas/validate_semantic.js'),
            ]),
    },
    {
        type: 'extract_dom_context',
        category: 'ai_llm',
        label: 'Extract DOM Context',
        color: 'rose',
        icon: 'ScanSearch',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/extract_dom_context.js'),
                import('../plugins/core-ai/schemas/extract_dom_context.js'),
            ]),
    },
    {
        type: 'chain_of_thought',
        category: 'ai_llm',
        label: 'Chain of Thought',
        color: 'rose',
        icon: 'Lightbulb',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/chain_of_thought.js'),
                import('../plugins/core-ai/schemas/chain_of_thought.js'),
            ]),
    },
    {
        type: 'smart_selector',
        category: 'ai_llm',
        label: 'Smart Selector',
        color: 'rose',
        icon: 'ScanEye',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-ai/handlers/smart_selector.js'),
                import('../plugins/core-ai/schemas/smart_selector.js'),
            ]),
    },
    {
        type: 'variable',
        category: 'flow_logic',
        label: 'Variable',
        color: 'slate',
        icon: 'Variable',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/variable.js'),
                import('../plugins/core-flow-control/schemas/variable.js'),
            ]),
    },
    {
        type: 'conditional',
        category: 'flow_logic',
        label: 'Conditional',
        color: 'slate',
        icon: 'GitBranch',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/conditional.js'),
                import('../plugins/core-flow-control/schemas/conditional.js'),
            ]),
    },
    {
        type: 'switch',
        category: 'flow_logic',
        label: 'Switch',
        color: 'slate',
        icon: 'Shuffle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/switch.js'),
                import('../plugins/core-flow-control/schemas/switch.js'),
            ]),
    },
    {
        type: 'loop',
        category: 'flow_logic',
        label: 'Loop',
        color: 'slate',
        icon: 'Repeat',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/loop.js'),
                import('../plugins/core-flow-control/schemas/loop.js'),
            ]),
    },
    {
        type: 'branch',
        category: 'flow_logic',
        label: 'Branch',
        color: 'slate',
        icon: 'GitMerge',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/branch.js'),
                import('../plugins/core-flow-control/schemas/branch.js'),
            ]),
    },
    {
        type: 'flow_control',
        category: 'flow_logic',
        label: 'Flow Control',
        color: 'slate',
        icon: 'Network',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/flow-control.js'),
                import('../plugins/core-flow-control/schemas/flow-control.js'),
            ]),
    },
    {
        type: 'transform',
        category: 'flow_logic',
        label: 'Transform',
        color: 'slate',
        icon: 'Shuffle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/transform.js'),
                import('../plugins/core-flow-control/schemas/transform.js'),
            ]),
    },
    {
        type: 'backend_js',
        category: 'flow_logic',
        label: 'Backend JS',
        color: 'slate',
        icon: 'Code',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/backend-js.js'),
                import('../plugins/core-flow-control/schemas/backend-js.js'),
            ]),
    },
    {
        type: 'fail_flow',
        category: 'flow_logic',
        label: 'Fail Flow',
        color: 'slate',
        icon: 'AlertOctagon',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/fail-flow.js'),
                import('../plugins/core-flow-control/schemas/fail-flow.js'),
            ]),
    },
    {
        type: 'handle_hooks',
        category: 'flow_logic',
        label: 'Handle Hooks',
        color: 'slate',
        icon: 'Anchor',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/handle-hooks.js'),
                import('../plugins/core-flow-control/schemas/handle-hooks.js'),
            ]),
    },
    {
        type: 'control_exceptions',
        category: 'flow_logic',
        label: 'Control Exceptions',
        color: 'slate',
        icon: 'ShieldAlert',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/control-exceptions.js'),
                import('../plugins/core-flow-control/schemas/control-exceptions.js'),
            ]),
    },
    {
        type: 'component',
        category: 'flow_logic',
        label: 'Component',
        color: 'slate',
        icon: 'Puzzle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/component.js'),
                import('../plugins/core-flow-control/schemas/component.js'),
            ]),
    },
    {
        type: 'input',
        category: 'flow_logic',
        label: 'Input',
        color: 'slate',
        icon: 'LogIn',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/input.js'),
                import('../plugins/core-flow-control/schemas/input.js'),
            ]),
    },
    {
        type: 'output',
        category: 'flow_logic',
        label: 'Output',
        color: 'slate',
        icon: 'LogOut',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-flow-control/handlers/output.js'),
                import('../plugins/core-flow-control/schemas/output.js'),
            ]),
    },
    {
        type: 'csp_validator',
        category: 'security',
        label: 'CSP Validator',
        color: 'red',
        icon: 'Shield',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-security/handlers/csp_validator.js'),
                import('../plugins/core-security/schemas/csp_validator.js'),
            ]),
    },
    {
        type: 'header_auditor',
        category: 'security',
        label: 'Header Auditor',
        color: 'red',
        icon: 'AlertTriangle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-security/handlers/header_auditor.js'),
                import('../plugins/core-security/schemas/header_auditor.js'),
            ]),
    },
    {
        type: 'dom_sanitizer',
        category: 'security',
        label: 'DOM Sanitizer',
        color: 'red',
        icon: 'Sparkles',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-security/handlers/dom_sanitizer.js'),
                import('../plugins/core-security/schemas/dom_sanitizer.js'),
            ]),
    },
    {
        type: 'audit_policy',
        category: 'security',
        label: 'Audit Policy',
        color: 'red',
        icon: 'FileCheck',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-security/handlers/audit_policy.js'),
                import('../plugins/core-security/schemas/audit_policy.js'),
            ]),
    },
    {
        type: 'sensitive_data_monitor',
        category: 'security',
        label: 'Sensitive Data Monitor',
        color: 'red',
        icon: 'EyeOff',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-security/handlers/sensitive_data_monitor.js'),
                import('../plugins/core-security/schemas/sensitive_data_monitor.js'),
            ]),
    },
    {
        type: 'assert_page_text',
        category: 'assertion',
        label: 'Assert Page Text',
        color: 'emerald',
        icon: 'CheckCircle',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-assertion/handlers/assert_page_text.handler.js'),
                import('../plugins/core-assertion/schemas/assert_page_text.js'),
            ]),
    },
    {
        type: 'persist_session',
        category: 'session',
        label: 'Persist Session',
        color: 'orange',
        icon: 'Database',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/persist_session.js'),
                import('../plugins/core-session/schemas/persist_session.js'),
            ]),
    },
    {
        type: 'manage_session',
        category: 'session',
        label: 'Manage Session',
        color: 'orange',
        icon: 'Key',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/manage_session.js'),
                import('../plugins/core-session/schemas/manage_session.js'),
            ]),
    },
    {
        type: 'create_context',
        category: 'session',
        label: 'Create Context',
        color: 'orange',
        icon: 'Plus',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/create_context.js'),
                import('../plugins/core-session/schemas/create_context.js'),
            ]),
    },
    {
        type: 'cleanup_state',
        category: 'session',
        label: 'Cleanup State',
        color: 'orange',
        icon: 'Trash2',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/cleanup_state.js'),
                import('../plugins/core-session/schemas/cleanup_state.js'),
            ]),
    },
    {
        type: 'close_context',
        category: 'session',
        label: 'Close Context',
        color: 'orange',
        icon: 'X',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/close_context.js'),
                import('../plugins/core-session/schemas/close_context.js'),
            ]),
    },
    {
        type: 'manage_storage',
        category: 'session',
        label: 'Manage Storage',
        color: 'orange',
        icon: 'HardDrive',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/manage_storage.js'),
                import('../plugins/core-session/schemas/manage_storage.js'),
            ]),
    },
    {
        type: 'inject_tokens',
        category: 'session',
        label: 'Inject Tokens',
        color: 'orange',
        icon: 'Syringe',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-session/handlers/inject_tokens.js'),
                import('../plugins/core-session/schemas/inject_tokens.js'),
            ]),
    },
    {
        type: 'read_file',
        category: 'data',
        label: 'Read File',
        color: 'slate',
        icon: 'FileInput',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-data/handlers/read_data.js'),
                import('../plugins/core-data/schemas/read_data.js'),
            ]),
    },
    {
        type: 'write_file',
        category: 'data',
        label: 'Write File',
        color: 'slate',
        icon: 'FileOutput',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-data/handlers/save_results.js'),
                import('../plugins/core-data/schemas/save_results.js'),
            ]),
    },
    {
        type: 'download_file',
        category: 'data',
        label: 'Download File',
        color: 'slate',
        icon: 'Download',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-data/handlers/handle_downloads.js'),
                import('../plugins/core-data/schemas/handle_downloads.js'),
            ]),
    },
    {
        type: 'run_tests',
        category: 'testing',
        label: 'Run Tests',
        color: 'teal',
        icon: 'Play',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-testing/handlers/run_tests.js'),
                import('../plugins/core-testing/schemas/run_tests.js'),
            ]),
    },
    {
        type: 'cli_params',
        category: 'testing',
        label: 'CLI Params',
        color: 'teal',
        icon: 'Terminal',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-testing/handlers/cli_params.js'),
                import('../plugins/core-testing/schemas/cli_params.js'),
            ]),
    },
    {
        type: 'return_code',
        category: 'testing',
        label: 'Return Code',
        color: 'teal',
        icon: 'Hash',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-testing/handlers/return_code.js'),
                import('../plugins/core-testing/schemas/return_code.js'),
            ]),
    },
    {
        type: 'integrate_ci',
        category: 'testing',
        label: 'Integrate CI',
        color: 'teal',
        icon: 'GitBranch',
        loadModules: () =>
            Promise.all([
                import('../plugins/core-testing/handlers/integrate_ci.js'),
                import('../plugins/core-testing/schemas/integrate_ci.js'),
            ]),
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
            const [handlerModule, schemaModule] = await plugin.loadModules();

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
        `[PluginBootstrap] Loaded ${loaded}/${BUILTIN_PLUGINS.length} built-in plugins (${failed} failed)`,
    );

    return { loaded, failed };
}

export { BUILTIN_PLUGINS };
export default bootstrapBuiltinPlugins;
