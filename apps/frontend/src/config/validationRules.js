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

  // Default fallback
  default: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "Enter selector...",
      // Implicitly optional in fallback unless specified?
      // Let's assume selector is often required for generic actions
    },
  ],
};

export const validateNodeConfig = (nodeType, config = {}) => {
  const rules = NODE_INPUTS[nodeType] || [];

  for (const rule of rules) {
    if (rule.required) {
      const value = config[rule.key];
      // Check if value is null, undefined, or empty string (if text/selector)
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
