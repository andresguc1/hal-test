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

const VALID_ACTIONS = new Set([ACTION_NO_CHANGE, ACTION_CHECK, ACTION_UNCHECK]);

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

const keyFor = (opt) =>
  `${String(opt?.label ?? "")}::${opt?.value != null ? String(opt.value) : ""}`;

// The current configured action for an option (default NO_CHANGE if unlisted).
export function getActionFor(config, opt) {
  const key = keyFor(opt);
  const found = (config || []).find((s) => keyFor(s) === key);
  return found && found.action ? normalizeAction(found.action) : ACTION_NO_CHANGE;
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

// Select All -> CHECK for every enabled option.
export function selectAllFor(options) {
  return (options || [])
    .filter((o) => o.enabled !== false)
    .map((o) => ({
      label: o.label,
      value: o.value != null ? String(o.value) : "",
      action: ACTION_CHECK,
    }));
}

export function countActions(config) {
  return (config || []).filter(
    (c) => c.action && normalizeAction(c.action) !== ACTION_NO_CHANGE,
  ).length;
}