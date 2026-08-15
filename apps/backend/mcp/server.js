#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import halTestMCPServer from '../services/HalTestMCPServer.js';

/**
 * HalTest MCP Stdio Server Entry point
 * Run this executable script directly or via VS Code / Cursor / Windsurf mcpServers config:
 * "mcpServers": {
 *   "haltest": {
 *     "command": "node",
 *     "args": ["/path/to/apps/backend/mcp/server.js"]
 *   }
 * }
 */
async function main() {
    const transport = new StdioServerTransport();
    await halTestMCPServer.server.connect(transport);
    console.error('[HalTest-MCP] Server initialized via StdioTransport');
}

main().catch((err) => {
    console.error('[HalTest-MCP] Fatal error running MCP Stdio Server:', err);
    process.exit(1);
});
