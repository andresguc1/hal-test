import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser específico para Nightwatch.js.
 * Nightwatch suele exportar un objeto con claves como nombres de tests.
 * module.exports = { 'Test Name': function(browser) { ... } }
 */
export class NightwatchParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];

        const traverseFn = typeof traverse === 'function' ? traverse : traverse.default || traverse;
        traverseFn(ast, {
            // Detectar module.exports = { ... }
            AssignmentExpression(path) {
                const { left, right } = path.node;
                if (
                    left.type === 'MemberExpression' &&
                    left.object.name === 'module' &&
                    left.property.name === 'exports' &&
                    right.type === 'ObjectExpression'
                ) {
                    // Iterar sobre las propiedades del objeto exportado
                    right.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty') {
                            const testName = prop.key.value || prop.key.name;
                            const testBody = prop.value;

                            // Filtrar hooks como before, after, etc. si es necesario
                            if (['before', 'after', 'beforeEach', 'afterEach'].includes(testName)) {
                                return;
                            }

                            if (
                                testBody.type === 'FunctionExpression' ||
                                testBody.type === 'ArrowFunctionExpression'
                            ) {
                                tests.push({
                                    name: testName,
                                    body: testBody.body, // BlockStatement
                                });
                            }
                        }
                    });
                }
            },

            // Soporte para ES6 export default { ... }
            ExportDefaultDeclaration(path) {
                const declaration = path.node.declaration;
                if (declaration.type === 'ObjectExpression') {
                    declaration.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty') {
                            const testName = prop.key.value || prop.key.name;
                            const testBody = prop.value;

                            if (['before', 'after', 'beforeEach', 'afterEach'].includes(testName)) {
                                return;
                            }

                            if (
                                testBody.type === 'FunctionExpression' ||
                                testBody.type === 'ArrowFunctionExpression'
                            ) {
                                tests.push({
                                    name: testName,
                                    body: testBody.body,
                                });
                            }
                        }
                    });
                }
            },
        });

        return tests;
    }
}
