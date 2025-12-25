import { AbstractMapper } from '../../core/AbstractMapper.js';

export class JavaSeleniumMapper extends AbstractMapper {
    constructor() {
        super();
        this.variables = {};
    }

    map(testBodyNode) {
        const actions = [];
        this.variables = {};

        if (testBodyNode.type !== 'BlockStatement') {
            return actions;
        }

        for (const statement of testBodyNode.body) {
            if (!statement) continue;
            const mappedActions = this.mapStatement(statement);
            if (mappedActions && mappedActions.length > 0) {
                actions.push(...mappedActions);
            }
        }

        return actions;
    }

    mapStatement(statement) {
        if (statement.type === 'ExpressionStatement') {
            return this.mapExpression(statement.expression);
        }

        if (statement.type === 'AssignmentExpression') {
            // WebElement elem = driver.findElement(...)
            if (statement.left.type === 'Identifier' && statement.right.type === 'CallExpression') {
                const varName = statement.left.name;
                const call = statement.right;

                if (call.callee.property?.name === 'findElement') {
                    const selectorInfo = this.extractSelector(call);
                    if (selectorInfo) {
                        this.variables[varName] = selectorInfo;
                    }
                }
            }
        }

        return [];
    }

    extractSelector(callExpression) {
        // driver.findElement(By.id("foo"))
        // args[0] is a CallExpression (By.id("foo"))

        const byCall = callExpression.arguments[0];
        if (byCall && byCall.type === 'CallExpression') {
            const strategy = byCall.callee.property.name; // id, name, xpath, cssSelector
            const value = byCall.arguments[0]?.value;

            if (strategy === 'id') return `#${value}`;
            if (strategy === 'name') return `[name="${value}"]`;
            if (strategy === 'className') return `.${value}`;
            if (strategy === 'cssSelector') return value;
            if (strategy === 'xpath') return `xpath=${value}`;
        }

        return null;
    }

    mapExpression(expression) {
        if (expression.type !== 'CallExpression') return [];

        const { callee, arguments: args } = expression;

        if (callee.type === 'MemberExpression') {
            const methodName = callee.property.name;

            // driver.get("url")
            if (methodName === 'get') {
                return [{ action: 'open_url', url: args[0]?.value }];
            }
            // driver.quit() / close()
            else if (methodName === 'quit' || methodName === 'close') {
                return [{ action: 'close_browser' }];
            }

            // driver.findElement(...).click()
            if (callee.object.type === 'CallExpression') {
                const innerCall = callee.object;
                const innerMethod = innerCall.callee.property?.name;

                if (innerMethod === 'findElement') {
                    const selector = this.extractSelector(innerCall);
                    if (selector) {
                        if (methodName === 'click') {
                            return [{ action: 'click', selector }];
                        } else if (methodName === 'sendKeys') {
                            return [{ action: 'type_text', selector, text: args[0]?.value }];
                        }
                    }
                }
            }

            // elem.click()
            if (callee.object.type === 'Identifier') {
                const varName = callee.object.name;
                const selector = this.variables[varName];

                if (selector) {
                    if (methodName === 'click') {
                        return [{ action: 'click', selector }];
                    } else if (methodName === 'sendKeys') {
                        return [{ action: 'type_text', selector, text: args[0]?.value }];
                    }
                }
            }
        }
        return [];
    }
}
