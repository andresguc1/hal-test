import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser para Katalon Studio (Regex-based MVP).
 * Detecta scripts Groovy que usan WebUI.*
 */
export class KatalonParser extends AbstractParser {
    parse(fileContent) {
        // Katalon scripts are usually flat Groovy scripts, not necessarily inside a class/method structure
        // But sometimes they are. We'll assume a flat script for MVP, or extract lines that look like actions.

        const lines = fileContent.split('\n');
        const body = [];

        for (const line of lines) {
            const stmt = this.mockStatementFromLine(line);
            if (stmt) {
                body.push(stmt);
            }
        }

        // Wrap in a single "Main" test
        return [
            {
                name: 'Katalon Test Case',
                body: {
                    type: 'BlockStatement',
                    body: body,
                },
            },
        ];
    }

    mockStatementFromLine(line) {
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
            return null;

        // WebUI.click(findTestObject('Page_Login/btn_Login'))
        // WebUI.setText(findTestObject('Page_Login/txt_UserName'), 'Admin')

        if (trimmed.startsWith('WebUI.')) {
            return this.mockCallFromLine(trimmed);
        }

        // Variable assignment: def var = ...
        const assignMatch = trimmed.match(/^(def|String|int)\s+(\w+)\s*=\s*(.+)$/);
        if (assignMatch) {
            // Not strictly needed for basic WebUI mapping unless we track variables
            // For MVP, we ignore variables unless they hold TestObjects (which is rare in simple scripts)
            return null;
        }

        return null;
    }

    mockCallFromLine(codeStr) {
        // Remove trailing semicolon if present (Groovy doesn't require it but might have it)
        const cleanStr = codeStr.endsWith(';') ? codeStr.slice(0, -1) : codeStr;

        // WebUI.keyword(args)
        const match = cleanStr.match(/^WebUI\.(\w+)\((.*)\)$/);
        if (match) {
            const method = match[1];
            const argsStr = match[2];

            return {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'WebUI' },
                        property: { name: method },
                    },
                    arguments: this.parseArgs(argsStr),
                },
            };
        }

        return null;
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

            if (char === "'" || char === '"') {
                // Simple quote handling (doesn't handle escaped quotes perfectly)
                if (!inQuote) inQuote = char;
                else if (inQuote === char) inQuote = false;
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

        if (
            (cleanArg.startsWith("'") && cleanArg.endsWith("'")) ||
            (cleanArg.startsWith('"') && cleanArg.endsWith('"'))
        ) {
            args.push({ type: 'Literal', value: cleanArg.slice(1, -1) });
        } else if (cleanArg.startsWith('findTestObject')) {
            // findTestObject('Page/Object')
            const match = cleanArg.match(/findTestObject\(['"](.+)['"]\)/);
            if (match) {
                args.push({
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'findTestObject' },
                    arguments: [{ type: 'Literal', value: match[1] }],
                });
            }
        } else {
            // Variable or number
            args.push({ type: 'Literal', value: cleanArg }); // Treat as literal for now
        }
    }
}
