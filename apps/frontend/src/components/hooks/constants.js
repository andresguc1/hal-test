// ========================================
// CONSTANTES DE CONFIGURACIÓN
// ========================================

/**
 * Mapping of node types to English labels
 */
export const NODE_LABELS = {
  // Basic Navigation
  open_url: "Open URL",
  close_browser: "Close Browser",
  go_back: "Go Back",
  go_forward: "Go Forward",
  refresh: "Refresh Page",

  // Browser Configuration
  resize_viewport: "Resize Viewport",
  browser_dialog: "Browser Dialog",
  launch_browser: "Launch Browser",
  manage_tabs: "Manage Tabs",

  // Element Interaction
  find_element: "Find Element",
  get_set_content: "Modify Text/Attr",
  assert_page_text: "Assert Page Contains Text",
  assert: "Assert",
  click: "Click",
  type_text: "Type Text",
  fill_form: "Fill Form",
  select_option: "Select Options",
  set_checkbox: "Set Checkbox",
  set_radio: "Select Radio",
  pick_list_option: "Pick List Option",
  scroll: "Scroll",
  hover: "Hover",
  drag_drop: "Drag & Drop",
  upload_file: "Upload Files",

  // Utilities
  pause: "Pause (Sleep)",
  wait_conditional: "Wait (Delay)",
  take_screenshot: "Take Screenshot",
  extract_text: "Extract Text",
  execute_script: "Execute JavaScript",
  execute_js: "Execute JavaScript",
  wait_navigation: "Wait Navigation",
  wait_visible: "Wait Element",
  wait_network: "Wait Network Idle",
  wait_network_match: "Wait Network Match",
  reload_page: "Reload Page",
  wait_for_element: "Wait Element (Adv)",

  // Diagnostics
  save_dom: "Save DOM",
  log_errors: "Log Errors",
  listen_events: "Listen Events",

  // Network Control
  intercept_request: "Intercept Request",
  mock_response: "Mock Response",
  block_resource: "Block Resource",
  modify_headers: "Modify Headers",
  wait_for_response: "Wait for Response",
  wait_for_request: "Wait for Request",
  set_network_conditions: "Network Conditions",
  clear_all_mocks: "Clear Mocks",

  // Session Management
  manage_cookies: "Manage Cookies",
  manage_storage: "Manage Storage",
  inject_tokens: "Inject Tokens",
  persist_session: "Persist Session",

  // Test Execution
  create_context: "Create Context",
  cleanup_state: "Cleanup State",
  handle_hooks: "Handle Hooks",
  control_exceptions: "Handle Exceptions",

  // Data and Files
  read_data: "Read Data",
  save_results: "Save Results",
  handle_downloads: "Handle Downloads",

  // IA / LLM
  call_llm: "Ask AI (Text)",
  generate_data: "Generate Data (AI)",
  validate_semantic: "Semantic Validation",
  extract_dom_context: "Extract DOM Context",
  extract: "Extract Data",
  save_dataset: "Save Dataset",
  chain_of_thought: "Chain of Thought (Reasoning)",
  smart_selector: "Smart Selector (Auto-Repair)",

  // Execution Interface
  run_tests: "Run Tests",
  cli_params: "CLI Params",
  return_code: "Return Code",
  integrate_ci: "CI/CD Integration",

  // Flow Control
  variable: "Variable",
  conditional: "Conditional",
  switch: "Switch",
  loop: "Loop",
  for_each: "ForEach",
  backend_js: "Backend JS",
  fail_flow: "Fail Flow",
};

/**
 * Node categories for the creation panel
 */
