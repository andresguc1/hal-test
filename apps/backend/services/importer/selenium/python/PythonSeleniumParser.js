import { parse } from 'filbert';
import { AbstractParser } from '../../core/AbstractParser.js';

/**
 * Parser para Selenium Webdriver (Python bindings).
 * Usa 'filbert' para parsear código Python a un AST estandarizado (similar a ESTree).
 */
export class PythonSeleniumParser extends AbstractParser {
    parse(fileContent) {
        let ast;
        try {
            // Pre-process: Remove import lines to avoid filbert issues
            // Filbert might struggle with some import syntax or just ignore them,
            // but stripping them ensures we focus on the logic.
            const cleanContent = fileContent
                .split('\n')
                .filter(
                    (line) =>
                        !line.trim().startsWith('import ') && !line.trim().startsWith('from '),
                )
                .join('\n');

            ast = parse(cleanContent);
        } catch (error) {
            console.warn('[PythonSeleniumParser] Error parsing Python code with filbert:', error);
            console.log('[PythonSeleniumParser] Attempting fallback regex parsing...');
            return this.parseWithRegex(fileContent);
        }

        const tests = [];

        // En Python, los scripts de Selenium suelen ser:
        // 1. Scripts planos (top-level)
        // 2. Funciones (def test_something(): ...)
        // 3. Clases unittest (class MyTest(unittest.TestCase): ...)

        // Estrategia simplificada para PoC:
        // - Si hay funciones que parecen tests (empiezan con 'test_'), las extraemos.
        // - Si no, tomamos todo el cuerpo como un "Main Script".

        const functionTests = [];

        // Recorrer el AST (filbert devuelve un nodo 'Program' con 'body')
        // El AST de filbert es similar a ESTree pero para Python

        // Helper para recorrer recursivamente (simple)
        const visit = (node) => {
            if (!node) return;

            if (node.type === 'FunctionDeclaration') {
                if (node.id && node.id.name.startsWith('test_')) {
                    functionTests.push({
                        name: node.id.name,
                        body: node.body, // BlockStatement
                    });
                }
            }

            // TODO: Detectar clases unittest

            // Recurse
            for (const key in node) {
                if (node[key] && typeof node[key] === 'object') {
                    if (Array.isArray(node[key])) {
                        node[key].forEach(visit);
                    } else {
                        visit(node[key]);
                    }
                }
            }
        };

        // Si es un script plano, filbert lo pone en ast.body
        // Verificamos si hay definiciones de funciones
        ast.body.forEach(visit);

        if (functionTests.length > 0) {
            tests.push(...functionTests);
        } else {
            // Asumir script plano
            // Filtramos imports para limpiar un poco
            const mainBody = ast.body.filter(
                (node) => node.type !== 'ImportDeclaration' && node.type !== 'ImportFrom',
            );

            if (mainBody.length > 0) {
                tests.push({
                    name: 'Python Script (Main)',
                    body: { type: 'BlockStatement', body: mainBody },
                });
            }
        }

        return tests;
    }

