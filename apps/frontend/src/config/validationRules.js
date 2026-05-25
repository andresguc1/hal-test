// apps/frontend/src/config/validationRules.js

/**
 * Unified NODE_INPUTS schema.
 * Defines available input fields for each node type and their validation rules.
 * This is the SOURCE OF TRUTH for both the Configuration Panel and the Execution Validator.
 */
export const NODE_INPUTS = {
  // --- BROWSER MANAGEMENT ---
  launch_browser: [
    { key: "headless", label: "Headless Mode", type: "checkbox" },
    {
      key: "devicePreset",
      label: "📱 Device Template",
      type: "select",
      options: [
        { label: "🖥️ Desktop (1280x720)", value: "Desktop" },
        { label: "📱 iPhone SE", value: "iPhone SE" },
        { label: "📱 iPhone XR", value: "iPhone XR" },
        { label: "📱 Pixel 5", value: "Pixel 5" },
        { label: "🖥️ MacBook Air 13", value: "MacBook Air 13" },
      ],
    },
    { key: "slowMo", label: "Slow Mo (ms)", type: "number", placeholder: "50" },
  ],
  open_url: [
    {
      key: "url",
      label: "URL",
      type: "text",
      placeholder: "https://example.com",
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "continueOnError",
      label: "🛡️ Continue on failure (Soft Fail)",
      type: "checkbox",
      defaultValue: false,
    },
  ],
  close_browser: [
    {
      key: "reason",
      label: "Reason (Optional)",
      type: "text",
      placeholder: "Finished execution",
    },
  ],
  manage_tabs: [
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "New Tab", value: "new" },
        { label: "Switch Tab", value: "switch" },
        { label: "Close Tab", value: "close" },
        { label: "List Tabs", value: "list" },
      ],
      required: true,
    },
    {
      key: "url",
      label: "URL (for New Tab)",
      type: "text",
      placeholder: "https://...",
      isVisible: (config) => config.action === "new",
    },
    {
      key: "tabIndex",
      label: "Tab Index (for Switch)",
      type: "number",
      placeholder: "0",
    },
  ],
  resize_viewport: [
    {
      key: "width",
      label: "Width",
      type: "number",
      placeholder: "1280",
      required: true,
    },
    {
      key: "height",
      label: "Height",
      type: "number",
      placeholder: "720",
      required: true,
    },
  ],
  reload_page: [],
  go_back: [],
  go_forward: [],

  // --- USER SIMULATION ---
  click: [
    {
      key: "selector",
      label: "Target Element to Click",
      type: "selector",
      placeholder: "e.g. button.submit or //button[text()='Login']",
      required: true,
    },
    {
      key: "clickType",
      label: "Click Type",
      type: "select",
      options: [
        { label: "Left Click", value: "left" },
        { label: "Right Click", value: "right" },
        { label: "Double Click", value: "double" },
        { label: "Middle Click", value: "middle" },
      ],
      defaultValue: "left",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "continueOnError",
      label: "🛡️ Continue on failure (Soft Fail)",
      type: "checkbox",
      defaultValue: false,
    },
  ],
  type_text: [
    {
      key: "selector",
      label: "Target Input Field",
      type: "selector",
      placeholder: "e.g. #username or input[name='user']",
      required: true,
    },
    {
      key: "text",
      label: "Text to Type / Value",
      type: "text",
      placeholder: "e.g. standard_user or {{variables.user}}",
      required: true,
    },
    { key: "delay", label: "Delay (ms)", type: "number", placeholder: "0" },
    {
      key: "clearFirst",
      label: "Clear field before typing?",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "continueOnError",
      label: "🛡️ Continue on failure (Soft Fail)",
      type: "checkbox",
      defaultValue: false,
    },
  ],
  select_option: [
    {
      key: "selector",
      label: "Target Dropdown / Select",
      type: "selector",
      placeholder: "e.g. select.country-picker",
      required: true,
    },
    {
      key: "selectionValue",
      label: "Value / Label / Index",
      type: "text",
      placeholder: "US",
      required: true,
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "continueOnError",
      label: "🛡️ Continue on failure (Soft Fail)",
      type: "checkbox",
      defaultValue: false,
    },
  ],
  submit_form: [
    {
      key: "selector",
      label: "Form Selector",
      type: "selector",
      placeholder: "form#login",
      required: true,
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  scroll: [
    {
      key: "selector",
      label: "Container Selector (Optional)",
      type: "selector",
      placeholder: "body or .scrollable-div",
    },
    {
      key: "scrollToEnd",
      label: "Scroll to Bottom (Infinite)",
      type: "checkbox",
    },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      options: [
        { label: "Down", value: "down" },
        { label: "Up", value: "up" },
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
      required: true,
      isVisible: (config) => !config.scrollToEnd,
    },
    {
      key: "amount",
      label: "Pixels Amount",
      type: "number",
      placeholder: "500",
      isVisible: (config) => !config.scrollToEnd,
    },
    {
      key: "maxScrolls",
      label: "Max Scroll Attempts",
      type: "number",
      placeholder: "50",
      isVisible: (config) => config.scrollToEnd === true,
    },
    {
      key: "behavior",
      label: "Behavior",
      type: "select",
      options: [
        { label: "Smooth", value: "smooth" },
        { label: "Instant (Auto)", value: "auto" },
      ],
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  drag_drop: [
    {
      key: "sourceSelector",
      label: "Source (Drag)",
      type: "selector",
      placeholder: "#item-1",
      required: true,
    },
    {
      key: "targetSelector",
      label: "Target (Drop)",
      type: "selector",
      placeholder: "#bin",
      required: true,
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  hover: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".menu-item",
      required: true,
    },
  ],

  // --- DOM / CODE ---
  find_element: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
      required: true,
    },
  ],
  get_set_content: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
      required: true,
    },
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "Get Text", value: "getText" },
        { label: "Set Text", value: "setText" },
        { label: "Get HTML", value: "getHTML" },
      ],
      required: true,
    },
    {
      key: "value",
      label: "Value (for Set)",
      type: "text",
      isVisible: (config) => config.action === "setText",
    },
  ],
  execute_js: [
    {
      key: "script",
      label: "JavaScript Script",
      type: "textarea",
      placeholder: "return document.title;",
      required: true,
    },
  ],
  wait_for_element: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
      required: true,
    },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: [
        { label: "Visible", value: "visible" },
        { label: "Hidden", value: "hidden" },
        { label: "Attached (Exist)", value: "attached" },
        { label: "Detached (Removed)", value: "detached" },
      ],
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],

  // --- DIAGNOSTICS ---
  take_screenshot: [
    { key: "fullPage", label: "Full Page", type: "checkbox" },
    {
      key: "path",
      label: "Filename (Optional)",
      type: "text",
      placeholder: "screenshot.png",
    },
  ],
  save_dom: [
    {
      key: "selector",
      label: "Selector (Optional)",
      type: "selector",
      placeholder: "body",
    },
    {
      key: "path",
      label: "File Path",
      type: "text",
      placeholder: "page.html",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "domContent",
    },
  ],
  log_errors: [
    {
      key: "enable",
      label: "Enable Console Logging",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  listen_events: [
    {
      key: "eventType",
      label: "Event Type",
      type: "select",
      options: [
        { label: "Click", value: "click" },
        { label: "Input / Typed", value: "input" },
        { label: "Network Request", value: "request" },
        { label: "Network Response", value: "response" },
        { label: "Console Message", value: "console" },
      ],
      required: true,
    },
  ],
  wait_for_request: [
    {
      key: "url",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v1/login",
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  wait_for_response: [
    {
      key: "url",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/v1/data",
      required: true,
    },
    {
      key: "status",
      label: "Status (Optional)",
      type: "number",
      placeholder: "200",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],

  // --- LOGIC & FLOW ---
  variable: [
    { key: "name", label: "Variable Name", type: "text", required: true },
    { key: "value", label: "Initial Value", type: "text" },
  ],
  conditional: [
    {
      key: "branches",
      label: "Control Logic",
      type: "conditional_branches",
      required: true,
    },
    {
      key: "debugMode",
      label: "Enable detailed trace logs",
      type: "checkbox",
      defaultValue: false,
    },
  ],
  switch: [
    {
      key: "variableName",
      label: "Value or Variable to Evaluate",
      type: "text",
      placeholder: "e.g. {{Username.value}} or 'success'",
      required: true,
    },
    {
      key: "comparisonType",
      label: "Comparison Type",
      type: "select",
      options: [
        { label: "Equals (exact match)", value: "equals" },
        { label: "Contains (substring)", value: "contains" },
        { label: "Starts With", value: "startsWith" },
        { label: "Ends With", value: "endsWith" },
        { label: "Regex (pattern)", value: "regex" },
      ],
      defaultValue: "equals",
    },
    {
      key: "cases",
      label: "Switch Cases",
      type: "switch_cases",
      required: true,
    },
  ],
  loop: [
    {
      key: "type",
      label: "Loop Type",
      type: "select",
      options: [
        { label: "Fixed Count", value: "fixed" },
        { label: "While (Condition)", value: "while" },
        { label: "Each (Array)", value: "each" },
      ],
      required: true,
    },
    {
      key: "flowId",
      label: "Sub-flow ID",
      type: "text",
      required: true,
    },
  ],
  component: [
    {
      key: "flowId",
      label: "Component (Sub-flow) ID",
      type: "text",
      required: true,
    },
  ],
  pause: [
    {
      key: "duration",
      label: "Duration (ms)",
      type: "number",
      placeholder: "2000",
      required: true,
    },
  ],
  backend_js: [
    {
      key: "script",
      label: "Node.js Script (Backend)",
      type: "textarea",
      placeholder: "// Runs on server\nreturn { success: true };",
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "10000",
    },
  ],
  fail_flow: [
    {
      key: "message",
      label: "Error Message",
      type: "text",
      placeholder: "Flow stopped intentionally",
    },
  ],
  wait_conditional: [
    {
      key: "branches",
      label: "Wait Condition",
      type: "conditional_branches",
      required: true,
    },
    {
      key: "timeout",
      label: "Max Wait (ms)",
      type: "number",
      placeholder: "10000",
    },
  ],
  input: [
    { key: "name", label: "Parameter Name", type: "text", required: true },
    { key: "value", label: "Default Value", type: "text" },
  ],
  output: [
    {
      key: "path",
      label: "Exit Path Name",
      type: "text",
      defaultValue: "success",
    },
  ],
  transform: [
    {
      key: "expression",
      label: "JS Expression",
      type: "text",
      placeholder: "data.items.filter(i => i.price > 10)",
      required: true,
    },
  ],
  flow_control: [
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "Break Loop", value: "break" },
        { label: "Continue Loop", value: "continue" },
        { label: "Return from Subflow", value: "return" },
      ],
      required: true,
    },
  ],

  // --- DEFAULT FALLBACK ---
  default: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "Enter selector...",
      required: true, // We want all selectors to be required by default in the validator
    },
  ],
};

