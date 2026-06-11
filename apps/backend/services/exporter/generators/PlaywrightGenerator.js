import { BaseGenerator } from '../core/BaseGenerator.js';
import { NodeMapperRegistry } from '../core/GeneratorRegistry.js';
import { variableManager } from '../../VariableManager.js';

export class PlaywrightGenerator extends BaseGenerator {
    constructor(language, locale) {
        super(language, locale);

        this.messages = {
            es: {
                start: `🚀 Iniciando ejecución del flujo en ${this.language}...`,
                completed: '✅ Flujo completado con éxito.',
                not_implemented: '⚠️ Acción no implementada o pendiente:',
            },
            en: {
                start: `🚀 Starting flow execution in ${this.language}...`,
                completed: '✅ Flow completed successfully.',
                not_implemented: '⚠️ Action not implemented or pending:',
            },
        };

        this.msg = this.isEn ? this.messages.en : this.messages.es;
    }

    generateHeader(_steps) {
        const lang = this.language.toLowerCase();
        const extra = lang === 'typescript' ? ' (TS)' : '';

        switch (lang) {
            case 'javascript':
            case 'typescript':
                return `import { test } from '@playwright/test';\n\ntest(\`Flujo Generado Hal-Test${extra}\`, async ({ page }) => {\n    console.log(\`${this.msg.start}\`);\n`;
            case 'python':
                return `import asyncio\nfrom playwright.async_api import async_playwright\n\n# ${this.msg.start}\n`;
            case 'java':
                return `import com.microsoft.playwright.*;\n\npublic class GeneratedFlow {\n    public static void main(String[] args) {\n        // ${this.msg.start}\n`;
            case 'csharp':
                return `using Microsoft.Playwright;\nusing System.Threading.Tasks;\n\n// ${this.msg.start}\n`;
            default:
                return `// Generated ${this.language} Code\n`;
        }
    }

    generateNodeCode(step, index, depth) {
        const type = step.type || step.action;
        const rawConfig = step.data?.configuration || step.data || step || {};
        const config = variableManager.resolveRecursive(
            rawConfig,
            variableManager.getActiveRunId?.(),
        );
        const mapper = NodeMapperRegistry.getMapper(type);
        const indent = '    '.repeat(depth + 1);
        const label = step.data?.label || step.data?.customLabel || step.label || type;
        const lang = this.language.toLowerCase();
        const commentChar = lang === 'python' ? '#' : '//';

        let nodeCode = '';

        // Handle recursive components/sub-flows
        const subNodes = step.data?.subNodes || step.subNodes || [];
        if (type === 'component' || subNodes.length > 0) {
            nodeCode = this.generateSteps(subNodes, depth + 1);

            if (lang === 'javascript' || lang === 'typescript') {
                return `${indent}await test.step(\`📦 ${label}\`, async () => {\n${nodeCode}\n${indent}});`;
            }
            return `${indent}${commentChar} [GROUP]: ${label}\n${nodeCode}\n${indent}${commentChar} [END GROUP]`;
        }

        if (mapper) {
            // Pass all needed context to the mapper
            const mapperParams = { ...config, type, actionType: type };
            nodeCode = mapper.getCode(mapperParams, this.language, index);
        } else {
            if (lang === 'javascript' || lang === 'typescript') {
                nodeCode = `console.log(\`${this.msg.not_implemented} ${type}\`);`;
            } else if (lang === 'python') {
                nodeCode = `print('${this.msg.not_implemented} ${type}')`;
            } else {
                nodeCode = `${commentChar} ${this.msg.not_implemented} ${type}`;
            }
        }

        // Wrap in a test step for JS/TS
        if (lang === 'javascript' || lang === 'typescript') {
            return `${indent}await test.step(\`${label}\`, async () => {\n${indent}    ${nodeCode}\n${indent}});`;
        }

        return `${indent}${nodeCode}`;
    }

    generateFooter() {
        const lang = this.language.toLowerCase();
        const commentChar = lang === 'python' ? '#' : '//';

        if (lang === 'javascript' || lang === 'typescript') {
            return `\n    console.log(\`${this.msg.completed}\`);\n});`;
        }
        if (lang === 'java') {
            return `\n        // ${this.msg.completed}\n    }\n}`;
        }
        return `\n${commentChar} ${this.msg.completed}`;
    }
}
