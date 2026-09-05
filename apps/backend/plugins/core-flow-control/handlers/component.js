import { Flow, Node, Edge } from '../../../database/init.js';
import { emitLog, emitExecutionStatus } from '../../../socket.js';
import { variableManager } from '../../../services/VariableManager.js';
import { activeRunManager } from '../../../services/ActiveRunManager.js';
import { browserService } from '../../../services/browser.service.js';

const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

const componentAction = async (req, res) => {
    let subflowState = null;
    const incomingBrowserId = req.body.browserId;
    try {
        const { configuration, nodeId, label, runId } = req.body;
        const nodeLabel = label || configuration?.label || nodeId || 'Component';
        const flowId = configuration?.flowId || req.body.flowId;

        // --- Resolve sub-flow nodes and edges ---
        let allNodes = [];
        let allEdges = [];
        let loadedFromDb = false;

        if (flowId) {
            const subflow = await Flow.findByPk(flowId, {
                include: [
                    { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                    { model: Edge, as: 'edges' },
                ],
            });

            if (!subflow) {
                throw new Error(`Subflow not found: ${flowId}`);
            }

            loadedFromDb = true;
            console.log(`[Component] Subflow "${subflow.name}" has ${subflow.nodes.length} nodes.`);
            allNodes = subflow.nodes.map((n) => {
                console.log(
                    `   - Node: "${n.data?.label || n.nodeId}" (Type: ${n.type}, Parent: ${n.parentId || 'NONE'})`,
                );
                return {
                    nodeId: n.nodeId,
                    type: n.type,
                    data: n.data,
                    parentId: n.parentId,
                };
            });
            allEdges = subflow.edges.map((e) => ({
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
            }));
        }

        // Fallback: try inline subNodes from node.data when no flowId or DB load failed
        if (!loadedFromDb) {
            const inlineSubNodes = req.body.subNodes || req.body.data?.subNodes || [];
            const inlineSubEdges = req.body.subEdges || req.body.data?.subEdges || [];

            if (inlineSubNodes.length > 0) {
                console.log(
                    `[Component] No flowId or DB subflow — using ${inlineSubNodes.length} inline subNode(s).`,
                );
                allNodes = inlineSubNodes.map((n) => ({
                    nodeId: n.nodeId || n.id,
                    type: n.type,
                    data: n.data,
                    parentId: n.parentId,
                }));
                allEdges = inlineSubEdges.map((e) => ({
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                }));
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Missing flowId and no inline subNodes for component execution',
                });
            }
        }

        emitLog({
            message: `Entering subflow: ${flowId || '(inline component)'}`,
            type: 'info',
            nodeId,
        });

        const { ExecutionService } = await import('../../../services/ExecutionService.js');
        const executionService = new ExecutionService();

        // --- Resolve parent-scope inputs BEFORE creating the child scope ---
        // Configuration params (except reserved keys) are resolved from the parent scope
        if (configuration && typeof configuration === 'object') {
            Object.entries(configuration).forEach(([key, val]) => {
                if (
                    ![
                        'flowId',
                        'label',
                        'inputMapping',
                        'outputMapping',
                        'subNodes',
                        'subEdges',
                    ].includes(key)
                ) {
                    const resolvedVal =
                        typeof val === 'string' ? variableManager.resolve(val, runId) : val;
                    variableManager.set(key, resolvedVal, runId);
                }
            });
        }

        // Explicit input mappings: parentVar -> childVar
        const inputMapping = configuration?.inputMapping || [];
        if (Array.isArray(inputMapping)) {
            for (const mapping of inputMapping) {
                if (mapping.parentVar && mapping.childVar) {
                    const val = variableManager.resolveValue(mapping.parentVar, runId);
                    variableManager.set(mapping.childVar, val, runId);
                }
            }
        }

        // --- Create an isolated child scope so sub-nodes don't pollute parent vars ---
        const childRunId = `${runId || `subrun_${Date.now()}`}_child_${nodeId}`;
        variableManager.initRun(childRunId, {});

        // Copy all current parent variables into the child scope for reading
        const parentVars = variableManager.getAll(runId) || {};
        for (const [key, val] of Object.entries(parentVars)) {
            variableManager.set(key, val, childRunId);
        }

        // Also copy any variables set by inputMapping/config above into child scope
        // (they were set on runId, now ensure child has them too)
        if (configuration && typeof configuration === 'object') {
            Object.entries(configuration).forEach(([key, val]) => {
                if (
                    ![
                        'flowId',
                        'label',
                        'inputMapping',
                        'outputMapping',
                        'subNodes',
                        'subEdges',
                    ].includes(key)
                ) {
                    const resolvedVal =
                        typeof val === 'string' ? variableManager.resolve(val, runId) : val;
                    variableManager.set(key, resolvedVal, childRunId);
                }
            });
        }
        if (Array.isArray(inputMapping)) {
            for (const mapping of inputMapping) {
                if (mapping.parentVar && mapping.childVar) {
                    const val = variableManager.resolveValue(mapping.parentVar, runId);
                    variableManager.set(mapping.childVar, val, childRunId);
                }
            }
        }

        const initialResult = {
            success: true,
            status: 'running',
            message: `Subflow "${nodeLabel}" is currently executing...`,
            data: { status: true, success: true, label: nodeLabel },
        };
        variableManager.set(`${nodeId}.result`, initialResult, childRunId);
        variableManager.set(`${nodeLabel}.result`, initialResult, childRunId);
        variableManager.set(nodeId, initialResult, childRunId);
        variableManager.set(nodeLabel, initialResult, childRunId);
        console.log(`[Component] Pre-initialized variables for: "${nodeLabel}" (ID: ${nodeId})`);

        // --- Execute sub-graph in the isolated child scope ---
        let entryNodes = allNodes.filter((n) => n.type === 'entry' || n.type === 'input');
        if (entryNodes.length === 0) {
            const incomingTargets = new Set(allEdges.map((e) => e.target));
            entryNodes = allNodes.filter(
                (n) => !incomingTargets.has(n.nodeId) && !incomingTargets.has(n.id),
            );
            if (entryNodes.length === 0 && allNodes.length > 0) {
                entryNodes = [allNodes[0]];
            }
        }

        subflowState = {
            runId: childRunId,
            browserId: req.body.browserId,
            // CRITICAL: carry the cancellation signal into the sub-flow scope so
            // runSequence can stop as soon as the run is cancelled. Without it,
            // stopping a run that contains a composite node keeps executing every
            // child node (and re-launching browsers) until the whole block finishes.
            signal: req.signal || activeRunManager.getSignal(runId || req.body.runId) || null,
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(entryNodes.flatMap((n) => [n.nodeId, n.id]).filter(Boolean)),
            edgeStates: {},
            variables: {},
            overrides: req.body.overrides || {},
            options: { ...(req.body.options || {}) },
            headers: req.headers || {},
            startTime: Date.now(),
            callerId: nodeId,
            callerLabel: nodeLabel,
        };

        const subflowResult = await executionService.runSequence(
            entryNodes,
            allNodes,
            allEdges,
            subflowState,
            null,
            { sortTopological: true },
        );

        // --- Propagate outputs from child scope back to parent scope ---
        // 1. Apply explicit output mappings (childVar -> parentVar)
        const outputMapping = configuration?.outputMapping || [];
        if (Array.isArray(outputMapping)) {
            for (const mapping of outputMapping) {
                if (mapping.childVar && mapping.parentVar) {
                    const val = variableManager.get(mapping.childVar, childRunId);
                    variableManager.set(mapping.parentVar, val, runId);
                }
            }
        }

        // 2. Collect output node results
        const subflowOutputs = {};
        const outputNodes = allNodes.filter((n) => n.type === 'output');

        outputNodes.forEach((outNode) => {
            const outLabel = outNode.data?.customLabel || outNode.data?.label || outNode.nodeId;
            const outVal =
                variableManager.get(`${outNode.nodeId}.result`, childRunId) ||
                variableManager.get(`${outLabel}.result`, childRunId);

            if (outVal !== undefined && outVal !== null) {
                subflowOutputs[outLabel] = outVal.data !== undefined ? outVal.data : outVal;
            } else {
                console.warn(`[Component] Output node "${outLabel}" produced no data.`);
            }
        });

        const missingMappings = outputMapping.filter(
            (m) => variableManager.get(m.childVar, childRunId) === undefined,
        );
        if (missingMappings.length > 0) {
            smartEmitLog(
                `[Warning] Some output mappings are missing data: ${missingMappings.map((m) => m.childVar).join(', ')}`,
                'warning',
                nodeId,
            );
        }

        // --- Build and store the final result in the PARENT scope ---
        const finalStatus = subflowResult?.success !== false ? 'success' : 'failed';
        const structuredResult = {
            success: finalStatus === 'success',
            status: finalStatus,
            message: subflowResult?.message || `Subflow "${nodeLabel}" completed.`,
            data: {
                ...subflowOutputs,
                status: finalStatus,
                success: finalStatus === 'success',
                label: nodeLabel,
            },
            flowId,
            executedNodes: subflowState.executedNodeIds.size,
        };

        variableManager.set(`${nodeId}.result`, structuredResult, runId);
        variableManager.set(`${nodeLabel}.result`, structuredResult, runId);
        variableManager.set(nodeId, structuredResult, runId);
        variableManager.set(nodeLabel, structuredResult, runId);

        const outputList = Object.keys(subflowOutputs);
        const outputSummary =
            outputList.length > 0
                ? `Validated Outputs: [${outputList.join(', ')}]`
                : 'No outputs produced';
        smartEmitLog(`Subflow "${nodeLabel}" finished. ${outputSummary}`, 'success', nodeId);

        const safeLabel = nodeLabel.replace(/[^a-zA-Z0-9]/g, '');
        if (safeLabel && safeLabel !== nodeLabel) {
            variableManager.set(`${safeLabel}.result`, structuredResult, runId);
        }

        if (nodeId) emitExecutionStatus({ stepId: nodeId, status: 'success' });

        if (!runId || runId.startsWith('interactive-')) {
            variableManager.set(`${nodeId}.result`, structuredResult, null);
            variableManager.set(`${nodeLabel}.result`, structuredResult, null);
        }

        console.log(
            `[ComponentAction] Result stored for "${nodeLabel}" (Run: ${runId || 'legacy'}):`,
            JSON.stringify(structuredResult).substring(0, 200),
        );

        emitLog({
            message: `Completed subflow: ${flowId || '(inline)'} (${subflowState.executedNodeIds.size} nodes executed)`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            status: 'success',
            message: `Subflow ${flowId || '(inline)'} executed successfully`,
            // Propagate the sub-flow's live browser (launched/changed inside the
            // composite) back to the caller so the parent does NOT keep using a
            // stale id that later fails with "Target page... has been closed".
            browserId: subflowState?.browserId || incomingBrowserId,
            data: structuredResult,
        });
    } catch (error) {
        console.error('[ERROR] componentAction:', error.message);

        // Cleanup: if the sub-flow launched (or switched to) its OWN browser and
        // the flow errored/timed out, close that child session. Leaving it open
        // orphans it (the parent only knows its own browserId), and a later
        // close_browser with a stale id could close the WRONG live session.
        if (subflowState?.browserId && subflowState.browserId !== incomingBrowserId) {
            const orphanId = subflowState.browserId;
            console.log(`[Component] Closing orphaned sub-flow browser ${orphanId} after error.`);
            try {
                await browserService.delete(orphanId);
            } catch (closeErr) {
                console.warn(
                    `[Component] Failed to close orphaned browser ${orphanId}:`,
                    closeErr.message,
                );
            }
        }
        emitLog({
            message: `Error in subflow: ${error.message}`,
            type: 'error',
            nodeId: req.body.nodeId,
        });

        const { configuration: cfg, nodeId: nid, label: lbl, runId: rid } = req.body;
        const errLabel = lbl || cfg?.label || nid || 'Component';
        const errorPayload = {
            status: 'error',
            data: { label: errLabel, flowId: cfg?.flowId || req.body.flowId },
            error: { message: error.message, code: 'COMPONENT_EXECUTION_ERROR' },
        };

        try {
            if (nid) variableManager.set(`${nid}.result`, errorPayload, rid || null);
            if (errLabel) variableManager.set(`${errLabel}.result`, errorPayload, rid || null);
        } catch (_) {
            /* non-fatal */
        }

        return res.status(200).json({
            success: false,
            status: 'error',
            message: 'Error executing subflow',
            error: { message: error.message, code: 'COMPONENT_EXECUTION_ERROR' },
            data: errorPayload,
        });
    }
};

export default componentAction;