/**
 * Validates a node configuration based on the rules defined above.
 */
export const validateNodeConfig = (nodeType, config = {}) => {
  const rules = NODE_INPUTS[nodeType] || NODE_INPUTS.default;

  for (const rule of rules) {
    if (rule.required) {
      const value = config[rule.key];
      if (value === null || value === undefined || value === "") {
        return { isValid: false, missingField: rule.label, fieldKey: rule.key };
      }
    }
  }

  return { isValid: true };
};

/**
 * Truncates a string to a maximum length.
 */
export const truncate = (str, n) => {
  if (!str) return "";
  return str.length > n ? str.substr(0, n - 1) + "..." : str;
};

/**
 * Generates a human-readable label for a node based on its configuration.
 */
export const getSmartLabel = (nodeType, config = {}) => {
  if (!config) return null;

  switch (nodeType) {
    case "open_url":
      return config.url
        ? `Open: ${truncate(config.url.replace(/^https?:\/\//, ""), 20)}`
        : null;
    case "click":
      return config.selector ? `Click: ${truncate(config.selector, 20)}` : null;
    case "type_text":
      return config.selector
        ? `Type in: ${truncate(config.selector, 15)}`
        : null;
    case "select_option":
      return config.selector
        ? `Select in: ${truncate(config.selector, 15)}`
        : null;
    case "hover":
      return config.selector ? `Hover: ${truncate(config.selector, 20)}` : null;
    case "wait_for_element":
      return config.selector ? `Wait: ${truncate(config.selector, 20)}` : null;
    case "execute_js":
      return "Execute JS";
    case "pause":
      return `Pause: ${config.duration}ms`;
    case "component":
      return config.label || "Sub-flow";
    case "loop":
      return "Loop";
    default:
      return null;
  }
};
