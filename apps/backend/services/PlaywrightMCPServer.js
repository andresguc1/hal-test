/* global document, window */
import { browserService } from './browser.service.js';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * PlaywrightMCPServer
 *
 * Acts as the "Brain" interface between the AI and the Browser.
 * It uses the @modelcontextprotocol/sdk to define tools in a standard way,
 * which can then be fed into the AIService.
 */
class PlaywrightMCPServer {
    constructor() {
        // Initialize the MCP Server
        // We use the SDK to manage tool definitions and validation
        this.server = new McpServer({
            name: 'Hal-Test-Playwright-MCP',
            version: '1.0.0',
        });

        this.registerTools();
    }

    /**
     * Registers all available browser control tools
     */
    registerTools() {
        // TOOL: inspect_page
        // Dumps the accessibility tree or simplified DOM to help AI understand page state
        this.server.tool(
            'inspect_page',
            'Get a structural overview of the current page state (Accessibility Tree or Simplified DOM)',
            {
                browserId: z.string().describe('The ID of the browser/session to inspect'),
                strategy: z
                    .enum(['accessibility', 'html'])
                    .default('accessibility')
                    .describe('Inspection strategy'),
            },
            async ({ browserId, strategy }) => {
                const entry = browserService.get(browserId);
                if (!entry) throw new Error(`Browser session ${browserId} not found`);

                const page = await this.getPage(entry);

                if (strategy === 'accessibility') {
                    const snapshot = await page.accessibility.snapshot();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }],
                    };
                } else {
                    // Simple HTML cleanup to avoid token overflow
                    const content = await page.content();
                    const simplified = content
                        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '')
                        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, '')
                        .substring(0, 20000); // Hard limit for safety
                    return {
                        content: [{ type: 'text', text: simplified }],
                    };
                }
            },
        );

        // TOOL: suggest_selector
        // Helps find a selector for a given description
        this.server.tool(
            'suggest_selector',
            'Finds the best CSS selector for a visual description of an element',
            {
                browserId: z.string().describe('The ID of the browser session'),
                description: z
                    .string()
                    .describe("Visual description of the element (e.g. 'The blue Login button')"),
            },
            async ({ browserId, description }) => {
                const entry = browserService.get(browserId);
                if (!entry) throw new Error(`Browser session ${browserId} not found`);
                const page = await this.getPage(entry);

                // We inject a script to find elements matching text/attributes
                // This is a naive heuristic implementation for the "Brain" to use
                // In a real scenario, this might use a small vision model or scoring system
                const result = await page.evaluate((desc) => {
                    // Simple heuristic: contains text match
                    const elements = Array.from(document.querySelectorAll('*'));
                    const match = elements.find(
                        (el) =>
                            el.textContent &&
                            el.textContent.toLowerCase().includes(desc.toLowerCase()) &&
                            el.checkVisibility(),
                    );

                    if (match) {
                        // Generate a simple CSS path
                        let path = match.tagName.toLowerCase();
                        if (match.id) path += `#${match.id}`;
                        else if (match.className) path += `.${match.className.split(' ')[0]}`;
                        return path;
                    }
                    return null;
                }, description);

                if (result) {
                    return {
                        content: [{ type: 'text', text: `Best match found: ${result}` }],
                    };
                }

                return {
                    content: [
                        { type: 'text', text: 'No element found matching that description.' },
                    ],
                    isError: true,
                };
            },
        );

        // TOOL: highlight_element
        // Visual feedback for the user
        this.server.tool(
            'highlight_element',
            'Highlights an element on the active page with a yellow border',
            {
                browserId: z.string().describe('The ID of the browser session'),
                selector: z.string().describe('CSS Selector to highlight'),
            },
            async ({ browserId, selector }) => {
                const entry = browserService.get(browserId);
                if (!entry) throw new Error(`Browser session ${browserId} not found`);
                const page = await this.getPage(entry);

                try {
                    await page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        if (el) {
                            el.style.outline = '4px solid #FACC15'; // Tailwind Yellow-400
                            el.style.transition = 'outline 0.3s ease';
                            setTimeout(() => {
                                el.style.outline = '';
                            }, 2000);
                        }
                    }, selector);

                    return {
                        content: [{ type: 'text', text: `Element ${selector} highlighted.` }],
                    };
                } catch (e) {
                    return {
                        content: [{ type: 'text', text: `Failed to highlight: ${e.message}` }],
                        isError: true,
                    };
                }
            },
        );
    }

    /**
     * Helper to get the active page from a browser entry
     */
    async getPage(entry) {
        const browser = entry.browser || entry;
        const contexts = browser.contexts();
        if (contexts.length === 0) throw new Error('No open context');
        const pages = contexts[0].pages();
        if (pages.length === 0) throw new Error('No open pages');
        return pages[pages.length - 1]; // active page
    }

    /**
     * Returns the tools formatted for Vercel AI SDK
     * The MCP SDK has a generic structure, we might need to map it if we want strict typing in Vercel.
     * BUT, Vercel AI SDK Core can accept standard tool definitions.
     * For now, we manually expose the 'definitions' for our AIService to consume.
     */
    getToolDefinitions() {
        // We access the internal tool registry of the MCP server SDK
        // effectively unwrapping it for direct use in our AIService
        // This avoids needing a transport layer for in-process comms.

        // Note: The McpServer class in the SDK might store tools in ._tools or similar.
        // We will construct the Vercel-compatible object manually for maximum compatibility
        // based on the registered tools logic above.

        return {
            inspect_page: {
                description:
                    'Get a structural overview of the current page state (Accessibility Tree or Simplified DOM)',
                parameters: z.object({
                    browserId: z.string().describe('The ID of the browser/session to inspect'),
                    strategy: z
                        .enum(['accessibility', 'html'])
                        .describe('Inspection strategy (accessibility or html)'),
                }),
                execute: async (args) => {
                    // Call the implementation we defined in registerTools
                    // We simulate an MCP request call
                    // NOTE: Since the SDK abstracts the execution, we can also just call the logic directly
                    // if we refactor. For now, let's call the 'tool' method logic if accessible,
                    // or cleaner: we just implement the execute function here directly mapping to what we wrote above.
                    // To avoid code duplication, we will call `this.server._tools` if accessible?
                    // No, let's just make `execute` call a helper method in this class.
                    return this.executeTool('inspect_page', args);
                },
            },
            suggest_selector: {
                description: 'Finds the best CSS selector for a visual description of an element',
                parameters: z.object({
                    browserId: z.string().describe('The ID of the browser session'),
                    description: z
                        .string()
                        .describe(
                            "Visual description of the element (e.g. 'The blue Login button')",
                        ),
                }),
                execute: async (args) => this.executeTool('suggest_selector', args),
            },
            highlight_element: {
                description: 'Highlights an element on the active page with a yellow border',
                parameters: z.object({
                    browserId: z.string().describe('The ID of the browser session'),
                    selector: z.string().describe('CSS Selector to highlight'),
                }),
                execute: async (args) => this.executeTool('highlight_element', args),
            },
        };
    }

    /**
     * Internal execution router to reuse logic
     */
    async executeTool(name, args) {
        // We can just call the registered handler from the SDK if we knew how to access it easily
        // Or we can just re-implement the simple router here since it is "In-Process".
        // The SDK is great for stdio servers, but for in-process, direct dispatch is easier.
        // Let's rely on the definitions in getToolDefinitions being the source of truth for execution too
        // by moving the logic there or having separate methods.

        // REFACTOR: Let's move logic to explicit methods to be clean.
        switch (name) {
            case 'inspect_page':
                return this._inspectPage(args);
            case 'suggest_selector':
                return this._suggestSelector(args);
            case 'highlight_element':
                return this._highlightElement(args);
            default:
                throw new Error(`Tool ${name} not found`);
        }
    }

    // --- IMPLEMENTATIONS ---

    async _inspectPage({ browserId, strategy }) {
        const entry = browserService.get(browserId);
        if (!entry) return 'Browser session not found (ID: ' + browserId + ')';

        const page = await this.getPage(entry);

        if (strategy === 'accessibility') {
            const snapshot = await page.accessibility.snapshot();
            return JSON.stringify(snapshot, null, 2);
        } else {
            const content = await page.content();
            const simplified = content
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '')
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, '')
                .substring(0, 20000);
            return simplified;
        }
    }

    async _suggestSelector({ browserId, description }) {
        const entry = browserService.get(browserId);
        if (!entry) return 'Browser session not found';
        const page = await this.getPage(entry);

        const result = await page.evaluate((desc) => {
            const elements = Array.from(document.querySelectorAll('*'));
            // Filter visible elements
            const visible = elements.filter((el) => {
                const style = window.getComputedStyle(el);
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0'
                );
            });

            // Text match
            const match = visible.find(
                (el) => el.textContent && el.textContent.toLowerCase().includes(desc.toLowerCase()),
            );

            if (match) {
                let path = match.tagName.toLowerCase();
                if (match.id) return `#${match.id}`;
                if (
                    match.className &&
                    typeof match.className === 'string' &&
                    match.className.trim()
                ) {
                    path += `.${match.className.trim().split(/\s+/)[0]}`;
                }
                return path;
            }
            return null;
        }, description);

        return result ? `Suggested Selector: ${result}` : 'No matching element found.';
    }

    async _highlightElement({ browserId, selector }) {
        const entry = browserService.get(browserId);
        if (!entry) return 'Browser session not found';
        const page = await this.getPage(entry);

        try {
            await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (el) {
                    el.style.outline = '4px solid #FACC15';
                    el.style.transition = 'outline 0.3s ease';
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        el.style.outline = '';
                    }, 2000);
                }
            }, selector);
            return `Element ${selector} highlighted.`;
        } catch (e) {
            return `Failed to highlight: ${e.message}`;
        }
    }
}

// Export singleton
export const playwrightMcpServer = new PlaywrightMCPServer();
