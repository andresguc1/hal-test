// payloadBuilders.js

// ---------------------------------------------
// Validation and Normalization Helpers
// ---------------------------------------------

/**
 * Normalizes and validates a boolean value.
 * Accepts strings "true"/"false" and "1"/"0".
 * @param {*} value - The input value.
 * @param {boolean} defaultValue - The value to return if the input is invalid.
 * @returns {boolean}
 */
const isVariableTemplate = (value) => {
  return (
    typeof value === "string" && (value.includes("{{") || value.includes("${"))
  );
};

/**
 * Normalizes and validates a boolean value.
 * Accepts strings "true"/"false" and "1"/"0".
 * @param {*} value - The input value.
 * @param {boolean} defaultValue - The value to return if the input is invalid.
 * @returns {boolean}
 */
const asBoolean = (value, defaultValue) => {
  if (isVariableTemplate(value)) return value;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return defaultValue;
};

/**
 * Normalizes and validates a number, ensuring it is finite.
 * @param {*} value - The input value.
 * @param {number} defaultValue - The value to return if the input is not a number.
 * @param {number} [min=-Infinity] - The minimum allowed value.
 * @param {number} [max=Infinity] - The maximum allowed value.
 * @returns {number | undefined} - Returns 'defaultValue' (which can be undefined) if invalid.
 */
const asNumber = (value, defaultValue, min = -Infinity, max = Infinity) => {
  if (isVariableTemplate(value)) return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultValue;
  return Math.min(Math.max(Math.round(num), min), max);
};

/**
 * Normalizes a string, ensuring it is not null/undefined and is trimmed.
 * @param {*} value - The input value.
 * @param {string} [defaultValue=''] - The value to return if the input is null/undefined.
 * @returns {string}
 */
const asString = (value, defaultValue = "") => {
  return value != null ? String(value).trim() : defaultValue;
};

/**
 * Validates or normalizes a JSON object from a string.
 * @param {*} value - The input value (string or object).
 * @param {boolean} [required=false] - If true, throws an error if empty or invalid.
 * @param {string} [fieldName='Field'] - Field name for error messages.
 * @returns {string} - The normalized JSON as a string.
 */
const asJsonString = (value, required = false, fieldName = "Field") => {
  if (isVariableTemplate(value)) return value;
  if (value == null || value === "") {
    if (required) throw new Error(`${fieldName} is required.`);
    return "";
  }

  let jsonString = "";
  try {
    if (typeof value === "object") {
      jsonString = JSON.stringify(value);
    } else if (typeof value === "string") {
      // Validate and normalize
      const parsed = JSON.parse(value);
      jsonString = JSON.stringify(parsed);
    } else {
      throw new Error("Must be an object or JSON string.");
    }
  } catch (err) {
    throw new Error(`${fieldName} is not valid JSON: ${err.message}`);
  }

  return jsonString;
};

const parseJsonArray = (value, fieldName = "fields") => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error(`${fieldName} must be a JSON array.`);
      }
      return parsed;
    } catch (err) {
      throw new Error(`${fieldName} is not valid JSON: ${err.message}`);
    }
  }
  throw new Error(`${fieldName} is required and must be a JSON array.`);
};

// ---------------------------------------------
// Payload Builders (Browser Actions)
// ---------------------------------------------

export const launch_browser = (payload) => {
  const httpUsername = asString(payload?.httpCredentialsUsername, "");
  const httpPassword = asString(payload?.httpCredentialsPassword, "");
  const httpOrigin = asString(payload?.httpCredentialsOrigin, "");

  return {
    browserType: asString(payload?.browserType, "chromium"),
    headless: asBoolean(payload?.headless, false),
    devicePreset: asString(payload?.devicePreset, "Desktop"),
    slowMo: asNumber(payload?.slowMo, 0, 0),
    args: asString(payload?.args, ""),
    executablePath: asString(payload?.executablePath, ""),
    maximizeWindow: asBoolean(payload?.maximizeWindow, false),
    width: asNumber(payload?.width),
    height: asNumber(payload?.height),
    isMobile: asBoolean(payload?.isMobile, false),
    hasTouch: asBoolean(payload?.hasTouch, false),
    networkProfile: asString(payload?.networkProfile, "No throttling"),
    offline: asBoolean(payload?.offline, false),
    latency: asNumber(payload?.latency, 0),
    downloadThroughput: asNumber(payload?.downloadThroughput, 0),
    uploadThroughput: asNumber(payload?.uploadThroughput, 0),
    ...(httpUsername
      ? {
          httpCredentials: {
            username: httpUsername,
            password: httpPassword,
            ...(httpOrigin ? { origin: httpOrigin } : {}),
          },
        }
      : {}),
  };
};

