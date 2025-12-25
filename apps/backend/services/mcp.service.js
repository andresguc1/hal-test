// services/mcp.service.js
// =================================================================
// 🧠 Singleton Client for connection with the Playwright MCP engine
// =================================================================

import { createConnection } from '@playwright/mcp';

class MCPClient {
    constructor() {
        this.client = null;
        // The default URL the MCP provided us on startup
        this.defaultUrl = 'http://localhost:8931/mcp';
        this.isConnecting = false;
    }

    /**
     * Connect to the MCP using the Singleton pattern and reconnection handling.
     * @param {string} url - MCP server URL
     * @returns {Promise<Object>} Client instance
     */
    async connect(url = this.defaultUrl) {
        // If already connected, return existing client
        if (this.client) {
            console.log('ℹ️ An active connection to the MCP already exists');
            return this.client;
        }

        // Prevent simultaneous connections
        if (this.isConnecting) {
            throw new Error('⚠️ A connection is already in progress');
        }

        this.isConnecting = true;

        try {
            this.client = await createConnection({ url });
            console.log('✅ Connected to the MCP:', url);

            // Handle unexpected disconnection
            this.client.on?.('disconnect', () => {
                console.warn('⚠️ MCP connection lost unexpectedly');
                this.client = null; // Clear the instance to allow reconnection
            });

            return this.client;
        } catch (err) {
            console.error('❌ Error connecting to MCP:', err.message);
            throw new Error(`Failed in MCP connection: ${err.message}`);
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Disconnect from the MCP safely
     */
    async disconnect() {
        if (!this.client) {
            console.log('ℹ️ No active connection to close');
            return;
        }

        try {
            // It is assumed that the 'close' method exists in the MCP client
            await this.client.close?.();
            console.log('🔌 MCP connection closed successfully');
        } catch (err) {
            console.error('❌ Error closing MCP:', err.message);
        } finally {
            this.client = null;
        }
    }

    /**
     * Check if there is an active connection
     * @returns {boolean}
     */
    isConnected() {
        return this.client !== null;
    }

    /**
     * Get client instance with validation
     * @returns {Object} MCP Client
     * @throws {Error} If there is no active connection
     */
    getClient() {
        if (!this.client) {
            throw new Error('⚠️ No active connection with MCP. Run connect() first.');
        }
        return this.client;
    }

    /**
     * Call MCP tool with validation and improved error handling
     * * Note: Uses an internal method (_requestHandlers) to simulate the call
     * to the tool, as the @playwright/mcp SDK often exposes this
     * functionality more directly in practice.
     * * @param {string} toolName - Tool name (e.g., 'browser.launch')
     * @param {Object} args - Tool arguments (the node payload)
     * @returns {Promise<Object>} Tool result
     */
    async callTool(toolName, args = {}) {
        const client = this.getClient();

        if (!toolName || typeof toolName !== 'string') {
            throw new Error('⚠️ toolName must be a valid string');
        }

        // ⚠️ Note: This is the most dependent part of the internal MCP implementation.
        // Assuming 'tools/call' is the correct handler.
        const handler = client._requestHandlers?.get('tools/call');

        if (!handler) {
            throw new Error(
                '⚠️ Handler tools/call not available in the MCP client. The MCP version might be incompatible.',
            );
        }

        try {
            const result = await handler({
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args,
                },
            });

            console.log(`✅ Tool "${toolName}" executed successfully`);
            return result;
        } catch (err) {
            console.error(`❌ Error executing "${toolName}":`, err.message);
            // Relaunch a clearer error for the Express controller
            throw new Error(`Failed in tool ${toolName}: ${err.message}`);
        }
    }

    /**
     * List available tools
     * @returns {Promise<Array>} List of tools
     */
    async listTools() {
        const client = this.getClient();

        try {
            const handler = client._requestHandlers?.get('tools/list');
            if (!handler) {
                throw new Error('Handler tools/list not available in the MCP client');
            }

            const result = await handler({ method: 'tools/list' });
            return result.tools || [];
        } catch (err) {
            console.error('❌ Error listing tools:', err.message);
            // Simply returns an empty array in case of listing failure
            return [];
        }
    }
}

// Export singleton instance
const mcpClient = new MCPClient();

// Simplified exports for use in other modules
export const connectMCP = (url) => mcpClient.connect(url);
export const disconnectMCP = () => mcpClient.disconnect();
export const getClient = () => mcpClient.getClient();
export const callTool = (name, args) => mcpClient.callTool(name, args);
export const isConnected = () => mcpClient.isConnected();
export const listTools = () => mcpClient.listTools();

export default mcpClient;
