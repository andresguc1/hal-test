import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser específico para Puppeteer.
 * Puppeteer no tiene un runner de tests integrado por defecto (suele usarse con Jest/Mocha o scripts planos).
 * Este parser intentará detectar bloques de código autoejecutables o funciones principales.
 */
export class PuppeteerParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];
        let mainBody = [];

        console.log(mainBody);

        const self = this;

        traverse.default(ast, {
            // 1. Detectar IIFE (Arrow o Function Expression)
            ArrowFunctionExpression(path) {
                if (path.parent.type === 'CallExpression' && path.parent.callee === path.node) {
                    tests.push({ name: 'Puppeteer Script (IIFE)', body: path.node.body });
                }
            },
            FunctionExpression(path) {
                if (path.parent.type === 'CallExpression' && path.parent.callee === path.node) {
                    tests.push({ name: 'Puppeteer Script (IIFE)', body: path.node.body });
                }
            },

            // 2. Detectar bloques de Jest/Mocha (describe/it/test)
            CallExpression(path) {
                const { node } = path;
                if (
                    node.callee.type === 'Identifier' &&
                    (node.callee.name === 'test' || node.callee.name === 'it')
                ) {
                    const testName = node.arguments[0]?.value || 'Untitled Test';
                    const testBody = node.arguments[1];
                    if (
                        testBody &&
                        (testBody.type === 'ArrowFunctionExpression' ||
                            testBody.type === 'FunctionExpression')
                    ) {
                        tests.push({ name: testName, body: testBody.body });
                    }
                }
            },

            // 3. Detectar funciones asíncronas que parecen ser scripts principales (contienen puppeteer.launch o page.goto)
            FunctionDeclaration(path) {
                // Heurística: Si la función es async y contiene keywords, la agregamos
                if (path.node.async) {
                    // Convertir el nodo a string para búsqueda simple (hack rápido pero efectivo)
                    // Nota: Esto no es perfecto, pero ayuda a encontrar funciones relevantes
                    // En una implementación real, recorreríamos el body buscando CallExpressions específicos
                    // Usamos 'self' porque 'this' se pierde en el visitor
                    const hasPuppeteerKeywords = self.hasKeywords(path);
                    if (hasPuppeteerKeywords) {
                        tests.push({
                            name: path.node.id?.name || 'Puppeteer Function',
                            body: path.node.body,
                        });
                    }
                }
            },
        });

        // Si no se detectaron tests estructurados, buscar en el cuerpo principal (scripts planos)
        if (tests.length === 0) {
            console.log('[DEBUG] No structured tests found. Attempting to parse as flat script.');

            // Filtrar imports y exports del body principal
            const mainBodyStatements = ast.program.body.filter(
                (node) =>
                    node.type !== 'ImportDeclaration' &&
                    node.type !== 'ExportNamedDeclaration' &&
                    node.type !== 'ExportDefaultDeclaration',
            );

            if (mainBodyStatements.length > 0) {
                tests.push({
                    name: 'Main Script',
                    body: { type: 'BlockStatement', body: mainBodyStatements }, // Wrap in BlockStatement
                });
                console.log('[DEBUG] Created "Main Script" from top-level statements.');
            }
        }

        return tests;
    }

    hasKeywords(path) {
        let found = false;
        path.traverse({
            CallExpression(innerPath) {
                const callee = innerPath.node.callee;
                if (callee.type === 'MemberExpression') {
                    // puppeteer.launch, page.goto, browser.newPage
                    if (
                        (callee.object.name === 'puppeteer' && callee.property.name === 'launch') ||
                        callee.property.name === 'goto' ||
                        callee.property.name === 'click'
                    ) {
                        found = true;
                        innerPath.stop(); // Detener búsqueda en este path
                    }
                }
            },
        });
        return found;
    }
}