export const open_url = (payload) => {
  const url = asString(payload?.url ?? payload?.link);

  // Validate URL is not empty
  if (!url || url.trim() === "") {
    throw new Error(
      "URL is required. Please configure the URL in the node (e.g., https://example.com)",
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(
      `Invalid URL: "${url}". Must include http:// or https:// (e.g., https://google.com)`,
    );
  }

  return {
    url: url,
    waitUntil: asString(payload?.waitUntil, "domcontentloaded"),
    timeout: asNumber(payload?.timeout, 30000),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
  };
};

export const close_browser = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    forceClose: asBoolean(payload?.forceClose, false),
    clearContext: asBoolean(payload?.clearContext, true),
  };
};

export const resize_viewport = (payload = {}) => {
  const devicePreset = asString(payload?.devicePreset);

  // If no preset, validate width/height
  if (!devicePreset || devicePreset === "Custom") {
    const width = asNumber(payload.width);
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error("Invalid or missing Width for custom size.");
    }

    const height = asNumber(payload.height);
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error("Invalid or missing Height for custom size.");
    }

    return {
      browserId: asString(payload?.browserId),
      width,
      height,
      devicePreset: "Custom",
    };
  }

  // If preset exists, just send the preset name
  return {
    browserId: asString(payload?.browserId),
    devicePreset,
  };
};

export const manage_tabs = (payload = {}) => {
  const action = asString(payload.action, "new").toLowerCase().trim();

  const allowed = ["new", "switch", "close", "list", "navigate"];
  const act = allowed.includes(action) ? action : "new";

  const body = {
    action: act,
    browserId: asString(payload?.browserId),
  };

  // --- tabIndex handling (for switch, close, navigate) ---
  if (["switch", "close", "navigate"].includes(act)) {
    const rawIndex = payload.tabIndex;
    const parsed = asNumber(rawIndex);

    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      throw new Error(
        `Invalid tabIndex for action '${act}'. Must be an integer >= 0.`,
      );
    }

    body.tabIndex = Math.trunc(parsed);
  }

  // --- url handling (for new and navigate) ---
  const url = asString(payload.url);

  if (act === "new") {
    if (url !== "") {
      body.url = url;
    }
  } else if (act === "navigate") {
    if (url === "") {
      throw new Error("Property 'url' is required for 'navigate'.");
    }
    body.url = url;
  }

  return body;
};

export const go_back = (_payload = {}) => {
  return {
    browserId: asString(_payload?.browserId),
  };
};

export const go_forward = (_payload = {}) => {
  return {
    browserId: asString(_payload?.browserId),
  };
};

// ---------------------------------------------
// Builders (Element Interaction)
// ---------------------------------------------

export const find_element = (payload) => {
  return {
    selector: asString(payload?.selector),
    selectorType: asString(payload?.selectorType, "css"),
    timeout: asNumber(payload?.timeout, 10000, 0),
    visible: asBoolean(payload?.visible, true),
    browserId: asString(payload?.browserId),
  };
};

export const get_set_content = (payload) => {
  const action = asString(payload?.action, "get");
  const contentType = asString(payload?.contentType, "text");

  const body = {
    selector: asString(payload?.selector),
    action: action,
    contentType: contentType,
    browserId: asString(payload?.browserId),
  };

  if (contentType === "attribute") {
    body.attribute = asString(payload?.attribute);
  }

  if (action === "set") {
    body.value = asString(payload?.value);
    body.clearBeforeSet = asBoolean(payload?.clearBeforeSet, true);
  }

  body.takeScreenshot = asBoolean(payload?.takeScreenshot, false);
  body.timeout = asNumber(payload?.timeout, 30000, 1);

  return body;
};

/**
 * Creates the payload for execute_js.
 * ⚠️ SECURITY WARNING: Allows execution of arbitrary JavaScript code.
 */
export const execute_js = (payload) => {
  const returnValue = asBoolean(payload?.returnValue, false);
  const script = asString(payload?.script);

  if (!script) {
    throw new Error("JavaScript script is required.");
  }

  return {
    script: script,
    returnValue: returnValue,
    args: asString(payload?.args),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
  };
};

