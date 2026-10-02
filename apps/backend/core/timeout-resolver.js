/**
 * Backend timeout resolver — single place that derives the effective timeout
 * for a node and the hard wall-clock ceiling that bounds total node execution.
 *
 * This is separate from the frontend capability registry. The frontend
 * registry decides WHICH node types can be given a timeout and what the UI
 * shows. This module decides, at RUN TIME, what value actually applies,
 * given the node's configuration, the project defaults, and the hard
 * platform rules.
 *
 * Key rules:
 * - An empty/undefined/0 timeout means "use the platform default for this
 *   semantic" — the value is NOT used as a literal number. The platform
 *   default is: 30000 for action/navigation/wait/container/browserLaunch,
 *   500 for assertion, 10000 for registrationTtl/ruleLifetime.
 * - The wall-clock ceiling is max(30000, effectiveTimeout * 1.5). This
 *   replaces the old fixed 30 s cap and scales when the user asks for more.
 *   For assertion (default 500) the ceiling stays 30000 because 500*1.5=750.
 * - ruleLifetime with default 0 means "persistent" and has no ceiling.
 */

const PLATFORM_DEFAULTS = Object.freeze({
    action: 30000,
    navigation: 30000,
    wait: 30000,
    assertion: 500,
    registrationTtl: 10000,
    containerBudget: 60000,
    browserLaunch: 30000,
    ruleLifetime: 0, // 0 = persistent (no ceiling)
});

const PLATFORM_CEILING_FLOOR = 30000;
const PLATFORM_HEADROOM_FACTOR = 1.5;

/**
 * Maps backend action types to their timeout semantic.
 * Must stay in sync with the frontend capability registry.
 * Types not listed here fall back to 'action' with the 30s default/ceiling.
 */
const ACTION_TYPE_SEMANTIC = Object.freeze({
    // Browser management
    launch_browser: 'browserLaunch',
    close_browser: 'browserLaunch',
    create_context: 'browserLaunch',
    close_context: 'browserLaunch',
    open_url: 'navigation',
    go_back: 'navigation',
    go_forward: 'navigation',
    reload_page: 'navigation',
    wait_navigation: 'wait',
    manage_tabs: 'action',
    resize_viewport: 'action',
    browser_dialog: 'action',

    // DOM and code
    find_element: 'action',
    get_set_content: 'action',
    execute_js: 'action',
    wait_for_element: 'wait',
    wait_visible: 'wait',
    assert_page_text: 'assertion',
    assert: 'assertion',

    // User actions
    click: 'action',
    type_text: 'action',
    fill_form: 'action',
    select_option: 'action',
    set_checkbox: 'action',
    set_radio: 'action',
    pick_list_option: 'action',
    scroll: 'action',
    drag_drop: 'action',
    hover: 'action',
    mouse_move: 'action',

    // Diagnostics
    take_screenshot: 'action',
    save_dom: 'action',
    log_errors: 'action',
    listen_events: 'action',

    // Network
    wait_network: 'wait',
    wait_network_match: 'wait',
    wait_for_request: 'wait',
    wait_for_response: 'wait',
    manage_cookies: 'action',

    // Files and data
    upload_file: 'action',
    download_file: 'wait',
    extract: 'action',

    // CLI and system
    run_tests: 'wait',

    // Logic engine
    backend_js: 'registrationTtl',
    wait_conditional: 'wait',

    // Rule lifetime (network control)
    mock_response: 'ruleLifetime',
    block_resource: 'ruleLifetime',
    configure_route: 'ruleLifetime',
    modify_headers: 'ruleLifetime',
    intercept_request: 'ruleLifetime',
});

/**
 * Resolves the semantic for an action type.
 * @param {string} actionType
 * @returns {string} The semantic key, or 'action' as safe fallback.
 */
export function getActionSemantic(actionType) {
    return ACTION_TYPE_SEMANTIC[actionType] ?? 'action';
}

/**
 * Resolves the effective timeout for a node based on its semantic.
 *
 * @param {object} params
 * @param {string} params.semantic - One of the TIMEOUT_SEMANTIC values
 * @param {number} [params.configuredTimeout] - User value from node config (normalized: 0/empty = unset)
 * @param {number} [params.projectDefault] - Project-level default (undefined = none)
 * @returns {object} { effectiveMs, wallClockMs, source }
 */
export function resolveNodeTimeout({ semantic, configuredTimeout, projectDefault }) {
    const hasConfigured = Number.isFinite(configuredTimeout) && configuredTimeout > 0;
    const hasProject = Number.isFinite(projectDefault) && projectDefault > 0;

    let effectiveMs;
    let source;

    if (hasConfigured) {
        effectiveMs = configuredTimeout;
        source = 'node';
    } else if (hasProject) {
        effectiveMs = projectDefault;
        source = 'project';
    } else {
        effectiveMs = PLATFORM_DEFAULTS[semantic] ?? PLATFORM_DEFAULTS.action;
        source = 'platform';
    }

    // ruleLifetime: 0 means persistent, no wall-clock ceiling
    if (semantic === 'ruleLifetime' && effectiveMs === 0) {
        return {
            effectiveMs: 0,
            wallClockMs: Infinity,
            source,
        };
    }

    const wallClockMs = Math.max(
        PLATFORM_CEILING_FLOOR,
        Math.ceil(effectiveMs * PLATFORM_HEADROOM_FACTOR),
    );

    return { effectiveMs, wallClockMs, source };
}

/**
 * Builds a Playwright-compatible options object that includes `timeout`
 * only when the value is a positive number. This mirrors the frontend's
 * playTimeout() and the timeout-utils playTimeout().
 *
 * @param {number} timeout - The effective timeout in ms (from resolveNodeTimeout)
 * @returns {{ timeout?: number }}
 */
export function playTimeout(timeout) {
    return timeout > 0 ? { timeout } : {};
}
