import { describe, it, expect } from 'vitest';
import halTestMCPServer from '../services/HalTestMCPServer.js';

describe('HalTestMCPServer Unit Tests', () => {
    it('should initialize MCP server instance properly', () => {
        expect(halTestMCPServer.server).toBeDefined();
        expect(halTestMCPServer.serverName).toBe('HalTest-MCP-Server');
    });

    it('should expose tool definition registry', () => {
        const serverInstance = halTestMCPServer.getTools();
        expect(serverInstance).toBeDefined();
    });
});