export const click = (payload = {}) => {
  const selector = asString(payload.selector);

  if (selector === "") {
    throw new Error("'selector' is required.");
  }

  // The UI exposes the mouse-button as `clickType` (left|right|middle|double).
  // Map it to Playwright's `button` + `clickCount`. The legacy `button` key is
  // still honored as a fallback for backward compatibility.
  const clickType = asString(payload?.clickType, "left").toLowerCase();
  const mappedByClickType =
    clickType === "double" ? { button: "left", clickCount: 2 } : { button: clickType };

  const rawButton = asString(payload?.button ?? mappedByClickType.button, "left").toLowerCase();
  const allowedButtons = ["left", "right", "middle"];
  const finalButton = allowedButtons.includes(rawButton) ? rawButton : "left";
  const clickCount = clickType === "double"
      ? 2
      : asNumber(payload?.clickCount, undefined, 1) || undefined;

  return {
    selector: selector,
    button: finalButton,
    clickCount,
    browserId: asString(payload?.browserId),
    timeout: asNumber(payload?.timeout, 30000, 1),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const browser_dialog = (payload = {}) => {
  const action = asString(payload.action, "accept").toLowerCase().trim();
  const allowed = ["accept", "dismiss"];
  const act = allowed.includes(action) ? action : "accept";

  const expectText = asString(payload.expectText);
  const body = {
    action: act,
    matchType: asString(payload.matchType, "contains"),
    caseSensitive: asBoolean(payload.caseSensitive, false),
    timeout: asNumber(payload.timeout, 5000, 1),
    browserId: asString(payload?.browserId),
  };

  if (expectText !== "") {
    body.expectText = expectText;
  }

  return {
    ...body,
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const type_text = (payload = {}) => {
  const selector = asString(payload?.selector);
  const text = payload?.textToType ?? payload?.value ?? payload?.text;

  if (selector === "") {
    throw new Error("Selector is required.");
  }

  if (text === null || text === undefined) {
    throw new Error("Text to enter is required.");
  }

  return {
    selector: selector,
    text: asString(text, ""),
    clearBeforeType: asBoolean(payload?.clearBeforeType, true),
    delay: asNumber(payload?.delay, 0, 0),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const select_option = (payload) => {
  const containerSelector = asString(payload?.containerSelector);

  const normalizeAction = (a) => {
    const u = String((a ?? "CHECK").toUpperCase().trim());
    return ["NO_CHANGE", "CHECK", "UNCHECK"].includes(u) ? u : "CHECK";
  };
  const mapOption = (o) => ({
    label: asString(o?.label),
    value: o?.value != null ? String(o.value).trim() : "",
    action: normalizeAction(o?.action),
  });

  const selectedOptionsRaw = payload?.selectedOptions;
  let selectedOptions = [];
  if (Array.isArray(selectedOptionsRaw)) {
    selectedOptions = selectedOptionsRaw
      .filter(Boolean)
      .map(mapOption)
      .filter((o) => o.label || o.value);
  } else if (typeof selectedOptionsRaw === "string" && selectedOptionsRaw.trim()) {
    try {
      const parsed = JSON.parse(selectedOptionsRaw);
      if (Array.isArray(parsed)) {
        selectedOptions = parsed
          .filter(Boolean)
          .map(mapOption)
          .filter((o) => o.label || o.value);
      }
    } catch {
      // ignore malformed JSON string
    }
  }

  const expandMenu = asBoolean(payload?.expandMenu, false);
  const browserId = asString(payload?.browserId);

  // Auto-detected mode (container + selected options)
  if (containerSelector) {
    const result = {
      containerSelector,
      selectedOptions,
      timeout: asNumber(payload?.timeout, 30000, 1),
      browserId,
    };
    if (expandMenu) result.expandMenu = true;
    return result;
  }

  // Legacy mode: plain <select>
  let selectionCriteria = asString(payload?.selectionCriteria, "label");
  let selectionValue = asString(payload?.selectionValue);
  // Accept importer-style `value`/`label` fields as fallback.
  if (!selectionValue) {
    const importerValue = asString(payload?.value);
    const importerLabel = asString(payload?.label);
    if (importerValue) {
      selectionCriteria = "value";
      selectionValue = importerValue;
    } else if (importerLabel) {
      selectionCriteria = "label";
      selectionValue = importerLabel;
    }
  }

  return {
    selector: asString(payload?.selector),
    selectionCriteria,
    selectionValue,
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId,
  };
};

export const fill_form = (payload = {}) => {
  const formSelector = asString(payload?.formSelector);
  const fields = parseJsonArray(payload?.fields, "fields");
  if (formSelector === "") {
    throw new Error("Form selector is required.");
  }

  if (fields.length === 0) {
    throw new Error("At least one field definition is required.");
  }

  const normalizedFields = fields.map((field, index) => {
    if (!field || typeof field !== "object") {
      throw new Error(
        `Field at index ${index} must be an object with selector and value.`,
      );
    }
    const selector = asString(field.selector);
    if (selector === "") {
      throw new Error(`Field at index ${index} must include a selector.`);
    }
    return {
      selector,
      value: field.value ?? "",
      clearBeforeType:
        field.clearBeforeType ?? asBoolean(payload?.clearBeforeType, true),
      delay: asNumber(field.delay, asNumber(payload?.delay, 0, 0), 0),
    };
  });

  return {
    formSelector,
    fields: normalizedFields,
    clearBeforeType: asBoolean(payload?.clearBeforeType, true),
    submitAfterFill: asBoolean(payload?.submitAfterFill, false),
    submitSelector: asString(payload?.submitSelector, ""),
    waitForNavigation: asBoolean(payload?.waitForNavigation, true),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const submit_form = (payload) => {
  return {
    selector: asString(payload?.selector),
    waitForNavigation: asBoolean(payload?.waitForNavigation, true),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
  };
};

export const scroll = (payload) => {
  return {
    selector: asString(payload?.selector, ""),
    scrollToEnd: asBoolean(payload?.scrollToEnd, false),
    direction: asString(payload?.direction, "down"),
    amount: asNumber(payload?.amount, 100),
    maxScrolls: asNumber(payload?.maxScrolls, 50, 1),
    waitTime: asNumber(payload?.waitTime, 2000, 500),
    behavior: asString(payload?.behavior, "auto"),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

/**
 * Creates the payload for upload_file.
 * Validates and sanitizes file paths to prevent path traversal.
 */
export const upload_file = (payload) => {
  const filesString = asString(payload?.files);

  if (!filesString) {
    throw new Error("At least one file path is required.");
  }

  const pathsArray = filesString
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path.length > 0);

  if (pathsArray.length === 0) {
    throw new Error("No valid file paths provided.");
  }

  const dangerousPatterns = ["..", "\0", "\\"];
  const invalidPaths = pathsArray.filter((path) =>
    dangerousPatterns.some((pattern) => path.includes(pattern)),
  );

  if (invalidPaths.length > 0) {
    throw new Error(
      `Invalid or dangerous file paths detected: ${invalidPaths.join(", ")}`,
    );
  }

  return {
    selector: asString(payload?.selector),
    files: pathsArray.join(","),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
  };
};

export const drag_drop = (payload) => {
  const sourceSelector = asString(payload?.sourceSelector);
  const targetSelector = asString(payload?.targetSelector);

  if (!sourceSelector) {
    throw new Error("Source selector is required.");
  }

  if (!targetSelector) {
    throw new Error("Target selector is required.");
  }

  return {
    sourceSelector,
    targetSelector,
    steps: asNumber(payload?.steps, 10, 1),
    force: asBoolean(payload?.force, false),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const hover = (payload) => {
  const selector = asString(payload?.selector);

  if (!selector) {
    throw new Error("Selector is required.");
  }

  return {
    selector,
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const assert_page_text = (payload) => {
  return {
    textToFind: asString(payload?.textToFind),
    matchType: asString(payload?.matchType, "contains"),
    caseSensitive: asBoolean(payload?.caseSensitive, false),
    timeout: asNumber(payload?.timeout, 5000, 0),
    browserId: asString(payload?.browserId),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

export const wait_for_element = (payload) => {
  return {
    selector: asString(payload?.selector),
    condition: asString(payload?.condition, "visible"),
    timeout: asNumber(payload?.timeout, 30000, 0),
    browserId: asString(payload?.browserId),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    continueOnError: asBoolean(
      payload?.continueOnError ?? payload?.continueOnFailure,
      false,
    ),
  };
};

/**
 * Creates the payload for wait_conditional.
 */
export const wait_conditional = (payload) => {
  const conditionScript = asString(payload?.conditionScript);

  if (!conditionScript) {
    throw new Error("Condition script is required.");
  }

  return {
    conditionScript: conditionScript,
    polling: asNumber(payload?.polling, 500, 1),
    timeout: asNumber(payload?.timeout, 20000, 1),
    args: asString(payload?.args),
    browserId: asString(payload?.browserId),
  };
};

export const wait_network = (payload) => {
  return {
    idleTime: asNumber(payload?.idleTime, 1000, 0),
    includeResources: asBoolean(payload?.includeResources, true),
  };
};

export const wait_navigation = (payload) => {
  return {
    waitUntil: asString(payload?.waitUntil, "networkidle"),
    timeout: asNumber(payload?.timeout, 10000, 1),
    browserId: asString(payload?.browserId),
  };
};

export const wait_visible = (payload) => {
  return {
    selector: asString(payload?.selector),
    timeout: asNumber(payload?.timeout, 15000, 0),
    scrollIntoView: asBoolean(payload?.scrollIntoView, true),
  };
};

// ---------------------------------------------
// Builders (Event and Data Handling)
// ---------------------------------------------

export const listen_events = (payload) => {
  return {
    eventType: asString(payload?.eventType, "click"),
    selector: asString(payload?.selector),
    logToFile: asBoolean(payload?.logToFile, false),
    filePath: asString(payload?.filePath),
    timeout: asNumber(payload?.timeout, 60000, 1),
    browserId: asString(payload?.browserId),
  };
};

export const log_errors = (payload) => {
  return {
    enable: asBoolean(payload?.enable, true),
    logToFile: asBoolean(payload?.logToFile, false),
    filePath: asString(payload?.filePath, null),
    timeout: asNumber(payload?.timeout, 0, 0),
    browserId: asString(payload?.browserId),
  };
};

export const save_dom = (payload) => {
  return {
    selector: asString(payload?.selector, null),
    path: asString(payload?.path, null),
    variableName: asString(payload?.variableName, null),
    timeout: asNumber(payload?.timeout, 30000, 1),
    takeScreenshot: asBoolean(payload?.takeScreenshot, true),
    browserId: asString(payload?.browserId),
  };
};

export const take_screenshot = (payload) => {
  return {
    selector: asString(payload?.selector, null),
    path: asString(payload?.path, null),
    fullPage: asBoolean(payload?.fullPage, false),
    format: asString(payload?.format, "png"),
    quality: asNumber(payload?.quality, 100, 1, 100),
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: asString(payload?.browserId),
    enabled: asBoolean(payload?.enabled, true),
  };
};

// ---------------------------------------------
// Builders (Network and Interception)
// ---------------------------------------------

export const modify_headers = (payload) => {
  const headersString = asJsonString(payload?.headers, true, '"headers"');

  let method = asString(payload?.method).toUpperCase();
  const allowedMethods = [
    "",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ];
  if (!allowedMethods.includes(method)) {
    method = "";
  }

  return {
    urlPattern: asString(payload?.urlPattern),
    headers: headersString,
    method: method,
    timeout: asNumber(payload?.timeout, 0, 0),
    browserId: asString(payload?.browserId),
  };
};

export const block_resource = (payload) => {
  return {
    urlPattern: asString(payload?.urlPattern),
    resourceType: asString(payload?.resourceType, "script"),
    timeout: asNumber(payload?.timeout, 0, 0),
    browserId: asString(payload?.browserId),
  };
};

export const mock_response = (payload) => {
  return {
    urlPattern: asString(payload?.urlPattern),
    method: asString(payload?.method, "GET").toUpperCase(),
    status: asNumber(payload?.status, 200, 100, 599),
    responseBody: asString(payload?.responseBody),
    headers: asJsonString(payload?.headers, false, '"headers"'),
    timeout: asNumber(payload?.timeout, 120000, 0),
    browserId: asString(payload?.browserId),
  };
};

export const intercept_request = (payload) => {
  return {
    urlPattern: asString(payload?.urlPattern),
    method: asString(payload?.method, "POST").toUpperCase(),
    action: asString(payload?.action, "mock"),
    responseMock: asString(payload?.responseMock),
    timeout: asNumber(payload?.timeout, 60000, 0),
    browserId: asString(payload?.browserId),
  };
};

export const clear_all_mocks = (payload) => {
  return {
    browserId: asString(payload?.browserId),
  };
};

// ---------------------------------------------
// Builders (Session and Storage)
// ---------------------------------------------

export const manage_cookies = (payload) => {
  const action = asString(payload?.action, "set");
  const body = {
    action: action,
    browserId: asString(payload?.browserId),
  };

  if (action === "set" || action === "delete") {
    body.cookiesData = asJsonString(
      payload?.cookiesData,
      true,
      '"cookiesData"',
    );
  }

  return body;
};

export const persist_session = (payload) => {
  const action = asString(payload?.action, "save");
  const body = {
    action: action,
    browserId: asString(payload?.browserId),
    includeLocalStorage: asBoolean(payload?.includeLocalStorage, true),
    includeSessionStorage: asBoolean(payload?.includeSessionStorage, true),
  };

  if (action === "save" || action === "load") {
    const path = asString(payload?.path);
    if (!path) throw new Error('path is required for "save" or "load".');
    body.path = path;
  }

  return body;
};

export const inject_tokens = (payload) => {
  return {
    target: asString(payload?.target, "header"),
    key: asString(payload?.key),
    value: asString(payload?.value),
    urlPattern: asString(payload?.urlPattern),
    browserId: asString(payload?.browserId),
  };
};

export const manage_storage = (payload) => {
  const action = asString(payload?.action, "set");
  const body = {
    storageType: asString(payload?.storageType, "local"),
    action: action,
    browserId: asString(payload?.browserId),
  };

  if (action === "set") {
    body.key = asString(payload?.key);
    body.value = asString(payload?.value);
  } else if (action === "get" || action === "remove") {
    body.key = asString(payload?.key);
  }

  return body;
};

export const cleanup_state = (payload) => {
  const browserId = asString(payload?.browserId);
  if (!browserId) {
    throw new Error("browserId is required for cleanup_state.");
  }
  return {
    browserId: browserId,
    target: asString(payload?.target, "context"),
    includeCookies: asBoolean(payload?.includeCookies, true),
    includeLocalStorage: asBoolean(payload?.includeLocalStorage, true),
    includeSessionStorage: asBoolean(payload?.includeSessionStorage, true),
    includeIndexedDB: asBoolean(payload?.includeIndexedDB, false),
    includePermissions: asBoolean(payload?.includePermissions, false),
  };
};

export const create_context = (payload) => {
  const browserId = asString(payload?.browserId);
  if (!browserId) {
    throw new Error("browserId is required for create_context.");
  }

  const body = { browserId };

  const storageState = asString(payload?.storageState);
  const viewportWidth = asNumber(payload?.viewportWidth, undefined, 1);
  const viewportHeight = asNumber(payload?.viewportHeight, undefined, 1);
  const userAgent = asString(payload?.userAgent);
  const geolocation = asString(payload?.geolocation);
  const locale = asString(payload?.locale);

  if (storageState) body.storageState = storageState;
  if (viewportWidth !== undefined) body.viewportWidth = viewportWidth;
  if (viewportHeight !== undefined) body.viewportHeight = viewportHeight;
  if (userAgent) body.userAgent = userAgent;
  if (geolocation) body.geolocation = geolocation;
  if (locale) body.locale = locale;

  return body;
};

// ---------------------------------------------
// Builders (Exception Handling and Hooks)
// ---------------------------------------------

export const control_exceptions = (payload) => {
  const browserId = asString(payload?.browserId);
  if (!browserId) {
    throw new Error("browserId is required for control_exceptions.");
  }

  const exceptionType = asString(payload?.exceptionType, "elementNotFound");
  const action = asString(payload?.action, "retry");
  const maxRetries = asNumber(payload?.maxRetries, undefined, 1);
  const logFile = asString(payload?.logFile);

  const allowedExceptionTypes = [
    "all",
    "navigation",
    "timeout",
    "elementNotFound",
    "network",
    "custom",
  ];
  if (!allowedExceptionTypes.includes(exceptionType)) {
    throw new Error(
      `Invalid exceptionType. Allowed: ${allowedExceptionTypes.join(", ")}`,
    );
  }

  const allowedActions = ["ignore", "log", "retry", "abort"];
  if (!allowedActions.includes(action)) {
    throw new Error(`Invalid action. Allowed: ${allowedActions.join(", ")}`);
  }

  const body = { browserId, exceptionType, action };

  if (action === "retry") {
    if (maxRetries === undefined) {
      throw new Error('maxRetries must be at least 1 when action="retry".');
    }
    if (!logFile) {
      throw new Error('logFile is required when action="retry".');
    }
    body.maxRetries = maxRetries;
    body.logFile = logFile;
  } else if (action === "log") {
    if (!logFile) {
      throw new Error('logFile is required when action="log".');
    }
    body.logFile = logFile;
  }

  return body;
};

export const handle_hooks = (payload) => {
  const browserId = asString(payload?.browserId);
  if (!browserId) {
    throw new Error("browserId is required for handle_hooks.");
  }
  const callbackCode = asString(payload?.callbackCode);
  if (!callbackCode) {
    throw new Error("callbackCode (JS) is required for handle_hooks.");
  }

  const body = {
    browserId: browserId,
    hookType: asString(payload?.hookType, "afterAction"),
    callbackCode: callbackCode,
    once: asBoolean(payload?.once, false),
  };

  const actionName = asString(payload?.actionName);
  if (actionName) {
    body.actionName = actionName;
  }

  return body;
};

// ---------------------------------------------
// Builders (Files and Data)
// ---------------------------------------------

export const handle_downloads = (payload) => {
  const action = asString(payload?.action);
  const browserId = asString(payload?.browserId);

  if (!browserId) {
    throw new Error("browserId is required for handle_downloads.");
  }

  const allowedActions = ["wait", "save", "validate", "saveAndValidate"];
  if (!allowedActions.includes(action)) {
    throw new Error(`Invalid action. Allowed: ${allowedActions.join(", ")}`);
  }

  const saveActions = ["save", "saveAndValidate"];
  const validateActions = ["validate", "saveAndValidate"];

  const path = asString(payload?.path);
  const expectedFileName = asString(payload?.expectedFileName);
  const minSizeKB = asNumber(payload?.minSizeKB, undefined, 0);
  const maxSizeKB = asNumber(payload?.maxSizeKB, undefined, 0);

  if (saveActions.includes(action) && !path) {
    throw new Error(
      'path is required for "save" or "saveAndValidate" actions.',
    );
  }
  if (validateActions.includes(action) && !expectedFileName) {
    throw new Error(
      'expectedFileName is required for actions that include "validate".',
    );
  }
  if (
    minSizeKB !== undefined &&
    maxSizeKB !== undefined &&
    minSizeKB > maxSizeKB
  ) {
    throw new Error("minSizeKB cannot be greater than maxSizeKB.");
  }

  const body = {
    action: action,
    timeout: asNumber(payload?.timeout, 30000, 1),
    browserId: browserId,
  };

  if (path) body.path = path;
  if (expectedFileName) body.expectedFileName = expectedFileName;
  if (minSizeKB !== undefined) body.minSizeKB = minSizeKB;
  if (maxSizeKB !== undefined) body.maxSizeKB = maxSizeKB;

  return body;
};

export const save_results = (payload) => {
  const browserId = asString(payload?.browserId);
  const path = asString(payload?.path);
  const dataVariableName = asString(payload?.dataVariableName);

  if (!browserId) throw new Error("browserId is required for save_results.");
  if (!path) throw new Error("path is required for save_results.");
  if (!dataVariableName)
    throw new Error("dataVariableName is required for save_results.");

  const destinationType = asString(
    payload?.destinationType,
    "json",
  ).toLowerCase();
  const allowedDestinations = ["json", "csv", "txt"];
  if (!allowedDestinations.includes(destinationType)) {
    throw new Error(
      `Invalid destinationType. Allowed: ${allowedDestinations.join(", ")}`,
    );
  }

  const encoding = asString(payload?.encoding, "utf-8").toLowerCase();
  const allowedEncodings = ["utf-8", "latin1", "ascii"];
  if (!allowedEncodings.includes(encoding)) {
    throw new Error(
      `Invalid encoding. Allowed: ${allowedEncodings.join(", ")}`,
    );
  }

  return {
    browserId: browserId,
    destinationType: destinationType,
    path: path,
    dataVariableName: dataVariableName,
    encoding: encoding,
  };
};

export const read_data = (payload) => {
  const path = asString(payload?.path);
  if (!path) throw new Error("path is required for read_data.");

  return {
    browserId: asString(payload?.browserId),
    sourceType: asString(payload?.sourceType, "csv"),
    path: path,
    variableName: asString(payload?.variableName, "dataVar"),
    hasHeader: asBoolean(payload?.hasHeader, true),
    encoding: asString(payload?.encoding, "utf-8"),
  };
};

// ---------------------------------------------
// Builders (AI and LLM)
// ---------------------------------------------

export const validate_semantic = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    content: asString(payload?.sourceTextVariable),
    criteria: asString(payload?.validationPrompt),
    expectedAnswer: asString(payload?.expectedAnswer),
    variableName: asString(payload?.variableName, "semanticValid"),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
    nodeId: payload?.nodeId,
  };
};

export const generate_data = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    description: asString(payload?.description ?? payload?.prompt),
    variableName: asString(payload?.variableName, "generatedData"),
    expectedFormat: asString(payload?.expectedFormat, "json").toLowerCase(),
    count: asNumber(payload?.count, 1),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
    temperature: asNumber(payload?.temperature, 0.7),
    injectBrowserContext: asBoolean(payload?.injectBrowserContext, false),
  };
};

export const call_llm = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    prompt: asString(payload?.prompt),
    variableName: asString(payload?.variableName, "llmResult"),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
    injectBrowserContext: asBoolean(payload?.injectBrowserContext, false),
  };
};

export const extract_dom_context = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    selector: asString(payload?.selector),
    extractionType: asString(payload?.extractionType, "text"),
    variableName: asString(payload?.variableName, "domContext"),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
    nodeId: payload?.nodeId,
  };
};

export const chain_of_thought = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    instruction: asString(payload?.instruction),
    thoughtVariable: asString(payload?.thoughtVariable, "aiThought"),
    answerVariable: asString(payload?.answerVariable, "aiAnswer"),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
  };
};

export const smart_selector = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    originalSelector: asString(payload?.originalSelector),
    intent: asString(payload?.intent),
    variableName: asString(payload?.variableName, "suggestedSelector"),
    maxTokens: asNumber(payload?.maxTokens, 2048, 1),
    nodeId: payload?.nodeId,
  };
};

// ---------------------------------------------
// Builders (CI/CD Integration and Testing)
// ---------------------------------------------

export const integrate_ci = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    provider: asString(payload?.provider, "gitlab"),
    saveArtifacts: asBoolean(payload?.saveArtifacts, false),
    outputPath: asString(payload?.outputPath, "gitlab-artifacts"),
    uploadReports: asBoolean(payload?.uploadReports, false),
    envVariables: asJsonString(payload?.envVariables, false, '"envVariables"'),
    retryOnFail: asNumber(payload?.retryOnFail, 0, 0),
    verbose: asBoolean(payload?.verbose, false),
  };
};

export const run_tests = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    testSuite: asString(payload?.testSuite),
    parallel: asBoolean(payload?.parallel, false),
    retries: asNumber(payload?.retries, 0, 0),
    reportFormat: asString(payload?.reportFormat, "junit"),
    timeout: asNumber(payload?.timeout, 900000, 1),
  };
};