export const NODE_CATEGORIES = {
  navigation: {
    label: "Navigation",
    icon: "🧭",
    nodes: ["open_url", "go_back", "go_forward", "refresh", "close_browser"],
  },
  browser: {
    label: "Browser",
    icon: "🌐",
    nodes: [
      "launch_browser",
      "resize_viewport",
      "manage_tabs",
      "browser_dialog",
    ],
  },
  interaction: {
    label: "Interaction",
    icon: "👆",
    nodes: [
      "click",
      "type_text",
      "select_option",
      "set_checkbox",
      "set_radio",
      "pick_list_option",
      "scroll",
      "hover",
      "find_element",
    ],
  },
  utilities: {
    label: "Utilities",
    icon: "🔧",
    nodes: [
      "pause",
      "wait_conditional",
      "take_screenshot",
      "extract_text",
      "execute_script",
    ],
  },
  // NUEVA CATEGORÍA
  llm_ai: {
    label: "AI Models",
    icon: "🧠",
    nodes: [
      "call_llm",
      "generate_data",
      "validate_semantic",
      "extract_dom_context",
      "chain_of_thought",
      "smart_selector",
    ],
  },
  // Flow Control Category
  flow_control: {
    label: "Flow Control",
    icon: "🔀",
    nodes: ["variable"],
  },
};

/**
 * Visual-change nodes that automatically capture screenshots
 * These nodes produce significant visual changes and should always capture
 */
export const VISUAL_CHANGE_NODES = new Set([
  "open_url",
  "click",
  "type_text",
  "get_set_content", // Captura screenshot en operaciones SET para validar cambios visuales
  "submit_form",
  "drag_drop",
  "upload_file",
  "scroll",
  "manage_tabs", // Capture screenshot to show tab management result
  "select_option",
  "set_checkbox",
  "set_radio",
  "pick_list_option",
  "wait_visible",
  "take_screenshot",
]);

/**
 * Screenshot timing recommendations by node type
 * Defines delays for optimal screenshot capture after action completion
 */
export const SCREENSHOT_RECOMMENDATIONS = {
  // High priority - Visual changes (automatic capture)
  open_url: { priority: "high", delay: { after: 1000 } },
  click: { priority: "high", delay: { after: 500 } },
  type_text: { priority: "high", delay: { after: 200 } },
  wait_visible: { priority: "high", delay: { after: 500 } },
  submit_form: { priority: "high", delay: { after: 1500 } },
  drag_drop: { priority: "high", delay: { after: 300 } },
  upload_file: { priority: "high", delay: { after: 500 } },
  scroll: { priority: "high", delay: { after: 300 } },

  // Medium priority - May cause visual changes
  select_option: { priority: "medium", delay: { after: 200 } },
  set_checkbox: { priority: "medium", delay: { after: 200 } },
  set_radio: { priority: "medium", delay: { after: 200 } },
  pick_list_option: { priority: "medium", delay: { after: 300 } },
  execute_script: { priority: "medium", delay: { after: 300 } },
  hover: { priority: "medium", delay: { after: 200 } },

  // Medium priority - Conditional changes

  go_back: {
    defaultTiming: "both",
    priority: "medium",
    delay: { before: 0, after: 800 },
  },
  go_forward: {
    defaultTiming: "both",
    priority: "medium",
    delay: { before: 0, after: 800 },
  },
  refresh: {
    defaultTiming: "both",
    priority: "medium",
    delay: { before: 0, after: 1000 },
  },
  manage_tabs: {
    defaultTiming: "after",
    priority: "medium",
    delay: { before: 0, after: 500 },
  },

  // Low priority - No visual changes
  launch_browser: { defaultTiming: null, priority: "low", enabled: false },
  close_browser: { defaultTiming: null, priority: "low", enabled: false },
  resize_viewport: {
    defaultTiming: "after",
    priority: "low",
    delay: { before: 0, after: 200 },
  },
  find_element: { defaultTiming: null, priority: "low", enabled: false },
  wait_conditional: { defaultTiming: null, priority: "low", enabled: false },
  extract_text: { defaultTiming: null, priority: "low", enabled: false },
};

/**
 * Configuración de colores para estados de nodos
 */
