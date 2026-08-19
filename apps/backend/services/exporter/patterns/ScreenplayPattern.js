/**
 * ScreenplayPattern — Actors → Abilities → Tasks code generation.
 * Produces multi-file output with actor/task classes.
 */
import { DesignPatternRegistry } from './DesignPatternRegistry.js';

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase());
}

export const ScreenplayPattern = {
    name: 'screenplay',
    label: 'Screenplay',
    description: 'Actor-based pattern with abilities and tasks. Best for complex business logic.',
    frameworks: ['playwright'],
    languages: ['javascript', 'typescript'],
    isMultiFile: () => true,

    /**
     * Generate ability classes
     */
    generateAbilities({ language }) {
        const isTS = language === 'typescript';
        const typeAnnot = isTS ? ': string' : '';

        return `// Ability: Browse the web using Playwright
export class BrowseTheWeb {
    constructor(page) {
        this.page = page;
    }

    static using(page) {
        return new BrowseTheWeb(page);
    }

    async navigateTo(url${typeAnnot}) {
        await this.page.goto(url);
    }

    async click(locator) {
        await this.page.locator(locator).click();
    }

    async fill(locator, value${typeAnnot}) {
        await this.page.locator(locator).fill(value);
    }

    async assertText(locator, expected${typeAnnot}) {
        await this.page.locator(locator).waitFor({ state: 'visible' });
    }
}
`;
    },

    /**
     * Generate task classes from steps
     */
    generateTasks(steps, { language }) {
        const isTS = language === 'typescript';
        const tasks = [];

        for (const step of steps) {
            if (step.type === 'component' || step.subNodes) continue;
            const className = sanitizeName(step.label || step.name || 'PerformAction');
            const typeAnnot = isTS ? ': BrowseTheWeb' : '';

            tasks.push(`export class ${className} {
    static perform() {
        return new ${className}();
    }

    async performAs(actor${typeAnnot}) {
        // ${step.label || step.name || 'Perform action'}
    }
}
`);
        }

        return tasks.join('\n');
    },

    /**
     * Generate actor setup
     */
    generateActor({ language }) {
        const isTS = language === 'typescript';
        const typeAnnot = isTS ? ': BrowseTheWeb' : '';

        return `export class Actor {
    constructor(name${isTS ? ': string' : ''}) {
        this.name = name;
        this.abilities = new Map();
    }

    whoCan(ability${typeAnnot}) {
        this.abilities.set(ability.constructor.name, ability);
        return this;
    }

    abilityTo(AbilityClass${isTS ? ': new (...args: any[]) => any' : ''}) {
        return this.abilities.get(AbilityClass.name);
    }

    attemptsTo(...tasks) {
        return tasks.reduce((prev, task) => prev.then(() => task.performAs(this)), Promise.resolve());
    }
}
`;
    },

    /**
     * Generate spec file
     */
    getSpecCode(steps, _params) {
        const importBlock = `import { test } from '@playwright/test';
import { Actor } from '../actors/Actor';
import { BrowseTheWeb } from '../abilities/BrowseTheWeb';`;

        const actorSetup = `const actor = new Actor("Tester")
    .whoCan(BrowseTheWeb.using(page));`;

        const tasks = steps
            .filter((s) => s.type !== 'component' && !s.subNodes)
            .map(
                (s) =>
                    `    await actor.attemptsTo(${sanitizeName(s.label || s.name || 'PerformAction')}.perform());`,
            )
            .join('\n');

        return `${importBlock}\n\ntest("Screenplay Flow", async ({ page }) => {\n${actorSetup}\n\n${tasks}\n});\n`;
    },
};

DesignPatternRegistry.register(ScreenplayPattern);
