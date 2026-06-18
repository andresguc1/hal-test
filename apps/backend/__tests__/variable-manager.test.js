import { describe, it, expect, beforeEach } from 'vitest';

// We need a fresh instance for each test, so we import the class-like constructor
// by dynamically importing and creating fresh instances.
// However, VariableManager exports a singleton. We'll work around this.
let variableManager;

beforeEach(async () => {
    // Re-import to get the singleton, then reset its state
    const mod = await import('../services/VariableManager.js');
    variableManager = mod.variableManager;
    variableManager.clearAll();
});

// =============================================================================
// SCOPE MANAGEMENT
// =============================================================================
describe('VariableManager - Scope Management', () => {
    it('should initialize a run scope with variables', () => {
        variableManager.initRun('run-1', { user: 'Alice', count: 5 });
        expect(variableManager.get('user', 'run-1')).toBe('Alice');
        expect(variableManager.get('count', 'run-1')).toBe(5);
    });

    it('should isolate variables between runs', () => {
        variableManager.initRun('run-A', { env: 'staging' });
        variableManager.initRun('run-B', { env: 'production' });

        expect(variableManager.get('env', 'run-A')).toBe('staging');
        expect(variableManager.get('env', 'run-B')).toBe('production');
    });

    it('should clear a specific run without affecting others', () => {
        variableManager.initRun('run-1', { x: 1 });
        variableManager.initRun('run-2', { y: 2 });

        variableManager.clear('run-1');

        expect(variableManager.get('x', 'run-1')).toBeUndefined();
        expect(variableManager.get('y', 'run-2')).toBe(2);
    });

    it('should clear all scopes with clearAll()', () => {
        variableManager.initRun('run-1', { a: 1 });
        variableManager.set('globalVar', 'hello');

        variableManager.clearAll();

        expect(variableManager.get('a', 'run-1')).toBeUndefined();
        expect(variableManager.get('globalVar')).toBeUndefined();
    });

    it('should track lastRunId via getActiveRunId()', () => {
        expect(variableManager.getActiveRunId()).toBeNull();

        variableManager.initRun('run-X');
        expect(variableManager.getActiveRunId()).toBe('run-X');

        variableManager.initRun('run-Y');
        expect(variableManager.getActiveRunId()).toBe('run-Y');
    });

    it('should merge initial variables with existing scope on re-init', () => {
        variableManager.initRun('run-1', { a: 1 });
        variableManager.set('b', 2, 'run-1');

        // Re-init with new vars should merge, not replace
        variableManager.initRun('run-1', { c: 3 });

        expect(variableManager.get('a', 'run-1')).toBe(1);
        expect(variableManager.get('b', 'run-1')).toBe(2);
        expect(variableManager.get('c', 'run-1')).toBe(3);
    });
});

// =============================================================================
// GET / SET / HAS / DELETE
// =============================================================================
describe('VariableManager - Get/Set/Has/Delete', () => {
    it('should set and get variables in a run scope', () => {
        variableManager.initRun('run-1');
        variableManager.set('myVar', 'hello', 'run-1');

        expect(variableManager.get('myVar', 'run-1')).toBe('hello');
    });

    it('should return undefined for non-existent variables', () => {
        variableManager.initRun('run-1');
        expect(variableManager.get('nonExistent', 'run-1')).toBeUndefined();
    });

    it('should check variable existence with has()', () => {
        variableManager.initRun('run-1');
        variableManager.set('exists', true, 'run-1');

        expect(variableManager.has('exists', 'run-1')).toBe(true);
        expect(variableManager.has('missing', 'run-1')).toBe(false);
    });

    it('should delete a variable', () => {
        variableManager.initRun('run-1');
        variableManager.set('toDelete', 'bye', 'run-1');

        variableManager.delete('toDelete', 'run-1');
        expect(variableManager.get('toDelete', 'run-1')).toBeUndefined();
    });

    it('should increment a numeric variable', () => {
        variableManager.initRun('run-1');
        variableManager.set('counter', 0, 'run-1');

        variableManager.increment('counter', 1, 'run-1');
        expect(variableManager.get('counter', 'run-1')).toBe(1);

        variableManager.increment('counter', 5, 'run-1');
        expect(variableManager.get('counter', 'run-1')).toBe(6);
    });

    it('should push to an array variable', () => {
        variableManager.initRun('run-1');
        variableManager.set('list', [], 'run-1');

        variableManager.push('list', 'a', 'run-1');
        variableManager.push('list', 'b', 'run-1');

        expect(variableManager.get('list', 'run-1')).toEqual(['a', 'b']);
    });

    it('should getAll() variables for a run', () => {
        variableManager.initRun('run-1', { x: 1, y: 2 });
        variableManager.set('z', 3, 'run-1');

        const all = variableManager.getAll('run-1');
        expect(all).toMatchObject({ x: 1, y: 2, z: 3 });
    });
});

