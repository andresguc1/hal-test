import { Flow, Node, Edge, Run } from '../database/init.js';
import { executionLogger } from './ExecutionLogger.js';
import * as actions from '../controllers/action.controller.js';
import { emitLog, emitFlowFinished } from '../socket.js';
import i18n from '../config/i18n.js';
import { variableManager } from './VariableManager.js';

class ExecutionService {
    constructor() {
        this.activeRuns = new Map();
    }

    /**
     * Executes a flow from the backend.
     * @param {string} flowId
     * @param {string} projectId
     * @param {object} options - { overrides: { headless: true }, runId: string, headers: object }
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
            headers: options.headers || {},
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
    async runSequence(currentNodes, allNodes, allEdges, state, parentId = null) {
        // Filter nodes to only process those at the same level (same parentId)
        const peerNodes = currentNodes.filter((n) => n.parentId === parentId);

        for (const node of peerNodes) {
            if (state.executedNodeIds.has(node.nodeId)) continue;

            // 1. Execute Node
            const result = await this.executeNode(node, allNodes, allEdges, state);
            state.executedNodeIds.add(node.nodeId);

            // 1.1 Store result in VariableManager for downstream interpolation
            const nodeLabel = node.data?.customLabel || node.data?.label || node.nodeId;
            if (result && result.success !== false) {
                const nodeResult = result.data || result;
                // Save by Label (User friendly)
                variableManager.set(`${nodeLabel}.result`, nodeResult, 'flow');
                // Save by ID (Robust)
                variableManager.set(`${node.nodeId}.result`, nodeResult, 'flow');
            }

            // 2. Find next nodes
            let nextEdges = allEdges.filter((e) => e.source === node.nodeId);

            // Branching support: If node returns a specific path/handle direction
            const path = result?.data?.path;
            if (path) {
                nextEdges = nextEdges.filter((e) => e.sourceHandle === path);
            }

            const nextNodes = nextEdges
                .map((e) => allNodes.find((n) => n.nodeId === e.target))
                .filter(Boolean);

            if (nextNodes.length > 0) {
                // Ensure we only follow nodes at the SAME level (same parentId)
                await this.runSequence(nextNodes, allNodes, allEdges, state, parentId);
            }
        }
    }

    /**
     * Executes a single node action
     */
    async executeNode(node, allNodes, allEdges, state) {
        const actionType = node.type;

        // SPECIAL CASE: Loop (Composition Container)
        if (actionType === 'loop') {
            return await this.executeLoopContainer(node, allNodes, allEdges, state);
        }

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

        // Deeply interpolate variables in config strings before executing
        const interpolateStrings = (obj) => {
            if (typeof obj === 'string') return variableManager.resolve(obj);
            if (Array.isArray(obj)) return obj.map(interpolateStrings);
            if (obj && typeof obj === 'object') {
                const newObj = {};
                for (const [k, v] of Object.entries(obj)) {
                    newObj[k] = interpolateStrings(v);
                }
                return newObj;
            }
            return obj;
        };

        const body = interpolateStrings({
            ...node.data, // Generic data
            ...config, // Specific configuration (keys like 'url', 'selector', etc.)
            nodeId: node.nodeId,
            runId: state.runId,
            browserId: state.browserId,
        });

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
            headers: state.headers || {},
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

    /**
     * Orchestrates the execution of a Loop acting as an encapsulated sub-flow (Dive-in)
     */
    async executeLoopContainer(node, allNodes, allEdges, state) {
        const config = node.data?.configuration || {};
        const {
            mode,
            iterations,
            condition,
            array: arrayInput,
            itemVar = 'item',
            indexVar = 'i',
            maxIterations = 1000,
            flowId, // NEW: Support for dive-in sub-flows
        } = config;

        console.log(
            `[Loop] Starting encapsulated execution for node ${node.nodeId} (Mode: ${mode}, FlowId: ${flowId})`,
        );

        let subNodes = [];
        let subEdges = [];

        // 1. Identify children (Support both models for backward compatibility during transition)
        if (flowId) {
            // Dive-in model: Load nodes from the linked flow
            const subFlow = await Flow.findOne({
                where: { id: flowId },
                include: [
                    { model: Node, as: 'nodes' },
                    { model: Edge, as: 'edges' },
                ],
            });
            if (!subFlow) {
                throw new Error(`[Loop] Backing flow ${flowId} not found for loop ${node.nodeId}`);
            }
            subNodes = subFlow.nodes.map((n) => n.toJSON());
            subEdges = subFlow.edges.map((e) => e.toJSON());
        } else {
            // In-place model (Deprecated): Filter by parentId
            subNodes = allNodes.filter((n) => n.parentId === node.nodeId);
            subEdges = allEdges; // We filter edges by node IDs later if needed
        }

        if (subNodes.length === 0) {
            console.warn(`[Loop] Loop node ${node.nodeId} has no children. Skipping.`);
            return { success: true, message: 'Loop skipped (no children)' };
        }

        // Find entry points within the loop
        const childNodeIds = new Set(subNodes.map((c) => c.nodeId));
        // Only consider edges where both source and target are inside the sub-flow
        const internalEdges = subEdges.filter(
            (e) => childNodeIds.has(e.target) && childNodeIds.has(e.source),
        );

        const incomingCount = new Map();
        subNodes.forEach((c) => incomingCount.set(c.nodeId, 0));
        internalEdges.forEach((e) => {
            incomingCount.set(e.target, incomingCount.get(e.target) + 1);
        });

        const entryNodes = subNodes.filter((c) => incomingCount.get(c.nodeId) === 0);
        const loopStartNodes = entryNodes.length > 0 ? entryNodes : [subNodes[0]];

        let currentIndex = 0;
        let finished = false;

        while (!finished && currentIndex < maxIterations) {
            let shouldContinue = false;
            let currentItem = null;

            // Evaluating condition...
            switch (mode) {
                case 'count': {
                    const total = Number(variableManager.resolveValue(iterations));
                    shouldContinue = currentIndex < total;
                    break;
                }
                case 'array': {
                    let list = [];
                    if (typeof arrayInput === 'string') {
                        list = variableManager.resolveValue(arrayInput);
                    } else if (Array.isArray(arrayInput)) {
                        list = arrayInput;
                    }
                    if (!Array.isArray(list)) list = [];
                    shouldContinue = currentIndex < list.length;
                    if (shouldContinue) currentItem = list[currentIndex];
                    break;
                }

                case 'while': {
                    try {
                        shouldContinue = variableManager.evaluate(condition) === true;
                    } catch (e) {
                        shouldContinue = false;
                    }
                    break;
                }
                default:
                    shouldContinue = false;
            }

            if (!shouldContinue) {
                finished = true;
                break;
            }

            // 2. Set Iteration Variables
            variableManager.set(indexVar, currentIndex, 'flow');
            if (mode === 'array') {
                variableManager.set(itemVar, currentItem, 'flow');
            }

            console.log(`[Loop] Iteration ${currentIndex + 1} for ${node.nodeId}`);

            // 3. Execution sub-graph
            // Create a local state for the iteration to track executed nodes within this iteration
            const iterationState = {
                ...state,
                executedNodeIds: new Set(), // Fresh set for this iteration
            };

            await this.runSequence(loopStartNodes, allNodes, allEdges, iterationState, node.nodeId);

            currentIndex++;
        }

        return {
            success: true,
            message: `Loop completed after ${currentIndex} iterations`,
            data: { totalIterations: currentIndex },
        };
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
