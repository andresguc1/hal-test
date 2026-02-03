export const NODE_INPUTS = {
  // Browser
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
  ],
  launch_browser: [
    { key: "headless", label: "Headless Mode", type: "checkbox" },
    { key: "slowMo", label: "Slow Mo (ms)", type: "number", placeholder: "50" },
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

  // User Actions
  click: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".btn-primary",
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  type_text: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "input[name='q']",
      required: true,
    },
    {
      key: "text",
      label: "Text to Type",
      type: "text",
      placeholder: "Hello World",
      required: true,
    },
    { key: "delay", label: "Delay (ms)", type: "number", placeholder: "0" },
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

  // Sync
  wait_for_timeout: [
    {
      key: "duration",
      label: "Duration (ms)",
      type: "number",
      placeholder: "1000",
      required: true,
    },
  ],
  wait_visible: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],

  // Diagnostics
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

  // Form Interaction
  select_option: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "select#country",
      required: true,
    },
    {
      key: "selectionValue",
      label: "Value / Label / Index",
      type: "text",
      placeholder: "US",
      required: true,
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
  ],

  // AI & Analytics
  call_llm: [
    {
      key: "prompt",
      label: "System Prompt / Instructions",
      type: "textarea",
      placeholder: "Extract all prices from this page...",
      required: true,
    },
  ],
  validate_semantic: [
    {
      key: "assertion",
      label: "Semantic Assertion",
      type: "text",
      placeholder: "The page should show a confirmation message",
      required: true,
    },
  ],

  // Synchronization
  wait_navigation: [
    {
      key: "waitUntil",
      label: "Wait Until",
      type: "text",
      placeholder: "load",
    },
  ],
  wait_network: [
    {
      key: "idleTime",
      label: "Idle Time (ms)",
      type: "number",
      placeholder: "500",
    },
  ],
  wait_conditional: [
    {
      key: "expression",
      label: "JS Expression (Truthy)",
      type: "text",
      placeholder: "window.ready === true",
      required: true,
    },
  ],

  // Advanced
  submit_form: [
    {
      key: "selector",
      label: "Form Selector",
      type: "selector",
      placeholder: "form#login",
      required: true,
    },
  ],
  upload_file: [
    {
      key: "selector",
      label: "Input Selector",
      type: "selector",
      placeholder: "input[type='file']",
      required: true,
    },
    {
      key: "files",
      label: "File Paths (JSON Array)",
      type: "text",
      placeholder: '["path/to/file.png"]',
      required: true,
    },
  ],

  // Advanced
  execute_js: [
    {
      key: "script",
      label: "JavaScript Script",
      type: "textarea",
      placeholder: "return document.title;",
      required: true,
    },
  ],

  // Network Control
  intercept_request: [
    {
      key: "urlPattern",
      label: "URL Pattern (Glob/Regex)",
      type: "text",
      placeholder: "**/api/v1/*",
      required: true,
    },
  ],
  mock_response: [
    {
      key: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/users",
      required: true,
    },
    {
      key: "body",
      label: "Response Body (JSON)",
      type: "textarea",
      placeholder: '{"success": true}',
      required: true,
    },
  ],
  block_resource: [
    {
      key: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "*.google-analytics.com",
      required: true,
    },
  ],

  // Default fallback
  default: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "Enter selector...",
    },
  ],
};

export const validateNodeConfig = (nodeType, config = {}) => {
  const rules = NODE_INPUTS[nodeType] || [];

  // Special logic for save_dom: either path OR variableName must be present
  if (nodeType === "save_dom") {
    const hasPath = !!config.path?.trim();
    const hasVar = !!config.variableName?.trim();
    if (!hasPath && !hasVar) {
      return { isValid: false, error: "Requires Path or Variable Name" };
    }
    return { isValid: true };
  }

  for (const rule of rules) {
    if (rule.required) {
      const value = config[rule.key];
      if (value === null || value === undefined || value === "") {
        return { isValid: false, missingField: rule.label };
      }
    }
  }

  return { isValid: true };
};

export const truncate = (str, n) => {
  if (!str) return str;
  return str.length > n ? str.substr(0, n - 1) + "..." : str;
};

export const getSmartLabel = (nodeType, config = {}) => {
  switch (nodeType) {
    case "open_url":
      return config.url
        ? `Open: ${truncate(config.url.replace(/^https?:\/\//, ""), 20)}`
        : null;
    case "click":
      return config.selector ? `Click: ${truncate(config.selector, 18)}` : null;
    case "type_text":
      return config.text ? `Type: "${truncate(config.text, 15)}"` : null;
    case "wait_for_timeout":
      return config.duration ? `Wait: ${config.duration}ms` : null;
    case "launch_browser":
      return config.headless ? "Browser (Headless)" : "Browser (Visible)";
    case "take_screenshot":
      return config.path ? `Snap: ${truncate(config.path, 20)}` : null;
    default:
      return null;
  }
};
