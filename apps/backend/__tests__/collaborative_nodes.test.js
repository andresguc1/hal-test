import { describe, it, expect, vi } from 'vitest';

// Mock socket.js
vi.mock('../socket.js', () => ({
    emitExecutionStatus: vi.fn(),
    emitLog: vi.fn(),
    emitScreenshotReady: vi.fn(),
    emitVariableChange: vi.fn(),
    emitEdgeStatus: vi.fn(),
    emitFlowFinished: vi.fn(),
}));

// Mock i18n
vi.mock('../config/i18n.js', () => ({
    default: { t: (key) => key },
}));

// Mock database models
vi.mock('../database/init.js', () => ({
    Flow: { findOne: vi.fn(), findByPk: vi.fn() },
    Node: {},
    Edge: {},
    Run: { findByPk: vi.fn() },
    StepResult: {},
}));

// Mock ExecutionLogger
vi.mock('../services/ExecutionLogger.js', () => ({
    executionLogger: {
        startRun: vi.fn().mockResolvedValue('mock-run-id'),
        endRun: vi.fn().mockResolvedValue(true),
        logStep: vi.fn().mockResolvedValue(true),
    },
}));

import { executionService } from '../services/ExecutionService.js';
import { PlaywrightGenerator } from '../services/exporter/generators/PlaywrightGenerator.js';
import { generatePlaywrightCode } from '../services/exporter/generators/playwright.generator.js';

describe('Collaborative Nodes Integration', () => {
    describe('ExecutionService and Graph Validation', () => {
        it('should skip graph validation for collaborative nodes (sticky_note, discussion)', async () => {
            const nodes = [
                {
                    nodeId: 'collab-1',
                    type: 'sticky_note',
                    data: {
                        configuration: {
                            text: 'This is a note',
                        },
                    },
                },
                {
                    nodeId: 'collab-2',
                    type: 'discussion',
                    data: {
                        configuration: {
                            text: 'Let us discuss this',
                        },
                    },
                },
            ];

            await expect(executionService.validateGraph(nodes, [])).resolves.not.toThrow();
        });

        it('should return success and skip execution for collaborative nodes', async () => {
            const stickyNoteNode = {
                nodeId: 'collab-1',
                type: 'sticky_note',
                data: {
                    configuration: {
                        text: 'This is a note',
                    },
                },
            };
            const discussionNode = {
                nodeId: 'collab-2',
                type: 'discussion',
                data: {
                    configuration: {
                        text: 'Let us discuss this',
                    },
                },
            };

            const state = {
                runId: 'test-run',
                executedNodeIds: new Set(),
            };

            const result1 = await executionService.executeNode(
                stickyNoteNode,
                [stickyNoteNode],
                [],
                state,
            );
            const result2 = await executionService.executeNode(
                discussionNode,
                [discussionNode],
                [],
                state,
            );

            expect(result1).toEqual({ success: true });
            expect(result2).toEqual({ success: true });
        });
    });

    describe('Playwright Generators', () => {
        it('should completely skip code generation and warning for collaborative nodes in PlaywrightGenerator', () => {
            const generator = new PlaywrightGenerator('javascript', 'en');
            const steps = [
                {
                    id: 'collab-1',
                    type: 'sticky_note',
                    data: {
                        configuration: { text: 'Some note text' },
                    },
                },
                {
                    id: 'node-action',
                    type: 'open_url',
                    data: {
                        configuration: { url: 'https://example.com' },
                    },
                },
            ];

            const result = generator.generate(steps);
            const code = result.code;

            // Should contain the open_url action
            expect(code).toContain('page.goto');
            // Should not contain sticky_note or discussion or warnings about them
            expect(code).not.toContain('sticky_note');
            expect(result.warnings.some((w) => w.nodeType === 'sticky_note')).toBe(false);
        });

        it('should skip code generation for collaborative nodes in generatePlaywrightCode', () => {
            const steps = [
                {
                    type: 'sticky_note',
                    data: {
                        configuration: { text: 'Some note text' },
                    },
                },
                {
                    type: 'open_url',
                    data: {
                        configuration: { url: 'https://example.com' },
                    },
                },
            ];

            const code = generatePlaywrightCode(steps, 'javascript', 'en');

            expect(code).toContain('page.goto');
            expect(code).not.toContain('sticky_note');
            expect(code).not.toContain('not_implemented');
        });
    });
});
