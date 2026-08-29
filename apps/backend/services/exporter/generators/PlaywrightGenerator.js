import { BaseGenerator } from '../core/BaseGenerator.js';
import { NodeMapperRegistry } from '../core/GeneratorRegistry.js';
import { variableManager } from '../../VariableManager.js';
import { validateSelector } from '../core/escapeUtils.js';
import { DesignPatternRegistry } from '../patterns/DesignPatternRegistry.js';

export class PlaywrightGenerator extends BaseGenerator {
    constructor(language, locale, usePOM = false, includeCICD = false, designPattern = 'flat') {
        super(language, locale, designPattern);
        this.framework = 'playwright';
        this.usePOM = usePOM || designPattern === 'pom';
        this.includeCICD = includeCICD;

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

    sanitizeClassName(name) {
        if (!name) return 'Component';
        const clean = name.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
        if (!clean) return 'Component';
        return clean
            .split(/[\s-_]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    sanitizeFileName(name) {
        return this.sanitizeClassName(name);
    }

    getInstanceName(className) {
        let name = className;
        if (name.endsWith('Page')) {
            name = name.slice(0, -4);
        }
        return name.charAt(0).toLowerCase() + name.slice(1);
    }

    collectPageObjects(steps, pageObjectsMap = new Map(), parentFlowId = null) {
        if (!steps || !Array.isArray(steps)) return pageObjectsMap;

        for (const step of steps) {
            const type = step.type || step.action;
            const subNodes = step.data?.subNodes || step.subNodes || [];

            const isComponent = type === 'component' || subNodes.length > 0;
            if (isComponent) {
                const flowId = step.data?.configuration?.flowId || step.data?.flowId || step.id;
                const flowName =
                    step.data?.flowName || step.data?.label || step.label || 'Component';

                if (flowId) {
                    if (parentFlowId && pageObjectsMap.has(parentFlowId)) {
                        pageObjectsMap.get(parentFlowId).nestedComponentFlowIds.add(flowId);
                    }

                    if (!pageObjectsMap.has(flowId)) {
                        const className = this.sanitizeClassName(flowName) + 'Page';
                        const fileName =
                            this.sanitizeFileName(flowName) + '.page.' + this.extension;
                        pageObjectsMap.set(flowId, {
                            flowId,
                            flowName,
                            className,
                            fileName,
                            subNodes,
                            nestedComponentFlowIds: new Set(),
                        });

                        this.collectPageObjects(subNodes, pageObjectsMap, flowId);
                    } else {
                        this.collectPageObjects(subNodes, pageObjectsMap, flowId);
                    }
                }
            } else {
                this.collectPageObjects(subNodes, pageObjectsMap, parentFlowId);
            }
        }
        return pageObjectsMap;
    }

    hasAssertions(steps) {
        if (!steps || !Array.isArray(steps)) return false;
        return steps.some((step) => {
            const action = step.type || step.action;
            const data = step.data || {};
            if (
                action === 'assertion' ||
                action === 'assert_page_text' ||
                action === 'validate_semantic'
            )
                return true;
            if (data.subNodes && this.hasAssertions(data.subNodes)) return true;
            return false;
        });
    }

    generate(steps) {
        this.warnings = [];
        this.extension = this.language.toLowerCase() === 'typescript' ? 'ts' : 'js';

        // Handle new pattern-based multi-file output
        if (this.pattern && this.pattern.isMultiFile() && this.designPattern !== 'flat') {
            return this._generateWithPattern(steps);
        }

        if (!this.usePOM && !this.includeCICD) {
            return super.generate(steps);
        }

        this.pageObjectsMap = new Map();
        const files = {};
        const isTS = this.language.toLowerCase() === 'typescript';
        const indent = '    ';

        if (this.usePOM) {
            this.collectPageObjects(steps, this.pageObjectsMap, null);

            // Generate POM page classes
            for (const po of this.pageObjectsMap.values()) {
                this.isInsideClass = true;
                this.currentPo = po;

                let importsCode = '';
                let fieldsCode = '';
                let instantiationsCode = '';

                for (const nestedFlowId of po.nestedComponentFlowIds) {
                    const childPo = this.pageObjectsMap.get(nestedFlowId);
                    if (childPo) {
                        const importPath = childPo.fileName.slice(0, -3);
                        importsCode += `import { ${childPo.className} } from './${importPath}';\n`;
                        const instanceName = this.getInstanceName(childPo.className);
                        if (isTS) {
                            fieldsCode += `${indent}readonly ${instanceName}: ${childPo.className};\n`;
                        }
                        instantiationsCode += `${indent}${indent}this.${instanceName} = new ${childPo.className}(page);\n`;
                    }
                }

                const needsExpect = this.hasAssertions(po.subNodes);
                let playwrightImport = '';
                if (isTS) {
                    playwrightImport = `import { Page${needsExpect ? ', expect' : ''} } from '@playwright/test';\n`;
                } else {
                    playwrightImport = `import { expect } from '@playwright/test';\n`;
                }

                const pageBodyCode = this.generateSteps(po.subNodes, 1);

                let classCode = '';
                if (isTS) {
                    classCode = `${playwrightImport}${importsCode}\nexport class ${po.className} {\n${indent}readonly page: Page;\n${fieldsCode}\n${indent}constructor(page: Page) {\n${indent}${indent}this.page = page;\n${instantiationsCode}${indent}}\n\n${indent}async run(): Promise<void> {\n${indent}${indent}const { page } = this;\n${pageBodyCode}\n${indent}}\n}\n`;
                } else {
                    classCode = `${playwrightImport}${importsCode}\nexport class ${po.className} {\n${indent}/**\n${indent} * @param {import('@playwright/test').Page} page\n${indent} */\n${indent}constructor(page) {\n${indent}${indent}this.page = page;\n${instantiationsCode}${indent}}\n\n${indent}async run() {\n${indent}${indent}const { page } = this;\n${pageBodyCode}\n${indent}}\n}\n`;
                }

                files[`pages/${po.fileName}`] = classCode;
            }

            // Generate Main Spec File
            this.isInsideClass = false;
            this.currentPo = null;

            let topImports = '';
            const topLevelFlowIds = new Set();
            for (const step of steps) {
                const type = step.type || step.action;
                const flowId = step.data?.configuration?.flowId || step.data?.flowId || step.id;
                const subNodes = step.data?.subNodes || step.subNodes || [];
                if ((type === 'component' || subNodes.length > 0) && flowId) {
                    topLevelFlowIds.add(flowId);
                }
            }

            for (const flowId of topLevelFlowIds) {
                const po = this.pageObjectsMap.get(flowId);
                if (po) {
                    const importPath = po.fileName.slice(0, -3);
                    topImports += `import { ${po.className} } from '../pages/${importPath}';\n`;
                }
            }

            const needsExpect = this.hasAssertions(steps);
            const extra = isTS ? ' (TS)' : '';
            const playwrightImport = isTS
                ? `import { test${needsExpect ? ', expect' : ''}, Page } from '@playwright/test';\n`
                : `import { test${needsExpect ? ', expect' : ''} } from '@playwright/test';\n`;

            let header = `${playwrightImport}${topImports}\ntest(\`Flujo Generado Hal-Test${extra}\`, async ({ page }${isTS ? ': { page: Page }' : ''}) => {\n    console.log(\`${this.msg.start}\`);\n`;
            const testBody = this.generateSteps(steps, 0);
            const footer = `\n    console.log(\`${this.msg.completed}\`);\n});`;

            files[`tests/flow.spec.${this.extension}`] = `${header}${testBody}${footer}`;
        } else {
            // Generate single spec file inside ZIP structure
            const singleFileResult = super.generate(steps);
            files[`tests/flow.spec.${this.extension}`] = singleFileResult.code;
        }

        // Generate Playwright Config
        files['playwright.config.js'] = `const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 5000,
  },
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    viewport: { width: 1280, height: 720 },
  },
});
`;

        // Generate package.json
        files['package.json'] = `{
  "name": "haltest-generated-project",
  "version": "1.0.0",
  "description": "Generated Playwright project from HalTest",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1"
  }
}
`;

        // Generate CI/CD pipeline configuration files
        if (this.includeCICD) {
            files['.github/workflows/playwright.yml'] = `name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm install
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
`;

            files['.gitlab-ci.yml'] = `stages:
  - test

playwright_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.62.1-jammy
  script:
    - npm install
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 30 days
`;
        }

        return { files, warnings: this.warnings };
    }

    /**
     * Generate multi-file output using a design pattern strategy.
     */
    _generateWithPattern(steps) {
        const files = {};
        const ctx = { language: this.language, framework: this.framework };
        const pattern = DesignPatternRegistry.get(this.designPattern);

        if (this.designPattern === 'pom') {
            this.usePOM = true;
            return this.generate(steps);
        }

        if (this.designPattern === 'screenplay' && pattern) {
            files['actors/Actor.js'] = pattern.generateActor(ctx);
            files['abilities/BrowseTheWeb.js'] = pattern.generateAbilities(ctx);
            files['tasks/index.js'] = pattern.generateTasks(steps, ctx);
            files[`tests/flow.spec.${this.extension}`] = pattern.getSpecCode(steps, ctx);
        }

        if (this.designPattern === 'data-driven' && pattern) {
            files['data/test-data.json'] = pattern.generateDataFile(steps, ctx);
            files[`tests/flow.spec.${this.extension}`] = pattern.getSpecCode(steps, ctx);
        }

        if (this.designPattern === 'keyword-driven' && pattern) {
            const keywords = pattern.buildKeywordMap(steps);
            files['keywords/keywords.js'] = pattern.generateKeywordDefs(keywords, ctx);
            files['data/keyword-table.json'] = pattern.generateKeywordTable(keywords);
            files[`tests/flow.spec.${this.extension}`] = pattern.getSpecCode(steps, ctx);
        }

        files['playwright.config.js'] =
            `const { defineConfig } = require('@playwright/test');\nmodule.exports = defineConfig({ testDir: './tests', timeout: 60000, fullyParallel: true, use: { trace: 'on-first-retry', screenshot: 'only-on-failure' } });\n`;
        files['package.json'] =
            `{\n  "name": "hal-test-generated",\n  "devDependencies": {\n    "@playwright/test": "^1.62.1"\n  }\n}\n`;

        return { files, warnings: this.warnings };
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
        const ignoredTypes = [
            'guide',
            'note',
            'comment',
            'annotation',
            'label',
            'sticky',
            'sticky_note',
            'discussion',
        ];
        if (ignoredTypes.includes(type)) {
            return '';
        }

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
        const nodeId = step.id || step.nodeId || '';
        const nodeIdComment = nodeId ? `${commentChar} [node_id: ${nodeId}]` : '';

        let nodeCode = '';

        // Handle recursive components/sub-flows
        const subNodes = step.data?.subNodes || step.subNodes || [];
        if (type === 'component' || subNodes.length > 0) {
            if (this.usePOM) {
                const flowId = step.data?.configuration?.flowId || step.data?.flowId || step.id;
                const po = this.pageObjectsMap?.get(flowId);
                if (po) {
                    const instanceName = this.getInstanceName(po.className);
                    if (this.isInsideClass) {
                        return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}await this.${instanceName}.run();`;
                    } else {
                        if (lang === 'javascript' || lang === 'typescript') {
                            return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}await test.step(\`📦 ${label}\`, async () => {\n${indent}    const ${instanceName} = new ${po.className}(page);\n${indent}    await ${instanceName}.run();\n${indent}});`;
                        } else {
                            return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}${commentChar} [GROUP]: ${label}\n${indent}${instanceName} = ${po.className}(page)\n${indent}await ${instanceName}.run()`;
                        }
                    }
                }
            }

            nodeCode = this.generateSteps(subNodes, depth + 1);

            if (lang === 'javascript' || lang === 'typescript') {
                return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}await test.step(\`📦 ${label}\`, async () => {\n${nodeCode}\n${indent}});`;
            }
            return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}${commentChar} [GROUP]: ${label}\n${nodeCode}\n${indent}${commentChar} [END GROUP]`;
        }

        if (mapper) {
            const mapperParams = { ...config, type, actionType: type };

            // Validate selector before code generation
            const selectorFields = [
                'selector',
                'sourceSelector',
                'targetSelector',
                'formSelector',
                'submitSelector',
            ];
            for (const field of selectorFields) {
                if (mapperParams[field]) {
                    const { valid, warnings: selWarnings } = validateSelector(
                        mapperParams[field],
                        this.framework,
                        label,
                    );
                    if (!valid) {
                        selWarnings.forEach((w) => this.addWarning(type, w, index));
                    }
                }
            }

            nodeCode = mapper.getCode(mapperParams, this.language, index, this.framework);
        } else {
            this.addWarning(type, label, index);

            if (lang === 'javascript' || lang === 'typescript') {
                nodeCode = `console.log(\`${this.msg.not_implemented} ${type}\`);`;
            } else if (lang === 'python') {
                nodeCode = `print('${this.msg.not_implemented} ${type}')`;
            } else {
                nodeCode = `${commentChar} ${this.msg.not_implemented} ${type}`;
            }
        }

        if (lang === 'javascript' || lang === 'typescript') {
            return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}await test.step(\`${label}\`, async () => {\n${indent}    ${nodeCode}\n${indent}});`;
        }

        return `${indent}${nodeIdComment ? nodeIdComment + '\n' : ''}${indent}${nodeCode}`;
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
