/**
 * conditionTypeUtils.js — Shared helpers for type-aware rule editing.
 *
 * Given the grouped variable suggestions produced by useAvailableVariables
 * (and normalized in NodeConfigurationPanel), these helpers let editors
 * resolve the data type of the variable currently selected on the "left"
 * side of a rule, so the "Value" field can adapt (boolean dropdown, typed
 * input, etc.).
 */

export const BOOLEAN_LIKE_PROPERTIES = new Set([
  "found",
  "success",
  "visible",
  "exists",
  "matched",
  "isVisible",
  "isConnected",
  "passed",
  "checked",
  "enabled",
  "disabled",
  "required",
  "readonly",
]);

/**
 * Build a lookup map of template path -> { type, label } from the grouped
 * suggestions array [{ nodeLabel, items: [{ label, path, type, scope }] }].
 *
 * @param {Array} suggestions
 * @returns {Object<string, {type: string, label: string}>}
 */
export function buildVariableTypeLookup(suggestions) {
  const map = {};
  const record = (item) => {
    if (item && item.path && item.path.includes("{{")) {
      map[item.path] = { type: item.type, label: item.label };
    }
  };
  (suggestions || []).forEach((group) => {
    if (Array.isArray(group?.items)) group.items.forEach(record);
    else if (group && typeof group === "object") record(group);
  });
  return map;
}

/**
 * Resolve the string/data type of a "left" variable reference (e.g.
 * "{{Find Element.found}}").
 *
 * Prefers the type declared in the suggestions lookup, then falls back to a
 * name-based heuristic for well-known boolean-like properties so the Value
 * field still adapts even when live metadata is unavailable.
 *
 * @param {string} leftRef - The raw left operand value.
 * @param {Object} lookup - Map from buildVariableTypeLookup.
 * @returns {string|null} e.g. "boolean", "number", "string", or null.
 */
export function resolveVariableType(leftRef, lookup) {
  if (!leftRef || typeof leftRef !== "string") return null;

  const hit = lookup[leftRef.trim()];
  if (hit && hit.type) return hit.type;

  const match = leftRef.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
  if (!match) return null;

  const lastPart = match[1].trim().split(".").pop();
  if (!lastPart) return null;
  if (BOOLEAN_LIKE_PROPERTIES.has(lastPart)) return "boolean";
  return null;
}
