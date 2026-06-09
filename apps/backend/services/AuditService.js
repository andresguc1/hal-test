import fs from 'fs/promises';
import path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

class AuditService {
    constructor() {
        this.datasetDir = path.join(STORAGE_DIR, 'datasets');
        this.logFilePath = path.join(this.datasetDir, 'audit_fine_tuning.jsonl');
        this.initialized = false;
    }

    /**
     * Ensures storage directory exists and initializes the log file if needed.
     */
    async ensureInitialized() {
        if (this.initialized) return;
        try {
            await fs.mkdir(this.datasetDir, { recursive: true });
            this.initialized = true;
        } catch (error) {
            console.error('[AuditService] Failed to initialize dataset directory:', error);
        }
    }

    /**
     * Logs a successful step to the JSONL audit file.
     *
     * @param {object} params
     * @param {object} params.input - Original resolved inputs of the step.
     * @param {string|null} params.domBefore - Simplified DOM tree state before the action.
     * @param {string} params.action - Action name (e.g. click, type_text).
     * @param {string|null} params.selector - Final working selector (original, DB-recovered, or healed).
     * @param {object} params.assertionResult - Assertion outcome (success status, output info, etc.).
     * @param {string} [params.runId] - Optional run ID context.
     * @param {string} [params.nodeId] - Optional node ID context.
     */
    async logStep({ input, domBefore, action, selector, assertionResult, runId, nodeId }) {
        try {
            await this.ensureInitialized();

            const entry = {
                timestamp: new Date().toISOString(),
                runId: runId || null,
                nodeId: nodeId || null,
                action,
                input: input || {},
                dom_state: domBefore || null,
                selector: selector || null,
                assertion_result: assertionResult || { success: true, status: 'success' },
            };

            // Write as single JSONL line
            const line = JSON.stringify(entry) + '\n';
            await fs.appendFile(this.logFilePath, line, 'utf8');
            console.log(
                `[AuditService] Successful step logged to JSONL for node: ${nodeId || 'unknown'}`,
            );
        } catch (error) {
            console.error('[AuditService] Failed to append step result to JSONL:', error);
        }
    }
}

export const auditService = new AuditService();
export default auditService;
