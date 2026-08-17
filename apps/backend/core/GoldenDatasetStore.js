import fs from 'fs';
import path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

const GOLDEN_DIR = path.join(STORAGE_DIR, 'golden-datasets');

/**
 * GoldenDatasetStore
 * Manages golden datasets (known-good flows) on disk.
 * Used by the SafetyGate for semantic comparison.
 */
class GoldenDatasetStore {
    constructor() {
        this._ensureDir();
    }

    _ensureDir() {
        for (const sub of ['', 'flows', 'assertions', 'schemas']) {
            const dir = path.join(GOLDEN_DIR, sub);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    // ── Flow Golden Datasets ──────────────────────────────────

    /**
     * Saves a flow as a golden dataset.
     * @param {string} id - Unique ID for the golden dataset
     * @param {object} flowData - The known-good flow
     * @param {object} assertions - Optional assertions to attach
     */
    async saveGoldenFlow(id, flowData, assertions = {}) {
        const flowPath = path.join(GOLDEN_DIR, 'flows', `${id}.json`);
        const golden = {
            $schema: 'https://haltest.dev/schemas/golden-flow-v1.json',
            id,
            flow: flowData,
            assertions: {
                structural: {
                    minNodes: flowData.nodes?.length || 1,
                    maxNodes: Math.max((flowData.nodes?.length || 1) * 3, 20),
                    requiredNodeTypes: this._extractRequiredTypes(flowData),
                    mustHaveAssertion: this._hasAssertion(flowData),
                    mustTerminate: true,
                },
                pattern: assertions.pattern || [],
                semantic: assertions.semantic || [],
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0.0',
            },
        };

        fs.writeFileSync(flowPath, JSON.stringify(golden, null, 2), 'utf-8');
        return golden;
    }

    /**
     * Loads a golden flow dataset.
     */
    async getGoldenFlow(id) {
        const flowPath = path.join(GOLDEN_DIR, 'flows', `${id}.json`);
        if (!fs.existsSync(flowPath)) return null;
        return JSON.parse(fs.readFileSync(flowPath, 'utf-8'));
    }

    /**
     * Lists all golden flow datasets.
     */
    async listGoldenFlows() {
        const dir = path.join(GOLDEN_DIR, 'flows');
        if (!fs.existsSync(dir)) return [];
        return fs
            .readdirSync(dir)
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.replace('.json', ''));
    }

    /**
     * Deletes a golden flow dataset.
     */
    async deleteGoldenFlow(id) {
        const flowPath = path.join(GOLDEN_DIR, 'flows', `${id}.json`);
        if (fs.existsSync(flowPath)) fs.unlinkSync(flowPath);
    }

    // ── Assertions ────────────────────────────────────────────

    /**
     * Saves a standalone assertion file.
     */
    async saveAssertion(id, assertionData) {
        const filePath = path.join(GOLDEN_DIR, 'assertions', `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(assertionData, null, 2), 'utf-8');
    }

    /**
     * Loads a standalone assertion file.
     */
    async getAssertion(id) {
        const filePath = path.join(GOLDEN_DIR, 'assertions', `${id}.json`);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // ── Auto-Generation ───────────────────────────────────────

    /**
     * Auto-generates a golden dataset from a known-good flow.
     * @param {string} flowId - The flow ID to capture
     * @param {object} flowData - The flow data
     * @returns {object} - The generated golden dataset
     */
    async autoGenerateFromFlow(flowId, flowData) {
        return this.saveGoldenFlow(flowId, flowData);
    }

    // ── Helpers ───────────────────────────────────────────────

    _extractRequiredTypes(flowData) {
        const types = new Set();
        for (const node of flowData.nodes || []) {
            const type = node.type || node.data?.type;
            if (type === 'launch_browser') types.add('launch_browser');
        }
        return Array.from(types);
    }

    _hasAssertion(flowData) {
        return (flowData.nodes || []).some((n) => {
            const type = n.type || n.data?.type;
            return (
                type === 'validate_semantic' || type === 'assert_page_text' || type === 'run_tests'
            );
        });
    }
}

export const goldenDatasetStore = new GoldenDatasetStore();
export default goldenDatasetStore;
