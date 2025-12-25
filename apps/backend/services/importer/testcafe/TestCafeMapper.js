import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de TestCafe a acciones Hal_Test.
 * TestCafe usa el objeto controlador 't' y encadenamiento.
 * Ejemplo: await t.typeText('#id', 'text').click('#btn');
 */
export class TestCafeMapper extends AbstractMapper {
    map(testBodyNode) {
        const actions = [];

        if (testBodyNode.type !== 'BlockStatement') {
            return actions;
        }

        for (const statement of testBodyNode.body) {
            const mappedActions = this.mapStatement(statement);
            if (mappedActions && mappedActions.length > 0) {
                actions.push(...mappedActions);
            }
        }

        return actions;
    }

    mapStatement(statement) {
        // TestCafe actions are usually AwaitExpressions containing CallExpressions (chain)
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'AwaitExpression'
        ) {
            return this.mapExpression(statement.expression.argument);
        }
        return [];
    }

    mapExpression(expression) {
        // Manejar encadenamiento: t.typeText(...).click(...)

        const chain = [];
        let current = expression;

        // Desenrollar el encadenamiento
        while (current.type === 'CallExpression') {
            chain.unshift(current); // Agregar al inicio
            if (current.callee.type === 'MemberExpression') {
                current = current.callee.object;
            } else {
                break;
            }
        }

        // Verificar si la raíz es 't' (el test controller)
        // La raíz del encadenamiento suele ser el objeto 't'
        // current ahora debería ser el identificador 't' o un MemberExpression final

        // En TestCafe: t.click() -> CallExpression(callee: MemberExpression(object: t, property: click))
        // Si hay cadena: t.click().typeText() -> CallExpression(callee: MemberExpression(object: Call(click), property: typeText))

        // El desenrollado deja en chain[0] la llamada más interna (la primera en ejecutarse si fuera síncrono, pero en cadena es izq a der)
        // Espera, t.click().typeText()
        // root call is typeText. object is t.click().
        // chain[0] = t.click()
        // chain[1] = .typeText()

        // Verificar que el objeto base sea 't'
        const firstCall = chain[0];
        if (firstCall.callee.type === 'MemberExpression' && firstCall.callee.object.name === 't') {
            return this.processTestCafeChain(chain);
        }

        return [];
    }

    processTestCafeChain(chain) {
        const actions = [];

        for (const callExpr of chain) {
            const methodName = callExpr.callee.property.name;
            const args = callExpr.arguments;

            if (methodName === 'navigateTo') {
                actions.push({
                    action: 'open_url',
                    url: args[0]?.value,
                });
            } else if (methodName === 'click') {
                actions.push({
                    action: 'click',
                    selector: args[0]?.value,
                });
            } else if (methodName === 'typeText') {
                actions.push({
                    action: 'type_text',
                    selector: args[0]?.value,
                    text: args[1]?.value,
                });
            } else if (methodName === 'expect') {
                // Assertions: t.expect(selector.exists).ok()
                // Esto es más complejo de mapear completamente
                actions.push({
                    action: 'wait_visible', // Fallback simple
                    selector: 'assertion-target',
                });
            } else if (methodName === 'takeScreenshot') {
                actions.push({
                    action: 'take_screenshot',
                });
            } else if (methodName === 'resizeWindow') {
                actions.push({
                    action: 'resize_viewport',
                    width: args[0]?.value,
                    height: args[1]?.value,
                });
            }
        }

        return actions;
    }
}
