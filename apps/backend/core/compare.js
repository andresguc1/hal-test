/**
 * compare.js — Shared value normalization/coercion helpers.
 *
 * These small, pure helpers are shared between the Switch and Conditional
 * evaluation paths so that both nodes apply the same coercion semantics when
 * comparing resolved values against case/rule values.
 */

/**
 * Normalize a single resolved value for comparison (used by Switch).
 * - keep booleans as-is
 * - trim numeric-looking strings and coerce them to numbers
 * - leave everything else untouched
 *
 * @param {*} val
 * @returns {*}
 */
export function normalizeValue(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const s = val.trim();
        if (s !== '' && /^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
        return s;
    }
    return val;
}

const TRUE_STRINGS = ['true', 'success'];
const FALSE_STRINGS = ['false', 'error', 'fail'];

const isTrueString = (val) => typeof val === 'string' && TRUE_STRINGS.includes(val.toLowerCase());
const isFalseString = (val) => typeof val === 'string' && FALSE_STRINGS.includes(val.toLowerCase());

/**
 * Coerce a {left, right} comparison pair so both operands share a type where
 * reasonable (used by ConditionEvaluator). Numeric strings are converted to
 * numbers, and common boolean-like strings are normalized against boolean
 * operands. Mutates neither argument; returns a new pair.
 *
 * @param {*} left
 * @param {*} right
 * @returns {{left: *, right: *}}
 */
export function coerceComparisonPair(left, right) {
    let rL = left;
    let rR = right;

    if (typeof rL === 'number' && typeof rR === 'string' && rR !== '' && !isNaN(rR)) {
        rR = Number(rR);
    } else if (typeof rR === 'number' && typeof rL === 'string' && rL !== '' && !isNaN(rL)) {
        rL = Number(rL);
    }

    if (typeof rL === 'boolean') {
        if (isTrueString(rR)) rR = true;
        else if (isFalseString(rR)) rR = false;
    } else if (typeof rR === 'boolean') {
        if (isTrueString(rL)) rL = true;
        else if (isFalseString(rL)) rL = false;
    }

    return { left: rL, right: rR };
}

/**
 * Boolean normalization helpers for operators that need to treat a boolean
 * operand against a string value.
 */
export function isBooleanTrueString(val) {
    return isTrueString(val);
}

export function isBooleanFalseString(val) {
    return isFalseString(val);
}
