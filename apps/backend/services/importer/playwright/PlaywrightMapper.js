import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Playwright a acciones Hal_Test.
 */
export class PlaywrightMapper extends AbstractMapper {
    map(testBodyNode) {
        const actions = [];

        // Asumimos que el body es un BlockStatement con una lista de expresiones
        if (testBodyNode.type !== 'BlockStatement') {
            return actions;
        }

        for (const statement of testBodyNode.body) {
            const action = this.mapStatement(statement);
            if (action) {
                actions.push(action);
            }
        }

        return actions;
    }

    mapStatement(statement) {
        // Manejar 'await page.action(...)'
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'AwaitExpression'
        ) {
            const callExpr = statement.expression.argument;
            if (callExpr.type === 'CallExpression') {
                return this.mapCallExpression(callExpr);
            }
        }
        return null;
    }

    mapCallExpression(callExpr) {
        const callee = callExpr.callee;

        // Verificar que sea una llamada a un método de un objeto (ej. page.click)
        if (callee.type !== 'MemberExpression') return null;

        const objectName = callee.object.name; // 'page' o 'expect'
        const methodName = callee.property.name; // 'goto', 'click', etc.
        const args = callExpr.arguments;

        // Mapeo directo
        if (objectName === 'page') {
            switch (methodName) {
                case 'goto':
                    return {
                        action: 'open_url',
                        url: args[0]?.value,
                    };
                case 'click':
                    return {
                        action: 'click',
                        selector: args[0]?.value,
                    };
                case 'fill':
                case 'type':
                    return {
                        action: 'type_text',
                        selector: args[0]?.value,
                        text: args[1]?.value,
                    };
                case 'screenshot':
                    return {
                        action: 'take_screenshot',
                        path: args[0]?.properties?.find((p) => p.key.name === 'path')?.value?.value,
                    };
                // Agregar más mapeos aquí
                default:
                    return {
                        action: 'execute_js',
                        description: `Unmapped Playwright action: ${methodName}`,
                        script: `// TODO: Implement manual mapping for page.${methodName}`,
                    };
            }
        }

        // Mapeo de test.step
        if (objectName === 'test' && methodName === 'step') {
            const stepLabel = args[0]?.value || 'Step';
            const callback = args[1];
            let subActions = [];

            if (
                callback &&
                (callback.type === 'ArrowFunctionExpression' ||
                    callback.type === 'FunctionExpression')
            ) {
                subActions = this.map(callback.body);
            }

            return {
                action: 'component',
                label: stepLabel,
                subNodes: subActions,
            };
        }

        // Mapeo de Expects (Aserciones)
        if (objectName === 'expect') {
            // Simplificación: Ignorar expects por ahora o mapear a validate_semantic
            return {
                action: 'validate_semantic',
                assertion: 'Generic Expectation', // Mejorar extracción
            };
        }

        return null;
    }
}
