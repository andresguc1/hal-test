/**
 * KeywordDrivenPattern — Keyword-driven code generation.
 * Maps high-level keywords to reusable action functions.
 */
import { DesignPatternRegistry } from './DesignPatternRegistry.js';

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase());
}

export const KeywordDrivenPattern = {
    name: 'keyword-driven',
    label: 'Keyword-Driven',
    description: 'Table-driven keywords mapping to reusable actions. Best for non-technical teams.',
    frameworks: ['playwright'],
    languages: ['javascript', 'typescript'],
    isMultiFile: () => true,

    /**
     * Define keyword mappings from steps
     */
    buildKeywordMap(steps) {
        const keywords = [];

        function walk(nodeList) {
            if (!nodeList || !Array.isArray(nodeList)) return;
            for (const step of nodeList) {
                const action = step.type || step.actionType || 'unknown';
                const keyword = sanitizeName(step.label || step.name || action);
                keywords.push({
                    keyword,
                    action,
                    params: step.parameters || {},
                });
                walk(step.subNodes || step.steps || []);
            }
        }

        walk(steps);
        return keywords;
    },

    /**
     * Generate keyword definitions file
     */
    generateKeywordDefs(keywords, { language }) {
        const isTS = language === 'typescript';
        const typeAnnot = isTS ? ': { [key: string]: any }' : '';

        const defs = keywords.map((kw) => {
            const funcName = `keyword_${kw.keyword}`;
            return `export async function ${funcName}(page, params${typeAnnot}) {
    // ${kw.action}
}
`;
        });

        const registry = keywords.map((kw) => {
            return `    '${kw.keyword}': keyword_${kw.keyword},`;
        });

        return `${defs.join('\n')}\nexport const keywordRegistry = {\n${registry.join('\n')}\n};\n`;
    },

    /**
     * Generate keyword table JSON
     */
    generateKeywordTable(keywords) {
        return JSON.stringify(
            keywords.map((kw) => ({
                keyword: kw.keyword,
                action: kw.action,
                params: kw.params,
            })),
            null,
            2,
        );
    },

    /**
     * Generate spec file that reads keyword table
     */
    getSpecCode(_steps, _params) {
        const importBlock = `import { test } from '@playwright/test';
import { keywordRegistry } from '../keywords/keywords';
import keywordTable from '../data/keyword-table.json';`;

        const testBlock = `test("Keyword-Driven Flow", async ({ page }) => {
    for (const step of keywordTable) {
        const handler = keywordRegistry[step.keyword];
        if (handler) {
            await handler(page, step.params);
        }
    }
});`;

        return `${importBlock}\n\n${testBlock}\n`;
    },
};

DesignPatternRegistry.register(KeywordDrivenPattern);
