import { AbstractMapper } from '../../core/AbstractMapper.js';

export class CSharpSeleniumMapper extends AbstractMapper {
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
            // IWebElement elem = driver.FindElement(...)
            if (statement.left.type === 'Identifier' && statement.right.type === 'CallExpression') {
                const varName = statement.left.name;
                const call = statement.right;

                if (call.callee.property?.name === 'FindElement') {
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
        // driver.FindElement(By.Id("foo"))

        const byCall = callExpression.arguments[0];
        if (byCall && byCall.type === 'CallExpression') {
            const strategy = byCall.callee.property.name; // Id, Name, XPath, CssSelector
            const value = byCall.arguments[0]?.value;

            if (strategy === 'Id') return `#${value}`;
            if (strategy === 'Name') return `[name="${value}"]`;
            if (strategy === 'ClassName') return `.${value}`;
            if (strategy === 'CssSelector') return value;
            if (strategy === 'XPath') return `xpath=${value}`;
        }

        return null;
    }

    mapExpression(expression) {
        if (expression.type !== 'CallExpression') return [];

        const { callee, arguments: args } = expression;

        if (callee.type === 'MemberExpression') {
            const objectName = callee.object.name;
            const methodName = callee.property.name;

            // driver.Navigate().GoToUrl("url")
            // This is nested: Call(GoToUrl) -> Member(Navigate().GoToUrl) -> Object(Call(Navigate))

            if (methodName === 'GoToUrl') {
                return [{ action: 'open_url', url: args[0]?.value }];
            }

            // driver.Quit() / Close()
            if (methodName === 'Quit' || methodName === 'Close') {
                return [{ action: 'close_browser' }];
            }

            // driver.FindElement(...).Click()
            if (callee.object.type === 'CallExpression') {
                const innerCall = callee.object;
                const innerMethod = innerCall.callee.property?.name;

                if (innerMethod === 'FindElement') {
                    const selector = this.extractSelector(innerCall);
                    if (selector) {
                        if (methodName === 'Click') {
                            return [{ action: 'click', selector }];
                        } else if (methodName === 'SendKeys') {
                            return [{ action: 'type_text', selector, text: args[0]?.value }];
                        } else if (methodName === 'Displayed') {
                            // Assert.IsTrue(driver.FindElement(...).Displayed)
                            return [{ action: 'wait_visible', selector }];
                        }
                    }
                }
            }

            // elem.Click()
            if (callee.object.type === 'Identifier') {
                const varName = callee.object.name;
                const selector = this.variables[varName];

                if (selector) {
                    if (methodName === 'Click') {
                        return [{ action: 'click', selector }];
                    } else if (methodName === 'SendKeys') {
                        return [{ action: 'type_text', selector, text: args[0]?.value }];
                    }
                }
            }

            // Assert.IsTrue(...) or Assert.AreEqual(...)
            if (objectName === 'Assert') {
                // Check arguments for actions like .Displayed -> wait_visible
                for (const arg of args) {
                    if (arg.type === 'MemberExpression' && arg.property.name === 'Displayed') {
                        // driver.FindElement(...).Displayed
                        if (
                            arg.object.type === 'CallExpression' &&
                            arg.object.callee.property?.name === 'FindElement'
                        ) {
                            const selector = this.extractSelector(arg.object);
                            if (selector) {
                                return [{ action: 'wait_visible', selector }];
                            }
                        }
                    }
                }
                return [];
            }
        }
        return [];
    }
}
