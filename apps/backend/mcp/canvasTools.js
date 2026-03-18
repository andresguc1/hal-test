import { getIO } from '../socket.js';

/**
 * Helper to emit events to the frontend and wait for a callback response.
 * We use socket.io acknowledgements.
 */
const requestFromFrontend = async (eventName, payload, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
        const io = getIO();

        // Broadcast to all connected clients (assuming single-user local app for now,
        // or we could target a specific socket ID if we start tracking sessions).
        let handled = false;

        // Timeout
        const timeout = setTimeout(() => {
            if (!handled) {
                handled = true;
                reject(new Error(`Timeout waiting for frontend response on event: ${eventName}`));
            }
        }, timeoutMs);

        io.emit(eventName, payload, (response) => {
            if (!handled) {
                handled = true;
                clearTimeout(timeout);
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            }
        });
    });
};

export const canvasTools = [
    {
        name: 'read_canvas_state',
        description:
            'Reads the current state of the HalTest visual canvas, including nodes and edges.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        handler: async () => {
            try {
                const state = await requestFromFrontend('mcp:request_canvas_state', {});
                return {
                    content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to read canvas: ${err.message}` }],
                };
            }
        },
    },
    {
        name: 'get_canvas_state',
        description: 'Alias for read_canvas_state. Reads current canvas nodes and edges.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        handler: async () => {
            try {
                const state = await requestFromFrontend('mcp:request_canvas_state', {});
                return {
                    content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to read canvas: ${err.message}` }],
                };
            }
        },
    },
    {
        name: 'inject_nodes',
        description: 'Injects new nodes into the HalTest visual canvas and connects them.',
        inputSchema: {
            type: 'object',
            properties: {
                nodes: {
                    type: 'array',
                    description: 'Array of node objects to add.',
                    items: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                description:
                                    'Type of the node (e.g., launch_browser, open_url, click, type_text)',
                            },
                            data: {
                                type: 'object',
                                description:
                                    'Data configuration for the node. E.g. { url: "..." } for open_url, { selector:="..." } for click',
                            },
                        },
                        required: ['type', 'data'],
                    },
                },
            },
            required: ['nodes'],
        },
        handler: async (args) => {
            try {
                const result = await requestFromFrontend('mcp:inject_nodes', { nodes: args.nodes });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully injected nodes. New nodes added: ${result.nodeIds.join(', ')}`,
                        },
                    ],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to inject nodes: ${err.message}` }],
                };
            }
        },
    },
    {
        name: 'add_node_to_canvas',
        description: 'Adds a single node to the HalTest visual canvas.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description:
                        'Type of the node (e.g., launch_browser, open_url, click, type_text)',
                },
                data: {
                    type: 'object',
                    description:
                        'Data configuration for the node. E.g. { url: "..." } for open_url, { selector: "..." } for click',
                },
                position: {
                    type: 'object',
                    description: 'Optional coordinates. E.g. { x: 100, y: 100 }',
                    properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                    },
                },
            },
            required: ['type', 'data'],
        },
        handler: async (args) => {
            try {
                const result = await requestFromFrontend('mcp:add_node', {
                    type: args.type,
                    data: args.data,
                    position: args.position,
                });
                return {
                    content: [
                        { type: 'text', text: `Successfully added node. ID: ${result.nodeId}` },
                    ],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to add node: ${err.message}` }],
                };
            }
        },
    },
    {
        name: 'connect_nodes',
        description: 'Creates a visual edge/connection between two nodes on the canvas.',
        inputSchema: {
            type: 'object',
            properties: {
                sourceId: { type: 'string', description: 'ID of the source node' },
                targetId: { type: 'string', description: 'ID of the target node' },
            },
            required: ['sourceId', 'targetId'],
        },
        handler: async (args) => {
            try {
                await requestFromFrontend('mcp:connect_nodes', {
                    sourceId: args.sourceId,
                    targetId: args.targetId,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully connected node ${args.sourceId} to ${args.targetId}`,
                        },
                    ],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to connect nodes: ${err.message}` }],
                };
            }
        },
    },
    {
        name: 'execute_playwright_cmd',
        description: 'Evaluates javascript on the active page for inspections or dynamic actions.',
        inputSchema: {
            type: 'object',
            properties: {
                browserId: { type: 'string', description: 'The ID of the browser session' },
                code: {
                    type: 'string',
                    description:
                        'Javascript code to evaluate (e.g. "document.title" or query selectors)',
                },
            },
            required: ['browserId', 'code'],
        },
        handler: async (args) => {
            try {
                const { browserService } = await import('../services/browser.service.js');
                const entry = browserService.get(args.browserId);
                if (!entry) throw new Error(`Browser session ${args.browserId} not found`);

                const browser = entry.browser || entry;
                const contexts = browser.contexts();
                if (contexts.length === 0) throw new Error('No open context');
                const pages = contexts[0].pages();
                if (pages.length === 0) throw new Error('No open pages');
                const page = pages[pages.length - 1];

                const result = await page.evaluate(args.code);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Failed to execute: ${err.message}` }],
                };
            }
        },
    },
];
