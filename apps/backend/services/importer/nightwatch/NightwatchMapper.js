import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Nightwatch a acciones Hal_Test.
 * Nightwatch usa encadenamiento en el objeto 'browser'.
 * browser.url(...).waitForElementVisible(...).click(...)
 */
export class NightwatchMapper extends AbstractMapper {
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
        // Nightwatch statements are usually ExpressionStatements with CallExpressions (chain)
        if (statement.type === 'ExpressionStatement') {
            return this.mapExpression(statement.expression);
        }
        return [];
    }

    mapExpression(expression) {
        // Desenrollar encadenamiento similar a TestCafe
        const chain = [];
        let current = expression;

        while (current.type === 'CallExpression') {
            chain.unshift(current);
            if (current.callee.type === 'MemberExpression') {
                current = current.callee.object;
            } else {
                break;
            }
        }

        // Verificar si la raíz es 'browser' o similar (o el argumento de la función)
        // Simplificación: Asumimos que cualquier cadena larga es sobre el browser en este contexto
        if (chain.length > 0) {
            return this.processNightwatchChain(chain);
        }

        return [];
    }

    processNightwatchChain(chain) {
        const actions = [];

        for (const callExpr of chain) {
            if (callExpr.callee.type !== 'MemberExpression') continue;

            const methodName = callExpr.callee.property.name;
            const args = callExpr.arguments;

            if (methodName === 'url' || methodName === 'navigateTo') {
                actions.push({
                    action: 'open_url',
                    url: args[0]?.value,
                });
            } else if (methodName === 'click') {
                actions.push({
                    action: 'click',
                    selector: args[0]?.value,
                });
            } else if (methodName === 'setValue' || methodName === 'sendKeys') {
                actions.push({
                    action: 'type_text',
                    selector: args[0]?.value,
                    text: args[1]?.value,
                });
            } else if (methodName === 'waitForElementVisible') {
                actions.push({
                    action: 'wait_visible',
                    selector: args[0]?.value,
                });
            } else if (methodName === 'saveScreenshot') {
                actions.push({
                    action: 'take_screenshot',
                });
            } else if (methodName === 'pause') {
                // wait_fixed no está implementado en el backend actual, usamos wait_conditional o ignoramos
                // O podríamos mapearlo a un sleep si existiera
            } else if (methodName === 'end') {
                actions.push({
                    action: 'close_browser',
                });
            }
        }

        return actions;
    }
}
