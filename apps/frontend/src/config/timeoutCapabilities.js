/**
 * Single source of truth for which node types can be given a timeout, what that
 * timeout means, and which constraints the UI should enforce on it.
 *
 * This registry exists because the timeout used to be declared inline in
 * NODE_INPUTS for a handful of node types while ~40 other types silently had
 * their timeout stripped on save by cleanNodeConfiguration. Nothing in the
 * codebase could answer "can this node type be given a timeout?" — the answer
 * lived in the same place as the form field, and only as a side effect.
 *
 * Two values are deliberately kept apart, because they answer different
 * questions:
 *
 *   - The operation timeout is bounded by the node's own configuration and is
 *     what Playwright (or the HalTest wrapper) is told.
 *   - The wall-clock ceiling is derived from the effective operation timeout
 *     and is what bounds total node execution, so a node that hangs in a way
 *     no per-call timeout can catch still terminates. See the backend
 *     resolver; it is deliberately not computed here, because the frontend
 *     has no way to know the value a run will actually resolve.
 *
 * Scope note: this registry is frontend-local. The backend resolver in
 * ExecutionService derives the effective value at run time from the node's
 * configuration and project defaults, and does not import from here.
 */

/**
 * What the timeout bounds. The semantic decides the default, the unit and the
 * i18n key the UI uses, so the same field never claims to be the same thing on
 * two different node types.
 */
export const TIMEOUT_SEMANTIC = Object.freeze({
  /** A single interaction or DOM operation: click, type, scroll. */
  ACTION: "action",
  /** Loading or changing the document: open_url, go_back, reload. */
  NAVIGATION: "navigation",
  /** A check that must hold, retried until it does. */
  ASSERTION: "assertion",
  /** Waiting for a condition that is not the node's own work completing. */
  WAIT: "wait",
  /** A sandboxed script's own execution budget. */
  REGISTRATION_TTL: "registrationTtl",
  /** How long a mock, route, header or interception rule stays registered. */
  RULE_LIFETIME: "ruleLifetime",
  /** Starting or attaching to a browser container. */
  CONTAINER_BUDGET: "containerBudget",
  /** Browser or context lifecycle. */
  BROWSER_LAUNCH: "browserLaunch",
});

/**
 * Who consumes the value. A type whose consumer cannot actually apply the
 * number must not advertise the field at all — accepting a value that is then
 * ignored is worse than not offering it, because the user has no way to tell
 * which happened.
 */
export const TIMEOUT_CONSUMER = Object.freeze({
  /** Forwarded to a Playwright call, which bounds a single awaited operation. */
  PLAYWRIGHT: "playwright",
  /** Enforced by HalTest itself rather than by Playwright. */
  WRAPPER: "wrapper",
  /** Bounds container startup. */
  CONTAINER: "container",
  /** Bounds browser or context lifecycle work. */
  LIFECYCLE: "lifecycle",
  /** The type does not advertise a timeout. */
  NONE: "none",
});

/**
 * Per-semantic defaults. `default` is what the value falls back to when the
 * user leaves the field empty, and is deliberately expressed as the platform's
 * own default rather than as a number the UI pre-fills: pre-filling would make
 * "unset" indistinguishable from "explicitly chose this".
 *
 * `guardrail` is a hard ceiling the platform will not exceed even if the user
 * asks for more. It exists for the operations where "wait longer" is never the
 * user's actual intent — waiting on a network condition that will never
 * satisfy, or a browser that will never start, produces a hung run rather than
 * a slow one.
 */
