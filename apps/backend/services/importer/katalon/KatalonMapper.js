import { AbstractMapper } from '../core/AbstractMapper.js';

export class KatalonMapper extends AbstractMapper {
    map(testBodyNode) {
        const actions = [];

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
        return [];
    }

    mapExpression(expression) {
        if (expression.type !== 'CallExpression') return [];

        const { callee, arguments: args } = expression;

        if (callee.type === 'MemberExpression' && callee.object.name === 'WebUI') {
            const method = callee.property.name;

            // WebUI.openBrowser('url')
            if (method === 'openBrowser') {
                // If arg is empty string, it just opens browser. If url provided, opens url.
                const url = args[0]?.value;
                const actions = [
                    { action: 'launch_browser', headless: false, args: ['--start-maximized'] },
                ];
                if (url) {
                    actions.push({ action: 'open_url', url });
                }
                return actions;
            }

            // WebUI.navigateToUrl('url')
            if (method === 'navigateToUrl') {
                return [{ action: 'open_url', url: args[0]?.value }];
            }

            // WebUI.click(findTestObject(...))
            if (method === 'click') {
                const selector = this.extractSelector(args[0]);
                if (selector) {
                    return [{ action: 'click', selector }];
                }
            }

            // WebUI.setText(findTestObject(...), 'text')
            if (method === 'setText') {
                const selector = this.extractSelector(args[0]);
                const text = args[1]?.value;
                if (selector) {
                    return [{ action: 'type_text', selector, text }];
                }
            }

            // WebUI.verifyElementVisible(findTestObject(...))
            if (method === 'verifyElementVisible' || method === 'waitForElementVisible') {
                const selector = this.extractSelector(args[0]);
                if (selector) {
                    return [{ action: 'wait_visible', selector }];
                }
            }

            // WebUI.closeBrowser()
            if (method === 'closeBrowser') {
                return [{ action: 'close_browser' }];
            }
        }
        return [];
    }

    extractSelector(argNode) {
        // argNode is usually a CallExpression: findTestObject('Page/Object')
        if (argNode.type === 'CallExpression' && argNode.callee.name === 'findTestObject') {
            const objectPath = argNode.arguments[0]?.value;
            // For MVP, we use the object path as a placeholder selector.
            // In a real implementation, we would look up this path in the Object Repository XMLs.
            // To make it runnable in our verification, we'll assume the user might manually fix it
            // OR we treat it as a "data-testid" or similar if it looks like one.
            // But realistically, returning the object path is the best we can do without the repo.
            return `[katalon-object="${objectPath}"]`;
        }
        return null;
    }
}