export const NODE_STATE_COLORS = {
  default: {
    background: "#2C2F33",
    border: "#B0B0B0",
    text: "#E5E5E5",
  },
  selected: {
    background: "#3A3E44",
    border: "#1A73E8",
    text: "#E5E5E5",
  },
  executed: {
    background: "#1A73E8",
    border: "#FF8C32",
    text: "#FFFFFF",
  },
  error: {
    background: "#FF2E2E",
    border: "#8B0000",
    text: "#FFFFFF",
  },
};

/**
 * Configuración de ReactFlow
 */
export const REACTFLOW_CONFIG = {
  defaultEdgeOptions: {
    animated: !import.meta.env.DEV,
    style: { stroke: "#1A73E8", strokeWidth: 2 },
  },
  connectionLineStyle: { stroke: "#1A73E8", strokeWidth: 2 },
  nodeOrigin: [0.5, 0.5],
  minZoom: 0.1,
  maxZoom: 2,
  defaultViewport: { x: 0, y: 0, zoom: 1.0 }, // Zoomed out to see more nodes
};

/**
 * Configuración de posicionamiento de nodos
 */
export const NODE_POSITION_CONFIG = {
  initial: { x: 200, y: 100 },
  offset: 30,
  gridSnap: 15,
};

/**
 * Configuración de almacenamiento
 */
export const STORAGE_KEYS = {
  SAVED_FLOW: "browserflow_saved",
  RECENT_FLOWS: "browserflow_recent",
  USER_PREFERENCES: "browserflow_preferences",
};
/**
 * Mapping of node types to their category key.
 * Used to determine the category color for each node.
 */
export const NODE_TYPE_TO_CATEGORY = {
  // Browser Management
  launch_browser: "browser_management",
  open_url: "browser_management",
  close_browser: "browser_management",
  manage_tabs: "browser_management",
  resize_viewport: "browser_management",
  browser_dialog: "browser_management",
  go_back: "browser_management",
  go_forward: "browser_management",

  // DOM Manipulation
  find_element: "dom_manipulation",
  get_set_content: "dom_manipulation",
  wait_for_element: "dom_manipulation",
  execute_js: "dom_manipulation",
  assert_page_text: "dom_manipulation",
  assert: "dom_manipulation",

  // User Simulation
  click: "user_simulation",
  type_text: "user_simulation",
  select_option: "user_simulation",
  set_checkbox: "user_simulation",
  set_radio: "user_simulation",
  pick_list_option: "user_simulation",
  submit_form: "user_simulation",
  scroll: "user_simulation",
  drag_drop: "user_simulation",
  upload_file: "user_simulation",

  // Synchronization
  pause: "synchronization",
  wait_visible: "synchronization",
  wait_navigation: "synchronization",
  wait_network: "synchronization",
  wait_conditional: "synchronization",

  // Diagnostics
  take_screenshot: "diagnostics",
  save_dom: "diagnostics",
  log_errors: "diagnostics",
  listen_events: "diagnostics",

  // Network Control
  intercept_request: "network_control",
  mock_response: "network_control",
  block_resource: "network_control",
  modify_headers: "network_control",
  wait_for_response: "network_control",
  wait_for_request: "network_control",
  set_network_conditions: "network_control",
  clear_all_mocks: "network_control",

  // Session Management
  manage_cookies: "session_management",
  manage_storage: "session_management",
  inject_tokens: "session_management",
  persist_session: "session_management",

  // Test Execution
  create_context: "test_execution",
  cleanup_state: "test_execution",
  handle_hooks: "test_execution",
  control_exceptions: "test_execution",

  // File Data
  read_data: "file_data",
  save_results: "file_data",
  handle_downloads: "file_data",

  // LLM AI
  call_llm: "llm_ai",
  generate_data: "llm_ai",
  validate_semantic: "llm_ai",

  // Execution Interface
  run_tests: "execution_interface",
  cli_params: "execution_interface",
  return_code: "execution_interface",
  integrate_ci: "execution_interface",

  // Flow Control
  variable: "flow_control",
};
