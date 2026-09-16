// optionActions.js
// Pure helpers to model the "desired action" per option.
// Keeps the option-list state management out of the React component so it is
// easy to reason about and unit-test in isolation.
//
// The configuration (array passed to the node) contains only options with an
// explicit action !== NO_CHANGE. Absence of an entry means "leave as-is".

export const ACTION_NO_CHANGE = "NO_CHANGE";
export const ACTION_CHECK = "CHECK";
export const ACTION_UNCHECK = "UNCHECK";
export const ACTION_SELECT = "SELECT";

const VALID_ACTIONS = new Set([
  ACTION_NO_CHANGE,
  ACTION_CHECK,
  ACTION_UNCHECK,
  ACTION_SELECT,
]);

export function normalizeAction(action) {
  const a = String(action || "CHECK")
    .toUpperCase()
    .trim();
  return VALID_ACTIONS.has(a) ? a : ACTION_CHECK;
}

// Compares two option-ish entries by label or value identity.
export function sameOption(a, b) {
  if (!a || !b) return false;
  if (a.label && b.label && String(a.label) === String(b.label)) return true;
  return (
    a.value !== undefined &&
    b.value !== undefined &&
    String(a.value) === String(b.value)
  );
}

// The current configured action for an option (default NO_CHANGE if unlisted).
export function getActionFor(config, opt) {
  const key = keyFor(opt);
  const found = (config || []).find((s) => keyFor(s) === key);
  return found && found.action
    ? normalizeAction(found.action)
    : ACTION_NO_CHANGE;
}

// Returns a new config with the desired action set for `opt` (removing the
// entry when action is NO_CHANGE).
export function setActionFor(config, opt, action) {
  const normalized = normalizeAction(action);
  const key = keyFor(opt);
  const next = (config || []).filter((s) => keyFor(s) !== key);
  if (normalized !== ACTION_NO_CHANGE) {
    next.push({
      label: opt.label,
      value: opt.value != null ? String(opt.value) : "",
      action: normalized,
    });
  }
  return next;
}

// Select All -> CHECK/SELECT for every enabled option.
export function selectAllFor(options, defaultAction = ACTION_CHECK) {
  return (options || [])
    .filter((o) => o.enabled !== false)
    .map((o) => ({
      label: o.label,
      value: o.value != null ? String(o.value) : "",
      action: defaultAction,
    }));
}

export function countActions(config) {
  return (config || []).filter(
    (c) => c.action && normalizeAction(c.action) !== ACTION_NO_CHANGE,
  ).length;
}

/**
 * Normalizes a string for comparison (lowercase, trim, remove extra whitespace).
 * @param {string} str
 * @returns {string}
 */
function normalizeString(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Finds the best matching option in detectedOptions for a configured option.
 * Priority: data-testid > value > accessible name/label > index
 *
 * @param {Object} configured - The configured option {label, value, action}
 * @param {Object[]} detectedOptions - Array of detected options from discovery
 * @returns {Object|null} - { matchedOption, meta } or null if no match
 */
export function findBestMatch(configured, detectedOptions) {
  if (!configured || !detectedOptions?.length) return null;

  const configuredLabel = configured.label;
  const configuredValue = configured.value;

  // 1. Try exact label match (normalized)
  if (configuredLabel) {
    const normLabel = normalizeString(configuredLabel);
    let match = detectedOptions.find(
      (o) => normalizeString(o.label) === normLabel,
    );
    if (match)
      return {
        matchedOption: match,
        meta: { label: match.label, value: match.value },
      };
  }

  // 2. Try exact value match (normalized)
  if (
    configuredValue !== undefined &&
    configuredValue !== null &&
    configuredValue !== ""
  ) {
    const normValue = normalizeString(configuredValue);
    let match = detectedOptions.find(
      (o) => o.value !== undefined && normalizeString(o.value) === normValue,
    );
    if (match)
      return {
        matchedOption: match,
        meta: { label: match.label, value: match.value },
      };
  }

  // 3. Try partial label match (configured label contains detected or vice versa)
  if (configuredLabel) {
    const normLabel = normalizeString(configuredLabel);
    let match = detectedOptions.find((o) => {
      const detLabel = normalizeString(o.label);
      return detLabel.includes(normLabel) || normLabel.includes(detLabel);
    });
    if (match)
      return {
        matchedOption: match,
        meta: { label: match.label, value: match.value },
      };
  }

  // 4. Try partial value match
  if (
    configuredValue !== undefined &&
    configuredValue !== null &&
    configuredValue !== ""
  ) {
    const normValue = normalizeString(configuredValue);
    let match = detectedOptions.find((o) => {
      if (o.value === undefined) return false;
      const detValue = normalizeString(o.value);
      return detValue.includes(normValue) || normValue.includes(detValue);
    });
    if (match)
      return {
        matchedOption: match,
        meta: { label: match.label, value: match.value },
      };
  }

  // 5. Fallback: match by index if only one option of this type exists
  // (fragile, but better than nothing)
  return null;
}

/**
 * Merges existing configuration with newly detected options on refresh.
 * Preserves actions for matched options, marks missing options, adds new options as NO_CHANGE.
 *
 * @param {Object[]} oldConfig - Previous configuration [{label, value, action}]
 * @param {Object[]} newDetectedOptions - Freshly detected options from discovery
 * @returns {Object[]} Merged configuration
 */
export function mergeConfigOnRefresh(oldConfig, newDetectedOptions) {
  if (!oldConfig?.length) return [];
  if (!newDetectedOptions?.length) {
    // All previously configured options are now missing
    return oldConfig.map((cfg) => ({
      ...cfg,
      _missing: true,
      _matched: false,
    }));
  }

  const merged = oldConfig.map((cfg) => {
    const match = findBestMatch(cfg, newDetectedOptions);
    if (match) {
      // Option still exists - preserve action, update metadata
      return {
        ...cfg,
        ...match.meta,
        _matched: true,
        _missing: false,
      };
    }
    // Option no longer detected - mark as missing but preserve action
    return {
      ...cfg,
      _missing: true,
      _matched: false,
    };
  });

  // Add new detected options that weren't in old config (with NO_CHANGE default)
  const existingKeys = new Set(oldConfig.map(keyFor));
  const newOptions = newDetectedOptions
    .filter((o) => !existingKeys.has(keyFor(o)))
    .map((o) => ({
      label: o.label,
      value: o.value != null ? String(o.value) : "",
      action: ACTION_NO_CHANGE,
      _new: true,
      _matched: false,
      _missing: false,
    }));

  return [...merged, ...newOptions];
}

// Expose keyFor for external use if needed
export function keyFor(opt) {
  return `${String(opt?.label ?? "")}::${opt?.value != null ? String(opt.value) : ""}`;
}

export default {
  ACTION_NO_CHANGE,
  ACTION_CHECK,
  ACTION_UNCHECK,
  ACTION_SELECT,
  normalizeAction,
  sameOption,
  getActionFor,
  setActionFor,
  selectAllFor,
  countActions,
  findBestMatch,
  mergeConfigOnRefresh,
  keyFor,
};
