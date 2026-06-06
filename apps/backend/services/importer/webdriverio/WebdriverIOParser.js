import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser específico para WebdriverIO.
 * Soporta estilo Mocha (describe/it) y scripts async standalone.
 */
export class WebdriverIOParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];

        const traverseFn = typeof traverse === 'function' ? traverse : traverse.default || traverse;
        traverseFn(ast, {
            // Detectar bloques describe/it (Mocha/Jasmine)
            CallExpression(path) {
                const { node } = path;
                if (
                    node.callee.type === 'Identifier' &&
                    (node.callee.name === 'it' || node.callee.name === 'test')
                ) {
                    const testName = node.arguments[0]?.value || 'Untitled Test';
                    const testBody = node.arguments[1];
                    if (
                        testBody &&
                        (testBody.type === 'ArrowFunctionExpression' ||
                            testBody.type === 'FunctionExpression')
                    ) {
                        tests.push({
                            name: testName,
                            body: testBody.body,
                        });
                    }
                }
            },

            // Detectar scripts standalone (async function main() { ... })
            FunctionDeclaration(path) {
                if (path.node.async) {
                    // Heurística simple: si usa 'browser' o '$', es probable que sea WDIO
                    // En una implementación real, verificaríamos el contenido
                    tests.push({
                        name: path.node.id?.name || 'WDIO Script',
                        body: path.node.body,
                    });
                }
            },
        });

        return tests;
    }
}
