import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser para Selenium Webdriver (Javascript bindings).
 * Detecta scripts que usan 'selenium-webdriver'.
 */
export class SeleniumParser extends AbstractParser {
    parse(fileContent) {
        const ast = parse(fileContent, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });

        const tests = [];
        const self = this;

        traverse.default(ast, {
            // 1. Detectar bloques de test (Mocha/Jest/Jasmine)
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
                        tests.push({ name: testName, body: testBody.body });
                    }
                }
            },

            // 2. Detectar funciones asíncronas principales (scripts planos envueltos en función)
            FunctionDeclaration(path) {
                if (path.node.async) {
                    const hasSeleniumKeywords = self.hasKeywords(path);
                    if (hasSeleniumKeywords) {
                        tests.push({
                            name: path.node.id?.name || 'Selenium Script',
                            body: path.node.body,
                        });
                    }
                }
            },

            // 3. Detectar IIFE async (Arrow o Function Expression)
            ArrowFunctionExpression(path) {
                if (
                    path.parent.type === 'CallExpression' &&
                    path.parent.callee === path.node &&
                    path.node.async
                ) {
                    const hasSeleniumKeywords = self.hasKeywords(path);
                    if (hasSeleniumKeywords) {
                        tests.push({ name: 'Selenium Script (IIFE)', body: path.node.body });
                    }
                }
            },
            FunctionExpression(path) {
                if (
                    path.parent.type === 'CallExpression' &&
                    path.parent.callee === path.node &&
                    path.node.async
                ) {
                    const hasSeleniumKeywords = self.hasKeywords(path);
                    if (hasSeleniumKeywords) {
                        tests.push({
                            name: path.node.id?.name || 'Selenium Script (IIFE)',
                            body: path.node.body,
                        });
                    }
                }
            },
        });

        return tests;
    }

    hasKeywords(path) {
        let found = false;
        path.traverse({
            CallExpression(innerPath) {
                const callee = innerPath.node.callee;
                // driver.get(), driver.findElement(), new Builder()
                if (callee.type === 'MemberExpression') {
                    if (
                        callee.property.name === 'get' ||
                        callee.property.name === 'findElement' ||
                        callee.property.name === 'build'
                    ) {
                        found = true;
                        innerPath.stop();
                    }
                }
            },
            NewExpression(innerPath) {
                // new Builder()
                if (innerPath.node.callee.name === 'Builder') {
                    found = true;
                    innerPath.stop();
                }
            },
        });
        return found;
    }
}
