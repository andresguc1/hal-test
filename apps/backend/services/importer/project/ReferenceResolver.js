/**
 * Resuelve referencias a métodos externos (Page Objects, helpers, etc.)
 * usando el ProjectIndex.
 */
export class ReferenceResolver {
    constructor(projectIndex) {
        this.index = projectIndex;
        this.variableTypes = {}; // Track variable types in current scope
    }

    /**
     * Intenta resolver una llamada a método.
     * Retorna el cuerpo AST del método si se encuentra, o null.
     */
    resolveMethodCall(callExpression, currentScope = {}) {
        if (!callExpression || callExpression.type !== 'CallExpression') {
            return null;
        }

        const { callee } = callExpression;

        // Case 1: loginPage.login() -> MemberExpression
        if (callee.type === 'MemberExpression') {
            const objectName = callee.object.name;
            const methodName = callee.property.name;

            // Try to find the type of 'loginPage'
            const className = this.inferType(objectName, currentScope);

            if (className) {
                const method = this.index.findMethod(className, methodName);
                if (method) {
                    return {
                        type: 'method',
                        className,
                        methodName,
                        body: method.body,
                        params: method.params,
                        async: method.async,
                    };
                }
            }
        }

        // Case 2: setupDriver() -> Direct function call
        if (callee.type === 'Identifier') {
            const functionName = callee.name;
            const func = this.index.findFunction(functionName);

            if (func) {
                return {
                    type: 'function',
                    functionName,
                    body: func.body,
                    params: func.params,
                    async: func.async,
                };
            }
        }

        return null;
    }

    /**
     * Infiere el tipo de una variable basándose en:
     * 1. Scope actual (asignaciones locales)
     * 2. Nombre de la variable (heurística: loginPage -> LoginPage)
     */
    inferType(variableName, currentScope) {
        // Check current scope first
        if (currentScope[variableName]) {
            return currentScope[variableName];
        }

        // Heuristic: Convert camelCase to PascalCase
        // loginPage -> LoginPage
        const pascalCase = variableName.charAt(0).toUpperCase() + variableName.slice(1);

        if (this.index.classes[pascalCase]) {
            return pascalCase;
        }

        // Check if variable name matches a class name directly
        if (this.index.classes[variableName]) {
            return variableName;
        }

        return null;
    }

    /**
     * Registra el tipo de una variable en el scope actual.
     * Útil para rastrear: const loginPage = new LoginPage(page);
     */
    registerVariable(variableName, className) {
        this.variableTypes[variableName] = className;
    }

    /**
     * Extrae el tipo de una expresión 'new ClassName()'
     */
    extractTypeFromNewExpression(expression) {
        if (expression.type === 'NewExpression' && expression.callee.type === 'Identifier') {
            return expression.callee.name;
        }
        return null;
    }
}
