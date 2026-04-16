import { Flow, Node, Edge, Run, StepResult } from '../database/init.js';
import { executionLogger } from './ExecutionLogger.js';
import * as actions from '../controllers/action.controller.js';
import { emitLog, emitFlowFinished, emitEdgeStatus, emitExecutionStatus } from '../socket.js';
import i18n from '../config/i18n.js';
import { variableManager } from './VariableManager.js';
import { executionManager } from './ExecutionManager.js';
import chalk from 'chalk';
import Table from 'cli-table3';
import { browserService } from './browser.service.js';

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

        const mode = options.mode || 'e2e';

        let runId = options.runId;
        if (!runId) {
            runId = await executionLogger.startRun(flowId, {
                flowName: flow.name,
                trigger: 'api',
                batchId: options.batchId || null,
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
            variables: options.variables || {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(currentNodes.map((n) => n.nodeId)), // Entry nodes are active by default
            nodeStates: {}, // nodeId -> state
            edgeStates: {}, // edgeId -> state
            overrides: options.overrides || {},
            headers: options.headers || {},
            startTime: Date.now(),
        };

        // Initialize all edges to 'idle' visually
        edges.forEach((e) => {
            const edgeId = e.edgeId || e.id;
            if (edgeId) emitEdgeStatus({ edgeId, status: 'idle' });
        });

        // Initialize isolated variable scope for this run with initial values
        variableManager.initRun(runId, runState.variables);

        // Emit overall start
        emitLog({
            message: `Starting remote execution of "${flow.name}" (Mode: ${mode})`,
            type: 'info',
        });

        try {
            // Use ExecutionManager to handle different execution modes
            const internalE2EExecute = async (f, s) => {
                await this.runSequence(currentNodes, nodes, edges, s);
                return { success: true };
            };

            await executionManager.execute(
                mode,
                { ...flow.toJSON(), nodes, edges },
                runState,
                internalE2EExecute,
            );

            console.log(`✅ [ExecutionService] Flow ${flowId} completed successfully`);
            await executionLogger.endRun(runId, 'completed');
            variableManager.clear(runId); // Free isolated variables
            emitLog({ message: `Flow execution finished successfully`, type: 'success' });

            // Signal global completion
            emitFlowFinished({ runId, status: 'completed', flowId });

            // 4. Print CLI Summary
            await this.printExecutionSummary(runId, flow.name);
        } catch (error) {
            console.error(`❌ [ExecutionService] Flow ${flowId} failed:`, error.message);
            await executionLogger.endRun(runId, 'failed').catch(() => {});
            variableManager.clear(runId); // Free isolated variables on failure too
            emitLog({ message: `Flow execution failed: ${error.message}`, type: 'error' });

            // Signal failure
            emitFlowFinished({ runId, status: 'failed', flowId, error: error.message });
            throw error;
        } finally {
            // --- AUTOMATIC RESOURCE CLEANUP ---
            // Ensure the browser launched for this specific run is closed
            if (runState.browserId) {
                console.log(
                    `[Cleanup] Closing browser session ${runState.browserId} for run ${runId}`,
                );
                await browserService.delete(runState.browserId).catch((e) => {
                    console.error(`[Cleanup] Error closing browser: ${e.message}`);
                });
            }
        }

        return runId;
    }

    /**
     * Recursive runner for the graph
     */
    async runSequence(currentNodes, allNodes, allEdges, state, parentId = null, options = {}) {
        const { skipParentFilter = false } = options;

        // Filter nodes to only process those at the same level (same parentId)
        const peerNodes = skipParentFilter
            ? currentNodes
            : currentNodes.filter((n) => (n.parentId || null) === (parentId || null));

        for (const node of peerNodes) {
            // Check if node has already been executed or skipped
            if (state.executedNodeIds.has(node.nodeId)) continue;

            // 1. Activation Check (Execution Token)
            // Only execute if node was explicitly activated by an incoming successful signal
            if (!state.activatedNodeIds.has(node.nodeId)) {
                console.log(`[DPE] Node ${node.nodeId} is in Standby (no signal received yet).`);
                continue;
            }

            // 2. Execute Node
            const result = await this.executeNode(node, allNodes, allEdges, state);
            state.executedNodeIds.add(node.nodeId);

            // 3. Store result for interpolation — even on error, so downstream nodes can inspect it
            const nodeLabel = node.data?.customLabel || node.data?.label || node.nodeId;
            if (result) {
                const nodeResult = result.data !== undefined ? result.data : result;
                variableManager.set(`${nodeLabel}.result`, nodeResult, state.runId);
                variableManager.set(`${node.nodeId}.result`, nodeResult, state.runId);
            }

            // 4. Flow Control Signals (break, continue, etc.)
            const signalAction = result?.action || result?.data?.action;
            if (['break', 'continue', 'return'].includes(signalAction)) {
                return result.action ? result : result.data;
            }

            // 5. Identify Next Paths
            let allNextEdges = allEdges.filter((e) => e.source === node.nodeId);
            const winnerPath = result?.data?.path || result?.path;

            // 6. DEAD PATH ELIMINATION (DPE)
            // Identify edges to activate and edges to kill
            let activeEdges = allNextEdges;
            let deadEdges = [];

            if (winnerPath) {
                // If the node decided a specific path (If/Else, Switch), separate them
                activeEdges = allNextEdges.filter((e) => e.sourceHandle === winnerPath);
                deadEdges = allNextEdges.filter((e) => e.sourceHandle !== winnerPath);
            } else if (allNextEdges.length > 0 && node.type !== 'branch') {
                // For linear nodes with multiple outgoing edges (broadcast), all are active
                // unless it's a branching node that failed to report a path.
            }

            // 6.1 Kill Dead Paths Recursively
            for (const edge of deadEdges) {
                this.propagateSkip(edge.edgeId || edge.id, allNodes, allEdges, state);
            }

            // 6.2 Activate Success Paths
            activeEdges.forEach((edge) => {
                const edgeId = edge.edgeId || edge.id;
                emitEdgeStatus({ edgeId, status: 'success' });
                state.activatedNodeIds.add(edge.target);
            });

            // 7. Recursive execution of next nodes
            const nextNodes = activeEdges
                .map((e) => allNodes.find((n) => n.nodeId === e.target))
                .filter(Boolean);

            if (nextNodes.length > 0) {
                // SPECIAL CASE: Branch Node Orchestration (Parallel, Race, etc.)
                if (node.type === 'branch') {
                    const mode = result?.data?.mode || 'sequential';
                    console.log(
                        `[ExecutionService] Branching mode: ${mode} for node ${node.nodeId}`,
                    );

                    if (mode === 'parallel') {
                        const results = await Promise.all(
                            nextNodes.map((nextNode) =>
                                this.runSequence(
                                    [nextNode],
                                    allNodes,
                                    allEdges,
                                    state,
                                    parentId,
                                    options,
                                ),
                            ),
                        );
                        const signal = results.find(
                            (r) => r && ['break', 'continue', 'return'].includes(r.action),
                        );
                        if (signal) return signal;
                    } else if (mode === 'race') {
                        const signal = await Promise.race(
                            nextNodes.map((nextNode) =>
                                this.runSequence(
                                    [nextNode],
                                    allNodes,
                                    allEdges,
                                    state,
                                    parentId,
                                    options,
                                ),
                            ),
                        );
                        if (signal) return signal;
                    } else {
                        const signal = await this.runSequence(
                            nextNodes,
                            allNodes,
                            allEdges,
                            state,
                            parentId,
                            options,
                        );
                        if (signal) return signal;
                    }
                } else {
                    // Standard sequential following
                    const signal = await this.runSequence(
                        nextNodes,
                        allNodes,
                        allEdges,
                        state,
                        parentId,
                        options,
                    );
                    if (signal) return signal;
                }
            }
        }
        return null; // Normal completion
    }

    /**
     * Propagates a Skip signal downstream (Dead Path Elimination)
     */
    propagateSkip(edgeId, allNodes, allEdges, state) {
        if (!edgeId) return;

        // 1. Mark edge as skipped
        if (state.edgeStates[edgeId] === 'skipped') return; // Avoid cyclic loops
        state.edgeStates[edgeId] = 'skipped';
        emitEdgeStatus({ edgeId, status: 'skipped' });

        // 2. Find target node
        const edge = allEdges.find((e) => (e.edgeId || e.id) === edgeId);
        if (!edge) return;

        const targetNode = allNodes.find((n) => n.nodeId === edge.target);
        if (!targetNode) return;

        // 3. Check if node should be skipped
        // A node is skipped if ALL its incoming edges are skipped
        const incomingEdges = allEdges.filter((e) => e.target === targetNode.nodeId);
        const allSkipped = incomingEdges.every(
            (e) => state.edgeStates[e.edgeId || e.id] === 'skipped',
        );

        if (allSkipped && !state.executedNodeIds.has(targetNode.nodeId)) {
            console.log(`[DPE] Eliminating Dead Path: Node ${targetNode.nodeId} is now SKIPPED.`);
            emitExecutionStatus({ stepId: targetNode.nodeId, status: 'skipped' });
            state.executedNodeIds.add(targetNode.nodeId); // Prevents it from being executed later

            // 4. Recursively skip all outgoing edges
            const outgoingEdges = allEdges.filter((e) => e.source === targetNode.nodeId);
            outgoingEdges.forEach((e) =>
                this.propagateSkip(e.edgeId || e.id, allNodes, allEdges, state),
            );
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
        const interpolateStrings = (obj, currentKey = '') => {
            // OPT-OUT: Prevent destroying JS conditional expressions or scripts
            const excludedKeys = [
                'branches',
                'conditions',
                'expression',
                'conditionScript',
                'script',
            ];
            if (excludedKeys.includes(currentKey)) return obj;

            if (typeof obj === 'string') return variableManager.resolve(obj, state.runId);
            if (Array.isArray(obj)) return obj.map((item) => interpolateStrings(item, currentKey));
            if (obj && typeof obj === 'object') {
                const newObj = {};
                for (const [k, v] of Object.entries(obj)) {
                    newObj[k] = interpolateStrings(v, k);
                }
                return newObj;
            }
            return obj;
        };

        const interpolatedBody = interpolateStrings({
            ...node.data, // Generic data
            ...config, // Specific configuration (keys like 'url', 'selector', etc.)
        });

        const body = {
            ...interpolatedBody,
            nodeId: node.nodeId,
            label: node.data?.customLabel || node.data?.label || actionType,
            runId: state.runId,
            browserId: state.browserId,
        };

        console.log(
            `[DEBUG] Final Execution Body for ${node.nodeId}: Label="${body.label}", RunId="${body.runId}"`,
        );

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
                runStartTime: state.startTime,
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
            const errMsg =
                resultData.error?.message ||
                resultData.error ||
                resultData.message ||
                `Node ${node.nodeId} failed`;

            // Store the error result so downstream conditionals can read it
            // (e.g. a Conditional node checking {{component.result.status}} === 'error')
            const nodeLabel = node.data?.customLabel || node.data?.label || node.nodeId;
            const errorResult = resultData.data || {
                status: 'error',
                error: { message: errMsg },
            };
            variableManager.set(`${nodeLabel}.result`, errorResult, state.runId);
            variableManager.set(`${node.nodeId}.result`, errorResult, state.runId);

            // Error is already logged by controller/emitLog, we just throw to stop flow
            throw new Error(errMsg);
        }

        // Update state with browserId if it was a launch action
        if (resultData && resultData.browserId) {
            state.browserId = resultData.browserId;
        }

        // 🌟 UNIFIED SUCCESS EMISSION (Included result for frontend edge highlighting)
        emitExecutionStatus({
            stepId: node.nodeId,
            status: 'success',
            result: resultData?.data || resultData,
        });

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
        const nodeLabel = node.data?.customLabel || node.data?.label || 'Loop';
        emitLog({
            message: `Executing loop container: "${nodeLabel}"...`,
            nodeId: node.nodeId,
            type: 'info',
        });

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
            emitLog({
                message: `Loop "${nodeLabel}" skipped: no internal nodes found.`,
                nodeId: node.nodeId,
                type: 'warning',
            });
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

        const totalIterations =
            mode === 'count'
                ? Number(variableManager.resolveValue(iterations, state.runId))
                : 'unknown';

        while (!finished && currentIndex < maxIterations) {
            let shouldContinue = false;
            let currentItem = null;

            // Evaluating condition...
            switch (mode) {
                case 'count': {
                    shouldContinue = currentIndex < Number(totalIterations);
                    break;
                }
                case 'array': {
                    let list = [];
                    if (typeof arrayInput === 'string') {
                        // Try getting as variable first (direct name), then resolve as template
                        list =
                            variableManager.get(arrayInput, state.runId) ||
                            variableManager.resolveValue(arrayInput, state.runId);
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
                        shouldContinue = variableManager.evaluate(condition, state.runId) === true;
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
            variableManager.set(indexVar, currentIndex, state.runId);
            if (mode === 'array') {
                variableManager.set(itemVar, currentItem, state.runId);
            }

            const iterLog =
                mode === 'count'
                    ? `Loop: Iteration ${currentIndex + 1} of ${totalIterations}`
                    : `Loop: Iteration ${currentIndex + 1}`;

            emitLog({ message: iterLog, nodeId: node.nodeId, type: 'info' });
            console.log(`[Loop] ${iterLog} for ${node.nodeId}`);

            // 3. Execution sub-graph
            // Create a local state for the iteration to track executed nodes within this iteration
            const iterationState = {
                ...state,
                executedNodeIds: new Set(), // Fresh set for this iteration
            };

            const sequenceParentId = flowId ? null : node.nodeId;

            const signal = await this.runSequence(
                loopStartNodes,
                subNodes,
                subEdges,
                iterationState,
                sequenceParentId,
                {
                    skipParentFilter: !!flowId,
                },
            );

            // HANDLE FLOW CONTROL SIGNALS
            if (signal) {
                if (signal.action === 'break') {
                    finished = true;
                    break;
                }
                if (signal.action === 'continue') {
                    currentIndex++;
                    continue; // Skip to next iteration check
                }
                if (signal.action === 'return') {
                    return signal; // Bubbling up return signal
                }
            }

            currentIndex++;
        }

        return {
            success: true,
            message: `Loop completed after ${currentIndex} iterations`,
            data: { totalIterations: currentIndex },
        };
    }

    async printExecutionSummary(runId, flowName) {
        try {
            const run = await Run.findByPk(runId, {
                include: [{ model: StepResult, as: 'steps' }],
            });

            if (!run) return;

            const table = new Table({
                head: [
                    chalk.cyan('Step'),
                    chalk.cyan('Node Type'),
                    chalk.cyan('Status'),
                    chalk.cyan('Duration'),
                ],
                style: { head: [], border: [] },
            });

            run.steps.forEach((step, idx) => {
                const statusColor =
                    step.status === 'completed' || step.status === 'success'
                        ? chalk.green
                        : step.status === 'failed'
                          ? chalk.red
                          : step.status === 'healed'
                            ? chalk.yellow
                            : chalk.white;

                table.push([
                    idx + 1,
                    step.node_type,
                    statusColor(step.status.toUpperCase()),
                    `${(step.duration / 1000).toFixed(2)}s`,
                ]);
            });

            console.log(
                '\n' + chalk.bold.underline.white(`\nHAL-TEST EXECUTION SUMMARY: ${flowName}`),
            );
            console.log(table.toString());

            const stats = chalk.gray(`
  TOTAL DURATION: ${chalk.white(((run.duration_ms || 0) / 1000).toFixed(2) + 's')}
  TOTAL HEALED:   ${chalk.yellow(run.total_healed || 0)}
  MEMORY HITS:    ${chalk.magenta(run.memory_palace_hits || 0)}
  FINAL STATUS:   ${run.status === 'completed' ? chalk.bgGreen.black(' PASS ') : chalk.bgRed.black(' FAIL ')}
            `);
            console.log(stats + '\n');
        } catch (e) {
            console.error('[CLI-REPORT] Failed to print summary:', e.message);
        }
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
