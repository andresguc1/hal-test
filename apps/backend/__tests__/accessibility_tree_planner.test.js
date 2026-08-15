import { describe, it, expect } from 'vitest';
import accessibilityTreePlanner from '../services/agents/AccessibilityTreePlanner.js';

describe('AccessibilityTreePlanner Agent Unit Tests', () => {
    const mockSnapshot = {
        role: 'WebArea',
        name: 'Login Page',
        children: [
            {
                role: 'form',
                name: 'Login Form',
                children: [
                    { role: 'textbox', name: 'Email Address', value: '' },
                    { role: 'textbox', name: 'Password', value: '' },
                    { role: 'button', name: 'Sign In' },
                    { role: 'link', name: 'Forgot password?' },
                ],
            },
        ],
    };

    it('should parse accessibility tree snapshot correctly', () => {
        const interactiveNodes = accessibilityTreePlanner.parseAccessibilityTree(mockSnapshot);
        expect(interactiveNodes).toHaveLength(4);
        expect(interactiveNodes[0].role).toBe('textbox');
        expect(interactiveNodes[0].name).toBe('Email Address');
        expect(interactiveNodes[2].role).toBe('button');
        expect(interactiveNodes[2].name).toBe('Sign In');
    });

    it('should analyze critical paths for a login goal', () => {
        const interactiveNodes = accessibilityTreePlanner.parseAccessibilityTree(mockSnapshot);
        const criticalPath = accessibilityTreePlanner.analyzeCriticalPaths(
            interactiveNodes,
            'Submit login form',
        );

        expect(criticalPath.goal).toBe('Submit login form');
        expect(criticalPath.criticalPath.inputs).toHaveLength(2);
        expect(criticalPath.criticalPath.primaryAction).not.toBeNull();
        expect(criticalPath.criticalPath.primaryAction.name).toBe('Sign In');
    });

    it('should generate HalTest canvas visual flow nodes from critical path', () => {
        const interactiveNodes = accessibilityTreePlanner.parseAccessibilityTree(mockSnapshot);
        const criticalPath = accessibilityTreePlanner.analyzeCriticalPaths(
            interactiveNodes,
            'Login',
        );
        const flowNodes = accessibilityTreePlanner.generateFlowNodes(
            'https://app.haltest.com/login',
            criticalPath,
        );

        expect(flowNodes.length).toBeGreaterThanOrEqual(5);
        expect(flowNodes[0].type).toBe('launch_browser');
        expect(flowNodes[1].type).toBe('open_url');
        expect(flowNodes[1].data.url).toBe('https://app.haltest.com/login');
        expect(flowNodes[2].type).toBe('type_text');
        expect(flowNodes[4].type).toBe('click');
        expect(flowNodes[5].type).toBe('wait_visible');
    });
});
