/**
 * Configuration sync policy for the node configuration panel.
 *
 * The panel keeps a react-hook-form instance whose values must be written back
 * to the flow graph through a debounced update. Two invariants make that safe:
 *
 *  1. The form is only "dirty" when its values differ from the graph. The form
 *     registers every schema field, including its `defaultValue`, so a node
 *     stored without those defaults yields form values that can never equal the
 *     stored configuration. Comparing raw objects therefore leaves the panel
 *     permanently dirty: every re-render re-arms the debounce and, whenever the
 *     panel renders faster than the debounce delay, the pending write is
 *     starved and the typed value never reaches the graph (lost on save,
 *     reload and run).
 *
 *  2. A pending write must survive unrelated re-renders. The panel re-renders
 *     whenever the flow graph, the selection or the node tooltip changes, so
 *     re-arming the timer on every render can also starve a legitimate edit.
 *
 * These functions are pure so the policy can be unit-tested without React.
 */

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Key-sorted JSON so object key order never reads as a value change.
 * Arrays keep their order (it is meaningful for list inputs); objects inside
 * them are sorted recursively.
 */
export function canonicalizeConfig(values) {
  const seen = new WeakSet();
  const sort = (value) => {
    if (Array.isArray(value)) return value.map(sort);
    if (isPlainObject(value)) {
      if (seen.has(value)) return undefined;
      seen.add(value);
      const out = {};
      Object.keys(value)
        .sort()
        .forEach((key) => {
          out[key] = sort(value[key]);
        });
      return out;
    }
    return value;
  };
  try {
    return JSON.stringify(sort(values ?? {}));
  } catch {
    return "";
  }
}

/**
 * Collects the schema defaults the panel's fields register with the form.
 * @param {Array<{key: string, defaultValue?: unknown}>} inputs
 */
export function collectInputDefaults(inputs = []) {
  const defaults = {};
  (inputs || []).forEach((input) => {
    if (input?.key && input.defaultValue !== undefined) {
      defaults[input.key] = input.defaultValue;
    }
  });
  return defaults;
}

/**
 * Normalises a stored configuration into the shape the form actually holds:
 * schema defaults filled in for any field the graph does not carry.
 *
 * @param {object} config - Configuration as stored on the node.
 * @param {Array<{key: string, defaultValue?: unknown}>} inputs - Schema inputs.
 */
export function normalizeFormConfig(config, inputs = []) {
  const normalized = { ...(config || {}) };
  (inputs || []).forEach((input) => {
    if (
      input?.key &&
      normalized[input.key] === undefined &&
      input.defaultValue !== undefined
    ) {
      normalized[input.key] = input.defaultValue;
    }
  });
  return normalized;
}

export const SYNC_SYNCED = "synced";
export const SYNC_KEEP_PENDING = "keep-pending";
export const SYNC_RESCHEDULE = "reschedule";

/**
 * Decides what the panel should do with the current form values.
 *
 * - `synced`: the form already matches the graph, drop any pending write.
 * - `keep-pending`: a write for these exact values is already queued, so the
 *   timer must be left alone (this is what stops re-renders starving it).
 * - `reschedule`: the values changed, (re)arm the debounce.
 *
 * @param {object} params
 * @param {object} params.formValues - Values reported by `watch()`.
 * @param {object} params.baseline - Configuration the graph is expected to hold.
 * @param {object|null} [params.scheduledValues] - Values of the queued write.
 * @param {Array} [params.inputs] - Schema inputs used to fill defaults.
 * @returns {"synced"|"keep-pending"|"reschedule"}
 */
export function resolveSyncAction({
  formValues,
  baseline,
  scheduledValues = null,
  inputs = [],
}) {
  const current = canonicalizeConfig(normalizeFormConfig(formValues, inputs));
  const synced = canonicalizeConfig(normalizeFormConfig(baseline, inputs));

  if (current === synced) return SYNC_SYNCED;

  if (
    scheduledValues !== null &&
    current === canonicalizeConfig(normalizeFormConfig(scheduledValues, inputs))
  ) {
    return SYNC_KEEP_PENDING;
  }

  return SYNC_RESCHEDULE;
}
