import { Flow, Node, Edge, Run } from '../database/init.js';
import { executionLogger } from './ExecutionLogger.js';
import * as actions from '../controllers/action.controller.js';
import { emitLog, emitFlowFinished } from '../socket.js';
import i18n from '../config/i18n.js';

class ExecutionService {
    constructor() {
        this.activeRuns = new Map();
    }

    /**
     * Executes a flow from the backend.
     * @param {string} flowId
     * @param {string} projectId
     * @param {object} options - { overrides: { headless: true }, runId: string }
     */
    async executeFlow(flowId, projectId, options = {}) {
        console.log(`🚀 [ExecutionService] Starting remote execution for flow: ${flowId}`);

        // 1. Fetch flow data
        const flow = await Flow.findOne({
            where: { id: flowId, projectId },
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            throw new Error(`Flow ${flowId} not found in project ${projectId}`);
        }

        const nodes = flow.nodes.map((n) => n.toJSON());
        const edges = flow.edges.map((e) => e.toJSON());

        // 2. Use existing runId or Create a new one
        let runId = options.runId;
        if (!runId) {
            runId = await executionLogger.startRun(flowId, {
                flowName: flow.name,
                trigger: 'api',
                flowSnapshot: JSON.stringify({ nodes, edges }),
            });
        } else {
            // Update snapshot if we already have a record
            const run = await Run.findByPk(runId);
            if (run) {
                await run.update({ flow_snapshot: JSON.stringify({ nodes, edges }) });
            }
        }

        // 3. Execution logic (BFS/DFS traversal)
        // Find start nodes: Nodes with no incoming edges
        const incomingEdgesCount = new Map();
        nodes.forEach((n) => incomingEdgesCount.set(n.nodeId, 0));
        edges.forEach((e) => {
            const count = incomingEdgesCount.get(e.target) || 0;
            incomingEdgesCount.set(e.target, count + 1);
        });

        let currentNodes = nodes.filter((n) => incomingEdgesCount.get(n.nodeId) === 0);

        if (currentNodes.length === 0 && nodes.length > 0) {
            // Fallback: If it's a cycle or something messy, pick the first node
            currentNodes = [nodes[0]];
        }

        // Context state for the run
        const runState = {
            runId,
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            overrides: options.overrides || {},
        };

        // Emit overall start
        emitLog({ message: `Starting remote execution of "${flow.name}"`, type: 'info' });

        try {
            await this.runSequence(currentNodes, nodes, edges, runState);

            console.log(`✅ [ExecutionService] Flow ${flowId} completed successfully`);
            await executionLogger.endRun(runId, 'completed');
            emitLog({ message: `Flow execution finished successfully`, type: 'success' });

            // Signal global completion
            emitFlowFinished({ runId, status: 'completed', flowId });
        } catch (error) {
            console.error(`❌ [ExecutionService] Flow ${flowId} failed:`, error.message);
            await executionLogger.endRun(runId, 'failed');
            emitLog({ message: `Flow execution failed: ${error.message}`, type: 'error' });

            // Signal failure
            emitFlowFinished({ runId, status: 'failed', flowId, error: error.message });
            throw error;
        }

        return runId;
    }

    /**
     * Recursive runner for the graph
     */
    async runSequence(currentNodes, allNodes, allEdges, state) {
        for (const node of currentNodes) {
            if (state.executedNodeIds.has(node.nodeId)) continue;

            // 1. Execute Node
            await this.executeNode(node, state);
            state.executedNodeIds.add(node.nodeId);

            // 2. Find next nodes
            const nextEdges = allEdges.filter((e) => e.source === node.nodeId);
            const nextNodes = nextEdges
                .map((e) => allNodes.find((n) => n.nodeId === e.target))
                .filter(Boolean);

            if (nextNodes.length > 0) {
                // BFS approach for parallel branches, or sequential DFS.
                // For now, let's keep it sequential DFS style.
                await this.runSequence(nextNodes, allNodes, allEdges, state);
            }
        }
    }

    /**
     * Executes a single node action
     */
    async executeNode(node, state) {
        const actionType = node.type;
        const handlerName = this.getHandlerName(actionType);
        const handler = actions[handlerName];

        if (!handler) {
            const error = `No handler found for node type: ${actionType}`;
            emitLog({ message: error, type: 'error', nodeId: node.nodeId });
            throw new Error(error);
        }

        // Logic to extract parameters.
        // In HAL-TEST, configuration is often stored in node.data.configuration
        const config = node.data?.configuration || {};
        const body = {
            ...node.data, // Generic data
            ...config, // Specific configuration (keys like 'url', 'selector', etc.)
            nodeId: node.nodeId,
            runId: state.runId,
            browserId: state.browserId,
        };

        // Apply browser launch overrides
        if (actionType === 'launch_browser') {
            Object.assign(body, state.overrides);
        }

        console.log(`[ExecutionService] Executing node: ${node.nodeId} (${actionType})`);

        // Prepare Mock Request and Response
        const req = {
            body: {
                ...body,
                runId: state.runId, // Ensure runId is ALWAYS in the body
            },
            t: i18n.t.bind(i18n),
            headers: {},
            // Needed for some controllers
            params: {},
        };

        let resultData = null;
        const res = {
            statusCode: 200,
            status: (code) => {
                res.statusCode = code;
                return res;
            },
            json: (data) => {
                resultData = data;
                return res;
            },
        };

        // Call the controller action
        try {
            await handler(req, res);
        } catch (err) {
            emitLog({
                message: `Critical error in node ${node.nodeId}: ${err.message}`,
                type: 'error',
                nodeId: node.nodeId,
            });
            throw err;
        }

        if (resultData && resultData.success === false) {
            const errMsg = resultData.error || resultData.message || `Node ${node.nodeId} failed`;
            // Error is already logged by controller/emitLog, we just throw to stop flow
            throw new Error(errMsg);
        }

        // Update state with browserId if it was a launch action
        if (resultData && resultData.browserId) {
            state.browserId = resultData.browserId;
        }

        return resultData;
    }

    getHandlerName(nodeType) {
        // Normalization map
        const map = {
            launch_browser: 'launchBrowserAction',
            open_url: 'openUrlAction',
            click: 'clickAction',
            type_text: 'typeTextAction',
            find_element: 'findElementAction',
            wait_for_element: 'waitForElementAction',
            take_screenshot: 'takeScreenshotAction',
            close_browser: 'closeBrowserAction',
        };

        if (map[nodeType]) return map[nodeType];

        // Default heuristic: camelCase + 'Action'
        // e.g. custom_eval -> customEvalAction
        const camelled = nodeType.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        return `${camelled}Action`;
    }
}

export const executionService = new ExecutionService();
