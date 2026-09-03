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

        if (debugMode) {
            smartEmitLog(
                `[Conditional] Starting evaluation for node: ${req.body.nodeId || 'unknown'}`,
                'info',
                req.body.nodeId,
            );
        }

        if (variables && typeof variables === 'object') {
            Object.entries(variables).forEach(([k, v]) => {
                variableManager.set(k, v, runId);
            });
            if (debugMode) {
                smartEmitLog(
                    `[Conditional] Seeded ${Object.keys(variables).length} variables into runId: ${runId}`,
                    'info',
                    req.body.nodeId,
                );
            }
        }

        if (branches && Array.isArray(branches)) {
            branches.forEach((branch, idx) => {
                try {
                    if (branch.expression && typeof branch.expression === 'object') {
                        const { left, right } = branch.expression;
                        const valL = variableManager.resolveValue(left, runId);
                        const valR = variableManager.resolveValue(right, runId);
                        if (debugMode) {
                            smartEmitLog(
                                `[Conditional][Branch ${idx}] Data Check: "${left}" -> ${JSON.stringify(valL)} | "${right}" -> ${JSON.stringify(valR)}`,
                                'debug',
                                req.body.nodeId,
                            );
                        }
                    }
                } catch (e) {
                    if (debugMode) {
                        smartEmitLog(
                            `[Conditional] Diagnostic skip for branch ${idx}: ${e.message}`,
                            'debug',
                            req.body.nodeId,
                        );
                    }
                }
            });
        }

        if (debugMode) {
            const allVars = variableManager.getAll(runId);
            const varKeys = Object.keys(allVars);
            smartEmitLog(
                `[Conditional] Available variables (${varKeys.length}): ${varKeys.slice(0, 10).join(', ') + (varKeys.length > 10 ? '...' : '')}`,
                'info',
                req.body.nodeId,
            );
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
            const evaluationErrors = [];

            const isEmptyExpression = (expr) => {
                if (expr === null || expr === undefined) return true;
                if (typeof expr === 'string') return expr.trim() === '';
                if (typeof expr === 'object') return Object.keys(expr).length === 0;
                return false;
            };

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
                    if (!isEmptyExpression(branch.expression)) {
                        if (typeof branch.expression === 'string') {
                            exprResult = variableManager.evaluate(
                                branch.expression,
                                runId,
                                {},
                                true,
                            );
                        } else {
                            exprResult = variableManager.evaluateStructured(
                                branch.expression,
                                runId,
                                true,
                            );
                        }
                    }

                    // A branch only matches if it carries a real expression that
                    // evaluates to true. Empty expressions are NOT implicit
                    // catch-alls — only explicit fallback branches route on empty.
                    branchMatched = exprResult === true;

                    const logLabel = branch.label || branch.id;
                    const comparison = isEmptyExpression(branch.expression)
                        ? 'Empty expression (skipped)'
                        : `Comparing [${expr.left || '?'}] (${JSON.stringify(rL)}) with [${expr.right || '?'}] (${JSON.stringify(rR)})`;
                    const statusIcon = branchMatched ? 'MATCH' : 'NO MATCH';

                    smartEmitLog(
                        `[Conditional] Branch "${logLabel}": ${comparison} -> ${statusIcon}`,
                        'info',
                        req.body.nodeId,
                    );
                } catch (e) {
                    evaluationErrors.push({
                        branch: branch.label || branch.id,
                        error: e.message,
                    });
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
                // Only route to EXPLICIT fallback branches (isFallback / 'false' / 'Else').
                // A branch with an empty expression but no fallback marker does NOT
                // act as an implicit catch-all.
                matchedBranch = branches.find(
                    (b) => b.isFallback || b.id === 'false' || b.id === 'Else',
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

            if (evaluationErrors.length > 0) {
                smartEmitLog(
                    `[Conditional] ${evaluationErrors.length} branch(es) failed to evaluate. Routing to: ${matchedBranch?.label || finalPath}`,
                    'warning',
                    req.body.nodeId,
                );
            }

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
                    ...(evaluationErrors.length > 0 ? { evaluationErrors } : {}),
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
