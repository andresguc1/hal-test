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
  launch_browser: "Launch Browser",
  manage_tabs: "Manage Tabs",

  // Element Interaction
  find_element: "Find Element",
  get_set_content: "Modify Text/Attr",
  click: "Click",
  type_text: "Type Text",
  select_option: "Select Options",
  scroll: "Scroll",
  hover: "Hover",
  drag_drop: "Drag & Drop",
  upload_file: "Upload Files",

  // Utilities
  wait_conditional: "Wait (Delay)",
  take_screenshot: "Take Screenshot",
  extract_text: "Extract Text",
  execute_script: "Execute JavaScript",
  execute_js: "Execute JavaScript",
  wait_navigation: "Wait Navigation",
  wait_visible: "Wait Element",
  wait_network: "Network Response",
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
  call_llm: "LLM Call",
  generate_data: "Generate Data (AI)",
  validate_semantic: "Semantic Validation",

  // Execution Interface
  run_tests: "Run Tests",
  cli_params: "CLI Params",
  return_code: "Return Code",
  integrate_ci: "CI/CD Integration",
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
    nodes: ["launch_browser", "resize_viewport", "manage_tabs"],
  },
  interaction: {
    label: "Interaction",
    icon: "👆",
    nodes: [
      "click",
      "type_text",
      "select_option",
      "scroll",
      "hover",
      "find_element",
    ],
  },
  utilities: {
    label: "Utilities",
    icon: "🔧",
    nodes: [
      "wait_conditional",
      "take_screenshot",
      "extract_text",
      "execute_script",
    ],
  },
  // NUEVA CATEGORÍA
  llm_ai: {
    label: "AI Models (LLM)",
    icon: "🧠",
    nodes: ["call_llm", "generate_data", "validate_semantic"],
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
 * Field configuration by node type
 */
export const NODE_FIELD_CONFIGS = {
  open_url: [
    {
      name: "url",
      label: "URL",
      type: "text",
      placeholder: "https://example.com",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.config.url_required");
        try {
          new URL(value);
          return null;
        } catch {
          return t("common.invalid_url");
        }
      },
    },
    {
      name: "waitUntil",
      label: "Wait delivery condition",
      type: "select",
      options: [
        { value: "load", label: "Full load (Load: Resources and images)" },
        { value: "domcontentloaded", label: "DOM ready (DOMContentLoaded)" },
        { value: "networkidle", label: "Network inactive (NetworkIdle)" },
        { value: "commit", label: "Navigation confirmed (Commit)" },
      ],
      // 'load' is the default value if you want to replicate the old 'waitForLoad: true'
      defaultValue: "load",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 30000. Max navigation time.",
      // 30000 ms (30 seconds) is Playwright's default value
      defaultValue: 30000,
      min: 0,
    },
  ],

  resize_viewport: [
    {
      name: "width",
      label: "Width (px)",
      type: "number",
      defaultValue: 1024,
      required: true,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.width_number");
        if (Number(v) <= 0) return t("nodes.validation.width_min");
        return null;
      },
    },
    {
      name: "height",
      label: "Height (px)",
      type: "number",
      defaultValue: 768,
      required: true,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.height_number");
        if (Number(v) <= 0) return t("nodes.validation.height_min");
        return null;
      },
    },

  ],

  click: [
    {
      name: "selector",
      label: "Selector",
      type: "text",
      placeholder: '#some-element or //button[@id="submit"]',
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.selector_required");
        return null;
      },
    },
    {
      name: "button",
      label: "Mouse button",
      type: "select",
      defaultValue: "left",
      options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
        { value: "middle", label: "Middle" },
      ],
    },

  ],

  type_text: [
    {
      name: "selector",
      label: "Selector",
      type: "text",
      placeholder: '#username-field or //input[@id="user"]',
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.selector_required");
        return null;
      },
    },
    {
      name: "text",
      label: "Text to enter",
      type: "text",
      placeholder: "Ex: my_user@domain.com",
      required: true,
      validation: (v, allParams, t) => {
        if (v === null || v === undefined)
          return t("nodes.validation.text_required");
        return null;
      },
    },
    {
      name: "clearBeforeType",
      label: "Clear before typing",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "delay",
      label: "Key delay (ms)",
      type: "number",
      defaultValue: 0,
      placeholder: "0 (type fast) or 50 (type slow)",
      validation: (v, allParams, t) => {
        const num = Number(v);
        if (v === "" || v === undefined || Number.isNaN(num))
          return t("nodes.validation.delay_int");
        if (!Number.isInteger(num)) return t("nodes.validation.delay_int");
        if (num < 0) return t("nodes.validation.delay_min");
        return null;
      },
    },
    {
      name: "timeout",
      label: "Maximum timeout (ms)",
      type: "number",
      defaultValue: 30000,
      validation: (v, allParams, t) => {
        const num = Number(v);
        if (v === "" || v === undefined || Number.isNaN(num))
          return t("nodes.validation.timeout_int");
        if (!Number.isInteger(num)) return t("nodes.validation.timeout_int");
        if (num < 1) return t("nodes.validation.timeout_min_1");
        return null;
      },
    },

  ],

  select_option: [
    {
      name: "selector",
      label: "Dropdown Selector (<select>)",
      type: "text",
      placeholder: "Ex: #country-dropdown or select[name='country']",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.select_selector_required");
        return null;
      },
      hint: "Must be the selector of the main <select> element, not the <option> elements.",
    },
    {
      name: "selectionCriteria",
      label: "Selection Criteria",
      type: "select",
      options: [
        { value: "value", label: "By Value ('value' attribute)" },
        { value: "label", label: "By Label (visible text)" },
        { value: "index", label: "By Index (position, starting at 0)" },
      ],
      defaultValue: "value",
      required: true,
      hint: "Defines how Playwright should search for the option to select.",
    },
    {
      name: "selectionValue",
      label: "Value to Select",
      type: "text",
      placeholder:
        "Ex: 'EN' if criteria is Value, or 'English' if Label, or '2' if Index.",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.selection_value_required");
        return null;
      },
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 15000",
      defaultValue: 30000,
      min: 1,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.timeout_min_1");
        return null;
      },
    },
  ],

  submit_form: [
    {
      name: "selector",
      label: "Form or Submit Button Selector",
      type: "text",
      placeholder: "Ex: form#login-form or button[type='submit']",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.selector_required");
        return null;
      },
      hint: "Must be the selector of the <form> element or the button that triggers the submission.",
    },
    {
      name: "waitForNavigation",
      label: "Wait for Navigation?",
      type: "boolean",
      defaultValue: true,
      required: true,
      hint: "If active, waits for page to load after form submission. Disable if using AJAX.",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 60000",
      defaultValue: 30000,
      min: 1,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.timeout_min_1");
        return null;
      },
    },
  ],

  scroll: [
    {
      name: "selector",
      label: "Container Selector (Optional)",
      type: "text",
      placeholder:
        "Ex: #scroll-container. If empty, scrolls the entire page.",
      required: false,
      hint: "Leave empty to scroll main window. Use a selector for a specific element.",
    },
    {
      name: "direction",
      label: "Scroll Direction",
      type: "select",
      options: [
        { value: "down", label: "Down" },
        { value: "up", label: "Up" },
        { value: "right", label: "Right" },
        { value: "left", label: "Left" },
      ],
      defaultValue: "down",
      required: true,
      hint: "The direction in which content scrolls.",
    },
    {
      name: "amount",
      label: "Pixel Amount",
      type: "number",
      placeholder: "Ex: 500",
      defaultValue: 100,
      min: 1,
      required: true,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.scroll_amount_min");
        return null;
      },
      hint: "Pixels to scroll in the specified direction.",
    },
    {
      name: "behavior",
      label: "Behavior",
      type: "select",
      options: [
        { value: "auto", label: "Immediate (Auto)" },
        { value: "smooth", label: "Smooth" },
      ],
      defaultValue: "auto",
      required: true,
    },
  ],

  drag_drop: [
    {
      name: "sourceSelector",
      label: "Source Selector (Element to Drag)",
      type: "text",
      placeholder: "Ex: #draggable-item",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.source_selector_required");
        return null;
      },
    },
    {
      name: "targetSelector",
      label: "Target Selector (Element to Drop)",
      type: "text",
      placeholder: "Ex: #droppable-area",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.target_selector_required");
        return null;
      },
    },
    {
      name: "steps",
      label: "Animation Steps",
      type: "number",
      placeholder: "Ex: 20",
      defaultValue: 10,
      min: 1,
      required: true,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.steps_min");
        return null;
      },
      hint: "Steps for mouse movement simulation. More steps = smoother animation.",
    },
    {
      name: "force",
      label: "Force Action?",
      type: "boolean",
      defaultValue: false,
      required: true,
      hint: "If active, ignores visibility checks before dragging.",
    },
  ],

  upload_file: [
    {
      name: "selector",
      label: "File Input Selector",
      type: "text",
      placeholder: "Ex: input[type='file'] or #file-upload-input",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.file_selector_required");
        return null;
      },
    },
    {
      name: "files",
      label: "File Paths (Comma separated)",
      type: "textarea", // Use textarea for multiple paths
      placeholder: "Ex: /path/to/file1.pdf, /path/to/file2.png",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return t("nodes.validation.file_paths_required");
        return null;
      },
      hint: "Paths must be accessible from the backend environment.",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 45000",
      defaultValue: 30000,
      min: 1,
      required: true,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.timeout_min_1");
        return null;
      },
    },
  ],

  wait_visible: [
    {
      name: "selector",
      label: "Selector",
      type: "text",
      placeholder: '#ready-confirmation-modal or //div[@id="modal"]',
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.selector_required");
        return null;
      },
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 15000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) < 0) return t("nodes.validation.timeout_min");
        return null;
      },
    },
    {
      name: "scrollIntoView",
      label: "Scroll element into view before waiting",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  wait_navigation: [
    {
      name: "waitUntil",
      label: "Wait until",
      type: "select",
      defaultValue: "networkidle",
      options: [
        { value: "load", label: "load" },
        { value: "domcontentloaded", label: "domcontentloaded" },
        { value: "networkidle", label: "networkidle" },
      ],
      required: true,
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 10000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) <= 0) return t("nodes.validation.timeout_min_1");
        return null;
      },
    },

  ],

  wait_network: [
    {
      name: "idleTime",
      label: "Idle time (ms)",
      type: "number",
      defaultValue: 1000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.idletime_number");
        if (Number(v) < 0) return t("nodes.validation.idletime_min");
        return null;
      },
    },
    {
      name: "includeResources",
      label: "Include resources (resource requests)",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  wait_conditional: [
    {
      name: "conditionScript",
      label: "Condition Script (JS)",
      type: "textarea",
      placeholder: "return window.isDataLoaded === true;",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return t("nodes.validation.condition_script_required");
        return null;
      },
    },
    {
      name: "polling",
      label: "Polling (ms)",
      type: "number",
      defaultValue: 500,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.polling_number");
        if (Number(v) <= 0) return t("nodes.validation.polling_min_1");
        return null;
      },
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 20000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) <= 0) return t("nodes.validation.timeout_min_1");
        return null;
      },
    },

  ],

  take_screenshot: [
    {
      name: "selector",
      label: "Element Selector (Optional)",
      type: "text",
      placeholder: "Ex: #my-banner. If empty, captures the page/viewport.",
      required: false,
      hint: "Leave empty to capture entire window or page.",
    },
    {
      name: "fullPage",
      label: "Capture Full Page?",
      type: "boolean",
      defaultValue: false,
      required: true,
      hint: "If active, captures full page length. Ignored if selector used.",
    },
    {
      name: "format",
      label: "Image Format",
      type: "select",
      options: [
        { value: "png", label: "PNG (Lossless, default)" },
        { value: "jpeg", label: "JPEG (Compressed, allows quality)" },
      ],
      defaultValue: "png",
      required: true,
    },
    {
      name: "quality",
      label: "Quality (1-100)",
      type: "number",
      placeholder: "100",
      defaultValue: 100,
      min: 1,
      max: 100,
      required: true,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && (value < 1 || value > 100))
          return "Quality must be between 1 and 100.";
        return null;
      },
      // Conditional visibility: only show if format is jpeg
      conditional: {
        field: "format",
        is: "jpeg",
      },
      hint: "Only applies if format is JPEG.",
    },
    {
      name: "path",
      label: "Save Path (Optional)",
      type: "text",
      placeholder: "Ex: ./screenshots/login.png",
      required: false,
      hint: "Path on server. If empty, returns image in response.",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 45000",
      defaultValue: 30000,
      min: 1,
      required: true,
    },
  ],

  save_dom: [
    {
      name: "selector",
      label: "Element Selector (Optional)",
      type: "text",
      placeholder: "Ex: #content-body. If empty, saves the complete DOM.",
      required: false,
      hint: "Leave empty to save the entire HTML content of the page.",
    },
    {
      name: "path",
      label: "File Save Path (Optional)",
      type: "text",
      placeholder: "Ex: ./snapshots/homepage.html",
      required: false,
      hint: "If empty, DOM saves to variable. (Default: storages/dom_snapshots/)",
      validation: (value, allParams, t) => {
        if (!allParams.variableName && (!value || value.trim() === "")) {
          return t("nodes.validation.path_or_var_required");
        }
        return null;
      },
    },
    {
      name: "variableName",
      label: "Output Variable Name",
      type: "text",
      placeholder: "Ex: html_content",
      required: false,
      // Visibility/Conditional requirement logic
      conditional: {
        field: "path",
        is: null, // If path is empty or null
      },
      validation: (value, allParams, t) => {
        // Replicating Joi logic: if path is not present or is empty, variableName is mandatory.
        if (!allParams.path && (!value || value.trim() === "")) {
          return t("nodes.validation.var_or_path_required");
        }
        return null;
      },
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 30000",
      defaultValue: 30000,
      min: 1,
      required: true,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.timeout_min_1");
        return null;
      },
    },
  ],

  log_errors: [
    {
      name: "logToFile",
      label: "Log Errors to File?",
      type: "boolean",
      defaultValue: false,
      required: true,
      hint: "If active, logs save to file. Otherwise, only printed to backend console.",
    },
    {
      name: "filePath",
      label: "Log File Path",
      type: "text",
      placeholder: "Ex: ./logs/errors-test.log",
      required: false,
      // Visibility/Conditional requirement logic
      conditional: {
        field: "logToFile",
        is: true,
      },
      validation: (value, allParams, t) => {
        // Replicating Joi logic: if logToFile is true, filePath is mandatory.
        if (allParams.logToFile === true && (!value || value.trim() === "")) {
          return t("nodes.validation.filepath_required_if_logging");
        }
        return null;
      },
      hint: "Full path for logs. (Default: storages/browser_logs/errors.log)",
    },
    {
      name: "timeout",
      label: "Listen duration (ms)",
      type: "number",
      placeholder: "0 (Undefined)",
      defaultValue: 0,
      min: 0,
      required: true,
      hint: "Time to listen for errors. 0 for indefinite.",
    },
  ],

  listen_events: [
    {
      name: "eventType",
      label: "Event type",
      type: "select",
      defaultValue: "click",
      options: [
        { value: "click", label: "click" },
        { value: "input", label: "input" },
        { value: "change", label: "change" },
        { value: "submit", label: "submit" },
        { value: "custom", label: "custom" },
      ],
      required: true,
    },
    {
      name: "selector",
      label: "Selector (where to listen)",
      type: "text",
      placeholder: "#checkout-button (or leave empty for document)",
      required: false,
    },
    {
      name: "logToFile",
      label: "Log events to file",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "filePath",
      label: "File path (if logToFile=true)",
      type: "text",
      placeholder: "Ex: /path/logs/monitored_clicks.txt",
      defaultValue: "",
    },
    {
      name: "timeout",
      label: "Timeout (ms) — how long to listen",
      type: "number",
      defaultValue: 60000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) <= 0) return t("nodes.validation.timeout_min_1");
        return null;
      },
    },


  ],

  intercept_request: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/users/login",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "urlPattern is required" : null,
    },
    {
      name: "method",
      label: "HTTP Method",
      type: "select",
      defaultValue: "POST",
      options: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "DELETE", label: "DELETE" },
        { value: "PATCH", label: "PATCH" },
        { value: "ALL", label: "ALL" },
      ],
    },
    {
      name: "action",
      label: "Request action",
      type: "select",
      defaultValue: "mock",
      options: [
        { value: "mock", label: "mock (respond with simulated payload)" },
        { value: "block", label: "block (block the request)" },
        { value: "modify", label: "modify (modify request/response)" },
      ],
    },
    {
      name: "responseMock",
      label: "Response mock (JSON string)",
      type: "textarea",
      placeholder: '{"success": false, "message": "Simulated failure"}',
      defaultValue: "",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 60000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) < 0) return t("nodes.validation.timeout_min");
        return null;
      },
    },


  ],

  mock_response: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v1/products/*",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.url_pattern_required");
        return null;
      },
    },
    {
      name: "method",
      label: "HTTP Method",
      type: "select",
      defaultValue: "GET",
      options: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "DELETE", label: "DELETE" },
        { value: "ALL", label: "ALL (Any)" },
      ],
    },
    {
      name: "status",
      label: "Status Code",
      type: "number",
      defaultValue: 200,
      required: true,
      validation: (v, allParams, t) => {
        if (!v || Number.isNaN(Number(v)) || !Number.isInteger(Number(v)))
          return t("nodes.validation.status_int");
        if (Number(v) < 100 || Number(v) > 599)
          return t("nodes.validation.status_range");
        return null;
      },
    },
    {
      name: "responseBody",
      label: "Response Body (JSON/Text)",
      type: "textarea",
      placeholder: '{"data": "mocked response"}',
      required: true,
    },
    {
      name: "headers",
      label: "Headers (JSON String)",
      type: "textarea",
      placeholder: '{"Content-Type": "application/json"}',
    },
    {
      name: "timeout",
      label: "Mock duration (ms) — 0 = persistent",
      type: "number",
      defaultValue: 120000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) < 0) return t("nodes.validation.timeout_min");
        return null;
      },
    },


  ],

  block_resource: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "https://tracking.analytics.com/**",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.url_pattern_required");
        return null;
      },
    },
    {
      name: "resourceType",
      label: "Resource Type",
      type: "select",
      defaultValue: "script",
      options: [
        { value: "document", label: "document" },
        { value: "script", label: "script" },
        { value: "image", label: "image" },
        { value: "stylesheet", label: "stylesheet" },
        { value: "xhr", label: "xhr" },
        { value: "fetch", label: "fetch" },
        { value: "media", label: "media" },
        { value: "font", label: "font" },
        { value: "other", label: "other" },
      ],
    },
    {
      name: "timeout",
      label: "Timeout (ms) — 0 = immediate",
      type: "number",
      defaultValue: 0,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) < 0) return t("nodes.validation.timeout_min");
        return null;
      },
    },


  ],

  modify_headers: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v1/*",
      required: true,
    },
    {
      name: "headers",
      label: "Headers (JSON)",
      type: "textarea",
      placeholder: '{"Authorization": "Bearer TOKEN", "X-Test": "true"}',
      required: true,
    },
    {
      name: "method",
      label: "HTTP Method",
      type: "select",
      options: [
        { label: "Any", value: "" },
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "PATCH", value: "PATCH" },
        { label: "OPTIONS", value: "OPTIONS" },
      ],
      defaultValue: "",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "0 = indefinite",
      defaultValue: 0,
    },


  ],

  wait_for_response: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v1/user",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "urlPattern is required" : null,
    },
    {
      name: "statusCode",
      label: "Status Code (optional)",
      type: "number",
      placeholder: "200",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 30000,
    },
    {
      name: "saveToVariable",
      label: "Save response to variable (optional)",
      type: "text",
      placeholder: "responseVar",
    },

  ],

  wait_for_request: [
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/analytics",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "urlPattern is required" : null,
    },
    {
      name: "method",
      label: "Method (optional)",
      type: "select",
      options: [
        { label: "Any", value: "" },
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
      defaultValue: "",
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 30000,
    },

  ],

  set_network_conditions: [
    {
      name: "profile",
      label: "Network Profile",
      type: "select",
      defaultValue: "No throttling",
      options: [
        { value: "No throttling", label: "No throttling" },
        { value: "WiFi fast", label: "WiFi fast" },
        { value: "WiFi slow", label: "WiFi slow" },
        { value: "4G", label: "4G" },
        { value: "Fast 3G", label: "Fast 3G" },
        { value: "Slow 3G", label: "Slow 3G" },
        { value: "2G", label: "2G" },
        { value: "High Latency", label: "High Latency" },
        { value: "Custom", label: "Custom" },
      ],
      required: true,
    },
    {
      name: "offline",
      label: "Offline (overrides profile)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "latency",
      label: "Latency (ms) [Custom]",
      type: "number",
      defaultValue: 0,
      conditional: { field: "profile", is: "Custom" },
    },
    {
      name: "downloadThroughput",
      label: "Download (bytes/sec) [Custom]",
      type: "number",
      defaultValue: -1,
      min: -1,
      conditional: { field: "profile", is: "Custom" },
    },
    {
      name: "uploadThroughput",
      label: "Upload (bytes/sec) [Custom]",
      type: "number",
      defaultValue: -1,
      min: -1,
      conditional: { field: "profile", is: "Custom" },
    },

  ],

  clear_all_mocks: [

  ],

  manage_cookies: [
    {
      name: "action",
      label: "Action",
      type: "select",
      defaultValue: "set",
      options: [
        { value: "set", label: "set" },
        { value: "get", label: "get" },
        { value: "delete", label: "delete" },
        { value: "clear", label: "clear" },
      ],
      required: true,
    },
    {
      name: "cookiesData",
      label: "Cookies data (JSON string or empty)",
      type: "textarea",
      placeholder:
        '[{"name":"auth_token","value":"...","domain":"ejemplo.com","secure":true}]',
      defaultValue: "",
      // validación ligera: si acción= set o delete, debe existir algo
      validation: (v, form) => {
        if (
          (form.action === "set" || form.action === "delete") &&
          (!v || String(v).trim() === "")
        ) {
          return t("nodes.validation.cookies_data_required");
        }
        return null;
      },
    },


  ],

  manage_storage: [
    {
      name: "storageType",
      label: "Storage type",
      type: "select",
      defaultValue: "local",
      options: [
        { value: "local", label: "localStorage" },
        { value: "session", label: "sessionStorage" },
      ],
      required: true,
    },
    {
      name: "action",
      label: "Action",
      type: "select",
      defaultValue: "set",
      options: [
        { value: "set", label: "set" },
        { value: "get", label: "get" },
        { value: "remove", label: "remove" },
        { value: "clear", label: "clear" },
      ],
      required: true,
    },
    {
      name: "key",
      label: "Clave (key)",
      type: "text",
      placeholder: "userToken",
      defaultValue: "",
    },
    {
      name: "value",
      label: "Value (only for set)",
      type: "textarea",
      placeholder: "ABC-SESSION-XYZ-987",
      defaultValue: "",
    },


  ],

  inject_tokens: [
    {
      name: "target",
      label: "Target",
      type: "select",
      defaultValue: "header",
      options: [
        { value: "header", label: "header" },
        { value: "query", label: "query" },
        { value: "cookie", label: "cookie" },
      ],
      required: true,
    },
    {
      name: "key",
      label: "Clave (header / query param / cookie name)",
      type: "text",
      placeholder: "Authorization",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "Key is required" : null,
    },
    {
      name: "value",
      label: "Value (token)",
      type: "text",
      placeholder: "Bearer ASDF-123-QWER-987",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "Value is required" : null,
    },
    {
      name: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v2/*",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "urlPattern is required" : null,
    },


  ],

  persist_session: [
    {
      name: "action",
      label: "Action",
      type: "select",
      defaultValue: "save",
      options: [
        { value: "save", label: "Save session" },
        { value: "load", label: "Load session" },
        { value: "clear", label: "Clear session" },
      ],
      required: true,
    },
    {
      name: "path",
      label: "Session file path",
      type: "text",
      placeholder: "/data/admin_session_001.json",
      defaultValue: "",
      validation: (v, form) => {
        if (
          (form.action === "save" || form.action === "load") &&
          (!v || String(v).trim() === "")
        ) {
          return t("nodes.validation.session_path_required");
        }
        return null;
      },
    },
    {
      name: "includeLocalStorage",
      label: "Include Local Storage",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "includeSessionStorage",
      label: "Include Session Storage",
      type: "checkbox",
      defaultValue: false,
    },


  ],

  create_context: [

    {
      name: "storageState",
      label: "Storage state (file path, optional)",
      type: "text",
      placeholder: "data/mobile_auth.json",
      defaultValue: "",
    },
    {
      name: "viewportWidth",
      label: "Viewport width (px)",
      type: "number",
      defaultValue: 375,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.width_number");
        if (Number(v) <= 0) return t("nodes.validation.width_min");
        return null;
      },
    },
    {
      name: "viewportHeight",
      label: "Viewport height (px)",
      type: "number",
      defaultValue: 667,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.height_number");
        if (Number(v) <= 0) return t("nodes.validation.height_min");
        return null;
      },
    },
    {
      name: "userAgent",
      label: "User Agent (optional)",
      type: "text",
      placeholder: "Mozilla/5.0 (iPhone...)",
      defaultValue: "",
    },
    {
      name: "geolocation",
      label: "Geolocation (lat, lon) (optional)",
      type: "text",
      placeholder: "34.0522, -118.2437",
      defaultValue: "",
    },
    {
      name: "locale",
      label: "Locale",
      type: "text",
      placeholder: "en-US",
      defaultValue: "",
    },

  ],

  cleanup_state: [

    {
      name: "target",
      label: "Target",
      type: "select",
      defaultValue: "context",
      options: [
        { value: "context", label: "context" },
        { value: "page", label: "page" },
        { value: "browser", label: "browser" },
      ],
      required: true,
    },
    {
      name: "includeCookies",
      label: "Include cookies",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "includeLocalStorage",
      label: "Include localStorage",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "includeSessionStorage",
      label: "Include sessionStorage",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "includeIndexedDB",
      label: "Include IndexedDB",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "includePermissions",
      label: "Include permissions (geoloc, notifications...)",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  handle_hooks: [

    {
      name: "hookType",
      label: "Hook Type",
      type: "select",
      defaultValue: "afterAction",
      options: [
        { value: "beforeAction", label: "beforeAction" },
        { value: "afterAction", label: "afterAction" },
        { value: "onError", label: "onError" },
        { value: "onStart", label: "onStart" },
        { value: "onStop", label: "onStop" },
      ],
      required: true,
    },
    {
      name: "actionName",
      label: "Action Name (hook scope, optional)",
      type: "text",
      placeholder: "click / type_text / * (leave blank for all)",
      defaultValue: "",
    },
    {
      name: "callbackCode",
      label: "Callback code (JS)",
      type: "textarea",
      placeholder: "async (page, action, params, result) => { /* ... */ }",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === ""
          ? "Callback code is required"
          : null,
    },
    {
      name: "once",
      label: "Run once",
      type: "checkbox",
      defaultValue: false,
    },

  ],

  control_exceptions: [
    {
      name: "exceptionType",
      label: "Exception Type",
      type: "select",
      defaultValue: "elementNotFound",
      options: [
        { value: "all", label: "all" },
        { value: "navigation", label: "navigation" },
        { value: "timeout", label: "timeout" },
        { value: "elementNotFound", label: "elementNotFound" },
        { value: "network", label: "network" },
        { value: "custom", label: "custom" },
      ],
      required: true,
    },
    {
      name: "action",
      label: "Action on exception",
      type: "select",
      defaultValue: "retry",
      options: [
        { value: "ignore", label: "ignore" },
        { value: "log", label: "log" },
        { value: "retry", label: "retry" },
        { value: "abort", label: "abort" },
      ],
      required: true,
    },
    {
      name: "maxRetries",
      label: "Max retries (if action=retry)",
      type: "number",
      defaultValue: 3,
      validation: (v, form) => {
        if (form.action === "retry") {
          if (v === "" || v === undefined || Number.isNaN(Number(v)))
            return "maxRetries must be a number";
          if (Number(v) < 1)
            return "maxRetries must be at least 1 when action=retry";
        }
        return null;
      },
    },
    {
      name: "logFile",
      label: "Log path (required for log/retry)",
      type: "text",
      placeholder: "logs/reintentos_fallidos.txt",
      defaultValue: "",
      validation: (v, form) => {
        if (
          (form.action === "log" || form.action === "retry") &&
          (!v || String(v).trim() === "")
        ) {
          return "logFile is mandatory when action is log or retry";
        }
        return null;
      },
    },
  ],

  read_data: [

    {
      name: "sourceType",
      label: "Source Type",
      type: "select",
      defaultValue: "csv",
      options: [
        { value: "csv", label: "CSV" },
        { value: "json", label: "JSON" },
        { value: "txt", label: "Plain Text" },
      ],
      required: true,
    },
    {
      name: "path",
      label: "File Path",
      type: "text",
      placeholder: "data/test_users.csv",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return "File path is required";
        return null;
      },
    },
    {
      name: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "userList",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return "Variable name is required";
        return null;
      },
    },
    {
      name: "hasHeader",
      label: "File has header",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "encoding",
      label: "Encoding",
      type: "select",
      defaultValue: "utf-8",
      options: [
        { value: "utf-8", label: "UTF-8" },
        { value: "latin1", label: "Latin-1" },
        { value: "ascii", label: "ASCII" },
      ],
    },

  ],

  save_results: [

    {
      name: "destinationType",
      label: "Destination Type",
      type: "select",
      defaultValue: "json",
      options: [
        { value: "json", label: "JSON" },
        { value: "csv", label: "CSV" },
        { value: "txt", label: "Plain Text (TXT)" },
      ],
      required: true,
    },
    {
      name: "path",
      label: "Save Path",
      type: "text",
      placeholder: "reports/final_report.json",
      required: true,
    },
    {
      name: "dataVariableName",
      label: "Variable containing data",
      type: "text",
      placeholder: "finalReportObject",
      required: true,
    },
    {
      name: "encoding",
      label: "File encoding",
      type: "select",
      defaultValue: "utf-8",
      options: [
        { value: "utf-8", label: "UTF-8" },
        { value: "latin1", label: "Latin-1" },
        { value: "ascii", label: "ASCII" },
      ],
    },

  ],

  handle_downloads: [

    {
      name: "action",
      label: "Action",
      type: "select",
      defaultValue: "saveAndValidate",
      options: [
        { value: "save", label: "Save" },
        { value: "validate", label: "Validate existing file" },
        { value: "saveAndValidate", label: "Save and validate" },
        { value: "waitOnly", label: "Wait for download only" },
      ],
      required: true,
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 60000,
      validation: (v, allParams, t) => {
        if (v && (isNaN(Number(v)) || Number(v) < 0))
          return "Timeout must be a positive number";
        return null;
      },
    },
    {
      name: "path",
      label: "Destination Path (Download)",
      type: "text",
      placeholder: "reports/reporte_generado_hoy.pdf",
      defaultValue: "",
      required: true,
      validation: (v, allParams, t) =>
        !v || String(v).trim() === "" ? "File path (path) is required" : null,
    },
    {
      name: "expectedFileName",
      label: "Expected Filename",
      type: "text",
      placeholder: "reporte_de_ventas.pdf",
      defaultValue: "",
    },
    {
      name: "minSizeKB",
      label: "Minimum size (KB)",
      type: "number",
      defaultValue: 10,
      validation: (v, allParams, t) => {
        if (v && (isNaN(Number(v)) || Number(v) < 0))
          return "minSizeKB must be a positive number";
        return null;
      },
    },
    {
      name: "maxSizeKB",
      label: "Maximum size (KB)",
      type: "number",
      defaultValue: 5000,
      validation: (v, allParams, t) => {
        if (v && (isNaN(Number(v)) || Number(v) <= 0))
          return "maxSizeKB must be greater than 0";
        return null;
      },
    },

  ],

  call_llm: [

    {
      name: "model",
      label: "Modelo",
      type: "select",
      defaultValue: "gemini",
      options: [
        { value: "gemini", label: "gemini" },
        { value: "gpt4", label: "gpt4" },
        { value: "gpt4o", label: "gpt4o" },
        { value: "local", label: "local" },
      ],
      required: true,
    },
    {
      name: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Write the prompt for the model",
      required: true,
    },
    {
      name: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "adCopy",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return "Variable name is required";
        return null;
      },
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      defaultValue: 0.7,
      validation: (v, allParams, t) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || n > 2)
          return "Temperature must be between 0 and 2";
        return null;
      },
    },
    {
      name: "maxTokens",
      label: "Max tokens",
      type: "number",
      defaultValue: 150,
      validation: (v, allParams, t) => {
        const n = Number(v);
        if (Number.isNaN(n) || n <= 0)
          return "maxTokens must be a positive number";
        return null;
      },
    },

  ],

  generate_data: [

    {
      name: "model",
      label: "Modelo",
      type: "select",
      defaultValue: "gpt4",
      options: [
        { value: "gpt4", label: "gpt4" },
        { value: "gpt4o", label: "gpt4o" },
        { value: "gemini", label: "gemini" },
        { value: "local", label: "local" },
      ],
      required: true,
    },
    {
      name: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "Write the prompt you want to send to the model",
      required: true,
    },
    {
      name: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "mockedUsers",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return "Variable name is required";
        return null;
      },
    },
    {
      name: "expectedFormat",
      label: "Expected Format",
      type: "select",
      defaultValue: "json",
      options: [
        { value: "json", label: "json" },
        { value: "csv", label: "csv" },
        { value: "text", label: "text" },
      ],
    },
    {
      name: "temperature",
      label: "Temperature",
      type: "number",
      defaultValue: 0.7,
      validation: (v, allParams, t) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || n > 2)
          return "Temperature must be between 0 and 2";
        return null;
      },
    },

  ],

  validate_semantic: [

    {
      name: "model",
      label: "Modelo",
      type: "select",
      defaultValue: "gemini",
      options: [
        { value: "gemini", label: "gemini" },
        { value: "gpt-4o", label: "gpt-4o" },
        { value: "local", label: "local" },
      ],
      required: true,
    },
    {
      name: "sourceTextVariable",
      label: "Source text variable",
      type: "text",
      placeholder: "extracted_product_description",
      required: true,
    },
    {
      name: "validationPrompt",
      label: "Validation prompt",
      type: "textarea",
      placeholder: "Insert the validation prompt to be sent to the model",
      required: true,
    },
    {
      name: "expectedAnswer",
      label: "Expected answer",
      type: "text",
      placeholder: "APPROVED",
      required: true,
    },
    {
      name: "validationTimeout",
      label: "Validation timeout (ms)",
      type: "number",
      defaultValue: 15000,
    },

  ],

  run_tests: [

    {
      name: "testSuite",
      label: "Test / Suite Path",
      type: "text",
      placeholder: "tests/critical_flow.spec.js",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "")
          return "Test path is required";
        return null;
      },
    },
    {
      name: "parallel",
      label: "Run in parallel",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "retries",
      label: "Retries per failed test",
      type: "number",
      defaultValue: 0,
      validation: (v, allParams, t) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return "retries must be >= 0";
        return null;
      },
    },
    {
      name: "reportFormat",
      label: "Report format",
      type: "select",
      defaultValue: "junit",
      options: [
        { value: "junit", label: "junit" },
        { value: "html", label: "html" },
        { value: "json", label: "json" },
      ],
    },
    {
      name: "timeout",
      label: "Total timeout (ms)",
      type: "number",
      defaultValue: 900000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return "timeout must be a number";
        if (Number(v) <= 0) return "timeout must be greater than 0";
        return null;
      },
    },

  ],

  return_code: [

    {
      name: "successField",
      label: "Success field (dot notation)",
      type: "text",
      placeholder: "testResults.allTestsPassed",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return "successField is required";
        return null;
      },
    },
    {
      name: "exitOnFail",
      label: "Exit on failure",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "customCodes",
      label: "Custom codes (JSON string)",
      type: "textarea",
      placeholder: '{ "success": 0, "failed": 10, "warning": 5 }',
      defaultValue: '{ "success": 0, "failed": 10, "warning": 5 }',
    },
    {
      name: "verbose",
      label: "Verbose (logs detallados)",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  integrate_ci: [

    {
      name: "provider",
      label: "CI Provider",
      type: "select",
      defaultValue: "gitlab",
      options: [
        { value: "gitlab", label: "GitLab" },
        { value: "github", label: "GitHub" },
        { value: "jenkins", label: "Jenkins" },
        { value: "bitbucket", label: "Bitbucket" },
      ],
      required: true,
    },
    {
      name: "saveArtifacts",
      label: "Save artifacts",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "outputPath",
      label: "Output path (artifacts)",
      type: "text",
      placeholder: "gitlab-artifacts",
      defaultValue: "gitlab-artifacts",
    },
    {
      name: "uploadReports",
      label: "Upload reports",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "envVariables",
      label: "Env variables (JSON string)",
      type: "textarea",
      placeholder: '{ "CI_TEST_LEVEL": "E2E_FULL" }',
      defaultValue: '{ "CI_TEST_LEVEL": "E2E_FULL" }',
    },
    {
      name: "retryOnFail",
      label: "Retries on failure",
      type: "number",
      defaultValue: 0,
      validation: (v, allParams, t) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return "retryOnFail must be >= 0";
        return null;
      },
    },
    {
      name: "verbose",
      label: "Verbose (logs detallados)",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  find_element: [
    {
      name: "selector",
      label: "Selector",
      type: "text",
      placeholder: '#id-del-boton-principal or //button[text()="OK"]',
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.selector_required");
        return null;
      },
    },
    {
      name: "selectorType",
      label: "Selector Type",
      type: "select",
      defaultValue: "css",
      options: [
        { value: "css", label: "css" },
        { value: "xpath", label: "xpath" },
      ],
      required: true,
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      defaultValue: 10000,
      validation: (v, allParams, t) => {
        if (v === "" || v === undefined || Number.isNaN(Number(v)))
          return t("nodes.validation.timeout_number");
        if (Number(v) < 0) return t("nodes.validation.timeout_min");
        return null;
      },
    },
    {
      name: "visible",
      label: "Visible (wait for visible)",
      type: "checkbox",
      defaultValue: true,
    },

  ],

  get_set_content: [
    {
      name: "selector",
      label: "Selector",
      type: "text",
      placeholder: "#element or .class",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return t("nodes.validation.selector_required");
        return null;
      },
    },
    {
      name: "action",
      label: "Action",
      type: "select",
      defaultValue: "get",
      options: [
        { value: "get", label: "Obtener (GET)" },
        { value: "set", label: "Establecer (SET)" },
      ],
      required: true,
    },
    {
      name: "contentType",
      label: "Content Type",
      type: "select",
      defaultValue: "text",
      options: [
        { value: "text", label: "Text (textContent)" },
        { value: "html", label: "HTML (innerHTML)" },
        { value: "attribute", label: "HTML Attribute" },
      ],
      required: true,
      hint: "Specifies what type of content to get or set",
    },
    {
      name: "attribute",
      label: "Attribute Name",
      type: "text",
      placeholder: "src, href, data-id, value, etc.",
      conditional: {
        field: "contentType",
        is: "attribute",
      },
      validation: (value, allParams, t) => {
        if (
          allParams.contentType === "attribute" &&
          (!value || value.trim() === "")
        ) {
          return "Attribute name is required when 'HTML Attribute' is selected";
        }
        return null;
      },
      hint: "Name of the HTML attribute to get or modify",
    },
    {
      name: "value",
      label: "Value to Set",
      type: "textarea",
      placeholder: "New content or value",
      conditional: {
        field: "action",
        is: "set",
      },
      hint: "Content to be set. Can be empty string to clear.",
    },
    {
      name: "clearBeforeSet",
      label: "Clear before setting",
      type: "checkbox",
      defaultValue: true,
      conditional: {
        field: "action",
        is: "set",
      },
      hint: "If active, clears existing content before setting new value",
    },
  ],

  cli_params: [

    {
      name: "paramName",
      label: "Parameter Name (CLI)",
      type: "text",
      placeholder: "--targetEnv",
      required: true,
      validation: (v, allParams, t) => {
        if (!v || String(v).trim() === "") return "paramName is required";
        return null;
      },
    },
    {
      name: "paramType",
      label: "Parameter Type",
      type: "select",
      defaultValue: "string",
      options: [
        { value: "string", label: "string" },
        { value: "number", label: "number" },
        { value: "boolean", label: "boolean" },
        { value: "json", label: "json" },
      ],
      required: true,
    },
    {
      name: "defaultValue",
      label: "Default value",
      type: "text",
      placeholder: "staging",
      defaultValue: "",
    },
    {
      name: "required",
      label: "Required",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "validationCode",
      label: "Validation code (JS, optional)",
      type: "textarea",
      placeholder:
        "if (value !== 'dev' && value !== 'staging' && value !== 'prod') { throw new Error('Environment must be dev, staging or prod.'); }",
      defaultValue: "",
    },

  ],

  wait_for_element: [
    {
      name: "selector",
      label: "Selector (CSS/XPath)",
      type: "text",
      placeholder: "Ex: #my-id or .my-class",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return "Element selector is required.";
        return null; // Validación básica de no vacío, el backend hace el resto.
      },
    },
    {
      name: "condition",
      label: "Wait Condition",
      type: "select",
      options: [
        { value: "visible", label: "Visible (Appears on screen)" },
        { value: "hidden", label: "Hidden (Disappears from screen)" },
        { value: "attached", label: "Attached to DOM" },
        { value: "detached", label: "Detached from DOM" },
      ],
      defaultValue: "visible",
      required: true,
    },
    {
      name: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "Ex: 15000",
      defaultValue: 30000,
      min: 1,
      validation: (value, allParams, t) => {
        if (value !== undefined && value !== null && value < 1)
          return t("nodes.validation.timeout_min_1");
        return null;
      },
    },
  ],

  execute_js: [
    {
      name: "script",
      label: "JavaScript Code (function)",
      type: "textarea", // Usamos textarea para bloques de código
      placeholder: "Ex: () => { return document.title; }",
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return "JavaScript script is required.";
        return null;
      },
      hint: "The script must be an anonymous function. Ex: () => { /* your code */ }",
    },
    {
      name: "args",
      label: "Arguments (JSON)",
      type: "text",
      placeholder: "Ex: ['value1', 123, true] (must be JSON serializable)",
      required: false,
      hint: "Optional. Arguments that will be passed to the JavaScript function.",
    },
    {
      name: "returnValue",
      label: "Wait for return value?",
      type: "boolean",
      defaultValue: false,
      required: true,
      hint: "If active, the script result will be saved to a variable.",
    },
    {
      name: "variableName",
      label: "Output Variable Name",
      type: "text",
      placeholder: "Ex: page_title",
      // Lógica de visibilidad condicional en el frontend
      conditional: {
        field: "returnValue",
        is: true,
      },
      // Lógica de validación condicional en el frontend (replicando el Joi)
      validation: (value, allParams, t) => {
        if (allParams.returnValue === true && (!value || value.trim() === "")) {
          return "This field is required when 'Wait for return value' is active.";
        }
        return null;
      },
    },
  ],

  extract_text: [
    {
      name: "selector",
      label: "Selector CSS",
      type: "text",
      placeholder: ".content, #text",
      required: true,
    },
    {
      name: "variableName",
      label: "Save to variable",
      type: "text",
      placeholder: "myVariable",
      required: false,
    },
  ],

  execute_script: [
    {
      name: "script",
      label: "JavaScript Code",
      type: "textarea",
      placeholder: 'document.querySelector("...").click();',
      required: true,
      validation: (value, allParams, t) => {
        if (!value) return "Code is required";
        return null;
      },
    },
  ],

  launch_browser: [
    {
      name: "browserType",
      label: "Browser Type",
      type: "select",
      options: [
        { value: "chromium", label: "Chromium" },
        { value: "firefox", label: "Firefox" },
      ],
      defaultValue: "chromium",
      required: true,
    },
    {
      name: "headless",
      label: "Headless mode (no UI)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "maximizeWindow",
      label: "Start maximized",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "slowMo",
      label: "Slow down actions (ms)",
      type: "number",
      placeholder: "Ex: 50. Delays each action for debugging.",
      defaultValue: 0,
      min: 0,
    },
    {
      name: "args",
      label: "Browser arguments",
      type: "text",
      placeholder:
        "Ex: --start-maximized, --disable-notifications. Separate by commas.",
      // Note: In real implementation, this string must be converted to an array of strings.
    },
    {
      name: "executablePath",
      label: "Executable path (custom)",
      type: "text",
      placeholder:
        "Ex: /path/to/chrome.exe. Use custom browser executable.",
    },
    // Se podrían añadir más como 'timeout', 'devtools', o 'downloadsPath' si son necesarios.
  ],

  // manage_tabs: Usa UI personalizada en NodeConfigurationPanel.jsx (líneas 661-729)
  // No se definen campos aquí para evitar renderizado duplicado y permitir
  // control total sobre la visibilidad condicional de campos según la acción seleccionada
  manage_tabs: [],

  hover: [
    {
      name: "selector",
      label: "Selector CSS",
      type: "text",
      placeholder: ".menu-item",
      required: true,
    },
  ],

  refresh: [],
  close_browser: [
    {
      name: "forceClose",
      label: "Force close (forceClose)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "clearContext",
      label: "Clear context (clearContext)",
      type: "checkbox",
      defaultValue: true,
    },

  ],
  go_back: [

    // Eliminado: El campo "steps"
  ],

  go_forward: [

    // Eliminado: El campo "steps"
  ],
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
    animated: true,
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
  go_back: "browser_management",
  go_forward: "browser_management",

  // DOM Manipulation
  find_element: "dom_manipulation",
  get_set_content: "dom_manipulation",
  wait_for_element: "dom_manipulation",
  execute_js: "dom_manipulation",

  // User Simulation
  click: "user_simulation",
  type_text: "user_simulation",
  select_option: "user_simulation",
  submit_form: "user_simulation",
  scroll: "user_simulation",
  drag_drop: "user_simulation",
  upload_file: "user_simulation",

  // Synchronization
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
};
