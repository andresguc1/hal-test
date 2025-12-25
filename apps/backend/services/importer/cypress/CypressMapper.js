import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Cypress a acciones Hal_Test.
 * Cypress usa encadenamiento (chaining), lo que complica el mapeo directo.
 * Ejemplo: cy.get('#id').click()
 */
export class CypressMapper extends AbstractMapper {
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
        // Cypress commands are usually ExpressionStatements
        if (statement.type === 'ExpressionStatement') {
            return this.mapExpression(statement.expression);
        }
        return [];
    }

    mapExpression(expression) {
        // Manejar encadenamiento: cy.get(...).click()
        // AST: CallExpression(callee: MemberExpression(object: CallExpression(cy.get), property: click))

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

        // Analizar la cadena desenrollada
        // Ejemplo: [cy.get('#id'), .click()]

        // Verificar si empieza con 'cy'
        const root = chain[0];
        if (root.callee.type === 'MemberExpression' && root.callee.object.name === 'cy') {
            return this.processCypressChain(chain);
        }

        return [];
    }

    processCypressChain(chain) {
        const actions = [];
        let currentSelector = null;

        for (const callExpr of chain) {
            const methodName = callExpr.callee.property.name;
            const args = callExpr.arguments;

            if (methodName === 'visit') {
                actions.push({
                    action: 'open_url',
                    url: args[0]?.value,
                });
            } else if (methodName === 'get') {
                currentSelector = args[0]?.value;
                // 'get' por sí solo no es una acción, establece el contexto
            } else if (methodName === 'click') {
                actions.push({
                    action: 'click',
                    selector: currentSelector,
                });
            } else if (methodName === 'type') {
                actions.push({
                    action: 'type_text',
                    selector: currentSelector,
                    text: args[0]?.value,
                });
            } else if (methodName === 'contains') {
                // cy.contains('text') o cy.contains(selector, 'text')
                if (args.length === 1) {
                    // Asumir que busca texto en toda la página o contexto actual
                    // Simplificación: convertir a wait_visible con texto
                    actions.push({
                        action: 'wait_visible',
                        selector: `text=${args[0]?.value}`,
                    });
                }
            }
        }

        return actions;
    }
}