const SEMANTIC_DEFAULTS = Object.freeze({
  [TIMEOUT_SEMANTIC.ACTION]: {
    consumer: TIMEOUT_CONSUMER.PLAYWRIGHT,
    default: 30000,
    min: 0,
    max: null,
    step: 1000,
    unit: "ms",
    guardrail: null,
  },
  [TIMEOUT_SEMANTIC.NAVIGATION]: {
    consumer: TIMEOUT_CONSUMER.PLAYWRIGHT,
    default: 30000,
    min: 0,
    max: null,
    step: 1000,
    unit: "ms",
    guardrail: null,
  },
  [TIMEOUT_SEMANTIC.ASSERTION]: {
    consumer: TIMEOUT_CONSUMER.PLAYWRIGHT,
    // HalTest's short fast-fail assertion window, not Playwright's 5000 ms
    // expect() default. The strategies poll themselves rather than going
    // through expect(), and an assertion is usually either already true or
    // never going to be — waiting five seconds per broken check turns one
    // misconfigured step into a slow run. Kept here in step with
    // DEFAULT_ASSERTION_WINDOW_MS in apps/backend/core/timeout-utils.js.
    default: 500,
    min: 0,
    max: null,
    step: 500,
    unit: "ms",
    guardrail: null,
  },
  [TIMEOUT_SEMANTIC.WAIT]: {
    consumer: TIMEOUT_CONSUMER.PLAYWRIGHT,
    default: 30000,
    min: 0,
    max: 300000,
    step: 1000,
    unit: "ms",
    // A wait that can never satisfy is a hang, not a slow pass.
    guardrail: 300000,
  },
  [TIMEOUT_SEMANTIC.REGISTRATION_TTL]: {
    consumer: TIMEOUT_CONSUMER.WRAPPER,
    default: 10000,
    min: 100,
    max: 600000,
    step: 500,
    unit: "ms",
    guardrail: null,
  },
  /**
   * Same consumer, different zero: a mock, route, header or interception rule
   * treats 0 as "stay registered until the run ends", where a script's 0 means
   * "use the default". The two cannot share a placeholder, so the semantic
   * carries the flag and the label follows it.
   */
  [TIMEOUT_SEMANTIC.RULE_LIFETIME]: {
    consumer: TIMEOUT_CONSUMER.WRAPPER,
    default: 0,
    min: 0,
    max: 600000,
    step: 500,
    unit: "ms",
    guardrail: null,
    persistentAtZero: true,
  },
  [TIMEOUT_SEMANTIC.CONTAINER_BUDGET]: {
    consumer: TIMEOUT_CONSUMER.CONTAINER,
    default: 60000,
    min: 1000,
    max: null,
    step: 1000,
    unit: "ms",
    guardrail: 300000,
  },
  [TIMEOUT_SEMANTIC.BROWSER_LAUNCH]: {
    consumer: TIMEOUT_CONSUMER.LIFECYCLE,
    default: 30000,
    min: 0,
    max: null,
    step: 1000,
    unit: "ms",
    guardrail: 120000,
  },
});

/**
 * The classification itself: every node type the frontend knows about, mapped
 * to the semantic its timeout bounds. A type that is absent does not advertise
 * a timeout; see canConfigureTimeout.
 *
 * Types whose work is not bounded by a Playwright timeout — LLM calls, route
 * and mock configuration, file IO, database queries, flow-control bookkeeping
 * and the collaboration nodes — are deliberately absent. Each of them either
 * has its own unrelated duration field (pause, session, network conditions)
 * or has nothing to wait for.
 */
const NODE_TYPE_SEMANTICS = Object.freeze({
  // Browser management
  launch_browser: TIMEOUT_SEMANTIC.BROWSER_LAUNCH,
  close_browser: TIMEOUT_SEMANTIC.BROWSER_LAUNCH,
  create_context: TIMEOUT_SEMANTIC.BROWSER_LAUNCH,
  close_context: TIMEOUT_SEMANTIC.BROWSER_LAUNCH,
  open_url: TIMEOUT_SEMANTIC.NAVIGATION,
  go_back: TIMEOUT_SEMANTIC.NAVIGATION,
  go_forward: TIMEOUT_SEMANTIC.NAVIGATION,
  reload_page: TIMEOUT_SEMANTIC.NAVIGATION,
  wait_navigation: TIMEOUT_SEMANTIC.WAIT,
  manage_tabs: TIMEOUT_SEMANTIC.ACTION,
  resize_viewport: TIMEOUT_SEMANTIC.ACTION,
  browser_dialog: TIMEOUT_SEMANTIC.ACTION,

  // DOM and code
  find_element: TIMEOUT_SEMANTIC.ACTION,
  get_set_content: TIMEOUT_SEMANTIC.ACTION,
  execute_js: TIMEOUT_SEMANTIC.ACTION,
  wait_for_element: TIMEOUT_SEMANTIC.WAIT,
  wait_visible: TIMEOUT_SEMANTIC.WAIT,
  assert_page_text: TIMEOUT_SEMANTIC.ASSERTION,
  assert: TIMEOUT_SEMANTIC.ASSERTION,

  // User actions
  click: TIMEOUT_SEMANTIC.ACTION,
  type_text: TIMEOUT_SEMANTIC.ACTION,
  fill_form: TIMEOUT_SEMANTIC.ACTION,
  select_option: TIMEOUT_SEMANTIC.ACTION,
  set_checkbox: TIMEOUT_SEMANTIC.ACTION,
  set_radio: TIMEOUT_SEMANTIC.ACTION,
  pick_list_option: TIMEOUT_SEMANTIC.ACTION,
  scroll: TIMEOUT_SEMANTIC.ACTION,
  drag_drop: TIMEOUT_SEMANTIC.ACTION,
  hover: TIMEOUT_SEMANTIC.ACTION,
  mouse_move: TIMEOUT_SEMANTIC.ACTION,

  // Diagnostics
  take_screenshot: TIMEOUT_SEMANTIC.ACTION,
  save_dom: TIMEOUT_SEMANTIC.ACTION,
  log_errors: TIMEOUT_SEMANTIC.ACTION,
  listen_events: TIMEOUT_SEMANTIC.ACTION,

  // Network
  wait_network: TIMEOUT_SEMANTIC.WAIT,
  wait_network_match: TIMEOUT_SEMANTIC.WAIT,
  wait_for_request: TIMEOUT_SEMANTIC.WAIT,
  wait_for_response: TIMEOUT_SEMANTIC.WAIT,
  manage_cookies: TIMEOUT_SEMANTIC.ACTION,
  // These five declare `timeout` in their Joi body schema as the lifetime of
  // the rule they register, not a bound on an operation — intercept_request
  // calls it "Duración de Interceptación" and mock_response documents 0 as
  // "persistente". The field was being stripped from all five on save, so a
  // configured interception duration never reached the run.
  mock_response: TIMEOUT_SEMANTIC.RULE_LIFETIME,
  block_resource: TIMEOUT_SEMANTIC.RULE_LIFETIME,
  configure_route: TIMEOUT_SEMANTIC.RULE_LIFETIME,
  modify_headers: TIMEOUT_SEMANTIC.RULE_LIFETIME,
  intercept_request: TIMEOUT_SEMANTIC.RULE_LIFETIME,

  // Files and data
  upload_file: TIMEOUT_SEMANTIC.ACTION,
  download_file: TIMEOUT_SEMANTIC.WAIT,
  extract: TIMEOUT_SEMANTIC.ACTION,

  // CLI and system
  run_tests: TIMEOUT_SEMANTIC.WAIT,

  // Logic engine
  backend_js: TIMEOUT_SEMANTIC.REGISTRATION_TTL,
  wait_conditional: TIMEOUT_SEMANTIC.WAIT,
});

