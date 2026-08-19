/**
 * POMPattern — Page Object Model code generation.
 * Produces multi-file output with page classes and spec files.
 */
import { DesignPatternRegistry } from './DesignPatternRegistry.js';

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase());
}

export const POMPattern = {
    name: 'pom',
    label: 'Page Object Model',
    description: 'Organized into page classes with locators and actions. Best for maintainability.',
    frameworks: ['playwright', 'cypress'],
    languages: ['javascript', 'typescript'],
    isMultiFile: () => true,

    /**
     * Collect page objects from steps tree
     */
    collectPageObjects(steps, map = new Map(), parentFlowId = null) {
        if (!steps || !Array.isArray(steps)) return map;

        for (const step of steps) {
            const isComponent = step.type === 'component' || step.subNodes;
            if (isComponent && step.flowId) {
                const flowName = step.label || step.name || 'UnnamedPage';
                const className = sanitizeName(flowName) + 'Page';
                map.set(step.flowId, {
                    flowId: step.flowId,
                    flowName,
                    className,
                    fileName: `${className}.page`,
                    subNodes: step.subNodes || step.steps || [],
                    parentFlowId,
                    nestedFlowIds: new Set(),
                });
                if (parentFlowId && map.has(parentFlowId)) {
                    map.get(parentFlowId).nestedFlowIds.add(step.flowId);
                }
                this.collectPageObjects(step.subNodes || step.steps || [], map, step.flowId);
            }
        }
        return map;
    },

    /**
     * Get page object class code
     */
    getPageClassCode(pageObj, { language, framework }) {
        const isTS = language === 'typescript';
        const isCypress = framework === 'cypress';
        const indent = '    ';

        const imports = isCypress
            ? ''
            : isTS
              ? `import { type Page, type Locator } from '@playwright/test';\n\n`
              : '';

        const constructorType = isTS ? '(page: Page)' : '(page)';
        const propDecls = isTS ? `\n${indent}private page: Page;\n` : '';

        let body = '';
        if (pageObj.nestedFlowIds.size > 0) {
            for (const _nestedId of pageObj.nestedFlowIds) {
                body += `${indent}${``}// Delegated to nested page object\n`;
            }
        }
        body += `${indent}async run() {\n`;
        body += `${indent}${indent}// Steps for this page\n`;
        body += `${indent}}\n`;

        return `${imports}export class ${pageObj.className} {\n${propDecls}\n${indent}constructor${constructorType} {\n${indent}${indent}this.page = page;\n${indent}}\n\n${body}}\n`;
    },

    /**
     * Get spec file code
     */
    getSpecCode(steps, pageObjects, { language, framework }) {
        const isTS = language === 'typescript';
        const isCypress = framework === 'cypress';
        const imports = [];
        const body = [];

        for (const [, pageObj] of pageObjects) {
            if (!pageObj.parentFlowId) {
                imports.push(
                    `import { ${pageObj.className} } from '../pages/${pageObj.fileName}.${isTS ? 'ts' : 'js'}';`,
                );
            }
        }

        body.push(
            isCypress
                ? 'describe("Generated Flow", () => {'
                : 'import { test } from "@playwright/test";\n',
        );
        body.push(
            isCypress
                ? '  it("should execute flow", () => {'
                : 'test("Generated Flow", async ({ page }) => {',
        );

        for (const [, pageObj] of pageObjects) {
            if (!pageObj.parentFlowId) {
                const varName =
                    pageObj.className.charAt(0).toLowerCase() + pageObj.className.slice(1);
                body.push(`    const ${varName} = new ${pageObj.className}(page);`);
                body.push(`    await ${varName}.run();`);
            }
        }

        body.push(isCypress ? '  });' : '});');
        body.push(isCypress ? '});' : '');

        return `${imports.join('\n')}\n\n${body.join('\n')}\n`;
    },
};

DesignPatternRegistry.register(POMPattern);
