import { AbstractMapper } from '../core/AbstractMapper.js';

export class TestRigorMapper extends AbstractMapper {
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

        const command = expression.callee.name;
        const args = expression.arguments;

        // open_url "url"
        if (command === 'open_url') {
            return [{ action: 'open_url', url: args[0]?.value }];
        }

        // click "Button"
        if (command === 'click') {
            // In testRigor, the argument is the text of the element or a label.
            // We'll create a text-based selector or a placeholder.
            const target = args[0]?.value;
            if (target) {
                return [{ action: 'click', selector: `text=${target}` }];
            }
        }

        // type "text" into "Input"
        // Args: ["text", "Input"]
        if (command === 'type') {
            const text = args[0]?.value;
            const target = args[1]?.value;

            if (target) {
                return [
                    {
                        action: 'type_text',
                        selector: `[placeholder="${target}"], label:contains("${target}")`,
                        text: text,
                    },
                ];
            }
        }

        // check_contains "Text"
        if (command === 'check_contains') {
            const text = args[0]?.value;
            if (text) {
                return [{ action: 'wait_visible', selector: `text=${text}` }];
            }
        }

        return [];
    }
}