/**
 * Per-type overrides for values the semantic alone cannot express. Kept
 * separate from the semantic map so that changing a semantic's defaults never
 * silently rewrites a node's own constraints.
 */
const NODE_TYPE_OVERRIDES = Object.freeze({
  set_checkbox: { advanced: true },
});

/**
 * Resolves the full timeout capability for a node type.
 *
 * Returns null for a type that does not advertise a timeout, so callers can
 * treat "no entry" and "entry with no semantic" the same way.
 *
 * @param {string} nodeType - Node type key (e.g. "click").
 * @returns {object|null} Capability, or null when the type has no timeout.
 */
export function getTimeoutCapability(nodeType) {
  const semantic = NODE_TYPE_SEMANTICS[nodeType];
  if (!semantic) return null;

  const defaults = SEMANTIC_DEFAULTS[semantic];
  if (!defaults) return null;

  return {
    nodeType,
    semantic,
    ...defaults,
    // The field is rendered behind "advanced" where it was already, so a node
    // type that gained the timeout does not grow an always-visible control.
    advanced: false,
    labelKey: `nodes.fields.timeout.${semantic}`,
    helpKey: `nodes.fieldHelp.timeout.${semantic}`,
    ...NODE_TYPE_OVERRIDES[nodeType],
  };
}

/**
 * Whether a node type should preserve a `timeout` value through
 * cleanNodeConfiguration, and therefore whether it may advertise the field.
 *
 * @param {string} nodeType - Node type key.
 * @returns {boolean}
 */
export function canConfigureTimeout(nodeType) {
  return getTimeoutCapability(nodeType) !== null;
}

/**
 * Every node type that can be given a timeout.
 *
 * @returns {string[]}
 */
export function timeoutCapableNodeTypes() {
  return Object.keys(NODE_TYPE_SEMANTICS);
}

/**
 * Builds the NODE_INPUTS field definition for a node type's timeout.
 *
 * The panel reads `t("nodes.fields." + field.key, field.label)`, so `key`
 * stays "timeout" for backwards compatibility with stored flows and existing
 * i18n lookups; `labelKey` is the semantic-specific key that a later phase
 * prefers when present.
 *
 * @param {string} nodeType - Node type key.
 * @returns {object|null} A field definition, or null when the type has none.
 */
export function timeoutFieldDefinition(nodeType) {
  const capability = getTimeoutCapability(nodeType);
  if (!capability) return null;

  return {
    key: "timeout",
    label: "Timeout (ms)",
    labelKey: capability.labelKey,
    helpKey: capability.helpKey,
    type: "number",
    semantic: capability.semantic,
    consumer: capability.consumer,
    min: capability.min,
    max: capability.max,
    step: capability.step,
    unit: capability.unit,
    guardrail: capability.guardrail ?? null,
    advanced: capability.advanced,
  };
}
