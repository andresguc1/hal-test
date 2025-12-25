import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser específico para TestCafe.
 */
export class TestCafeParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];
        let currentFixtureName = 'Untitled Fixture';
        let currentFixturePage = null;

        console.log(currentFixtureName);

        traverse.default(ast, {
            // Detectar fixture `Name` .page `url`
            TaggedTemplateExpression(path) {
                const { node } = path;
                if (node.tag.name === 'fixture') {
                    currentFixtureName = node.quasi.quasis[0].value.raw;
                }
            },
            // Detectar .page `url` (encadenado al fixture)
            MemberExpression(path) {
                if (
                    path.node.property.name === 'page' &&
                    path.parent.type === 'TaggedTemplateExpression'
                ) {
                    // Esto es complejo de extraer directamente del AST sin un análisis más profundo del encadenamiento
                    // Simplificación: buscar string literal en el tagged template padre
                    if (path.parent.quasi && path.parent.quasi.quasis.length > 0) {
                        currentFixturePage = path.parent.quasi.quasis[0].value.raw;
                    }
                }
            },

            // Detectar test('name', async t => { ... })
            CallExpression(path) {
                const { node } = path;

                if (node.callee.type === 'Identifier' && node.callee.name === 'test') {
                    const testName = node.arguments[0]?.value || 'Untitled Test';
                    const testBody = node.arguments[1];

                    if (
                        testBody &&
                        (testBody.type === 'ArrowFunctionExpression' ||
                            testBody.type === 'FunctionExpression')
                    ) {
                        // Inyectar navegación inicial si el fixture tiene .page
                        // Esto se manejará mejor en el mapper, pero pasamos la info

                        tests.push({
                            name: testName,
                            body: testBody.body, // BlockStatement
                            fixturePage: currentFixturePage,
                        });
                    }
                }
            },
        });

        return tests;
    }
}
