/**
 * Node Simulators for Design-Time Data Propagation
 *
 * Each simulator takes (configuration, resolvedIncomingData) and returns
 * a simulated result object that downstream nodes can use for previsualization.
 */

export const NODE_SIMULATORS = {
  // --- Logic & Flow ---
  variable: (config) => {
    const result = {
      success: true,
      name: config.name || "unnamed",
      value: config.value || "",
    };
    // Also inject the variable directly into the root for easy access: {{varName}}
    if (config.name) {
      result[config.name] = config.value;
    }
    return result;
  },

  // --- Browser Management ---
  launch_browser: (_config) => ({
    success: true,
    browserId: "simulated-browser-1",
    status: "ready",
  }),

  open_url: (config) => ({
    success: true,
    url: config.url || "",
    status: "loaded",
  }),

  manage_tabs: (config) => ({
    success: true,
    activeIndex: config.tabIndex || 0,
    action: config.action,
  }),

  // --- Interaction ---
  click: (config) => ({
    success: true,
    selector: config.selector,
  }),

  type_text: (config) => ({
    success: true,
    selector: config.selector,
    text: config.text,
  }),

  select_option: (config) => ({
    success: true,
    selector: config.selector,
    value: config.selectionValue,
  }),

  // --- DOM / Code ---
  get_set_content: (config) => ({
    success: true,
    selector: config.selector,
    value:
      config.action === "setText" ? config.value : "<simulated text content>",
    text: "<simulated text content>",
    html: "<div>Simulated HTML</div>",
  }),

  execute_js: (_config) => ({
    success: true,
    result: "<js execution result>",
  }),

  find_element: (config) => ({
    success: true,
    selector: config.selector,
    found: true,
  }),

  conditional: (config, _incoming) => {
    const branches = config.branches || [];
    // Simple mock evaluation: if we have incoming data that matches any condition
    // For now, we just return the first non-fallback branch as a 'prediction'
    // or 'Else' if none exists.
    const firstBranch = branches.find((b) => !b.isFallback);
    return {
      success: true,
      path: firstBranch ? firstBranch.id || firstBranch.label : "Else",
      predicted: true,
    };
  },

  switch: (config, _incoming) => {
    const cases = config.cases || [];
    // If we can resolve the variable, we could try to match it.
    // For now, return a placeholder result.
    return {
      success: true,
      path: cases.length > 0 ? "case_0" : "default",
      matchedCaseId: cases[0]?.id || null,
    };
  },

  // --- Fallback ---
  default: (config) => ({
    success: true,
    ...config,
  }),
};

/**
 * Gets a simulator for a given node type
 */
export const getSimulator = (type) => {
  return NODE_SIMULATORS[type] || NODE_SIMULATORS.default;
};
