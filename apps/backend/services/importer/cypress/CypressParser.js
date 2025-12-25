import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser específico para Cypress.
 */
export class CypressParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];

        traverse.default(ast, {
            CallExpression(path) {
                const { node } = path;

                // Detectar it('name', ...)
                if (node.callee.type === 'Identifier' && node.callee.name === 'it') {
                    const testName = node.arguments[0]?.value || 'Untitled Test';
                    const testBody = node.arguments[1];

                    if (
                        testBody &&
                        (testBody.type === 'ArrowFunctionExpression' ||
                            testBody.type === 'FunctionExpression')
                    ) {
                        tests.push({
                            name: testName,
                            body: testBody.body, // BlockStatement
                        });
                    }
                }
            },
        });

        return tests;
    }
}
