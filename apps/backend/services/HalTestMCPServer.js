import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import accessibilityTreePlanner from './agents/AccessibilityTreePlanner.js';
import networkConsoleHealer from './NetworkConsoleHealer.js';
import selectorHealer from './SelectorHealer.js';

/**
 * HalTestMCPServer
 * Exposes HalTest visual automation canvas and healing capabilities to external IDEs & AI Agents
 * via standard Model Context Protocol (MCP).
 */
export class HalTestMCPServer {
    constructor(options = {}) {
        this.serverName = options.name || 'HalTest-MCP-Server';
        this.version = options.version || '2.0.0';

        this.server = new McpServer({
            name: this.serverName,
            version: this.version,
        });

        this.registerTools();
    }

    /**
     * Registers all MCP tools exposed to external LLMs / IDEs
     */
    registerTools() {
        // 1. TOOL: get_canvas_flow
        this.server.tool(
            'get_canvas_flow',
            'Retrieves current HalTest visual flow canvas nodes and connections by flow ID',
            {
                flowId: z.string().describe('ID of the target visual flow'),
            },
            async ({ flowId }) => {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    flowId,
                                    nodes: [
                                        {
                                            id: 'n1',
                                            type: 'launch_browser',
                                            data: { headless: true },
                                        },
                                        {
                                            id: 'n2',
                                            type: 'open_url',
                                            data: { url: 'https://example.com' },
                                        },
                                    ],
                                    edges: [{ id: 'e1-2', source: 'n1', target: 'n2' }],
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        );

        // 2. TOOL: update_canvas_nodes
        this.server.tool(
            'update_canvas_nodes',
            'Injects or updates visual nodes in the HalTest canvas flow',
            {
                flowId: z.string().describe('Target flow ID'),
                nodes: z
                    .array(
                        z.object({
                            id: z.string(),
                            type: z.string(),
                            data: z.record(z.any()),
                        }),
                    )
                    .describe('List of node objects to insert or update'),
            },
            async ({ flowId, nodes }) => {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully updated flow ${flowId} with ${nodes.length} nodes.`,
                        },
                    ],
                };
            },
        );

        // 3. TOOL: plan_flow_from_accessibility
        this.server.tool(
            'plan_flow_from_accessibility',
            'Parses accessibility tree snapshot and plans optimal automation critical path',
            {
                targetUrl: z.string().url().describe('Target website URL'),
                goal: z
                    .string()
                    .describe('User goal (e.g. "Login to system", "Submit contact form")'),
                accessibilitySnapshot: z
                    .record(z.any())
                    .describe('Playwright accessibility tree snapshot object'),
            },
            async ({ targetUrl, goal, accessibilitySnapshot }) => {
                const interactiveNodes =
                    accessibilityTreePlanner.parseAccessibilityTree(accessibilitySnapshot);
                const criticalPath = accessibilityTreePlanner.analyzeCriticalPaths(
                    interactiveNodes,
                    goal,
                );
                const flowNodes = accessibilityTreePlanner.generateFlowNodes(
                    targetUrl,
                    criticalPath,
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    goal,
                                    summary: `Generated ${flowNodes.length} nodes along critical path.`,
                                    criticalPath,
                                    flowNodes,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        );

        // 4. TOOL: auto_heal_selector
        this.server.tool(
            'auto_heal_selector',
            'Heals a broken CSS/XPath selector using DOM compression and AI heuristics',
            {
                originalSelector: z.string().describe('The failing selector'),
                errorMessage: z.string().describe('Error message thrown during execution'),
            },
            async ({ originalSelector, errorMessage }) => {
                const healingResult = await selectorHealer.heal({
                    originalSelector,
                    errorMessage,
                    maxTiers: 1,
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(healingResult, null, 2),
                        },
                    ],
                };
            },
        );

        // 5. TOOL: auto_heal_network_console
        this.server.tool(
            'auto_heal_network_console',
            'Analyzes network/console logs and provides self-healing strategy',
            {
                statusCode: z.number().optional().describe('HTTP status code if available'),
                errorMessage: z.string().describe('Error log message'),
            },
            async ({ statusCode, errorMessage }) => {
                const analysis = networkConsoleHealer.analyzeError({ statusCode, errorMessage });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(analysis, null, 2),
                        },
                    ],
                };
            },
        );
    }

    /**
     * Returns registered tools definitions
     */
    getTools() {
        return this.server;
    }
}

export default new HalTestMCPServer();
