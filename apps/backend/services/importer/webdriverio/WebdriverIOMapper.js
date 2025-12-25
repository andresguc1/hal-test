import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de WebdriverIO a acciones Hal_Test.
 * Soporta:
 * - browser.url('...')
 * - $('selector').click()
 * - $('selector').setValue('text')
 * - browser.pause(ms)
 * - browser.saveScreenshot('path')
 */
export class WebdriverIOMapper extends AbstractMapper {
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
        // WDIO actions are usually AwaitExpressions
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'AwaitExpression'
        ) {
            return this.mapExpression(statement.expression.argument);
        }
        // Sync mode (no await)
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'CallExpression'
        ) {
            return this.mapExpression(statement.expression);
        }
        return [];
    }

    mapExpression(expression) {
        if (expression.type !== 'CallExpression') return [];

        const { callee, arguments: args } = expression;

        // Caso 1: browser.url(...), browser.pause(...)
        if (callee.type === 'MemberExpression' && callee.object.name === 'browser') {
            const method = callee.property.name;
            if (method === 'url') {
                return [{ action: 'open_url', url: args[0]?.value }];
            } else if (method === 'pause') {
                // wait_fixed no implementado, usar wait_conditional o ignorar
            } else if (method === 'saveScreenshot') {
                return [{ action: 'take_screenshot' }];
            } else if (method === 'deleteSession') {
                return [{ action: 'close_browser' }];
            }
        }

        // Caso 2: $('selector').click(), $('selector').setValue(...)
        // Esto es un encadenamiento: Call(Member(Call($, [selector]), click), [])
        if (callee.type === 'MemberExpression') {
            const object = callee.object; // Debería ser la llamada a $()
            const method = callee.property.name;

            if (object.type === 'CallExpression' && object.callee.name === '$') {
                const selector = object.arguments[0]?.value;

                if (method === 'click') {
                    return [{ action: 'click', selector }];
                } else if (method === 'setValue' || method === 'addValue') {
                    return [{ action: 'type_text', selector, text: args[0]?.value }];
                } else if (method === 'waitForDisplayed') {
                    return [{ action: 'wait_visible', selector }];
                }
            }
        }

        return [];
    }
}
