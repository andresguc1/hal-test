import { AbstractParser } from '../core/AbstractParser.js';

/**
 * Parser para testRigor (NLP/Regex-based MVP).
 * Detecta comandos en inglés simple.
 */
export class TestRigorParser extends AbstractParser {
    parse(fileContent) {
        // testRigor scripts are plain text, line by line.
        // We will treat each line as a potential statement.

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
                name: 'testRigor Test Case',
                body: {
                    type: 'BlockStatement',
                    body: body,
                },
            },
        ];
    }

    mockStatementFromLine(line) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return null;

        // We will return a "CallExpression" like structure where the "callee" is the command verb
        // and arguments are the rest of the sentence.

        // click "Button"
        // click on "Button"
        if (/^click\s+(on\s+)?["']/.test(trimmed)) {
            return this.createCommand('click', trimmed);
        }

        // type "text" into "Input"
        // enter "text" into "Input"
        if (/^(type|enter)\s+["']/.test(trimmed)) {
            return this.createCommand('type', trimmed);
        }

        // check that page contains "Text"
        if (/^check\s+that\s+page\s+contains\s+["']/.test(trimmed)) {
            return this.createCommand('check_contains', trimmed);
        }

        // open url "http..."
        if (/^open\s+url\s+["']/.test(trimmed)) {
            return this.createCommand('open_url', trimmed);
        }

        return null;
    }

    createCommand(command, line) {
        // Extract quoted strings as arguments
        const args = [];
        const regex = /["']([^"']+)["']/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            args.push({ type: 'Literal', value: match[1] });
        }

        return {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: command,
                },
                arguments: args,
            },
        };
    }
}
