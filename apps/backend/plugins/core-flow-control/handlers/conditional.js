import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';

const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

const conditionalAction = async (req, res) => {
    try {
        const {
            conditions,
            logic: bodyLogic = 'AND',
            branches: bodyBranches,
            runId: bodyRunId,
            variables,
            configuration,
        } = req.body;

        const branches = configuration?.branches || bodyBranches || [];
        const logic = configuration?.logic || bodyLogic;
        const runId = bodyRunId || 'global';
        const debugMode = req.body.debugMode || configuration?.debugMode || false;

        console.log(`[Conditional] Starting evaluation for node: ${req.body.nodeId || 'unknown'}`);

        if (variables && typeof variables === 'object') {
            console.log(
                `[Conditional] Seeding ${Object.keys(variables).length} variables into runId: ${runId}`,
            );
            Object.entries(variables).forEach(([k, v]) => {
                variableManager.set(k, v, runId);
            });
        }

        const allVars = variableManager.getAll(runId);
        const varKeys = Object.keys(allVars);
        console.log(
            `[Conditional] Available variables (${varKeys.length}):`,
            varKeys.slice(0, 10).join(', ') + (varKeys.length > 10 ? '...' : ''),
        );

        if (branches && Array.isArray(branches)) {
            branches.forEach((branch, idx) => {
                try {
                    if (branch.expression && typeof branch.expression === 'object') {
                        const { left, right } = branch.expression;
                        const valL = variableManager.resolveValue(left, runId);
                        const valR = variableManager.resolveValue(right, runId);
                        console.log(
                            `[Conditional][Branch ${idx}] Data Check: "${left}" -> ${JSON.stringify(valL)} | "${right}" -> ${JSON.stringify(valR)}`,
                        );
                    }
                } catch (e) {
                    console.log(`[Conditional] Diagnostic skip for branch ${idx}: ${e.message}`);
                }
            });
        }

        if (debugMode) {
            smartEmitLog(
                `[Conditional] Starting evaluation (Logic: ${logic}, Branches: ${branches?.length || 0})`,
                'info',
                req.body.nodeId,
            );
        }

        if (branches && Array.isArray(branches) && branches.length > 0) {
            let matchedBranch = null;
            const trace = {};

            for (const branch of branches) {
                if (branch.isFallback || branch.id === 'false' || branch.id === 'Else') continue;

                let branchMatched = false;
                let rL = undefined;
                let rR = undefined;
                try {
                    const expr = branch.expression || {};
                    rL = variableManager.resolveValue(expr.left, runId);
                    rR = variableManager.resolveValue(expr.right, runId);

                    let exprResult = false;
                    if (typeof branch.expression === 'string') {
                        exprResult = variableManager.evaluate(branch.expression, runId, {}, true);
                    } else {
                        exprResult = variableManager.evaluateStructured(
                            branch.expression,
                            runId,
                            true,
                        );
                    }

                    branchMatched =
                        !branch.expression ||
                        Object.keys(branch.expression).length === 0 ||
                        exprResult === true;

                    const logLabel = branch.label || branch.id;
                    const comparison = branch.expression
                        ? `Comparing [${expr.left || '?'}] (${JSON.stringify(rL)}) with [${expr.right || '?'}] (${JSON.stringify(rR)})`
                        : 'Default Catch-all (No expression)';
                    const statusIcon = branchMatched ? 'MATCH' : 'NO MATCH';

                    smartEmitLog(
                        `[Conditional] Branch "${logLabel}": ${comparison} -> ${statusIcon}`,
                        'info',
                        req.body.nodeId,
                    );
                } catch (e) {
                    smartEmitLog(
                        `[Conditional] Error evaluating branch "${branch.label}": ${e.message}`,
                        'error',
                        req.body.nodeId,
                    );
                    trace[branch.id || branch.label] = {
                        matched: false,
                        status: 'error',
                        error: e.message,
                        resolvedLeft: rL,
                        resolvedRight: rR,
                    };
                }

                if (!trace[branch.id || branch.label]) {
                    trace[branch.id || branch.label] = {
                        matched: branchMatched,
                        status: branchMatched ? 'matched' : 'not_matched',
                        resolvedLeft: rL,
                        resolvedRight: rR,
                    };
                }

                if (branchMatched) {
                    matchedBranch = branch;
                    break;
                }
            }

            for (const branch of branches) {
                const bId = branch.id || branch.label;
                if (!trace[bId]) {
                    trace[bId] = { matched: false, status: 'skipped' };
                }
            }

            const requestedFallback =
                configuration?.fallbackPath || req.body.fallbackPath || 'false';

            if (!matchedBranch) {
                matchedBranch = branches.find(
                    (b) =>
                        b.isFallback ||
                        b.id === 'false' ||
                        b.id === 'Else' ||
                        (!b.expression && b.id !== requestedFallback),
                );
                if (matchedBranch) {
                    smartEmitLog(
                        `[Conditional] No matches found. Routing to Fallback: "${matchedBranch.label || requestedFallback}"`,
                        'info',
                        req.body.nodeId,
                    );
                    const bId = matchedBranch.id || matchedBranch.label;
                    trace[bId] = { matched: true, status: 'matched' };
                }
            }

            const finalPath = matchedBranch
                ? matchedBranch.id || matchedBranch.label
                : requestedFallback;
            const finalResult = !!matchedBranch;

            smartEmitLog(
                `[Conditional] Final Decision: ${matchedBranch?.label || finalPath}`,
                'success',
                req.body.nodeId,
            );

            return res.json({
                success: true,
                data: {
                    result: finalResult,
                    path: finalPath,
                    branchLabel: matchedBranch?.label,
                    trace,
                },
            });
        }

        const result = variableManager.evaluateConditions(conditions, logic, runId);

        return res.status(200).json({
            success: true,
            status: result ? 'true' : 'false',
            message: req.t('actions.conditional.success'),
            data: {
                result,
                path: result ? 'true' : 'false',
                conditions,
                logic,
            },
        });
    } catch (error) {
        console.error('[ERROR] conditionalAction:', error.message);

        const continueOnFailure =
            req.body.configuration?.continueOnFailure || req.body.continueOnFailure || false;
        if (continueOnFailure) {
            smartEmitLog(
                `[Conditional] Soft Fail: Routing to "Else" due to error: ${error.message}`,
                'warning',
                req.body.nodeId,
            );
            return res.json({
                success: true,
                data: {
                    result: false,
                    path: 'Else',
                    error: error.message,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: req.t('actions.conditional.error'),
            error: error.message,
        });
    }
};

export default conditionalAction;
