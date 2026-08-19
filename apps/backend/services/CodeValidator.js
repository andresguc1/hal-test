/**
 * CodeValidator Service
 * Validates generated automation code for syntax correctness.
 * Complements PipelineCodeLinter (static analysis) by checking structural validity.
 *
 * Supports: JavaScript, TypeScript, Python, Java, C#
 */
export class CodeValidator {
    /**
     * Validates generated code for syntax issues
     * @param {string} codeString - Source code content
     * @param {string} language - Target language (javascript, typescript, python, java, csharp)
     * @returns {Object} Validation result { valid, errors, warnings }
     */
    validate(codeString = '', language = 'javascript') {
        if (!codeString || typeof codeString !== 'string') {
            return {
                valid: false,
                errors: [{ line: 1, message: 'Code is empty or invalid.', severity: 'error' }],
                warnings: [],
            };
        }

        const lang = language.toLowerCase();
        const lines = codeString.split('\n');
        const errors = [];
        const warnings = [];

        switch (lang) {
            case 'javascript':
            case 'typescript':
                this._validateJS(lines, errors, warnings, lang);
                break;
            case 'python':
                this._validatePython(lines, errors, warnings);
                break;
            case 'java':
                this._validateJava(lines, errors, warnings);
                break;
            case 'csharp':
                this._validateCSharp(lines, errors, warnings);
                break;
            default:
                warnings.push({
                    line: 1,
                    message: `Validation not supported for ${language}.`,
                    severity: 'warning',
                });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            language: lang,
        };
    }

    _validateJS(lines, errors, warnings, lang) {
        let braceCount = 0;
        let parenCount = 0;
        let bracketCount = 0;
        let inString = false;
        let stringChar = '';
        let inTemplate = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                continue;

            for (let j = 0; j < line.length; j++) {
                const ch = line[j];
                const prev = j > 0 ? line[j - 1] : '';

                if (inString) {
                    if (ch === stringChar && prev !== '\\') inString = false;
                    continue;
                }

                if (ch === "'" || ch === '"') {
                    inString = true;
                    stringChar = ch;
                    continue;
                }

                if (ch === '`') {
                    inTemplate = !inTemplate;
                    continue;
                }

                if (inTemplate) continue;

                if (ch === '{') braceCount++;
                if (ch === '}') braceCount--;
                if (ch === '(') parenCount++;
                if (ch === ')') parenCount--;
                if (ch === '[') bracketCount++;
                if (ch === ']') bracketCount--;
            }

            if (braceCount < 0) {
                errors.push({
                    line: lineNum,
                    message: 'Unexpected closing brace.',
                    severity: 'error',
                });
            }
            if (parenCount < 0) {
                errors.push({
                    line: lineNum,
                    message: 'Unexpected closing parenthesis.',
                    severity: 'error',
                });
            }
            if (bracketCount < 0) {
                errors.push({
                    line: lineNum,
                    message: 'Unexpected closing bracket.',
                    severity: 'error',
                });
            }

            if (
                lang === 'typescript' &&
                trimmed.includes('require(') &&
                !trimmed.startsWith('//')
            ) {
                warnings.push({
                    line: lineNum,
                    message: 'Use import instead of require in TypeScript.',
                    severity: 'warning',
                });
            }
        }

        if (braceCount > 0)
            errors.push({
                line: lines.length,
                message: `Unclosed brace(s): ${braceCount}`,
                severity: 'error',
            });
        if (parenCount > 0)
            errors.push({
                line: lines.length,
                message: `Unclosed parenthesis: ${parenCount}`,
                severity: 'error',
            });
        if (bracketCount > 0)
            errors.push({
                line: lines.length,
                message: `Unclosed bracket: ${bracketCount}`,
                severity: 'error',
            });
    }

    _validatePython(lines, errors, warnings) {
        let indentStack = [0];
        let inString = false;
        let stringChar = '';
        let inTriple = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            if (trimmed.startsWith('#')) continue;

            if (inTriple) {
                if (trimmed.includes(stringChar.repeat(3))) inTriple = false;
                continue;
            }

            if (inString) {
                if (trimmed.includes(stringChar)) inString = false;
                continue;
            }

            if (trimmed.startsWith("'''") || trimmed.startsWith('"""')) {
                const quote = trimmed.slice(0, 3);
                if (trimmed.slice(3).includes(quote)) continue;
                inTriple = true;
                stringChar = quote[0];
                continue;
            }

            if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
                const q = trimmed[0];
                if (trimmed.slice(1).includes(q)) continue;
                inString = true;
                stringChar = q;
                continue;
            }

            const indent = line.length - line.trimStart().length;
            if (trimmed && indent < indentStack[indentStack.length - 1]) {
                while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
                    indentStack.pop();
                }
                if (indent !== indentStack[indentStack.length - 1] && indent !== 0) {
                    if (indent !== indentStack[indentStack.length - 1]) {
                        warnings.push({
                            line: lineNum,
                            message: `Inconsistent indentation (expected ${indentStack[indentStack.length - 1]} spaces).`,
                            severity: 'warning',
                        });
                    }
                }
            }

            if (trimmed.endsWith(':')) {
                indentStack.push(indent + 4);
            }
        }
    }

    _validateJava(lines, errors, _warnings) {
        let braceCount = 0;
        let inString = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                continue;

            for (let j = 0; j < line.length; j++) {
                const ch = line[j];
                const prev = j > 0 ? line[j - 1] : '';

                if (inString) {
                    if (ch === '"' && prev !== '\\') inString = false;
                    continue;
                }

                if (ch === '"') {
                    inString = true;
                    continue;
                }

                if (ch === '{') braceCount++;
                if (ch === '}') braceCount--;
            }

            if (braceCount < 0) {
                errors.push({
                    line: lineNum,
                    message: 'Unexpected closing brace.',
                    severity: 'error',
                });
            }
        }

        if (braceCount > 0)
            errors.push({
                line: lines.length,
                message: `Unclosed brace(s): ${braceCount}`,
                severity: 'error',
            });
    }

    _validateCSharp(lines, errors, _warnings) {
        let braceCount = 0;
        let inString = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                continue;

            for (let j = 0; j < line.length; j++) {
                const ch = line[j];
                const prev = j > 0 ? line[j - 1] : '';

                if (inString) {
                    if (ch === '"' && prev !== '\\') inString = false;
                    continue;
                }

                if (ch === '"') {
                    inString = true;
                    continue;
                }

                if (ch === '{') braceCount++;
                if (ch === '}') braceCount--;
            }

            if (braceCount < 0) {
                errors.push({
                    line: lineNum,
                    message: 'Unexpected closing brace.',
                    severity: 'error',
                });
            }
        }

        if (braceCount > 0)
            errors.push({
                line: lines.length,
                message: `Unclosed brace(s): ${braceCount}`,
                severity: 'error',
            });
    }
}

export default new CodeValidator();
