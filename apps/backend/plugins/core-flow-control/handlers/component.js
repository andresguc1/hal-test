import { Flow, Node, Edge } from '../../../database/init.js';
import { emitLog, emitExecutionStatus } from '../../../socket.js';
import { variableManager } from '../../../services/VariableManager.js';

const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

const componentAction = async (req, res) => {
    try {
        const { configuration, nodeId, label, runId } = req.body;
        const nodeLabel = label || configuration?.label || nodeId || 'Component';
        const flowId = configuration?.flowId || req.body.flowId;

        if (!flowId) {
            return res.status(400).json({
                success: false,
                message: 'Missing flowId for component execution',
            });
        }

        emitLog({
            message: `Entering subflow: ${flowId}`,
            type: 'info',
            nodeId,
        });

        const subflow = await Flow.findByPk(flowId, {
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!subflow) {
            throw new Error(`Subflow not found: ${flowId}`);
        }

        const { ExecutionService } = await import('../../../services/ExecutionService.js');
        const executionService = new ExecutionService();

        if (configuration && typeof configuration === 'object') {
            Object.entries(configuration).forEach(([key, val]) => {
                if (
                    !['flowId', 'label', 'inputMapping', 'outputMapping', 'subNodes'].includes(key)
                ) {
                    const resolvedVal =
                        typeof val === 'string' ? variableManager.resolve(val, runId) : val;
                    variableManager.set(key, resolvedVal, runId);
                }
            });
        }

        const inputMapping = configuration?.inputMapping || [];
        if (Array.isArray(inputMapping)) {
            for (const mapping of inputMapping) {
                if (mapping.parentVar && mapping.childVar) {
                    const val = variableManager.resolveValue(mapping.parentVar, runId);
                    variableManager.set(mapping.childVar, val, runId);
                }
            }
        }

        const initialResult = {
            success: true,
            status: 'running',
            message: `Subflow "${nodeLabel}" is currently executing...`,
            data: { status: true, success: true, label: nodeLabel },
        };
        variableManager.set(`${nodeId}.result`, initialResult, runId);
        variableManager.set(`${nodeLabel}.result`, initialResult, runId);
        variableManager.set(nodeId, initialResult, runId);
        variableManager.set(nodeLabel, initialResult, runId);
        console.log(`[Component] Pre-initialized variables for: "${nodeLabel}" (ID: ${nodeId})`);

        console.log(`[Component] Subflow "${subflow.name}" has ${subflow.nodes.length} nodes.`);
        const allNodes = subflow.nodes.map((n) => {
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
        const allEdges = subflow.edges.map((e) => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
        }));

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

        const subflowState = {
            runId: runId || `subrun_${Date.now()}`,
            browserId: req.body.browserId,
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(entryNodes.flatMap((n) => [n.nodeId, n.id]).filter(Boolean)),
            edgeStates: {},
            variables: {},
            overrides: {},
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
        );

        if (subflowState.variables) {
            Object.entries(subflowState.variables).forEach(([key, val]) => {
                variableManager.set(key, val, runId);
            });
        }

        const outputMapping = configuration?.outputMapping || [];
        if (Array.isArray(outputMapping)) {
            for (const mapping of outputMapping) {
                if (mapping.childVar && mapping.parentVar) {
                    const val = variableManager.get(mapping.childVar, runId);
                    variableManager.set(mapping.parentVar, val, runId);
                }
            }
        }

        const subflowOutputs = {};
        const outputNodes = allNodes.filter((n) => n.type === 'output');

        outputNodes.forEach((outNode) => {
            const outLabel = outNode.data?.customLabel || outNode.data?.label || outNode.nodeId;
            const outVal =
                variableManager.get(`${outNode.nodeId}.result`, runId) ||
                variableManager.get(`${outLabel}.result`, runId);

            if (outVal !== undefined && outVal !== null) {
                subflowOutputs[outLabel] = outVal.data !== undefined ? outVal.data : outVal;
            } else {
                console.warn(`[Component] Output node "${outLabel}" produced no data.`);
            }
        });

        const missingMappings = outputMapping.filter(
            (m) => variableManager.get(m.childVar, runId) === undefined,
        );
        if (missingMappings.length > 0) {
            smartEmitLog(
                `[Warning] Some output mappings are missing data: ${missingMappings.map((m) => m.childVar).join(', ')}`,
                'warning',
                nodeId,
            );
        }

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
            message: `Completed subflow: ${flowId} (${subflowState.executedNodeIds.size} nodes executed)`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            status: 'success',
            message: `Subflow ${flowId} executed successfully`,
            data: structuredResult,
        });
    } catch (error) {
        console.error('[ERROR] componentAction:', error.message);
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
