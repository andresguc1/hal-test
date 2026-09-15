import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * MutabilityStrategy
 *
 * Verifies whether an element's content has changed or remained unchanged
 * compared to a previously captured snapshot.
 *
 * This enables validation of dynamic content scenarios (e.g., The Internet
 * HerokuApp - Dynamic Content) where content may mutate after page reloads,
 * AJAX updates, or user interactions.
 *
 * Operators:
 *  - has_changed        — Current value differs from stored snapshot
 *  - remains_unchanged  — Current value matches stored snapshot
 *
 * The snapshot is stored in the execution context variables under a key
 * derived from `snapshotKey` (default: "assertion_snapshot_{selector}").
 * The snapshot should be captured BEFORE the mutating action (e.g., page reload)
 * using a separate step or via the `capture_snapshot` action.
 *
 * Options:
 *  - snapshotKey: string (required) — Key to identify the snapshot in context variables
 *  - property: 'text' | 'value' | 'html' | 'attribute:{name}' (default: 'text')
 *    - 'text'       — Uses innerText()
 *    - 'value'      — Uses inputValue()
 *    - 'html'       — Uses innerHTML
 *    - 'attribute:{name}' — Uses getAttribute(name)
 *  - caseSensitive: boolean (default: false)
 *  - trimWhitespace: boolean (default: true) — Trim before comparison
 */
export class MutabilityStrategy extends BaseAssertionStrategy {
    get type() {
        return 'mutability';
    }

    get operators() {
        return ['has_changed', 'remains_unchanged'];
    }

    async execute(_page, locator, assertion, { timeout = 0, variables = {} } = {}) {
        const operator = assertion.operator || 'has_changed';
        const snapshotKey = assertion.snapshotKey;
        const property = assertion.property || 'text';
        const caseSensitive = assertion.caseSensitive === true;
        const trimWhitespace = assertion.trimWhitespace !== false;

        if (!snapshotKey) {
            return {
                passed: false,
                actual: null,
                expected: operator,
                message:
                    'snapshotKey is required for mutability assertions. Use the "snapshotKey" field to reference a previously captured value.',
            };
        }

        // Get snapshot value from variables context
        const snapshotValue = variables[snapshotKey];

        if (snapshotValue === undefined || snapshotValue === null) {
            return {
                passed: false,
                actual: 'missing_snapshot',
                expected: snapshotKey,
                message: `No snapshot found for key "${snapshotKey}". Capture a snapshot before the mutating action using the "capture_snapshot" action or by storing the value in variables.`,
            };
        }

        // Wait for element to be attached
        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected: operator,
                message: 'Element was not found, so its content could not be compared.',
            };
        }

        // Extract current value based on property type
        let currentValue;
        try {
            if (property === 'value') {
                currentValue = await locator.inputValue().catch(() => '');
            } else if (property === 'html') {
                currentValue = await locator.innerHTML().catch(() => '');
            } else if (property.startsWith('attribute:')) {
                const attrName = property.split(':')[1];
                currentValue = (await locator.getAttribute(attrName).catch(() => '')) ?? '';
            } else {
                // default: text
                currentValue = await locator.innerText().catch(() => '');
            }
        } catch (err) {
            return {
                passed: false,
                actual: 'error',
                expected: operator,
                message: `Failed to read current value: ${err.message}`,
            };
        }

        // Normalize values for comparison
        const normalize = (val) => {
            let str = String(val ?? '');
            if (trimWhitespace) str = str.trim();
            if (!caseSensitive) str = str.toLowerCase();
            return str;
        };

        const normalizedCurrent = normalize(currentValue);
        const normalizedSnapshot = normalize(snapshotValue);

        let passed;
        let message;

        if (operator === 'has_changed') {
            passed = normalizedCurrent !== normalizedSnapshot;
            if (!passed) {
                message = `Expected content to have changed from snapshot "${this.truncate(normalizedSnapshot)}" but it remained "${this.truncate(normalizedCurrent)}".`;
            }
        } else if (operator === 'remains_unchanged') {
            passed = normalizedCurrent === normalizedSnapshot;
            if (!passed) {
                message = `Expected content to remain unchanged (snapshot: "${this.truncate(normalizedSnapshot)}") but found "${this.truncate(normalizedCurrent)}".`;
            }
        } else {
            return {
                passed: false,
                actual: normalizedCurrent,
                expected: operator,
                message: `Unsupported operator "${operator}" for mutability assertions. Use "has_changed" or "remains_unchanged".`,
            };
        }

        return {
            passed,
            actual: normalizedCurrent,
            expected:
                operator === 'has_changed'
                    ? `!= ${this.truncate(normalizedSnapshot)}`
                    : normalizedSnapshot,
            message,
        };
    }

    truncate(text, max = 120) {
        if (text.length <= max) return text;
        return `${text.slice(0, max)}…`;
    }
}

registerAssertionStrategy(MutabilityStrategy);
export default MutabilityStrategy;
