import { AbstractParser } from '../../core/AbstractParser.js';

/**
 * Parser para Selenium C# (Regex-based MVP).
 * Detecta métodos anotados con [Test] o métodos Main.
 */
export class CSharpSeleniumParser extends AbstractParser {
    parse(fileContent) {
        const tests = [];
        const lines = fileContent.split('\n');

        let currentMethod = null;
        let braceCount = 0;
        let insideMethod = false;

        let setupBody = [];
        let teardownBody = [];
        let currentAnnotation = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect Annotations
            if (line.includes('[Test]')) currentAnnotation = 'Test';
            else if (line.includes('[SetUp]') || line.includes('[OneTimeSetUp]'))
                currentAnnotation = 'SetUp';
            else if (line.includes('[TearDown]') || line.includes('[OneTimeTearDown]'))
                currentAnnotation = 'TearDown';

            // Detect method signature
            const methodMatch = line.match(/public\s+void\s+(\w+)\s*\(/);
            const mainMatch = line.match(/static\s+void\s+Main\s*\(/);

            if ((methodMatch || mainMatch) && !insideMethod) {
                const name = mainMatch ? 'Main' : methodMatch[1];
                currentMethod = {
                    name: name,
                    annotation: currentAnnotation || (mainMatch ? 'Test' : null),
                    body: { type: 'BlockStatement', body: [] },
                };
                insideMethod = true;
                braceCount = 0;
                currentAnnotation = null; // Reset annotation
            }

            if (insideMethod) {
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;

                braceCount += openBraces - closeBraces;

                // Add line to body (mocked AST)
                if (
                    line !== '' &&
                    !line.startsWith('using') &&
                    !line.startsWith('namespace') &&
                    !line.startsWith('public class') &&
                    !line.startsWith('[')
                ) {
                    const stmt = this.mockStatementFromLine(line);
                    if (stmt) currentMethod.body.body.push(stmt);
                }

                if (braceCount === 0 && (openBraces > 0 || closeBraces > 0)) {
                    // End of method
                    if (currentMethod.annotation === 'SetUp') {
                        setupBody = currentMethod.body.body;
                    } else if (currentMethod.annotation === 'TearDown') {
                        teardownBody = currentMethod.body.body;
                    } else if (currentMethod.annotation === 'Test') {
                        tests.push(currentMethod);
                    }

                    currentMethod = null;
                    insideMethod = false;
                }
            }
        }

        // Inject hooks into tests
        tests.forEach((test) => {
            test.body.body = [...setupBody, ...test.body.body, ...teardownBody];
        });

        return tests;
    }

    mockStatementFromLine(line) {
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
            return null;

        // Assignment: IWebElement elem = ... OR ReadOnlyCollection<IWebElement> elem = ...
        // Regex: Type var = ...
        // Support generics: [\w<>]+
        const assignMatch = trimmed.match(/^([\w<>]+)\s+(\w+)\s*=\s*(.+);$/);
        if (assignMatch) {
            return {
                type: 'AssignmentExpression',
                left: { type: 'Identifier', name: assignMatch[2] }, // var name
                right: this.mockCallFromLine(assignMatch[3]),
            };
        }

        // var elem = ...
        const varAssignMatch = trimmed.match(/^var\s+(\w+)\s*=\s*(.+);$/);
        if (varAssignMatch) {
            return {
                type: 'AssignmentExpression',
                left: { type: 'Identifier', name: varAssignMatch[1] },
                right: this.mockCallFromLine(varAssignMatch[2]),
            };
        }

        // Call: driver.Navigate().GoToUrl(...)
        const cleanLine = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
        return {
            type: 'ExpressionStatement',
            expression: this.mockCallFromLine(cleanLine),
        };
    }

    mockCallFromLine(codeStr) {
        const cleanStr = codeStr.trim();

        // Handle simple Identifier (e.g. 'driver')
        if (/^[\w]+$/.test(cleanStr)) {
            return { type: 'Identifier', name: cleanStr };
        }

        // Right-to-Left Scan to handle nested calls correctly
        // Expect format: Object.Method(Args) OR Object.Property

        // Check if it ends with ')' -> Method Call
        if (cleanStr.endsWith(')')) {
            // Find matching opening paren
            let balance = 0;
            let openParenIndex = -1;

            for (let i = cleanStr.length - 1; i >= 0; i--) {
                const char = cleanStr[i];
                if (char === ')') balance++;
                else if (char === '(') balance--;

                if (balance === 0) {
                    openParenIndex = i;
                    break;
                }
            }

            if (openParenIndex !== -1) {
                const argsStr = cleanStr.substring(openParenIndex + 1, cleanStr.length - 1);
                const prefix = cleanStr.substring(0, openParenIndex).trim();

                // Prefix should be "Object.Method" or just "Method"
                const lastDotIndex = prefix.lastIndexOf('.');

                if (lastDotIndex !== -1) {
                    const objectStr = prefix.substring(0, lastDotIndex).trim();
                    const methodStr = prefix.substring(lastDotIndex + 1).trim();

                    return {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            object: this.mockCallFromLine(objectStr),
                            property: { name: methodStr },
                        },
                        arguments: this.parseArgs(argsStr),
                    };
                } else {
                    // Simple call: Method(...)
                    return {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: prefix },
                        arguments: this.parseArgs(argsStr),
                    };
                }
            }
        } else {
            // Does not end with ')' -> Property Access? e.g. driver.FindElement(...).Displayed
            const lastDotIndex = cleanStr.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                const objectStr = cleanStr.substring(0, lastDotIndex).trim();
                const propertyStr = cleanStr.substring(lastDotIndex + 1).trim();

                // If propertyStr contains spaces or special chars, it's probably not a property access
                if (/^[\w]+$/.test(propertyStr)) {
                    return {
                        type: 'MemberExpression',
                        object: this.mockCallFromLine(objectStr),
                        property: { name: propertyStr },
                    };
                }
            }
        }

        return { type: 'Unknown', raw: cleanStr };
    }

    parseArgs(argsStr) {
        const args = [];
        if (!argsStr || argsStr.trim() === '') return args;

        // Split by comma, respecting parens and quotes
        let currentArg = '';
        let balance = 0;
        let inQuote = false;

        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];

            if (char === '"' && argsStr[i - 1] !== '\\') {
                // Check for escaped quotes
                inQuote = !inQuote;
            }

            if (!inQuote) {
                if (char === '(') balance++;
                else if (char === ')') balance--;
            }

            if (char === ',' && balance === 0 && !inQuote) {
                this.addArg(args, currentArg);
                currentArg = '';
            } else {
                currentArg += char;
            }
        }
        this.addArg(args, currentArg);

        return args;
    }

    addArg(args, argStr) {
        const cleanArg = argStr.trim();
        if (!cleanArg) return;

        if (cleanArg.startsWith('"')) {
            args.push({ type: 'Literal', value: cleanArg.slice(1, -1) });
        } else if (cleanArg.includes('(') || cleanArg.includes('.')) {
            // Nested call or property
            args.push(this.mockCallFromLine(cleanArg));
        } else {
            args.push({ type: 'Literal', value: cleanArg });
        }
    }
}
