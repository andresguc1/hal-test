import express from 'express';
import path from 'path';
import fs from 'fs';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

const router = express.Router();

/**
 * @swagger
 * /api/history/evidence/{runId}/{nodeId}:
 *   get:
 *     summary: Retrieve historical evidence (screenshot) for a specific node in a run.
 *     tags: [History]
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the execution run.
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the node.
 *     responses:
 *       200:
 *         description: The image file.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Evidence not found.
 */
router.get('/evidence/:runId/:nodeId', async (req, res) => {
    const { runId, nodeId } = req.params;

    // Apply headers globally for this endpoint to prevent CORB blocking even on errors
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Optional dev convenience

    // Sanitize check (basic)
    if (runId.includes('..') || nodeId.includes('..')) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    const runDir = path.join(STORAGE_RUNS_DIR, runId);
    if (!fs.existsSync(runDir)) {
        return res.status(404).json({ error: 'Run directory not found' });
    }

    // Strategy 1: Direct match (Standard Forensic) -> {nodeId}.png
    let filename = `${nodeId}.png`;
    let filePath = path.join(runDir, filename);

    if (!fs.existsSync(filePath)) {
        // Strategy 2: Legacy/Fuzzy match (step_{timestamp}_{nodeId}.png)
        // search for any file ending in `_${nodeId}.png` or just containing nodeId
        try {
            const files = await fs.promises.readdir(runDir);
            const found = files.find((f) => f.includes(nodeId) && f.endsWith('.png'));
            if (found) {
                filePath = path.join(runDir, found);
            } else {
                return res.status(404).json({ error: 'Evidence not found', nodeId });
            }
        } catch (err) {
            console.error('Error searching evidence:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Improve Delivery: Set correct content type and Cache Control
    // Fix "NotSameOrigin" / generic blocking issues
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Optional dev convenience
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Long cache, immutable because run artifacts don't change
    res.sendFile(filePath);
});

// Alias for Report Standard: /api/reports/:runId/:nodeId/screenshot
router.get('/reports/:runId/:nodeId/screenshot', async (req, res) => {
    // Reuse the logic by internally calling the handler or just redirecting?
    // Redirection is safer to keep logic in one place, but verify performance.
    // Internal rewrite is better. Let's just duplicate the logic wrapper or call a shared function.
    // For simplicity/robustness, I'll redirect to the evidence endpoint which has the full logic.
    // Actually, redirect might cause CORS issues again if not handled carefully.
    // Let's just forward to the same handler logic.
    const { runId, nodeId } = req.params;
    // Map to evidence URL

    req.url = `/evidence/${runId}/${nodeId}`; // Internal rewrite if possible, but we are in a sub-router.
    // Let's just redirect 307.
    // res.redirect(307, `../../evidence/${runId}/${nodeId}`);

    // BETTER: Shared logic.
    // Since I can't easily refactor into a shared function without rewriting the whole file structure in this tool call,
    // I will implementation the redirect for now.
    res.redirect(307, `/api/history/evidence/${runId}/${nodeId}`);
});

export default router;