// ---------------------------------------------
// Builders (Metadata and CLI)
// ---------------------------------------------

export const cli_params = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    paramName: asString(payload?.paramName),
    paramType: asString(payload?.paramType, "string"),
    defaultValue: asString(payload?.defaultValue),
    required: asBoolean(payload?.required, false),
    validationCode: asString(payload?.validationCode),
  };
};

export const return_code = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    successField: asString(payload?.successField),
    exitOnFail: asBoolean(payload?.exitOnFail, false),
    customCodes: asJsonString(payload?.customCodes, false, '"customCodes"'),
    verbose: asBoolean(payload?.verbose, false),
  };
};

export const set_network_conditions = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    networkProfile: asString(payload?.networkProfile, "No throttling"),
    offline: asBoolean(payload?.offline, false),
    latency: asNumber(payload?.latency, 0),
    downloadThroughput: asNumber(payload?.downloadThroughput, 0),
    uploadThroughput: asNumber(payload?.uploadThroughput, 0),
  };
};

// ---------------------------------------------
// Builders (FLOW Control)
// ---------------------------------------------

export const variable = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    operation: asString(payload?.operation, "set"),
    name: asString(payload?.name),
    value: asString(payload?.value),
    scope: asString(payload?.scope, "flow"),
  };
};

export const conditional = (payload) => {
  const body = {
    browserId: asString(payload?.browserId),
    debugMode: asBoolean(payload?.debugMode, false),
  };

  if (Array.isArray(payload?.branches) && payload.branches.length > 0) {
    body.branches = payload.branches;
    body.fallbackPath = asString(payload.fallbackPath, "false");
  }

  if (
    typeof payload?.conditions === "string" &&
    payload.conditions.trim() !== ""
  ) {
    try {
      body.conditions = JSON.parse(payload.conditions);
    } catch {
      body.conditions = payload.conditions;
    }
    body.logic = asString(payload.logic, "AND");
  } else if (
    Array.isArray(payload?.conditions) &&
    payload.conditions.length > 0
  ) {
    body.conditions = payload.conditions;
    body.logic = asString(payload.logic, "AND");
  }

  if (!body.branches && !body.conditions) {
    if (payload?.expression) {
      // Migrate legacy single expression to a standard branch structure
      body.branches = [
        {
          id: "true",
          label: "True",
          expression: payload.expression,
          mode: "advanced",
        },
        { id: "false", label: "Else", expression: "", mode: "advanced" },
      ];
    } else {
      body.branches = [
        { id: "true", label: "True", expression: "true" },
        { id: "false", label: "False", expression: "false" },
      ];
    }
    body.fallbackPath = "false";
  }

  return body;
};