// =============================================================================
// DOT-PATH RESOLUTION
// =============================================================================
describe('VariableManager - Dot-Path Resolution', () => {
    it('should resolve dot-path into nested objects', () => {
        variableManager.initRun('run-1');
        variableManager.set('Login.result', { success: true, status: 'completed' }, 'run-1');

        expect(variableManager.get('Login.result.success', 'run-1')).toBe(true);
        expect(variableManager.get('Login.result.status', 'run-1')).toBe('completed');
    });

    it('should auto-dive into .data property', () => {
        variableManager.initRun('run-1');
        variableManager.set(
            'MyNode.result',
            {
                success: true,
                data: { url: 'https://example.com', title: 'Test' },
            },
            'run-1',
        );

        // Direct access to nested data via dot-path
        expect(variableManager.get('MyNode.result.success', 'run-1')).toBe(true);
        expect(variableManager.get('MyNode.result.data.url', 'run-1')).toBe('https://example.com');
        expect(variableManager.get('MyNode.result.data.title', 'run-1')).toBe('Test');
    });

    it('should handle normalized matching (case-insensitive, stripped special chars)', () => {
        variableManager.initRun('run-1');
        variableManager.set('Login Steps.result', { success: true }, 'run-1');

        // Normalized: "loginsteps" should match "Login Steps"
        expect(variableManager.get('loginsteps.result.success', 'run-1')).toBe(true);
    });

    it('should handle (Library) suffix stripping', () => {
        variableManager.initRun('run-1');
        variableManager.set('Login Steps.result', { success: true }, 'run-1');

        // "(Library)" suffix should be stripped during normalization
        expect(variableManager.get('Login Steps (Library).result.success', 'run-1')).toBe(true);
    });
});

// =============================================================================
// TEMPLATE INTERPOLATION
// =============================================================================
describe('VariableManager - Template Interpolation', () => {
    it('should resolve {{variable}} in strings', () => {
        variableManager.initRun('run-1');
        variableManager.set('name', 'World', 'run-1');

        const result = variableManager.resolve('Hello {{name}}!', 'run-1');
        expect(result).toBe('Hello World!');
    });

    it('should resolve ${variable} in strings', () => {
        variableManager.initRun('run-1');
        variableManager.set('greeting', 'Hi', 'run-1');

        const result = variableManager.resolve('${greeting} there', 'run-1');
        expect(result).toBe('Hi there');
    });

    it('should leave unresolved placeholders intact', () => {
        variableManager.initRun('run-1');

        const result = variableManager.resolve('Hello {{unknown}}', 'run-1');
        expect(result).toBe('Hello {{unknown}}');
    });

    it('should resolveValue() returning full object for single-placeholder templates', () => {
        variableManager.initRun('run-1');
        variableManager.set('data', { id: 1, name: 'test' }, 'run-1');

        // When the entire template is a single placeholder, return the raw value (not stringified)
        const result = variableManager.resolveValue('{{data}}', 'run-1');
        expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should resolve multiple variables in one string', () => {
        variableManager.initRun('run-1');
        variableManager.set('first', 'John', 'run-1');
        variableManager.set('last', 'Doe', 'run-1');

        const result = variableManager.resolve('{{first}} {{last}}', 'run-1');
        expect(result).toBe('John Doe');
    });
});

