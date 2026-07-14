import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database models first
vi.mock('../database/init.js', () => ({
    Flow: {
        findByPk: vi.fn(),
    },
    Project: {
        findByPk: vi.fn(),
    },
    CollaboratorRole: {
        findOne: vi.fn(),
    },
    Run: {},
    StepResult: {},
}));

// Mock other services imported in run.controller.js
vi.mock('../services/ExecutionService.js', () => ({
    executionService: {},
}));
vi.mock('../services/ExecutionLogger.js', () => ({
    executionLogger: {
        startRun: vi.fn().mockResolvedValue('mock-run-id'),
    },
}));
vi.mock('../services/exporter/ReportExporter.js', () => ({
    reportExporter: {},
}));
vi.mock('../services/TestRunnerService.js', () => ({
    testRunnerService: {},
}));
vi.mock('../services/ActiveRunManager.js', () => ({
    activeRunManager: {},
}));
vi.mock('../services/ExecutionManager.js', () => ({
    executionManager: {},
}));
vi.mock('../services/ThrottlePolicy.js', () => ({
    ThrottlePolicy: {},
}));
vi.mock('../services/collaboration/ExecutionLock.js', () => ({
    executionLock: {
        check: vi.fn().mockReturnValue({ locked: false }),
        acquire: vi.fn(),
    },
}));

import { startRunAction } from '../controllers/run.controller.js';
import { Flow, Project, CollaboratorRole } from '../database/init.js';

describe('Backend Role Validation for Run Execution', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            body: {
                flowId: 'test-flow-id',
                projectId: 'test-project-id',
                flowName: 'Test Flow',
                trigger: 'manual',
                nodes: [],
                edges: [],
            },
            user: {
                id: 'collaborator-user-id',
                email: 'collab@haltest.dev',
            },
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        // Reset env variables just in case
        process.env.NODE_ENV = 'production';
        process.env.AUTH_ENABLED = 'true';
        process.env.VITE_AUTH_ENABLED = 'true';
        process.env.HALTEST_MODE = 'cloud';
        process.env.HAL_CLI_MODE = 'false';
    });

    it('should allow execution if collaboration is disabled on the project', async () => {
        Flow.findByPk.mockResolvedValue({ id: 'test-flow-id', projectId: 'test-project-id' });
        Project.findByPk.mockResolvedValue({
            id: 'test-project-id',
            userId: 'owner-id',
            collaborationEnabled: false,
        });

        await startRunAction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should block execution for a collaborator with viewer/editor role if collaboration is enabled', async () => {
        Flow.findByPk.mockResolvedValue({ id: 'test-flow-id', projectId: 'test-project-id' });
        Project.findByPk.mockResolvedValue({
            id: 'test-project-id',
            userId: 'owner-id',
            collaborationEnabled: true,
        });
        CollaboratorRole.findOne.mockResolvedValue({ role: 'editor' }); // editor is not owner

        await startRunAction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining('Only the project owner can execute flows'),
            }),
        );
    });

    it('should allow execution for the project owner if collaboration is enabled', async () => {
        mockReq.user.id = 'owner-id';
        Flow.findByPk.mockResolvedValue({ id: 'test-flow-id', projectId: 'test-project-id' });
        Project.findByPk.mockResolvedValue({
            id: 'test-project-id',
            userId: 'owner-id',
            collaborationEnabled: true,
        });

        await startRunAction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should bypass role restriction in dev/local mode even if collaboration is enabled', async () => {
        process.env.HALTEST_MODE = 'local';
        Flow.findByPk.mockResolvedValue({ id: 'test-flow-id', projectId: 'test-project-id' });
        Project.findByPk.mockResolvedValue({
            id: 'test-project-id',
            userId: 'owner-id',
            collaborationEnabled: true,
        });

        await startRunAction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
