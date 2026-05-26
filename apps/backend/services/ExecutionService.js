import { Flow, Node, Edge, Run, StepResult } from '../database/init.js';
import { executionLogger } from './ExecutionLogger.js';
import * as actions from '../controllers/action.controller.js';
import { emitLog, emitFlowFinished, emitEdgeStatus, emitExecutionStatus } from '../socket.js';
import i18n from '../config/i18n.js';
import { variableManager } from './VariableManager.js';
import { executionManager } from './ExecutionManager.js';
import chalk from 'chalk';

console.log(`[ExecutionService] 🔥 Service File Loaded at ${new Date().toISOString()}`);
import Table from 'cli-table3';
import { browserService } from './browser.service.js';
import { actionRoutes } from '../routes/api.router.js';
import * as schemas from '../schemas/index.js';

export class ExecutionService {
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
        const nodeIds = new Set(nodes.map((n) => n.nodeId));
        const edges = flow.edges
            .map((e) => e.toJSON())
            .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

        console.log(`[ExecutionService] 📊 Loaded ${nodes.length} nodes for execution:`);
        nodes.forEach((n) => {
            console.log(
                `   - ID: ${n.nodeId}, Type: ${n.type}, Parent: ${n.parentId || 'NULL'}, Label: ${n.data?.label || n.data?.customLabel || 'N/A'}`,
            );
        });

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

        // 2.5 PRE-EXECUTION VALIDATION (Double-Check)
        try {
            console.log(
                `[ExecutionService] 🛡️ Validating graph structure and node configurations...`,
            );
            await this.validateGraph(nodes, edges);
            console.log(`[ExecutionService] ✅ Graph validation successful.`);
        } catch (validationError) {
            console.error(
                `❌ [ExecutionService] Pre-execution validation failed:`,
                validationError.message,
            );

            // Signal failure with node metadata for UI auto-focus
            emitFlowFinished({
                runId,
                status: 'failed',
                flowId,
                error: validationError.message,
                failedNodeId: validationError.failedNodeId,
                divePath: validationError.divePath,
            });

            throw validationError;
        }

        // 3. Execution logic (BFS/DFS traversal)
        // Find start nodes: Nodes with no incoming edges
        const incomingEdgesCount = new Map();
        nodes.forEach((n) => incomingEdgesCount.set(n.nodeId, 0));
        edges.forEach((e) => {
            const count = incomingEdgesCount.get(e.target) || 0;
            incomingEdgesCount.set(e.target, count + 1);
        });

        let currentNodes = nodes.filter(
            (n) => incomingEdgesCount.get(n.nodeId) === 0 && !n.data?.disabled,
        );

