import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { canvasTools } from './canvasTools.js';

let mcpServerInstance = null;

export const initMcpServer = async () => {
    if (mcpServerInstance) return mcpServerInstance;

    console.log('🚀 Initializing MCP Server integration...');

    // Create MCP Server instance
    const server = new McpServer({
        name: 'HalTest Canvas MCP Server',
        version: '1.0.0',
        description: 'Exposes HalTest visual canvas tools for bi-directional manipulation',
    });

    // Register all tools
    for (const tool of canvasTools) {
        server.tool(tool.name, tool.description, tool.inputSchema.properties, async (args) => {
            console.log(`[MCP] Tool invoked: ${tool.name}`);
            return await tool.handler(args);
        });
    }

    mcpServerInstance = server;
    console.log('✅ MCP Server tools registered successfully');

    // Connect transport if we want to run this as a standalone executable
    // Note: Since this will be used by an in-browser or built-in Langchain AI
    // we might need to expose these tools straight to the AI SDK rather than
    // via stdio transport to an external Claude Desktop app for this milestone.
    // For now, let's keep it abstract.

    return mcpServerInstance;
};

export const getMcpServer = () => mcpServerInstance;
