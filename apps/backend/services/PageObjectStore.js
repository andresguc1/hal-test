import { projectStorageService } from './ProjectStorageService.js';

/**
 * PageObjectStore
 * Manages Page Object Model files on disk.
 * Each page is stored as a JSON file under projects/{id}/pages/.
 */
class PageObjectStore {
    /**
     * Creates a new Page Object.
     * @param {string} projectId
     * @param {object} pageData - { id, name, url, locators, sections, metadata }
     * @returns {Promise<object>} - The saved page object
     */
    async create(projectId, pageData) {
        const pageJson = {
            $schema: 'https://haltest.dev/schemas/page-v1.json',
            id: pageData.id,
            name: pageData.name,
            url: pageData.url || '',
            version: '1.0.0',
            locators: pageData.locators || {},
            sections: pageData.sections || {},
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                healthScore: 1.0,
                tags: [],
                ...pageData.metadata,
            },
        };

        const relativePath = `pages/${pageJson.id}.json`;
        await projectStorageService.writeFile(projectId, relativePath, pageJson);
        await projectStorageService.addFileRef(projectId, 'pages', relativePath);

        return pageJson;
    }

    /**
     * Loads a Page Object by ID.
     */
    async get(projectId, pageId) {
        const relativePath = `pages/${pageId}.json`;
        return projectStorageService.readFile(projectId, relativePath);
    }

    /**
     * Updates a Page Object (partial update).
     */
    async update(projectId, pageId, updates) {
        const page = await this.get(projectId, pageId);
        const updated = {
            ...page,
            ...updates,
            id: page.id,
            metadata: {
                ...page.metadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString(),
            },
        };

        const relativePath = `pages/${pageId}.json`;
        await projectStorageService.writeFile(projectId, relativePath, updated);
        return updated;
    }

    /**
     * Deletes a Page Object.
     */
    async delete(projectId, pageId) {
        const relativePath = `pages/${pageId}.json`;
        projectStorageService.deleteFile(projectId, relativePath);
        await projectStorageService.removeFileRef(projectId, 'pages', relativePath);
    }

    /**
     * Lists all Page Objects for a project.
     */
    async list(projectId) {
        const files = projectStorageService.listFiles(projectId, 'pages');
        const pages = [];

        for (const file of files) {
            try {
                const pageId = file.replace('.json', '');
                const page = await this.get(projectId, pageId);
                pages.push(page);
            } catch {
                console.warn(`[PageObjectStore] Skipping corrupted page: ${file}`);
            }
        }

        return pages;
    }

    /**
     * Resolves a locator from a Page Object, including fallbacks.
     * @param {string} projectId
     * @param {string} pageId
     * @param {string} locatorKey
     * @returns {Promise<object|null>} - { selector, strategy, confidence }
     */
    async resolveLocator(projectId, pageId, locatorKey) {
        try {
            const page = await this.get(projectId, pageId);
            const locator = page.locators?.[locatorKey];

            if (!locator) return null;

            return {
                selector: locator.selector,
                strategy: locator.strategy || 'css',
                fallbacks: locator.fallbacks || [],
                confidence: 1.0,
                source: 'page_object',
            };
        } catch {
            return null;
        }
    }

    /**
     * Validates all locators in a page (health check).
     * Returns a health score between 0 and 1.
     */
    async validateLocators(projectId, pageId) {
        const page = await this.get(projectId, pageId);
        const locatorKeys = Object.keys(page.locators || {});
        const totalLocators = locatorKeys.length;

        if (totalLocators === 0) return { score: 1.0, valid: 0, invalid: 0, details: [] };

        const details = [];
        let valid = 0;

        for (const key of locatorKeys) {
            const locator = page.locators[key];
            const isValid =
                locator.selector &&
                typeof locator.selector === 'string' &&
                locator.selector.length > 0;

            details.push({ key, valid: isValid, selector: locator.selector });
            if (isValid) valid++;
        }

        return {
            score: valid / totalLocators,
            valid,
            invalid: totalLocators - valid,
            details,
        };
    }
}

export const pageObjectStore = new PageObjectStore();
export default pageObjectStore;