    /**
     * Fallback parser using Regex for simple Python scripts.
     * Extracts functions starting with 'test_' or treats the whole file as a script.
     */
    parseWithRegex(fileContent) {
        const tests = [];
        const lines = fileContent.split('\n');

        // 1. Detectar funciones 'def test_...():'
        let currentTest = null;
        let currentIndent = 0;

        const testDefRegex = /^(\s*)def\s+(test_\w+)\s*\(.*\):/;

        for (const line of lines) {
            const match = line.match(testDefRegex);
            if (match) {
                // Si ya teníamos un test abierto, lo cerramos (aunque en python la indentación manda)
                if (currentTest) {
                    tests.push(currentTest);
                }

                currentIndent = match[1].length;
                currentTest = {
                    name: match[2],
                    body: { type: 'BlockStatement', body: [] }, // Mock AST body
                };
                continue;
            }

            if (currentTest) {
                // Verificar indentación para saber si seguimos dentro de la función
                const lineIndent = line.search(/\S|$/);
                if (line.trim() !== '' && lineIndent <= currentIndent) {
                    // Fin de la función
                    tests.push(currentTest);
                    currentTest = null;
                } else {
                    // Agregar línea al cuerpo (mocked as ExpressionStatement for mapper)
                    if (line.trim() !== '') {
                        currentTest.body.body.push(this.mockStatementFromLine(line));
                    }
                }
            }
        }

        if (currentTest) {
            tests.push(currentTest);
        }

        // 2. Si no se encontraron funciones, tratar como script plano
        if (tests.length === 0) {
            const mainBody = [];
            for (const line of lines) {
                if (
                    line.trim() !== '' &&
                    !line.trim().startsWith('import ') &&
                    !line.trim().startsWith('from ') &&
                    !line.trim().startsWith('def ')
                ) {
                    mainBody.push(this.mockStatementFromLine(line));
                }
            }

            if (mainBody.length > 0) {
                tests.push({
                    name: 'Python Script (Main)',
                    body: { type: 'BlockStatement', body: mainBody },
                });
            }
        }

        return tests;
    }

    mockStatementFromLine(line) {
        // Create a fake AST node that the Mapper can understand
        // We only care about CallExpressions and Assignments for now

        const trimmed = line.trim();

        // Assignment: var = ...
        const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
        if (assignMatch) {
            return {
                type: 'AssignmentExpression',
                left: { type: 'Identifier', name: assignMatch[1] },
                right: this.mockCallFromLine(assignMatch[2]),
            };
        }

        // Call: func(...)
        return {
            type: 'ExpressionStatement',
            expression: this.mockCallFromLine(trimmed),
        };
    }

    mockCallFromLine(codeStr) {
        // Simple regex to extract object.method(args)
        // driver.get("url") -> object: driver, property: get, args: ["url"]

        const callMatch = codeStr.match(/^([\w.]+)\((.*)\)$/);
        if (callMatch) {
            const fullCallee = callMatch[1];
            const argsStr = callMatch[2];

            const parts = fullCallee.split('.');
            let calleeNode;

            if (parts.length > 1) {
                const property = parts.pop();
                const object = parts.join('.');

                // Handle nested calls like driver.find_element(...).click()
                // This is hard with regex, so we simplify:
                // If object contains '(', it's a nested call.

                if (object.includes('(')) {
                    // Recursive call for the object
                    calleeNode = {
                        type: 'MemberExpression',
                        object: this.mockCallFromLine(object),
                        property: { name: property },
                    };
                } else {
                    calleeNode = {
                        type: 'MemberExpression',
                        object: { name: object, type: 'Identifier' }, // Identifier for mapper
                        property: { name: property },
                    };
                }
            } else {
                calleeNode = {
                    type: 'Identifier',
                    name: fullCallee,
                };
            }

            // Parse args (very basic)
            const args = [];
            if (argsStr) {
                // Split by comma, but ignore commas in quotes (simplified)
                const rawArgs = argsStr.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                rawArgs.forEach((arg) => {
                    const cleanArg = arg.trim();
                    if (cleanArg.startsWith('"') || cleanArg.startsWith("'")) {
                        args.push({ type: 'Literal', value: cleanArg.slice(1, -1) });
                    } else if (cleanArg.includes('.')) {
                        // By.NAME -> MemberExpression
                        const [obj, prop] = cleanArg.split('.');
                        args.push({
                            type: 'MemberExpression',
                            object: { name: obj },
                            property: { name: prop },
                        });
                    } else {
                        args.push({ type: 'Literal', value: cleanArg });
                    }
                });
            }

            return {
                type: 'CallExpression',
                callee: calleeNode,
                arguments: args,
            };
        }

        return { type: 'Unknown' };
    }
}