        if (currentNodes.length === 0 && nodes.length > 0) {
            // Fallback: If it's a cycle or something messy, pick the first non-disabled node
            currentNodes = [nodes.find((n) => !n.data?.disabled) || nodes[0]];
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

    async validateGraph(nodes, edges, divePath = []) {
        for (const node of nodes) {
            if (node.data?.disabled) continue;

            const type = node.type || node.data?.type;

            // Skip non-action nodes (guide, note, etc.)
            const ignoredTypes = [
                'guide',
                'note',
                'comment',
                'annotation',
                'label',
                'sticky',
                'input',
                'output',
            ];
            if (ignoredTypes.includes(type)) continue;

            // Find matching route for schema validation
            const route = actionRoutes.find((r) => r.path === type);

            if (route && route.schema && schemas[route.schema]) {
                const schema = schemas[route.schema];
                const config = node.data?.configuration || {};

                // Execute Joi validation
                const { error } = schema.validate(config, {
                    abortEarly: true,
                    stripUnknown: true,
                });

                if (error) {
                    const label = node.data?.customLabel || node.data?.label || type;
                    const message = error.details[0].message.replace(/['"]/g, '');
                    const fullError = new Error(
                        `Configuration Error in node "${label}": ${message}`,
                    );
                    fullError.failedNodeId = node.nodeId;
                    fullError.divePath = divePath;
                    throw fullError;
                }
            }

            // RECURSIVE VALIDATION: Dive into Components or Loops pointing to sub-flows
            const flowId = node.data?.configuration?.flowId || node.data?.flowId;
            if ((type === 'component' || type === 'loop') && flowId) {
                const subFlow = await Flow.findOne({
                    where: { id: flowId },
                    include: [
                        { model: Node, as: 'nodes' },
                        { model: Edge, as: 'edges' },
                    ],
                });

                if (subFlow) {
                    const subNodes = subFlow.nodes.map((n) => n.toJSON());
                    const subEdges = subFlow.edges.map((e) => e.toJSON());
                    await this.validateGraph(subNodes, subEdges, [...divePath, node.nodeId]);
                }
            }
        }
    }

    /**
     * Recursive runner for the graph
     */
    async runSequence(currentNodes, allNodes, allEdges, state = {}, parentId = null, options = {}) {
        const { skipParentFilter = false } = options;

        if (!state.executedNodeIds) state.executedNodeIds = new Set();
        if (!state.activatedNodeIds) state.activatedNodeIds = new Set();

        // Ensure all entry points for this sequence are activated
        currentNodes.forEach((n) => {
            if (n && n.nodeId) state.activatedNodeIds.add(n.nodeId);
        });

        // Filter nodes to only process those at the same level (same parentId)
        const peerNodes = skipParentFilter
            ? currentNodes
            : currentNodes.filter((n) => (n.parentId || null) === (parentId || null));

        for (const node of peerNodes) {
            // Check if node is explicitly disabled or already executed
            if (node.data?.disabled) continue;
            if (state.executedNodeIds && state.executedNodeIds.has(node.nodeId)) continue;

            // 1. Activation Check (Execution Token)
            // Only execute if node was explicitly activated by an incoming successful signal
            if (state.activatedNodeIds && !state.activatedNodeIds.has(node.nodeId)) {
                console.log(`[DPE] Node ${node.nodeId} is in Standby (no signal received yet).`);
                continue;
            }

            // 2. Execute Node
            const result = await this.executeNode(node, allNodes, allEdges, state);
            console.log(
                `[ExecutionService] Node ${node.nodeId} execution finished. Result success: ${!!result}`,
            );
            state.executedNodeIds.add(node.nodeId);

            // 3. Store result for interpolation — even on error, so downstream nodes can inspect it
            const nodeLabel = node.data?.customLabel || node.data?.label || node.nodeId;
            if (result) {
                let nodeResult = result.data !== undefined ? result.data : result;

                // Inject label into object results to aid VariableManager resolution
                if (nodeResult && typeof nodeResult === 'object' && !Array.isArray(nodeResult)) {
                    nodeResult.label = nodeResult.label || nodeLabel;
                }
                // 🌟 Use storeNodeResult instead of manual redundant storage
                variableManager.storeNodeResult(
                    node.nodeId,
                    {
                        label: node.data?.label,
                        customLabel: node.data?.customLabel,
                        technicalName: node.data?.technicalName || node.type,
                    },
                    nodeResult,
                    state.runId,
                );

                console.log(
                    `[ExecutionService] 💾 Normalized storage complete for "${nodeLabel}" via alias registry`,
                );

                // 3.b Parent Synchronization (Live Status for Groups/Components)
                const targetParents = [];

                // Direct Visual Parent (Group)
                if (node.parentId) {
                    const parentNode = allNodes.find((n) => n.nodeId === node.parentId);
                    if (parentNode) {
                        targetParents.push({
                            id: parentNode.nodeId,
                            label:
                                parentNode.data?.customLabel ||
                                parentNode.data?.label ||
                                parentNode.nodeId,
                        });
                    }
                }

                // 🚀 Cross-Flow Parent (The Component node that called this subflow)
                if (state.callerId) {
                    targetParents.push({
                        id: state.callerId,
                        label: state.callerLabel || state.callerId,
                    });
                }

                for (const parent of targetParents) {
                    // Get current accumulated result
                    const existingResult = variableManager.get(
                        `${parent.label}.result`,
                        state.runId,
                    ) || { data: {} };

                    const isHardFail = nodeResult.status === 'failed';
                    const isSoftFail =
                        nodeResult.status === 'softfailed' ||
                        existingResult.status === 'softfailed';

                    // Accumulate data
                    const updatedData = { ...existingResult.data };
                    if (node.type === 'output') {
                        updatedData[nodeLabel] =
                            nodeResult.data !== undefined ? nodeResult.data : nodeResult;
                    } else if (typeof nodeResult === 'object') {
                        Object.assign(updatedData, nodeResult);
                    }

                    const parentResult = {
                        success: !isHardFail,
                        status: isHardFail ? 'failed' : isSoftFail ? 'softfailed' : 'running',
                        lastNode: nodeLabel,
                        data: {
                            ...updatedData,
                            status: isHardFail ? 'failed' : isSoftFail ? 'softfailed' : 'running',
                            success: !isHardFail,
                            label: parent.label,
                        },
                    };

                    // Store to both ID and Label
                    variableManager.set(`${parent.label}.result`, parentResult, state.runId);
                    variableManager.set(`${parent.id}.result`, parentResult, state.runId);
                    variableManager.set(parent.label, parentResult, state.runId);
                    variableManager.set(parent.id, parentResult, state.runId);

                    console.log(
                        `[ExecutionService] 👨‍👦 Synced results to parent/caller: ID=${parent.id}, Label="${parent.label}"`,
                    );
                }
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
                // Log for debugging path-to-edge mapping
                const availableHandles = allNextEdges
                    .map((e) => e.sourceHandle || 'default')
                    .join(', ');
                console.log(
                    `[DPE] Node ${node.nodeId}: winnerPath="${winnerPath}", available handles=[${availableHandles}]`,
                );

                // 🌈 FLEXIBLE PATH MATCHING
                const normalizedPath = String(winnerPath || '').toLowerCase();
                activeEdges = allNextEdges.filter((e) => {
                    const handle = String(e.sourceHandle || 'default').toLowerCase();
                    if (handle === normalizedPath) return true;

                    // Synonym Map: If logic decided "else" but edge is "false" or vice versa
                    if (normalizedPath === 'else' || normalizedPath === 'false') {
                        return handle === 'else' || handle === 'false' || handle === 'default';
                    }
                    if (normalizedPath === 'true' || normalizedPath === 'success') {
                        return handle === 'true' || handle === 'success';
                    }
                    return false;
                });
                deadEdges = allNextEdges.filter((e) => !activeEdges.includes(e));

                if (activeEdges.length === 0 && allNextEdges.length > 0) {
                    console.warn(
                        `[DPE] ⚠️ No edges matched winnerPath="${winnerPath}" (Available: [${availableHandles}])`,
                    );

                    // 🛡️ SWITCH/CONDITIONAL SAFETY NET: Activate 'default' edge when no handle matched
                    // This prevents silent flow stoppage when a case ID drifts after edges are connected
                    if (node.type === 'switch' || node.type === 'conditional') {
                        const defaultEdge = allNextEdges.find(
                            (e) =>
                                (e.sourceHandle || 'default').toLowerCase() === 'default' ||
                                (e.sourceHandle || '').toLowerCase() === 'false' ||
                                (e.sourceHandle || '').toLowerCase() === 'else',
                        );
                        if (defaultEdge) {
                            console.warn(
                                `[DPE] 🛡️ Switch fallback: activating 'default' edge for unmatchable path "${winnerPath}"`,
                            );
                            activeEdges = [defaultEdge];
                            deadEdges = allNextEdges.filter((e) => e !== defaultEdge);
                        }
                    }
                }
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

        let resultData = null;

        // SPECIAL CASE: Loop (Composition Container)
        if (actionType === 'loop') {
            resultData = await this.executeLoopContainer(node, allNodes, allEdges, state);
        } else {
            const handlerName = this.getHandlerName(actionType);
            const handler = actions[handlerName];

            if (!handler) {
                const error = `No handler found for node type: ${actionType}`;
                emitLog({
                    message: `[NodeError] NodeId=${node.nodeId} Type=${actionType} Error="${error}"`,
                    type: 'error',
                    nodeId: node.nodeId,
                });
                throw new Error(error);
            }

            // Logic to extract parameters.
            // In HAL-TEST, configuration is often stored in node.data.configuration
            const config = node.data?.configuration || {};

            // Deeply interpolate variables in config strings before executing
            const interpolateStrings = (obj, currentKey = '') => {
                // OPT-OUT: Prevent destroying JS conditional expressions or scripts
                const excludedKeys = ['branches', 'conditions', 'conditionScript', 'script'];
                if (excludedKeys.includes(currentKey)) return obj;

                // Special case for 'expression':
                // If it's a string, it's JS code -> EXCLUDE from interpolation.
                // If it's an object, it's a structured rule -> ALLOW interpolation of its properties.
                if (currentKey === 'expression' && typeof obj === 'string') return obj;

                if (typeof obj === 'string') return variableManager.resolve(obj, state.runId);
                if (Array.isArray(obj))
                    return obj.map((item) => interpolateStrings(item, currentKey));
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
        }

        if (resultData && resultData.success === false) {
            const errMsg =
                resultData.error?.message ||
                resultData.error ||
                resultData.message ||
                `Node ${node.nodeId} failed`;

            // Store the error result so downstream conditionals can read it
            const nodeLabel = node.data?.customLabel || node.data?.label || node.nodeId;
            const errorResult = resultData.data || {
                status: resultData.status || 'error',
                success: false,
                recovered: resultData.recovered || false,
                error: { message: errMsg },
            };

            // 🌟 Use storeNodeResult instead of manual redundant storage
            variableManager.storeNodeResult(
                node.nodeId,
                {
                    label: node.data?.label,
                    customLabel: node.data?.customLabel,
                    technicalName: node.data?.technicalName || node.type,
                },
                errorResult,
                state.runId,
            );

            // 🛡️ SOFT FAIL PROTECTION: Check if node should continue even on failure
            const continueOnFailure =
                node.data?.configuration?.continueOnFailure ||
                node.data?.continueOnFailure ||
                false;

            if (continueOnFailure) {
                console.log(
                    `[ExecutionService] 🛡️ Soft Fail active for node ${node.nodeId}. Continuing flow despite error.`,
                );
                emitLog({
                    message: `[Soft Fail] Node "${nodeLabel}" failed but continuing: ${errMsg}`,
                    type: 'warning',
                    nodeId: node.nodeId,
                });
                // We return the error result instead of throwing, allowing downstream nodes to proceed
                return resultData;
            }

            // Error is already logged by controller/emitLog, we just throw to stop flow
            throw new Error(errMsg);
        }

        // Update state with browserId if it was a launch action
        if (resultData && resultData.browserId) {
            state.browserId = resultData.browserId;
        }

        // 🌟 UNIFIED SUCCESS EMISSION (Included result for frontend edge highlighting)
        const finalResult = resultData?.data !== undefined ? resultData.data : resultData;

        // Standardize output: Ensure status and recovered are present for conditional logic
        if (finalResult && typeof finalResult === 'object') {
            if (!finalResult.status) finalResult.status = resultData?.status || 'success';
            if (finalResult.recovered === undefined)
                finalResult.recovered = resultData?.recovered || false;

            // 🏷️ Metadata Injection for deep search
            finalResult.technicalName = node.data?.technicalName;
            finalResult.label = node.data?.customLabel || node.data?.label;
        }

        // 🌟 Use storeNodeResult instead of manual redundant storage
        variableManager.storeNodeResult(
            node.nodeId,
            {
                label: node.data?.label,
                customLabel: node.data?.customLabel,
                technicalName: node.data?.technicalName || node.type,
            },
            finalResult,
            state.runId,
        );

        // Also register node.type as alias for generic access (e.g. open_url)
        if (node.type) {
            variableManager.registerAlias(node.type, node.nodeId, state.runId);
            variableManager.registerAlias(
                `${node.type}.result`,
                `${node.nodeId}.result`,
                state.runId,
            );
        }

        // Technical names often need a ".status" suffix in some contexts
        if (node.data?.technicalName) {
            variableManager.set(
                `${node.data.technicalName}.status`,
                finalResult?.status || 'success',
                state.runId,
            );
        }

        emitExecutionStatus({
            stepId: node.nodeId,
            status: finalResult?.status || 'success',
            result: finalResult,
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
        let hasSoftFail = false;

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

            // AGGREGATE SOFT FAILS FROM THIS ITERATION
            for (const executedNodeId of iterationState.executedNodeIds) {
                const nodeResult = variableManager.get(`${executedNodeId}.result`, state.runId);
                if (nodeResult && nodeResult.status === 'softfailed') {
                    hasSoftFail = true;
                }
            }
        }

        return {
            success: true, // MUST remain true to trick the Engine into continuing the main flow
            message: `Loop completed after ${currentIndex} iterations`,
            data: {
                totalIterations: currentIndex,
                success: !hasSoftFail, // Expose internal failure via 'data' so conditional nodes can branch correctly!
                status: hasSoftFail ? 'softfailed' : 'success',
            },
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
