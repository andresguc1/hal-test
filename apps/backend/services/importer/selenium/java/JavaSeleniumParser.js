import { AbstractParser } from '../../core/AbstractParser.js';

/**
 * Parser para Selenium Java (Regex-based MVP).
 * Detecta métodos anotados con @Test o métodos main.
 */
export class JavaSeleniumParser extends AbstractParser {
    parse(fileContent) {
        const tests = [];
        const lines = fileContent.split('\n');

        // Regex para detectar métodos de test:
        // @Test public void testName() { ... }
        // public static void main(String[] args) { ... }

        let currentTest = null;
        let braceCount = 0;
        let insideTest = false;

        // Simple state machine for brace counting
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detectar inicio de test (@Test)
            if (line.includes('@Test')) {
                // Look ahead for method signature
                // Assuming method starts on next line or same line
                continue;
            }

            // Detectar firma de método
            const methodMatch = line.match(/public\s+void\s+(\w+)\s*\(/);
            const mainMatch = line.match(/public\s+static\s+void\s+main\s*\(/);

            if ((methodMatch || mainMatch) && !insideTest) {
                const name = mainMatch ? 'main' : methodMatch[1];
                currentTest = {
                    name: name,
                    body: { type: 'BlockStatement', body: [] },
                };
                insideTest = true;
                braceCount = 0;
            }

            if (insideTest) {
                // Count braces to find end of method
                // This is very naive and will fail with braces in strings/comments
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;

                braceCount += openBraces - closeBraces;

                // Add line to body (mocked AST)
                if (
                    line !== '' &&
                    !line.startsWith('package') &&
                    !line.startsWith('import') &&
                    !line.startsWith('public class')
                ) {
                    currentTest.body.body.push(this.mockStatementFromLine(line));
                }

                if (braceCount === 0 && (openBraces > 0 || closeBraces > 0)) {
                    // End of method
                    tests.push(currentTest);
                    currentTest = null;
                    insideTest = false;
                }
            }
        }

        return tests;
    }

    mockStatementFromLine(line) {
        const trimmed = line.trim();

        // Ignore comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
            return null;

        // Assignment: WebElement elem = driver.findElement(...)
        // Regex: Type var = ...
        const assignMatch = trimmed.match(/^(\w+)\s+(\w+)\s*=\s*(.+);$/);
        if (assignMatch) {
            return {
                type: 'AssignmentExpression',
                left: { type: 'Identifier', name: assignMatch[2] }, // var name
                right: this.mockCallFromLine(assignMatch[3]),
            };
        }

        // Call: driver.get(...)
        // Remove trailing semicolon
        const cleanLine = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
        return {
            type: 'ExpressionStatement',
            expression: this.mockCallFromLine(cleanLine),
        };
    }

    mockCallFromLine(codeStr) {
        // driver.findElement(By.id("..."))
        const callMatch = codeStr.match(/^([\w.]+)\((.*)\)$/);
        if (callMatch) {
            const fullCallee = callMatch[1];
            const argsStr = callMatch[2];

            const parts = fullCallee.split('.');
            let calleeNode;

            if (parts.length > 1) {
                const property = parts.pop();
                const object = parts.join('.');

                // Handle nested calls like driver.findElement(...).click()
                if (object.includes('(')) {
                    calleeNode = {
                        type: 'MemberExpression',
                        object: this.mockCallFromLine(object),
                        property: { name: property },
                    };
                } else {
                    calleeNode = {
                        type: 'MemberExpression',
                        object: { name: object, type: 'Identifier' },
                        property: { name: property },
                    };
                }
            } else {
                calleeNode = {
                    type: 'Identifier',
                    name: fullCallee,
                };
            }

            // Parse args (simplified)
            const args = [];
            if (argsStr) {
                // Split by comma, ignoring quotes
                const rawArgs = argsStr.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                rawArgs.forEach((arg) => {
                    const cleanArg = arg.trim();
                    if (cleanArg.startsWith('"')) {
                        args.push({ type: 'Literal', value: cleanArg.slice(1, -1) });
                    } else if (cleanArg.includes('.')) {
                        // By.id("...") -> MemberExpression call? No, By.id is a static method usually
                        // But for mapper we treat it as MemberExpression or CallExpression
                        if (cleanArg.includes('(')) {
                            args.push(this.mockCallFromLine(cleanArg));
                        } else {
                            const [obj, prop] = cleanArg.split('.');
                            args.push({
                                type: 'MemberExpression',
                                object: { name: obj },
                                property: { name: prop },
                            });
                        }
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