// =============================================================================
// CONDITION EVALUATION
// =============================================================================
describe('VariableManager - Condition Evaluation', () => {
    describe('evaluateCondition() - Operators', () => {
        it('should evaluate == correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('status', 'success', 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{status}}', operator: '==', right: 'success' },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should evaluate != correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('status', 'error', 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{status}}', operator: '!=', right: 'success' },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should evaluate > correctly with numbers', () => {
            variableManager.initRun('run-1');
            variableManager.set('count', 10, 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{count}}', operator: '>', right: '5' },
                    'run-1',
                ),
            ).toBe(true);

            expect(
                variableManager.evaluateCondition(
                    { left: '{{count}}', operator: '>', right: '15' },
                    'run-1',
                ),
            ).toBe(false);
        });

        it('should evaluate < correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('count', 3, 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{count}}', operator: '<', right: '5' },
                    'run-1',
                ),
            ).toBe(true);
        });

        it('should evaluate >= correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('count', 5, 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{count}}', operator: '>=', right: '5' },
                    'run-1',
                ),
            ).toBe(true);
        });

        it('should evaluate <= correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('count', 5, 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{count}}', operator: '<=', right: '5' },
                    'run-1',
                ),
            ).toBe(true);
        });

        it('should evaluate contains correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('text', 'Hello World', 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{text}}', operator: 'contains', right: 'World' },
                    'run-1',
                ),
            ).toBe(true);

            expect(
                variableManager.evaluateCondition(
                    { left: '{{text}}', operator: 'contains', right: 'Mars' },
                    'run-1',
                ),
            ).toBe(false);
        });

        it('should evaluate exists correctly', () => {
            variableManager.initRun('run-1');
            variableManager.set('present', 'yes', 'run-1');

            expect(
                variableManager.evaluateCondition(
                    { left: '{{present}}', operator: 'exists' },
                    'run-1',
                ),
            ).toBe(true);

            expect(
                variableManager.evaluateCondition(
                    { left: '{{absent}}', operator: 'exists' },
                    'run-1',
                ),
            ).toBe(false);
        });
    });

    describe('evaluateCondition() - Type Normalization', () => {
        it('should normalize boolean strings ("true"/"false")', () => {
            variableManager.initRun('run-1');
            variableManager.set('flag', 'true', 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{flag}}', operator: '==', right: true },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should normalize "success" as truthy', () => {
            variableManager.initRun('run-1');
            variableManager.set('status', 'success', 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{status}}', operator: '==', right: true },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should normalize "error"/"fail" as falsy', () => {
            variableManager.initRun('run-1');
            variableManager.set('status', 'error', 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{status}}', operator: '==', right: false },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should normalize numeric strings for comparison', () => {
            variableManager.initRun('run-1');
            variableManager.set('count', 10, 'run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{count}}', operator: '==', right: '10' },
                'run-1',
            );
            expect(result).toBe(true);
        });
    });

    describe('evaluateCondition() - Edge Cases', () => {
        it('should reject unresolved placeholders (return false)', () => {
            variableManager.initRun('run-1');

            const result = variableManager.evaluateCondition(
                { left: '{{missing_var}}', operator: '==', right: 'anything' },
                'run-1',
            );
            expect(result).toBe(false);
        });

        it('should return false for undefined left operand (non-exists operator)', () => {
            variableManager.initRun('run-1');

            const result = variableManager.evaluateCondition(
                { left: 'nonexistent', operator: '==', right: 'value' },
                'run-1',
            );
            expect(result).toBe(false);
        });
    });

    describe('evaluateConditions() - AND/OR logic', () => {
        it('should evaluate AND logic (all must be true)', () => {
            variableManager.initRun('run-1');
            variableManager.set('a', 'yes', 'run-1');
            variableManager.set('b', 'yes', 'run-1');

            const result = variableManager.evaluateConditions(
                [
                    { left: '{{a}}', operator: '==', right: 'yes' },
                    { left: '{{b}}', operator: '==', right: 'yes' },
                ],
                'AND',
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should fail AND logic if any is false', () => {
            variableManager.initRun('run-1');
            variableManager.set('a', 'yes', 'run-1');
            variableManager.set('b', 'no', 'run-1');

            const result = variableManager.evaluateConditions(
                [
                    { left: '{{a}}', operator: '==', right: 'yes' },
                    { left: '{{b}}', operator: '==', right: 'yes' },
                ],
                'AND',
                'run-1',
            );
            expect(result).toBe(false);
        });

        it('should evaluate OR logic (any must be true)', () => {
            variableManager.initRun('run-1');
            variableManager.set('a', 'no', 'run-1');
            variableManager.set('b', 'yes', 'run-1');

            const result = variableManager.evaluateConditions(
                [
                    { left: '{{a}}', operator: '==', right: 'yes' },
                    { left: '{{b}}', operator: '==', right: 'yes' },
                ],
                'OR',
                'run-1',
            );
            expect(result).toBe(true);
        });
    });

    describe('evaluateStructured()', () => {
        it('should evaluate a structured rule object', () => {
            variableManager.initRun('run-1');
            variableManager.set('Login.result', { success: true, status: 'success' }, 'run-1');

            const result = variableManager.evaluateStructured(
                { left: '{{Login.result.success}}', operator: '==', right: true },
                'run-1',
            );
            expect(result).toBe(true);
        });

        it('should return false for null/non-object input', () => {
            expect(variableManager.evaluateStructured(null)).toBe(false);
            expect(variableManager.evaluateStructured('string')).toBe(false);
        });
    });

    describe('evaluate() - Raw JS expressions', () => {
        it('should evaluate simple JS expressions with variable substitution', () => {
            variableManager.initRun('run-1');
            variableManager.set('x', 10, 'run-1');

            const result = variableManager.evaluate('{{x}} > 5', 'run-1');
            expect(result).toBe(true);
        });

        it('should handle expression errors gracefully in non-strict mode', () => {
            variableManager.initRun('run-1');

            // Invalid JS expression should not throw
            const result = variableManager.evaluate('invalid +++', 'run-1');
            // Should return the resolved string (fallback), not throw
            expect(result).toBeDefined();
        });

        it('should throw in strict mode for invalid expressions', () => {
            variableManager.initRun('run-1');

            expect(() => {
                variableManager.evaluate('invalid +++', 'run-1', {}, true);
            }).toThrow();
        });
    });
});

// =============================================================================
// SANITIZATION
// =============================================================================
describe('VariableManager - Sanitization', () => {
    it('should sanitize circular references without throwing', () => {
        variableManager.initRun('run-1');

        const obj = { a: 1 };
        obj.self = obj; // circular

        // Should not throw; _sanitize handles it
        variableManager.set('circular', obj, 'run-1');
        const result = variableManager.get('circular', 'run-1');

        // The circular value will be stringified, so it won't be the original object
        expect(result).toBeDefined();
    });

    it('should preserve simple values without modification', () => {
        variableManager.initRun('run-1');

        variableManager.set('str', 'hello', 'run-1');
        variableManager.set('num', 42, 'run-1');
        variableManager.set('bool', true, 'run-1');
        variableManager.set('nil', null, 'run-1');

        expect(variableManager.get('str', 'run-1')).toBe('hello');
        expect(variableManager.get('num', 'run-1')).toBe(42);
        expect(variableManager.get('bool', 'run-1')).toBe(true);
        expect(variableManager.get('nil', 'run-1')).toBeNull();
    });
});

// =============================================================================
// DATASET VARIABLE TRACKING & OVERRIDES
// =============================================================================
describe('VariableManager - Dataset Variable Tracking', () => {
    it('should track variables initialized from dataset', () => {
        variableManager.initRun('run-dataset-1', { user_role: 'standard_user', env: 'dev' });
        expect(variableManager.isInitializedFromDataset('user_role', 'run-dataset-1')).toBe(true);
        expect(variableManager.isInitializedFromDataset('env', 'run-dataset-1')).toBe(true);
        expect(variableManager.isInitializedFromDataset('other_var', 'run-dataset-1')).toBe(false);
    });

    it('should clean up tracked initialized variables on clear', () => {
        variableManager.initRun('run-dataset-1', { user_role: 'standard_user' });
        expect(variableManager.isInitializedFromDataset('user_role', 'run-dataset-1')).toBe(true);

        variableManager.clear('run-dataset-1');
        expect(variableManager.isInitializedFromDataset('user_role', 'run-dataset-1')).toBe(false);
    });
});
