import { describe, it, expect } from 'vitest';
import { dependencyService } from '../services/DependencyService.js';

describe('Cross-Project Subflow & Component Integration Tests', () => {
    it('should resolve dependencies without strict projectId requirement', async () => {
        // Mock nodes containing a component referencing a flow
        const nodes = [
            {
                id: 'node-comp-1',
                type: 'component',
                data: { flowId: 'non-existent-flow-id' },
            },
        ];

        // DependencyService should not crash and return an array
        const components = await dependencyService.resolveDependencies(nodes, 'proj-123');
        expect(Array.isArray(components)).toBe(true);
        expect(components).toHaveLength(0);
    });
});
