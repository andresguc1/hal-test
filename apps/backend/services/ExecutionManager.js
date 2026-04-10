import { emitLog } from '../socket.js';

/**
 * @typedef {Object} RunOptions
 * @property {string} runId
 * @property {Object} overrides
 * @property {Object} headers
 */

/**
 * Base interface for all Specialized Runners
 */
class Runner {
    /**
     * @param {Object} flow
     * @param {RunOptions} options
     */
    async execute(_flow, _options) {
        throw new Error('Method not implemented');
    }
}

/**
 * Current Playwright-based E2E Runner
 */
class E2ERunner extends Runner {
    /**
     * @param {Object} flow
     * @param {RunOptions} options
     * @param {Function} runFn - The function to call for E2E execution (provided by ExecutionService)
     */
    async execute(flow, options, runFn) {
        console.log(`[E2ERunner] Delegating to standard E2E runner for flow: ${flow.id}`);
        return await runFn(flow, options);
    }
}

/**
 * k6-based Performance Runner
 */
class PerformanceRunner extends Runner {
    async execute(flow, _options) {
        console.log(`[PerformanceRunner] Starting Performance run for flow: ${flow.id}`);
        const nodes = flow.nodes;

        // Basic mapping logic
        const script = `
import { browser } from 'k6/browser';
export const options = { scenarios: { ui: { executor: 'constant-vus', vus: 1, duration: '10s', options: { browser: { type: 'chromium' } } } } };
export default async function () {
    const page = browser.newPage();
    // Flow translation would go here
    await page.goto('${nodes.find((n) => n.type === 'open_url')?.data?.url || 'http://localhost'}');
    await page.close();
}
        `;

        emitLog({ message: 'Generated k6 Performance Script (Draft)', type: 'info' });
        console.log(script);

        return { success: true, mode: 'performance', data: { script } };
    }
}

/**
 * DAST/Audit-based Security Runner
 */
class SecurityRunner extends Runner {
    constructor() {
        super();
        this.actions = null;
    }

    async execute(flow, _options) {
        console.log(`[SecurityRunner] Starting Security Audit for flow: ${flow.id}`);

        // Find Audit Nodes
        const auditNodes = flow.nodes.filter((n) => n.type === 'security_header_audit');

        if (auditNodes.length === 0) {
            emitLog({
                message: 'No security audit nodes found in flow. Running global ZAP spider...',
                type: 'info',
            });
            // Here we would call ZAP API
        }

        emitLog({ message: 'Security Audit completed (Mock)', type: 'success' });
        return { success: true, mode: 'security' };
    }
}

class ExecutionManager {
    constructor() {
        this.runners = {
            e2e: new E2ERunner(),
            performance: new PerformanceRunner(),
            security: new SecurityRunner(),
        };
    }

    /**
     * Executes a flow in the specified mode
     * @param {string} mode - 'e2e' | 'performance' | 'security'
     * @param {Object} flow
     * @param {RunOptions} options
     * @param {Function} [e2eRunFn] - Callback for E2E execution
     */
    async execute(mode, flow, options, e2eRunFn) {
        const runner = this.runners[mode || 'e2e'];

        if (!runner) {
            throw new Error(`Execution mode "${mode}" is not supported.`);
        }

        emitLog({ message: `HalTest: Switching to ${mode.toUpperCase()} Runner...`, type: 'info' });

        try {
            return await runner.execute(flow, options, e2eRunFn);
        } catch (error) {
            emitLog({ message: `Runner Error (${mode}): ${error.message}`, type: 'error' });
            throw error;
        }
    }
}

export const executionManager = new ExecutionManager();
