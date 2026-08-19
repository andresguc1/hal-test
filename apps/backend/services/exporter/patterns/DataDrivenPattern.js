/**
 * DataDrivenPattern — Data-driven code generation.
 * Separates test data from test logic using external JSON/CSV files.
 */
import { DesignPatternRegistry } from './DesignPatternRegistry.js';

export const DataDrivenPattern = {
    name: 'data-driven',
    label: 'Data-Driven',
    description: 'Separates test data from logic. Best for testing multiple data sets.',
    frameworks: ['playwright', 'cypress'],
    languages: ['javascript', 'typescript'],
    isMultiFile: () => true,

    /**
     * Extract data parameters from steps
     */
    extractDataParams(steps) {
        const dataParams = [];

        function walk(nodeList) {
            if (!nodeList || !Array.isArray(nodeList)) return;
            for (const step of nodeList) {
                if (step.type === 'fill_form' && step.parameters) {
                    const fields = step.parameters.fields || step.parameters.selectors || [];
                    for (const field of fields) {
                        if (field.value || field.text) {
                            dataParams.push({
                                field: field.selector || field.name || field.id || 'unknown',
                                value: field.value || field.text || '',
                                stepLabel: step.label || step.name || '',
                            });
                        }
                    }
                }
                if (step.type === 'open_url' && step.parameters?.url) {
                    dataParams.push({
                        field: 'url',
                        value: step.parameters.url,
                        stepLabel: step.label || step.name || '',
                    });
                }
                walk(step.subNodes || step.steps || []);
            }
        }

        walk(steps);
        return dataParams;
    },

    /**
     * Generate test data JSON file
     */
    generateDataFile(steps, _params) {
        const dataParams = this.extractDataParams(steps);

        const dataSet = {
            default: {},
        };

        for (const param of dataParams) {
            dataSet.default[param.field] = param.value;
        }

        return JSON.stringify(dataSet, null, 2);
    },

    /**
     * Generate spec file that reads from data
     */
    getSpecCode(_steps, { _language, framework }) {
        const isCypress = framework === 'cypress';

        const importBlock = isCypress
            ? `import testData from '../data/test-data.json';`
            : `import { test } from '@playwright/test';\nimport testData from '../data/test-data.json';`;

        const testBlock = isCypress
            ? `describe("Data-Driven Flow", () => {\n  Object.entries(testData).forEach(([key, data]) => {\n    it(\`should execute with dataset: \${key}\`, () => {\n      // Steps using data.url, data.username, etc.\n    });\n  });\n});`
            : `test.describe("Data-Driven Flow", () => {\n  for (const [key, data] of Object.entries(testData)) {\n    test(\`should execute with dataset: \${key}\`, async ({ page }) => {\n      // Steps using data.url, data.username, etc.\n    });\n  }\n});`;

        return `${importBlock}\n\n${testBlock}\n`;
    },
};

DesignPatternRegistry.register(DataDrivenPattern);
