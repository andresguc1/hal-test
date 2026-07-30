import { Flow, Node, Edge, Run, StepResult } from '../database/init.js';
import { executionLogger } from './ExecutionLogger.js';
import * as actions from '../controllers/action.controller.js';
import { emitLog, emitFlowFinished, emitEdgeStatus, emitExecutionStatus } from '../socket.js';
import i18n from '../config/i18n.js';
import { variableManager } from './VariableManager.js';
import { executionManager } from './ExecutionManager.js';
import { activeRunManager } from './ActiveRunManager.js';
import { yjsServer } from './collaboration/YjsServer.js';
import chalk from 'chalk';

console.log(`[ExecutionService] 🔥 Service File Loaded at ${new Date().toISOString()}`);
import Table from 'cli-table3';
import { browserService } from './browser.service.js';
import { actionRoutes } from '../routes/api.router.js';
import * as schemas from '../schemas/index.js';
import { SecurityComplianceEngine } from './SecurityComplianceEngine.js';

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

        const whereClause = { id: flowId };
        if (projectId !== undefined && projectId !== null) {
            whereClause.projectId = projectId;
        }

        const flow = await Flow.findOne({
            where: whereClause,
            include: [
                { model: Node, as: 'nodes' },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            throw new Error(`Flow ${flowId} not found in project ${projectId}`);
        }

        // ── CRDT-AWARE NODE/EDGE LOADING ────────────────────────────────────
        // When a collaborative session is active for this flow, the Y.Doc in
        // memory is the authoritative source (real-time edits). Fall back to
        // SQLite when no session exists (solo mode or collab not yet started).
        let nodes, edges;

        const roomName = `flow-${flowId}`;
        const ydoc = yjsServer.getDocument(roomName);
        const yNodes = ydoc ? ydoc.getMap('nodes') : null;
        const yEdges = ydoc ? ydoc.getMap('edges') : null;

        if (ydoc && yNodes && yNodes.size > 0) {
            console.log(
                `[ExecutionService] 🔄 Active collaborative session detected for flow "${flowId}". Using Y.Doc as primary source.`,
            );

            // Build nodes from CRDT
            nodes = [];
            yNodes.forEach((yNode, id) => {
                const nodeJson =
                    yNode && typeof yNode.toJSON === 'function' ? yNode.toJSON() : yNode;
                const nodeIdVal = String(id);
                nodes.push({ ...nodeJson, id: nodeIdVal, nodeId: nodeIdVal });
            });

            // Build edges from CRDT
            edges = [];
            if (yEdges) {
                yEdges.forEach((yEdge, id) => {
                    const edgeJson =
                        yEdge && typeof yEdge.toJSON === 'function' ? yEdge.toJSON() : yEdge;
                    edges.push({
                        ...edgeJson,
                        id: String(id),
                        source: String(edgeJson.source),
                        target: String(edgeJson.target),
                    });
                });
            }

            // Filter orphan edges (safety net)
            const crdtNodeIds = new Set(nodes.map((n) => n.id));
            edges = edges.filter((e) => crdtNodeIds.has(e.source) && crdtNodeIds.has(e.target));

            console.log(
                `[ExecutionService] 📊 CRDT: ${nodes.length} nodes, ${edges.length} edges (SQLite had ${flow.nodes.length} nodes)`,
            );
        } else {
            // No active collaborative session — use SQLite (original behavior)
            if (ydoc && yNodes && yNodes.size === 0) {
                console.log(
                    `[ExecutionService] ⚠️ Y.Doc present but empty for flow "${flowId}". Falling back to SQLite.`,
                );
            }

            nodes = flow.nodes.map((n) => {
                const nodeObj = n.toJSON();
                const nodeIdVal = String(nodeObj.nodeId || nodeObj.id);
                return { ...nodeObj, id: nodeIdVal, nodeId: nodeIdVal };
            });
            const nodeIds = new Set(
                flow.nodes
                    .flatMap((n) => {
                        const o = n.toJSON();
                        return [o.nodeId, o.id, String(o.nodeId), String(o.id)];
                    })
                    .filter(Boolean),
            );
            edges = flow.edges
                .map((e) => {
                    const edgeObj = e.toJSON();
                    return {
                        ...edgeObj,
                        id: String(edgeObj.edgeId || edgeObj.id),
                        source: String(edgeObj.source),
                        target: String(edgeObj.target),
                    };
                })
                .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
        }
        // ────────────────────────────────────────────────────────────────────

        console.log(`[ExecutionService] 📊 Loaded ${nodes.length} nodes for execution:`);
        nodes.forEach((n) => {
            console.log(
                `   - ID: ${n.id}, Type: ${n.type}, Parent: ${n.parentId || 'NULL'}, Label: ${n.data?.label || n.data?.customLabel || 'N/A'}`,
            );
        });

        const mode = options.mode || 'e2e';

        let runId = options.runId;
        if (!runId) {
            runId = await executionLogger.startRun(flowId, {
                flowName: flow.name,
                trigger: 'api',
                batchId: options.batchId || null,
                flowSnapshot: JSON.stringify({ nodes, edges }), // Now in React Flow format
            });
        } else {
            // Update snapshot if we already have a record
            const run = await Run.findByPk(runId);
            if (run) {
                await run.update({ flow_snapshot: JSON.stringify({ nodes, edges }) });
            }
        }

        // Register run in active run manager for cancellation support
        const abortSignal = activeRunManager.register(runId);

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

            await executionLogger.endRun(runId, 'failed').catch(() => {});

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
        nodes.forEach((n) => {
            if (n.nodeId) incomingEdgesCount.set(String(n.nodeId), 0);
            if (n.id) incomingEdgesCount.set(String(n.id), 0);
        });
        edges.forEach((e) => {
            const targetStr = String(e.target);
            const count = incomingEdgesCount.get(targetStr) || 0;
            incomingEdgesCount.set(targetStr, count + 1);
        });

        let currentNodes = nodes.filter(
            (n) =>
                (incomingEdgesCount.get(String(n.nodeId)) || 0) === 0 &&
                (incomingEdgesCount.get(String(n.id)) || 0) === 0 &&
                !n.data?.disabled,
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
            signal: abortSignal,
            nodeMetrics: [],
            options: options,
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

            // Close browser BEFORE ending the run to allow video files to flush to disk
            if (runState.browserId) {
                console.log(
                    `[ExecutionService] Closing browser session ${runState.browserId} before endRun to finalize video`,
                );
                await browserService.delete(runState.browserId).catch((e) => {
                    console.error(
                        `[ExecutionService] Error closing browser before endRun: ${e.message}`,
                    );
                });
                runState.browserId = null;
            }

            await executionLogger.endRun(runId, 'completed');
            variableManager.clear(runId); // Free isolated variables
            emitLog({ message: `Flow execution finished successfully`, type: 'success' });

            // Signal global completion
            emitFlowFinished({ runId, status: 'completed', flowId });

            // 4. Print CLI Summary
            await this.printExecutionSummary(runId, flow.name);
        } catch (error) {
            console.error(`❌ [ExecutionService] Flow ${flowId} failed:`, error.message);

            // Close browser BEFORE ending the run to allow video files to flush to disk on failure too
            if (runState.browserId) {
                console.log(
                    `[ExecutionService] Closing browser session ${runState.browserId} before endRun (on failure) to finalize video`,
                );
                await browserService.delete(runState.browserId).catch((e) => {
                    console.error(
                        `[ExecutionService] Error closing browser before endRun (failure path): ${e.message}`,
                    );
                });
                runState.browserId = null;
            }

            await executionLogger.endRun(runId, 'failed').catch(() => {});
            variableManager.clear(runId); // Free isolated variables on failure too
            emitLog({ message: `Flow execution failed: ${error.message}`, type: 'error' });

            // Signal failure
            emitFlowFinished({ runId, status: 'failed', flowId, error: error.message });
            throw error;
        } finally {
            activeRunManager.cleanup(runId);
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
        if (options.variables && options.variables.__perfMode) {
            return { runId, nodeMetrics: runState.nodeMetrics };
        }
        return runId;
    }

    async validateGraph(nodes, edges, divePath = []) {
        for (const node of nodes) {
            if (node.data?.disabled) continue;

            const type = node.type || node.data?.type;

            // Skip non-action nodes (guide, note, collaborative annotation types, etc.)
            const ignoredTypes = [
                'guide',
                'note',
                'comment',
                'annotation',
                'label',
                'sticky',
                'input',
                'output',
                // Collaborative toolbox nodes (non-executable)
                'sticky_note',
                'discussion',
            ];
            if (ignoredTypes.includes(type)) continue;

            // Find matching route for schema validation
            const route = actionRoutes.find((r) => r.path === type);

            if (route && route.schema && schemas[route.schema]) {
                const schema = schemas[route.schema];
                const config = node.data?.configuration || {};

                let error = null;
                if (typeof schema.validate === 'function') {
                    // Joi validation
                    const result = schema.validate(config, {
                        abortEarly: true,
                        stripUnknown: true,
                    });
                    error = result.error;
                    if (!error && result.value) {
                        if (!node.data) node.data = {};
                        node.data.configuration = result.value;
                    }
                } else if (typeof schema.safeParse === 'function') {
                    // Zod validation
                    const result = schema.safeParse(config);
                    if (!result.success) {
                        error = {
                            details: result.error.errors.map((err) => ({
                                message: `${err.path.join('.') || 'configuration'}: ${err.message}`,
                            })),
                        };
                    } else {
                        if (!node.data) node.data = {};
                        node.data.configuration = result.data;
                    }
                }

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
            if ((type === 'component' || type === 'loop' || type === 'for_each') && flowId) {
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
            if (n) {
                if (n.nodeId) state.activatedNodeIds.add(n.nodeId);
                if (n.id) state.activatedNodeIds.add(n.id);
            }
        });

        // Filter nodes to only process those at the same level (same parentId)
        const peerNodes = skipParentFilter
            ? currentNodes
            : currentNodes.filter((n) => (n.parentId || null) === (parentId || null));

        for (const node of peerNodes) {
            // Check if cancelled
            if (state.signal?.aborted) {
                console.log(
                    `[ExecutionService] 🛑 Execution aborted via AbortSignal for run ${state.runId}`,
                );
                throw new Error('Cancelled');
            }

            // Check if node is explicitly disabled or already executed
            if (node.data?.disabled) continue;
            if (
                state.executedNodeIds &&
                (state.executedNodeIds.has(node.nodeId) || state.executedNodeIds.has(node.id))
            ) {
                continue;
            }

            // 1. Activation Check (Execution Token)
            // Only execute if node was explicitly activated by an incoming successful signal
            if (
                state.activatedNodeIds &&
                !state.activatedNodeIds.has(node.nodeId) &&
                !state.activatedNodeIds.has(node.id)
            ) {
                console.log(`[DPE] Node ${node.nodeId} is in Standby (no signal received yet).`);
                continue;
            }

            // --- Live-State Interceptor ---
            const ignoredTypes = [
                'guide',
                'note',
                'comment',
                'annotation',
                'label',
                'sticky',
                'sticky_note',
                'discussion',
            ];
            if (node.type && !ignoredTypes.includes(node.type)) {
                await this.captureLiveState(node, state);
            }

            // 2. Execute Node
            const result = await this.executeNode(node, allNodes, allEdges, state);
            console.log(
                `[ExecutionService] Node ${node.nodeId} execution finished. Result success: ${!!result}`,
            );
            state.executedNodeIds.add(node.nodeId);

            // 🛡️ PASSIVE DAST INTEGRATION 🛡️
            if (
                state.options?.mode === 'security' &&
                (node.type === 'open_url' || node.type === 'launch_browser')
            ) {
                const config = node.data?.configuration || {};
                // Extract URL based on node type
                let targetUrl = config.url || node.data?.url || node.data?.targetUrl;
                if (!targetUrl && node.type === 'launch_browser')
                    targetUrl = config.baseUrl || config.url;

                if (targetUrl) {
                    // Resolve variables in URL if needed
                    targetUrl = variableManager.resolveRecursive(targetUrl, state.runId);

                    console.log(`[ExecutionService] 🛡️ Triggering Passive DAST for ${targetUrl}`);

                    // Run non-blocking promise chain
                    (async () => {
                        let cookies = [];
                        if (state.browserId) {
                            try {
                                const browserSession = browserService.get(state.browserId);
                                if (browserSession && browserSession.context) {
                                    cookies = await browserSession.context.cookies();
                                }
                            } catch (e) {
                                console.warn(
                                    `[ExecutionService] Could not extract cookies for DAST: ${e.message}`,
                                );
                            }
                        }

                        await SecurityComplianceEngine.runComplianceAudit({
                            targetUrl,
                            executionId: state.runId,
                            projectId: state.options?.projectId || 'default',
                            frameworkCode:
                                state.options?.securityConfig?.frameworkCode || 'OWASP_ASVS_L2',
                            headers: state.options?.headers || {},
                            cookies: cookies,
                        });
                    })().catch((err) => {
                        console.error(`[ExecutionService] Passive DAST Error: ${err.message}`);
                    });
                }
            }

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
            let allNextEdges = allEdges.filter(
                (e) => e.source === node.nodeId || e.source === node.id,
            );
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
                const targetNode = allNodes.find(
                    (n) => n.nodeId === edge.target || n.id === edge.target,
                );
                if (targetNode) {
                    if (targetNode.nodeId) state.activatedNodeIds.add(targetNode.nodeId);
                    if (targetNode.id) state.activatedNodeIds.add(targetNode.id);
                }
            });

            // 7. Recursive execution of next nodes
            const nextNodes = activeEdges
                .map((e) => allNodes.find((n) => n.nodeId === e.target || n.id === e.target))
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

        const targetNode = allNodes.find((n) => n.nodeId === edge.target || n.id === edge.target);
        if (!targetNode) return;

        // 3. Check if node should be skipped
        // A node is skipped if ALL its incoming edges are skipped
        const incomingEdges = allEdges.filter(
            (e) => e.target === targetNode.nodeId || e.target === targetNode.id,
        );
        const allSkipped =
            incomingEdges.length > 0 &&
            incomingEdges.every((e) => state.edgeStates[e.edgeId || e.id] === 'skipped');

        if (
            allSkipped &&
            !state.executedNodeIds.has(targetNode.nodeId) &&
            !state.executedNodeIds.has(targetNode.id)
        ) {
            console.log(`[DPE] Eliminating Dead Path: Node ${targetNode.nodeId} is now SKIPPED.`);
            emitExecutionStatus({
                stepId: targetNode.nodeId,
                status: 'skipped',
                runId: state.runId,
                batchId: state.batchId,
            });
            state.executedNodeIds.add(targetNode.nodeId);
            if (targetNode.id) state.executedNodeIds.add(targetNode.id);

            // 4. Recursively skip all outgoing edges
            const outgoingEdges = allEdges.filter(
                (e) => e.source === targetNode.nodeId || e.source === targetNode.id,
            );
            outgoingEdges.forEach((e) =>
                this.propagateSkip(e.edgeId || e.id, allNodes, allEdges, state),
            );
        }
    }

    /**
     * Executes a single node action
     */
    async executeNode(node, allNodes, allEdges, state) {
        const actionType = node.data?.type || node.type;
        const ignoredTypes = [
            'guide',
            'note',
            'comment',
            'annotation',
            'label',
            'sticky',
            'sticky_note',
            'discussion',
        ];
        if (ignoredTypes.includes(actionType)) {
            console.log(
                `[ExecutionService] Skipping execution of non-executable node: ${node.nodeId} (${actionType})`,
            );
            return { success: true };
        }

        let resultData = null;

        // 🚀 BEGIN TELEMETRY 🚀
        const isPerformanceMode = state.options?.performanceConfig !== undefined;
        let startCpu = null;
        let startMem = null;
        const nodeStartTime = process.hrtime.bigint();

        if (isPerformanceMode) {
            startCpu = process.cpuUsage();
            startMem = process.memoryUsage();
        }

        // SPECIAL CASE: Composition Containers (Loop, ForEach)
        if (actionType === 'loop') {
            resultData = await this.executeLoopContainer(node, allNodes, allEdges, state);
        } else if (actionType === 'for_each') {
            resultData = await this.executeForEachContainer(node, allNodes, allEdges, state);
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
                signal: state.signal,
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

            // 🚀 TELEMETRY — record node metric BEFORE throwing so metrics are captured even on failure
            if (isPerformanceMode) {
                const nodeEndTime = process.hrtime.bigint();
                const endCpu = process.cpuUsage(startCpu);
                const endMem = process.memoryUsage();
                const durationMs = Number(nodeEndTime - nodeStartTime) / 1e6;
                const totalCpuUs = endCpu.user + endCpu.system;
                const durationUs = durationMs * 1000;
                const cpuPercent = durationUs > 0 ? (totalCpuUs / durationUs) * 100 : 0;
                const memUsedMB = (endMem.rss - startMem.rss) / (1024 * 1024);
                const FRIENDLY_TYPES = {
                    launch_browser: 'Lanzar Navegador',
                    open_url: 'Navegar URL',
                    click: 'Hacer Clic',
                    type_text: 'Escribir Texto',
                    wait: 'Esperar',
                    close_browser: 'Cerrar Navegador',
                    screenshot: 'Captura de Pantalla',
                    select_option: 'Seleccionar Opción',
                    assert_element: 'Validar Elemento',
                    extract_data: 'Extraer Datos',
                };
                const errDefaultLabel = FRIENDLY_TYPES[actionType] || actionType;

                if (process.send) {
                    process.send({
                        type: 'node-metric',
                        payload: {
                            nodeId: node.nodeId,
                            type: actionType,
                            label: node.data?.customLabel || node.data?.label || errDefaultLabel,
                            durationMs,
                            cpuPercent,
                            memUsedMB,
                            success: false,
                            datasetId: state.currentDatasetId || null,
                            subflowId: state.callerId || null,
                        },
                    });
                }
            }

            // 🛡️ SOFT FAIL PROTECTION: Check if node should continue even on failure
            const continueOnFailure =
                node.data?.configuration?.continueOnFailure ||
                node.data?.continueOnFailure ||
                isPerformanceMode ||
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

        // 🚀 END TELEMETRY — success path
        if (isPerformanceMode) {
            const nodeEndTime = process.hrtime.bigint();
            const endCpu = process.cpuUsage(startCpu);
            const endMem = process.memoryUsage();

            const durationMs = Number(nodeEndTime - nodeStartTime) / 1e6;

            const totalCpuUs = endCpu.user + endCpu.system;
            const durationUs = durationMs * 1000;
            const cpuPercent = durationUs > 0 ? (totalCpuUs / durationUs) * 100 : 0;

            const memUsedMB = (endMem.rss - startMem.rss) / (1024 * 1024);

            const FRIENDLY_TYPES = {
                launch_browser: 'Lanzar Navegador',
                open_url: 'Navegar URL',
                click: 'Hacer Clic',
                type_text: 'Escribir Texto',
                wait: 'Esperar',
                close_browser: 'Cerrar Navegador',
                screenshot: 'Captura de Pantalla',
                select_option: 'Seleccionar Opción',
                assert_element: 'Validar Elemento',
                extract_data: 'Extraer Datos',
            };
            const defaultLabel = FRIENDLY_TYPES[actionType] || actionType;

            // Emit via IPC if we are in a worker process
            if (process.send) {
                process.send({
                    type: 'node-metric',
                    payload: {
                        nodeId: node.nodeId,
                        type: actionType,
                        label: node.data?.customLabel || node.data?.label || defaultLabel,
                        durationMs,
                        cpuPercent,
                        memUsedMB,
                        success: resultData ? resultData.success !== false : true,
                        datasetId: state.currentDatasetId || null,
                        subflowId: state.callerId || null,
                    },
                });
            }
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
            runId: state.runId,
            batchId: state.batchId,
        });

        if (state.nodeMetrics) {
            const FRIENDLY_TYPES = {
                launch_browser: 'Lanzar Navegador',
                open_url: 'Navegar URL',
                click: 'Hacer Clic',
                type_text: 'Escribir Texto',
                wait: 'Esperar',
                close_browser: 'Cerrar Navegador',
                screenshot: 'Captura de Pantalla',
                select_option: 'Seleccionar Opción',
                assert_element: 'Validar Elemento',
                extract_data: 'Extraer Datos',
            };
            const rawType = node.type || node.data?.type;
            const fallbackLabel = FRIENDLY_TYPES[rawType] || rawType || node.nodeId;
            const nodeLabel = finalResult?.label || node.data?.label || fallbackLabel;

            const metricObj = {
                nodeId: node.nodeId || node.id,
                durationMs: Number(process.hrtime.bigint() - nodeStartTime) / 1e6,
                label: nodeLabel,
                success: finalResult?.status !== 'failed' && finalResult?.status !== 'error',
            };
            state.nodeMetrics.push(metricObj);

            if (state.options?.onNodeComplete) {
                state.options.onNodeComplete(metricObj);
            }
        }

        return resultData;
    }

    /**
     * Orchestrates the execution of a Loop acting as an encapsulated sub-flow (Dive-in)
     */
    async executeLoopContainer(node, allNodes, allEdges, state) {
        const config = node.data?.configuration || {};
        if (
            config.loopType === 'for_each' ||
            config.mode === 'forEach' ||
            config.mode === 'array'
        ) {
            return await this.executeForEachContainer(node, allNodes, allEdges, state);
        }
        const {
            loopType,
            mode,
            iterations,
            condition,
            maxIterations = 1000,
            executionMode = 'sequential',
            concurrencyLimit = 5,
            breakOnError = true,
            collectResults = true,
            executionTimeout = 0,
            flowId,
            // legacy fallbacks
            array: arrayInput,
            itemVar = 'item',
            indexVar = 'i',
        } = config;

        let normalizedLoopType = loopType;
        if (!normalizedLoopType) {
            const legacyMode = mode || node.type;
            if (legacyMode === 'while') {
                normalizedLoopType = 'while';
            } else {
                normalizedLoopType = 'for';
            }
        }

        console.log(
            `[Loop] Starting redesigned composition execution for node ${node.nodeId} (Type: ${normalizedLoopType}, Scheduling: ${executionMode}, FlowId: ${flowId})`,
        );
        const nodeLabel = node.data?.customLabel || node.data?.label || 'Loop';
        emitLog({
            message: `Executing loop composition: "${nodeLabel}"...`,
            nodeId: node.nodeId,
            type: 'info',
        });

        let subNodes = [];
        let subEdges = [];

        // 1. Identify children (Support both models for backward compatibility during transition)
        if (flowId) {
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
            subNodes = allNodes.filter((n) => n.parentId === node.nodeId);
            subEdges = allEdges;
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

        // 2. Resolve total iterations for count-based loops
        let resolvedTotal = null;
        let isLegacyArray = false;
        let listData = [];

        if (normalizedLoopType === 'for') {
            if (mode === 'array' || mode === 'each' || mode === 'forEach') {
                isLegacyArray = true;
                if (typeof arrayInput === 'string') {
                    listData =
                        variableManager.get(arrayInput, state.runId) ||
                        variableManager.resolveValue(arrayInput, state.runId);
                } else if (Array.isArray(arrayInput)) {
                    listData = arrayInput;
                }
                if (!Array.isArray(listData)) listData = [];
                resolvedTotal = listData.length;
            } else {
                resolvedTotal = Number(variableManager.resolveValue(iterations, state.runId));
                if (isNaN(resolvedTotal)) resolvedTotal = 0;
            }
        }

        const results = [];
        let finalSuccess = true;
        let currentIndex = 0;
        let finished = false;

        // 3. Isolated Iteration Scope Runner Helper
        const runIteration = async (index) => {
            const iterationRunId = `${state.runId}_loop_${node.nodeId}_${index}`;

            // Initialize isolated child run scope from a shallow copy of parent variables
            const parentVars = variableManager.getAll(state.runId) || {};
            variableManager.initRun(iterationRunId, { ...parentVars });

            // Seed isolated loop context variables
            variableManager.set('loop.index', index, iterationRunId);
            variableManager.set('loop.iteration', index + 1, iterationRunId);
            variableManager.set('loop.isFirst', index === 0, iterationRunId);
            variableManager.set(
                'loop.isLast',
                resolvedTotal !== null ? index === resolvedTotal - 1 : false,
                iterationRunId,
            );
            variableManager.set('loop.total', resolvedTotal, iterationRunId);

            const currentItem = isLegacyArray ? listData[index] : null;
            if (isLegacyArray) {
                variableManager.set('loop.currentItem', currentItem, iterationRunId);
                variableManager.set(itemVar, currentItem, iterationRunId);
                variableManager.set(itemVar, currentItem, state.runId);
            }
            variableManager.set(indexVar, index, iterationRunId);
            variableManager.set(indexVar, index, state.runId);

            const iterLog = `[Loop Container] Starting iteration ${index + 1}${
                resolvedTotal !== null ? ` of ${resolvedTotal}` : ''
            }`;
            emitLog({ message: iterLog, nodeId: node.nodeId, type: 'info' });
            console.log(`[Loop] ${iterLog} (Isolated RunId: ${iterationRunId})`);

            // Setup isolated sequence state for this iteration
            const iterationState = {
                ...state,
                runId: iterationRunId,
                executedNodeIds: new Set(),
                activatedNodeIds: new Set(loopStartNodes.map((sn) => sn.nodeId)),
                edgeStates: {},
            };

            const sequenceParentId = flowId ? null : node.nodeId;
            const seqResult = await this.runSequence(
                loopStartNodes,
                subNodes,
                subEdges,
                iterationState,
                sequenceParentId,
                {
                    skipParentFilter: !!flowId,
                },
            );

            // Extract results:
            // Find explicit output nodes inside the subflow graph
            const outputs = {};
            const outputNodes = subNodes.filter((sn) => sn.type === 'output');
            outputNodes.forEach((outNode) => {
                const outLabel = outNode.data?.customLabel || outNode.data?.label || outNode.nodeId;
                const outVal =
                    variableManager.get(`${outNode.nodeId}.result`, iterationRunId) ||
                    variableManager.get(`${outLabel}.result`, iterationRunId);
                outputs[outLabel] =
                    outVal !== undefined && outVal !== null && outVal.data !== undefined
                        ? outVal.data
                        : outVal;
            });

            // Scan executed nodes inside the child iterationState to track hard and soft fails
            let hasHardFail = false;
            let hasSoftFail = false;
            for (const executedNodeId of iterationState.executedNodeIds) {
                const nodeResult = variableManager.get(`${executedNodeId}.result`, iterationRunId);
                if (nodeResult) {
                    if (nodeResult.success === false || nodeResult.status === 'failed') {
                        hasHardFail = true;
                    }
                    if (nodeResult.status === 'softfailed') {
                        hasSoftFail = true;
                    }
                }
            }

            // Retrieve final iteration variables
            const iterationVars = variableManager.getAll(iterationRunId) || {};

            return {
                success: !hasHardFail,
                hasSoftFail,
                signal: seqResult,
                outputs,
                variables: iterationVars,
                iterationRunId,
            };
        };

        // Safety Timeout Wrap
        let timeoutHandle = null;
        let timeoutPromise = null;

        if (executionTimeout > 0) {
            timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(
                        new Error(
                            `[Loop] Loop execution exceeded timeout of ${executionTimeout}ms`,
                        ),
                    );
                }, executionTimeout);
            });
        }

        const runScheduler = async () => {
            if (executionMode === 'sequential') {
                while (!finished && currentIndex < maxIterations) {
                    let shouldContinue = false;
                    if (normalizedLoopType === 'for') {
                        shouldContinue = currentIndex < resolvedTotal;
                    } else if (normalizedLoopType === 'while') {
                        try {
                            shouldContinue =
                                variableManager.evaluate(condition, state.runId) === true;
                        } catch (e) {
                            shouldContinue = false;
                        }
                    }

                    if (!shouldContinue) {
                        finished = true;
                        break;
                    }

                    const iterationOutput = await runIteration(currentIndex);

                    // Propagate modified child variables back to parent scope (except loop-local ones)
                    const finalVars = iterationOutput.variables || {};
                    for (const [key, val] of Object.entries(finalVars)) {
                        if (!key.startsWith('loop.') && key !== indexVar && key !== itemVar) {
                            variableManager.set(key, val, state.runId);
                        }
                    }

                    results.push(
                        collectResults ? iterationOutput.outputs : iterationOutput.variables,
                    );

                    if (!iterationOutput.success) {
                        finalSuccess = false;
                        if (breakOnError) {
                            finished = true;
                            break;
                        }
                    }

                    // Check for flow control signals (break / continue / return)
                    const signal =
                        iterationOutput.signal || iterationOutput.variables['_signal_action'];
                    if (signal) {
                        const signalAction = typeof signal === 'string' ? signal : signal.action;
                        if (signalAction === 'break') {
                            console.log(`[Loop] Intercepted break signal. Terminating loop.`);
                            finished = true;
                            break;
                        }
                        if (signalAction === 'continue') {
                            console.log(
                                `[Loop] Intercepted continue signal. Jumping to next iteration.`,
                            );
                        }
                        if (signalAction === 'return') {
                            console.log(`[Loop] Intercepted return signal. Bubbling return up.`);
                            variableManager.set('_signal_action', 'return', state.runId);
                            finished = true;
                            // Propagate returning signal up
                            if (typeof signal === 'object') return signal;
                            return { action: 'return' };
                        }
                    }

                    currentIndex++;
                }
            } else if (executionMode === 'parallel') {
                const totalIterationsToRun = Math.min(resolvedTotal || 0, maxIterations);
                const iterationIndexes = Array.from({ length: totalIterationsToRun }, (_, i) => i);

                for (let i = 0; i < iterationIndexes.length; i += concurrencyLimit) {
                    const chunk = iterationIndexes.slice(i, i + concurrencyLimit);
                    const chunkPromises = chunk.map((index) =>
                        runIteration(index)
                            .then((res) => {
                                if (!res.success) {
                                    finalSuccess = false;
                                }
                                return res;
                            })
                            .catch((err) => {
                                finalSuccess = false;
                                if (breakOnError) throw err;
                                return { success: false, outputs: {}, variables: {} };
                            }),
                    );

                    const chunkResults = await Promise.all(chunkPromises);
                    chunkResults.forEach((res) => {
                        results.push(collectResults ? res.outputs : res.variables);

                        // Propagate modified child variables back to parent scope
                        const finalVars = res.variables || {};
                        for (const [key, val] of Object.entries(finalVars)) {
                            if (!key.startsWith('loop.') && key !== indexVar && key !== itemVar) {
                                variableManager.set(key, val, state.runId);
                            }
                        }
                    });

                    if (!finalSuccess && breakOnError) {
                        break;
                    }
                }
                currentIndex = totalIterationsToRun;
            }
        };

        let schedulerResult = null;
        try {
            if (timeoutPromise) {
                schedulerResult = await Promise.race([runScheduler(), timeoutPromise]);
            } else {
                schedulerResult = await runScheduler();
            }
        } finally {
            if (timeoutHandle) clearTimeout(timeoutHandle);
        }

        if (
            schedulerResult &&
            (schedulerResult.action === 'return' ||
                schedulerResult.action === 'break' ||
                schedulerResult.action === 'continue')
        ) {
            return schedulerResult;
        }

        const finalResultPayload = {
            success: finalSuccess,
            status: finalSuccess ? 'completed' : 'failed',
            message: `Loop completed with ${currentIndex} iterations`,
            data: {
                success: finalSuccess,
                totalIterations: currentIndex,
                results: collectResults ? results : results[results.length - 1],
            },
        };

        variableManager.set(`${node.nodeId}.result`, finalResultPayload, state.runId);
        variableManager.set(`${nodeLabel}.result`, finalResultPayload, state.runId);
        variableManager.set(node.nodeId, finalResultPayload, state.runId);
        variableManager.set(nodeLabel, finalResultPayload, state.runId);

        console.log(`[Loop] Loop node ${node.nodeId} execution completed.`);
        return finalResultPayload;
    }

    /**
     * Orchestrates the execution of a ForEach node as an encapsulated sub-flow.
     * Iterates over a resolved collection and executes internal nodes per item.
     *
     * Supports execution modes: sequential, parallel, random, single.
     * Each iteration gets an isolated variable scope.
     */
    async executeForEachContainer(node, allNodes, allEdges, state) {
        const config = node.data?.configuration || {};
        const itemAlias = config.itemAlias || config.itemVar || 'item';
        const indexAlias = config.indexAlias || config.indexVar || 'index';
        const {
            source,
            executionMode = 'sequential',
            maxConcurrency = 3,
            stopOnError = true,
            collectResults = true,
            maxItems = 1000,
            delayBetweenIterations = 0,
            executionTimeout = 0,
            randomMode = 'shuffle',
            singleIndex,
            singleMatch,
            flowId,
        } = config;

        const nodeLabel = node.data?.customLabel || node.data?.label || 'ForEach';
        console.log(
            `[ForEach] Starting execution for node ${node.nodeId} (Mode: ${executionMode}, Source: ${typeof source === 'string' ? source : 'static array'}, FlowId: ${flowId || 'inline'})`,
        );
        emitLog({
            message: `Executing ForEach: "${nodeLabel}" (${executionMode})...`,
            nodeId: node.nodeId,
            type: 'info',
        });

        // 1. Resolve the source collection
        let resolvedList = [];
        const sourceVal = source || config.array || '';
        if (typeof sourceVal === 'string' && sourceVal.trim()) {
            const resolved =
                variableManager.get(sourceVal, state.runId) ||
                variableManager.resolveValue(sourceVal, state.runId);
            if (Array.isArray(resolved)) {
                resolvedList = resolved;
            } else if (typeof resolved === 'string') {
                // Attempt JSON parse
                try {
                    const parsed = JSON.parse(resolved);
                    if (Array.isArray(parsed)) resolvedList = parsed;
                } catch {
                    console.warn(`[ForEach] Source resolved to non-array string: "${resolved}"`);
                }
            }
        } else if (Array.isArray(sourceVal)) {
            resolvedList = sourceVal;
        }

        // Safety cap
        if (resolvedList.length > maxItems) {
            console.warn(
                `[ForEach] Collection size ${resolvedList.length} exceeds maxItems ${maxItems}. Truncating.`,
            );
            resolvedList = resolvedList.slice(0, maxItems);
        }

        if (resolvedList.length === 0) {
            console.warn(`[ForEach] Node ${node.nodeId} has empty source. Skipping.`);
            emitLog({
                message: `ForEach "${nodeLabel}" skipped: empty collection.`,
                nodeId: node.nodeId,
                type: 'warning',
            });
            return {
                success: true,
                status: 'completed',
                message: 'ForEach skipped (empty collection)',
                data: { success: true, totalIterations: 0, results: [] },
            };
        }

        // 2. Identify children (sub-flow or parentId children)
        let subNodes = [];
        let subEdges = [];

        if (flowId) {
            const subFlow = await Flow.findOne({
                where: { id: flowId },
                include: [
                    { model: Node, as: 'nodes' },
                    { model: Edge, as: 'edges' },
                ],
            });
            if (!subFlow) {
                throw new Error(
                    `[ForEach] Backing flow ${flowId} not found for node ${node.nodeId}`,
                );
            }
            subNodes = subFlow.nodes.map((n) => n.toJSON());
            subEdges = subFlow.edges.map((e) => e.toJSON());
        } else {
            subNodes = allNodes.filter((n) => n.parentId === node.nodeId);
            subEdges = allEdges;
        }

        if (subNodes.length === 0) {
            console.warn(`[ForEach] Node ${node.nodeId} has no children. Skipping.`);
            emitLog({
                message: `ForEach "${nodeLabel}" skipped: no internal nodes found.`,
                nodeId: node.nodeId,
                type: 'warning',
            });
            return {
                success: true,
                status: 'completed',
                message: 'ForEach skipped (no children)',
                data: { success: true, totalIterations: 0, results: [] },
            };
        }

        // Find entry points within the ForEach sub-flow
        const childNodeIds = new Set(subNodes.map((c) => c.nodeId));
        const internalEdges = subEdges.filter(
            (e) => childNodeIds.has(e.target) && childNodeIds.has(e.source),
        );

        const incomingCount = new Map();
        subNodes.forEach((c) => incomingCount.set(c.nodeId, 0));
        internalEdges.forEach((e) => {
            incomingCount.set(e.target, incomingCount.get(e.target) + 1);
        });

        const entryNodes = subNodes.filter((c) => incomingCount.get(c.nodeId) === 0);
        const startNodes = entryNodes.length > 0 ? entryNodes : [subNodes[0]];

        // 3. Prepare the list based on execution mode
        let itemsToProcess = [...resolvedList];

        if (executionMode === 'random') {
            if (randomMode === 'single') {
                // Pick one random item
                const randomIdx = Math.floor(Math.random() * itemsToProcess.length);
                itemsToProcess = [itemsToProcess[randomIdx]];
                console.log(`[ForEach] Random single: picked index ${randomIdx}`);
            } else {
                // Shuffle (Fisher-Yates)
                for (let i = itemsToProcess.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [itemsToProcess[i], itemsToProcess[j]] = [itemsToProcess[j], itemsToProcess[i]];
                }
                console.log(`[ForEach] Random shuffle: ${itemsToProcess.length} items shuffled`);
            }
        } else if (executionMode === 'single') {
            if (singleIndex !== undefined && singleIndex !== null && singleIndex >= 0) {
                if (singleIndex < itemsToProcess.length) {
                    itemsToProcess = [itemsToProcess[singleIndex]];
                    console.log(`[ForEach] Single mode: executing index ${singleIndex}`);
                } else {
                    console.warn(
                        `[ForEach] Single index ${singleIndex} out of bounds (${itemsToProcess.length} items). Skipping.`,
                    );
                    itemsToProcess = [];
                }
            } else if (singleMatch) {
                // Match by expression
                try {
                    const matchFn = new Function('item', 'index', `return ${singleMatch}`);
                    const matchIdx = itemsToProcess.findIndex((item, idx) => matchFn(item, idx));
                    if (matchIdx >= 0) {
                        itemsToProcess = [itemsToProcess[matchIdx]];
                        console.log(`[ForEach] Single match: found at index ${matchIdx}`);
                    } else {
                        console.warn(`[ForEach] Single match: no item matched expression.`);
                        itemsToProcess = [];
                    }
                } catch (err) {
                    console.error(`[ForEach] Single match expression error: ${err.message}`);
                    itemsToProcess = [];
                }
            }
        }

        const totalItems = itemsToProcess.length;

        if (totalItems === 0) {
            return {
                success: true,
                status: 'completed',
                message: 'ForEach completed (no items to process after filtering)',
                data: { success: true, totalIterations: 0, results: [] },
            };
        }

        // 4. Iteration runner (isolated scope per item)
        const results = [];
        let finalSuccess = true;

        const runIteration = async (item, originalIndex, iterationIndex) => {
            const iterationRunId = `${state.runId}_foreach_${node.nodeId}_${iterationIndex}`;

            // Initialize isolated child run scope from parent variables
            const parentVars = variableManager.getAll(state.runId) || {};
            variableManager.initRun(iterationRunId, { ...parentVars });

            // Seed ForEach context variables
            variableManager.set('forEach.item', item, iterationRunId);
            variableManager.set('forEach.index', iterationIndex, iterationRunId);
            variableManager.set('forEach.originalIndex', originalIndex, iterationRunId);
            variableManager.set('forEach.iteration', iterationIndex + 1, iterationRunId);
            variableManager.set('forEach.isFirst', iterationIndex === 0, iterationRunId);
            variableManager.set(
                'forEach.isLast',
                iterationIndex === totalItems - 1,
                iterationRunId,
            );
            variableManager.set('forEach.total', totalItems, iterationRunId);

            // Expose via user-configured aliases
            variableManager.set(itemAlias, item, iterationRunId);
            variableManager.set(indexAlias, iterationIndex, iterationRunId);

            // Also propagate aliases to parent scope for downstream access
            variableManager.set(itemAlias, item, state.runId);
            variableManager.set(indexAlias, iterationIndex, state.runId);

            const iterLog = `[ForEach] Iteration ${iterationIndex + 1} of ${totalItems} — item: ${typeof item === 'object' ? JSON.stringify(item).substring(0, 50) : String(item).substring(0, 50)}`;
            emitLog({ message: iterLog, nodeId: node.nodeId, type: 'info' });
            console.log(`[ForEach] ${iterLog} (Isolated RunId: ${iterationRunId})`);

            // Setup isolated sequence state
            const iterationState = {
                ...state,
                runId: iterationRunId,
                executedNodeIds: new Set(),
                activatedNodeIds: new Set(startNodes.map((sn) => sn.nodeId)),
                edgeStates: {},
            };

            const sequenceParentId = flowId ? null : node.nodeId;
            const seqResult = await this.runSequence(
                startNodes,
                subNodes,
                subEdges,
                iterationState,
                sequenceParentId,
                {
                    skipParentFilter: !!flowId,
                },
            );

            // Extract output node results
            const outputs = {};
            const outputNodes = subNodes.filter((sn) => sn.type === 'output');
            outputNodes.forEach((outNode) => {
                const outLabel = outNode.data?.customLabel || outNode.data?.label || outNode.nodeId;
                const outVal =
                    variableManager.get(`${outNode.nodeId}.result`, iterationRunId) ||
                    variableManager.get(`${outLabel}.result`, iterationRunId);
                outputs[outLabel] =
                    outVal !== undefined && outVal !== null && outVal.data !== undefined
                        ? outVal.data
                        : outVal;
            });

            // Scan for failures
            let hasHardFail = false;
            let hasSoftFail = false;
            for (const executedNodeId of iterationState.executedNodeIds) {
                const nodeResult = variableManager.get(`${executedNodeId}.result`, iterationRunId);
                if (nodeResult) {
                    if (nodeResult.success === false || nodeResult.status === 'failed') {
                        hasHardFail = true;
                    }
                    if (nodeResult.status === 'softfailed') {
                        hasSoftFail = true;
                    }
                }
            }

            // Retrieve final iteration variables
            const iterationVars = variableManager.getAll(iterationRunId) || {};

            return {
                success: !hasHardFail,
                hasSoftFail,
                signal: seqResult,
                outputs,
                variables: iterationVars,
                iterationRunId,
                item,
                originalIndex,
            };
        };

        // 5. Timeout wrapper
        let timeoutHandle = null;
        let timeoutPromise = null;

        if (executionTimeout > 0) {
            timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(
                        new Error(`[ForEach] Execution exceeded timeout of ${executionTimeout}ms`),
                    );
                }, executionTimeout);
            });
        }

        // 6. Scheduler (mode-dependent)
        const runScheduler = async () => {
            if (
                executionMode === 'sequential' ||
                executionMode === 'random' ||
                executionMode === 'single'
            ) {
                // All three use sequential iteration (random/single just pre-filtered the list)
                for (let i = 0; i < itemsToProcess.length; i++) {
                    // Check cancellation
                    if (state.signal?.aborted) {
                        console.log(`[ForEach] Execution cancelled via AbortSignal.`);
                        break;
                    }

                    const item = itemsToProcess[i];
                    const originalIndex = resolvedList.indexOf(item);
                    const iterationOutput = await runIteration(
                        item,
                        originalIndex >= 0 ? originalIndex : i,
                        i,
                    );

                    // Propagate modified child variables back to parent scope
                    const finalVars = iterationOutput.variables || {};
                    for (const [key, val] of Object.entries(finalVars)) {
                        if (
                            !key.startsWith('forEach.') &&
                            key !== itemAlias &&
                            key !== indexAlias
                        ) {
                            variableManager.set(key, val, state.runId);
                        }
                    }

                    results.push(
                        collectResults ? iterationOutput.outputs : iterationOutput.variables,
                    );

                    if (!iterationOutput.success) {
                        finalSuccess = false;
                        if (stopOnError) {
                            console.log(`[ForEach] Stopping on error at iteration ${i + 1}.`);
                            break;
                        }
                    }

                    // Check for flow control signals
                    const signal =
                        iterationOutput.signal || iterationOutput.variables['_signal_action'];
                    if (signal) {
                        const signalAction = typeof signal === 'string' ? signal : signal.action;
                        if (signalAction === 'break') {
                            console.log(`[ForEach] Intercepted break signal. Terminating.`);
                            break;
                        }
                        if (signalAction === 'continue') {
                            console.log(`[ForEach] Intercepted continue signal. Next item.`);
                        }
                        if (signalAction === 'return') {
                            console.log(`[ForEach] Intercepted return signal. Bubbling up.`);
                            variableManager.set('_signal_action', 'return', state.runId);
                            if (typeof signal === 'object') return signal;
                            return { action: 'return' };
                        }
                    }

                    // Optional delay between iterations (rate-limiting, anti-detection)
                    if (delayBetweenIterations > 0 && i < itemsToProcess.length - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayBetweenIterations));
                    }
                }
            } else if (executionMode === 'parallel') {
                // Chunked parallel execution with concurrency control
                for (let i = 0; i < itemsToProcess.length; i += maxConcurrency) {
                    if (state.signal?.aborted) {
                        console.log(`[ForEach] Parallel execution cancelled via AbortSignal.`);
                        break;
                    }

                    const chunk = itemsToProcess.slice(i, i + maxConcurrency);
                    const chunkPromises = chunk.map((item, chunkIdx) => {
                        const globalIdx = i + chunkIdx;
                        const originalIndex = resolvedList.indexOf(item);
                        return runIteration(
                            item,
                            originalIndex >= 0 ? originalIndex : globalIdx,
                            globalIdx,
                        )
                            .then((res) => {
                                if (!res.success) {
                                    finalSuccess = false;
                                }
                                return res;
                            })
                            .catch((err) => {
                                finalSuccess = false;
                                if (stopOnError) throw err;
                                return {
                                    success: false,
                                    outputs: {},
                                    variables: {},
                                    item,
                                    originalIndex: globalIdx,
                                };
                            });
                    });

                    const chunkResults = await Promise.all(chunkPromises);
                    chunkResults.forEach((res) => {
                        results.push(collectResults ? res.outputs : res.variables);

                        // Propagate modified child variables back to parent scope
                        const finalVars = res.variables || {};
                        for (const [key, val] of Object.entries(finalVars)) {
                            if (
                                !key.startsWith('forEach.') &&
                                key !== itemAlias &&
                                key !== indexAlias
                            ) {
                                variableManager.set(key, val, state.runId);
                            }
                        }
                    });

                    if (!finalSuccess && stopOnError) {
                        break;
                    }
                }
            }
        };

        let schedulerResult = null;
        try {
            if (timeoutPromise) {
                schedulerResult = await Promise.race([runScheduler(), timeoutPromise]);
            } else {
                schedulerResult = await runScheduler();
            }
        } finally {
            if (timeoutHandle) clearTimeout(timeoutHandle);
        }

        // Handle flow control signals
        if (
            schedulerResult &&
            (schedulerResult.action === 'return' ||
                schedulerResult.action === 'break' ||
                schedulerResult.action === 'continue')
        ) {
            return schedulerResult;
        }

        // 7. Build final result
        const processedCount = results.length;
        const finalResultPayload = {
            success: finalSuccess,
            status: finalSuccess ? 'completed' : 'failed',
            message: `ForEach completed: ${processedCount} of ${totalItems} items processed (${executionMode})`,
            data: {
                success: finalSuccess,
                totalIterations: processedCount,
                totalItems,
                executionMode,
                results: collectResults ? results : results[results.length - 1],
            },
        };

        variableManager.set(`${node.nodeId}.result`, finalResultPayload, state.runId);
        variableManager.set(`${nodeLabel}.result`, finalResultPayload, state.runId);
        variableManager.set(node.nodeId, finalResultPayload, state.runId);
        variableManager.set(nodeLabel, finalResultPayload, state.runId);

        console.log(`[ForEach] Node ${node.nodeId} execution completed (${processedCount} items).`);
        return finalResultPayload;
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

    async captureLiveState(node, state) {
        // 1. Capture active runtime variables
        const runtimeVariables = variableManager.getAll(state.runId);

        // 2. Capture current URL state
        let currentUrl = null;
        try {
            if (state.browserId) {
                const browserEntry = browserService.get(state.browserId);
                const browserInstance = browserEntry?.browser || browserEntry;
                if (browserInstance && typeof browserInstance.contexts === 'function') {
                    const contexts = browserInstance.contexts();
                    if (contexts.length > 0) {
                        const pages = contexts[0].pages();
                        if (pages.length > 0) {
                            const activePage = pages[pages.length - 1];
                            if (activePage && !activePage.isClosed()) {
                                currentUrl = activePage.url();
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(`[Live-State] Failed to capture URL for node ${node.nodeId}:`, e.message);
        }

        // 3. Capture recent screenshots/captures from database
        let recentScreenshots = [];
        try {
            if (StepResult && typeof StepResult.findAll === 'function') {
                const steps = await StepResult.findAll({
                    where: state.runId ? { run_id: state.runId } : { run_id: null },
                    attributes: ['node_id', 'screenshot_path', 'status', 'created_at'],
                    order: [['created_at', 'DESC']],
                    limit: 5, // get the last 5 captures
                });
                recentScreenshots = steps
                    .filter((s) => s.screenshot_path)
                    .map((s) => ({
                        nodeId: s.node_id,
                        screenshotPath: s.screenshot_path,
                        status: s.status,
                        createdAt: s.created_at,
                    }));
            }
        } catch (e) {
            console.warn(
                `[Live-State] Failed to query recent screenshots for node ${node.nodeId}:`,
                e.message,
            );
        }

        // 4. Encapsulate into a live-state package
        const liveStatePackage = {
            nodeId: node.nodeId,
            nodeType: node.type,
            variables: runtimeVariables,
            url: currentUrl,
            recentScreenshots,
            timestamp: new Date().toISOString(),
        };

        console.log(
            `[DPE] Live-State Package captured for node ${node.nodeId}: URL="${currentUrl}", VariablesCount=${Object.keys(runtimeVariables).length}, ScreenshotsCount=${recentScreenshots.length}`,
        );

        // Store in variableManager so it can be interpolated/referenced in action config templates
        variableManager.set('liveState', liveStatePackage, state.runId);
        variableManager.set('live_state', liveStatePackage, state.runId);

        // Store in execution state
        state.liveState = liveStatePackage;

        return liveStatePackage;
    }
}

export const executionService = new ExecutionService();
