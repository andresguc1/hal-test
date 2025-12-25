import { AbstractMapper } from '../../core/AbstractMapper.js';

/**
 * Mapper para convertir nodos de Python Selenium a acciones Hal_Test.
 * Soporta:
 * - driver.get('url')
 * - driver.find_element(By.ID, '...').click()
 * - driver.find_element(By.NAME, '...').send_keys('...')
 */
export class PythonSeleniumMapper extends AbstractMapper {
    constructor() {
        super();
        this.variables = {}; // Simple variable tracking for PoC
    }

    map(testBodyNode) {
        const actions = [];
        this.variables = {}; // Reset per test

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
        // console.log('[DEBUG Python] Statement Type:', statement.type);
        // En Python (filbert), una llamada a función es un CallExpression.
        // Puede estar dentro de un ExpressionStatement.
        if (statement.type === 'ExpressionStatement') {
            return this.mapExpression(statement.expression);
        }

        // Manejo de asignaciones: elem = driver.find_element(...)
        // Filbert parses assignments as VariableDeclaration
        if (statement.type === 'VariableDeclaration') {
            const decl = statement.declarations[0]; // Assuming single declaration
            if (decl && decl.init && decl.init.type === 'CallExpression') {
                const varName = decl.id.name;
                const call = decl.init;

                // Check if it's a find_element call
                if (call.callee.property?.name === 'find_element') {
                    // Extract selector info
                    const selectorInfo = this.extractSelector(call);
                    if (selectorInfo) {
                        this.variables[varName] = selectorInfo;
                        // console.log('[DEBUG Python] Tracked variable:', varName, selectorInfo);
                    }
                }
            }
        }

        // Manejo de asignaciones (si filbert lo parsea como AssignmentExpression en otros casos)
        if (statement.type === 'AssignmentExpression') {
            // console.log('[DEBUG Python] Assignment:', statement.left.type, statement.right.type);
            // statement.left (Identifier), statement.right (CallExpression)
            if (statement.left.type === 'Identifier' && statement.right.type === 'CallExpression') {
                const varName = statement.left.name;
                const call = statement.right;

                // Check if it's a find_element call
                if (call.callee.property?.name === 'find_element') {
                    // Extract selector info
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
        // console.log('[DEBUG Python] extractSelector args:', callExpression.arguments);
        const byArg = callExpression.arguments[0];
        const valArg = callExpression.arguments[1];

        let strategy = 'unknown';
        if (byArg.type === 'MemberExpression') {
            strategy = byArg.property.name.toLowerCase();
        } else if (byArg.type === 'Literal') {
            strategy = byArg.value.toLowerCase();
        }

        const value = valArg?.value;
        let selector = value;

        if (strategy === 'id') selector = `#${value}`;
        else if (strategy === 'name') selector = `[name="${value}"]`;
        else if (strategy === 'class_name') selector = `.${value}`;

        return selector;
    }

    mapExpression(expression) {
        if (expression.type !== 'CallExpression') return [];

        const { callee, arguments: args } = expression;

        // Caso 1: driver.get('url'), driver.quit()
        // Estructura: MemberExpression (object: Identifier(driver), property: Identifier(get))
        if (callee.type === 'MemberExpression') {
            const methodName = callee.property.name;

            // console.log('[DEBUG Python] Call:', objectName, methodName);

            if (methodName === 'get') {
                return [{ action: 'open_url', url: args[0]?.value }];
            } else if (methodName === 'quit' || methodName === 'close') {
                return [{ action: 'close_browser' }];
            } else if (methodName === 'save_screenshot') {
                return [{ action: 'take_screenshot' }];
            }

            // Caso 2: driver.find_element(...).click()
            // Estructura: CallExpression(callee: MemberExpression(object: CallExpression(find_element), property: click))

            // Si el objeto es una llamada a find_element
            if (callee.object.type === 'CallExpression') {
                const innerCall = callee.object;
                const innerMethod = innerCall.callee.property?.name;

                if (innerMethod === 'find_element') {
                    const selector = this.extractSelector(innerCall);
                    if (selector) {
                        if (methodName === 'click') {
                            return [{ action: 'click', selector }];
                        } else if (methodName === 'send_keys') {
                            return [{ action: 'type_text', selector, text: args[0]?.value }];
                        }
                    }
                }
            }

            // Caso 3: elem.click() o elem.send_keys(...) donde 'elem' es una variable rastreada
            if (callee.object.type === 'Identifier') {
                const varName = callee.object.name;
                const selector = this.variables[varName];

                if (selector) {
                    if (methodName === 'click') {
                        return [{ action: 'click', selector }];
                    } else if (methodName === 'send_keys') {
                        return [{ action: 'type_text', selector, text: args[0]?.value }];
                    } else if (methodName === 'clear') {
                        // clear action not fully supported in Hal_Test yet, maybe map to type_text empty?
                        // or just ignore
                    }
                }
            }
        }

        return [];
    }
}
