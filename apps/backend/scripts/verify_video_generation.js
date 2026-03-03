import { executionService } from '../services/ExecutionService.js';
import { Run, Flow, Project, User, Canvas, Node, Edge, initDb } from '../database/init.js';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

async function verify() {
    try {
        console.log('--- Starting Video Generation Verification ---');
        await initDb();

        // 1. Setup mock data
        const userId = 'verify-user';
        const projectId = 'verify-project';
        const canvasId = 'verify-canvas';
        const flowId = 'verify-flow';

        await User.findOrCreate({
            where: { id: userId },
            defaults: { email: 'verify@test.com', name: 'Verifier' },
        });
        await Project.findOrCreate({
            where: { id: projectId },
            defaults: { name: 'Verify Project', userId },
        });
        await Canvas.findOrCreate({
            where: { id: canvasId },
            defaults: { name: 'Verify Canvas', projectId },
        });

        await Flow.upsert({
            id: flowId,
            name: 'Verify Flow',
            projectId,
            canvasId,
            viewport: { x: 0, y: 0, zoom: 1 },
        });

        // Create Nodes in DB
        const nodeData = [
            {
                nodeId: 'node-1',
                type: 'launch_browser',
                flowId,
                data: { nodeId: 'node-1', configuration: { headless: true } },
            },
            {
                nodeId: 'node-2',
                type: 'open_url',
                flowId,
                data: { nodeId: 'node-2', configuration: { url: 'https://example.com' } },
            },
            { nodeId: 'node-3', type: 'close_browser', flowId, data: { nodeId: 'node-3' } },
        ];

        for (const n of nodeData) {
            await Node.upsert(n);
        }

        // Create Edges in DB
        const edgeData = [
            { edgeId: 'edge-1', source: 'node-1', target: 'node-2', flowId },
            { edgeId: 'edge-2', source: 'node-2', target: 'node-3', flowId },
        ];

        for (const e of edgeData) {
            await Edge.upsert(e);
        }

        console.log('--- Case 1: Video Recording ENABLED (Default) ---');
        const runId1 = await executionService.executeFlow(flowId, projectId);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const videoFile1 = path.join(STORAGE_RUNS_DIR, runId1, 'execution.webm');
        await fs.access(videoFile1);
        const run1 = await Run.findByPk(runId1);
        if (run1.video_path !== `storage/runs/${runId1}/execution.webm`)
            throw new Error('Video path mismatch');
        console.log('✅ Case 1 Passed');

        // 5. Case 2: Video Recording DISABLED
        console.log('--- Case 2: Video Recording DISABLED ---');
        const flowIdDisabled = 'verify-flow-disabled';
        await Flow.upsert({
            id: flowIdDisabled,
            name: 'Verify Flow Disabled',
            projectId,
            canvasId,
        });

        const nodesDisabled = [
            {
                nodeId: 'd-node-1',
                type: 'launch_browser',
                flowId: flowIdDisabled,
                data: { nodeId: 'd-node-1', configuration: { headless: true, recordVideo: false } },
            },
            {
                nodeId: 'd-node-2',
                type: 'open_url',
                flowId: flowIdDisabled,
                data: { nodeId: 'd-node-2', configuration: { url: 'https://example.com' } },
            },
            {
                nodeId: 'd-node-3',
                type: 'close_browser',
                flowId: flowIdDisabled,
                data: { nodeId: 'd-node-3' },
            },
        ];
        for (const n of nodesDisabled) await Node.upsert(n);

        await Edge.upsert({
            edgeId: 'd-edge-1',
            source: 'd-node-1',
            target: 'd-node-2',
            flowId: flowIdDisabled,
        });
        await Edge.upsert({
            edgeId: 'd-edge-2',
            source: 'd-node-2',
            target: 'd-node-3',
            flowId: flowIdDisabled,
        });

        const runId2 = await executionService.executeFlow(flowIdDisabled, projectId);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const videoFile2 = path.join(STORAGE_RUNS_DIR, runId2, 'execution.webm');

        let fileExists = false;
        try {
            await fs.access(videoFile2);
            fileExists = true;
        } catch (e) {
            // Expected if file does not exist
        }

        if (fileExists) throw new Error('Video file should NOT exist');

        const run2 = await Run.findByPk(runId2);
        if (run2.video_path) throw new Error('Video path should be NULL in DB');
        console.log('✅ Case 2 Passed');

        console.log('--- All Verifications Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('An error occurred during verification:', error);
        process.exit(1);
    }
}

verify();