export const loop = (payload) => {
  // Normalize loopType, supporting mode/type for legacy compatibility
  let loopType = payload?.loopType;
  if (!loopType) {
    const legacyMode = payload?.mode || payload?.type;
    loopType = legacyMode === "while" ? "while" : "for";
  }

  const rawIterations = payload?.iterations;
  const iterations =
    typeof rawIterations === "string" &&
    (rawIterations.includes("{{") ||
      rawIterations.includes("$") ||
      isNaN(Number(rawIterations)))
      ? rawIterations.trim()
      : asNumber(rawIterations, 10, 1);

  return {
    browserId: asString(payload?.browserId),
    loopType,
    iterations,
    condition: asString(payload?.condition),
    executionMode: asString(payload?.executionMode, "sequential"),
    concurrencyLimit: asNumber(payload?.concurrencyLimit, 5, 1, 100),
    breakOnError: asBoolean(payload?.breakOnError, true),
    collectResults: asBoolean(payload?.collectResults, true),
    maxIterations: asNumber(payload?.maxIterations, 1000, 1, 10000),
    flowId: asString(payload?.flowId),
    array: payload?.array !== undefined ? asString(payload?.array) : undefined,
    itemVar:
      payload?.itemVar !== undefined ? asString(payload?.itemVar) : undefined,
  };
};

export const switch_node = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    variableName: asString(payload?.variableName),
    cases: Array.isArray(payload?.cases) ? payload.cases : [],
    scope: asString(payload?.scope, "flow"),
  };
};

export { switch_node as switch };

export const branch = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    mode: asString(payload?.mode, "parallel"),
    timeout: asNumber(payload?.timeout, 30000, 0),
  };
};

export const flow_control = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    action: asString(payload?.action, "break"),
    returnValue: asJsonString(payload?.returnValue, false, '"returnValue"'),
  };
};

export const transform = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    operation: asString(payload?.operation, "map"),
    input: asString(payload?.input),
    expression: asString(payload?.expression),
    mergeWith: asString(payload?.mergeWith),
    outputVar: asString(payload?.outputVar),
  };
};

export const backend_js = (payload) => {
  return {
    browserId: asString(payload?.browserId),
    script: asString(payload?.script ?? payload?.expression ?? payload?.code),
    expression: asString(
      payload?.expression ?? payload?.script ?? payload?.code,
    ),
    timeout: asNumber(payload?.timeout, 10000, 0),
  };
};
