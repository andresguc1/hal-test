import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Puppeteer a acciones Hal_Test.
 */
export class PuppeteerMapper extends AbstractMapper {
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
        // Puppeteer actions are usually AwaitExpressions
        if (
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'AwaitExpression'
        ) {
            return this.mapExpression(statement.expression.argument);
        }
        // Handle const [response] = await Promise.all([...]) pattern often used for navigation wait
        if (statement.type === 'VariableDeclaration') {
            // Complex logic omitted for MVP, focusing on direct calls
        }
        return [];
    }

    mapExpression(expression) {
        // page.goto(...), page.click(...)

        if (expression.type === 'CallExpression') {
            const { callee, arguments: args } = expression;

            if (callee.type === 'MemberExpression') {
                const objectName = callee.object.name; // 'page' usually
                const methodName = callee.property.name;

                console.log(objectName);

                // Asumimos que el objeto es 'page' o similar.
                // En un parser real, deberíamos rastrear la variable 'page'.

                if (methodName === 'goto') {
                    return [
                        {
                            action: 'open_url',
                            url: args[0]?.value,
                        },
                    ];
                } else if (methodName === 'click') {
                    return [
                        {
                            action: 'click',
                            selector: args[0]?.value,
                        },
                    ];
                } else if (methodName === 'type') {
                    return [
                        {
                            action: 'type_text',
                            selector: args[0]?.value,
                            text: args[1]?.value,
                        },
                    ];
                } else if (methodName === 'waitForSelector') {
                    return [
                        {
                            action: 'wait_visible',
                            selector: args[0]?.value,
                        },
                    ];
                } else if (methodName === 'screenshot') {
                    return [
                        {
                            action: 'take_screenshot',
                        },
                    ];
                } else if (methodName === 'setViewport') {
                    // page.setViewport({ width: 100, height: 100 })
                    // Argument is ObjectExpression
                    const props = args[0]?.properties || [];
                    const width = props.find((p) => p.key.name === 'width')?.value?.value;
                    const height = props.find((p) => p.key.name === 'height')?.value?.value;

                    return [
                        {
                            action: 'resize_viewport',
                            width,
                            height,
                        },
                    ];
                }
            }
        }

        return [];
    }
}
