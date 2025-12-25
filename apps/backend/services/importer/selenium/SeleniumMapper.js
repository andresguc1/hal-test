import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Selenium Webdriver a acciones Hal_Test.
 * Soporta:
 * - driver.get('url')
 * - driver.findElement(By.id('...')).click()
 * - driver.findElement(By.name('...')).sendKeys('...')
 */
export class SeleniumMapper extends AbstractMapper {
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
        // Recurse into TryStatement (try/catch/finally)
        if (statement.type === 'TryStatement') {
            const actions = [];
            if (statement.block) {
                actions.push(...this.map(statement.block));
            }
            if (statement.finalizer) {
                actions.push(...this.map(statement.finalizer));
            }
            return actions;
        }

        // Selenium actions are usually AwaitExpressions
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'AwaitExpression'
        ) {
            return this.mapExpression(statement.expression.argument);
        }
        // Also handle non-awaited calls (just in case)
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
        console.log('[DEBUG] Mapping expression:', callee.type, callee.property?.name); // Uncomment for deep debug

        // Caso 1: driver.get('url'), driver.quit()
        if (callee.type === 'MemberExpression') {
            const method = callee.property.name;

            // Asumimos que el objeto es 'driver' o similar
            if (method === 'get') {
                return [{ action: 'open_url', url: args[0]?.value }];
            } else if (method === 'quit') {
                return [{ action: 'close_browser' }];
            } else if (method === 'takeScreenshot') {
                return [{ action: 'take_screenshot' }];
            }
        }

        // Caso 2: driver.findElement(By.id('...')).click()
        // Encadenamiento: Call(Member(Call(findElement), click))
        if (callee.type === 'MemberExpression') {
            const object = callee.object; // driver.findElement(...)
            const method = callee.property.name;

            if (
                object.type === 'CallExpression' &&
                object.callee.property?.name === 'findElement'
            ) {
                // Extraer selector de By.id('...') o By.css('...')
                const byCall = object.arguments[0];
                let selector = 'unknown';

                if (
                    byCall &&
                    byCall.type === 'CallExpression' &&
                    byCall.callee.object?.name === 'By'
                ) {
                    const byMethod = byCall.callee.property.name;
                    const byValue = byCall.arguments[0]?.value;

                    if (byMethod === 'id') selector = `#${byValue}`;
                    else if (byMethod === 'className') selector = `.${byValue}`;
                    else if (byMethod === 'name') selector = `[name="${byValue}"]`;
                    else if (byMethod === 'css') selector = byValue;
                    else selector = `xpath=${byValue}`; // Fallback
                }

                if (method === 'click') {
                    return [{ action: 'click', selector }];
                } else if (method === 'sendKeys') {
                    return [{ action: 'type_text', selector, text: args[0]?.value }];
                }
            }
        }

        return [];
    }
}
