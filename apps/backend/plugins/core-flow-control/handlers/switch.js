import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { normalizeValue } from '../../../core/compare.js';

const smartEmitLog = (message, type = 'info', nodeId = null) => {
    emitLog({ message, type, nodeId });
};

const switchAction = async (req, res) => {
    try {
        const {
            variableName: bodyVariableName,
            cases: bodyCases,
            runId: bodyRunId,
            variables,
            configuration,
            nodeId,
        } = req.body;

        const variableName = configuration?.variableName || bodyVariableName;
        const cases = configuration?.cases || bodyCases || [];
        const comparisonType = configuration?.comparisonType || 'equals';
        const runId = bodyRunId || 'global';

        console.log(
            `[Switch] Starting evaluation for node: ${nodeId || 'unknown'} (comparison: ${comparisonType})`,
        );

        if (variables && typeof variables === 'object') {
            console.log(
                `[Switch] Seeding ${Object.keys(variables).length} variables into runId: ${runId}`,
            );
            Object.entries(variables).forEach(([k, v]) => {
                variableManager.set(k, v, runId);
            });
        }

        let resolvedValue = variableManager.resolveValue(variableName, runId);

        const isUnres = (v) => typeof v === 'string' && (v.includes('{{') || v.includes('${'));
        if (isUnres(resolvedValue)) {
            console.warn(`[Switch] Expression "${variableName}" unresolved: ${resolvedValue}`);
            smartEmitLog(
                `[Switch] Expression "${variableName}" could not be resolved. Value is undefined.`,
                'warning',
                nodeId,
            );
            resolvedValue = undefined;
        }

        smartEmitLog(
            `[Switch] Evaluating "${variableName}" -> [${JSON.stringify(resolvedValue)}] (${typeof resolvedValue}) using ${comparisonType}`,
            'info',
            nodeId,
        );

        const compare = (resolved, caseVal) => {
            switch (comparisonType) {
                case 'contains':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .includes(String(caseVal ?? '').toLowerCase());
                case 'startsWith':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .startsWith(String(caseVal ?? '').toLowerCase());
                case 'endsWith':
                    return String(resolved ?? '')
                        .toLowerCase()
                        .endsWith(String(caseVal ?? '').toLowerCase());
                case 'regex': {
                    try {
                        const regex = new RegExp(String(caseVal ?? ''), 'i');
                        return regex.test(String(resolved ?? ''));
                    } catch (regexErr) {
                        console.warn(
                            `[Switch] Invalid regex pattern "${caseVal}": ${regexErr.message}`,
                        );
                        return false;
                    }
                }
                case 'equals':
                default:
                    return normalizeValue(resolved) === normalizeValue(caseVal);
            }
        };

        let matchedCase = null;
        const trace = {};

        let normalizedCases = cases;
        if (cases && typeof cases === 'object' && !Array.isArray(cases)) {
            normalizedCases = Object.entries(cases).map(([val, pathId]) => ({
                id: pathId,
                value: val,
                label: val,
            }));
        }

        if (Array.isArray(normalizedCases)) {
            for (const c of normalizedCases) {
                if (c.value === 'default') continue;
                const rawCaseValue = variableManager.resolveValue(c.value, runId);
                const isMatch = compare(resolvedValue, rawCaseValue);

                trace[c.id] = {
                    value: c.value,
                    resolvedCaseValue: rawCaseValue,
                    normalizedResolved: normalizeValue(resolvedValue),
                    normalizedCase: normalizeValue(rawCaseValue),
                    comparisonType,
                    matched: isMatch,
                };

                const logLabel = c.label || c.value || c.id;
                smartEmitLog(
                    `[Switch] Case "${logLabel}": ${comparisonType}([${JSON.stringify(resolvedValue)}], [${JSON.stringify(rawCaseValue)}]) -> ${isMatch ? 'MATCH' : 'NO'}`,
                    'info',
                    nodeId,
                );

                if (isMatch) {
                    matchedCase = c;
                    break;
                }
            }
        }

        let finalPath = matchedCase ? matchedCase.id : 'default';
        if (
            !matchedCase &&
            cases &&
            typeof cases === 'object' &&
            !Array.isArray(cases) &&
            cases.default
        ) {
            finalPath = cases.default;
        }

        smartEmitLog(
            `[Switch] Final Decision: ${matchedCase ? matchedCase.label || matchedCase.id : 'Default'} (path: ${finalPath})`,
            'success',
            nodeId,
        );

        return res.json({
            success: true,
            path: finalPath,
            data: {
                resolvedValue,
                path: finalPath,
                targetPath: finalPath,
                matchedCaseId: matchedCase?.id || null,
                matchedCaseLabel: matchedCase?.label || null,
                comparisonType,
                trace,
            },
        });
    } catch (error) {
        console.error('[ERROR] switchAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error executing switch action',
            error: error.message,
        });
    }
};

export default switchAction;
